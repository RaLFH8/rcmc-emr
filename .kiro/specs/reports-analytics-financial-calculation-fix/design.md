# Reports Analytics Financial Calculation Fix — Bugfix Design

## Overview

Four interrelated bugs in the Analytics Dashboard tab cause financial KPI cards to display
incorrect values and misleading trend indicators. The fixes are scoped entirely to
`analyticsService.js` and `Reports.jsx` (the `AnalyticsDashboard` component). No changes
are needed in `metricCalculations.js`, `KPICard.jsx`, or `useAnalytics.js`.

**Bug 1 — Net Revenue Formula**: `getKPIMetrics` does not compute Net Revenue at all; the
dashboard only shows Total Revenue. Net Revenue must be `sum(amount_paid) - sum(discount_amount)`.

**Bug 2 — Variance % Decoupling**: The previous-period values for `netRevenue` must be
derived from the same `getPreviousPeriod` window as `totalRevenue`, fetched in the same
`Promise.all` call.

**Bug 3 — Daily/Monthly Timezone Mismatch**: `getRevenueTrend` uses `new Date(bill.created_at)`
which interprets UTC timestamps in local time, causing UTC-midnight records to appear on the
wrong calendar day. The fix uses local date components (`getFullYear`, `getMonth`, `getDate`).
`getTotalRevenue` must also use `${startDate}T00:00:00` as the lower boundary (not bare date).

**Bug 4 — Accounts Receivable Categorization**: `remaining_balance` is currently absent from
the Analytics Dashboard. A new `getAccountsReceivable` helper must query
`sum(remaining_balance)` where `payment_status != 'Cancelled'` and expose it as a separate
KPI card in `Reports.jsx`.

---

## Glossary

- **Bug_Condition (C)**: The condition that triggers each bug — incorrect formula, mismatched
  query windows, UTC date interpretation, or missing AR metric.
- **Property (P)**: The desired correct behavior for inputs satisfying C.
- **Preservation**: Existing behaviors that must remain unchanged by the fix.
- **getKPIMetrics**: Function in `analyticsService.js` that fetches and returns all KPI
  metric objects for the Analytics Dashboard.
- **getTotalRevenue(startDate, endDate)**: Helper in `analyticsService.js` that sums
  `amount_paid` from the `billing` table for the given date range.
- **getNetRevenue(startDate, endDate)**: New helper to be added — sums `amount_paid` and
  `discount_amount` from `billing`, returns `{ amountPaid, discountAmount, netRevenue }`.
- **getAccountsReceivable(startDate, endDate)**: New helper to be added — sums
  `remaining_balance` from `billing` where `payment_status != 'Cancelled'`.
- **getRevenueTrend**: Function in `analyticsService.js` that aggregates billing records
  into time-period buckets for the Revenue Trend bar chart.
- **periodKey**: The string key used to group billing records by time period in
  `getRevenueTrend` (e.g., `"2026-03"`).
- **isBugCondition**: Pseudocode predicate identifying inputs that trigger each bug.
- **PH timezone**: Philippine Standard Time, UTC+8.

---

## Bug Details

### Bug 1 — Net Revenue Formula

The `getKPIMetrics` function currently fetches only `amount_paid` via `getTotalRevenue`.
It does not fetch `discount_amount`, so it cannot compute Net Revenue. The Analytics
Dashboard renders only a "Total Revenue" KPI card; there is no "Net Revenue" card.

**Formal Specification:**
```
FUNCTION isBugCondition_NetRevenue(billingRecords)
  INPUT: billingRecords — array of billing rows with amount_paid, discount_amount
  OUTPUT: boolean

  RETURN netRevenue_in_metrics IS NULL
      OR netRevenue_formula INCLUDES subtraction of remaining_balance
END FUNCTION
```

**Examples:**
- Monthly view: Total Revenue ₱2,275.00, Discounts ₱0.00 → Net Revenue card is absent
  (should show ₱2,275.00)
- Monthly view: Total Revenue ₱5,000.00, Discounts ₱500.00 → Net Revenue card is absent
  (should show ₱4,500.00)
- Weekly view: Total Revenue drops 18%, Discounts ₱0.00 → Net Revenue card absent
  (should also drop ~18%)

---

### Bug 2 — Variance % Decoupling

When Net Revenue is added, its previous-period value must come from the same
`getPreviousPeriod(startDate, endDate)` window used for `totalRevenue`. If a separate
query is used with a different window, the two cards' trend arrows will be inconsistent.

**Formal Specification:**
```
FUNCTION isBugCondition_VarianceMismatch(currentPeriod, previousPeriod)
  INPUT: currentPeriod, previousPeriod — DateRange objects
  OUTPUT: boolean

  RETURN previousPeriod_for_netRevenue != previousPeriod_for_totalRevenue
END FUNCTION
```

**Examples:**
- Total Revenue drops 18% WoW, Discounts ₱0.00 → Net Revenue should also show ~18% drop,
  not 60% (which would indicate a different previous-period window)

---

### Bug 3 — Daily/Monthly Timezone Mismatch

`getRevenueTrend` uses `new Date(bill.created_at)` to extract the date. In Node/browser
environments, `new Date("2026-03-23T00:00:00Z")` returns a Date whose local `.getDate()`
is March 22 in UTC+8 (since UTC midnight is 8:00 AM PH time, but the date object's
`.getDate()` in a UTC-offset environment may differ). The `periodKey` must use local
date components to match the calendar day shown in the UI.

Additionally, `getTotalRevenue` uses a bare `startDate` string (e.g., `"2026-03-23"`)
as the `gte` boundary. Supabase interprets this as `2026-03-23T00:00:00Z` (UTC), which
misses records created between `2026-03-22T16:00:00Z` and `2026-03-22T23:59:59Z` (which
are March 23 in PH time). The fix uses `${startDate}T00:00:00` as the lower boundary.

**Formal Specification:**
```
FUNCTION isBugCondition_TimezoneSkew(timestamp)
  INPUT: timestamp — UTC ISO string (e.g., "2026-03-23T00:00:00Z")
  OUTPUT: boolean

  localDate ← toPhilippineLocalDate(timestamp)
  utcDate   ← new Date(timestamp)

  RETURN localDate.getDate() != utcDate.getUTCDate()
      OR startDate_boundary IS bare_date_string (not "T00:00:00" suffixed)
END FUNCTION
```

**Examples:**
- Record stored as `2026-03-23T00:00:00Z` → bar chart shows March 23 (correct after fix),
  daily filter for March 23 also finds it (correct after fix)
- Daily view for March 23 shows ₱0.00 before fix; shows correct amount after fix

---

### Bug 4 — Accounts Receivable Categorization

`remaining_balance` is not surfaced anywhere in the Analytics Dashboard. It must be
exposed as a separate "Accounts Receivable" KPI card, not subtracted from Net Revenue.

**Formal Specification:**
```
FUNCTION isBugCondition_MissingAR(metrics)
  INPUT: metrics — object returned by getKPIMetrics
  OUTPUT: boolean

  RETURN metrics.accountsReceivable IS NULL
      OR remaining_balance IS subtracted from netRevenue
END FUNCTION
```

**Examples:**
- Billing records with remaining_balance ₱1,000.00 (non-cancelled) → AR card shows ₱1,000.00
- Cancelled billing records with remaining_balance ₱500.00 → excluded from AR total

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- `getTotalRevenue` continues to return `sum(amount_paid)` — no change to its formula
- `totalPatients`, `bedOccupancy`, and `patientSatisfaction` KPI cards are unaffected
- `calculatePercentageChange` in `metricCalculations.js` is not modified
- `KPICard.jsx` trend arrow colors (green up / red down) are not modified
- `getRevenueTrend` with `granularity = 'monthly'` continues to return one data point per
  calendar month (only the date extraction method changes, not the grouping logic)
- The Financial tab (`FinancialTab.jsx`, `billingFinancialService.js`) is not touched
- `useAnalytics.js` is not modified
- The existing four KPI cards (Total Patients, Bed Occupancy, Patient Satisfaction,
  Total Revenue) continue to render without layout regression

**Scope:**
All inputs that do NOT involve the four bug conditions above are completely unaffected.
This includes: non-billing queries, satisfaction ratings, room occupancy, patient counts,
the Financial tab, and all chart components other than the KPI card grid.

---

## Hypothesized Root Cause

1. **Missing Net Revenue computation**: `getKPIMetrics` was built to return only the four
   original KPIs. `discount_amount` was never fetched from the `billing` table, so Net
   Revenue was never computed. The `remaining_balance` subtraction mentioned in the bugfix
   requirements likely refers to an earlier iteration or a different code path.

2. **No parallel fetch for Net Revenue previous period**: Because Net Revenue didn't exist,
   there was no previous-period fetch for it. Adding it naively (outside the `Promise.all`)
   would use a different query window. The fix must add both current and previous Net Revenue
   fetches inside the existing `Promise.all`.

3. **UTC date interpretation in `getRevenueTrend`**: `new Date(bill.created_at)` returns a
   Date object whose `.getMonth()` and `.getDate()` methods return values in the local
   timezone of the JavaScript runtime. In a UTC environment (e.g., server-side or some
   browsers), this correctly returns UTC values. In a PH-timezone browser, it returns PH
   local values. The inconsistency arises because `getTotalRevenue` uses a bare date string
   as the `gte` boundary, which Supabase interprets as UTC midnight, while the bar chart
   groups by local date. The fix aligns both to use local-date string boundaries.

4. **Accounts Receivable never added**: The original analytics dashboard spec did not include
   an AR metric. The `remaining_balance` column exists in the `billing` table but was never
   queried by `analyticsService.js`.

---

## Correctness Properties

Property 1: Bug Condition — Net Revenue Formula

_For any_ set of billing records in the selected date range, the fixed `getKPIMetrics`
function SHALL return `metrics.netRevenue.current` equal to
`sum(amount_paid) - sum(discount_amount)`, and SHALL NOT subtract `remaining_balance`
from this value.

**Validates: Requirements 2.1, 2.2**

---

Property 2: Bug Condition — Variance Consistency

_For any_ date range where `discount_amount` is ₱0.00 for both current and previous
periods, the fixed `getKPIMetrics` function SHALL return a `netRevenue.changePercentage`
equal to `totalRevenue.changePercentage`, because both use the same `getPreviousPeriod`
window and the same `Promise.all` fetch.

**Validates: Requirements 2.3, 2.4**

---

Property 3: Bug Condition — Timezone Consistency

_For any_ billing record whose `created_at` UTC timestamp maps to calendar date D in
Philippine local time (UTC+8), the fixed `getRevenueTrend` function SHALL assign that
record to period D (not D-1), and the fixed `getTotalRevenue` daily boundary SHALL
include that record when querying for date D.

**Validates: Requirements 2.5, 2.6**

---

Property 4: Bug Condition — Accounts Receivable Metric

_For any_ set of billing records, the fixed `getKPIMetrics` function SHALL return
`metrics.accountsReceivable.current` equal to `sum(remaining_balance)` for records
where `payment_status != 'Cancelled'`, and SHALL NOT subtract this value from
`netRevenue`.

**Validates: Requirements 2.7**

---

Property 5: Preservation — Total Revenue Unchanged

_For any_ date range, the fixed `getKPIMetrics` function SHALL return
`metrics.totalRevenue.current` equal to `sum(amount_paid)`, identical to the value
returned by the original function.

**Validates: Requirements 3.1, 3.7**

---

Property 6: Preservation — Other KPI Metrics Unchanged

_For any_ date range, the fixed `getKPIMetrics` function SHALL return
`metrics.totalPatients`, `metrics.bedOccupancy`, and `metrics.patientSatisfaction`
with values identical to those returned by the original function.

**Validates: Requirements 3.2, 3.7**

---

Property 7: Preservation — Monthly Revenue Trend Grouping Unchanged

_For any_ set of billing records spanning multiple calendar months, the fixed
`getRevenueTrend` with `granularity = 'monthly'` SHALL return exactly one data point
per calendar month, with the same revenue totals as the original function for records
that are unambiguously within a single month (i.e., not near UTC midnight boundaries).

**Validates: Requirements 3.5**

---

## Fix Implementation

### Changes Required

#### File: `rcmc-emr/src/services/analyticsService.js`

**1. Fix `getTotalRevenue` — use local-time lower boundary**

Change the `gte` boundary from a bare date string to `${startDate}T00:00:00` so it
matches the local-time interpretation used by `getRevenueTrend`:

```javascript
// Before
.gte('created_at', startDate)

// After
.gte('created_at', `${startDate}T00:00:00`)
```

**2. Add `getNetRevenue(startDate, endDate)` helper**

New private helper that fetches both `amount_paid` and `discount_amount` in a single
query and returns the computed net revenue:

```javascript
async function getNetRevenue(startDate, endDate) {
  const { data, error } = await queryWithTimeout(
    supabase
      .from('billing')
      .select('amount_paid, discount_amount')
      .gte('created_at', `${startDate}T00:00:00`)
      .lte('created_at', `${endDate}T23:59:59`)
  )
  if (error) throw error
  if (!data || data.length === 0) return 0
  const net = data.reduce((acc, bill) => {
    return acc + (parseFloat(bill.amount_paid) || 0) - (parseFloat(bill.discount_amount) || 0)
  }, 0)
  return Math.round(net * 100) / 100
}
```

**3. Add `getAccountsReceivable(startDate, endDate)` helper**

New private helper that sums `remaining_balance` for non-cancelled billing records:

```javascript
async function getAccountsReceivable(startDate, endDate) {
  const { data, error } = await queryWithTimeout(
    supabase
      .from('billing')
      .select('remaining_balance')
      .gte('created_at', `${startDate}T00:00:00`)
      .lte('created_at', `${endDate}T23:59:59`)
      .neq('payment_status', 'Cancelled')
  )
  if (error) throw error
  if (!data || data.length === 0) return 0
  const total = data.reduce((acc, bill) => acc + (parseFloat(bill.remaining_balance) || 0), 0)
  return Math.round(total * 100) / 100
}
```

**4. Update `getKPIMetrics` — add netRevenue and accountsReceivable to `Promise.all`**

Expand the parallel fetch to include current and previous Net Revenue, and current and
previous Accounts Receivable:

```javascript
const [
  currentPatients,
  previousPatients,
  bedOccupancy,
  currentSatisfaction,
  previousSatisfaction,
  currentRevenue,
  previousRevenue,
  currentNetRevenue,      // NEW
  previousNetRevenue,     // NEW
  currentAR,              // NEW
  previousAR              // NEW
] = await Promise.all([
  getTotalPatients(),
  getTotalPatients(),
  getBedOccupancyRate(),
  getPatientSatisfaction(startDate, endDate),
  getPatientSatisfaction(previousPeriod.startDate, previousPeriod.endDate),
  getTotalRevenue(startDate, endDate),
  getTotalRevenue(previousPeriod.startDate, previousPeriod.endDate),
  getNetRevenue(startDate, endDate),                                    // NEW
  getNetRevenue(previousPeriod.startDate, previousPeriod.endDate),      // NEW
  getAccountsReceivable(startDate, endDate),                            // NEW
  getAccountsReceivable(previousPeriod.startDate, previousPeriod.endDate) // NEW
])
```

Add the new metrics to the returned object:

```javascript
netRevenue: {
  current: currentNetRevenue,
  previous: previousNetRevenue,
  change: currentNetRevenue - previousNetRevenue,
  changePercentage: previousNetRevenue > 0
    ? ((currentNetRevenue - previousNetRevenue) / previousNetRevenue) * 100
    : 0
},
accountsReceivable: {
  current: currentAR,
  previous: previousAR,
  change: currentAR - previousAR,
  changePercentage: previousAR > 0
    ? ((currentAR - previousAR) / previousAR) * 100
    : 0
}
```

**5. Fix `getRevenueTrend` — use local date components for `periodKey`**

Replace `new Date(bill.created_at)` date extraction with local date components:

```javascript
// Before
const date = new Date(bill.created_at)
// periodKey uses date.getFullYear(), date.getMonth(), etc.

// After — extract local date from the ISO string directly
const dateStr = bill.created_at.substring(0, 10) // "YYYY-MM-DD" local date
const [year, month, day] = dateStr.split('-').map(Number)

if (granularity === 'yearly') {
  periodKey = String(year)
} else if (granularity === 'quarterly') {
  const quarter = Math.floor((month - 1) / 3) + 1
  periodKey = `${year}-Q${quarter}`
} else {
  periodKey = `${year}-${String(month).padStart(2, '0')}`
}
```

Note: This approach uses the date portion of the stored timestamp string directly,
which is the local-time date as entered by the user (Supabase stores timestamps in
UTC but the date portion reflects the local date at time of entry for PH timezone).

---

#### File: `rcmc-emr/src/pages/Reports.jsx` — `AnalyticsDashboard` component

**6. Add Net Revenue and Accounts Receivable KPI cards**

In the KPI Cards grid (currently 4 cards in a `grid-cols-4` layout), add two new cards.
Update the grid to `lg:grid-cols-3` on the first row and add a second row, or expand to
`lg:grid-cols-3` with two rows — keeping the layout responsive:

```jsx
// Add these two KPICard entries after the existing four cards:
<KPICard
  title="Net Revenue"
  value={metrics?.netRevenue?.current || 0}
  previousValue={metrics?.netRevenue?.previous || 0}
  format="currency"
  icon={Tag}
  iconColor="bg-emerald-500"
/>
<KPICard
  title="Accounts Receivable"
  value={metrics?.accountsReceivable?.current || 0}
  previousValue={metrics?.accountsReceivable?.previous || 0}
  format="currency"
  icon={CreditCard}
  iconColor="bg-orange-500"
/>
```

`Tag` and `CreditCard` are already imported in `Reports.jsx`.

Update the grid class from `lg:grid-cols-4` to `lg:grid-cols-3` (two rows of 3) or
`sm:grid-cols-2 lg:grid-cols-3` to accommodate 6 cards without overflow.

---

## Testing Strategy

### Validation Approach

Two-phase approach: first surface counterexamples on unfixed code to confirm root causes,
then verify the fix and preservation.

---

### Exploratory Bug Condition Checking

**Goal**: Demonstrate each bug on the unfixed code before implementing the fix.

**Test Plan**: Mock the Supabase client to return controlled billing records. Call the
unfixed `getKPIMetrics` and `getRevenueTrend` and assert the incorrect behavior.

**Test Cases:**

1. **Net Revenue Absent (Bug 1)**: Call unfixed `getKPIMetrics` with records having
   `amount_paid=1000, discount_amount=100, remaining_balance=200`. Assert that
   `metrics.netRevenue` is `undefined` (will fail on fixed code — confirms bug).

2. **Variance Mismatch (Bug 2)**: Call unfixed `getKPIMetrics` for two periods where
   discounts are ₱0.00. Assert that `netRevenue.changePercentage` is undefined or
   differs from `totalRevenue.changePercentage` (confirms bug).

3. **Timezone Skew in getRevenueTrend (Bug 3)**: Pass a billing record with
   `created_at = "2026-03-23T00:00:00Z"`. Assert that the unfixed `getRevenueTrend`
   groups it under a period key that does NOT match `"2026-03"` when the runtime is
   UTC (confirms the UTC interpretation issue).

4. **AR Missing (Bug 4)**: Call unfixed `getKPIMetrics`. Assert that
   `metrics.accountsReceivable` is `undefined` (confirms bug).

**Expected Counterexamples:**
- `metrics.netRevenue` is `undefined` on unfixed code
- `metrics.accountsReceivable` is `undefined` on unfixed code
- Revenue trend groups UTC-midnight records under the wrong calendar day

---

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed functions
produce the expected behavior.

**Pseudocode:**
```
FOR ALL billingRecords WHERE isBugCondition_NetRevenue(billingRecords) DO
  metrics ← getKPIMetrics_fixed(billingRecords)
  ASSERT metrics.netRevenue.current = SUM(amount_paid) - SUM(discount_amount)
  ASSERT metrics.netRevenue.current != SUM(amount_paid) - SUM(discount_amount) - SUM(remaining_balance)
END FOR

FOR ALL periods WHERE isBugCondition_VarianceMismatch(period) DO
  metrics ← getKPIMetrics_fixed(period)
  IF currentDiscounts = 0 AND previousDiscounts = 0 THEN
    ASSERT metrics.netRevenue.changePercentage = metrics.totalRevenue.changePercentage
  END IF
END FOR

FOR ALL records WHERE isBugCondition_TimezoneSkew(record.created_at) DO
  trend ← getRevenueTrend_fixed([record], 'monthly')
  ASSERT trend[0].period = toLocalMonthString(record.created_at)
END FOR

FOR ALL billingRecords WHERE isBugCondition_MissingAR(billingRecords) DO
  metrics ← getKPIMetrics_fixed(billingRecords)
  ASSERT metrics.accountsReceivable.current = SUM(remaining_balance WHERE status != 'Cancelled')
END FOR
```

---

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed
functions produce the same result as the original functions.

**Pseudocode:**
```
FOR ALL billingRecords WHERE NOT isBugCondition(billingRecords) DO
  ASSERT getKPIMetrics_original(billingRecords).totalRevenue
       = getKPIMetrics_fixed(billingRecords).totalRevenue

  ASSERT getKPIMetrics_original(billingRecords).totalPatients
       = getKPIMetrics_fixed(billingRecords).totalPatients

  ASSERT getRevenueTrend_original(billingRecords, 'monthly')
       = getRevenueTrend_fixed(billingRecords, 'monthly')
       // for records not near UTC midnight boundaries
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking
because it generates many billing record configurations automatically, catching edge
cases (zero discounts, all cancelled, mixed payment statuses) that manual tests miss.

**Test Cases:**

1. **Total Revenue Preservation**: Generate random billing records with varying
   `amount_paid` values. Verify `metrics.totalRevenue.current` is unchanged after fix.

2. **Other KPI Preservation**: Verify `totalPatients`, `bedOccupancy`,
   `patientSatisfaction` are identical before and after fix.

3. **Monthly Trend Grouping Preservation**: Generate records spread across multiple
   months (none near UTC midnight). Verify `getRevenueTrend` returns the same period
   labels and revenue totals before and after fix.

4. **Cancelled Records Excluded from AR**: Generate records with `payment_status =
   'Cancelled'` and `remaining_balance > 0`. Verify they are excluded from
   `accountsReceivable.current`.

---

### Unit Tests

- Test `getNetRevenue` with records having known `amount_paid` and `discount_amount`
- Test `getAccountsReceivable` with mixed cancelled/non-cancelled records
- Test `getRevenueTrend` with a UTC-midnight timestamp — verify correct local month grouping
- Test `getTotalRevenue` with a start date boundary — verify `T00:00:00` suffix is used
- Test `getKPIMetrics` return shape includes `netRevenue` and `accountsReceivable`

### Property-Based Tests

- Generate random billing records; assert `netRevenue = sum(amount_paid) - sum(discount_amount)`
  for all inputs (Property 1)
- Generate random date ranges with zero discounts; assert
  `netRevenue.changePercentage = totalRevenue.changePercentage` (Property 2)
- Generate random timestamps near UTC midnight; assert `getRevenueTrend` groups them
  by local calendar date (Property 3)
- Generate random billing records with mixed `payment_status`; assert
  `accountsReceivable = sum(remaining_balance)` for non-cancelled only (Property 4)
- Generate random billing records; assert `totalRevenue` is unchanged by the fix (Property 5)

### Integration Tests

- Render `AnalyticsDashboard` with mocked `useAnalytics` returning all 6 metrics; verify
  6 KPI cards are displayed including "Net Revenue" and "Accounts Receivable"
- Verify "Net Revenue" card uses `Tag` icon and "Accounts Receivable" uses `CreditCard` icon
- Verify the KPI card grid does not overflow on a 1280px viewport with 6 cards
