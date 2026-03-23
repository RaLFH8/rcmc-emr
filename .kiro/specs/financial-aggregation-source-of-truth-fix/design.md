# Financial Aggregation Source-of-Truth Fix — Bugfix Design

## Overview

The dashboard and Billing Financial Tab display contradictory Unpaid Bills figures across time
filters (e.g., Weekly ₱550 > Monthly ₱475), which is a logical impossibility for an additive
metric. The root cause is that both `getAccountsReceivable` in `analyticsService.js` and
`computeKPIs` in `billingFinancialService.js` aggregate the mutable `remaining_balance` column.
Because `remaining_balance` is overwritten on every payment, querying it with a `created_at`
filter returns the *current* balance of bills created in that window — not the balance those bills
carried at creation time. This makes narrower date windows appear larger than wider ones.

A secondary defect in `getTotalRevenue` sums `amount_paid` without capping at `total_amount`,
allowing data-entry errors to inflate reported revenue.

The fix replaces both mutable-snapshot aggregations with deterministic formulas:
- **Unpaid Bills**: `SUM(total_amount) - SUM(amount_paid)` for non-cancelled records
- **Revenue Cap**: `MIN(amount_paid, total_amount)` per record

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug — querying `remaining_balance` or
  uncapped `amount_paid` produces non-deterministic or inflated financial aggregates
- **Property (P)**: The desired behavior — financial aggregates are deterministic, additive, and
  bounded by `total_amount`
- **Preservation**: Existing behaviors (correct partial-payment math, cancelled-record exclusion,
  date scoping, discount subtraction, UI display) that must remain unchanged by the fix
- **`getAccountsReceivable`**: Function in `rcmc-emr/src/services/analyticsService.js` that
  returns the total unpaid balance for the Reports & Analytics dashboard
- **`getTotalRevenue`**: Function in `rcmc-emr/src/services/analyticsService.js` that returns
  total cash collected for the dashboard
- **`computeKPIs`**: Function in `rcmc-emr/src/services/billingFinancialService.js` that derives
  KPI metrics (including `unpaidBills` and `netRevenue`) from already-fetched billing records
- **`remaining_balance`**: Mutable column on the `billing` table; overwritten on every payment —
  the source of the non-determinism
- **`total_amount`**: Immutable column representing the original billed amount
- **`amount_paid`**: Cumulative column representing cash collected to date

## Bug Details

### Bug Condition

The bug manifests in two related forms:

**Form 1 — Mutable Snapshot (Unpaid Bills):** `getAccountsReceivable` and `computeKPIs` read
`remaining_balance`, which reflects the *current* payment state rather than the state at the time
of the query window. Because payments can arrive at any time, the same date range returns
different totals on different queries, and a narrower window can appear larger than a wider one
that contains it.

**Form 2 — Uncapped Revenue:** `getTotalRevenue` sums `amount_paid` without capping at
`total_amount`, so a data-entry error where `amount_paid > total_amount` inflates the reported
revenue figure.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { query: string, records: BillingRecord[] }
  OUTPUT: boolean

  // Form 1: mutable snapshot used for unpaid bills
  IF input.query USES remaining_balance FOR unpaid_bills_aggregation
    RETURN true

  // Form 2: uncapped revenue
  IF input.query USES amount_paid WITHOUT cap(total_amount) FOR revenue_aggregation
    AND EXISTS record IN input.records WHERE record.amount_paid > record.total_amount
    RETURN true

  RETURN false
END FUNCTION
```

### Examples

- **Weekly > Monthly (Form 1):** Bills created Mar 23–29 have `remaining_balance` values that
  reflect payments made after Mar 29. Bills created Mar 1–22 may have been fully paid by now,
  reducing their `remaining_balance` to ₱0. Result: Weekly ₱550 > Monthly ₱475 — impossible.
- **Partial payment (Form 1):** A ₱1,000 bill with ₱400 paid has `remaining_balance = ₱600`.
  After another ₱200 payment, `remaining_balance` becomes ₱400. The same weekly query now
  returns ₱400 instead of ₱600 — the value changed without any new bills being created.
- **Overpayment (Form 2):** A bill with `total_amount = ₱500` and `amount_paid = ₱600` (data
  entry error) contributes ₱600 to revenue instead of ₱500, inflating the total by ₱100.
- **Normal partial payment (no bug):** A ₱1,000 bill with ₱400 paid — `total_amount - amount_paid
  = ₱600` is the correct unpaid contribution, identical to `remaining_balance` at this moment.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Records with `payment_status = 'Cancelled'` must continue to be excluded from Unpaid Bills
- Records where `amount_paid <= total_amount` must continue to report `amount_paid` as their
  revenue contribution (the cap only activates when `amount_paid > total_amount`)
- Records with `payment_status = 'Paid'` and `amount_paid = total_amount` must continue to
  contribute ₱0 to Unpaid Bills (`total_amount - amount_paid = 0`)
- All financial metrics must continue to be scoped to `created_at` within the selected date range
- Net Revenue must continue to subtract `discount_amount` from the revenue figure
- The Billing Financial Tab must continue to show the same columns, filters, sorting, pagination,
  and CSV export behavior
- `fetchFinancialData` in `billingFinancialService.js` must continue to return the same record
  shape (including `remaining_balance` for display purposes if needed)

**Scope:**
All inputs that do NOT involve the `remaining_balance` aggregation or uncapped `amount_paid`
aggregation are completely unaffected. This includes:
- All UI display logic (table columns, charts, filters)
- Date range computation (`computeDateRange`, `getPreviousPeriod`)
- Discount calculations and chart data
- Cash flow chart grouping (`buildCashFlowData`)
- CSV export (`exportToCSV`)
- Patient distribution, revenue trend, performance metrics

## Hypothesized Root Cause

1. **Mutable Column Used as Immutable Aggregate**: `remaining_balance` was designed as a
   convenience snapshot for display (showing the current balance on a single record), but it was
   repurposed as an aggregate source for time-windowed queries. Since it is overwritten on every
   payment, it violates the immutability assumption required for consistent aggregation.

2. **Missing Deterministic Formula**: The correct formula `SUM(total_amount) - SUM(amount_paid)`
   was never applied. Both `total_amount` and `amount_paid` are append-only in practice (payments
   only increase `amount_paid`), making their difference a stable, deterministic measure of
   outstanding balance at any point in time.

3. **No Revenue Cap**: `getTotalRevenue` was written assuming `amount_paid <= total_amount` is
   always true. No guard was added for the data-entry error case where `amount_paid` exceeds
   `total_amount`.

4. **Dual Implementation Without Shared Logic**: The same aggregation logic was duplicated in
   `analyticsService.js` (dashboard) and `billingFinancialService.js` (billing tab), so the
   defect exists in both places independently.

## Correctness Properties

Property 1: Bug Condition — Unpaid Bills Determinism

_For any_ billing record set queried over a date range, `getAccountsReceivable_fixed` SHALL
return `SUM(total_amount) - SUM(amount_paid)` for non-cancelled records, producing a value that
is independent of when the query runs and depends only on the records' `total_amount` and
`amount_paid` columns.

**Validates: Requirements 2.1, 2.4**

Property 2: Bug Condition — Additive Containment

_For any_ weekly date range W that falls entirely within monthly date range M,
`getAccountsReceivable_fixed(M) >= getAccountsReceivable_fixed(W)`, satisfying the additive
containment invariant for Unpaid Bills.

**Validates: Requirements 2.2**

Property 3: Bug Condition — Revenue Cap

_For any_ billing record where `amount_paid > total_amount`, `getTotalRevenue_fixed` SHALL use
`total_amount` as that record's revenue contribution, not `amount_paid`, so that data-entry errors
do not inflate the reported total.

**Validates: Requirements 2.3**

Property 4: Preservation — Normal Partial Payments

_For any_ billing record where `amount_paid <= total_amount` (the normal case),
`getTotalRevenue_fixed` SHALL return the same value as the original function — `amount_paid` is
used unchanged as the revenue contribution.

**Validates: Requirements 3.3, 3.4**

Property 5: Preservation — Fully Paid Bills

_For any_ billing record with `payment_status = 'Paid'` and `amount_paid = total_amount`, the
fixed unpaid bills calculation SHALL contribute ₱0 for that record
(`total_amount - amount_paid = 0`).

**Validates: Requirements 3.1**

Property 6: Preservation — Cancelled Records Excluded

_For any_ billing record with `payment_status = 'Cancelled'`, the fixed functions SHALL continue
to exclude that record from Unpaid Bills calculations, identical to the original behavior.

**Validates: Requirements 3.2**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File 1**: `rcmc-emr/src/services/analyticsService.js`

**Function**: `getAccountsReceivable`

**Specific Changes**:
1. **Change selected columns**: Replace `.select('remaining_balance')` with
   `.select('total_amount, amount_paid')` — fetch the two immutable columns instead of the
   mutable snapshot
2. **Change aggregation formula**: Replace
   `data.reduce((acc, bill) => acc + (parseFloat(bill.remaining_balance) || 0), 0)`
   with
   `data.reduce((acc, bill) => acc + Math.max(0, (parseFloat(bill.total_amount) || 0) - (parseFloat(bill.amount_paid) || 0)), 0)`

---

**File 1**: `rcmc-emr/src/services/analyticsService.js`

**Function**: `getTotalRevenue`

**Specific Changes**:
1. **Change selected columns**: Replace `.select('amount_paid')` with
   `.select('amount_paid, total_amount')` — also fetch `total_amount` for the cap
2. **Change aggregation formula**: Replace
   `data.reduce((acc, bill) => acc + (parseFloat(bill.amount_paid) || 0), 0)`
   with
   `data.reduce((acc, bill) => acc + Math.min(parseFloat(bill.amount_paid) || 0, parseFloat(bill.total_amount) || 0), 0)`

---

**File 2**: `rcmc-emr/src/services/billingFinancialService.js`

**Function**: `computeKPIs`

**Specific Changes**:
1. **Change `unpaidBills` formula**: Replace
   `.reduce((sum, r) => sum + (r.remaining_balance || 0), 0)`
   with
   `.reduce((sum, r) => sum + Math.max(0, (r.total_amount || 0) - (r.amount_paid || 0)), 0)`
   (the `fetchFinancialData` query already selects `total_amount` and `amount_paid`)
2. **Change `netRevenue` formula**: Replace
   `.reduce((sum, r) => sum + (r.amount_paid || 0), 0)`
   with
   `.reduce((sum, r) => sum + Math.min(r.amount_paid || 0, r.total_amount || 0), 0)`
   to cap revenue per record at `total_amount`

Note: `fetchFinancialData` already selects both `total_amount` and `amount_paid`, so no query
change is needed in `billingFinancialService.js` — only the `computeKPIs` reduce logic changes.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate
the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm
or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write unit tests that construct billing record sets where `remaining_balance`
diverges from `total_amount - amount_paid` (simulating post-payment state), then assert that the
unfixed functions return the wrong value. Run these tests on the UNFIXED code to observe failures.

**Test Cases**:
1. **Mutable Snapshot Test**: Create two records — one with `remaining_balance = ₱0` (fully paid
   after creation) but `total_amount = ₱500, amount_paid = ₱500`. Assert that the unfixed
   `getAccountsReceivable` returns ₱0 while the correct answer is also ₱0 here — then create a
   case where `remaining_balance` was updated mid-period to show the divergence (will fail on
   unfixed code when `remaining_balance` != `total_amount - amount_paid`)
2. **Additive Containment Test**: Construct a weekly record set (subset of monthly) where
   `remaining_balance` values have been reduced by payments, making weekly total > monthly total.
   Assert `monthly >= weekly` — will fail on unfixed code.
3. **Revenue Cap Test**: Create a record with `amount_paid = ₱600, total_amount = ₱500`. Assert
   that unfixed `getTotalRevenue` returns ₱600 (demonstrating the inflation bug).
4. **computeKPIs Snapshot Test**: Pass records with divergent `remaining_balance` to `computeKPIs`
   and assert the unfixed function uses `remaining_balance` — will fail when we expect the
   deterministic formula.

**Expected Counterexamples**:
- `getAccountsReceivable` returns a value based on current `remaining_balance` rather than
  `total_amount - amount_paid`, causing weekly > monthly for the same billing set
- `getTotalRevenue` returns a value exceeding `SUM(total_amount)` when any record has
  `amount_paid > total_amount`
- Possible causes: mutable column aggregation, missing revenue cap

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed functions produce
the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := getAccountsReceivable_fixed(input) OR getTotalRevenue_fixed(input)
  ASSERT expectedBehavior(result)
END FOR

FUNCTION expectedBehavior(result)
  // For unpaid bills: result equals SUM(total_amount) - SUM(amount_paid) for non-cancelled
  // For revenue: result equals SUM(MIN(amount_paid, total_amount))
  RETURN result IS deterministic AND result <= SUM(total_amount)
END FUNCTION
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed functions
produce the same result as the original functions.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT originalFunction(input) = fixedFunction(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for normal partial payments and cancelled
records, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Normal Partial Payment Preservation**: For records where `amount_paid <= total_amount`,
   verify `getTotalRevenue_fixed` returns the same value as the original
2. **Fully Paid Bill Preservation**: For records with `payment_status = 'Paid'` and
   `amount_paid = total_amount`, verify unpaid contribution is ₱0 under both old and new formula
3. **Cancelled Record Exclusion Preservation**: Verify cancelled records are excluded from
   `unpaidBills` in both `getAccountsReceivable_fixed` and `computeKPIs_fixed`
4. **Date Scoping Preservation**: Verify records outside the date range continue to be excluded

### Unit Tests

- Test `getAccountsReceivable` with records where `remaining_balance != total_amount - amount_paid`
  to confirm the fix uses the deterministic formula
- Test `getTotalRevenue` with a record where `amount_paid > total_amount` to confirm the cap
- Test `computeKPIs` with mixed records (cancelled, paid, partial) to confirm correct `unpaidBills`
  and `netRevenue` values
- Test edge cases: all records cancelled (unpaid = ₱0), empty record set (unpaid = ₱0)

### Property-Based Tests

- Generate random sets of billing records with `amount_paid <= total_amount` and verify
  `getTotalRevenue_fixed` equals `SUM(amount_paid)` (preservation of normal case)
- Generate random weekly/monthly date range pairs where W ⊆ M and verify
  `getAccountsReceivable_fixed(M) >= getAccountsReceivable_fixed(W)` (additive containment)
- Generate random billing records and verify `computeKPIs_fixed.unpaidBills` equals
  `SUM(total_amount - amount_paid)` for non-cancelled records across many configurations

### Integration Tests

- Load the Reports & Analytics dashboard with a weekly filter, then switch to the monthly filter
  containing that week, and verify monthly Unpaid Bills >= weekly Unpaid Bills
- Load the Billing Financial Tab and verify KPI cards show consistent values with the analytics
  dashboard for the same date range
- Verify that after a payment is recorded, re-querying the same date range returns the same
  Unpaid Bills value (determinism check — the formula is independent of payment timing)
