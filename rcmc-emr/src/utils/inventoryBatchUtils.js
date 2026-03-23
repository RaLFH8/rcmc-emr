// Pure utility functions for medicine inventory batch tracking
// No React or Supabase imports — all functions are side-effect free

/**
 * Generates a unique batch number.
 * @returns {string} e.g. "BATCH-1710000000000-A1B2"
 */
export function generateBatchNumber() {
  return `BATCH-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

/**
 * Returns the FIFO-eligible batches: active (stock > 0, not Expired),
 * filtered to only those with the earliest expiration_date (including ties).
 * @param {Array} batches
 * @returns {Array}
 */
export function getFifoBatches(batches) {
  const active = batches.filter(b => b.stock > 0 && b.status !== 'Expired')
  if (active.length === 0) return []
  const minDate = active.reduce((min, b) => {
    if (!min) return b.expiration_date
    return b.expiration_date < min ? b.expiration_date : min
  }, null)
  return active.filter(b => b.expiration_date === minDate)
}

/**
 * Builds two Sets of deduplication keys from existing inventory rows:
 * - batchKey: "name_lower|batch_number" — matches the batch_number unique constraint
 * - naturalKey: "name_lower|lot_number|expiration_date|manufacture_date" — matches the
 *   natural unique constraint on (name, lot_number, expiration_date, manufacture_date)
 * @param {Array} inventory
 * @returns {{ batchKeys: Set<string>, naturalKeys: Set<string> }}
 */
export function buildExistingKeySet(inventory) {
  const batchKeys = new Set()
  const naturalKeys = new Set()
  for (const item of inventory) {
    const name = (item.name ?? '').toLowerCase()
    batchKeys.add(`${name}|${item.batch_number ?? ''}`)
    naturalKeys.add(`${name}|${item.lot_number ?? ''}|${item.expiration_date ?? ''}|${item.manufacture_date ?? ''}`)
  }
  return { batchKeys, naturalKeys }
}

/**
 * Returns true if the CSV row already exists in either key set.
 * Checks both the batch_number constraint and the natural key constraint.
 * @param {Object} row - parsed CSV row
 * @param {{ batchKeys: Set<string>, naturalKeys: Set<string> }} keySet
 * @returns {boolean}
 */
export function isDuplicate(row, keySet) {
  const name = (row.item_name ?? '').toLowerCase()
  const batchKey = `${name}|${row.batch_number ?? ''}`
  const naturalKey = `${name}|${row.lot_number ?? ''}|${row.expiration_date ?? ''}|${row.manufacture_date ?? ''}`
  return keySet.batchKeys.has(batchKey) || keySet.naturalKeys.has(naturalKey)
}

/**
 * Groups batch records by name, computing total_stock, batch_count, earliest_expiry per group.
 * @param {Array} batches
 * @returns {Array<{name, total_stock, batch_count, earliest_expiry, batches}>}
 */
export function groupBySummary(batches) {
  const map = new Map()
  for (const batch of batches) {
    const key = batch.name
    if (!map.has(key)) {
      map.set(key, { name: key, total_stock: 0, batch_count: 0, earliest_expiry: null, batches: [] })
    }
    const group = map.get(key)
    group.total_stock += batch.stock ?? 0
    group.batch_count += 1
    group.batches.push(batch)
    if (batch.expiration_date) {
      if (!group.earliest_expiry || batch.expiration_date < group.earliest_expiry) {
        group.earliest_expiry = batch.expiration_date
      }
    }
  }
  return Array.from(map.values())
}

/**
 * Returns true if any batch in the array has status 'Expired' or 'Expiring Soon'.
 * @param {Array} batches
 * @returns {boolean}
 */
export function getStatusWarning(batches) {
  return batches.some(b => b.status === 'Expired' || b.status === 'Expiring Soon')
}
