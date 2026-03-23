# Financial Aggregation Source-of-Truth Fix — Implementation Tasks

## Tasks

- [x] 1. Fix `getAccountsReceivable` in analyticsService.js
  - Replace `.select('remaining_balance')` with `.select('total_amount, amount_paid')`
  - Replace `SUM(remaining_balance)` reduce with `SUM(MAX(0, total_amount - amount_paid))`
  - **File**: `rcmc-emr/src/services/analyticsService.js`
  - **Validates**: Requirements 2.1, 2.2 (Properties 1, 2)

- [x] 2. Fix `getTotalRevenue` in analyticsService.js
  - Replace `.select('amount_paid')` with `.select('amount_paid, total_amount')`
  - Replace uncapped `SUM(amount_paid)` with `SUM(MIN(amount_paid, total_amount))`
  - **File**: `rcmc-emr/src/services/analyticsService.js`
  - **Validates**: Requirements 2.3, 3.4 (Properties 3, 4)

- [x] 3. Fix `computeKPIs` in billingFinancialService.js
  - Replace `SUM(remaining_balance)` for `unpaidBills` with `SUM(MAX(0, total_amount - amount_paid))` for non-cancelled records
  - Replace uncapped `SUM(amount_paid)` for `netRevenue` with `SUM(MIN(amount_paid, total_amount))`
  - **File**: `rcmc-emr/src/services/billingFinancialService.js`
  - **Validates**: Requirements 2.4, 3.1, 3.2 (Properties 5, 6)

- [x] 4. Write regression tests
  - Create `rcmc-emr/src/tests/financial-aggregation.test.js`
  - Test: additive containment (monthly >= weekly)
  - Test: revenue cap when `amount_paid > total_amount`
  - Test: cancelled records excluded
  - Test: fully paid records contribute ₱0 to unpaid bills
  - Test: normal partial payments preserved
  - **Validates**: All correctness properties
