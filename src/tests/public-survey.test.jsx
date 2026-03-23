/**
 * Public Survey Component Tests
 * 
 * Basic integration tests for the PublicSurvey component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PublicSurvey from '../pages/PublicSurvey'
import * as dbModule from '../lib/supabase'
import * as rateLimiterModule from '../services/rateLimiter'

// Mock the database module
vi.mock('../lib/supabase', () => ({
  db: {
    getDoctors: vi.fn(),
    submitSurvey: vi.fn()
  }
}))

// Mock the rate limiter module
vi.mock('../services/rateLimiter', () => ({
  checkRateLimit: vi.fn()
}))

describe('PublicSurvey Component', () => {
  const mockDoctors = [
    {
      id: 'doctor-1',
      first_name: 'John',
      last_name: 'Doe',
      specialization: 'General Practice'
    },
    {
      id: 'doctor-2',
      first_name: 'Jane',
      last_name: 'Smith',
      specialization: 'Pediatrics'
    }
  ]

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()
    
    // Setup default mock implementations
    dbModule.db.getDoctors.mockResolvedValue(mockDoctors)
    dbModule.db.submitSurvey.mockResolvedValue({ id: 'survey-1' })
    rateLimiterModule.checkRateLimit.mockResolvedValue({
      allowed: true,
      fingerprint: 'test-fingerprint',
      ipAddress: '127.0.0.1'
    })
  })

  it('renders the survey form with all required elements', async () => {
    render(<PublicSurvey />)

    // Wait for doctors to load
    await waitFor(() => {
      expect(screen.getByText('RIZALCARE MEDICAL CLINIC')).toBeInTheDocument()
    })

    // Check for form elements
    expect(screen.getByLabelText(/Select Doctor/i)).toBeInTheDocument()
    expect(screen.getByText('Doctor Professionalism')).toBeInTheDocument()
    expect(screen.getByText('Waiting Time')).toBeInTheDocument()
    expect(screen.getByText('Facility Cleanliness')).toBeInTheDocument()
    expect(screen.getByLabelText(/How can we improve/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Submit Feedback/i })).toBeInTheDocument()
  })

  it('loads and displays doctors in the dropdown', async () => {
    render(<PublicSurvey />)

    await waitFor(() => {
      expect(dbModule.db.getDoctors).toHaveBeenCalled()
    })

    const doctorSelect = screen.getByLabelText(/Select Doctor/i)
    expect(doctorSelect).toBeInTheDocument()
    
    // Check that doctors are in the dropdown
    await waitFor(() => {
      expect(screen.getByText(/Dr. John Doe/i)).toBeInTheDocument()
      expect(screen.getByText(/Dr. Jane Smith/i)).toBeInTheDocument()
    })
  })

  it('disables submit button when form is invalid', async () => {
    render(<PublicSurvey />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Submit Feedback/i })).toBeInTheDocument()
    })

    const submitButton = screen.getByRole('button', { name: /Submit Feedback/i })
    expect(submitButton).toBeDisabled()
  })

  it('enables submit button when doctor and at least one rating are provided', async () => {
    const user = userEvent.setup()
    render(<PublicSurvey />)

    await waitFor(() => {
      expect(screen.getByLabelText(/Select Doctor/i)).toBeInTheDocument()
    })

    // Select a doctor
    const doctorSelect = screen.getByLabelText(/Select Doctor/i)
    await user.selectOptions(doctorSelect, 'doctor-1')

    // Click a star rating (we need to find the star buttons)
    const starButtons = screen.getAllByRole('button')
    const firstStarButton = starButtons.find(btn => btn.querySelector('svg'))
    if (firstStarButton) {
      await user.click(firstStarButton)
    }

    // Submit button should now be enabled
    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /Submit Feedback/i })
      expect(submitButton).not.toBeDisabled()
    })
  })

  it('displays character counter for comments', async () => {
    render(<PublicSurvey />)

    await waitFor(() => {
      expect(screen.getByText(/1000 characters remaining/i)).toBeInTheDocument()
    })
  })

  it('updates character counter as user types', async () => {
    const user = userEvent.setup()
    render(<PublicSurvey />)

    await waitFor(() => {
      expect(screen.getByLabelText(/How can we improve/i)).toBeInTheDocument()
    })

    const textarea = screen.getByLabelText(/How can we improve/i)
    await user.type(textarea, 'Great service!')

    await waitFor(() => {
      expect(screen.getByText(/986 characters remaining/i)).toBeInTheDocument()
    })
  })

  it('shows error message when rate limit is exceeded', async () => {
    const user = userEvent.setup()
    
    // Mock rate limit exceeded
    rateLimiterModule.checkRateLimit.mockResolvedValue({
      allowed: false,
      fingerprint: 'test-fingerprint',
      ipAddress: '127.0.0.1',
      lastSubmission: new Date().toISOString()
    })

    render(<PublicSurvey />)

    await waitFor(() => {
      expect(screen.getByLabelText(/Select Doctor/i)).toBeInTheDocument()
    })

    // Fill out form
    const doctorSelect = screen.getByLabelText(/Select Doctor/i)
    await user.selectOptions(doctorSelect, 'doctor-1')

    // Click a star rating
    const starButtons = screen.getAllByRole('button')
    const firstStarButton = starButtons.find(btn => btn.querySelector('svg'))
    if (firstStarButton) {
      await user.click(firstStarButton)
    }

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Submit Feedback/i })
    await user.click(submitButton)

    // Check for rate limit error message
    await waitFor(() => {
      expect(screen.getByText(/already submitted feedback today/i)).toBeInTheDocument()
    })
  })

  it('displays success message after successful submission', async () => {
    const user = userEvent.setup()
    render(<PublicSurvey />)

    await waitFor(() => {
      expect(screen.getByLabelText(/Select Doctor/i)).toBeInTheDocument()
    })

    // Fill out form
    const doctorSelect = screen.getByLabelText(/Select Doctor/i)
    await user.selectOptions(doctorSelect, 'doctor-1')

    // Click a star rating
    const starButtons = screen.getAllByRole('button')
    const firstStarButton = starButtons.find(btn => btn.querySelector('svg'))
    if (firstStarButton) {
      await user.click(firstStarButton)
    }

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Submit Feedback/i })
    await user.click(submitButton)

    // Check for success message
    await waitFor(() => {
      expect(screen.getByText(/Thank You!/i)).toBeInTheDocument()
      expect(screen.getByText(/feedback has been submitted successfully/i)).toBeInTheDocument()
    })
  })

  it('pre-fills doctor selection from URL parameter', async () => {
    // Mock URL with doctor parameter
    delete window.location
    window.location = new URL('http://localhost:3000/survey?doc=doctor-1')

    render(<PublicSurvey />)

    await waitFor(() => {
      expect(dbModule.db.getDoctors).toHaveBeenCalled()
    })

    // Check that doctor is pre-selected
    await waitFor(() => {
      const doctorSelect = screen.getByLabelText(/Select Doctor/i)
      expect(doctorSelect.value).toBe('doctor-1')
    })
  })
})
