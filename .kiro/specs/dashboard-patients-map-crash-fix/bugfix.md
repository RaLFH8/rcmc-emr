# Bugfix Requirements Document

## Introduction

The Dashboard component crashes with `TypeError: patients.map is not a function` when loading or filtering the recent patients list. The root cause is that `db.getPatients()` returns `{ data: [...], count: N }` — an object — but Dashboard.jsx assigns the raw return value directly to the `patients` state, which is then iterated with `.map()`. This affects three call sites: `loadData()`, `handleSearchChange()`, and `handleGenderFilterChange()`.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN `loadData()` calls `db.getPatients(4, 0)` and passes the result to `setPatients(patientsData || [])` THEN the system stores `{ data: [...], count: N }` as the patients state instead of an array, causing `patients.map is not a function` crash at render time

1.2 WHEN `handleSearchChange()` calls `db.getPatients(20, 0, query)` and passes the result to `filteredResults.slice(0, 4)` THEN the system crashes because `.slice()` is not a function on the returned object, preventing the patient list from updating on search

1.3 WHEN `handleGenderFilterChange()` calls `db.getPatients(20, 0, searchQuery)` and passes the result to `filteredResults.slice(0, 4)` THEN the system crashes because `.slice()` is not a function on the returned object, preventing the patient list from updating on gender filter change

### Expected Behavior (Correct)

2.1 WHEN `loadData()` calls `db.getPatients(4, 0)` THEN the system SHALL unwrap `.data` from the result and call `setPatients(patientsData?.data || [])` so that `patients` state is always an array

2.2 WHEN `handleSearchChange()` calls `db.getPatients(20, 0, query)` THEN the system SHALL unwrap `.data` from the result before filtering and slicing, so the patient list updates correctly on search input

2.3 WHEN `handleGenderFilterChange()` calls `db.getPatients(20, 0, searchQuery)` THEN the system SHALL unwrap `.data` from the result before filtering and slicing, so the patient list updates correctly on gender filter selection

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the dashboard loads with valid patients in the database THEN the system SHALL CONTINUE TO display up to 4 recent patients in the recent patients list

3.2 WHEN a user searches for a patient by name or contact number THEN the system SHALL CONTINUE TO filter and display matching patients in real time

3.3 WHEN a user selects a gender filter THEN the system SHALL CONTINUE TO filter the patient list by the selected gender

3.4 WHEN `db.getPatients()` returns an empty data array THEN the system SHALL CONTINUE TO render an empty patients list without crashing

3.5 WHEN the dashboard exports to CSV THEN the system SHALL CONTINUE TO include the patients array data in the export correctly

---

## Bug Condition Pseudocode

**Bug Condition Function:**
```pascal
FUNCTION isBugCondition(X)
  INPUT: X — return value of db.getPatients()
  OUTPUT: boolean

  // Bug is triggered when the raw object (not .data) is passed to setPatients
  RETURN typeof X = 'object' AND X.data IS ARRAY AND NOT (X IS ARRAY)
END FUNCTION
```

**Property: Fix Checking**
```pascal
FOR ALL X WHERE isBugCondition(X) DO
  result ← setPatients(X?.data || [])
  ASSERT Array.isArray(patients) = true
  ASSERT patients.map IS FUNCTION
END FOR
```

**Property: Preservation Checking**
```pascal
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT F(X) = F'(X)  // non-buggy paths (stats, appointments, etc.) are unaffected
END FOR
```
