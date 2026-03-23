# Bugfix Requirements Document

## Introduction

The Financial tab under Reports & Analytics shows no data when the Daily period is selected. The root cause is a timezone mismatch in `billingFinancialService.js`: `computeDateRange` produces midnight local-time `Date` objects, but `fetchFinancialData` converts them to ISO strings via `.toISOString()`, which outputs UTC. In the Philippines (UTC+8), local midnight is 4:00 PM of the previous day in UTC, so the resulting date string is one day behind. The Supabase query then filters for yesterday's records while all billing entries were created today (local time), returning an empty result set. The same offset error affects weekly, monthly, and yearly periods but is most visible on Daily because the window is only one day wide.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the user selects the Daily period on the Financial tab THEN the system returns zero records because `fetchFinancialData` converts the local-midnight `Date` to a UTC ISO string, shifting the date string one day into the past, and the Supabase query finds no matching `created_at` values for today.

1.2 WHEN the user selects the Weekly, Monthly, or Yearly period on the Financial tab THEN the system queries a date range that is shifted one day earlier than the intended local-date window, causing records near the boundary of the period to be excluded or misattributed.

1.3 WHEN `fetchPreviousPeriodData` calls `getPreviousPeriod` and then `fetchFinancialData` THEN the system applies the same UTC conversion to the previous-period dates, producing an additional one-day offset on top of the already-shifted current period, so comparison KPIs are also incorrect.

### Expected Behavior (Correct)

2.1 WHEN the user selects the Daily period on the Financial tab THEN the system SHALL query `created_at` using the correct local calendar date (e.g., `2025-07-14T00:00:00` to `2025-07-14T23:59:59`) so that all billing records created today are returned.

2.2 WHEN the user selects the Weekly, Monthly, or Yearly period on the Financial tab THEN the system SHALL query `created_at` using local-date strings derived from the local year, month, and day components of the `Date` objects, so the full intended period is covered without boundary drift.

2.3 WHEN `fetchPreviousPeriodData` calls `fetchFinancialData` with the previous-period range THEN the system SHALL apply the same local-date string conversion, so previous-period KPIs reflect the correct prior window and trend comparisons are accurate.

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a custom date range is entered via the date picker inputs THEN the system SHALL CONTINUE TO query the exact start and end dates the user selected, with no change to custom-range behavior.

3.2 WHEN billing records exist for dates other than today THEN the system SHALL CONTINUE TO return those records correctly when the corresponding period (weekly, monthly, yearly) is selected.

3.3 WHEN `computeDateRange` is called for any period preset THEN the system SHALL CONTINUE TO return `Date` objects constructed from local year/month/day components, with no change to that function's output.

3.4 WHEN `validateDateRange` is called with a start date after the end date THEN the system SHALL CONTINUE TO return `{ valid: false, error: '...' }` as before.

3.5 WHEN the Financial tab loads for the first time THEN the system SHALL CONTINUE TO default to the Monthly period and display data for the current calendar month.

---

## Bug Condition

```pascal
FUNCTION isBugCondition(dateRange)
  INPUT: dateRange of type { startDate: Date, endDate: Date }
  OUTPUT: boolean

  // Bug triggers when a Date object is passed and converted via .toISOString()
  // in a timezone with a non-zero UTC offset (e.g., UTC+8 Philippines)
  RETURN dateRange.startDate instanceof Date
     AND UTC_OFFSET_HOURS != 0
END FUNCTION
```

```pascal
// Property: Fix Checking
FOR ALL dateRange WHERE isBugCondition(dateRange) DO
  result ← fetchFinancialData'(dateRange)
  ASSERT query_start_string = toLocalDateString(dateRange.startDate)
  ASSERT query_end_string   = toLocalDateString(dateRange.endDate)
END FOR
```

```pascal
// Property: Preservation Checking
FOR ALL dateRange WHERE NOT isBugCondition(dateRange) DO
  // i.e., string dates passed directly (custom range)
  ASSERT fetchFinancialData(dateRange) = fetchFinancialData'(dateRange)
END FOR
```
