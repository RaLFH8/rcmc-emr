# Reports Analytics White Screen Fix - Bugfix Design

## Overview

The Analytics Dashboard displays a white screen due to three critical issues: (1) the `formatDatePH()` function produces invalid dates like "2026-27-02" by incorrectly parsing locale-formatted dates, (2) Date objects with timezone strings are passed directly to Supabase queries causing "time zone not recognized" errors, and (3) queries attempt to access non-existent database columns `satisfaction_ratings.overall_rating` and `consultations.outcome`. The fix involves correcting the date formatting logic to use ISO 8601 format, ensuring all dates are converted to strings before database queries, and updating queries to use existing columns or calculate derived values from available data.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the white screen - when date formatting produces invalid dates, timezone strings are passed to queries, or non-existent columns are accessed
- **Property (P)**: The desired behavior - Analytics Dashboard displays correctly with valid date queries and proper column access
- **Preservation**: Existing date handling in other modules and chart rendering functionality that must remain unchanged
- **formatDatePH()**: The function in `src/services/analyticsService.js` that converts dates to Philippine timezone format for database queries
- **ISO 8601**: Standard date format (YYYY-MM-DD) required by PostgreSQL/Supabase
- **satisfaction_ratings**: Database table with columns: professionalism_rating, waiting_time_rating, cleanliness_rating (no overall_rating column)
- **consultations**: Database table with columns: chief_complaint, diagnosis, prescription, notes (no outcome column)

## Bug Details

### Fault Condition

The bug manifests when the Analytics Dashboard attempts to fetch data using improperly formatted dates or non-existent database columns. The `formatDatePH()` function uses `toLocaleDateString()` which produces dates like "02/27/2026" (MM/DD/YYYY), then reverses them to "2026/27/02", creating invalid month values. Additionally, Date objects with timezone strings like "Sun Mar 01 2026 00:00:00 GMT+0800" are passed directly to Supabase, and queries reference columns that don't exist in the database schema.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { dateRange: { startDate: Date|String, endDate: Date|String } }
  OUTPUT: boolean
  
  RETURN (formatDatePH(input.dateRange.startDate) produces invalid date format)
         OR (input.dateRange.startDate is Date object with timezone string)
         OR (input.dateRange.endDate is Date object with timezone string)
         OR (query accesses 'satisfaction_ratings.overall_rating' column)
         OR (query accesses 'consultations.outcome' column)
END FUNCTION
```

### Examples

- **Invalid Date Format**: `formatDatePH(new Date('2026-02-27'))` produces "2026-27-02" (month 27 invalid) → PostgreSQL error: "date/time field value out of range"
- **Timezone String**: Passing `new Date('2026-03-01')` directly to query → PostgreSQL error: "time zone 'gmt+0800' not recognized"
- **Missing Column**: Query `satisfaction_ratings.overall_rating` → PostgreSQL error: "column satisfaction_ratings.overall_rating does not exist"
- **Missing Column**: Query `consultations.outcome` → PostgreSQL error: "column consultations.outcome does not exist"
- **Expected Behavior**: `formatDatePH(new Date('2026-02-27'))` should produce "2026-02-27" (valid ISO 8601 format)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Date filtering logic for analytics queries must continue to work with the selected time period
- Chart rendering and metric display formatting must remain unchanged
- Other Reports module tabs (if any) must continue to function normally
- Date handling in other modules (Appointments, Consultations, Patients) must remain unaffected

**Scope:**
All inputs that do NOT involve Analytics Dashboard date queries should be completely unaffected by this fix. This includes:
- Date pickers and date range selectors in other modules
- Appointment scheduling date logic
- Consultation date recording
- Patient registration date handling

## Hypothesized Root Cause

Based on the bug description and code analysis, the most likely issues are:

1. **Incorrect Date Formatting Logic**: The `formatDatePH()` function uses `toLocaleDateString('en-PH')` which returns MM/DD/YYYY format, then reverses it assuming DD/MM/YYYY format, resulting in invalid dates like "2026-27-02"
   - The function splits by '/' and reverses: `['02', '27', '2026'].reverse()` → `['2026', '27', '02']`
   - This creates month values > 12 which are invalid

2. **Date Object to String Conversion**: Date objects are passed directly to Supabase queries without converting to ISO 8601 strings
   - Supabase/PostgreSQL receives: "Sun Mar 01 2026 00:00:00 GMT+0800 (Taiwan Standard Time)"
   - PostgreSQL tries to parse the timezone "GMT+0800" and fails

3. **Schema Mismatch - satisfaction_ratings**: The query accesses `overall_rating` column which doesn't exist
   - Actual schema has: `professionalism_rating`, `waiting_time_rating`, `cleanliness_rating`
   - Need to calculate average from these three columns

4. **Schema Mismatch - consultations**: The query accesses `outcome` column which doesn't exist
   - Actual schema has: `chief_complaint`, `diagnosis`, `prescription`, `notes`
   - Need to derive outcome from diagnosis or notes, or remove this metric

## Correctness Properties

Property 1: Fault Condition - Valid Date Formatting and Column Access

_For any_ date input where the bug condition holds (invalid date format, timezone string, or non-existent column access), the fixed analyticsService SHALL produce valid ISO 8601 date strings (YYYY-MM-DD), convert all Date objects to strings before queries, and access only existing database columns or calculate derived values from available columns.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

Property 2: Preservation - Non-Analytics Date Handling

_For any_ date handling that is NOT in the Analytics Dashboard (other modules, appointment scheduling, consultation recording), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing date functionality throughout the application.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `src/services/analyticsService.js`

**Function**: `formatDatePH(date)`

**Specific Changes**:
1. **Fix Date Formatting Logic**: Replace the locale-based formatting with direct ISO 8601 conversion
   - Remove: `toLocaleDateString('en-PH', {...}).split('/').reverse().join('-')`
   - Replace with: Direct ISO string extraction using `toISOString().split('T')[0]`
   - This ensures YYYY-MM-DD format without timezone information

2. **Add Date Object Validation**: Ensure all date parameters are converted to ISO strings before queries
   - In `getKPIMetrics()`, `getPatientDistribution()`, `getRevenueTrend()`, etc.
   - Add conversion: `const startStr = startDate instanceof Date ? formatDatePH(startDate) : startDate`
   - Apply to both startDate and endDate parameters

3. **Fix satisfaction_ratings Query**: Replace `overall_rating` with calculated average
   - Change SELECT from: `'overall_rating'`
   - Change to: `'professionalism_rating, waiting_time_rating, cleanliness_rating'`
   - Calculate average: `(professionalism_rating + waiting_time_rating + cleanliness_rating) / 3`

4. **Fix consultations Query**: Remove or replace `outcome` column access
   - Option A: Remove recovery rate metric entirely (if not critical)
   - Option B: Derive outcome from diagnosis field (search for keywords like "recovered", "improved")
   - Option C: Return 0 or N/A for this metric until schema is updated

5. **Add Error Handling**: Ensure graceful degradation if queries fail
   - Already present: `catch` blocks return 0 or empty arrays
   - Verify all query functions have proper error handling

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Fault Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that call `formatDatePH()` with various dates and verify the output format. Call analytics functions with Date objects and verify Supabase receives proper strings. Query the database directly to confirm column existence. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **Invalid Date Format Test**: Call `formatDatePH(new Date('2026-02-27'))` and verify it produces "2026-27-02" (will fail on unfixed code)
2. **Timezone String Test**: Call `getKPIMetrics({ startDate: new Date('2026-01-01'), endDate: new Date('2026-01-31') })` and verify Supabase error (will fail on unfixed code)
3. **Missing Column Test**: Call `getPatientSatisfaction('2026-01-01', '2026-01-31')` and verify "column does not exist" error (will fail on unfixed code)
4. **Missing Column Test**: Call `calculateRecoveryRate('2026-01-01', '2026-01-31')` and verify "column does not exist" error (will fail on unfixed code)

**Expected Counterexamples**:
- `formatDatePH()` produces dates with month > 12
- Supabase queries receive Date objects with timezone strings
- Database queries fail with "column does not exist" errors
- Possible causes: incorrect date parsing logic, missing type conversion, schema mismatch

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := analyticsService_fixed(input)
  ASSERT result.dates match ISO 8601 format (YYYY-MM-DD)
  ASSERT result.queries use existing columns only
  ASSERT result.dashboard displays without errors
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT analyticsService_original(input) = analyticsService_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for chart rendering and metric calculations with valid data, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Chart Rendering Preservation**: Verify that KPI cards, Patient Distribution chart, Revenue Trend chart display correctly after fix
2. **Metric Calculation Preservation**: Verify that revenue, patient count, bed occupancy calculations remain unchanged
3. **Date Filter Preservation**: Verify that date range filtering continues to work correctly
4. **Other Module Preservation**: Verify that Appointments, Consultations, Patients modules handle dates correctly

### Unit Tests

- Test `formatDatePH()` with various date inputs (past, present, future, edge cases like Feb 29)
- Test date conversion in all analytics query functions
- Test satisfaction rating calculation with three separate rating columns
- Test recovery rate calculation with alternative data source or graceful failure

### Property-Based Tests

- Generate random date ranges and verify all produce valid ISO 8601 strings
- Generate random analytics queries and verify all return data or gracefully handle errors
- Test that all date inputs (Date objects, ISO strings, timestamps) are handled correctly

### Integration Tests

- Test full Analytics Dashboard load with various date ranges
- Test switching between different time periods (daily, weekly, monthly, yearly)
- Test that all charts render without errors
- Test that KPI metrics display correct values
