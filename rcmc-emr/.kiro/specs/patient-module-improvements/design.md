# Design Document: Patient Module Improvements

## Overview

This document describes the technical design for improving the Patient Module (`src/pages/Patients.jsx`) in the RCMC EMR system. The changes span three areas:

1. **Code cleanup** — remove unused imports, fix the missing `height` field in form state
2. **Clinical data quality** — add PhilHealth number field, separate vital signs from registration
3. **UX enhancements** — pagination, last visit column, status badge, gender/blood type filters, CSV export, tabbed history modal

All changes are confined to `src/pages/Patients.jsx` and `src/lib/supabase.js`, with a SQL migration to add the `philhealth_number` column to the `patients` table.

---

## Architecture

The Patient Module follows the existing pattern in this codebase: a single-file React page component that calls the `db` helper object from `src/lib/supabase.js`. No new files or components are introduced; all logic stays in-component.

```
Patients.jsx
  ├── State: patients[], loading, searchTerm, genderFilter, bloodTypeFilter
  ├── State: currentPage, totalCount, PAGE_SIZE=20
  ├── State: showModal, editingPatient, formData (with height, philhealth_number)
  ├── State: showHistoryModal, viewingPatient, activeHistoryTab
  ├── State: consultations[], appointments[], payments[], admissions[]
  │
  ├── loadPatients() → db.getPatients(limit, offset, search, gender, bloodType)
  ├── handleSubmit() → db.addPatient / db.updatePatient
  ├── handleEdit() → pre-populate formData including height, philhealth_number
  ├── closeModal() → reset formData including height, philhealth_number
  ├── handleExportCSV() → fetch all filtered patients, generate CSV, trigger download
  │
  └── Render
        ├── Header (Add Patient button, Export CSV button)
        ├── Filter Bar (search, gender dropdown, blood type dropdown)
        ├── Patient Table (with Last Visit column, Status badge)
        ├── Pagination controls
        ├── Registration Modal (without vital signs section, with height/weight/philhealth_number)
        └── History Modal (tabbed: Appointments | Consultations | Payments | Admissions)
```

```
supabase.js db.getPatients(limit, offset, searchTerm, genderFilter, bloodTypeFilter)
  ├── Removes .eq('status', 'Active') filter (to show all statuses)
  ├── Adds optional .eq('gender', genderFilter) when genderFilter is set
  ├── Adds optional .eq('blood_type', bloodTypeFilter) when bloodTypeFilter is set
  ├── Joins appointments and consultations to compute last_visit
  └── Returns { data, count } for pagination
```

---

## Components and Interfaces

### `db.getPatients` (updated signature)

```js
async getPatients(limit = 20, offset = 0, searchTerm = '', genderFilter = '', bloodTypeFilter = '')
```

Returns an array of patient objects. Each patient object includes a computed `last_visit` field (ISO date string or `null`).

**Strategy for `last_visit`**: Use a Supabase select with a subquery alias. The cleanest approach for Supabase PostgREST is to fetch patients with their most recent appointment and consultation dates using a joined select, then compute `last_visit` client-side from the two joined arrays. This avoids a separate per-row query.

```js
// Fetch patients with their most recent appointment date and consultation date
const { data, error, count } = await supabase
  .from('patients')
  .select(`
    *,
    appointments(appointment_date),
    consultations(consultation_date)
  `, { count: 'exact' })
  // filters applied here
  .range(offset, offset + limit - 1)

// Compute last_visit per patient client-side
return data.map(p => {
  const apptDates = (p.appointments || []).map(a => a.appointment_date)
  const consultDates = (p.consultations || []).map(c => c.consultation_date?.split('T')[0])
  const allDates = [...apptDates, ...consultDates].filter(Boolean).sort().reverse()
  return { ...p, last_visit: allDates[0] || null }
})
```

**Note on status filter**: Requirement 7.4 requires inactive patients to be visible. The `.eq('status', 'Active')` filter is removed from `getPatients`. The existing `deletePatient` soft-delete (sets status to Inactive) is preserved.

**Note on count**: The `{ count: 'exact' }` option is added so the component can compute total pages without a separate count query.

### `db.getPatientsForExport` (new helper)

```js
async getPatientsForExport(searchTerm = '', genderFilter = '', bloodTypeFilter = '')
```

Fetches all matching patients (no pagination) for CSV export. Reuses the same filter logic as `getPatients` but without `.range()`.

### Registration Form (`formData` shape)

```js
{
  first_name: '', last_name: '', date_of_birth: '', gender: '',
  contact_number: '', email: '', address: '',
  blood_type: '', allergies: '', medical_history: '',
  emergency_contact_name: '', emergency_contact_number: '',
  philhealth_number: '',   // NEW
  height: '',              // FIXED (was missing from initial state)
  weight: ''               // retained as demographic field
  // blood_pressure, temperature, heart_rate, respiratory_rate, oxygen_saturation REMOVED
}
```

### History Modal Tab State

```js
const [activeHistoryTab, setActiveHistoryTab] = useState('appointments')
// values: 'appointments' | 'consultations' | 'payments' | 'admissions'
```

### CSV Export

The `handleExportCSV` function:
1. Calls `db.getPatientsForExport(searchTerm, genderFilter, bloodTypeFilter)`
2. Builds a CSV string with headers and rows
3. Creates a `Blob`, generates an object URL, creates a hidden `<a>` element, sets `download` attribute to `patients-export-YYYY-MM-DD.csv`, clicks it, then revokes the URL

---

## Data Models

### `patients` table — SQL migration required

```sql
ALTER TABLE patients ADD COLUMN IF NOT EXISTS philhealth_number TEXT;
```

No other schema changes are needed. The vital signs columns (`blood_pressure`, `temperature`, `heart_rate`, `respiratory_rate`, `oxygen_saturation`) already exist on the table and are simply no longer written from the registration form — they remain nullable, so no migration is needed to remove them.

The `height` and `weight` columns already exist and remain as demographic fields.

### Patient object shape (after `getPatients`)

```ts
{
  id: string
  patient_number: string
  first_name: string
  last_name: string
  date_of_birth: string        // ISO date
  gender: 'Male' | 'Female' | 'Other'
  contact_number: string
  email: string | null
  address: string
  blood_type: string | null
  allergies: string[]
  medical_history: string | null
  philhealth_number: string | null   // new
  height: number | null
  weight: number | null
  status: 'Active' | 'Inactive'
  last_visit: string | null          // computed, ISO date
  appointments: { appointment_date: string }[]   // joined, used for last_visit
  consultations: { consultation_date: string }[] // joined, used for last_visit
}
```

### Pagination state

```js
const PAGE_SIZE = 20
const [currentPage, setCurrentPage] = useState(1)
const [totalCount, setTotalCount] = useState(0)
const totalPages = Math.ceil(totalCount / PAGE_SIZE)
const offset = (currentPage - 1) * PAGE_SIZE
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Form reset clears all fields

*For any* set of values entered into the registration form, closing the modal via `closeModal` should result in every field in `formData` (including `height` and `philhealth_number`) being reset to its initial empty string value.

**Validates: Requirements 2.2, 3.5**

### Property 2: Edit pre-populates all stored fields

*For any* patient record stored in the database, invoking `handleEdit` with that patient should result in `formData` containing values that match the patient's stored `height` and `philhealth_number` fields.

**Validates: Requirements 2.3, 3.3**

### Property 3: PhilHealth number round-trip persistence

*For any* non-empty `philhealth_number` string, saving a new patient with that value and then reading the patient back from the database should return the same `philhealth_number` value.

**Validates: Requirements 3.2**

### Property 4: Saving a patient without vital signs succeeds

*For any* patient record that omits `blood_pressure`, `temperature`, `heart_rate`, `respiratory_rate`, and `oxygen_saturation`, calling `db.addPatient` or `db.updatePatient` should not throw an error.

**Validates: Requirements 4.3**

### Property 5: Patient table never exceeds page size

*For any* dataset of patients and any page number, the number of rows rendered in the Patient_Table should be at most `PAGE_SIZE` (20).

**Validates: Requirements 5.1**

### Property 6: Pagination controls appear for large datasets

*For any* dataset with more than `PAGE_SIZE` patients, the rendered component should include both "Previous" and "Next" navigation buttons.

**Validates: Requirements 5.3**

### Property 7: Page resets to 1 on search or filter change

*For any* current page greater than 1, changing the search term or any filter dropdown should reset `currentPage` to 1.

**Validates: Requirements 5.6, 8.7**

### Property 8: Last visit is the maximum date across appointments and consultations

*For any* patient with at least one appointment or consultation, the `last_visit` value computed by `getPatients` should equal the maximum date across all of that patient's `appointment_date` and `consultation_date` values.

**Validates: Requirements 6.2**

### Property 9: Status badge matches patient status field

*For any* patient in the rendered table, the status badge label and color class should correspond exactly to the patient's `status` field: green + "Active" for `'Active'`, red + "Inactive" for `'Inactive'`.

**Validates: Requirements 7.2, 7.3**

### Property 10: Inactive patients appear in the list

*For any* dataset that includes patients with `status = 'Inactive'`, those patients should appear in the results returned by `db.getPatients` (i.e., no status filter is applied by default).

**Validates: Requirements 7.4**

### Property 11: Gender filter returns only matching patients

*For any* gender filter value (Male, Female, or Other) and any dataset, every patient returned by `db.getPatients` should have a `gender` field equal to the selected filter value.

**Validates: Requirements 8.3**

### Property 12: Blood type filter returns only matching patients

*For any* blood type filter value and any dataset, every patient returned by `db.getPatients` should have a `blood_type` field equal to the selected filter value.

**Validates: Requirements 8.4**

### Property 13: Resetting a filter to "All" removes the constraint

*For any* filter that was previously set to a specific value, resetting it to "All" should result in `db.getPatients` returning patients regardless of that field's value.

**Validates: Requirements 8.6**

### Property 14: CSV export contains all filtered patients and correct columns

*For any* filter state, the CSV generated by `handleExportCSV` should: (a) contain a row for every patient matching the current filters regardless of pagination, (b) include exactly the columns: Patient Number, First Name, Last Name, Date of Birth, Gender, Blood Type, Contact Number, Email, Address, PhilHealth Number, Status, and (c) use a filename matching `patients-export-YYYY-MM-DD.csv`.

**Validates: Requirements 9.2, 9.3, 9.4**

### Property 15: Active tab content is exclusively shown

*For any* selected tab in the History_Modal, only the content section for that tab should be visible; the content sections for all other tabs should not be rendered.

**Validates: Requirements 10.3**

### Property 16: Tab count badges match data array lengths

*For any* patient history data loaded into the History_Modal, the count badge on each tab should equal the length of the corresponding data array (appointments, consultations, payments, admissions).

**Validates: Requirements 10.4**

### Property 17: Loading state shows skeleton in active tab

*For any* state where `loadingConsultations` is `true`, the active tab's content area should render a `SkeletonLoader` component rather than the data list.

**Validates: Requirements 10.5**

---

## Error Handling

- `loadPatients`: catches errors, logs to console, shows `alert`. Existing pattern is preserved.
- `handleSubmit`: catches errors, shows `alert` with `error.message`. Existing pattern is preserved.
- `handleExportCSV`: wraps in try/catch; on failure shows `alert('Failed to export patients')`.
- `handleViewHistory`: catches errors, sets all history arrays to `[]`. Existing pattern is preserved.
- `db.getPatients` with joined select: if the join returns no data for `appointments` or `consultations`, those arrays default to `[]` before computing `last_visit`.
- `db.getPatientsForExport`: same error handling as `getPatients`.

---

## Testing Strategy

### Unit Tests

Unit tests cover specific examples, edge cases, and integration points:

- Verify `closeModal` resets `formData.height` and `formData.philhealth_number` to `''`
- Verify `handleEdit` pre-populates `height` and `philhealth_number` from a patient object
- Verify the CSV header row contains all required columns
- Verify the CSV filename format matches `patients-export-YYYY-MM-DD.csv`
- Verify the History_Modal defaults to the Appointments tab on open
- Verify the "Previous" button is disabled when `currentPage === 1`
- Verify the "Next" button is disabled when `currentPage === totalPages`
- Verify "No visits" is displayed for a patient with no appointments or consultations

### Property-Based Tests

Property tests use **fast-check** (already available in the JS ecosystem, compatible with Vitest) to verify universal properties across randomly generated inputs. Each test runs a minimum of 100 iterations.

**Configuration:**
```js
import fc from 'fast-check'
// Each test: fc.assert(fc.property(...), { numRuns: 100 })
```

**Tests to implement:**

| Property | Test description | Tag |
|---|---|---|
| Property 1 | For any formData values, closeModal resets all fields to '' | Feature: patient-module-improvements, Property 1: form reset clears all fields |
| Property 2 | For any patient object, handleEdit sets formData.height and philhealth_number | Feature: patient-module-improvements, Property 2: edit pre-populates all stored fields |
| Property 3 | For any philhealth_number string, addPatient then getPatientById returns same value | Feature: patient-module-improvements, Property 3: PhilHealth number round-trip persistence |
| Property 4 | For any patient without vital signs, addPatient does not throw | Feature: patient-module-improvements, Property 4: saving without vital signs succeeds |
| Property 5 | For any patients array, rendered table rows ≤ PAGE_SIZE | Feature: patient-module-improvements, Property 5: table never exceeds page size |
| Property 6 | For any totalCount > PAGE_SIZE, pagination buttons are rendered | Feature: patient-module-improvements, Property 6: pagination controls appear for large datasets |
| Property 7 | For any currentPage > 1, changing searchTerm or filter resets page to 1 | Feature: patient-module-improvements, Property 7: page resets on search or filter change |
| Property 8 | For any patient with appointments/consultations, last_visit equals max date | Feature: patient-module-improvements, Property 8: last visit is maximum date |
| Property 9 | For any patient status value, badge label and color class match | Feature: patient-module-improvements, Property 9: status badge matches patient status |
| Property 10 | For any dataset including inactive patients, they appear in getPatients results | Feature: patient-module-improvements, Property 10: inactive patients appear in list |
| Property 11 | For any gender filter, all returned patients match that gender | Feature: patient-module-improvements, Property 11: gender filter returns only matching patients |
| Property 12 | For any blood type filter, all returned patients match that blood type | Feature: patient-module-improvements, Property 12: blood type filter returns only matching patients |
| Property 13 | For any filter reset to All, results are unfiltered by that field | Feature: patient-module-improvements, Property 13: resetting filter removes constraint |
| Property 14 | For any filter state, CSV contains all matching patients with correct columns and filename | Feature: patient-module-improvements, Property 14: CSV export correctness |
| Property 15 | For any selected tab, only that tab's content is visible | Feature: patient-module-improvements, Property 15: active tab content exclusively shown |
| Property 16 | For any history data, tab count badges equal array lengths | Feature: patient-module-improvements, Property 16: tab count badges match data lengths |
| Property 17 | For any loading=true state, active tab shows SkeletonLoader | Feature: patient-module-improvements, Property 17: loading state shows skeleton |

Each property-based test must be implemented as a single `fc.assert(fc.property(...))` call referencing the property number in a comment.
