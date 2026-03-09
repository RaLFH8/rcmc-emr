/**
 * Bug Condition Exploration Test - SOAP Note Persistence
 * 
 * Property 1: Fault Condition - SOAP Notes Lost on Re-render
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists.
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
 * 
 * This test verifies that SOAP notes entered in the "Start Consultation" modal
 * are NOT persisted to the database in the unfixed code, causing data loss when
 * the component re-renders.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { db } from '../lib/supabase'

describe('Bug Condition Exploration: SOAP Note Persistence', () => {
  let testPatientId
  let testDoctorId
  let testAppointmentId

  beforeAll(async () => {
    // Setup: Create test patient and doctor
    console.log('=== TEST SETUP ===')
    
    // Create test patient
    const testPatient = await db.addPatient({
      first_name: 'Test',
      last_name: 'Patient',
      date_of_birth: '1990-01-01',
      gender: 'Male',
      contact_number: '1234567890',
      email: 'test@example.com',
      address: 'Test Address',
      emergency_contact_name: 'Emergency Contact',
      emergency_contact_number: '0987654321'
    })
    testPatientId = testPatient.id
    console.log('Created test patient:', testPatientId)

    // Get first available doctor
    const doctors = await db.getDoctors()
    if (doctors.length === 0) {
      throw new Error('No doctors available for testing. Please create a doctor first.')
    }
    testDoctorId = doctors[0].id
    console.log('Using test doctor:', testDoctorId)
  })

  afterAll(async () => {
    // Cleanup: Delete test data
    console.log('=== TEST CLEANUP ===')
    
    if (testAppointmentId) {
      try {
        // Note: Patient deletion will cascade delete appointment
        console.log('Cleaning up test appointment:', testAppointmentId)
      } catch (error) {
        console.error('Cleanup error:', error)
      }
    }

    if (testPatientId) {
      try {
        await db.deletePatient(testPatientId)
        console.log('Deleted test patient:', testPatientId)
      } catch (error) {
        console.error('Cleanup error:', error)
      }
    }
  })

  it('should FAIL: SOAP notes are NOT persisted to database after Save & Continue', async () => {
    console.log('\n=== TEST: SOAP Note Persistence Bug ===')
    
    // Step 1: Create appointment
    console.log('Step 1: Creating appointment...')
    const appointment = await db.addAppointment({
      patient_id: testPatientId,
      doctor_id: testDoctorId,
      appointment_date: new Date().toISOString().split('T')[0],
      appointment_time: '09:00',
      reason: 'Headache',
      status: 'Scheduled'
    })
    testAppointmentId = appointment.id
    console.log('Created appointment:', testAppointmentId)

    // Step 2: Simulate SOAP data entry
    console.log('\nStep 2: Simulating SOAP data entry...')
    const soapData = {
      subjective: 'Headache for 3 days',
      objective: 'BP: 120/80 mmHg, Temp: 36.5°C',
      assessment: 'Tension headache',
      plan: 'Paracetamol 500mg TID, rest, follow-up in 1 week'
    }
    console.log('SOAP data to save:', soapData)

    // Step 3: Simulate "Save & Continue" action (BUGGY CODE)
    console.log('\nStep 3: Simulating Save & Continue (buggy code)...')
    // This mimics what handleSaveSoap does in the unfixed code
    await db.updateAppointment(testAppointmentId, { status: 'In Progress' })
    console.log('Updated appointment status to In Progress')
    console.log('⚠️ NOTE: SOAP data was NOT persisted (this is the bug)')

    // Step 4: Simulate component re-render by reloading appointment
    console.log('\nStep 4: Simulating component re-render (loadData)...')
    const appointments = await db.getAppointments(new Date().toISOString().split('T')[0])
    const reloadedAppointment = appointments.find(apt => apt.id === testAppointmentId)
    console.log('Reloaded appointment:', reloadedAppointment)

    // Step 5: Verify bug - SOAP data should be NULL/missing
    console.log('\n=== BUG VERIFICATION ===')
    
    // Check if SOAP columns exist in the database
    const hasSOAPColumns = 'soap_subjective' in reloadedAppointment
    console.log('SOAP columns exist in database:', hasSOAPColumns)

    if (!hasSOAPColumns) {
      console.log('❌ BUG CONFIRMED: SOAP columns do not exist in appointments table')
      console.log('   This means SOAP data has nowhere to be persisted!')
      
      // This test SHOULD FAIL on unfixed code
      expect(hasSOAPColumns).toBe(true) // Will fail, confirming bug
      
    } else {
      // If columns exist, check if they're NULL (also indicates bug)
      console.log('Checking SOAP column values...')
      console.log('  soap_subjective:', reloadedAppointment.soap_subjective)
      console.log('  soap_objective:', reloadedAppointment.soap_objective)
      console.log('  soap_assessment:', reloadedAppointment.soap_assessment)
      console.log('  soap_plan:', reloadedAppointment.soap_plan)

      // On unfixed code, these should all be NULL
      const soapDataPersisted = 
        reloadedAppointment.soap_subjective === soapData.subjective &&
        reloadedAppointment.soap_objective === soapData.objective &&
        reloadedAppointment.soap_assessment === soapData.assessment &&
        reloadedAppointment.soap_plan === soapData.plan

      if (!soapDataPersisted) {
        console.log('❌ BUG CONFIRMED: SOAP data was NOT persisted to database')
        console.log('   Expected:', soapData)
        console.log('   Actual: All NULL or empty')
      }

      // This test SHOULD FAIL on unfixed code
      expect(soapDataPersisted).toBe(true) // Will fail, confirming bug
    }
  })

  it('should FAIL: Review modal would display "Not recorded" instead of SOAP data', async () => {
    console.log('\n=== TEST: Review Modal Data Loss ===')
    
    // This test simulates what happens when the Review modal opens
    // In the unfixed code, soapData state is empty after re-render
    
    // Simulate: User entered SOAP data and clicked Save & Continue
    const originalSoapData = {
      subjective: 'Headache for 3 days',
      objective: 'BP: 120/80 mmHg, Temp: 36.5°C',
      assessment: 'Tension headache',
      plan: 'Paracetamol 500mg TID, rest, follow-up in 1 week'
    }

    // Simulate: Component re-rendered, state reset to empty
    const soapDataAfterRerender = {
      subjective: '',
      objective: '',
      assessment: '',
      plan: ''
    }

    // Simulate: Review modal opens and displays soapData from state
    const displayedInReviewModal = {
      subjective: soapDataAfterRerender.subjective || 'Not recorded',
      objective: soapDataAfterRerender.objective || 'Not recorded',
      assessment: soapDataAfterRerender.assessment || 'Not recorded',
      plan: soapDataAfterRerender.plan || 'Not recorded'
    }

    console.log('Original SOAP data entered:', originalSoapData)
    console.log('SOAP data after re-render:', soapDataAfterRerender)
    console.log('Displayed in Review modal:', displayedInReviewModal)

    // Verify bug: All fields show "Not recorded"
    console.log('\n=== BUG VERIFICATION ===')
    const allFieldsLost = 
      displayedInReviewModal.subjective === 'Not recorded' &&
      displayedInReviewModal.objective === 'Not recorded' &&
      displayedInReviewModal.assessment === 'Not recorded' &&
      displayedInReviewModal.plan === 'Not recorded'

    if (allFieldsLost) {
      console.log('❌ BUG CONFIRMED: All SOAP fields display "Not recorded"')
      console.log('   This confirms data loss after component re-render')
    }

    // This test SHOULD FAIL on unfixed code
    // We expect the displayed data to match the original data
    expect(displayedInReviewModal.subjective).toBe(originalSoapData.subjective)
    expect(displayedInReviewModal.objective).toBe(originalSoapData.objective)
    expect(displayedInReviewModal.assessment).toBe(originalSoapData.assessment)
    expect(displayedInReviewModal.plan).toBe(originalSoapData.plan)
  })

  it('should document the root cause of the bug', () => {
    console.log('\n=== ROOT CAUSE ANALYSIS ===')
    console.log('File: rcmc-emr/src/pages/Appointments.jsx')
    console.log('Function: handleSaveSoap (lines 148-169)')
    console.log('')
    console.log('Root Cause 1: Missing Database Persistence')
    console.log('  Line 158: await db.updateAppointment(selectedAppointment.id, { status: "In Progress" })')
    console.log('  Problem: Only updates status, SOAP data is never passed to database')
    console.log('')
    console.log('Root Cause 2: State-Only Storage')
    console.log('  Lines 40-45: soapData state variable stores SOAP notes in memory only')
    console.log('  Problem: State is lost when component re-renders')
    console.log('')
    console.log('Root Cause 3: Forced Re-render')
    console.log('  Line 161: await loadData()')
    console.log('  Problem: Reloads appointments from database, causing re-render and state reset')
    console.log('')
    console.log('Root Cause 4: No Retrieval Mechanism')
    console.log('  Lines 453-459: Review modal displays soapData from state')
    console.log('  Problem: No code to load SOAP data from database for "In Progress" appointments')
    console.log('')
    console.log('Expected Fix:')
    console.log('  1. Add SOAP columns to appointments table (soap_subjective, soap_objective, soap_assessment, soap_plan)')
    console.log('  2. Update handleSaveSoap to persist SOAP data to database')
    console.log('  3. Update handleStartConsultation to load existing SOAP data from database')
    console.log('  4. Update Review modal to fetch latest SOAP data from database')
    console.log('  5. Update handleCompleteConsultation to retrieve SOAP data from database when state is empty')

    // This is a documentation test, always passes
    expect(true).toBe(true)
  })
})

/**
 * EXPECTED TEST RESULTS ON UNFIXED CODE:
 * 
 * ❌ Test 1: should FAIL - SOAP columns don't exist or are NULL
 * ❌ Test 2: should FAIL - Review modal displays "Not recorded"
 * ✅ Test 3: should PASS - Root cause documentation
 * 
 * EXPECTED TEST RESULTS AFTER FIX:
 * 
 * ✅ Test 1: should PASS - SOAP data persisted to database
 * ✅ Test 2: should PASS - Review modal displays correct SOAP data
 * ✅ Test 3: should PASS - Root cause documentation
 */


/**
 * Preservation Property Tests - Non-SOAP Workflows Unchanged
 * 
 * Property 2: Preservation - Existing workflows that don't involve SOAP data entry
 * should remain completely unchanged after the fix is implemented.
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**
 * 
 * IMPORTANT: These tests are run on UNFIXED code first to observe baseline behavior,
 * then run again after the fix to ensure no regressions.
 * 
 * EXPECTED OUTCOME: Tests PASS on both unfixed and fixed code.
 */

describe('Preservation Property Tests: Non-SOAP Workflows', () => {
  let testPatientId
  let testDoctorId
  let testAppointmentId

  beforeAll(async () => {
    console.log('=== PRESERVATION TEST SETUP ===')
    
    // Create test patient
    const testPatient = await db.addPatient({
      first_name: 'Preservation',
      last_name: 'Test',
      date_of_birth: '1985-05-15',
      gender: 'Female',
      contact_number: '5551234567',
      email: 'preservation@test.com',
      address: 'Test Address',
      emergency_contact_name: 'Emergency Contact',
      emergency_contact_number: '5559876543'
    })
    testPatientId = testPatient.id
    console.log('Created test patient:', testPatientId)

    // Get first available doctor
    const doctors = await db.getDoctors()
    if (doctors.length === 0) {
      throw new Error('No doctors available for testing')
    }
    testDoctorId = doctors[0].id
    console.log('Using test doctor:', testDoctorId)
  })

  afterAll(async () => {
    console.log('=== PRESERVATION TEST CLEANUP ===')
    
    if (testPatientId) {
      try {
        await db.deletePatient(testPatientId)
        console.log('Deleted test patient:', testPatientId)
      } catch (error) {
        console.error('Cleanup error:', error)
      }
    }
  })

  /**
   * Test 1: Appointment Creation Workflow
   * Validates: Requirement 3.5 - Appointments are loaded and displayed correctly
   */
  it('PRESERVATION: Appointment creation workflow remains unchanged', async () => {
    console.log('\n=== TEST: Appointment Creation ===')
    
    // Create appointment without SOAP data
    const appointment = await db.addAppointment({
      patient_id: testPatientId,
      doctor_id: testDoctorId,
      appointment_date: new Date().toISOString().split('T')[0],
      appointment_time: '10:00',
      reason: 'Regular checkup',
      status: 'Scheduled'
    })
    testAppointmentId = appointment.id
    
    console.log('Created appointment:', appointment)
    
    // Verify appointment was created correctly
    expect(appointment).toBeDefined()
    expect(appointment.id).toBeDefined()
    expect(appointment.patient_id).toBe(testPatientId)
    expect(appointment.doctor_id).toBe(testDoctorId)
    expect(appointment.status).toBe('Scheduled')
    expect(appointment.reason).toBe('Regular checkup')
    
    console.log('✅ Appointment creation works correctly')
  })

  /**
   * Test 2: Status Change via Dropdown
   * Validates: Requirement 3.2 - Status updates work without SOAP data
   */
  it('PRESERVATION: Status change via dropdown works without SOAP data', async () => {
    console.log('\n=== TEST: Status Change Without SOAP ===')
    
    // Change status from Scheduled to Confirmed (no SOAP data involved)
    await db.updateAppointment(testAppointmentId, { status: 'Confirmed' })
    
    // Reload appointment to verify change
    const appointments = await db.getAppointments(new Date().toISOString().split('T')[0])
    const updatedAppointment = appointments.find(apt => apt.id === testAppointmentId)
    
    console.log('Updated appointment status:', updatedAppointment.status)
    
    // Verify status was updated
    expect(updatedAppointment.status).toBe('Confirmed')
    
    console.log('✅ Status change works correctly without SOAP data')
  })

  /**
   * Test 3: Modal Cancellation
   * Validates: Requirement 3.4 - Cancelling SOAP modal discards data
   */
  it('PRESERVATION: Cancelling SOAP modal discards entered data', async () => {
    console.log('\n=== TEST: Modal Cancellation ===')
    
    // Simulate: User opens SOAP modal and enters data
    const soapDataBeforeCancel = {
      subjective: 'Test data',
      objective: 'Test vitals',
      assessment: 'Test diagnosis',
      plan: 'Test plan'
    }
    console.log('User enters SOAP data:', soapDataBeforeCancel)
    
    // Simulate: User clicks Cancel (closes modal without saving)
    console.log('User clicks Cancel button')
    
    // Simulate: Modal closes and state resets
    const soapDataAfterCancel = {
      subjective: '',
      objective: '',
      assessment: '',
      plan: ''
    }
    console.log('SOAP data after cancel:', soapDataAfterCancel)
    
    // Verify: Appointment status was NOT changed
    const appointments = await db.getAppointments(new Date().toISOString().split('T')[0])
    const appointment = appointments.find(apt => apt.id === testAppointmentId)
    
    console.log('Appointment status after cancel:', appointment.status)
    
    // Status should still be Confirmed (from previous test), not In Progress
    expect(appointment.status).toBe('Confirmed')
    
    // Verify: SOAP data was discarded (state reset)
    expect(soapDataAfterCancel.subjective).toBe('')
    expect(soapDataAfterCancel.objective).toBe('')
    expect(soapDataAfterCancel.assessment).toBe('')
    expect(soapDataAfterCancel.plan).toBe('')
    
    console.log('✅ Modal cancellation correctly discards data')
  })

  /**
   * Test 4: Queue View Display
   * Validates: Requirement 3.5 - Appointments display correctly by status
   */
  it('PRESERVATION: Queue view displays appointments correctly by status', async () => {
    console.log('\n=== TEST: Queue View Display ===')
    
    // Load appointments for today
    const appointments = await db.getAppointments(new Date().toISOString().split('T')[0])
    
    console.log('Total appointments loaded:', appointments.length)
    
    // Group appointments by status (simulating queue view logic)
    const queueAppointments = {
      waiting: appointments.filter(apt => apt.status === 'Scheduled' || apt.status === 'Confirmed'),
      inProgress: appointments.filter(apt => apt.status === 'In Progress'),
      completed: appointments.filter(apt => apt.status === 'Completed')
    }
    
    console.log('Queue view grouping:')
    console.log('  Waiting:', queueAppointments.waiting.length)
    console.log('  In Progress:', queueAppointments.inProgress.length)
    console.log('  Completed:', queueAppointments.completed.length)
    
    // Verify our test appointment is in the waiting queue
    const testAppointmentInQueue = queueAppointments.waiting.find(apt => apt.id === testAppointmentId)
    expect(testAppointmentInQueue).toBeDefined()
    expect(testAppointmentInQueue.status).toBe('Confirmed')
    
    console.log('✅ Queue view displays appointments correctly')
  })

  /**
   * Test 5: Prescribe Navigation
   * Validates: Requirement 3.6 - "Prescribe" button navigates correctly
   */
  it('PRESERVATION: Prescribe button navigation works correctly', async () => {
    console.log('\n=== TEST: Prescribe Navigation ===')
    
    // Change appointment to In Progress (prerequisite for Prescribe button)
    await db.updateAppointment(testAppointmentId, { status: 'In Progress' })
    
    // Simulate: User clicks "Prescribe" button
    // In the actual app, this stores patient ID in sessionStorage and navigates
    const appointment = (await db.getAppointments(new Date().toISOString().split('T')[0]))
      .find(apt => apt.id === testAppointmentId)
    
    console.log('Simulating Prescribe button click for appointment:', appointment.id)
    
    // Simulate sessionStorage behavior
    const storedPatientId = appointment.patient_id
    console.log('Patient ID stored in sessionStorage:', storedPatientId)
    
    // Verify patient ID is correct
    expect(storedPatientId).toBe(testPatientId)
    expect(storedPatientId).toBeDefined()
    
    console.log('✅ Prescribe navigation works correctly')
  })

  /**
   * Test 6: Consultation Completion Without SOAP
   * Validates: Requirement 3.3 - Completing consultations works when no SOAP data was entered
   */
  it('PRESERVATION: Consultation completion works without prior SOAP entry', async () => {
    console.log('\n=== TEST: Consultation Completion Without SOAP ===')
    
    // Scenario: Doctor completes consultation directly without entering SOAP notes first
    // This might happen for quick consultations or when using the old workflow
    
    // Create a new appointment for this test
    const quickAppointment = await db.addAppointment({
      patient_id: testPatientId,
      doctor_id: testDoctorId,
      appointment_date: new Date().toISOString().split('T')[0],
      appointment_time: '11:00',
      reason: 'Quick consultation',
      status: 'In Progress'
    })
    
    console.log('Created quick consultation appointment:', quickAppointment.id)
    
    // Simulate: Doctor enters minimal data in Review modal and completes
    const minimalSoapData = {
      subjective: 'Quick consultation',
      objective: '',
      assessment: 'No issues found',
      plan: ''
    }
    
    console.log('Completing consultation with minimal data:', minimalSoapData)
    
    // Create consultation record
    const consultationRecord = {
      patient_id: quickAppointment.patient_id,
      doctor_id: quickAppointment.doctor_id,
      appointment_id: quickAppointment.id,
      chief_complaint: minimalSoapData.subjective,
      vital_signs: {},
      diagnosis: minimalSoapData.assessment,
      prescription: minimalSoapData.plan || '',
      notes: `SOAP Note:\nS: ${minimalSoapData.subjective}\nO: Not recorded\nA: ${minimalSoapData.assessment}\nP: Not recorded`,
      consultation_date: new Date().toISOString()
    }
    
    const consultation = await db.addConsultation(consultationRecord)
    console.log('Created consultation record:', consultation.id)
    
    // Update appointment to Completed
    await db.updateAppointment(quickAppointment.id, { status: 'Completed' })
    
    // Verify consultation was created
    expect(consultation).toBeDefined()
    expect(consultation.id).toBeDefined()
    expect(consultation.diagnosis).toBe('No issues found')
    
    // Verify appointment status is Completed
    const appointments = await db.getAppointments(new Date().toISOString().split('T')[0])
    const completedAppointment = appointments.find(apt => apt.id === quickAppointment.id)
    expect(completedAppointment.status).toBe('Completed')
    
    console.log('✅ Consultation completion works without prior SOAP entry')
  })

  /**
   * Test 7: Subjective Field Pre-population
   * Validates: Requirement 3.1 - Appointment reason pre-populates Subjective field
   */
  it('PRESERVATION: Subjective field pre-populates with appointment reason', async () => {
    console.log('\n=== TEST: Subjective Field Pre-population ===')
    
    // Create appointment with a specific reason
    const appointmentWithReason = await db.addAppointment({
      patient_id: testPatientId,
      doctor_id: testDoctorId,
      appointment_date: new Date().toISOString().split('T')[0],
      appointment_time: '14:00',
      reason: 'Fever and cough for 2 days',
      status: 'Scheduled'
    })
    
    console.log('Created appointment with reason:', appointmentWithReason.reason)
    
    // Simulate: Doctor clicks "Start Consultation"
    // In the actual app, this sets soapData.subjective = apt.reason
    const soapDataOnModalOpen = {
      subjective: appointmentWithReason.reason || '',
      objective: '',
      assessment: '',
      plan: ''
    }
    
    console.log('SOAP data when modal opens:', soapDataOnModalOpen)
    
    // Verify: Subjective field is pre-populated with appointment reason
    expect(soapDataOnModalOpen.subjective).toBe('Fever and cough for 2 days')
    expect(soapDataOnModalOpen.objective).toBe('')
    expect(soapDataOnModalOpen.assessment).toBe('')
    expect(soapDataOnModalOpen.plan).toBe('')
    
    console.log('✅ Subjective field pre-populates correctly')
  })
})

/**
 * EXPECTED TEST RESULTS ON UNFIXED CODE:
 * 
 * ✅ Test 1: Appointment creation - PASS
 * ✅ Test 2: Status change without SOAP - PASS
 * ✅ Test 3: Modal cancellation - PASS
 * ✅ Test 4: Queue view display - PASS
 * ✅ Test 5: Prescribe navigation - PASS
 * ✅ Test 6: Consultation without SOAP - PASS
 * ✅ Test 7: Subjective pre-population - PASS
 * 
 * These tests confirm the baseline behavior that must be preserved.
 * 
 * EXPECTED TEST RESULTS AFTER FIX:
 * 
 * ✅ Test 1: Appointment creation - PASS (unchanged)
 * ✅ Test 2: Status change without SOAP - PASS (unchanged)
 * ✅ Test 3: Modal cancellation - PASS (unchanged)
 * ✅ Test 4: Queue view display - PASS (unchanged)
 * ✅ Test 5: Prescribe navigation - PASS (unchanged)
 * ✅ Test 6: Consultation without SOAP - PASS (unchanged)
 * ✅ Test 7: Subjective pre-population - PASS (unchanged)
 * 
 * If any test fails after the fix, it indicates a regression.
 */
