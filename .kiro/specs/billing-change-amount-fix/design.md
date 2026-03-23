# Billing Change Amount Fix — Bugfix Design

## Overview

The billing module conflates two distinct financial concepts: `cash_tendered` (what the patient physically hands over) and `amount_paid` (what is recorded as revenue earned). When a patient overpays, the raw cash input is stored directly as `amount_paid`, inflating net revenue KPIs and producing a negative `remaining_balance`. The fix caps `amount_paid` at `total_amount`, stores the raw cash separately as `cash_tendered`, and derives `change_given = cash_tendered − total_amount` for display purposes only.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug — `cash_tendered > total_amount` at the time of payment submission
- **Property (P)**: The desired behavior — `amount_paid = MIN(cash_tendered, total_amount)` and `remaining_balance = total_amount − amount_paid ≥ 0`
- **Preservation**: Existing behavior for exact-payment and partial-payment flows that must remain unchanged
- **cash_tendered**: The raw amount the cashier types into the "Amount Paid" input field (what the patient physically hands over)
- **amount_paid**: The ledger value stored in the `billing` table — capped at `total_amount`, used for revenue KPIs
- **change_given**: Derived display value — `MAX(0, cash_tendered − total_amount)` — never stored as revenue
- **handleAmountPaidChange()**: The onChange handler in `Payments.jsx` that updates `formData.amount_paid` as the cashier types
- **handleSubmit()**: Saves a new or edited billing record (non-queue path)
- **handleCompleteBilling()**: Saves a billing record originating from the billing queue (queue path)

## Bug Details

### Bug Condition

The bug manifests when the cashier enters a cash amount greater than the bill total. Both `handleSubmit()` and `handleCompleteBilling()` compute `remainingBalance = totalAmount − amountPaid` using the raw input, producing a negative value. The raw input is then stored as `amount_paid` in the database.

**Formal Specification:**
```
FUNCTION isBugCondition(formData)
  INPUT: formData with fields { total_amount, amount_paid }
  OUTPUT: boolean

  val_received = parseFloat(formData.amount_paid)
  val_total    = parseFloat(formData.total_amount)

  RETURN val_received > val_total
END FUNCTION
```

### Examples

- Bill = ₱1,250 | Cash tendered = ₱1,300 → Bug: `amount_paid` stored as ₱1,300, `remaining_balance` = −₱50
- Bill = ₱500 | Cash tendered = ₱1,000 → Bug: `amount_paid` stored as ₱1,000, `remaining_balance` = −₱500
- Bill = ₱750 | Cash tendered = ₱750 → No bug: exact payment, `amount_paid` = ₱750, `remaining_balance` = 0
- Bill = ₱1,000 | Cash tendered = ₱600 → No bug: partial payment, `amount_paid` = ₱600, `remaining_balance` = ₱400

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Exact payment: `amount_paid = total_amount`, `remaining_balance = 0`, status = `Paid`
- Partial payment: `amount_paid = cash_tendered`, `remaining_balance = total_amount − cash_tendered`, status = `Partial`
- Status-change shortcut ("Mark Paid"): `amount_paid = total_amount`, `remaining_balance = 0`
- Receipt PDF and print preview: Change row continues to display correctly

**Scope:**
All inputs where `cash_tendered ≤ total_amount` are completely unaffected by this fix. This includes:
- Exact-payment submissions
- Partial-payment submissions
- GCash / Maya / Bank Transfer / Credit Card payments (non-cash methods where overpayment is not applicable)
- The `handleStatusChange()` shortcut path

## Hypothesized Root Cause

1. **Missing cap in handleSubmit()**: `amountPaid` is set directly from `parseFloat(formData.amount_paid)` with no upper bound check against `totalAmount`

2. **Missing cap in handleCompleteBilling()**: Same pattern — `amountPaid = parseFloat(formData.amount_paid || formData.total_amount)` — no cap applied before computing `remainingBalance`

3. **No cash_tendered field in formData**: The form state has no separate field to hold the raw cash input, so there is nowhere to store it independently of the ledger value

4. **View panel change calculation uses stored amount_paid**: The view panel computes change as `amount_paid − total_amount`, which will always be 0 after the fix unless `cash_tendered` is stored separately and surfaced

## Correctness Properties

Property 1: Bug Condition — Overpayment Capping

_For any_ payment submission where `cash_tendered > total_amount` (isBugCondition returns true), the fixed `handleSubmit()` and `handleCompleteBilling()` SHALL store `amount_paid = total_amount`, `remaining_balance = 0`, and `change_given = cash_tendered − total_amount`.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation — Non-Overpayment Behavior

_For any_ payment submission where `cash_tendered ≤ total_amount` (isBugCondition returns false), the fixed functions SHALL produce the same `amount_paid`, `remaining_balance`, and `payment_status` as the original functions, preserving exact-payment and partial-payment behavior.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Fix Implementation

### Changes Required

**File**: `rcmc-emr/src/pages/Payments.jsx`

**Specific Changes**:

1. **Add `cash_tendered` to formData initial state** (and in `closeModal` reset):
   ```js
   cash_tendered: ''
   ```

2. **Fix `handleAmountPaidChange()`** — store raw input in `cash_tendered`; compute capped `amount_paid` for status logic:
   ```js
   const handleAmountPaidChange = (value) => {
     const val_received = parseFloat(value) || 0
     const val_total    = parseFloat(formData.total_amount) || 0
     let capped_paid, change_given

     if (val_received > val_total) {
       capped_paid  = val_total
       change_given = val_received - val_total
     } else {
       capped_paid  = val_received
       change_given = 0
     }

     const newStatus = getAutoStatus(formData.total_amount, capped_paid)
     setFormData({
       ...formData,
       cash_tendered: value,
       amount_paid: capped_paid > 0 ? capped_paid.toString() : '',
       change_given,
       payment_status: newStatus
     })
   }
   ```

3. **Fix `handleSubmit()`** — use capped `amount_paid`; `remaining_balance` cannot go negative:
   ```js
   const totalAmount      = parseFloat(formData.total_amount)
   const cashTendered     = parseFloat(formData.cash_tendered || formData.amount_paid || formData.total_amount)
   const amountPaid       = Math.min(cashTendered, totalAmount)
   const remainingBalance = Math.max(0, totalAmount - amountPaid)
   ```

4. **Fix `handleCompleteBilling()`** — same cap logic as handleSubmit():
   ```js
   const totalAmount      = parseFloat(formData.total_amount)
   const cashTendered     = parseFloat(formData.cash_tendered || formData.amount_paid || formData.total_amount)
   const amountPaid       = Math.min(cashTendered, totalAmount)
   const remainingBalance = Math.max(0, totalAmount - amountPaid)
   ```

5. **Form summary UI** — add a "Change" row below the Amount Paid input when `change_given > 0`:
   ```jsx
   {formData.change_given > 0 && (
     <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
       <p className="text-sm font-semibold text-blue-900 mb-1">Change to Return</p>
       <p className="text-2xl font-bold text-blue-600">
         ₱{parseFloat(formData.change_given).toLocaleString()}
       </p>
     </div>
   )}
   ```

6. **View panel** — "Amount Paid" display should pull from `amount_paid` (capped). The existing change row `amount_paid > amount` will never trigger after the fix since `amount_paid` is now capped. To preserve change display on historical records, keep the existing logic but also check a `cash_tendered` field if present.

**Database one-time fix** (run in Supabase SQL editor):
```sql
UPDATE billing
SET amount_paid = total_amount
WHERE amount_paid > total_amount;
```

## Testing Strategy

### Validation Approach

Two-phase approach: first run exploratory tests on the unfixed code to confirm the root cause, then verify the fix and preservation after applying changes.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm the root cause.

**Test Plan**: Simulate form submissions with `cash_tendered > total_amount` and assert that `amount_paid` in the saved record equals `total_amount`, not the raw input. Run on unfixed code to observe failures.

**Test Cases**:
1. **Overpayment — handleSubmit path**: Submit with `total_amount = 1250`, `amount_paid = 1300` → expect `amount_paid = 1250` (will fail on unfixed code)
2. **Overpayment — handleCompleteBilling path**: Same values via queue path → expect `amount_paid = 1250` (will fail on unfixed code)
3. **Remaining balance negative check**: After unfixed submission, assert `remaining_balance >= 0` (will fail on unfixed code)
4. **Large overpayment**: `total_amount = 500`, `amount_paid = 1000` → expect `amount_paid = 500`, `change_given = 500` (will fail on unfixed code)

**Expected Counterexamples**:
- `amount_paid` stored as raw cash input instead of bill total
- `remaining_balance` is negative (e.g., −50)

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed functions produce the expected behavior.

**Pseudocode:**
```
FOR ALL formData WHERE isBugCondition(formData) DO
  result := handleSubmit_fixed(formData)
  ASSERT result.amount_paid  == formData.total_amount
  ASSERT result.remaining_balance == 0
  ASSERT result.change_given == formData.cash_tendered - formData.total_amount
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed functions produce the same result as the original functions.

**Pseudocode:**
```
FOR ALL formData WHERE NOT isBugCondition(formData) DO
  ASSERT handleSubmit_original(formData).amount_paid     == handleSubmit_fixed(formData).amount_paid
  ASSERT handleSubmit_original(formData).remaining_balance == handleSubmit_fixed(formData).remaining_balance
  ASSERT handleSubmit_original(formData).payment_status  == handleSubmit_fixed(formData).payment_status
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because it generates many test cases automatically across the input domain and catches edge cases that manual unit tests might miss.

**Test Cases**:
1. **Exact payment preservation**: `cash_tendered = total_amount` → `amount_paid = total_amount`, `remaining_balance = 0`, status = `Paid`
2. **Partial payment preservation**: `cash_tendered < total_amount` → `amount_paid = cash_tendered`, `remaining_balance = total_amount − cash_tendered`, status = `Partial`
3. **Zero payment preservation**: `cash_tendered = 0` → `amount_paid = 0`, status = `Pending`
4. **Status-change shortcut preservation**: `handleStatusChange('Paid')` → `amount_paid = total_amount`, `remaining_balance = 0`

### Unit Tests

- Test `handleAmountPaidChange()` with overpayment input — verify `amount_paid` is capped and `change_given` is computed
- Test `handleSubmit()` with overpayment — verify saved record has `amount_paid = total_amount` and `remaining_balance = 0`
- Test `handleCompleteBilling()` with overpayment — same assertions
- Test edge case: `cash_tendered = total_amount` (exact) — verify `change_given = 0`
- Test edge case: `cash_tendered = 0` — verify `amount_paid = 0`, status = `Pending`

### Property-Based Tests

- Generate random `(cash_tendered, total_amount)` pairs where `cash_tendered > total_amount` and verify `amount_paid = total_amount` always
- Generate random pairs where `cash_tendered ≤ total_amount` and verify `amount_paid = cash_tendered` always (preservation)
- Verify `remaining_balance ≥ 0` for all generated inputs

### Integration Tests

- Full form flow: add items → enter overpayment → submit → verify database record has correct `amount_paid`
- Queue flow: select patient from billing queue → enter overpayment → complete billing → verify record
- View panel: open saved overpayment record → verify "Amount Paid" shows capped value, not raw cash
- Receipt PDF/print: verify Change row shows correct `cash_tendered − total_amount`
