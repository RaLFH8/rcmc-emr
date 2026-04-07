# Implementation Plan: Patient Vital Signs

## Overview

Activate the existing `emr.vital_signs` table and integrate structured vital sign recording into the RCMC EMR consultation workflow. Vitals are linked per-appointment, surfaced in three display locations (SOAP note, medical history timeline, patient vitals tab), and entered via two entry points (Appointments.jsx primary, Patients.jsx secondary).

## Tasks

- [x] 1. Database migration — add appointment_id column and unique index to emr.vital_signs
  - Run the following SQL in the Supabase SQL editor against the production project:
    ```sql
    ALTER TABLE emr.vital_signs
      ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES emr.appointments(id) ON DELETE SET NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS idx_vital_signs_appointment
      ON emr.vital_signs(appointment_id)
      WHERE appointment_id IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_vital_signs_appointment_lookup
      ON emr.vital_signs(appointment_id);
    ```
  - Verify the column and indexes exist before proceeding with frontend work
  - _Requirements: 1.1, 1.2, 1.5_

- [x] 2. VitalsService — add db.vitals methods to supabase.js
  - [x] 2.1 Implement db.vitals.getByPatient(patientId)
    - Query `emr.vital_signs` filtered by `patient_id`, ordered by `recorded_at` descending
    - _Requirements: 1.3, 3.1_

  - [ ]* 2.2 Write property test for getByPatient ordering (Property 2)
    - **Property 2: Patient vitals query is ordered newest-first**
    - **Validates: Requirements 1.3, 3.1**

  - [x] 2.3 Implement db.vitals.getByAppointment(appointmentId)
    - Query single record from `emr.vital_signs` where `appointment_id` matches; return null if not found
    - _Requirements: 1.4, 5.1_

  - [ ]* 2.4 Write property test for appointment vitals round-trip (Property 3)
    - **Property 3: Appointment vitals round-trip**
    - **Validates: Requirements 1.1, 1.4**

  - [x] 2.5 Implement db.vitals.getByAppointmentIds(ids)
    - Batch query `emr.vital_signs` where `appointment_id` is in the provided array
    - Return a Map of `appointmentId -> record` for O(1) lookup in the timeline
    - _Requirements: 4.5_

  - [x] 2.6 Implement db.vitals.upsert(record)
    - Use Supabase `upsert` with `onConflict: 'appointment_id'` to insert or update
    - Accept full VitalSignsRecord shape; pass `recorded_at` from the record (do not override with server time)
    - _Requirements: 1.5, 2.5, 2b.4, 11.3_

  - [ ]* 2.7 Write property test for upsert idempotence (Property 1)
    - **Property 1: Upsert idempotence — one record per appointment**
    - **Validates: Requirements 1.5, 2.6**

  - [x] 2.8 Implement db.vitals.update(id, updates)
    - Update an existing record by `id`; used by the edit flow in Patient_Vitals_Tab
    - _Requirements: 6.2_

  - [x] 2.9 Implement db.vitals.delete(id)
    - Hard-delete a record by `id`
    - _Requirements: 10.3_

  - [ ]* 2.10 Write property test for delete removes record (Property 8)
    - **Property 8: Delete removes record from patient history**
    - **Validates: Requirements 10.3**

- [ ] 3. Checkpoint — Ensure all VitalsService tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. VitalSignsBadge.jsx — new reusable abnormal value flagging component
  - [x] 4.1 Create rcmc-emr/src/components/VitalSignsBadge.jsx
    - Accept props `{ field, value }` where `field` is one of the six flagged vital sign names
    - Apply amber/red badge styling when value is outside the normal range defined in the design
    - Render plain text (no badge) when value is within normal range or null
    - Never apply a badge to `weight` regardless of value
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ]* 4.2 Write property test for abnormal value flagging (Property 5)
    - **Property 5: Abnormal value flagging is correct and complete**
    - **Validates: Requirements 9.1, 9.2, 9.3**

- [x] 5. VitalSignsForm.jsx — new shared form component
  - [x] 5.1 Create rcmc-emr/src/components/VitalSignsForm.jsx with all measurement fields
    - Render fields: `recorded_at` (datetime-local), `blood_pressure_systolic`, `blood_pressure_diastolic`, `heart_rate`, `temperature`, `respiratory_rate`, `oxygen_saturation`, `weight`, `notes`
    - Do NOT render height or BMI fields
    - Default `recorded_at` to current date/time when form opens
    - Accept props: `patientId`, `appointmentId`, `patientAppointments`, `initialValues`, `onSuccess`, `onCancel`, `mode`
    - _Requirements: 2.3, 2.4, 11.1_

  - [x] 5.2 Implement per-field validation ranges and inline error messages
    - Enforce min/max ranges from the design (systolic 60–250, diastolic 40–150, HR 30–250, temp 34–42, RR 8–40, O2 70–100, weight 1–300)
    - Show inline error adjacent to each out-of-range field on blur
    - Disable submit while any field is out of range
    - Clear error when value is corrected to within range
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ]* 5.3 Write property test for validation range enforcement (Property 4)
    - **Property 4: Validation range enforcement**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

  - [x] 5.4 Implement all-empty and missing-required-field submit guards
    - Disable submit when all measurement fields are empty
    - When `mode === 'patients'`, disable submit when no appointment is selected; show validation error
    - Disable submit when `recorded_at` is cleared; show validation error
    - _Requirements: 2.7, 2b.5, 2b.6, 11.4_

  - [x] 5.5 Implement appointment dropdown for patients mode
    - When `mode === 'patients'` and `appointmentId` is null, render a dropdown populated from `patientAppointments`
    - Filter dropdown to only appointments belonging to the current patient, ordered by `appointment_date` descending
    - _Requirements: 2b.2, 2b.3_

  - [ ]* 5.6 Write property test for appointment dropdown filtering (Property 10)
    - **Property 10: Appointment dropdown filtered to current patient**
    - **Validates: Requirements 2b.3**

  - [x] 5.7 Implement form submission — call db.vitals.upsert and handle errors
    - On submit, call `db.vitals.upsert` with all field values, `patient_id`, `appointment_id`, `recorded_at`, and `recorded_by` (auth user UUID)
    - On success, call `onSuccess()`
    - On failure, display inline error message and retain form data for retry
    - _Requirements: 2.5, 2.8, 11.3_

  - [ ]* 5.8 Write property test for recorded_at round-trip (Property 9)
    - **Property 9: recorded_at round-trip**
    - **Validates: Requirements 11.2, 11.3**

- [ ] 6. Checkpoint — Ensure all VitalSignsForm and VitalSignsBadge tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Appointments.jsx — add "Record Vitals" button and vitals-recorded indicator per row
  - [x] 7.1 Add vitals state tracking to Appointments.jsx
    - Add a `vitalsRecordedMap` state (Map of `appointmentId -> boolean`) populated by checking `db.vitals.getByAppointment` for each loaded appointment, or by a single batched fetch
    - _Requirements: 2.9_

  - [x] 7.2 Render "Record Vitals" button on each appointment row in queue view
    - Show button for users with role `admin`, `doctor`, or `receptionist`
    - Show a "Vitals Recorded" indicator (e.g., green checkmark badge) when vitals already exist for that appointment
    - _Requirements: 2.1, 2.9, 7.1, 7.4_

  - [x] 7.3 Wire "Record Vitals" button to open VitalSignsForm modal
    - On click, open a modal containing `VitalSignsForm` with `appointmentId` and `patientId` pre-populated from the row, `mode="appointments"`
    - Pre-populate `initialValues` if a vitals record already exists for the appointment
    - On success, update `vitalsRecordedMap` and close the modal
    - On failure, display error and retain form data
    - _Requirements: 2.2, 2.6, 2.8_

- [x] 8. Appointments.jsx SOAP note — replace free-text objective pre-population with structured vitals display
  - [x] 8.1 Fetch vitals for the current appointment when SOAP modal opens
    - In `handleStartConsultation`, call `db.vitals.getByAppointment(apt.id)` after opening the modal
    - Show a loading indicator in the Objective section while fetching
    - _Requirements: 5.1, 5.6_

  - [x] 8.2 Display Consultation_Vitals in the Objective section when found
    - Replace the free-text objective pre-population with a structured labeled display of BP, HR, temp, RR, O2 sat, weight — each with unit
    - Apply `VitalSignsBadge` to each value
    - Do not display height or BMI
    - Keep the free-text Objective textarea below the structured display for additional notes
    - _Requirements: 5.2, 5.5, 9.1_

  - [x] 8.3 Display Prior_Vitals_Reference when no current-appointment vitals exist
    - If `getByAppointment` returns null, call `db.vitals.getByPatient(patientId)` and take the first result
    - Display the prior record with a clear label showing the date of that prior visit and a "read-only reference" marker
    - If no vitals exist for the patient at all, display "No vitals on file"
    - _Requirements: 5.3, 5.4_

- [x] 9. Patients.jsx — add Vital Signs tab with history table and add/edit/delete controls
  - [x] 9.1 Add "Vital Signs" tab to the patient history modal tab bar
    - Add a new tab entry alongside the existing tabs (timeline, appointments, etc.)
    - Add `vitals` to the `activeHistoryTab` state options
    - _Requirements: 2b.1, 3.1_

  - [x] 9.2 Implement vitals history table in the Vital Signs tab
    - Fetch all vitals for the patient via `db.vitals.getByPatient(patientId)` when the tab is activated
    - Display a loading indicator while fetching
    - Show "No vitals recorded yet" when the array is empty
    - Render a table with columns: Date/Time, BP, HR, Temp, RR, O2 Sat, Weight, Notes, Recorded By
    - Apply `VitalSignsBadge` to each flagged value cell
    - Do not display Height or BMI columns
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 9.1_

  - [x] 9.3 Add "Add Vitals" button and wire to VitalSignsForm modal
    - Show "Add Vitals" button for roles `admin`, `doctor`, `receptionist`
    - On click, open `VitalSignsForm` with `patientId` pre-populated, `mode="patients"`, and `patientAppointments` loaded from `db.getAppointmentsByPatient`
    - On success, refresh the vitals history table
    - _Requirements: 2b.1, 2b.2, 2b.4, 7.4_

  - [x] 9.4 Add edit action per row and wire to VitalSignsForm modal
    - Render an edit icon button on each vitals row for roles `admin`, `doctor`, `receptionist`
    - On click, open `VitalSignsForm` pre-populated with the row's values (`initialValues`) and `mode="patients"`
    - On success, refresh the vitals history table
    - _Requirements: 6.1, 6.2, 6.4_

  - [ ]* 9.5 Write property test for edit pre-populates form (Property 7)
    - **Property 7: Edit pre-populates form with existing record values**
    - **Validates: Requirements 6.1**

  - [x] 9.6 Add delete action per row with confirmation prompt
    - Render a delete icon button on each vitals row for roles `admin`, `doctor`, `receptionist`
    - On click, show a confirmation prompt before proceeding
    - On confirm, call `db.vitals.delete(id)`; on success, refresh the history table
    - On failure, display error and do not remove the row
    - On cancel, dismiss the prompt without deleting
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [ ] 10. Checkpoint — Ensure all Appointments and Patients vitals tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. MedicalHistoryTimeline.jsx — add per-visit vitals display using batched fetch and VitalSignsBadge
  - [x] 11.1 Collect appointment IDs from consultation events and batch-fetch vitals
    - After `buildTimeline` collects consultation events, extract all `appointment_id` values
    - Call `db.vitals.getByAppointmentIds(ids)` once to fetch all associated vitals records
    - Store the result map in component state; do not make N individual fetches
    - If the batch fetch fails, log the error and continue rendering with "No vitals recorded" indicators
    - _Requirements: 4.1, 4.5_

  - [x] 11.2 Render per-visit vitals inline within each consultation timeline entry
    - In `renderEventDetails` for `type === 'consultation'`, add a vitals section below the existing diagnosis/notes display
    - Display BP, HR, temp, RR, O2 sat, weight — each labeled with its unit — using `VitalSignsBadge`
    - Do not display height or BMI
    - If no vitals record is linked to the consultation's `appointment_id`, display a "No vitals recorded" indicator
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 11.3 Write property test for timeline consultation entries display vitals (Property 6)
    - **Property 6: Timeline consultation entries display associated vitals**
    - **Validates: Requirements 4.1, 4.2, 4.3**

- [x] 12. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The database migration (Task 1) must be run before any frontend tasks that write vitals
- Property tests use [fast-check](https://github.com/dubzzz/fast-check) with Vitest; run with `vitest --run`
- All `db.vitals` methods follow the existing pattern in `supabase.js` — throw on Supabase error, callers catch and display inline errors
- Height and BMI are explicitly excluded from all UI and service code
