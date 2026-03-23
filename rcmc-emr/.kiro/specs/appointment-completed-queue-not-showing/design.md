# Appointment Completed Queue Not Showing - Bugfix Design

## Overview

The Appointments page queue view filters appointments by `selectedDate`. This state is initialized with `new Date().toISOString().split('T')[0]`, which returns the UTC date. In UTC+8 (Philippines), this is yesterday's date before 8:00 AM local time. Since appointments are stored with local dates, the filter `aptDate === selectedDate` never matches today's appointments, so the Completed column always appears empty.

The fix is a single-line change: replace the UTC-based initialization with `toLocalDateStr(new Date())`, a helper already defined in the same file.

## Glossary

- **Bug_Condition (C)**: `selectedDate` is initialized with a UTC date that does not match the local date in UTC+ timezones
- **Property (P)**: After the fix, `selectedDate` must equal the local date so the queue filter matches today's appointments
- **Preservation**: All other filtering logic (calendar week range, doctor filter, status filter, date navigation) must remain unchanged
- **toLocalDateStr(d)**: Helper in `Appointments.jsx` that formats a `Date` as `YYYY-MM-DD` using local timezone fields (`getFullYear`, `getMonth`, `getDate`)
- **selectedDate**: React state that drives the queue view date filter (`aptDate === selectedDate`)

## Bug Details

### Bug Condition

The bug manifests when the app initializes `selectedDate` using `new Date().toISOString().split('T')[0]`. In any timezone ahead of UTC, this returns yesterday's local date during the hours before midnight UTC. Appointments stored with today's local date never match the filter.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input — the Date object used to initialize selectedDate
  OUTPUT: boolean

  utcDate  := input.toISOString().split('T')[0]   // e.g. "2025-07-14" (UTC)
  localDate := toLocalDateStr(input)               // e.g. "2025-07-15" (UTC+8)

  RETURN utcDate != localDate
END FUNCTION
```

### Examples

- UTC+8, 00:30 local time: `new Date().toISOString()` → `"2025-07-14T16:30:00.000Z"` → selectedDate = `"2025-07-14"` (yesterday). Appointments for `"2025-07-15"` never appear.
- UTC+8, 10:00 local time: `new Date().toISOString()` → `"2025-07-15T02:00:00.000Z"` → selectedDate = `"2025-07-15"` (correct). Bug does not manifest.
- UTC-5, any time: UTC date is always behind local date, so the bug manifests in the evening hours.
- UTC+0: UTC date equals local date, bug never manifests.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Appointments in "Waiting" (Scheduled/Confirmed) for the selected local date continue to appear in the Waiting column
- Appointments in "In Progress" for the selected local date continue to appear in the In Progress column
- User-driven date navigation in queue view continues to filter by the user-selected date
- Calendar week view filtering by week range is completely unaffected
- Doctor role auto-filter and default queue view are unaffected

**Scope:**
All inputs that do NOT involve the initial value of `selectedDate` are completely unaffected. This includes:
- Manual date changes by the user
- Calendar view week filtering
- Doctor and status filter dropdowns
- The `toLocalDateStr` helper itself (unchanged)

## Hypothesized Root Cause

1. **UTC vs Local Date Mismatch**: `Date.prototype.toISOString()` always returns UTC. In UTC+8, the UTC date is behind the local date for the first 8 hours of each local day. The `selectedDate` state is initialized once on component mount, so if the page loads during those hours, the filter is permanently off by one day for that session.

2. **No Other Initialization Path**: `selectedDate` has only one initialization site (`useState(new Date().toISOString().split('T')[0])`). There is no fallback or correction mechanism.

3. **`toLocalDateStr` Already Exists**: The correct helper is already defined in the same component (line 562) and used for calendar week filtering. It was simply not used for the initial state value.

## Correctness Properties

Property 1: Bug Condition - selectedDate Matches Local Date on Init

_For any_ `Date` object `d` where `isBugCondition(d)` is true (i.e., UTC date ≠ local date), the fixed initialization SHALL set `selectedDate` to `toLocalDateStr(d)` so that the queue filter correctly matches appointments stored with the local date.

**Validates: Requirements 2.3, 2.1, 2.2**

Property 2: Preservation - Non-Buggy Queue and Calendar Behavior

_For any_ input that does NOT involve the initial value of `selectedDate` (user date navigation, calendar week filter, doctor filter, status filter), the fixed code SHALL produce exactly the same behavior as the original code.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

**File**: `rcmc-emr/src/pages/Appointments.jsx`

**Specific Changes**:

1. **Line ~22 — `selectedDate` useState initialization**:
   - Before: `useState(new Date().toISOString().split('T')[0])`
   - After: `useState(toLocalDateStr(new Date()))`

2. **Problem**: `toLocalDateStr` is defined later in the component body (line ~562), so it cannot be referenced in `useState` at line ~22.

3. **Solution**: Hoist `toLocalDateStr` out of the component as a module-level utility function, then use it in the `useState` call. Alternatively, inline the equivalent logic directly in the `useState` call:
   ```js
   const _d = new Date()
   useState(`${_d.getFullYear()}-${String(_d.getMonth()+1).padStart(2,'0')}-${String(_d.getDate()).padStart(2,'0')}`)
   ```
   The cleanest approach is to define a module-level `toLocalDateStr` before the component and use it in both `useState` and the existing usages inside the component.

**Chosen approach**: Define `toLocalDateStr` at module level (before the component), remove the duplicate definition inside the component, and use it in `useState`.

## Testing Strategy

### Validation Approach

Two-phase: first confirm the bug on unfixed code, then verify the fix and preservation.

### Exploratory Bug Condition Checking

**Goal**: Confirm that `selectedDate` is initialized with a UTC date that differs from the local date in UTC+8.

**Test Plan**: Write a unit test that mocks `Date` to return a time where UTC date ≠ local date (e.g., 00:30 UTC+8 = 16:30 UTC previous day), then assert that `selectedDate` is initialized to the wrong date on unfixed code.

**Test Cases**:
1. **UTC+8 midnight test**: Mock `new Date()` to `2025-07-15T16:30:00Z` (= 00:30 July 15 UTC+8). Assert `selectedDate` is `"2025-07-14"` on unfixed code (will fail after fix).
2. **Completed column empty test**: Given appointments with `appointment_date = "2025-07-15"` and status `"Completed"`, assert `queueAppointments.completed` is empty when `selectedDate = "2025-07-14"`.

**Expected Counterexamples**:
- `selectedDate` is `"2025-07-14"` when local date is `"2025-07-15"` — queue filter excludes all of today's appointments.

### Fix Checking

**Goal**: Verify that after the fix, `selectedDate` equals the local date.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := initialize_selectedDate_fixed(input)
  ASSERT result == toLocalDateStr(input)
END FOR
```

### Preservation Checking

**Goal**: Verify that user-driven date changes, calendar filtering, and role-based behavior are unaffected.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT behavior_original(input) == behavior_fixed(input)
END FOR
```

**Test Cases**:
1. **Waiting column preservation**: Appointments with status "Scheduled" for today's local date appear in Waiting column after fix
2. **In Progress column preservation**: Appointments with status "In Progress" for today's local date appear in In Progress column after fix
3. **Calendar view preservation**: Week range filtering is unaffected by the change
4. **Date navigation preservation**: Manually changing `selectedDate` still filters correctly

### Unit Tests

- Test `toLocalDateStr` returns correct local date for a given UTC timestamp
- Test `selectedDate` initialization uses local date
- Test queue filter correctly includes/excludes appointments by date

### Property-Based Tests

- Generate random UTC timestamps and verify `toLocalDateStr` always returns the correct local date string
- Generate random appointment sets and verify queue columns only show appointments matching `selectedDate`

### Integration Tests

- Full queue render with appointments for today's local date — all three columns populate correctly
- Switching between calendar and queue view does not reset date incorrectly
