# Bugfix Requirements Document

## Introduction

This document addresses a critical bug in the SOAP note persistence workflow within the Appointments page. Currently, when a doctor enters SOAP notes (Subjective, Objective, Assessment, Plan) in the "Start Consultation" modal and clicks "Save & Continue", the data is stored only in React component state. When the doctor later clicks "Complete" to open the "Review & Complete Consultation" modal, the SOAP notes display "Not recorded" instead of showing the previously entered data.

The root cause is that SOAP data is stored in the `soapData` React state variable but is never persisted to the database during the "Save & Continue" action. If the component re-renders or the `loadData()` function is called (which happens after status updates), the state is reset and the SOAP notes are lost.

This bug impacts the clinical workflow by forcing doctors to re-enter SOAP notes or complete consultations without proper documentation, which is unacceptable in a healthcare setting.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a doctor fills in SOAP notes (Subjective, Objective, Assessment, Plan) in the "Start Consultation" modal and clicks "Save & Continue" THEN the system only updates the appointment status to "In Progress" without persisting the SOAP data to the database

1.2 WHEN the appointment status is updated to "In Progress" and `loadData()` is called THEN the system reloads all appointments from the database, causing the component to re-render and the `soapData` state to reset to its initial empty values

1.3 WHEN a doctor clicks "Complete" on an "In Progress" appointment to open the "Review & Complete Consultation" modal THEN the system displays "Not recorded" for all SOAP fields instead of showing the previously entered data

1.4 WHEN the component re-renders for any reason (status changes, data refresh, navigation) THEN the system loses all SOAP data stored in the `soapData` React state variable

### Expected Behavior (Correct)

2.1 WHEN a doctor fills in SOAP notes in the "Start Consultation" modal and clicks "Save & Continue" THEN the system SHALL persist the SOAP data to the database (either in the appointments table or a related table) before updating the appointment status to "In Progress"

2.2 WHEN the "Review & Complete Consultation" modal is opened for an "In Progress" appointment THEN the system SHALL retrieve and display the previously saved SOAP notes from the database

2.3 WHEN the component re-renders or `loadData()` is called THEN the system SHALL maintain access to the SOAP notes by loading them from the database rather than relying on component state

2.4 WHEN a doctor completes a consultation THEN the system SHALL save the SOAP notes to the consultations table as part of the permanent medical record

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a doctor opens the "Start Consultation" modal for a waiting patient THEN the system SHALL CONTINUE TO pre-populate the Subjective field with the appointment reason

3.2 WHEN a doctor clicks "Save & Continue" in the SOAP modal THEN the system SHALL CONTINUE TO update the appointment status to "In Progress" and move the patient to the "In Progress" column

3.3 WHEN a doctor completes a consultation THEN the system SHALL CONTINUE TO create a consultation record in the consultations table with all SOAP data formatted in the notes field

3.4 WHEN a doctor cancels the SOAP modal without saving THEN the system SHALL CONTINUE TO discard the entered data and not update the appointment status

3.5 WHEN appointments are loaded or refreshed THEN the system SHALL CONTINUE TO display all appointments grouped by status in the queue view

3.6 WHEN a doctor clicks "Prescribe" from the "In Progress" column THEN the system SHALL CONTINUE TO navigate to the Prescriptions page with the patient ID stored in sessionStorage
