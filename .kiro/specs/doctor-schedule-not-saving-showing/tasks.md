# Doctor Schedule Not Saving/Showing — Tasks

## Tasks

- [ ] 1. Run exploratory test to confirm bug
  - Call `db.getAvailableTimeSlots(doctorId, workingDayDate)` without the schedule argument and assert it returns `[]`
  - Confirms Property 1 is violated on unfixed code
  - **File**: `rcmc-emr/src/tests/doctor-schedule-slots-bug-exploration.test.js`

- [x] 2. Apply the one-line fix in PublicBooking.jsx
  - In `loadTimeSlots`, change `db.getAvailableTimeSlots(selectedDoctor.id, selectedDate)` to `db.getAvailableTimeSlots(selectedDoctor.id, selectedDate, selectedDoctor.schedule)`
  - **File**: `rcmc-emr/src/pages/PublicBooking.jsx`

- [ ] 3. Run fix-checking tests
  - Verify that with the fix applied, working days return non-empty slot arrays and non-working days return `[]`
  - **File**: `rcmc-emr/src/tests/doctor-schedule-slots-fix.test.js`

- [ ] 4. Run preservation tests
  - Verify that past-time filtering, booked-slot exclusion, and non-working-day handling are unchanged
  - **File**: `rcmc-emr/src/tests/doctor-schedule-slots-preservation.test.js`

- [ ] 5. Run the database migration (manual step)
  - Execute `rcmc-emr/.kiro/specs/doctor-schedule-booking/migrations/01-add-schedule-column.sql` in the Supabase SQL Editor to ensure the `schedule` JSONB column exists in the `doctors` table
