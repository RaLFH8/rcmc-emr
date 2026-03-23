# Appointment Completed Queue Not Showing - Tasks

## Tasks

- [x] 1. Apply the fix in Appointments.jsx
  - [x] 1.1 Hoist `toLocalDateStr` to module level (before the component) and remove the duplicate definition inside the component
  - [x] 1.2 Replace `useState(new Date().toISOString().split('T')[0])` with `useState(toLocalDateStr(new Date()))` for `selectedDate`
  - [x] 1.3 Verify `formData.appointment_date` default also uses `toLocalDateStr(new Date())` for consistency

- [ ] 2. Write tests
  - [ ] 2.1 Write exploratory test confirming `selectedDate` is wrong on unfixed code when UTC date ≠ local date (Property 1 - bug condition)
  - [ ] 2.2 Write fix-checking test confirming `selectedDate` equals local date after fix (Property 1)
  - [ ] 2.3 Write preservation test confirming queue columns still filter correctly for non-buggy inputs (Property 2)
