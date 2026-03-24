# Implementation Tasks: Patient Module Improvements

## Tasks

- [x] 1. Run SQL migration to add philhealth_number column
  - Execute `ALTER TABLE patients ADD COLUMN IF NOT EXISTS philhealth_number TEXT;` in Supabase SQL editor
  - Verify the column exists before proceeding with code changes
  - **Files**: Supabase dashboard (manual step)

- [x] 2. Update `db.getPatients` in supabase.js
  - Add `genderFilter` and `bloodTypeFilter` parameters to the function signature
  - Remove the `.eq('status', 'Active')` filter so inactive patients are included
  - Add conditional `.eq('gender', genderFilter)` when genderFilter is non-empty
  - Add conditional `.eq('blood_type', bloodTypeFilter)` when bloodTypeFilter is non-empty
  - Add joined select for `appointments(appointment_date)` and `consultations(consultation_date)`
  - Add `{ count: 'exact' }` to the select call for pagination support
  - Compute `last_visit` client-side from joined appointment/consultation dates
  - Return `{ data, count }` instead of just `data`
  - **Files**: `rcmc-emr/src/lib/supabase.js`

- [x] 3. Add `db.getPatientsForExport` helper in supabase.js
  - Implement new function with same filter logic as `getPatients` but without `.range()`
  - Accept `searchTerm`, `genderFilter`, `bloodTypeFilter` parameters
  - Return all matching patients (no pagination limit)
  - **Files**: `rcmc-emr/src/lib/supabase.js`

- [x] 4. Code cleanup in Patients.jsx
  - Remove `useCallback` from the React import
  - Remove `userProfile` destructuring from `useAuth()`
  - **Files**: `rcmc-emr/src/pages/Patients.jsx`

- [x] 5. Fix formData state — add height and philhealth_number, remove vital signs
  - Add `height: ''` and `philhealth_number: ''` to the initial `formData` state object
  - Remove `blood_pressure`, `temperature`, `heart_rate`, `respiratory_rate`, `oxygen_saturation` from `formData`
  - Update `closeModal` to reset `height` and `philhealth_number` to `''`
  - Update `handleEdit` to pre-populate `height` and `philhealth_number` from the patient record
  - **Files**: `rcmc-emr/src/pages/Patients.jsx`

- [x] 6. Add pagination state and update loadPatients
  - Add `PAGE_SIZE = 20` constant
  - Add `currentPage`, `totalCount` state variables
  - Update `loadPatients` to pass `PAGE_SIZE`, `offset`, `searchTerm`, `genderFilter`, `bloodTypeFilter` to `db.getPatients`
  - Destructure `{ data, count }` from `db.getPatients` and set both `patients` and `totalCount`
  - Reset `currentPage` to 1 when `searchTerm`, `genderFilter`, or `bloodTypeFilter` changes
  - **Files**: `rcmc-emr/src/pages/Patients.jsx`

- [x] 7. Add gender and blood type filter state
  - Add `genderFilter` and `bloodTypeFilter` state variables (default `''`)
  - Include both in the `useEffect` dependency array that triggers `loadPatients`
  - Reset `currentPage` to 1 when either filter changes
  - **Files**: `rcmc-emr/src/pages/Patients.jsx`

- [x] 8. Add CSV export handler
  - Implement `handleExportCSV` async function
  - Call `db.getPatientsForExport(searchTerm, genderFilter, bloodTypeFilter)`
  - Build CSV string with headers: Patient Number, First Name, Last Name, Date of Birth, Gender, Blood Type, Contact Number, Email, Address, PhilHealth Number, Status
  - Generate filename as `patients-export-YYYY-MM-DD.csv` using today's date
  - Trigger browser download via Blob + hidden anchor element
  - Wrap in try/catch; show `alert('Failed to export patients')` on error
  - **Files**: `rcmc-emr/src/pages/Patients.jsx`

- [x] 9. Add activeHistoryTab state for tabbed history modal
  - Add `activeHistoryTab` state variable defaulting to `'appointments'`
  - Reset `activeHistoryTab` to `'appointments'` when `handleViewHistory` is called
  - **Files**: `rcmc-emr/src/pages/Patients.jsx`

- [x] 10. Update the render — Filter Bar
  - Add gender dropdown with options: All, Male, Female, Other
  - Add blood type dropdown with options: All, A+, A-, B+, B-, AB+, AB-, O+, O-
  - Wire both dropdowns to their respective state variables
  - **Files**: `rcmc-emr/src/pages/Patients.jsx`

- [x] 11. Update the render — Patient Table
  - Add "Last Visit" column header and cell (display `last_visit` formatted as a date, or "No visits")
  - Add Status badge cell: green badge for Active, red badge for Inactive
  - **Files**: `rcmc-emr/src/pages/Patients.jsx`

- [x] 12. Update the render — Pagination controls
  - Add "Previous" and "Next" buttons below the patient table
  - Disable "Previous" when `currentPage === 1`
  - Disable "Next" when `currentPage === totalPages`
  - Display current page and total pages (e.g. "Page 2 of 5")
  - Hide pagination controls when `totalPages <= 1`
  - **Files**: `rcmc-emr/src/pages/Patients.jsx`

- [x] 13. Update the render — Registration Modal form fields
  - Add PhilHealth Number text input under Contact Information section
  - Remove the Vital Signs section (blood_pressure, temperature, heart_rate, respiratory_rate, oxygen_saturation inputs)
  - Ensure height and weight inputs remain as demographic fields
  - **Files**: `rcmc-emr/src/pages/Patients.jsx`

- [x] 14. Update the render — Export CSV button in header
  - Add "Export CSV" button next to the "Add Patient" button in the page header
  - Wire it to `handleExportCSV`
  - **Files**: `rcmc-emr/src/pages/Patients.jsx`

- [x] 15. Update the render — Tabbed History Modal
  - Replace the single-scroll history layout with four tabs: Appointments, Consultations, Payments, Admissions
  - Add count badge on each tab showing the length of the corresponding data array
  - Show only the active tab's content; hide others
  - Show `SkeletonLoader` inside the active tab when `loadingConsultations` is true
  - Default to Appointments tab when modal opens
  - **Files**: `rcmc-emr/src/pages/Patients.jsx`

- [x] 16. Write property-based tests
  - Set up test file at `rcmc-emr/src/tests/patient-module-improvements.test.js`
  - Install or verify `fast-check` is available
  - Implement unit tests: closeModal resets height and philhealth_number, handleEdit pre-populates fields, CSV header columns, CSV filename format, History Modal defaults to Appointments tab, Previous button disabled on page 1, Next button disabled on last page, "No visits" for patient with no history
  - Implement property-based tests for all 17 properties defined in the design document using `fc.assert(fc.property(...))`
  - **Files**: `rcmc-emr/src/tests/patient-module-improvements.test.js`
