# Doctor Dashboard Patient Count Fix — Bugfix Design

## Overview

The "Total Patient" stat card on the doctor's dashboard currently calls `db.getStats()` in
`src/lib/supabase.js`, which counts **all** active patients in the database with no role or
doctor filter. Every doctor therefore sees the same inflated number — the entire patient
population — instead of only the patients they have personally seen.

The fix adds a new function `db.getDoctorPatientCount(doctorId)` that counts distinct
`patient_id` values from the `appointments` and `consultations` tables where
`doctor_id` matches the logged-in doctor. `Dashboard.jsx` is updated to call this function
when the logged-in user is a doctor, and to fall back to the existing `getStats()` path for
admins and receptionists. No other module is touched.

---

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug — the logged-in user has role
  `"doctor"` and a resolvable `doctor_id`, yet `getStats()` is called without any doctor
  filter, returning the full patient population count.
- **Property (P)**: The desired behavior when the bug condition holds — the "Total Patient"
  card SHALL display only the count of distinct patients linked to that doctor via
  `appointments.doctor_id` or `consultations.doctor_id`.
- **Preservation**: All behaviors that must remain unchanged — admin/receptionist total
  patient count, the Patients module, all other stat cards, and the refresh flow.
- **`getStats()`**: The existing function in `src/lib/supabase.js` that fetches aggregate
  dashboard statistics with no role awareness.
- **`getDoctorPatientCount(doctorId)`**: The new function to be added to `src/lib/supabase.js`
  that returns the count of distinct patients seen by a specific doctor.
- **`userProfile`**: The object from `AuthContext` containing `role` and `doctor_id` for the
  logged-in user.
- **`doctor_id`**: The foreign key on `appointments` and `consultations` rows that links a
  record to a specific doctor.

---

## Bug Details

### Bug Condition

The bug manifests when a user with `role === "doctor"` views the dashboard. The `loadData`
function in `Dashboard.jsx` calls `db.getStats()` unconditionally, which queries
`patients` with only a `status = 'Active'` filter — no `doctor_id` scoping — and returns
the total count across all doctors.

**Formal Specification:**
```
FUNCTION isBugCondition(context)
  INPUT: context = { userProfile: { role, doctor_id } }
  OUTPUT: boolean

  RETURN context.userProfile.role === "doctor"
         AND context.userProfile.doctor_id IS NOT NULL
         AND patientCountShownToDoctor === totalActivePatientsInDB
END FUNCTION
```

### Examples

- **Example 1**: Dr. Santos has seen 12 patients. The DB has 340 active patients. Dashboard
  shows "340" — expected "12".
- **Example 2**: Dr. Reyes has seen 5 patients. Dr. Santos has seen 12. Both see "340" —
  expected Dr. Reyes to see "5" and Dr. Santos to see "12".
- **Example 3**: Admin logs in — sees "340". This is correct and must remain unchanged.
- **Edge case**: A doctor with zero appointments/consultations should see "0", not the total.

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Admin and receptionist roles continue to see the full active patient count via `getStats()`.
- The Patients module (`db.getPatients()`) continues to return all patients regardless of
  the logged-in user's role.
- All other stat cards (Total Doctor, Book Appointment, Room Availability) display the same
  values as before for all roles.
- The refresh button continues to reload all stat card data correctly.

**Scope:**
All inputs where `userProfile.role !== "doctor"` are completely unaffected by this fix.
This includes:
- Admin dashboard views
- Receptionist dashboard views
- Any direct calls to `db.getStats()` from other parts of the application
- The Patients, Appointments, and Consultations modules

---

## Hypothesized Root Cause

Based on the bug description and code review:

1. **No role-aware branching in `loadData`**: `Dashboard.jsx` calls `db.getStats()` for all
   roles without checking `userProfile.role`. There is no code path that scopes the patient
   count to the logged-in doctor.

2. **`getStats()` has no `doctorId` parameter**: The function in `supabase.js` always queries
   `patients` with only `.eq('status', 'Active')`, making it structurally impossible to
   return a doctor-scoped count without modification.

3. **`userProfile.doctor_id` is available but unused in Dashboard**: `AuthContext` exposes
   `userProfile` (which includes `doctor_id` for doctor accounts), but `Dashboard.jsx` only
   uses it for the welcome message, not for data fetching.

4. **No join between `user_profiles` and `doctors` tables for `doctor_id` resolution**:
   The `user_profiles` table may store `doctor_id` directly, or it may need to be resolved
   via a lookup — this must be confirmed during implementation.

---

## Correctness Properties

Property 1: Bug Condition — Doctor Sees Only Their Own Patients

_For any_ dashboard load where `isBugCondition` holds (role is `"doctor"` with a valid
`doctor_id`), the fixed `loadData` function SHALL set `stats.totalPatients` to the count of
distinct `patient_id` values in `appointments` and `consultations` where
`doctor_id` equals the logged-in doctor's `doctor_id`.

**Validates: Requirements 2.1**

Property 2: Preservation — Non-Doctor Roles See Full Patient Count

_For any_ dashboard load where `isBugCondition` does NOT hold (role is `"admin"` or
`"receptionist"`), the fixed `loadData` function SHALL produce the same `stats.totalPatients`
value as the original unmodified `getStats()` call, preserving the full active patient count.

**Validates: Requirements 2.2, 3.2**

---

## Fix Implementation

### Changes Required

Assuming root cause #1, #2, and #3 are correct:

**File 1**: `rcmc-emr/src/lib/supabase.js`

**Addition**: New function `getDoctorPatientCount(doctorId)` in the `db` object

**Specific Changes**:
1. **Add `getDoctorPatientCount`**: Query `appointments` for distinct `patient_id` where
   `doctor_id = doctorId`, then union with `consultations` for the same filter, and return
   the count of the combined distinct set.
   ```
   SELECT COUNT(DISTINCT patient_id)
   FROM (
     SELECT patient_id FROM appointments WHERE doctor_id = doctorId
     UNION
     SELECT patient_id FROM consultations WHERE doctor_id = doctorId
   )
   ```
   Since Supabase JS client does not support UNION directly, implement as two separate
   queries and merge the distinct patient ID sets in JavaScript before returning `.size`.

---

**File 2**: `rcmc-emr/src/pages/Dashboard.jsx`

**Function**: `loadData`

**Specific Changes**:
1. **Role-aware patient count**: After fetching `statsData` via `db.getStats()`, check
   `userProfile?.role === 'doctor'`. If true, resolve the doctor's `doctor_id` from
   `userProfile` (field name to confirm: likely `userProfile.doctor_id`) and call
   `db.getDoctorPatientCount(doctorId)` to override `statsData.totalPatients`.
2. **Fallback safety**: If `doctor_id` cannot be resolved (null/undefined), fall back to
   `statsData.totalPatients` to avoid showing `0` incorrectly.
3. **No changes to other stat card fetches**: `totalDoctors`, `monthlyAppointments`,
   `roomAvailability` remain untouched.

---

## Testing Strategy

### Validation Approach

Two-phase approach: first run exploratory tests on the **unfixed** code to confirm the root
cause, then verify the fix and preservation after implementation.

---

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug on unfixed code. Confirm that
`getStats()` returns the full patient count regardless of which doctor is logged in.

**Test Plan**: Mock Supabase responses to simulate a DB with N total patients and a doctor
who has seen M < N of them. Call `db.getStats()` and assert the returned `totalPatients`
equals N (demonstrating the bug). Then call the fixed path and assert it equals M.

**Test Cases**:
1. **Doctor with subset of patients**: DB has 50 patients, doctor linked to 8 via
   appointments — `getStats()` returns 50 (will fail the "should be 8" assertion on unfixed
   code, confirming the bug).
2. **Doctor with zero patients**: DB has 50 patients, doctor has no appointments/consultations
   — `getStats()` returns 50 instead of 0 (confirms bug for new doctors).
3. **Two doctors, different counts**: Doctor A has 8 patients, Doctor B has 3 — both get 50
   from `getStats()` (confirms no per-doctor scoping).
4. **Admin role**: DB has 50 patients — `getStats()` returns 50 (correct, must stay this way).

**Expected Counterexamples**:
- `getStats().totalPatients` equals total DB count, not doctor-scoped count.
- Root cause confirmed: no `doctor_id` filter in the patients query.

---

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function
produces the expected behavior.

**Pseudocode:**
```
FOR ALL context WHERE isBugCondition(context) DO
  result := loadData_fixed(context)
  ASSERT result.stats.totalPatients === getDoctorPatientCount(context.userProfile.doctor_id)
END FOR
```

---

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed
function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL context WHERE NOT isBugCondition(context) DO
  ASSERT loadData_original(context).stats.totalPatients
       === loadData_fixed(context).stats.totalPatients
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many role/user combinations automatically
- It catches edge cases (receptionist, admin, null role) that manual tests might miss
- It provides strong guarantees that non-doctor roles are unaffected

**Test Plan**: Observe `getStats()` behavior on unfixed code for admin/receptionist roles,
then write property-based tests asserting the same values after the fix.

**Test Cases**:
1. **Admin preservation**: Admin user — `stats.totalPatients` equals full active patient
   count before and after fix.
2. **Receptionist preservation**: Receptionist user — same as admin.
3. **Other stat cards preservation**: For any role, `totalDoctors`, `bookAppointments`,
   `roomAvailability` are identical before and after fix.
4. **Patients module preservation**: `db.getPatients()` returns all active patients
   regardless of role — unaffected by fix.

---

### Unit Tests

- Test `getDoctorPatientCount(doctorId)` returns correct distinct count when a doctor has
  appointments only, consultations only, and both (with overlapping patient IDs).
- Test `getDoctorPatientCount(doctorId)` returns `0` for a doctor with no records.
- Test `loadData` sets `stats.totalPatients` to doctor-scoped count when role is `"doctor"`.
- Test `loadData` sets `stats.totalPatients` to full count when role is `"admin"`.

### Property-Based Tests

- For any `doctorId`, `getDoctorPatientCount` result is always ≤ total active patient count.
- For any non-doctor role, `stats.totalPatients` after fix equals `stats.totalPatients`
  before fix (preservation across all non-doctor inputs).
- For any doctor with a valid `doctor_id`, the count is the size of the union of distinct
  patient IDs from both `appointments` and `consultations`.

### Integration Tests

- Full dashboard load as a doctor: "Total Patient" card shows only that doctor's patients.
- Full dashboard load as an admin: "Total Patient" card shows all active patients.
- Refresh button after fix: re-fetches and still shows the correct scoped count for doctors.
- Patients module navigation: still shows all patients after the dashboard fix is applied.
