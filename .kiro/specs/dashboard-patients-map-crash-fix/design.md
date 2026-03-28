# Dashboard Patients Map Crash Fix — Bugfix Design

## Overview

The Dashboard component crashes with `TypeError: patients.map is not a function` because `db.getPatients()` returns `{ data: [...], count: N }` but three call sites in `Dashboard.jsx` treat the return value as a plain array. The fix is surgical: unwrap `.data` at each of the three call sites.

## Glossary

- **Bug_Condition (C)**: The condition where the raw object returned by `db.getPatients()` is assigned directly to state or iterated without unwrapping `.data`
- **Property (P)**: After the fix, `patients` state is always an array, so `.map()` and `.slice()` never throw
- **Preservation**: All other dashboard behavior (stats, appointments, chart, CSV export) must remain unchanged
- **db.getPatients()**: The function in `rcmc-emr/src/lib/supabase.js` that returns `{ data: Patient[], count: number }`
- **patientsData**: The raw return value of `db.getPatients()` — an object, not an array

## Bug Details

### Bug Condition

The bug manifests when any of the three call sites in `Dashboard.jsx` receives the `{ data, count }` object from `db.getPatients()` and passes it directly to `setPatients()` or calls `.filter()` / `.slice()` on it.

**Formal Specification:**
```
FUNCTION isBugCondition(X)
  INPUT: X — return value of db.getPatients()
  OUTPUT: boolean

  RETURN typeof X = 'object'
         AND X.data IS ARRAY
         AND NOT (X IS ARRAY)
END FUNCTION
```

### Examples

- `loadData()`: `setPatients(patientsData || [])` stores the object → render calls `patients.map(...)` → crash
- `handleSearchChange()`: `let filteredResults = searchResults` then `filteredResults.slice(0, 4)` → `.slice is not a function` crash
- `handleGenderFilterChange()`: same pattern as `handleSearchChange()` → crash on gender filter

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Stats cards (total patients, doctors, appointments, rooms) must continue to load correctly
- Today's appointments list must continue to display
- Patient chart data must continue to render
- CSV export must continue to include patient rows
- Empty-state rendering (no patients) must continue to work without crashing

**Scope:**
All code paths that do NOT call `db.getPatients()` are completely unaffected. The fix touches only the three destructuring/assignment lines.

## Hypothesized Root Cause

`db.getPatients()` was refactored to return `{ data, count }` (to support pagination in the Patients page) but the Dashboard call sites were not updated to unwrap `.data`. This is a straightforward API contract mismatch.

1. **Missing destructuring in `loadData()`**: `patientsData` holds the full object; `.data` is never accessed
2. **Missing destructuring in `handleSearchChange()`**: `searchResults` holds the full object; `.filter()` and `.slice()` fail
3. **Missing destructuring in `handleGenderFilterChange()`**: same as above

## Correctness Properties

Property 1: Bug Condition — patients state is always an array

_For any_ call to `db.getPatients()` where the return value satisfies `isBugCondition` (i.e., it is `{ data: [...], count: N }`), the fixed Dashboard SHALL unwrap `.data` before calling `setPatients`, ensuring `Array.isArray(patients) === true` at all times and `.map()` never throws.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation — non-patient-list behavior is unchanged

_For any_ dashboard interaction that does NOT involve the three `db.getPatients()` call sites (stats loading, appointment loading, chart rendering, CSV export), the fixed code SHALL produce exactly the same behavior as the original code.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

**File**: `rcmc-emr/src/pages/Dashboard.jsx`

**Specific Changes**:

1. **`loadData()` (~line 330)**
   - Before: `setPatients(patientsData || [])`
   - After: `setPatients(patientsData?.data || [])`

2. **`handleSearchChange()`**
   - Before: `const searchResults = await db.getPatients(20, 0, query)` then `let filteredResults = searchResults`
   - After: `const { data: searchResults = [] } = await db.getPatients(20, 0, query)` then `let filteredResults = searchResults`

3. **`handleGenderFilterChange()`**
   - Before: `const searchResults = await db.getPatients(20, 0, searchQuery)` then `let filteredResults = searchResults`
   - After: `const { data: searchResults = [] } = await db.getPatients(20, 0, searchQuery)` then `let filteredResults = searchResults`

No other files need to change.

## Testing Strategy

### Validation Approach

Two-phase: first confirm the bug exists on unfixed code, then verify the fix and preservation.

### Exploratory Bug Condition Checking

**Goal**: Surface the crash before the fix to confirm root cause.

**Test Cases**:
1. Load the Dashboard with patients in the database → observe `TypeError: patients.map is not a function`
2. Type in the search box → observe crash in `handleSearchChange`
3. Select a gender filter → observe crash in `handleGenderFilterChange`

**Expected Counterexamples**:
- `patients.map is not a function` at render time
- `.slice is not a function` in search/filter handlers

### Fix Checking

```
FOR ALL X WHERE isBugCondition(X) DO
  result := setPatients(X?.data || [])
  ASSERT Array.isArray(patients) = true
  ASSERT patients.map IS FUNCTION
END FOR
```

### Preservation Checking

```
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT originalDashboard(X) = fixedDashboard(X)
END FOR
```

Property-based testing is appropriate here because it can generate many patient array shapes and confirm `.map()` always works.

### Unit Tests

- Dashboard renders without crash when `db.getPatients` returns `{ data: [], count: 0 }`
- Dashboard renders without crash when `db.getPatients` returns `{ data: [patient1, patient2], count: 2 }`
- Search input triggers correct patient list update
- Gender filter triggers correct patient list update

### Property-Based Tests

- For any `{ data: Patient[], count: number }` returned by `db.getPatients`, `patients` state is always an array
- For any array of patients, CSV export rows match the patients array

### Integration Tests

- Full dashboard load with real Supabase data renders the recent patients list
- Search and gender filter update the list without crashing
- CSV export includes correct patient data after fix
