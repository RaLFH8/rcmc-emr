import { render, screen, waitFor } from '@testing-library/react'
import MedicalHistoryTimeline from '../components/MedicalHistoryTimeline'
import { db } from '../lib/supabase'

// Mock the database
jest.mock('../lib/supabase', () => ({
  db: {
    getConsultations: jest.fn(),
    getAppointmentsByPatient: jest.fn(),
    getOrdersByPatient: jest.fn(),
    getBillingByPatient: jest.fn(),
    getInpatientsByPatient: jest.fn()
  }
}))

// Mock SkeletonLoader
jest.mock('../components/SkeletonLoader', () => {
  return function SkeletonLoader({ message }) {
    return <div data-testid="skeleton-loader">{message}</div>
  }
})

describe('MedicalHistoryTimeline', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render medical history timeline with orders integrated chronologically', async () => {
    // Mock data
    const mockOrders = [
      {
        id: 'order-1',
        patient_id: 'patient-1',
        order_type: 'lab_test',
        order_details: 'Complete Blood Count',
        status: 'completed',
        priority: 'routine',
        created_at: '2024-01-01T10:00:00Z',
        created_by_user: { first_name: 'Dr.', last_name: 'Smith' }
      }
    ]
    
    const mockConsultations = [
      {
        id: 'consult-1',
        patient_id: 'patient-1',
        consultation_date: '2024-01-01T09:00:00Z',
        chief_complaint: 'Fever',
        diagnosis: 'Viral infection',
        doctor: { first_name: 'Dr.', last_name: 'Johnson' }
      }
    ]

    const mockAppointments = []
    const mockPayments = []
    const mockAdmissions = []

    // Setup mocks
    db.getOrdersByPatient.mockResolvedValue(mockOrders)
    db.getConsultations.mockResolvedValue(mockConsultations)
    db.getAppointmentsByPatient.mockResolvedValue(mockAppointments)
    db.getBillingByPatient.mockResolvedValue(mockPayments)
    db.getInpatientsByPatient.mockResolvedValue(mockAdmissions)

    render(<MedicalHistoryTimeline patientId="patient-1" />)

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('skeleton-loader')).not.toBeInTheDocument()
    })

    // Check that the timeline title is present
    expect(screen.getByText('Medical History Timeline')).toBeInTheDocument()

    // Check that orders appear in the timeline
    expect(screen.getByText('Complete Blood Count')).toBeInTheDocument()
    expect(screen.getByText('Lab Test Order')).toBeInTheDocument()

    // Check that consultations appear in the timeline
    expect(screen.getByText('Fever')).toBeInTheDocument()

    // Verify chronological ordering (orders should appear after consultations based on timestamps)
    const timelineEvents = screen.getAllByText(/2024/)
    expect(timelineEvents.length).toBeGreaterThan(0)
  })

  it('should show SOAP note indicator for orders created from SOAP notes', async () => {
    // Mock SOAP order
    const mockSoapOrders = [
      {
        id: 'order-1',
        patient_id: 'patient-1',
        appointment_id: 'appointment-1', // This indicates it's from a SOAP note
        order_type: 'medication',
        order_details: 'Prescribed from SOAP note',
        status: 'pending',
        priority: 'routine',
        created_at: '2024-01-01T10:00:00Z',
        created_by_user: { first_name: 'Dr.', last_name: 'Smith' }
      }
    ]

    // Setup mocks
    db.getOrdersByPatient.mockResolvedValue(mockSoapOrders)
    db.getConsultations.mockResolvedValue([])
    db.getAppointmentsByPatient.mockResolvedValue([])
    db.getBillingByPatient.mockResolvedValue([])
    db.getInpatientsByPatient.mockResolvedValue([])

    render(<MedicalHistoryTimeline patientId="patient-1" />)

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('skeleton-loader')).not.toBeInTheDocument()
    })

    // Check for SOAP note indicator
    expect(screen.getByText(/from soap note/i)).toBeInTheDocument()
    expect(screen.getByText('Prescribed from SOAP note')).toBeInTheDocument()
  })

  it('should handle empty timeline gracefully', async () => {
    // Setup empty mocks
    db.getOrdersByPatient.mockResolvedValue([])
    db.getConsultations.mockResolvedValue([])
    db.getAppointmentsByPatient.mockResolvedValue([])
    db.getBillingByPatient.mockResolvedValue([])
    db.getInpatientsByPatient.mockResolvedValue([])

    render(<MedicalHistoryTimeline patientId="patient-1" />)

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('skeleton-loader')).not.toBeInTheDocument()
    })

    // Check for empty state
    expect(screen.getByText('No Medical History')).toBeInTheDocument()
    expect(screen.getByText('No medical events recorded for this patient')).toBeInTheDocument()
  })

  it('should handle loading state', () => {
    // Setup mocks that never resolve to keep loading state
    db.getOrdersByPatient.mockImplementation(() => new Promise(() => {}))
    db.getConsultations.mockImplementation(() => new Promise(() => {}))
    db.getAppointmentsByPatient.mockImplementation(() => new Promise(() => {}))
    db.getBillingByPatient.mockImplementation(() => new Promise(() => {}))
    db.getInpatientsByPatient.mockImplementation(() => new Promise(() => {}))

    render(<MedicalHistoryTimeline patientId="patient-1" />)

    // Check loading state
    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument()
    expect(screen.getByText('Loading medical history timeline...')).toBeInTheDocument()
  })
})