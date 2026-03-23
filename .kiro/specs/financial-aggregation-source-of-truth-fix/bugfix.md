# Bugfix Requirements Document

## Introduction

The Reports & Analytics dashboard and Billing Financial Tab display contradictory financial figures
when switching between time filters. A weekly filter (e.g., Mar 23–29) can show a higher Unpaid
Bills total (₱550) than the monthly filter that contains it (Mar 1–31, ₱475). This is a logical
impossibility: if a week falls entirely within a month, the monthly aggregate must be ≥ the weekly
aggregate for any additive metric.

The root cause is that `getAccountsReceivable` in `analyticsService.js` queries the
`remaining_balance` column, which is a **mutable snapshot** — it is overwritten every time a
payment is made. Querying it with a `created_at` date filter therefore returns the *current*
balance of bills created in that window, not the balance those bills carried at the time they were
created. Because partial payments reduce `remaining_balance` at unpredictable times, the same
date range can return different totals on different queries, and narrower windows can appear larger
than wider ones.

The same class of problem affects `getTotalRevenue`, which sums `amount_paid` without capping it
at `total_amount`, allowing data-entry errors to inflate revenue figures.

Both `analyticsService.js` (used by the Reports & Analytics dashboard) and
`billingFinancialService.js` (used by the Billing Financial Tab) are affected.

---

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the user selects a weekly date range (e.g., Mar 23–29) THEN the system returns Unpaid
Bills calculated as `SUM(remaining_balance)` filtered by `created_at`, producing a value that
reflects current payment state rather than the state at query time for that window.

1.2 WHEN the user selects a monthly date range (e.g., Mar 1–31) that fully contains the weekly
range THEN the system returns a monthly Unpaid Bills total that can be numerically less than the
weekly total, violating the additive containment property.

1.3 WHEN `amount_paid` on any billing record exceeds `total_amount` due to a data-entry error
THEN the system inflates Total Revenue by including the excess amount without any cap.

1.4 WHEN `computeKPIs` in `billingFinancialService.js` calculates `unpaidBills` THEN the system
sums `remaining_balance` from already-fetched records, propagating the same mutable-snapshot
defect into the Billing Financial Tab.

### Expected Behavior (Correct)

2.1 WHEN the user selects any date range [t_start, t_end] THEN the system SHALL calculate Unpaid
Bills as `SUM(total_amount) - SUM(amount_paid)` for all billing records where `created_at` is
within [t_start, t_end] and `payment_status != 'Cancelled'`, producing a deterministic value
independent of when the query runs.

2.2 WHEN a weekly date range falls entirely within a monthly date range THEN the system SHALL
return a monthly Unpaid Bills total that is greater than or equal to the weekly total, satisfying
the additive containment invariant.

2.3 WHEN calculating Total Revenue for any date range THEN the system SHALL compute each
transaction's revenue contribution as `MIN(amount_paid, total_amount)`, so that data-entry errors
where `amount_paid > total_amount` do not inflate the reported figure.

2.4 WHEN `computeKPIs` in `billingFinancialService.js` calculates `unpaidBills` THEN the system
SHALL use `SUM(total_amount) - SUM(amount_paid)` over non-cancelled records, consistent with the
formula in 2.1.

### Unchanged Behavior (Regression Prevention)

3.1 WHEN billing records have `payment_status = 'Paid'` and `amount_paid = total_amount` THEN the
system SHALL CONTINUE TO report ₱0 Unpaid Bills for those records (fully paid bills contribute
zero to the unpaid total under the new formula).

3.2 WHEN billing records have `payment_status = 'Cancelled'` THEN the system SHALL CONTINUE TO
exclude those records from Unpaid Bills calculations.

3.3 WHEN `amount_paid` is less than `total_amount` (a normal partial payment) THEN the system
SHALL CONTINUE TO include the difference `total_amount - amount_paid` in the Unpaid Bills total.

3.4 WHEN `amount_paid` is less than or equal to `total_amount` (the normal case) THEN the system
SHALL CONTINUE TO report `amount_paid` as the revenue contribution for that transaction, unchanged
from current behavior.

3.5 WHEN the user switches between daily, weekly, monthly, and yearly filters THEN the system
SHALL CONTINUE TO scope all financial metrics to billing records whose `created_at` falls within
the selected date range.

3.6 WHEN Net Revenue is calculated THEN the system SHALL CONTINUE TO subtract `discount_amount`
from the revenue figure, preserving the existing net revenue formula structure.

3.7 WHEN the Billing Financial Tab fetches and displays transaction records THEN the system SHALL
CONTINUE TO show the same columns, filters, sorting, pagination, and CSV export behavior as
before.
