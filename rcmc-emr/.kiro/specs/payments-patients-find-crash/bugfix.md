# Bugfix Requirements Document

## Introduction

Clicking the Edit button on any payment record in the Payments page throws
`Uncaught TypeError: patients.find is not a function`. The same crash also
occurs in `calculateDiscount` and the queue item handler. The root cause is
that `loadData()` stores the raw return value of `db.getPatients()` — which is
`{ data: [...], count: N }` — directly into the `patients` state. Because a
plain object does not have `.find()`, every subsequent call that does
`patients.find(...)` crashes. The fix is a one-line change: destructure
`patientsData.data` before calling `setPatients`.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN `loadData()` resolves and calls `setPatients(patientsData)` THEN the
system stores `{ data: [...], count: N }` (an object) in the `patients` state
instead of a plain array.

1.2 WHEN a user clicks the Edit button on any payment record THEN the system
crashes with `Uncaught TypeError: patients.find is not a function` because
`handleEdit` calls `patients.find(...)` on the stored object.

1.3 WHEN `calculateDiscount` is invoked with any `patientId` THEN the system
crashes with `TypeError: patients.find is not a function` because the
`patients` state is an object, not an array.

1.4 WHEN a billing-queue item is selected and the queue item handler runs THEN
the system crashes with `TypeError: patients.find is not a function` for the
same reason.

### Expected Behavior (Correct)

2.1 WHEN `loadData()` resolves THEN the system SHALL store only the array
(`patientsData.data || []`) in the `patients` state.

2.2 WHEN a user clicks the Edit button on any payment record THEN the system
SHALL open the edit modal pre-populated with the correct payment data without
throwing any error.

2.3 WHEN `calculateDiscount` is invoked with any `patientId` THEN the system
SHALL successfully call `.find()` on the `patients` array and return the
correct discount calculation.

2.4 WHEN a billing-queue item is selected and the queue item handler runs THEN
the system SHALL successfully look up the patient via `.find()` and proceed
without error.

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the Payments page loads THEN the system SHALL CONTINUE TO fetch and
display the paginated list of billing records as before.

3.2 WHEN a user searches or filters payments THEN the system SHALL CONTINUE TO
apply search terms and status/date filters correctly.

3.3 WHEN a new payment is created THEN the system SHALL CONTINUE TO save the
record and refresh the list without error.

3.4 WHEN `db.getPatients()` is called from other pages (e.g. Patients page)
THEN the system SHALL CONTINUE TO return `{ data: [...], count: N }` unchanged,
as that return shape is correct and used by other consumers.

3.5 WHEN the patient list contains zero records THEN the system SHALL CONTINUE
TO render the Payments page without error, defaulting to an empty array.
