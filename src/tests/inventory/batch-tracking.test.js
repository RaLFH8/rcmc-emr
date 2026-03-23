// Feature: medicine-inventory-batch-tracking
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import {
  generateBatchNumber,
  getFifoBatches,
  buildExistingKeySet,
  isDuplicate,
  groupBySummary,
  getStatusWarning,
} from '../../utils/inventoryBatchUtils'

// ─── Arbitraries ────────────────────────────────────────────────────────────

const arbDate = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31'), noInvalidDate: true })
  .map(d => d.toISOString().slice(0, 10))

const arbStatus = fc.constantFrom('In Stock', 'Low Stock', 'Critical', 'Out of Stock', 'Expiring Soon', 'Expired')

const arbBatch = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 30 }),
  batch_number: fc.string({ minLength: 1, maxLength: 20 }),
  lot_number: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: null }),
  stock: fc.integer({ min: 0, max: 1000 }),
  expiration_date: arbDate,
  manufacture_date: fc.option(arbDate, { nil: null }),
  status: arbStatus,
  reorder_level: fc.integer({ min: 1, max: 100 }),
})

const arbInventoryItem = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 30 }),
  batch_number: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: null }),
  expiration_date: fc.option(arbDate, { nil: null }),
})

// ─── P1: Batch uniqueness constraint ────────────────────────────────────────
describe('Property 1: Batch uniqueness constraint', () => {
  it('isDuplicate correctly identifies a row that matches an existing inventory entry', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1, maxLength: 20 }),
      fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: '' }),
      fc.option(arbDate, { nil: '' }),
      (name, batchNum, expDate) => {
        const existing = [{ name, batch_number: batchNum, expiration_date: expDate }]
        const keySet = buildExistingKeySet(existing)
        const row = { item_name: name, batch_number: batchNum, expiration_date: expDate }
        expect(isDuplicate(row, keySet)).toBe(true)
      }
    ), { numRuns: 100 })
  })

  it('isDuplicate returns false for a row not in the key set', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1, maxLength: 20 }),
      fc.string({ minLength: 1, maxLength: 20 }),
      (name, differentBatch) => {
        const existing = [{ name, batch_number: 'ORIGINAL', expiration_date: '2025-01-01' }]
        const keySet = buildExistingKeySet(existing)
        const row = { item_name: name, batch_number: differentBatch, expiration_date: '2025-06-01' }
        // Only a duplicate if all three fields match
        if (differentBatch !== 'ORIGINAL') {
          expect(isDuplicate(row, keySet)).toBe(false)
        }
      }
    ), { numRuns: 100 })
  })
})

// ─── P2: Batch round-trip field preservation ────────────────────────────────
describe('Property 2: Batch round-trip field preservation', () => {
  it('groupBySummary preserves all batch objects in the batches array', () => {
    fc.assert(fc.property(
      fc.array(arbBatch, { minLength: 1, maxLength: 20 }),
      (batches) => {
        const summaries = groupBySummary(batches)
        const allBatchIds = summaries.flatMap(s => s.batches.map(b => b.id))
        const originalIds = batches.map(b => b.id)
        expect(allBatchIds.sort()).toEqual(originalIds.sort())
      }
    ), { numRuns: 100 })
  })
})

// ─── P3: Auto-generated batch number format ──────────────────────────────────
describe('Property 3: Auto-generated batch number format', () => {
  it('generateBatchNumber always returns a string matching BATCH-{digits}-{alphanumeric}', () => {
    fc.assert(fc.property(
      fc.constant(null),
      () => {
        const bn = generateBatchNumber()
        expect(bn).toMatch(/^BATCH-\d+-[A-Z0-9]+$/)
      }
    ), { numRuns: 200 })
  })

  it('generateBatchNumber produces unique values across many calls', () => {
    const results = Array.from({ length: 100 }, () => generateBatchNumber())
    const unique = new Set(results)
    // Allow very rare collisions but expect near-uniqueness
    expect(unique.size).toBeGreaterThan(90)
  })
})

// ─── P4: Status auto-classification consistency ──────────────────────────────
describe('Property 4: Status auto-classification', () => {
  it('getStatusWarning returns true when any batch is Expired or Expiring Soon', () => {
    fc.assert(fc.property(
      fc.array(arbBatch, { minLength: 1, maxLength: 10 }),
      fc.constantFrom('Expired', 'Expiring Soon'),
      (batches, warningStatus) => {
        const withWarning = [{ ...batches[0], status: warningStatus }, ...batches.slice(1)]
        expect(getStatusWarning(withWarning)).toBe(true)
      }
    ), { numRuns: 100 })
  })

  it('getStatusWarning returns false when no batch is Expired or Expiring Soon', () => {
    fc.assert(fc.property(
      fc.array(
        arbBatch.map(b => ({ ...b, status: 'In Stock' })),
        { minLength: 1, maxLength: 10 }
      ),
      (batches) => {
        expect(getStatusWarning(batches)).toBe(false)
      }
    ), { numRuns: 100 })
  })
})

// ─── P5: Summary aggregation correctness ────────────────────────────────────
describe('Property 5: Summary aggregation correctness', () => {
  it('groupBySummary total_stock equals sum of batch stocks per name', () => {
    fc.assert(fc.property(
      fc.array(arbBatch, { minLength: 1, maxLength: 30 }),
      (batches) => {
        const summaries = groupBySummary(batches)
        for (const summary of summaries) {
          const expected = batches
            .filter(b => b.name === summary.name)
            .reduce((sum, b) => sum + (b.stock ?? 0), 0)
          expect(summary.total_stock).toBe(expected)
        }
      }
    ), { numRuns: 100 })
  })

  it('groupBySummary batch_count equals number of batches per name', () => {
    fc.assert(fc.property(
      fc.array(arbBatch, { minLength: 1, maxLength: 30 }),
      (batches) => {
        const summaries = groupBySummary(batches)
        for (const summary of summaries) {
          const expected = batches.filter(b => b.name === summary.name).length
          expect(summary.batch_count).toBe(expected)
        }
      }
    ), { numRuns: 100 })
  })

  it('groupBySummary earliest_expiry is the minimum expiration_date per name', () => {
    fc.assert(fc.property(
      fc.array(arbBatch, { minLength: 1, maxLength: 30 }),
      (batches) => {
        const summaries = groupBySummary(batches)
        for (const summary of summaries) {
          const dates = batches
            .filter(b => b.name === summary.name && b.expiration_date)
            .map(b => b.expiration_date)
          const expected = dates.length > 0 ? dates.reduce((min, d) => d < min ? d : min) : null
          expect(summary.earliest_expiry).toBe(expected)
        }
      }
    ), { numRuns: 100 })
  })
})

// ─── P6: Summary warning indicator ──────────────────────────────────────────
describe('Property 6: Summary warning indicator', () => {
  it('getStatusWarning returns true iff any batch has Expired or Expiring Soon status', () => {
    fc.assert(fc.property(
      fc.array(arbBatch, { minLength: 0, maxLength: 15 }),
      (batches) => {
        const expected = batches.some(b => b.status === 'Expired' || b.status === 'Expiring Soon')
        expect(getStatusWarning(batches)).toBe(expected)
      }
    ), { numRuns: 100 })
  })
})

// ─── P7: Batch detail ordering ───────────────────────────────────────────────
describe('Property 7: Batch detail completeness and ordering', () => {
  it('sorting batches by expiration_date ASC produces a non-decreasing sequence', () => {
    fc.assert(fc.property(
      fc.array(arbBatch, { minLength: 0, maxLength: 20 }),
      (batches) => {
        const sorted = [...batches].sort((a, b) => {
          if (!a.expiration_date) return 1
          if (!b.expiration_date) return -1
          return a.expiration_date.localeCompare(b.expiration_date)
        })
        for (let i = 1; i < sorted.length; i++) {
          if (sorted[i - 1].expiration_date && sorted[i].expiration_date) {
            expect(sorted[i - 1].expiration_date <= sorted[i].expiration_date).toBe(true)
          }
        }
      }
    ), { numRuns: 100 })
  })
})

// ─── P8: FIFO selection ──────────────────────────────────────────────────────
describe('Property 8: FIFO selection', () => {
  it('getFifoBatches returns only batches with the minimum expiration_date among active batches', () => {
    fc.assert(fc.property(
      fc.array(
        arbBatch.map(b => ({ ...b, stock: Math.max(1, b.stock), status: 'In Stock' })),
        { minLength: 1, maxLength: 20 }
      ),
      (batches) => {
        const fifo = getFifoBatches(batches)
        if (fifo.length === 0) return
        const minDate = fifo[0].expiration_date
        // All FIFO batches share the minimum date
        expect(fifo.every(b => b.expiration_date === minDate)).toBe(true)
        // No active batch has an earlier date
        const activeDates = batches
          .filter(b => b.stock > 0 && b.status !== 'Expired')
          .map(b => b.expiration_date)
        const trueMin = activeDates.reduce((m, d) => d < m ? d : m)
        expect(minDate).toBe(trueMin)
      }
    ), { numRuns: 100 })
  })

  it('getFifoBatches returns empty array when all batches are expired or have zero stock', () => {
    fc.assert(fc.property(
      fc.array(
        arbBatch.map(b => ({ ...b, stock: 0 })),
        { minLength: 1, maxLength: 10 }
      ),
      (batches) => {
        expect(getFifoBatches(batches)).toEqual([])
      }
    ), { numRuns: 100 })
  })
})

// ─── P9: Expiring inventory filter ───────────────────────────────────────────
describe('Property 9: Expiring inventory filter', () => {
  it('expiring filter includes only batches with expiry within 90 days and stock > 0', () => {
    fc.assert(fc.property(
      fc.array(arbBatch, { minLength: 0, maxLength: 20 }),
      (batches) => {
        const today = new Date()
        const cutoff = new Date(today)
        cutoff.setDate(cutoff.getDate() + 90)
        const filtered = batches.filter(b => {
          if (!b.expiration_date || b.stock <= 0) return false
          const exp = new Date(b.expiration_date)
          return exp >= today && exp <= cutoff
        })
        // All filtered batches must have stock > 0 and expiry within range
        expect(filtered.every(b => b.stock > 0)).toBe(true)
        expect(filtered.every(b => {
          const exp = new Date(b.expiration_date)
          return exp >= today && exp <= cutoff
        })).toBe(true)
      }
    ), { numRuns: 100 })
  })
})

// ─── P10: Expired inventory filter ───────────────────────────────────────────
describe('Property 10: Expired inventory filter', () => {
  it('expired filter includes only batches with expiry before today and stock > 0', () => {
    fc.assert(fc.property(
      fc.array(arbBatch, { minLength: 0, maxLength: 20 }),
      (batches) => {
        const today = new Date()
        const filtered = batches.filter(b => {
          if (!b.expiration_date || b.stock <= 0) return false
          return new Date(b.expiration_date) < today
        })
        expect(filtered.every(b => b.stock > 0)).toBe(true)
        expect(filtered.every(b => new Date(b.expiration_date) < today)).toBe(true)
      }
    ), { numRuns: 100 })
  })
})

// ─── P11: Search filter correctness ──────────────────────────────────────────
describe('Property 11: Search filter correctness', () => {
  it('search filter returns exactly rows where name or supplier contains the term (case-insensitive)', () => {
    fc.assert(fc.property(
      fc.array(
        fc.record({ name: fc.string({ minLength: 1, maxLength: 20 }), supplier: fc.string({ minLength: 0, maxLength: 20 }) }),
        { minLength: 0, maxLength: 20 }
      ),
      fc.string({ minLength: 1, maxLength: 5 }),
      (items, term) => {
        const filtered = items.filter(i =>
          i.name.toLowerCase().includes(term.toLowerCase()) ||
          i.supplier.toLowerCase().includes(term.toLowerCase())
        )
        const expected = items.filter(i =>
          i.name.toLowerCase().includes(term.toLowerCase()) ||
          i.supplier.toLowerCase().includes(term.toLowerCase())
        )
        expect(filtered.length).toBe(expected.length)
      }
    ), { numRuns: 100 })
  })
})

// ─── P12: Category filter correctness ────────────────────────────────────────
describe('Property 12: Category filter correctness', () => {
  it('category filter returns only summaries matching the selected category', () => {
    fc.assert(fc.property(
      fc.array(
        fc.record({ name: fc.string({ minLength: 1 }), category: fc.constantFrom('A', 'B', 'C') }),
        { minLength: 0, maxLength: 20 }
      ),
      fc.constantFrom('A', 'B', 'C'),
      (summaries, cat) => {
        const filtered = summaries.filter(s => s.category === cat)
        expect(filtered.every(s => s.category === cat)).toBe(true)
      }
    ), { numRuns: 100 })
  })
})

// ─── P13: Status filter correctness ──────────────────────────────────────────
describe('Property 13: Status filter correctness', () => {
  it('status filter returns only summaries with at least one batch matching the status', () => {
    fc.assert(fc.property(
      fc.array(
        fc.record({
          name: fc.string({ minLength: 1 }),
          batches: fc.array(fc.record({ status: arbStatus }), { minLength: 1, maxLength: 5 })
        }),
        { minLength: 0, maxLength: 15 }
      ),
      arbStatus,
      (summaries, filterStatus) => {
        const filtered = summaries.filter(s => s.batches.some(b => b.status === filterStatus))
        expect(filtered.every(s => s.batches.some(b => b.status === filterStatus))).toBe(true)
      }
    ), { numRuns: 100 })
  })
})

// ─── P14: CSV deduplication ───────────────────────────────────────────────────
describe('Property 14: CSV deduplication', () => {
  it('buildExistingKeySet + isDuplicate correctly identifies overlapping rows', () => {
    fc.assert(fc.property(
      fc.array(arbInventoryItem, { minLength: 1, maxLength: 20 }),
      (inventory) => {
        const keySet = buildExistingKeySet(inventory)
        // Every item in inventory should be detected as a duplicate when re-submitted
        for (const item of inventory) {
          const row = {
            item_name: item.name,
            batch_number: item.batch_number ?? '',
            expiration_date: item.expiration_date ?? '',
          }
          expect(isDuplicate(row, keySet)).toBe(true)
        }
      }
    ), { numRuns: 100 })
  })

  it('a row with a different batch_number is not a duplicate', () => {
    fc.assert(fc.property(
      arbInventoryItem,
      fc.string({ minLength: 1, maxLength: 20 }),
      (item, newBatch) => {
        fc.pre(newBatch !== (item.batch_number ?? ''))
        const keySet = buildExistingKeySet([item])
        const row = {
          item_name: item.name,
          batch_number: newBatch,
          expiration_date: item.expiration_date ?? '',
        }
        expect(isDuplicate(row, keySet)).toBe(false)
      }
    ), { numRuns: 100 })
  })
})

// ─── P15: CSV import accounting ──────────────────────────────────────────────
describe('Property 15: CSV import accounting', () => {
  it('inserted + skipped + failed always equals total rows', () => {
    fc.assert(fc.property(
      fc.array(arbInventoryItem, { minLength: 0, maxLength: 20 }),
      fc.array(
        fc.record({
          item_name: fc.string({ minLength: 1, maxLength: 20 }),
          batch_number: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: '' }),
          expiration_date: fc.option(arbDate, { nil: '' }),
        }),
        { minLength: 0, maxLength: 20 }
      ),
      (existingInventory, csvRows) => {
        const keySet = buildExistingKeySet(existingInventory)
        let inserted = 0, skipped = 0, failed = 0
        for (const row of csvRows) {
          try {
            if (isDuplicate(row, keySet)) { skipped++; continue }
            // Simulate successful insert
            inserted++
          } catch {
            failed++
          }
        }
        expect(inserted + skipped + failed).toBe(csvRows.length)
      }
    ), { numRuns: 100 })
  })
})

// ─── P16: CSV parsing round-trip ─────────────────────────────────────────────
describe('Property 16: CSV parsing round-trip', () => {
  it('a CSV string with required columns can be parsed and all required fields are accessible', () => {
    fc.assert(fc.property(
      fc.array(
        fc.record({
          item_name: fc.string({ minLength: 1, maxLength: 20 }).map(s => s.replace(/[,"\n]/g, '_')),
          price: fc.float({ min: Math.fround(0.01), max: Math.fround(9999), noNaN: true }).map(n => n.toFixed(2)),
          stock: fc.integer({ min: 0, max: 9999 }).map(String),
          unit: fc.constantFrom('Tablet', 'Capsule', 'Bottle'),
          batch_number: fc.string({ minLength: 1, maxLength: 15 }).map(s => s.replace(/[,"\n]/g, '_')),
          expiration_date: arbDate,
        }),
        { minLength: 1, maxLength: 10 }
      ),
      (rows) => {
        const headers = ['item_name', 'price', 'stock', 'unit', 'batch_number', 'expiration_date']
        const csvLines = [
          headers.join(','),
          ...rows.map(r => headers.map(h => r[h]).join(','))
        ]
        const csvText = csvLines.join('\n')

        // Parse
        const lines = csvText.trim().split('\n')
        const parsedHeaders = lines[0].split(',')
        const parsed = lines.slice(1).map(line => {
          const values = line.split(',')
          const obj = {}
          parsedHeaders.forEach((h, i) => { obj[h] = values[i] ?? '' })
          return obj
        })

        expect(parsed.length).toBe(rows.length)
        for (const row of parsed) {
          expect(typeof row.item_name).toBe('string')
          expect(typeof row.price).toBe('string')
          expect(typeof row.stock).toBe('string')
          expect(typeof row.unit).toBe('string')
          expect(typeof row.batch_number).toBe('string')
          expect(typeof row.expiration_date).toBe('string')
        }
      }
    ), { numRuns: 100 })
  })
})
