# Bugfix Requirements Document

## Introduction

When a patient selects a doctor and a date on the public booking page (`PublicBooking.jsx`), the UI shows "No available slots for this date. Please select another date." even when the selected date falls on a day the doctor is scheduled to work. For example, Dr. Sybil Paz de Leon-Gadon has a Mon–Wed, Fri–Sat 10:00–17:00 schedule, but selecting Monday 23 March 2026 returns zero slots.

Two defects in `getAvailableTimeSlots` (in `src/lib/supabase.js`) cause this:

1. The day-of-week is computed via `new Date(date + 'T00:00:00').getDay()`. In certain JavaScript environments this date string is parsed as local time, but the result can still be off by one day due to DST transitions or runtime differences, yielding the wrong day index and therefore no matching schedule entry.

2. The booked-times exclusion check compares generated slot strings like `"10:00"` against `appointment_time` values stored in the database as `"10:00:00"` (with seconds). Because the strings never match, every slot that should be marked booked is incorrectly treated as available — and, more critically, the inverse logic means the day-of-week bug is the primary cause of zero slots being returned.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a patient selects a date whose weekday matches a doctor's scheduled working day THEN the system returns an empty slot list and displays "No available slots for this date"

1.2 WHEN `getAvailableTimeSlots` is called with a date string such as `"2026-03-23"` THEN the system computes the day-of-week using `new Date(date + 'T00:00:00').getDay()`, which can return an incorrect day index in environments affected by DST or timezone edge cases

1.3 WHEN an appointment is stored in the database with `appointment_time` in `HH:MM:SS` format (e.g., `"10:00:00"`) THEN the system compares it against generated slot strings in `HH:MM` format (e.g., `"10:00"`), causing the comparison `bookedTimes.includes(timeStr)` to always return `false` and never correctly exclude booked slots

### Expected Behavior (Correct)

2.1 WHEN a patient selects a date whose weekday matches a doctor's scheduled working day THEN the system SHALL return the list of time slots for that working day

2.2 WHEN `getAvailableTimeSlots` is called with a date string such as `"2026-03-23"` THEN the system SHALL compute the day-of-week by parsing the date parts directly using `new Date(year, month - 1, day).getDay()`, producing the correct day index regardless of timezone or DST

2.3 WHEN an appointment is stored in the database with `appointment_time` in `HH:MM:SS` format THEN the system SHALL normalize the stored time to `HH:MM` before comparing, so that already-booked slots are correctly excluded from the available list

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a patient selects a date that does not fall on any of the doctor's scheduled working days THEN the system SHALL CONTINUE TO return an empty slot list

3.2 WHEN a patient selects today's date THEN the system SHALL CONTINUE TO exclude time slots that have already passed (based on current local time with a 20-minute buffer)

3.3 WHEN a patient selects a future date with no existing appointments THEN the system SHALL CONTINUE TO return all slots within the doctor's working hours for that day as available

3.4 WHEN a time slot has already been booked by another patient THEN the system SHALL CONTINUE TO mark that slot as unavailable so double-booking cannot occur

3.5 WHEN the doctor has no schedule configured THEN the system SHALL CONTINUE TO return an empty slot list
