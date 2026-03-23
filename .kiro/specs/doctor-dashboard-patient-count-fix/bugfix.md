# Bugfix Requirements Document

## Introduction

The doctor's dashboard "Total Patient" stat card displays the count of ALL active patients in the database, regardless of which doctor is logged in. This means every doctor sees the same inflated number — the entire patient population — rather than only the patients they have personally seen or consulted. The fix must scope this count to the logged-in doctor's own patients (via appointments or consultations) while leaving all other dashboard behavior and the Patients module unchanged.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a doctor logs in and views the dashboard THEN the system displays the total count of ALL active patients in the database as the "Total Patient" stat card value

1.2 WHEN multiple doctors are logged in simultaneously THEN the system shows the same "Total Patient" count to every doctor regardless of their individual patient history

### Expected Behavior (Correct)

2.1 WHEN a doctor logs in and views the dashboard THEN the system SHALL display only the count of distinct patients that doctor has personally seen, derived from appointments or consultations linked to that doctor's `doctor_id`

2.2 WHEN an admin or receptionist logs in and views the dashboard THEN the system SHALL display the total count of ALL active patients (existing behavior preserved for non-doctor roles)

### Unchanged Behavior (Regression Prevention)

3.1 WHEN any user navigates to the Patients module THEN the system SHALL CONTINUE TO display and allow searching of ALL patients in the database regardless of the logged-in user's role

3.2 WHEN an admin views the dashboard THEN the system SHALL CONTINUE TO show the full total patient count across all doctors

3.3 WHEN a doctor views the dashboard THEN the system SHALL CONTINUE TO display all other stat cards (Total Doctor, Book Appointment, Room Availability) with their existing values unchanged

3.4 WHEN the dashboard refresh button is clicked THEN the system SHALL CONTINUE TO reload all stat card data correctly, including the now-scoped patient count for doctors
