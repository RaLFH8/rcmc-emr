/**
 * Task 3.6: SOAP Orders Timeline Integration Test
 * 
 * This test verifies that orders created from SOAP notes are properly
 * linked to the patient timeline and maintain their connection to the
 * originating consultation.
 */

import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import MedicalHistoryTimeline from '../components/MedicalHistoryTimeline'

// Mock the database
const mockDb = {
  getConsultations: vi.fn(),
  getAppointmentsByPatient: vi.fn(),
  getOrdersByPatient: vi.fn(),
  getBillingByPatient: vi.fn(),
  getInpatientsByPatient: vi.fn()
}

vi.mock('../lib/supabase', () => ({
  db: mockDb
}))

describe('Task 3.6: SOAP Orders Timeline Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mock responses
    mockDb.getConsultations.mockResolvedValue([])
    mockDb.getAppointmentsByPatient.mockResolvedValue([])
    mockDb.getOrdersByPatient.mockResolvedValue([])
    mockDb.getBillingByPatient.mockResolvedValue([])
    mockDb.getInpatientsByPatient.mockResolvedValue([])
  })

  it('should link orders created from SOAP notes to patient timeline', async () => {
    const mockConsultation = {
      id: 'consultation-1',
      appointment_id: 'appointment-1',
      consultation_date: '2024-01-15T10:00:00Z',
      chief_complaint: 'Chest pain',
      diagnosis: 'Angina pectoris',
      patient_id: 'patient-1'
    }

    const mockSoapOrder = {
      id: 'order-1',
      patient_id: 'patient-1',
      appointment_id: 'appointment-1', // Links to SOAP consultation
      order_type: 'lab_test',
      order_details: 'ECG and cardiac enzymes',
      status: 'pending',
      priority: 'urgent',
      created_at: '2024-01-15T10:30:00Z',
      created_by_user: {
        first_name: 'Dr. John',
        last_name: 'Smith'
      }
    }

    mockDb.getConsultations.mockResolvedValue([mockConsultation])
    mockDb.getOrdersByPatient.mockResolvedValue([mockSoapOrder])

    render(<MedicalHistoryTimeline patientId="patient-1" />)

    await waitFor(() => {
      // Verify order appears in timeline
      expect(screen.getByText('Lab Test Order')).toBeInTheDocument()
      expect(screen.getByText('ECG and cardiac enzymes')).toBeInTheDocument()
    })

    // Verify SOAP note indicator
    expect(screen.getByText('📋 From SOAP Note')).toBeInTheDocument()

    // Verify connection to originating consultation
    expect(screen.getByText('🔗 Originating Consultation')).toBeInTheDocument()
    expect(screen.getByText('Chest pain')).toBeInTheDocument()
    expect(screen.getByText('Angina pectoris')).toBeInTheDocument()
  })

  it('should ensure proper chronological placement of SOAP orders', async () => {
    const mockConsultation = {
      id: 'consultation-1',
      appointment_id: 'appointment-1',
      consultation_date: '2024-01-15T10:00:00Z',
      chief_complaint: 'Follow-up visit',
      diagnosis: 'Hypertension',
      patient_id: 'patient-1'
    }

    const mockSoapOrder = {
      id: 'order-1',
      patient_id: 'patient-1',
      appointment_id: 'appointment-1',
      order_type: 'medication',
      order_details: 'Lisinopril 10mg daily',
      status: 'pending',
      priority: 'routine',
      created_at: '2024-01-15T10:15:00Z',
      created_by_user: {
        first_name: 'Dr. Jane',
        last_name: 'Doe'
      }
    }

    const mockRegularOrder = {
      id: 'order-2',
      patient_id: 'patient-1',
      appointment_id: null, // Not from SOAP
      order_type: 'lab_test',
      order_details: 'Complete Blood Count',
      status: 'completed',
      priority: 'routine',
      created_at: '2024-01-15T11:00:00Z',
      created_by_user: {
        first_name: 'Dr. Jane',
        last_name: 'Doe'
      }
    }

    mockDb.getConsultations.mockResolvedValue([mockConsultation])
    mockDb.getOrdersByPatient.mockResolvedValue([mockSoapOrder, mockRegularOrder])

    render(<MedicalHistoryTimeline patientId="patient-1" />)

    await waitFor(() => {
      // Both orders should appear
      expect(screen.getByText('Medication Order')).toBeInTheDocument()
      expect(screen.getByText('Lab Test Order')).toBeInTheDocument()
    })

    // Verify chronological order (newer first)
    const timelineEvents = screen.getAllByText(/Order/)
    expect(timelineEvents[0]).toHaveTextContent('Lab Test Order') // 11:00 - newer
    expect(timelineEvents[1]).toHaveTextContent('Medication Order') // 10:15 - older

    // Verify only SOAP order has the indicator
    expect(screen.getByText('📋 From SOAP Note')).toBeInTheDocument()
    expect(screen.getByText('🔗 Originating Consultation')).toBeInTheDocument()
  })

  it('should maintain connection to originating consultation with complete details', async () => {
    const mockConsultation = {
      id: 'consultation-1',
      appointment_id: 'appointment-1',
      consultation_date: '2024-01-15T14:30:00Z',
      chief_complaint: 'Severe headache',
      diagnosis: 'Migraine with aura',
      prescription: 'Sumatriptan 50mg as needed',
      patient_id: 'patient-1'
    }

    const mockSoapOrder = {
      id: 'order-1',
      patient_id: 'patient-1',
      appointment_id: 'appointment-1',
      order_type: 'procedure',
      order_details: 'MRI brain without contrast',
      status: 'pending',
      priority: 'stat',
      created_at: '2024-01-15T14:45:00Z',
      created_by_user: {
        first_name: 'Dr. Sarah',
        last_name: 'Johnson'
      }
    }

    mockDb.getConsultations.mockResolvedValue([mockConsultation])
    mockDb.getOrdersByPatient.mockResolvedValue([mockSoapOrder])

    render(<MedicalHistoryTimeline patientId="patient-1" />)

    await waitFor(() => {
      // Verify order details
      expect(screen.getByText('Procedure Order')).toBeInTheDocument()
      expect(screen.getByText('MRI brain without contrast')).toBeInTheDocument()
      expect(screen.getByText('STAT - PENDING')).toBeInTheDocument()
    })

    // Verify complete consultation connection
    expect(screen.getByText('🔗 Originating Consultation')).toBeInTheDocument()
    expect(screen.getByText('Severe headache')).toBeInTheDocument()
    expect(screen.getByText('Migraine with aura')).toBeInTheDocument()
    expect(screen.getByText(/Consultation ID: appointme/)).toBeInTheDocument()
  })

  it('should handle orders without SOAP connection correctly', async () => {
    const mockRegularOrder = {
      id: 'order-1',
      patient_id: 'patient-1',
      appointment_id: null, // Not from SOAP
      order_type: 'diet',
      order_details: 'Low sodium diet',
      status: 'active',
      priority: 'routine',
      created_at: '2024-01-15T09:00:00Z',
      created_by_user: {
        first_name: 'Dr. Mike',
        last_name: 'Wilson'
      }
    }

    mockDb.getOrdersByPatient.mockResolvedValue([mockRegularOrder])

    render(<MedicalHistoryTimeline patientId="patient-1" />)

    await waitFor(() => {
      // Verify order appears
      expect(screen.getByText('Diet Order')).toBeInTheDocument()
      expect(screen.getByText('Low sodium diet')).toBeInTheDocument()
    })

    // Verify NO SOAP indicators for regular orders
    expect(screen.queryByText('📋 From SOAP Note')).not.toBeInTheDocument()
    expect(screen.queryByText('🔗 Originating Consultation')).not.toBeInTheDocument()
  })

  it('should preserve SOAP note order extraction and parsing functionality', async () => {
    // This test ensures that the existing SOAP order functionality continues working
    const mockConsultation = {
      id: 'consultation-1',
      appointment_id: 'appointment-1',
      consultation_date: '2024-01-15T16:00:00Z',
      chief_complaint: 'Diabetes follow-up',
      diagnosis: 'Type 2 diabetes mellitus',
      patient_id: 'patient-1'
    }

    const mockSoapOrders = [
      {
        id: 'order-1',
        patient_id: 'patient-1',
        appointment_id: 'appointment-1',
        order_type: 'lab_test',
        order_details: 'HbA1c, fasting glucose',
        status: 'pending',
        priority: 'routine',
        created_at: '2024-01-15T16:15:00Z',
        created_by_user: { first_name: 'Dr. Lisa', last_name: 'Brown' }
      },
      {
        id: 'order-2',
        patient_id: 'patient-1',
        appointment_id: 'appointment-1',
        order_type: 'medication',
        order_details: 'Metformin 500mg twice daily',
        status: 'pending',
        priority: 'routine',
        created_at: '2024-01-15T16:16:00Z',
        created_by_user: { first_name: 'Dr. Lisa', last_name: 'Brown' }
      }
    ]

    mockDb.getConsultations.mockResolvedValue([mockConsultation])
    mockDb.getOrdersByPatient.mockResolvedValue(mockSoapOrders)

    render(<MedicalHistoryTimeline patientId="patient-1" />)

    await waitFor(() => {
      // Verify both SOAP orders appear
      expect(screen.getByText('Lab Test Order')).toBeInTheDocument()
      expect(screen.getByText('Medication Order')).toBeInTheDocument()
      expect(screen.getByText('HbA1c, fasting glucose')).toBeInTheDocument()
      expect(screen.getByText('Metformin 500mg twice daily')).toBeInTheDocument()
    })

    // Verify both have SOAP indicators
    const soapIndicators = screen.getAllByText('📋 From SOAP Note')
    expect(soapIndicators).toHaveLength(2)

    // Verify both show consultation connection
    const consultationConnections = screen.getAllByText('🔗 Originating Consultation')
    expect(consultationConnections).toHaveLength(2)
  })
})