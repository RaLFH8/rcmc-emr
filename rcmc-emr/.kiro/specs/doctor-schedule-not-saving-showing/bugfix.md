# Bugfix Requirements Document

## Introduction

Doctor schedules configured in the Doctors module are not reflected in the PublicBooking page. When a patient selects a doctor and a date, no available time slots are shown — regardless of whether the doctor has a schedule configured. This blocks patients from completing online bookings entirely.

The root cause is a missing argument: `PublicBooking.jsx` calls `db.getAvailableTimeSlots(doctorId, date)` without passing the doctor's `schedule` object as the required third argument. Because `getAvailableTimeSlots` immediately returns `[]` when `schedule` is `undefined`, every date appears as a non-working day. The `schedule` data is already fetched by `getActiveDoctors()` and available on `selectedDoctor.schedule` — it just isn't being forwarded.

A secondary risk is that the `schedule` JSONB column may not exist in the `doctors` table if the migration at `migrations/01-add-schedule-column.sql` has not been run, which would also prevent schedules from saving in the Doctors module.

---

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a patient selects a doctor and a date in PublicBooking THEN the system always returns an empty time slot list, even when the doctor has a configured schedule for that day

1.2 WHEN `getAvailableTimeSlots` is called without the `schedule` argument THEN the system treats every day as a non-working day and returns `[]` immediately without querying the database

1.3 WHEN a staff member saves a doctor's schedule in the Doctors module and the `schedule` column does not exist in the database THEN the system throws an error and the schedule is not persisted

### Expected Behavior (Correct)

2.1 WHEN a patient selects a doctor and a date in PublicBooking THEN the system SHALL display all available time slots generated from that doctor's configured working hours for that day

2.2 WHEN `getAvailableTimeSlots` is called with the doctor's `schedule` object THEN the system SHALL use the schedule to determine working hours and generate 20-minute slots within those hours

2.3 WHEN a staff member saves a doctor's schedule in the Doctors module and the `schedule` column exists in the database THEN the system SHALL persist the schedule JSONB and return it via `getActiveDoctors()`

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a patient selects a date that falls on a non-working day for the selected doctor THEN the system SHALL CONTINUE TO return an empty slot list and display "No available slots for this date"

3.2 WHEN a patient selects a date that is today and some slots are in the past THEN the system SHALL CONTINUE TO filter out past time slots and only show future available slots

3.3 WHEN a time slot is already booked by another patient THEN the system SHALL CONTINUE TO mark that slot as unavailable and exclude it from the displayed list

3.4 WHEN a patient completes the booking form and confirms THEN the system SHALL CONTINUE TO create the appointment record with the correct doctor, date, and time

3.5 WHEN `getActiveDoctors()` is called THEN the system SHALL CONTINUE TO return active doctors including their `id`, `first_name`, `last_name`, `specialization`, `license_number`, and `schedule` fields

---

## Bug Condition

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type BookingRequest { doctorId, date, scheduleArg }
  OUTPUT: boolean

  // Bug is triggered when getAvailableTimeSlots is called without the schedule argument
  RETURN X.scheduleArg = undefined OR X.scheduleArg = null
END FUNCTION
```

```pascal
// Property: Fix Checking — schedule argument is forwarded
FOR ALL X WHERE isBugCondition(X) AND selectedDoctor.schedule IS NOT NULL DO
  slots ← getAvailableTimeSlots'(X.doctorId, X.date, selectedDoctor.schedule)
  ASSERT slots.length > 0 OR date_is_non_working_day(selectedDoctor.schedule, X.date)
END FOR
```

```pascal
// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT getAvailableTimeSlots(X.doctorId, X.date, X.scheduleArg)
       = getAvailableTimeSlots'(X.doctorId, X.date, X.scheduleArg)
END FOR
```
