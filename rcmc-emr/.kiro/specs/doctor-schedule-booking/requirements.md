# Requirements Document

## Introduction

The online appointment booking system currently applies a single hardcoded schedule (10am–5pm, every day) to all doctors. This feature replaces that with per-doctor schedules stored directly in the `doctors` database table as a `schedule` JSONB column. The date picker only shows working days for the selected doctor, time slots are generated only within that doctor's working hours, and patients see a clear message when they pick a non-working day. The database is the single source of truth — no static config file is used.

## Glossary

- **Booking_System**: The online appointment booking page at `PublicBooking.jsx`
- **Doctor_Schedule**: The JSONB value stored in the `schedule` column of the `doctors` table, defining working days and working hours per day for one doctor
- **Time_Slot_Generator**: The `getAvailableTimeSlots(doctorId, date)` function in `supabase.js`
- **Date_Picker**: The HTML date input rendered in step 1 of the booking form
- **Working_Day**: A calendar day of the week on which a specific doctor is available, as defined in the doctor's `schedule` column
- **Working_Hours**: The start and end time (inclusive) during which a doctor accepts appointments on a given working day
- **Non_Working_Day**: A calendar day that does not appear in a doctor's Doctor_Schedule
- **Doctors_Module**: The admin-facing `Doctors.jsx` page used to manage doctor records
- **Active_Doctors_Query**: The `getActiveDoctors()` function in `supabase.js` that fetches doctors for the booking page

## Requirements

### Requirement 1: Schedule Column in the Doctors Table

**User Story:** As a clinic administrator, I want each doctor's schedule stored in the database, so that schedule changes take effect immediately without any code deployment.

#### Acceptance Criteria

1. THE doctors table in Supabase SHALL have a `schedule` column of type JSONB that stores a doctor's working days and hours.
2. THE `schedule` column SHALL use the following structure: an object where each key is a day-of-week index (0 = Sunday, 1 = Monday, … 6 = Saturday) and each value is an object with `start` (integer hour, 24-hour) and `end` (integer hour, 24-hour, exclusive).
3. THE `schedule` column SHALL allow NULL to represent doctors with no configured schedule.
4. THE doctors table SHALL be seeded with the following initial schedule values:
   - Dr. Sybil Paz de Leon-Gadon: Monday–Wednesday (10–17) and Friday–Saturday (10–17)
   - Dr. Santiago: Tuesday (15–17) and Friday (15–17)
   - Dr. Alvarez: Wednesday (16–17)
   - Dr. Rodriguez: Thursday (8–17)
5. THE migration SQL SHALL be idempotent (safe to run more than once using `IF NOT EXISTS` or equivalent guards).

### Requirement 2: Schedule Editing in the Doctors Module

**User Story:** As a clinic administrator, I want to view and edit a doctor's schedule from the Doctors management page, so that I can update working days and hours without touching the database directly.

#### Acceptance Criteria

1. WHEN an admin opens the add or edit doctor form in the Doctors_Module, THE Doctors_Module SHALL display a schedule editor showing the current working days and hours for that doctor.
2. THE schedule editor SHALL allow the admin to toggle each day of the week on or off as a working day.
3. WHEN a day is toggled on, THE schedule editor SHALL allow the admin to set a start hour and end hour for that day.
4. WHEN the admin saves the doctor record, THE Doctors_Module SHALL persist the updated `schedule` value to the `schedule` column in the doctors table.
5. WHEN a doctor record has a NULL `schedule`, THE schedule editor SHALL display all days as off (no working days configured).

### Requirement 3: Active Doctors Query Includes Schedule

**User Story:** As a developer, I want the `getActiveDoctors()` query to return the `schedule` column, so that the booking page can use schedule data without an extra database round-trip.

#### Acceptance Criteria

1. THE Active_Doctors_Query SHALL select the `schedule` column in addition to the existing fields (`id`, `first_name`, `last_name`, `specialization`, `license_number`).
2. WHEN `getActiveDoctors()` returns a doctor record, THE record SHALL include the `schedule` field (which may be NULL if not configured).
3. THE Booking_System SHALL use the `schedule` field from the doctor object returned by `getActiveDoctors()` — it SHALL NOT make a separate query to fetch schedule data.

### Requirement 4: Working-Day Filtering in the Date Picker

**User Story:** As a patient, I want the date picker to only allow me to select days when my chosen doctor is available, so that I cannot accidentally book on a day the doctor does not work.

#### Acceptance Criteria

1. WHEN a patient selects a doctor, THE Date_Picker SHALL disable all dates that are Non_Working_Days for that doctor based on the doctor's `schedule` field.
2. THE Date_Picker SHALL use the `min` attribute to prevent selection of past dates regardless of doctor schedule.
3. WHEN a doctor's `schedule` is NULL or empty, THE Date_Picker SHALL disable only weekends (Saturday and Sunday) as the default fallback (Monday–Friday available).
4. THE Booking_System SHALL expose a pure function `isDoctorWorkingDay(schedule, date)` that accepts the doctor's schedule object and a date string, and returns a boolean, so that the Date_Picker and any future UI components can reuse the same logic.
5. IF a patient changes the selected doctor after already choosing a date, THEN THE Booking_System SHALL clear the selected date and selected time slot.

### Requirement 5: Schedule-Aware Time Slot Generation

**User Story:** As a patient, I want the available time slots to reflect only the hours my chosen doctor works on the selected day, so that I am not shown slots outside the doctor's actual availability.

#### Acceptance Criteria

1. WHEN `getAvailableTimeSlots(doctorId, date)` is called, THE Time_Slot_Generator SHALL accept the doctor's `schedule` object (passed in alongside `doctorId`) and look up the working hours for the day of the week of `date`.
2. WHEN a doctor's working hours for the selected day are found in the schedule, THE Time_Slot_Generator SHALL generate 20-minute interval slots only within those working hours (start hour inclusive, end hour exclusive).
3. WHEN a doctor's `schedule` is NULL or the selected day is a Non_Working_Day, THE Time_Slot_Generator SHALL return an empty array.
4. THE Time_Slot_Generator SHALL continue to filter out already-booked slots and past time slots (for today) as it does currently.
5. THE Time_Slot_Generator SHALL NOT reference any static config file — all schedule data SHALL come from the doctor record passed to the function.
6. FOR ALL valid doctor schedules, generating slots for a Non_Working_Day SHALL produce an empty array (invariant: no slots outside working hours).

### Requirement 6: Non-Working Day Message

**User Story:** As a patient, I want to see a clear message when I select a date that is not a working day for my chosen doctor, so that I understand why no time slots are shown.

#### Acceptance Criteria

1. WHEN a patient selects a date that is a Non_Working_Day for the chosen doctor, THE Booking_System SHALL display the message: "Dr. [Name] is not available on [Day of Week]. Please select a different date."
2. WHEN a patient selects a date that is a Working_Day but all slots are booked, THE Booking_System SHALL display the message: "No available slots for this date. All slots are fully booked."
3. WHEN a patient selects a date that is a Working_Day and slots are available, THE Booking_System SHALL not display any unavailability message.
4. THE Booking_System SHALL display the non-working day message immediately upon date selection, without waiting for a network request.

### Requirement 7: Remove Static Schedule Config

**User Story:** As a developer, I want all schedule logic to read from the database, so that there is a single source of truth and no risk of the config file diverging from the database.

#### Acceptance Criteria

1. THE Booking_System SHALL NOT import or reference any static `doctorSchedules.js` config file.
2. THE Time_Slot_Generator SHALL NOT contain any hardcoded schedule data for specific doctors.
3. THE Date_Picker logic SHALL NOT contain any hardcoded schedule data for specific doctors.
4. IF a `src/config/doctorSchedules.js` file exists, THE file SHALL be removed as part of this feature implementation.
