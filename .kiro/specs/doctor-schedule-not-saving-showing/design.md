# Doctor Schedule Not Saving/Showing Bugfix Design

## Overview

The PublicBooking page always shows zero available time slots because `loadTimeSlots` calls
`db.getAvailableTimeSlots(selectedDoctor.id, selectedDate)` — omitting the required third
argument `selectedDoctor.schedule`. The function immediately returns `[]` when `schedule` is
`undefined`, making every date appear as a non-working day.

A secondary risk is that the `schedule` JSONB column may not exist in the `doctors` table if
the migration at `doctor-schedule-booking/migrations/01-add-schedule-column.sql` has not been
run, which would also prevent schedules from saving in the Doctors module.

The fix is a single-line change in `PublicBooking.jsx`. No logic changes are needed in
`supabase.js` or `Doctors.jsx` — those files are already correct.

---

## Glossary

- **Bug_Condition (C)**: `getAvailableTimeSlots` is called with `schedule = undefined`
- **Property (P)**: When the schedule is forwarded, the function returns slots for working days and `[]` for non-working days
- **Preservation**: All existing slot-filtering logic (past-time filtering, booked-slot exclusion, non-working-day handling) must remain unchanged
- **loadTimeSlots**: The async function in `PublicBooking.jsx` that fetches available slots for the selected doctor and date
- **getAvailableTimeSlots(doctorId, date, schedule)**: The function in `supabase.js` that generates 20-minute slots from the doctor's schedule JSONB
- **schedule**: A JSONB object keyed by JS day-of-week index (0=Sun … 6=Sat), each value `{ start: number, end: number }` in 24-hour format

---

## Bug Details

### Bug Condition

The bug manifests when `loadTimeSlots` is invoked after the user selects a doctor and a date.
The call omits `selectedDoctor.schedule`, so `getAvailableTimeSlots` receives `undefined` as
the third argument, hits the `if (!daySchedule) return []` guard, and returns an empty array
for every date.

**Formal Specification:**
```
FUNCTION isBugCondition(X)
  INPUT: X of type { doctorId, date, scheduleArg }
  OUTPUT: boolean

  RETURN X.scheduleArg = undefined OR X.scheduleArg = null
END FUNCTION
```

### Examples

- Doctor has Mon–Fri 09:00–17:00 schedule; patient selects a Monday → **actual**: 0 slots shown; **expected**: 24 slots shown
- Doctor has no schedule for Sunday; patient selects a Sunday → **actual**: 0 slots (correct result, wrong reason — schedule never consulted); **expected**: 0 slots (non-working day)
- Doctor has schedule but `schedule` column missing from DB → **actual**: `getActiveDoctors()` returns `schedule: null`; **expected**: column exists and returns JSONB

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Non-working days (day not in schedule) must continue to return an empty slot list
- Past time slots on today's date must continue to be filtered out
- Already-booked slots must continue to be excluded from the available list
- The booking form submission flow must remain unchanged
- `getActiveDoctors()` must continue to return all active doctor fields including `schedule`

**Scope:**
All inputs where `scheduleArg` is already correctly provided (i.e., `isBugCondition` is false)
must produce identical results before and after the fix. This includes:
- Any code path that already passes a valid schedule object
- Mouse/touch interactions with the booking form
- The confirmation and submission steps

---

## Hypothesized Root Cause

The `getAvailableTimeSlots` function signature was updated to require a `schedule` parameter
(as part of the doctor-schedule-booking feature), but the call site in `PublicBooking.jsx` was
not updated at the same time. The `schedule` data is already present on `selectedDoctor` (fetched
by `getActiveDoctors()`), so the fix is purely a call-site update — no data-fetching changes needed.

Secondary risk: if the `schedule` JSONB column was never added to the `doctors` table in Supabase,
`getActiveDoctors()` would return `schedule: null` for all doctors, and even the fixed call would
return `[]`. The migration SQL already exists and just needs to be executed.

---

## Correctness Properties

Property 1: Bug Condition - Schedule Argument Forwarded

_For any_ booking request where a doctor has a configured schedule for the selected day
(isBugCondition was true before the fix), the fixed `loadTimeSlots` SHALL call
`getAvailableTimeSlots` with `selectedDoctor.schedule` as the third argument, causing the
function to return a non-empty list of 20-minute slots within the doctor's working hours.

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation - Existing Slot Filtering Unchanged

_For any_ input where the bug condition does NOT hold (schedule argument is already provided
correctly), the fixed code SHALL produce exactly the same slot list as the original code,
preserving past-time filtering, booked-slot exclusion, and non-working-day handling.

**Validates: Requirements 3.1, 3.2, 3.3**

---

## Fix Implementation

### Changes Required

**File**: `rcmc-emr/src/pages/PublicBooking.jsx`

**Function**: `loadTimeSlots`

**Specific Change** — pass `selectedDoctor.schedule` as the third argument:

```js
// BEFORE (buggy)
const slots = await db.getAvailableTimeSlots(selectedDoctor.id, selectedDate);

// AFTER (fixed)
const slots = await db.getAvailableTimeSlots(selectedDoctor.id, selectedDate, selectedDoctor.schedule);
```

**Secondary Action (manual, not a code change)**:
Run the existing migration in Supabase SQL Editor if the `schedule` column does not yet exist:
`rcmc-emr/.kiro/specs/doctor-schedule-booking/migrations/01-add-schedule-column.sql`

No changes are needed in `supabase.js` or `Doctors.jsx`.

---

## Testing Strategy

### Validation Approach

Two-phase: first run exploratory tests on the unfixed code to confirm the bug, then apply the
fix and run fix-checking and preservation tests.

### Exploratory Bug Condition Checking

**Goal**: Confirm that calling `getAvailableTimeSlots` without the schedule argument always
returns `[]`, even for doctors with a configured working day.

**Test Plan**: Call `getAvailableTimeSlots(doctorId, workingDayDate)` (no third arg) and assert
the result is empty. Run on unfixed code to observe the failure mode.

**Test Cases**:
1. **Working day, no schedule arg**: Call with a date that falls on a doctor's working day, omit schedule → expect `[]` (demonstrates bug)
2. **Non-working day, no schedule arg**: Call with a non-working day, omit schedule → expect `[]` (same result, but for wrong reason)
3. **Working day, schedule provided**: Call with schedule → expect non-empty slots (demonstrates fix)

**Expected Counterexamples**:
- `getAvailableTimeSlots(doctorId, mondayDate)` returns `[]` even though doctor works Mondays
- Root cause confirmed: `schedule` is `undefined`, `daySchedule` is `undefined`, early return fires

### Fix Checking

**Goal**: Verify that after the fix, working days return slots and non-working days return `[]`.

**Pseudocode:**
```
FOR ALL X WHERE isBugCondition(X) AND selectedDoctor.schedule IS NOT NULL DO
  slots := getAvailableTimeSlots_fixed(X.doctorId, X.date, selectedDoctor.schedule)
  ASSERT slots.length > 0 OR date_is_non_working_day(selectedDoctor.schedule, X.date)
END FOR
```

### Preservation Checking

**Goal**: Verify that slot filtering behavior is unchanged for all non-buggy inputs.

**Pseudocode:**
```
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT getAvailableTimeSlots_original(X.doctorId, X.date, X.scheduleArg)
       = getAvailableTimeSlots_fixed(X.doctorId, X.date, X.scheduleArg)
END FOR
```

**Testing Approach**: Property-based testing generates varied schedule configurations and date
inputs to verify that past-time filtering, booked-slot exclusion, and non-working-day handling
are all preserved.

**Test Cases**:
1. **Past-time filtering preservation**: Slots before current time on today's date remain excluded
2. **Booked-slot exclusion preservation**: Slots with existing appointments remain unavailable
3. **Non-working-day preservation**: Days not in schedule still return `[]`

### Unit Tests

- `getAvailableTimeSlots` with `schedule = undefined` returns `[]`
- `getAvailableTimeSlots` with valid schedule on a working day returns correct 20-min slots
- `getAvailableTimeSlots` on a non-working day returns `[]`
- Past slots on today's date are excluded
- Booked slots are marked unavailable

### Property-Based Tests

- For any schedule object and any date, if the day is not in the schedule, result is always `[]`
- For any schedule object and a working day, result length equals `(end - start) * 3` minus booked/past slots
- For any input where schedule is provided, fixed and original functions return identical results

### Integration Tests

- Select a doctor with a configured schedule, pick a working day → slots appear in the UI
- Select a doctor with a configured schedule, pick a non-working day → "No available slots" message shown
- Complete a full booking flow after the fix → appointment is created correctly
