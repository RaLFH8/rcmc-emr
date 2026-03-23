# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Doctor Sees Full Patient Count Instead of Their Own
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate that `db.getStats()` returns the full patient count regardless of which doctor is logged in
  - **Scoped PBT Approach**: Scope the property to the concrete failing case — a doctor with `doctor_id` set, where the DB has N total patients but the doctor has only seen M < N of them
  - Mock Supabase to return 50 total active patients and a doctor linked to 8 via appointments/consultations
  - Call `db.getStats()` and assert `totalPatients === 8` (this will FAIL on unfixed code, returning 50 instead)
  - Also test: doctor with zero appointments/consultations — assert `totalPatients === 0` (will return 50 on unfixed code)
  - Also test: two doctors with different patient subsets — both get 50 from `getStats()` (confirms no per-doctor scoping)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct — it proves the bug exists)
  - Document counterexamples found: e.g., `getStats().totalPatients` returns 50 instead of 8 for a doctor who has seen 8 patients
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-Doctor Roles and Other Stat Cards Remain Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: `db.getStats()` on unfixed code for admin role returns full active patient count (e.g., 50)
  - Observe: `db.getStats()` on unfixed code for receptionist role returns full active patient count (e.g., 50)
  - Observe: `totalDoctors`, `monthlyAppointments`, `roomAvailability` values are the same for all roles
  - Observe: `db.getPatients()` returns all active patients regardless of role
  - Write property-based test: for all non-doctor roles (`"admin"`, `"receptionist"`), `stats.totalPatients` after fix equals the value returned by the original `db.getStats()` call
  - Write property-based test: for any role, `totalDoctors`, `bookAppointments`, `roomAvailability` are identical before and after fix
  - Write property-based test: `db.getPatients()` returns all active patients regardless of the logged-in user's role (Patients module unaffected)
  - Verify all tests PASS on UNFIXED code (confirms baseline behavior to preserve)
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 2.2, 3.1, 3.2, 3.3_

- [x] 3. Fix for doctor dashboard showing full patient count instead of doctor-scoped count

  - [x] 3.1 Add `getDoctorPatientCount(doctorId)` to `db` object in `rcmc-emr/src/lib/supabase.js`
    - Query `appointments` table for distinct `patient_id` values where `doctor_id = doctorId`
    - Query `consultations` table for distinct `patient_id` values where `doctor_id = doctorId`
    - Merge both result sets in JavaScript using a `Set` to deduplicate patient IDs
    - Return `set.size` as the final count
    - Handle errors gracefully — return `0` if either query fails rather than throwing
    - _Bug_Condition: isBugCondition(context) where context.userProfile.role === "doctor" AND context.userProfile.doctor_id IS NOT NULL_
    - _Expected_Behavior: getDoctorPatientCount(doctorId) returns the size of the union of distinct patient_id values from appointments and consultations filtered by doctor_id_
    - _Preservation: db.getStats() is not modified; db.getPatients() is not modified_
    - _Requirements: 2.1_

  - [x] 3.2 Update `loadData` in `rcmc-emr/src/pages/Dashboard.jsx` with role-aware patient count branching
    - After fetching `statsData` via `db.getStats()`, check `userProfile?.role === 'doctor'`
    - If true, read `doctorId` from `userProfile.doctor_id`
    - If `doctorId` is a valid non-null/non-undefined value, call `db.getDoctorPatientCount(doctorId)` and use the result to override `statsData.totalPatients` before setting state
    - If `doctorId` is null or undefined, fall back to `statsData.totalPatients` (safety fallback — avoids showing 0 incorrectly for misconfigured accounts)
    - Non-doctor roles (`"admin"`, `"receptionist"`) continue using `statsData.totalPatients` from `db.getStats()` unchanged
    - Do NOT change any other stat card values (`totalDoctors`, `bookAppointments`, `roomAvailability`)
    - Do NOT change the refresh flow — `handleRefresh` calls `loadData()` which will now use the role-aware path automatically
    - _Bug_Condition: isBugCondition(context) where context.userProfile.role === "doctor" AND context.userProfile.doctor_id IS NOT NULL_
    - _Expected_Behavior: stats.totalPatients is set to getDoctorPatientCount(userProfile.doctor_id) for doctor role_
    - _Preservation: stats.totalPatients is set to statsData.totalPatients (full count) for admin and receptionist roles; all other stat cards unchanged_
    - _Requirements: 2.1, 2.2, 3.3, 3.4_

  - [x] 3.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Doctor Sees Only Their Own Patients
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior (doctor with 8 patients sees 8, not 50)
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1_

  - [x] 3.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-Doctor Roles and Other Stat Cards Remain Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm admin/receptionist still see full patient count after fix
    - Confirm all other stat cards unchanged for all roles
    - Confirm Patients module (`db.getPatients()`) still returns all patients

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
