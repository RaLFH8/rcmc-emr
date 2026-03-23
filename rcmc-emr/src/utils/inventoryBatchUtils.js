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

/**
 * Computes the status of a batch based on stock level, reorder level, and expiration date.
 * Priority order (first match wins):
 *   1. stock === 0           → 'Out of Stock'
 *   2. expirationDate < today (midnight local) → 'Expired'
 *   3. stock <= reorderLevel * 0.3 → 'Critical'
 *   4. stock <= reorderLevel       → 'Low Stock'
 *   5. otherwise                   → 'In Stock'
 *
 * @param {number} stock - Current stock quantity (integer)
 * @param {number} reorderLevel - Reorder threshold (integer)
 * @param {string|null} expirationDate - ISO date string (e.g. "2025-01-15") or null
 * @returns {'Out of Stock'|'Expired'|'Critical'|'Low Stock'|'In Stock'}
 */
export function computeStatus(stock, reorderLevel, expirationDate) {
  if (stock === 0) return 'Out of Stock'

  if (expirationDate !== null && expirationDate !== undefined) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (new Date(expirationDate) < today) return 'Expired'
  }

  if (stock <= reorderLevel * 0.3) return 'Critical'
  if (stock <= reorderLevel) return 'Low Stock'

  return 'In Stock'
}

/**
 * Returns the highest-severity status present across an array of batch objects.
 * Priority (highest to lowest): Expired > Critical > Low Stock > Out of Stock > In Stock
 * Returns 'In Stock' for an empty array.
 * @param {Array<{status: string}>} batches
 * @returns {'Expired'|'Critical'|'Low Stock'|'Out of Stock'|'In Stock'}
 */
export function getWorstCaseStatus(batches) {
  if (!batches || batches.length === 0) return 'In Stock'

  const priority = ['Expired', 'Critical', 'Low Stock', 'Out of Stock', 'In Stock']

  for (const status of priority) {
    if (batches.some(b => b.status === status)) return status
  }

  return 'In Stock'
}

/**
 * Exports the flat inventory array as a CSV file and triggers a browser download.
 *
 * Columns (in order): item_name, price, stock, unit, category, supplier,
 * reorder_level, batch_number, lot_number, expiration_date, manufacture_date, status
 *
 * RFC 4180 escaping: fields containing commas or double-quotes are wrapped in
 * double-quotes; embedded double-quotes are escaped as "".
 *
 * Filename: inventory_export_YYYY-MM-DD.csv (current local date).
 * When inventory is empty, exports a header-only CSV.
 *
 * @param {Array} inventory - Flat array of batch records from the inventory table
 * @returns {void} Triggers a browser file download as a side effect
 */
export function exportInventoryCSV(inventory) {
  const COLUMNS = [
    'item_name',
    'price',
    'stock',
    'unit',
    'category',
    'supplier',
    'reorder_level',
    'batch_number',
    'lot_number',
    'expiration_date',
    'manufacture_date',
    'status',
  ]

  // Map inventory row fields to the CSV column names
  const FIELD_MAP = {
    item_name: 'name',
    price: 'price',
    stock: 'stock',
    unit: 'unit',
    category: 'category',
    supplier: 'supplier',
    reorder_level: 'reorder_level',
    batch_number: 'batch_number',
    lot_number: 'lot_number',
    expiration_date: 'expiration_date',
    manufacture_date: 'manufacture_date',
    status: 'status',
  }

  /**
   * Escapes a single CSV field per RFC 4180.
   * @param {*} value
   * @returns {string}
   */
  function escapeField(value) {
    const str = value === null || value === undefined ? '' : String(value)
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const rows = [COLUMNS.map(escapeField).join(',')]

  for (const item of inventory) {
    const row = COLUMNS.map(col => {
      const field = FIELD_MAP[col]
      return escapeField(item[field])
    })
    rows.push(row.join(','))
  }

  const csvContent = rows.join('\r\n')

  // Build filename with current local date
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const filename = `inventory_export_${yyyy}-${mm}-${dd}.csv`

  // Trigger browser download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
