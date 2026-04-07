# Requirements Document

## Introduction

The Patient Vital Signs feature adds structured vital sign recording to the RCMC EMR system, tightly integrated with the consultation workflow. Vitals are recorded per-consultation/visit — each time a patient comes in, a new set of vitals is captured and linked to that specific appointment. The existing `emr.vital_signs` table (currently unused by the frontend) is activated and extended with an `appointment_id` foreign key so that each consultation's vitals can be retrieved and displayed in the medical history timeline.

Key behaviors:
- Vitals are recorded per-consultation and linked to both `patient_id` and `appointment_id`.
- The medical history timeline (MedicalHistoryTimeline.jsx and Patients.jsx) shows the vitals recorded for each specific visit.
- When a doctor opens a SOAP note, vitals already recorded for that appointment are shown; otherwise the most recent vitals from a prior visit are shown as read-only reference.
- A standalone Vital Signs panel in the patient record shows the full vitals history across all visits.
- Height and BMI are removed. The vital sign fields are: blood_pressure_systolic, blood_pressure_diastolic, heart_rate, temperature, respiratory_rate, oxygen_saturation, weight, notes.

## Glossary

- **Vital_Signs_Panel**: The UI component embedded in the patient history modal (Patients.jsx) that displays the full vitals history table and the add/edit form.
- **Vital_Signs_Form**: The shared structured form with individual input fields for each vital sign measurement. Used by both the Appointments page entry point and the Patients page entry point.
- **Vital_Signs_Record**: A single row in the `emr.vital_signs` table representing one set of measurements taken at a specific consultation visit, linked to both `patient_id` and `appointment_id`.
- **Consultation_Vitals**: The Vital_Signs_Record associated with a specific appointment/consultation.
- **Prior_Vitals_Reference**: A read-only display of the most recent Vital_Signs_Record from a previous visit, shown in the SOAP note when no vitals have been recorded for the current appointment yet.
- **SOAP_Objective_Section**: The "O - Objective" section of the SOAP note modal in Appointments.jsx. Read-only with respect to vitals — it displays vitals but does not provide a vitals entry form.
- **Medical_History_Timeline**: The MedicalHistoryTimeline.jsx component and the consultation history view in Patients.jsx that display per-visit clinical records.
- **Recorded_By**: The authenticated user (UUID) who saved the Vital_Signs_Record.
- **VitalsService**: The set of `db` methods in `supabase.js` that interact with the `emr.vital_signs` table.
- **Appointments_Vitals_Entry**: The "Record Vitals" button and associated Vital_Signs_Form modal or inline panel rendered per appointment row in Appointments.jsx. This is the primary entry point for nurses and receptionists to record vitals before the doctor sees the patient.
- **Patient_Vitals_Tab**: The "Vital Signs" tab inside the patient history modal in Patients.jsx. This is the secondary entry point, providing full vitals history and an "Add Vitals" button for recording vitals outside the appointment queue context.

---

## Requirements

### Requirement 1: Vital Signs Are Linked to Consultations

**User Story:** As a clinician, I want each set of vital signs to be associated with a specific consultation visit, so that the medical history accurately reflects what was measured on each visit date.

#### Acceptance Criteria

1. THE VitalsService SHALL store each Vital_Signs_Record with both a `patient_id` and an `appointment_id`, linking the record to the specific consultation visit.
2. WHEN a Vital_Signs_Record is inserted, THE VitalsService SHALL require a valid `appointment_id` that references an existing appointment in `emr.appointments`.
3. THE VitalsService SHALL support querying all Vital_Signs_Records for a given `patient_id`, ordered by `recorded_at` descending, to support the full history view.
4. THE VitalsService SHALL support querying the single Vital_Signs_Record for a given `appointment_id`, to support the SOAP note and medical history timeline views.
5. IF a Vital_Signs_Record already exists for a given `appointment_id`, THEN THE VitalsService SHALL update the existing record rather than inserting a duplicate.

---

### Requirement 2: Record Vital Signs via the Appointments Page (Primary Entry Point)

**User Story:** As a nurse or receptionist, I want to record a patient's vital signs directly from the appointments list before the doctor sees the patient, so that vitals are ready and linked to the correct appointment when the consultation begins.

#### Acceptance Criteria

1. WHEN an authorized user views the appointments list in Appointments.jsx, THE Appointments_Vitals_Entry SHALL render a "Record Vitals" button on each appointment row.
2. WHEN a user clicks the "Record Vitals" button on an appointment row, THE Appointments_Vitals_Entry SHALL open the Vital_Signs_Form pre-populated with the `appointment_id` and `patient_id` from that row, requiring no manual selection of patient or appointment.
3. THE Vital_Signs_Form SHALL display individual input fields for: blood pressure systolic (mmHg), blood pressure diastolic (mmHg), heart rate (bpm), temperature (°C), respiratory rate (breaths/min), oxygen saturation (%), weight (kg), and notes.
4. THE Vital_Signs_Form SHALL NOT include a height field or a BMI field.
5. WHEN a user submits the Vital_Signs_Form with at least one measurement field populated, THE VitalsService SHALL insert a new Vital_Signs_Record into `emr.vital_signs` with the `patient_id`, `appointment_id`, `recorded_at` timestamp, all provided measurements, and the authenticated user's ID as `recorded_by`.
6. IF a Vital_Signs_Record already exists for the given `appointment_id`, THEN THE VitalsService SHALL update the existing record rather than inserting a duplicate, and THE Vital_Signs_Form SHALL pre-populate with the existing values when opened.
7. IF a user submits the Vital_Signs_Form with all measurement fields empty, THEN THE Vital_Signs_Form SHALL display a validation error and SHALL NOT submit the record.
8. IF the VitalsService operation fails, THEN THE Appointments_Vitals_Entry SHALL display an error message and SHALL retain the form data so the user can retry.
9. WHEN the Vital_Signs_Form is submitted successfully from the Appointments_Vitals_Entry, THE Appointments_Vitals_Entry SHALL close the form and SHALL update the appointment row to indicate that vitals have been recorded for that appointment.

---

### Requirement 2b: Record Vital Signs via the Patient Record Modal (Secondary Entry Point)

**User Story:** As a nurse or clinician, I want to add or edit vital signs from within a patient's record modal, so that I can manage the full vitals history across all visits from a single place.

#### Acceptance Criteria

1. WHEN an authorized user opens the patient history modal in Patients.jsx and navigates to the "Vital Signs" tab, THE Patient_Vitals_Tab SHALL display the full vitals history table and an "Add Vitals" button.
2. WHEN a user clicks the "Add Vitals" button in the Patient_Vitals_Tab, THE Vital_Signs_Form SHALL open with the `patient_id` pre-populated and SHALL display a dropdown to select the appointment to link the vitals to.
3. THE appointment dropdown in the Vital_Signs_Form SHALL be filtered to show only appointments belonging to the current patient, ordered by appointment date descending.
4. WHEN a user submits the Vital_Signs_Form from the Patient_Vitals_Tab with at least one measurement field populated and an appointment selected, THE VitalsService SHALL insert or update the Vital_Signs_Record for the selected `appointment_id` and `patient_id`.
5. IF a user submits the Vital_Signs_Form from the Patient_Vitals_Tab without selecting an appointment, THEN THE Vital_Signs_Form SHALL display a validation error indicating that an appointment must be selected, and SHALL NOT submit the record.
6. IF a user submits the Vital_Signs_Form with all measurement fields empty, THEN THE Vital_Signs_Form SHALL display a validation error and SHALL NOT submit the record.
7. IF the VitalsService operation fails, THEN THE Patient_Vitals_Tab SHALL display an error message and SHALL retain the form data so the user can retry.
8. WHEN the Vital_Signs_Form is submitted successfully from the Patient_Vitals_Tab, THE Patient_Vitals_Tab SHALL refresh the history table to reflect the new or updated record.

---

### Requirement 3: View Full Vitals History in Patient Record

**User Story:** As a clinician, I want to see a patient's complete vital signs history across all visits in a structured table, so that I can track trends over time.

#### Acceptance Criteria

1. WHEN the Patient_Vitals_Tab loads for a patient, THE VitalsService SHALL fetch all Vital_Signs_Records for that patient from `emr.vital_signs`, ordered by `recorded_at` descending.
2. THE Patient_Vitals_Tab SHALL display the fetched records in a table with columns: Date/Time, BP (systolic/diastolic), HR, Temp, RR, O2 Sat, Weight, Notes, and Recorded By.
3. THE Patient_Vitals_Tab SHALL NOT display Height or BMI columns.
4. WHILE the Patient_Vitals_Tab is fetching records, THE Patient_Vitals_Tab SHALL display a loading indicator.
5. IF no Vital_Signs_Records exist for the patient, THEN THE Patient_Vitals_Tab SHALL display a message indicating no vitals have been recorded yet.

---

### Requirement 4: Medical History Timeline Shows Per-Visit Vitals

**User Story:** As a clinician, I want the medical history timeline to show the vital signs recorded for each specific consultation visit, so that I can see what the patient's condition was on each visit date.

#### Acceptance Criteria

1. WHEN the Medical_History_Timeline renders a consultation entry, THE Medical_History_Timeline SHALL display the Vital_Signs_Record associated with that consultation's `appointment_id` alongside the other consultation details.
2. THE Medical_History_Timeline SHALL display the following vitals fields per entry: BP (systolic/diastolic), heart rate, temperature, respiratory rate, oxygen saturation, and weight — each labeled with its unit.
3. THE Medical_History_Timeline SHALL NOT display height or BMI in any consultation entry.
4. IF no Vital_Signs_Record is linked to a consultation's `appointment_id`, THEN THE Medical_History_Timeline SHALL display a "No vitals recorded" indicator for that entry rather than leaving the section blank.
5. WHEN the patient history modal in Patients.jsx loads consultation history, THE VitalsService SHALL fetch the associated Vital_Signs_Record for each consultation in a single batched query to avoid N+1 requests.

---

### Requirement 5: SOAP Note Displays Consultation Vitals

**User Story:** As a doctor, I want to see the vital signs for the current appointment when I open a SOAP note, so that I have accurate, structured data available for the Objective section.

#### Acceptance Criteria

1. WHEN a doctor opens the SOAP note modal for an appointment, THE SOAP_Objective_Section SHALL first check whether a Vital_Signs_Record exists for that `appointment_id`.
2. IF a Vital_Signs_Record exists for the current `appointment_id`, THEN THE SOAP_Objective_Section SHALL display the Consultation_Vitals in a structured, labeled format showing: BP, heart rate, temperature, respiratory rate, oxygen saturation, and weight — each with its unit.
3. IF no Vital_Signs_Record exists for the current `appointment_id`, THEN THE SOAP_Objective_Section SHALL display the most recent Vital_Signs_Record from a prior visit as a Prior_Vitals_Reference, clearly labeled with the date of that prior visit and marked as read-only reference data.
4. IF no Vital_Signs_Record exists for the patient at all, THEN THE SOAP_Objective_Section SHALL display a message indicating no vitals are on file.
5. THE SOAP_Objective_Section SHALL NOT display height or BMI.
6. WHILE the SOAP_Objective_Section is fetching vitals, THE SOAP_Objective_Section SHALL display a loading indicator in place of the vitals display.
7. THE SOAP_Objective_Section SHALL continue to provide the free-text Objective textarea so the doctor can add physical examination findings and additional notes alongside the structured vitals.

---

### Requirement 6: Edit a Vital Signs Record

**User Story:** As a nurse, I want to correct a vital signs entry I recorded for a visit, so that inaccurate measurements do not persist in the patient record.

#### Acceptance Criteria

1. WHEN an authorized user clicks the edit action on a Vital_Signs_Record row in the Patient_Vitals_Tab, THE Vital_Signs_Form SHALL populate with the values from that record.
2. WHEN the user submits the populated Vital_Signs_Form, THE VitalsService SHALL update the existing Vital_Signs_Record in `emr.vital_signs` with the new values.
3. IF the VitalsService update operation fails, THEN THE Patient_Vitals_Tab SHALL display an error message and SHALL retain the edited form data.
4. THE Patient_Vitals_Tab SHALL refresh the history table after a successful edit to reflect the updated values.

---

### Requirement 7: Access Control for Vital Signs

**User Story:** As a system administrator, I want vital signs to be writable only by authorized roles, so that patient data integrity is maintained.

#### Acceptance Criteria

1. THE VitalsService SHALL allow users with roles `admin`, `doctor`, or `receptionist` to insert and update Vital_Signs_Records.
2. THE VitalsService SHALL allow all authenticated users to read Vital_Signs_Records.
3. IF an unauthenticated request attempts to read or write to `emr.vital_signs`, THEN THE VitalsService SHALL return an authorization error.
4. WHERE the user role is `receptionist`, THE Appointments_Vitals_Entry AND THE Patient_Vitals_Tab SHALL display the add and edit controls for vital signs entry.
5. WHERE the user role is `doctor`, THE Appointments_Vitals_Entry AND THE Patient_Vitals_Tab SHALL display the add and edit controls for vital signs entry.

---

### Requirement 8: Input Validation Ranges

**User Story:** As a clinician, I want the vital signs form to enforce clinically sensible input ranges, so that obviously erroneous values are caught before they are saved to the patient record.

#### Acceptance Criteria

1. THE Vital_Signs_Form SHALL enforce the following minimum and maximum input ranges for each measurement field:
   - Blood pressure systolic: 60–250 mmHg
   - Blood pressure diastolic: 40–150 mmHg
   - Heart rate: 30–250 bpm
   - Temperature: 34.0–42.0 °C
   - Respiratory rate: 8–40 breaths/min
   - Oxygen saturation: 70–100 %
   - Weight: 1–300 kg
2. WHEN a user enters a value outside the defined range for a measurement field, THE Vital_Signs_Form SHALL display an inline validation error message adjacent to that field indicating the acceptable range.
3. WHILE any measurement field contains a value outside its defined range, THE Vital_Signs_Form SHALL disable the submit button and SHALL NOT submit the record.
4. WHEN a user corrects an out-of-range value to a value within the defined range, THE Vital_Signs_Form SHALL clear the inline validation error for that field.

---

### Requirement 9: Abnormal Value Flagging

**User Story:** As a clinician, I want vital sign values that fall outside normal clinical ranges to be visually highlighted wherever vitals are displayed, so that I can quickly identify values that may require clinical attention.

#### Acceptance Criteria

1. THE Patient_Vitals_Tab, THE Medical_History_Timeline, and THE SOAP_Objective_Section SHALL each apply a visual indicator (such as a colored badge or warning icon) to any displayed vital sign value that falls outside the following normal ranges:
   - Blood pressure systolic: 90–139 mmHg
   - Blood pressure diastolic: 60–89 mmHg
   - Heart rate: 60–100 bpm
   - Temperature: 36.1–37.2 °C
   - Respiratory rate: 12–20 breaths/min
   - Oxygen saturation: 95–100 %
2. THE Patient_Vitals_Tab, THE Medical_History_Timeline, and THE SOAP_Objective_Section SHALL NOT apply an abnormal value indicator to weight values.
3. WHEN a vital sign value is within its defined normal range, THE Patient_Vitals_Tab, THE Medical_History_Timeline, and THE SOAP_Objective_Section SHALL display that value without any abnormal value indicator.

---

### Requirement 10: Delete a Vital Signs Record

**User Story:** As an authorized user, I want to delete a vital signs record from the patient's vitals history, so that erroneous or duplicate entries can be removed from the patient record.

#### Acceptance Criteria

1. WHERE the user role is `admin`, `doctor`, or `receptionist`, THE Patient_Vitals_Tab SHALL display a delete action on each Vital_Signs_Record row in the history table.
2. WHEN an authorized user activates the delete action on a Vital_Signs_Record row, THE Patient_Vitals_Tab SHALL display a confirmation prompt asking the user to confirm the deletion before proceeding.
3. WHEN the user confirms the deletion, THE VitalsService SHALL permanently remove the selected Vital_Signs_Record from `emr.vital_signs`.
4. WHEN the deletion is completed successfully, THE Patient_Vitals_Tab SHALL refresh the history table to reflect the removal of the deleted record.
5. IF the VitalsService delete operation fails, THEN THE Patient_Vitals_Tab SHALL display an error message and SHALL NOT remove the record from the history table.
6. WHEN the user cancels the confirmation prompt, THE Patient_Vitals_Tab SHALL dismiss the prompt and SHALL NOT delete the record.

---

### Requirement 11: Manual Recording Timestamp

**User Story:** As a nurse, I want to manually set the recorded date and time when entering vital signs, so that the stored timestamp accurately reflects when the measurements were actually taken rather than when the data was entered into the system.

#### Acceptance Criteria

1. THE Vital_Signs_Form SHALL include a `recorded_at` date-time input field that defaults to the current date and time when the form is opened.
2. WHEN a user modifies the `recorded_at` field, THE Vital_Signs_Form SHALL accept any valid date and time value entered by the user.
3. WHEN the Vital_Signs_Form is submitted, THE VitalsService SHALL store the `recorded_at` value as entered by the user and SHALL NOT overwrite it with the server-side insert timestamp.
4. IF the user clears the `recorded_at` field and submits the form, THEN THE Vital_Signs_Form SHALL display a validation error indicating that a recorded date and time is required, and SHALL NOT submit the record.
