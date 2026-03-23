# Bugfix Requirements Document

## Introduction

On the Appointments page, when an appointment is marked as "Completed" (via the consultation completion flow), it does not appear in the "Completed" column of the patient queue. The appointment disappears from "In Progress" but never shows up under "Completed", leaving staff unable to see which consultations have been finished for the day.

The root cause is a timezone mismatch in the `selectedDate` initialization. `selectedDate` is set using `new Date().toISOString().split('T')[0]`, which produces a UTC date. In timezones ahead of UTC (e.g., Philippines, UTC+8), the UTC date can be one day behind the local date. Appointments are stored with the local date, so the queue's date filter (`aptDate === selectedDate`) fails to match today's appointments — including newly completed ones — causing the Completed column to appear empty.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN an appointment is marked as "Completed" and the user's local timezone is ahead of UTC (e.g., UTC+8) THEN the system filters the queue using a UTC-based `selectedDate` that does not match the appointment's local date, causing the completed appointment to be excluded from `filteredAppointments`

1.2 WHEN the Completed column of the patient queue is rendered THEN the system shows "No completed consultations" even though appointments with status "Completed" exist for the current local date

1.3 WHEN `selectedDate` is initialized THEN the system uses `new Date().toISOString().split('T')[0]` which returns the UTC date instead of the user's local date

### Expected Behavior (Correct)

2.1 WHEN an appointment is marked as "Completed" and the appointment's date matches the current local date THEN the system SHALL display the appointment in the "Completed" column of the patient queue

2.2 WHEN the Completed column of the patient queue is rendered THEN the system SHALL show all appointments with status "Completed" whose `appointment_date` matches the current local date

2.3 WHEN `selectedDate` is initialized THEN the system SHALL use the local date (derived from `toLocalDateStr(new Date())`) so that the queue date filter correctly matches appointments stored with local dates

### Unchanged Behavior (Regression Prevention)

3.1 WHEN an appointment has status "Scheduled" or "Confirmed" and its date matches the selected local date THEN the system SHALL CONTINUE TO display it in the "Waiting" column

3.2 WHEN an appointment has status "In Progress" and its date matches the selected local date THEN the system SHALL CONTINUE TO display it in the "In Progress" column

3.3 WHEN the user navigates between dates in queue view THEN the system SHALL CONTINUE TO filter appointments by the selected date correctly

3.4 WHEN the calendar view is active THEN the system SHALL CONTINUE TO filter appointments by the selected week range without any change in behavior

3.5 WHEN a doctor role user logs in THEN the system SHALL CONTINUE TO default to queue view and filter appointments to their assigned doctor
