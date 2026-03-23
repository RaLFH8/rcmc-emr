# Billing Change Amount Fix — Tasks

## Task List

- [ ] 1. Write exploratory tests (run on unfixed code to confirm root cause)
  - [ ] 1.1 Create `rcmc-emr/src/tests/billing-change-amount-exploration.test.js` with test cases that simulate overpayment submissions and assert the bug is present (amount_paid stored as raw cash, remaining_balance negative)
  - [ ] 1.2 Run the exploration tests on unfixed code and record the counterexamples

- [x] 2. Apply the fix to `rcmc-emr/src/pages/Payments.jsx`
  - [x] 2.1 Add `cash_tendered` and `change_given` fields to `formData` initial state and `closeModal` reset
  - [x] 2.2 Fix `handleAmountPaidChange()` — store raw input in `cash_tendered`, compute capped `amount_paid = MIN(val_received, val_total)`, compute `change_given = MAX(0, val_received - val_total)`
  - [x] 2.3 Fix `handleSubmit()` — use `Math.min(cashTendered, totalAmount)` for `amountPaid` and `Math.max(0, totalAmount - amountPaid)` for `remainingBalance`
  - [x] 2.4 Fix `handleCompleteBilling()` — apply the same cap logic as 2.3
  - [x] 2.5 Add "Change to Return" UI row in the form summary — show when `formData.change_given > 0`
  - [x] 2.6 Verify the view panel "Amount Paid" display pulls from the capped `amount_paid` field (already correct if DB record is fixed)

- [ ] 3. Write fix-checking tests (verify the fix works for all buggy inputs)
  - [ ] 3.1 Create `rcmc-emr/src/tests/billing-change-amount-fix.test.js` with unit tests for `handleAmountPaidChange`, `handleSubmit`, and `handleCompleteBilling` covering overpayment scenarios
  - [ ] 3.2 Write property-based tests that generate random `(cash_tendered, total_amount)` pairs where `cash_tendered > total_amount` and assert `amount_paid = total_amount` and `remaining_balance = 0`

- [ ] 4. Write preservation-checking tests (verify unchanged behavior for non-buggy inputs)
  - [ ] 4.1 Write property-based tests for exact-payment inputs (`cash_tendered = total_amount`) asserting `amount_paid = total_amount`, `remaining_balance = 0`, status = `Paid`
  - [ ] 4.2 Write property-based tests for partial-payment inputs (`cash_tendered < total_amount`) asserting `amount_paid = cash_tendered`, `remaining_balance = total_amount - cash_tendered`, status = `Partial`
  - [ ] 4.3 Write unit test for `handleStatusChange('Paid')` shortcut — assert `amount_paid = total_amount`, `remaining_balance = 0`

- [ ] 5. Run the one-time database fix
  - [x] 5.1 Execute the SQL migration in Supabase to correct existing records: `UPDATE billing SET amount_paid = total_amount WHERE amount_paid > total_amount;`
