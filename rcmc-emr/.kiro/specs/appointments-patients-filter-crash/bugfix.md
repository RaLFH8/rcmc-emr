# Bugfix Requirements Document

## Introduction

The Appointments page crashes immediately on load with `TypeError: patients.filter is not a function` at line 906. This happens because `db.getPatients()` returns a paginated object `{ data: [...], count: N }`, but the Appointments component assigns the entire object to the `patients` state variable and then calls `.filter()` on it directly. Since objects don't have a `.filter()` method, the component throws and the entire Appointments page becomes unusable.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the Appointments page loads and `db.getPatients(1000)` resolves THEN the system assigns the returned `{ data, count }` object directly to the `patients` state variable instead of extracting the array

1.2 WHEN a user opens the "New Appointment" modal and the patient search dropdown renders THEN the system crashes with `TypeError: patients.filter is not a function` because `patients` is an object, not an array

### Expected Behavior (Correct)

2.1 WHEN the Appointments page loads and `db.getPatients(1000)` resolves THEN the system SHALL extract the `data` array from the response and assign it to the `patients` state variable

2.2 WHEN a user opens the "New Appointment" modal and the patient search dropdown renders THEN the system SHALL successfully call `.filter()` on the `patients` array without crashing

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the Appointments page loads THEN the system SHALL CONTINUE TO display the appointments list, calendar view, and queue view correctly

3.2 WHEN a user searches for a patient in the New Appointment modal THEN the system SHALL CONTINUE TO filter and display matching patients by name or patient number

3.3 WHEN a new appointment is submitted with an existing patient THEN the system SHALL CONTINUE TO save the appointment and update the UI optimistically

3.4 WHEN a new appointment is submitted with a new patient THEN the system SHALL CONTINUE TO create the patient record first and then save the appointment
