# Appointments Patients Filter Crash — Bugfix Design

## Overview

The Appointments page crashes with `TypeError: patients.filter is not a function` at line 906 because `db.getPatients()` returns `{ data: [...], count: N }` but `loadData()` assigns the whole object to the `patients` state variable. When the New Appointment modal renders the patient search dropdown, it calls `.filter()` on an object, which throws. The fix is a single-line change: `setPatients(patientsData.data || [])`.

## Glossary

- **Bug_Condition (C)**: The condition where the raw `{ data, count }` object returned by `db.getPatients()` is assigned directly to `patients` state without unwrapping `.data`
- **Property (P)**: After the fix, `patients` state is always an array, so `.filter()` in the patient search dropdown never throws
- **Preservation**: All other Appointments page behavior (calendar view, queue view, appointment creation, SOAP notes, status changes) must remain unchanged
- **db.getPatients()**: The function in `rcmc-emr/src/lib/supabase.js` that returns `{ data: Patient[], count: number }`
- **patientsData**: The raw return value of `db.getPatients(1000)` — an object, not an array
- **loadData()**: The async function in `Appointments.jsx` that fetches appointments, patients, and doctors on mount

## Bug Details

### Bug Condition

The bug manifests when `loadData()` in `Appointments.jsx` receives the `{ data, count }` object from `db.getPatients(1000)` and passes it directly to `setPatients()`. The `patients` state then holds an object. When the New Appointment modal opens and the patient search dropdown renders, it calls `patients.filter(...)` — which fails because plain objects don't have a `.filter()` method.

**Formal Specification:**
```
FUNCTION isBugCondition(X)
  INPUT: X — return value of db.getPatients(1000)
  OUTPUT: boolean

  RETURN typeof X = 'object'
         AND X.data IS ARRAY
         AND NOT (X IS ARRAY)
END FUNCTION
```

### Examples

- User opens Appointments page → `loadData()` runs → `setPatients({ data: [...], count: 42 })` → `patients` is an object
- User clicks "New Appointment" → modal opens → dropdown renders → `patients.filter(p => ...)` → `TypeError: patients.filter is not a function`
- User has zero patients in DB → `setPatients({ data: [], count: 0 })` → same crash on `.filter()`
- User has one patient → same crash; the array length is irrelevant — the type mismatch is the issue

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- The appointments list, calendar view, and queue view must continue to load and display correctly
- Filtering appointments by doctor, status, and week must continue to work
- The New Appointment modal must continue to allow patient search by name or patient number
- Submitting a new appointment for an existing patient must continue to save and update the UI optimistically
- Submitting a new appointment for a new patient must continue to create the patient record first, then save the appointment
- SOAP note entry, consultation completion, and status changes must remain unaffected

**Scope:**
All code paths that do NOT involve the `patients.filter(...)` call in the patient search dropdown are completely unaffected. The fix touches only the single `setPatients(patientsData)` line in `loadData()`.

## Hypothesized Root Cause

`db.getPatients()` was refactored to return `{ data, count }` to support pagination in the Patients page, but the Appointments page call site was not updated to unwrap `.data`. This is a straightforward API contract mismatch — identical in nature to the same bug already fixed in `Dashboard.jsx`.

1. **Missing `.data` unwrap in `loadData()`**: `patientsData` holds the full `{ data, count }` object; `.data` is never accessed before calling `setPatients()`
2. **No defensive fallback**: There is no `|| []` guard, so even a network error returning `undefined` would leave `patients` as `undefined` and crash the same way

## Correctness Properties

Property 1: Bug Condition — patients state is always an array

_For any_ call to `db.getPatients(1000)` where the return value satisfies `isBugCondition` (i.e., it is `{ data: [...], count: N }`), the fixed `loadData()` SHALL unwrap `.data` before calling `setPatients`, ensuring `Array.isArray(patients) === true` at all times and `.filter()` never throws.

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation — non-patient-list behavior is unchanged

_For any_ Appointments page interaction that does NOT involve the `patients.filter(...)` call in the patient search dropdown (calendar rendering, queue rendering, status updates, SOAP notes, appointment submission), the fixed code SHALL produce exactly the same behavior as the original code.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Fix Implementation

### Changes Required

**File**: `rcmc-emr/src/pages/Appointments.jsx`

**Function**: `loadData()` (~line 185)

**Specific Changes**:

1. **Unwrap `.data` from `patientsData`**
   - Before: `setPatients(patientsData)`
   - After: `setPatients(patientsData.data || [])`

No other files need to change. The fix is a single token insertion.

## Testing Strategy

### Validation Approach

Two-phase: first confirm the crash exists on unfixed code, then verify the fix works and existing behavior is preserved.

### Exploratory Bug Condition Checking

**Goal**: Surface the `TypeError` before the fix to confirm root cause. Confirm or refute the hypothesis that `patientsData` is an object, not an array.

**Test Plan**: Write a test that mocks `db.getPatients` to return `{ data: [...], count: N }` and renders the Appointments component, then opens the New Appointment modal. Run on UNFIXED code to observe the crash.

**Test Cases**:
1. **Modal open crash**: Mock `db.getPatients` returning `{ data: [patient], count: 1 }`, render Appointments, click "New Appointment" → expect `TypeError: patients.filter is not a function` (will fail on unfixed code)
2. **Empty patients crash**: Mock `db.getPatients` returning `{ data: [], count: 0 }`, same steps → same crash (will fail on unfixed code)
3. **Type assertion**: After `loadData()` resolves, assert `Array.isArray(patients)` → expect `false` on unfixed code

**Expected Counterexamples**:
- `TypeError: patients.filter is not a function` thrown when the dropdown renders
- `Array.isArray(patients)` returns `false` — confirms the object is stored directly in state

### Fix Checking

**Goal**: Verify that after the fix, `.filter()` never throws for any valid `db.getPatients()` response.

**Pseudocode:**
```
FOR ALL X WHERE isBugCondition(X) DO
  result := setPatients(X.data || [])
  ASSERT Array.isArray(patients) = true
  ASSERT patients.filter IS FUNCTION
END FOR
```

### Preservation Checking

**Goal**: Verify that all non-patient-search behavior is identical before and after the fix.

**Pseudocode:**
```
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT originalAppointments(X) = fixedAppointments(X)
END FOR
```

Property-based testing is appropriate here because it can generate many patient array shapes and confirm `.filter()` always works and the dropdown always renders correctly.

**Test Cases**:
1. **Calendar view preservation**: Verify appointments render in calendar view after fix
2. **Queue view preservation**: Verify waiting/in-progress/completed columns render after fix
3. **Patient search preservation**: Verify filtering by name and patient number still works after fix

### Unit Tests

- Appointments renders without crash when `db.getPatients` returns `{ data: [], count: 0 }`
- Appointments renders without crash when `db.getPatients` returns `{ data: [patient1, patient2], count: 2 }`
- Patient search dropdown filters correctly after fix
- `patients` state is always an array after `loadData()` resolves

### Property-Based Tests

- For any `{ data: Patient[], count: number }` returned by `db.getPatients`, `patients` state is always an array after `loadData()`
- For any array of patients, the search dropdown renders without throwing for any search string
- For any non-empty patient array, filtering by name substring always returns a subset array

### Integration Tests

- Full Appointments page load with real Supabase data renders without crash
- Opening the New Appointment modal and typing in the patient search field works correctly
- Selecting a patient from the dropdown populates the form and allows appointment submission
