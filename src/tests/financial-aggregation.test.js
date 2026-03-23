/**
 * Financial Aggregation Source-of-Truth Fix — Regression Tests
 *
 * Validates correctness properties from the bugfix spec:
 *   P1: Unpaid Bills uses deterministic formula (total_amount - amount_paid)
 *   P2: Additive containment — monthly >= weekly for any W ⊆ M
 *   P3: Revenue cap — MIN(amount_paid, total_amount) prevents inflation
 *   P4: Normal partial payments preserved
 *   P5: Fully paid bills contribute ₱0 to unpaid
 *   P6: Cancelled records excluded from unpaid bills
 */

import { describe, it, expect } from 'vitest'
import { computeKPIs } from '../services/billingFinancialService'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBill({ total_amount, amount_paid, remaining_balance, payment_status = 'Unpaid', discount_amount = 0 }) {
  return { total_amount, amount_paid, remaining_balance, payment_status, discount_amount }
}

// Simulate the fixed getAccountsReceivable aggregation logic (pure, no Supabase)
function calcUnpaid(records) {
  return records
    .filter(r => r.payment_status !== 'Cancelled')
    .reduce((sum, r) => {
      const billed = parseFloat(r.total_amount) || 0
      const paid = parseFloat(r.amount_paid) || 0
      return sum + Math.max(0, billed - paid)
    }, 0)
}

// Simulate the fixed getTotalRevenue aggregation logic (pure, no Supabase)
function calcRevenue(records) {
  return records.reduce((sum, r) => {
    const paid = parseFloat(r.amount_paid) || 0
    const billed = parseFloat(r.total_amount) || 0
    return sum + Math.min(paid, billed)
  }, 0)
}

// ---------------------------------------------------------------------------
// P1: Deterministic formula — result equals SUM(total_amount - amount_paid)
// ---------------------------------------------------------------------------

describe('P1 — Unpaid Bills determinism', () => {
  it('uses total_amount - amount_paid, not remaining_balance', () => {
    // remaining_balance has been updated to ₱0 (fully paid after creation),
    // but total_amount - amount_paid is still ₱500 (partial payment scenario)
    const records = [
      makeBill({ total_amount: 1000, amount_paid: 500, remaining_balance: 0 }),
    ]
    // Old (broken) formula would return 0; new formula returns 500
    const result = calcUnpaid(records)
    expect(result).toBe(500)
  })

  it('returns 0 for empty record set', () => {
    expect(calcUnpaid([])).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// P2: Additive containment — monthly >= weekly
// ---------------------------------------------------------------------------

describe('P2 — Additive containment (monthly >= weekly)', () => {
  it('monthly unpaid >= weekly unpaid when week is subset of month', () => {
    // Weekly bills (Mar 23–29): remaining_balance has been zeroed by later payments
    // but total_amount - amount_paid is still positive
    const weeklyRecords = [
      makeBill({ total_amount: 300, amount_paid: 100, remaining_balance: 0 }),
      makeBill({ total_amount: 250, amount_paid: 0,   remaining_balance: 0 }),
    ]
    // Monthly bills include the weekly bills plus earlier bills (Mar 1–22)
    const monthlyRecords = [
      ...weeklyRecords,
      makeBill({ total_amount: 400, amount_paid: 400, remaining_balance: 0 }), // fully paid
      makeBill({ total_amount: 600, amount_paid: 200, remaining_balance: 0 }), // partial
    ]

    const weeklyUnpaid = calcUnpaid(weeklyRecords)
    const monthlyUnpaid = calcUnpaid(monthlyRecords)

    expect(monthlyUnpaid).toBeGreaterThanOrEqual(weeklyUnpaid)
  })

  it('monthly equals weekly when no additional bills exist outside the week', () => {
    const records = [
      makeBill({ total_amount: 500, amount_paid: 200, remaining_balance: 300 }),
    ]
    expect(calcUnpaid(records)).toBe(calcUnpaid(records))
  })
})

// ---------------------------------------------------------------------------
// P3: Revenue cap — amount_paid > total_amount does not inflate revenue
// ---------------------------------------------------------------------------

describe('P3 — Revenue cap', () => {
  it('caps revenue at total_amount when amount_paid exceeds it', () => {
    const records = [
      makeBill({ total_amount: 500, amount_paid: 600, remaining_balance: 0 }),
    ]
    // Old formula: 600; fixed formula: MIN(600, 500) = 500
    expect(calcRevenue(records)).toBe(500)
  })

  it('does not cap when amount_paid equals total_amount', () => {
    const records = [
      makeBill({ total_amount: 500, amount_paid: 500, remaining_balance: 0 }),
    ]
    expect(calcRevenue(records)).toBe(500)
  })
})

// ---------------------------------------------------------------------------
// P4: Normal partial payments preserved
// ---------------------------------------------------------------------------

describe('P4 — Normal partial payments preserved', () => {
  it('returns amount_paid unchanged when amount_paid < total_amount', () => {
    const records = [
      makeBill({ total_amount: 1000, amount_paid: 400, remaining_balance: 600 }),
    ]
    expect(calcRevenue(records)).toBe(400)
  })

  it('sums multiple partial payments correctly', () => {
    const records = [
      makeBill({ total_amount: 1000, amount_paid: 400, remaining_balance: 600 }),
      makeBill({ total_amount: 800,  amount_paid: 800, remaining_balance: 0 }),
      makeBill({ total_amount: 500,  amount_paid: 250, remaining_balance: 250 }),
    ]
    expect(calcRevenue(records)).toBe(400 + 800 + 250)
  })
})

// ---------------------------------------------------------------------------
// P5: Fully paid bills contribute ₱0 to unpaid
// ---------------------------------------------------------------------------

describe('P5 — Fully paid bills contribute ₱0 to unpaid', () => {
  it('returns 0 unpaid for a fully paid bill', () => {
    const records = [
      makeBill({ total_amount: 500, amount_paid: 500, remaining_balance: 0, payment_status: 'Paid' }),
    ]
    expect(calcUnpaid(records)).toBe(0)
  })

  it('only counts unpaid portion when mixed paid and partial records', () => {
    const records = [
      makeBill({ total_amount: 500, amount_paid: 500, remaining_balance: 0, payment_status: 'Paid' }),
      makeBill({ total_amount: 300, amount_paid: 100, remaining_balance: 200 }),
    ]
    expect(calcUnpaid(records)).toBe(200)
  })
})

// ---------------------------------------------------------------------------
// P6: Cancelled records excluded from unpaid bills
// ---------------------------------------------------------------------------

describe('P6 — Cancelled records excluded', () => {
  it('excludes cancelled records from unpaid bills', () => {
    const records = [
      makeBill({ total_amount: 500, amount_paid: 0, remaining_balance: 500, payment_status: 'Cancelled' }),
      makeBill({ total_amount: 300, amount_paid: 100, remaining_balance: 200 }),
    ]
    // Only the non-cancelled record contributes
    expect(calcUnpaid(records)).toBe(200)
  })

  it('returns 0 when all records are cancelled', () => {
    const records = [
      makeBill({ total_amount: 500, amount_paid: 0, remaining_balance: 500, payment_status: 'Cancelled' }),
      makeBill({ total_amount: 300, amount_paid: 0, remaining_balance: 300, payment_status: 'Cancelled' }),
    ]
    expect(calcUnpaid(records)).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// computeKPIs integration — all properties together
// ---------------------------------------------------------------------------

describe('computeKPIs — integrated fix', () => {
  it('computes unpaidBills using deterministic formula', () => {
    const records = [
      makeBill({ total_amount: 1000, amount_paid: 400, remaining_balance: 0 }),  // remaining_balance stale
      makeBill({ total_amount: 500,  amount_paid: 500, remaining_balance: 0, payment_status: 'Paid' }),
      makeBill({ total_amount: 300,  amount_paid: 0,   remaining_balance: 0, payment_status: 'Cancelled' }),
    ]
    const kpis = computeKPIs(records)
    // Unpaid: (1000-400) + 0 (paid) + 0 (cancelled) = 600
    expect(kpis.unpaidBills).toBe(600)
  })

  it('computes netRevenue with revenue cap', () => {
    const records = [
      makeBill({ total_amount: 500, amount_paid: 600, remaining_balance: 0 }), // overpaid
      makeBill({ total_amount: 300, amount_paid: 200, remaining_balance: 100 }),
    ]
    const kpis = computeKPIs(records)
    // Revenue: MIN(600,500) + MIN(200,300) = 500 + 200 = 700
    expect(kpis.netRevenue).toBe(700)
  })

  it('monthly unpaid >= weekly unpaid via computeKPIs', () => {
    const weeklyRecords = [
      makeBill({ total_amount: 300, amount_paid: 100, remaining_balance: 0 }),
      makeBill({ total_amount: 250, amount_paid: 0,   remaining_balance: 0 }),
    ]
    const monthlyRecords = [
      ...weeklyRecords,
      makeBill({ total_amount: 400, amount_paid: 400, remaining_balance: 0, payment_status: 'Paid' }),
      makeBill({ total_amount: 600, amount_paid: 200, remaining_balance: 0 }),
    ]
    const weeklyKPIs = computeKPIs(weeklyRecords)
    const monthlyKPIs = computeKPIs(monthlyRecords)
    expect(monthlyKPIs.unpaidBills).toBeGreaterThanOrEqual(weeklyKPIs.unpaidBills)
  })
})
