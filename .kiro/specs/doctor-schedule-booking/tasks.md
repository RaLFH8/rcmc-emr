# Implementation Plan: Doctor Schedule Booking

## Overview

Add per-doctor schedule support: a `schedule` JSONB column in the `doctors` table drives date-picker filtering, time-slot generation, and a new schedule editor UI in the admin Doctors module.

## Tasks

- [ ] 1. Database migration — add schedule column and seed data
  - Run `migrations/01-add-schedule-column.sql` in Supabase SQL editor
  - Adds `schedule JSONB DEFAULT NULL` column with `IF NOT EXISTS` guard
  - Seeds the 4 doctors' schedules by last-name match (only when `schedule IS NULL`)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Update `getActiveDoctors()` in `src/lib/supabase.js`
  - [x] 2.1 Add `schedule` to the SELECT field list
    - Change `.select('id, first_name, last_name, specialization, license_number')` to include `schedule`
    - _Requirements: 3.1, 3.2_

  - [ ]* 2.2 Write unit tests for `getActiveDoctors` schedule field
    - Verify returned doctor objects include a `schedule` property
    - _Requirements: 3.2_

- [x] 3. Add exported `isDoctorWorkingDay(schedule, date)` to `src/lib/supabase.js`
  - [x] 3.1 Implement the pure exported function
    - Export `isDoctorWorkingDay(schedule, date)` outside the `db` object
    - When `schedule` is null/undefined, fall back to Mon–Fri (day index 1–5)
    - Otherwise check `Object.prototype.hasOwnProperty.call(schedule, String(dayIndex))`
    - _Requirements: 4.4, 4.3_

  - [ ]* 3.2 Write property test for `isDoctorWorkingDay` — non-working day returns false
    - **Property 1: `isDoctorWorkingDay` returns false for any day not in schedule**
    - **Validates: Requirements 4.1, 4.4**

  - [ ]* 3.3 Write unit tests for `isDoctorWorkingDay`
    - Working day returns true, non-working day returns false
    - Null schedule falls back to Mon–Fri
    - _Requirements: 4.3, 4.4_

- [x] 4. Update `getAvailableTimeSlots` in `src/lib/supabase.js`
  - [x] 4.1 Update function signature to `getAvailableTimeSlots(doctorId, date, schedule)`
    - Look up `schedule[String(dayOfWeek)]` to get `{ start, end }`
    - Return `[]` immediately when `schedule` is null or day is not in schedule
    - Generate 20-min slots in `[start, end)` using the schedule hours (not hardcoded 10–17)
    - Continue filtering booked and past slots as before
    - Remove any reference to static config or hardcoded schedule data
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.2_

  - [ ]* 4.2 Write property test for `getAvailableTimeSlots` — empty array on non-working day
    - **Property 2: `getAvailableTimeSlots` returns `[]` when `isDoctorWorkingDay` is false**
    - **Validates: Requirements 5.3, 5.6**

  - [ ]* 4.3 Write property test for `getAvailableTimeSlots` — all slots within working hours
    - **Property 3: all returned slot `time` values fall within `[start, end)` working hours**
    - **Validates: Requirements 5.2**

  - [ ]* 4.4 Write property test for `getAvailableTimeSlots` — no duplicate slots
    - **Property 4: all `time` values in returned array are unique**
    - **Validates: Requirements 5.2**

  - [ ]* 4.5 Write property test for `getAvailableTimeSlots` — 20-minute interval
    - **Property 5: consecutive slots differ by exactly 20 minutes**
    - **Validates: Requirements 5.2**

- [ ] 5. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Update `src/pages/PublicBooking.jsx`
  - [x] 6.1 Import `isDoctorWorkingDay` from `src/lib/supabase.js`
    - Add named import at top of file
    - _Requirements: 4.4, 7.1_

  - [x] 6.2 Update doctor-change handler to clear date and time
    - On doctor selection: `setSelectedDate('')`, `setSelectedTime('')`, `setTimeSlots([])`, `setNonWorkingDayMsg('')`
    - _Requirements: 4.5_

  - [x] 6.3 Update date-change handler to check working day and show message
    - Call `isDoctorWorkingDay(selectedDoctor.schedule, date)` on date selection
    - If non-working day: set message `"Dr. [Name] is not available on [Day]. Please select a different date."` without making a network call
    - If working day: clear message and call `loadTimeSlots(date)`
    - Always clear `selectedTime` on date change
    - _Requirements: 4.1, 6.1, 6.4_

  - [x] 6.4 Pass `schedule` to `getAvailableTimeSlots` in `loadTimeSlots`
    - Update call to `db.getAvailableTimeSlots(selectedDoctor.id, date, selectedDoctor.schedule)`
    - _Requirements: 5.1, 3.3_

  - [x] 6.5 Add all-booked message state and display
    - After slots load, if `slots.length > 0 && slots.every(s => !s.is_available)`, show `"No available slots for this date. All slots are fully booked."`
    - Clear the message when a new date is selected or doctor changes
    - _Requirements: 6.2, 6.3_

  - [x] 6.6 Remove any import or reference to static `doctorSchedules.js` config
    - _Requirements: 7.1, 7.3_

  - [ ]* 6.7 Write unit tests for PublicBooking date-change and doctor-change handlers
    - Doctor change clears date/time state
    - Non-working day shows message without calling `getAvailableTimeSlots`
    - Working day calls `loadTimeSlots`
    - _Requirements: 4.5, 6.1, 6.4_

- [x] 7. Update `src/pages/Doctors.jsx` — schedule editor UI
  - [x] 7.1 Add `deserializeSchedule` and `serializeSchedule` helpers inside `Doctors.jsx`
    - `deserializeSchedule(jsonb)` → array of 7 `{ enabled, start, end }` entries
    - `serializeSchedule(uiSchedule)` → JSONB object with only enabled days; returns `null` if none enabled
    - _Requirements: 2.1, 2.5_

  - [ ]* 7.2 Write property test for serialize/deserialize round-trip
    - **Property 6: `deserializeSchedule(serializeSchedule(ui))` equals original `ui` for all enabled-day combinations**
    - **Validates: Requirements 2.4**

  - [x] 7.3 Add `scheduleUI` state and wire to open/close/edit handlers
    - `const [scheduleUI, setScheduleUI] = useState(deserializeSchedule(null))`
    - On `handleEdit(doctor)`: call `setScheduleUI(deserializeSchedule(doctor.schedule))`
    - On `closeModal`: call `setScheduleUI(deserializeSchedule(null))`
    - _Requirements: 2.1, 2.5_

  - [x] 7.4 Replace plain text schedule field with day-toggle + hour-dropdown editor in the modal
    - Render 7 rows (Sun–Sat) each with a checkbox and, when checked, start/end `<select>` dropdowns (hours 0–23)
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 7.5 Serialize `scheduleUI` on save and include in doctor upsert payload
    - In `handleSubmit`: `schedule: serializeSchedule(scheduleUI)` replaces any previous plain-text schedule field
    - _Requirements: 2.4_

  - [ ]* 7.6 Write unit tests for schedule editor state transitions
    - Toggling a day on/off updates `scheduleUI` correctly
    - Saving serializes to correct JSONB shape
    - _Requirements: 2.2, 2.3, 2.4_

- [x] 8. Remove static schedule config file (if it exists)
  - Delete `src/config/doctorSchedules.js` if present
  - _Requirements: 7.4_

- [ ] 9. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Property tests use fast-check; unit tests use vitest
- The migration SQL is idempotent — safe to re-run
- `isDoctorWorkingDay` is a named export (not on the `db` object) so it can be imported directly in JSX files
