# Requirements Document

## Introduction

This feature improves the Patient Module in the RCMC EMR system (`src/pages/Patients.jsx`). The improvements span three areas: UX and table enhancements (tabbed history modal, last visit date, status badge, gender/blood type filters, CSV export, pagination), clinical data quality fixes (separating vital signs from registration, adding insurance/PhilHealth field, fixing the missing `height` field), and code cleanup (removing unused imports, fixing the hardcoded patient limit).

## Glossary

- **Patient_Module**: The `Patients.jsx` page component responsible for listing, creating, editing, and viewing patient records.
- **History_Modal**: The modal dialog that displays a patient's historical records (appointments, consultations, payments, admissions).
- **Patient_Table**: The tabular list of patients displayed on the main Patients page.
- **Filter_Bar**: The search and filter controls above the Patient_Table.
- **Vital_Signs**: Clinical measurements (weight, height, blood pressure, temperature, heart rate, respiratory rate, oxygen saturation) recorded per visit.
- **Registration_Form**: The modal form used to create or edit a patient's demographic and administrative record.
- **CSV_Export**: A downloadable comma-separated values file containing patient list data.
- **Pagination**: The mechanism for splitting the patient list into pages of a fixed size with navigation controls.
- **PhilHealth**: The Philippine national health insurance program; patients may have a PhilHealth identification number.
- **Status_Badge**: A visual indicator (Active/Inactive) shown in the Patient_Table for each patient row.
- **Last_Visit**: The date of the most recent appointment or consultation for a patient.
- **db**: The Supabase database helper object defined in `src/lib/supabase.js`.

---

## Requirements

### Requirement 1: Remove Unused Code

**User Story:** As a developer, I want unused imports and variables removed from `Patients.jsx`, so that the codebase is clean and free of lint warnings.

#### Acceptance Criteria

1. THE Patient_Module SHALL NOT import `useCallback` from React.
2. THE Patient_Module SHALL NOT destructure `userProfile` from the `useAuth` hook.

---

### Requirement 2: Fix Height Field in Form State

**User Story:** As a clinic staff member, I want the height field to be properly initialized and reset in the patient form, so that height data is never lost or incorrectly carried over between form sessions.

#### Acceptance Criteria

1. THE Registration_Form SHALL include `height: ''` in the initial `formData` state object.
2. WHEN the Registration_Form is closed via `closeModal`, THE Patient_Module SHALL reset `height` to an empty string in `formData`.
3. WHEN a patient record is edited, THE Registration_Form SHALL pre-populate the `height` field with the patient's stored height value.

---

### Requirement 3: Add Insurance / PhilHealth Number Field

**User Story:** As a clinic staff member, I want to record a patient's PhilHealth or insurance number during registration, so that billing and insurance claims can reference it.

#### Acceptance Criteria

1. THE Registration_Form SHALL include a `philhealth_number` text input field under the Contact Information section.
2. WHEN a new patient is saved, THE Patient_Module SHALL persist the `philhealth_number` value to the database.
3. WHEN an existing patient is edited, THE Registration_Form SHALL pre-populate the `philhealth_number` field with the stored value.
4. THE Registration_Form SHALL initialize `philhealth_number` to an empty string in the initial `formData` state.
5. WHEN the Registration_Form is closed via `closeModal`, THE Patient_Module SHALL reset `philhealth_number` to an empty string.

---

### Requirement 4: Separate Vital Signs from Registration Form

**User Story:** As a clinician, I want vital signs to be recorded per visit rather than as static patient fields, so that the patient's clinical history accurately reflects changes over time.

#### Acceptance Criteria

1. THE Registration_Form SHALL remove the Vital Signs section (weight, height, blood pressure, temperature, heart rate, respiratory rate, oxygen saturation) from the patient add/edit form.
2. THE Patient_Module SHALL retain height and weight as optional demographic fields in the Registration_Form, since these are semi-static anthropometric measurements.
3. WHEN a patient record is saved without vital signs fields, THE db SHALL NOT require vital signs columns to be non-null.
4. THE History_Modal SHALL display vital signs recorded within each consultation's `vital_signs` JSONB field, not as static patient-level fields.

---

### Requirement 5: Add Pagination to Patient Table

**User Story:** As a clinic staff member, I want the patient list to be paginated, so that the page loads quickly and I can navigate through large patient volumes.

#### Acceptance Criteria

1. THE Patient_Table SHALL display a maximum of 20 patients per page.
2. THE Patient_Module SHALL replace the hardcoded limit of 100 in `db.getPatients` calls with a configurable page size of 20.
3. WHEN the patient list has more than 20 results, THE Patient_Module SHALL display "Previous" and "Next" navigation buttons below the Patient_Table.
4. WHEN the user is on the first page, THE Patient_Module SHALL disable the "Previous" button.
5. WHEN the user is on the last page, THE Patient_Module SHALL disable the "Next" button.
6. WHEN the search term changes, THE Patient_Module SHALL reset the current page to 1.
7. THE Patient_Module SHALL display the current page number and total page count to the user.

---

### Requirement 6: Show Last Visit Date in Patient Table

**User Story:** As a clinic staff member, I want to see each patient's last visit date in the patient list, so that I can quickly identify patients who haven't been seen recently.

#### Acceptance Criteria

1. THE Patient_Table SHALL include a "Last Visit" column.
2. WHEN a patient has at least one appointment or consultation, THE Patient_Table SHALL display the most recent date from either source in the Last Visit column.
3. WHEN a patient has no appointments or consultations, THE Patient_Table SHALL display "No visits" in the Last Visit column.
4. THE Patient_Module SHALL derive the Last Visit date from the patient data loaded from the database without requiring a separate query per row.

---

### Requirement 7: Add Patient Status Badge

**User Story:** As a clinic staff member, I want to see a visual Active/Inactive badge for each patient in the table, so that I can immediately identify deactivated patient records.

#### Acceptance Criteria

1. THE Patient_Table SHALL display a status badge for each patient row.
2. WHEN a patient's `status` field is `'Active'`, THE Patient_Table SHALL render a green badge labeled "Active".
3. WHEN a patient's `status` field is `'Inactive'`, THE Patient_Table SHALL render a red badge labeled "Inactive".
4. THE Patient_Module SHALL include inactive patients in the list when the status badge feature is active, so staff can see deactivated records.

---

### Requirement 8: Add Gender and Blood Type Filters

**User Story:** As a clinic staff member, I want to filter the patient list by gender and blood type, so that I can quickly find patients matching specific clinical criteria.

#### Acceptance Criteria

1. THE Filter_Bar SHALL include a gender dropdown filter with options: All, Male, Female, Other.
2. THE Filter_Bar SHALL include a blood type dropdown filter with options: All, A+, A-, B+, B-, AB+, AB-, O+, O-.
3. WHEN a gender filter is selected, THE Patient_Module SHALL display only patients matching the selected gender.
4. WHEN a blood type filter is selected, THE Patient_Module SHALL display only patients matching the selected blood type.
5. WHEN both a gender and blood type filter are active simultaneously, THE Patient_Module SHALL apply both filters together.
6. WHEN a filter is reset to "All", THE Patient_Module SHALL remove that filter constraint from the query.
7. WHEN any filter changes, THE Patient_Module SHALL reset the current page to 1.

---

### Requirement 9: Add CSV Export for Patient List

**User Story:** As a clinic administrator, I want to export the current patient list to a CSV file, so that I can use the data in reports or external tools.

#### Acceptance Criteria

1. THE Patient_Module SHALL display an "Export CSV" button in the page header area.
2. WHEN the "Export CSV" button is clicked, THE Patient_Module SHALL generate a CSV file containing all patients matching the current search and filter criteria (not just the current page).
3. THE CSV_Export SHALL include the following columns: Patient Number, First Name, Last Name, Date of Birth, Gender, Blood Type, Contact Number, Email, Address, PhilHealth Number, Status.
4. THE CSV_Export SHALL use a filename in the format `patients-export-YYYY-MM-DD.csv`.
5. WHEN the CSV is generated, THE Patient_Module SHALL trigger a browser file download automatically.

---

### Requirement 10: Tabbed Navigation in History Modal

**User Story:** As a clinic staff member, I want the patient history modal to use tabs instead of a single long scroll, so that I can quickly navigate to the specific history section I need.

#### Acceptance Criteria

1. THE History_Modal SHALL display four tabs: Appointments, Consultations, Payments, Admissions.
2. WHEN the History_Modal is opened, THE History_Modal SHALL default to the Appointments tab.
3. WHEN a tab is selected, THE History_Modal SHALL display only the content for that tab.
4. THE History_Modal SHALL display a count badge on each tab showing the number of records in that section.
5. WHEN data is loading, THE History_Modal SHALL show a skeleton loader within the active tab's content area.
