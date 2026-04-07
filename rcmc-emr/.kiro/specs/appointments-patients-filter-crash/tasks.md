# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - patients.filter crash on New Appointment modal
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface the `TypeError: patients.filter is not a function` counterexample
  - **Scoped PBT Approach**: Scope the property to the concrete failing case — mock `db.getPatients` returning `{ data: [patient], count: 1 }`, render Appointments, open the New Appointment modal, assert no TypeError is thrown and the patient dropdown renders
  - Mock `db.getPatients(1000)` to return `{ data: [{ id: 1, first_name: 'Ana', last_name: 'Reyes', patient_number: 'P001' }], count: 1 }` (isBugCondition: return value is object with `.data` array, not an array itself)
  - Also test with `{ data: [], count: 0 }` — zero patients, same crash
  - Assert `Array.isArray(patients)` is `true` after `loadData()` resolves (will be `false` on unfixed code)
  - Assert clicking "New Appointment" and rendering the patient search dropdown does NOT throw (will throw on unfixed code)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS with `TypeError: patients.filter is not a function` (this is correct — it proves the bug exists)
  - Document counterexample: `patients = { data: [...], count: 1 }` → `.filter()` throws
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-patient-search Appointments behavior unchanged
  - **IMPORTANT**: Follow observation-first methodology — run UNFIXED code with non-buggy inputs and record actual outputs
  - Observe: calendar view renders correctly when `patients` state is not accessed (isBugCondition is false for these paths)
  - Observe: queue view (Waiting / In Progress / Completed columns) renders correctly
  - Observe: `filteredAppointments` memoization works correctly for doctor/status/week filters
  - Write property-based test: for any array of patients (non-buggy input where `Array.isArray(patientsData) === true`), the patient search dropdown filters by name substring and returns a subset array
  - Write test: appointments list, calendar view, and queue view render without crash regardless of patient data shape
  - Write test: patient search by name and patient number still returns correct matches after fix
  - Verify all tests PASS on UNFIXED code (these paths don't touch `patients.filter`)
  - **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3. Fix patients.filter crash in Appointments.jsx

  - [x] 3.1 Implement the one-line fix in `loadData()`
    - In `rcmc-emr/src/pages/Appointments.jsx`, find `loadData()` (~line 185)
    - Change: `setPatients(patientsData)` → `setPatients(patientsData.data || [])`
    - This unwraps the `.data` array from the `{ data, count }` object returned by `db.getPatients(1000)`
    - The `|| []` guard also handles network errors where `patientsData` may be `undefined`
    - No other files need to change — this is a single token insertion
    - _Bug_Condition: isBugCondition(patientsData) where typeof patientsData === 'object' AND patientsData.data IS ARRAY AND NOT Array.isArray(patientsData)_
    - _Expected_Behavior: Array.isArray(patients) === true after loadData(); patients.filter is a function; New Appointment modal renders without TypeError_
    - _Preservation: All appointment list, calendar, queue, SOAP, and status-change code paths are unaffected — only the setPatients call site changes_
    - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3, 3.4_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - patients state is always an array
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior (no TypeError, dropdown renders, `Array.isArray(patients) === true`)
    - When this test passes, it confirms the fix is correct
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-patient-search behavior unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions in calendar view, queue view, appointment filters, and patient search)
    - Confirm all tests still pass after fix (no regressions)

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
