# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Fault Condition** - SOAP Notes Lost on Re-render
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Test the concrete failing case - enter SOAP notes, click "Save & Continue", verify data is NOT in database (unfixed code)
  - Test implementation details from Fault Condition in design:
    - Enter SOAP notes in "Start Consultation" modal (S: "Headache for 3 days", O: "BP: 120/80", A: "Tension headache", P: "Paracetamol 500mg")
    - Click "Save & Continue" button
    - Query appointments table in Supabase to check soap_subjective, soap_objective, soap_assessment, soap_plan columns
    - Click "Complete" button to open Review modal
    - Verify Review modal displays entered SOAP data (not "Not recorded")
  - The test assertions should match the Expected Behavior Properties from design:
    - ASSERT: SOAP data persists to database after "Save & Continue"
    - ASSERT: SOAP data is retrievable in Review modal after component re-render
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found:
    - Appointments table SOAP columns remain NULL after "Save & Continue"
    - Review modal displays "Not recorded" instead of entered SOAP data
    - React DevTools shows soapData state resets to empty values after loadData()
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-SOAP Workflows Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs (workflows without SOAP data entry)
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements:
    - Test 1: Appointment creation workflow - verify appointments are created correctly
    - Test 2: Status change via dropdown - verify status updates work without SOAP data
    - Test 3: Modal cancellation - verify cancelling SOAP modal discards data
    - Test 4: Queue view display - verify appointments display correctly by status
    - Test 5: Prescribe navigation - verify "Prescribe" button navigates correctly
    - Test 6: Consultation completion without SOAP - verify completing consultations works when no SOAP data was entered
    - Test 7: Subjective field pre-population - verify appointment reason pre-populates Subjective field
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 3. Fix for SOAP note persistence issue

  - [x] 3.1 Add SOAP columns to appointments table
    - Run SQL migration to add four TEXT columns: soap_subjective, soap_objective, soap_assessment, soap_plan
    - Verify columns are created in Supabase dashboard
    - _Bug_Condition: isBugCondition(input) where SOAP data is entered and "Save & Continue" is clicked_
    - _Expected_Behavior: SOAP data persists to database and is retrievable after re-renders_
    - _Preservation: All non-SOAP appointment workflows remain unchanged_
    - _Requirements: 2.1_

  - [x] 3.2 Add getAppointmentById helper function to supabase.js
    - Create function to fetch single appointment by ID with patient and doctor relations
    - Include all SOAP fields in SELECT query
    - Handle errors appropriately
    - _Requirements: 2.2, 2.3_

  - [x] 3.3 Update handleSaveSoap to persist SOAP data
    - Modify db.updateAppointment() call to include all four SOAP fields
    - Keep existing status update to "In Progress"
    - Keep existing loadData() call to refresh UI
    - _Requirements: 2.1_

  - [x] 3.4 Update handleStartConsultation to load existing SOAP data
    - Check if appointment has existing SOAP data in database
    - Load SOAP data into soapData state if present
    - Preserve existing behavior of pre-populating Subjective with appointment reason
    - _Requirements: 2.3, 3.1_

  - [x] 3.5 Update handleCompleteConsultation to retrieve SOAP from database
    - Fetch latest appointment data using getAppointmentById before creating consultation
    - Use database values if state is empty (handles re-render case)
    - Clear SOAP fields from appointments table after transferring to consultations table
    - _Requirements: 2.3, 2.4_

  - [x] 3.6 Update Review modal to fetch latest SOAP data
    - Load latest appointment data when Review modal opens
    - Update soapData state with database values
    - Ensure modal displays current SOAP data from database
    - _Requirements: 2.2_

  - [x] 3.7 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - SOAP Notes Persist Across Re-renders
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Verify:
      - SOAP data persists to appointments table after "Save & Continue"
      - Review modal displays correct SOAP data after component re-render
      - SOAP data survives page refresh and navigation
      - Partial SOAP data is saved and retrieved correctly
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.8 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-SOAP Workflows Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix:
      - Appointment creation workflow unchanged
      - Status changes via dropdown unchanged
      - Modal cancellation behavior unchanged
      - Queue view display unchanged
      - Prescribe navigation unchanged
      - Consultation completion without SOAP unchanged
      - Subjective field pre-population unchanged
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 4. Checkpoint - Ensure all tests pass
  - Run all exploration tests - verify they pass
  - Run all preservation tests - verify they pass
  - Test full workflow manually:
    - Create appointment → Start consultation → Enter SOAP → Save → Navigate away → Return → Complete consultation
    - Verify SOAP data persists throughout workflow
    - Verify completed consultation has SOAP data in consultations table
    - Verify SOAP fields are cleared from appointments table after completion
  - Ask the user if questions arise
