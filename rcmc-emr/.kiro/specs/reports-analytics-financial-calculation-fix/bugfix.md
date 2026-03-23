# Bugfix Requirements Document

## Introduction

Four interrelated bugs in the Analytics Dashboard tab of Reports & Analytics cause financial KPI cards to display incorrect values and misleading trend indicators. The bugs affect the Net Revenue formula, the percentage variance (comparison) logic for KPI cards, the daily/monthly data-binding consistency, and the categorization of unpaid bills. These issues are scoped to the Analytics Dashboard tab (`analyticsService.js`, `useAnalytics.js`, `KPICard.jsx`, `Reports.jsx`) and are distinct from the Financial tab bugs already addressed in `net-revenue-amount-paid-fix` and `financial-daily-no-data-fix`.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the Analytics Dashboard renders the Net Revenue KPI card THEN the system displays a value lower than Total Revenue even when Discounts are ₱0.00, because `remaining_balance` (unpaid bills / accounts receivable) is being subtracted from revenue in the KPI computation

1.2 WHEN the Analytics Dashboard renders the Net Revenue KPI card for the Monthly view with Total Revenue ₱2,275.00 and Discounts ₱0.00 THEN the system shows Net Revenue less than ₱2,275.00 instead of ₱2,275.00

1.3 WHEN the Analytics Dashboard switches to the Weekly view and Total Revenue drops by 18% THEN the system shows Net Revenue dropping by approximately 60%, a disproportionate variance that cannot be explained by discount changes alone

1.4 WHEN the percentage variance indicator on the Net Revenue KPI card is computed THEN the system uses a previous-period value sourced from a different query window than the one used for Total Revenue's previous period, causing the two cards' trend arrows to be inconsistent

1.5 WHEN the user selects the Daily view for March 23, 2026 THEN the system shows ₱0.00 on the Analytics Dashboard KPI cards even though the Monthly bar chart shows a transaction recorded on March 23

1.6 WHEN `getRevenueTrend` in `analyticsService.js` aggregates billing records for the monthly bar chart THEN the system uses `new Date(record.created_at)` which interprets UTC timestamps in local time, causing transactions stored at UTC midnight to appear on a different calendar day than the daily filter query

1.7 WHEN the Analytics Dashboard renders KPI cards THEN the system displays "Unpaid Bills" (remaining_balance) as a deduction from Net Revenue rather than as a separate Accounts Receivable metric

### Expected Behavior (Correct)

2.1 WHEN the Analytics Dashboard computes Net Revenue THEN the system SHALL calculate it as `Total Revenue − Total Discounts` (i.e., `sum(amount_paid) − sum(discount_amount)`), with no subtraction of `remaining_balance`

2.2 WHEN Total Revenue is ₱2,275.00 and Total Discounts are ₱0.00 THEN the system SHALL display Net Revenue as ₱2,275.00

2.3 WHEN the percentage variance for Net Revenue is computed THEN the system SHALL use `calculatePercentageChange(currentNetRevenue, previousNetRevenue)` where both current and previous values are derived from the same date-range query window as Total Revenue

2.4 WHEN Total Revenue drops by 18% week-over-week and Discounts are ₱0.00 THEN the system SHALL show Net Revenue also dropping by approximately 18% (not 60%)

2.5 WHEN `getRevenueTrend` aggregates billing records for the monthly bar chart THEN the system SHALL derive the calendar day/month from the local Philippine date (UTC+8) so that a transaction stored as `2026-03-23T00:00:00Z` appears under March 23 in both the bar chart and the daily filter

2.6 WHEN the daily filter queries billing records for a specific calendar date THEN the system SHALL use local-date string boundaries (`YYYY-MM-DDT00:00:00` to `YYYY-MM-DDT23:59:59` in local time) consistent with how `getRevenueTrend` groups records, so the same transaction appears in both views

2.7 WHEN the Analytics Dashboard renders financial KPI cards THEN the system SHALL display `remaining_balance` totals as a separate "Accounts Receivable" metric card and SHALL NOT subtract it from Net Revenue

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the Analytics Dashboard renders the Total Revenue KPI card THEN the system SHALL CONTINUE TO display the sum of `amount_paid` for the selected period without modification

3.2 WHEN the Analytics Dashboard renders the Total Patients, Bed Occupancy, and Patient Satisfaction KPI cards THEN the system SHALL CONTINUE TO display those metrics without any change

3.3 WHEN `calculatePercentageChange` in `metricCalculations.js` is called with valid current and previous values THEN the system SHALL CONTINUE TO return the correct variance percentage using the formula `((current − previous) / previous) × 100`

3.4 WHEN the KPI card trend arrow is green (up) or red (down) THEN the system SHALL CONTINUE TO apply those colors based on the sign of the calculated percentage change

3.5 WHEN the Revenue Trend chart (`getRevenueTrend`) is called with `granularity = 'monthly'` THEN the system SHALL CONTINUE TO return one data point per calendar month with the correct revenue total

3.6 WHEN the Analytics Dashboard is viewed in the Monthly or Yearly period THEN the system SHALL CONTINUE TO show all existing KPI cards and charts without layout regression

3.7 WHEN `getKPIMetrics` is called THEN the system SHALL CONTINUE TO return `totalRevenue`, `totalPatients`, `bedOccupancy`, and `patientSatisfaction` metrics alongside the corrected `netRevenue` and new `accountsReceivable` metrics

3.8 WHEN the Financial tab (`FinancialTab.jsx`, `billingFinancialService.js`) is used THEN the system SHALL CONTINUE TO function without any changes — this fix is scoped to the Analytics Dashboard tab only

---

## Bug Condition Pseudocode

```pascal
FUNCTION isBugCondition_NetRevenue(record)
  INPUT: record of type BillingRecord
  OUTPUT: boolean

  // Bug triggers when remaining_balance is subtracted from revenue
  RETURN record.remaining_balance > 0
     AND netRevenue_formula INCLUDES subtraction of remaining_balance
END FUNCTION

// Property: Fix Checking — Net Revenue Formula
FOR ALL records WHERE isBugCondition_NetRevenue(records) DO
  result ← computeAnalyticsNetRevenue'(records)
  ASSERT result = SUM(amount_paid) - SUM(discount_amount)
  ASSERT result != SUM(amount_paid) - SUM(discount_amount) - SUM(remaining_balance)
END FOR
```

```pascal
FUNCTION isBugCondition_VarianceMismatch(currentPeriod, previousPeriod)
  INPUT: currentPeriod, previousPeriod of type DateRange
  OUTPUT: boolean

  // Bug triggers when Net Revenue previous period uses a different
  // query window than Total Revenue previous period
  RETURN previousPeriod_for_netRevenue != previousPeriod_for_totalRevenue
END FUNCTION

// Property: Fix Checking — Variance Consistency
FOR ALL periods WHERE isBugCondition_VarianceMismatch(period) DO
  totalRevenueChange ← calculatePercentageChange(currentTotalRevenue, previousTotalRevenue)
  netRevenueChange   ← calculatePercentageChange(currentNetRevenue, previousNetRevenue)
  // When discounts are ₱0.00, both changes must be equal
  IF currentDiscounts = 0 AND previousDiscounts = 0 THEN
    ASSERT totalRevenueChange = netRevenueChange
  END IF
END FOR
```

```pascal
FUNCTION isBugCondition_TimezoneSkew(timestamp)
  INPUT: timestamp of type UTC ISO string (e.g., "2026-03-23T00:00:00Z")
  OUTPUT: boolean

  // Bug triggers when UTC timestamp is interpreted without PH timezone offset
  RETURN UTC_OFFSET_HOURS != 0
     AND new Date(timestamp).getDate() != toPhilippineLocalDate(timestamp).getDate()
END FUNCTION

// Property: Fix Checking — Timezone Consistency
FOR ALL transactions WHERE isBugCondition_TimezoneSkew(transaction.created_at) DO
  barChartDay  ← getRevenueTrend'(transaction)  // day used in monthly bar chart
  dailyFilterDay ← getDailyFilterDate'(transaction) // day used in daily KPI query
  ASSERT barChartDay = dailyFilterDay
END FOR

// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT F(X) = F'(X)
END FOR
```
