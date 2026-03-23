# Bugfix Requirements Document

## Introduction

Three related bugs in the financial reporting system cause revenue metrics to reflect billed amounts instead of actual collected amounts, and hide the outstanding/unpaid balance from the Financial Report UI. The fixes ensure all revenue KPIs use `amount_paid` (cash actually collected) and surface the unpaid bills metric.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN `computeKPIs` processes billing records THEN the system calculates `netRevenue` as `total_amount - discount_amount` instead of the sum of `amount_paid`
1.2 WHEN `fetchFinancialData` queries the billing table THEN the system does not select the `amount_paid` column, making it unavailable for KPI computation
1.3 WHEN `getTotalRevenue` in `analyticsService.js` queries billing records THEN the system sums `total_amount` instead of `amount_paid`, overstating collected revenue
1.4 WHEN the Financial Tab renders KPI cards THEN the system does not display an "Unpaid Bills" metric, hiding the outstanding balance from users

### Expected Behavior (Correct)

2.1 WHEN `computeKPIs` processes billing records THEN the system SHALL calculate `netRevenue` as the sum of `amount_paid` across all records
2.2 WHEN `fetchFinancialData` queries the billing table THEN the system SHALL select `amount_paid` alongside existing columns so it is available for computation
2.3 WHEN `getTotalRevenue` in `analyticsService.js` queries billing records THEN the system SHALL select and sum `amount_paid` to reflect actual collected revenue
2.4 WHEN the Financial Tab renders KPI cards THEN the system SHALL display an "Unpaid Bills" KPI card showing the sum of `remaining_balance` for non-cancelled records

### Unchanged Behavior (Regression Prevention)

3.1 WHEN billing records have a positive `total_amount` THEN the system SHALL CONTINUE TO display `totalRevenue` (billed amount) as a separate KPI card
3.2 WHEN billing records have `discount_amount` values THEN the system SHALL CONTINUE TO compute and display `totalDiscounts` correctly
3.3 WHEN billing records are fetched for a date range THEN the system SHALL CONTINUE TO return patient name, payment method, payment status, and discount fields
3.4 WHEN the cash flow chart and transaction table are rendered THEN the system SHALL CONTINUE TO function without changes
3.5 WHEN `getTotalRevenue` is called with a valid date range THEN the system SHALL CONTINUE TO return a numeric value (no crashes or type errors)
