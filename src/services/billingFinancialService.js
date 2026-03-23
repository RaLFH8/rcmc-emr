import { supabase } from '../lib/supabase'

// ==================== SUPABASE QUERY FUNCTIONS ====================

/**
 * Fetches billing records joined with patient names for a given date range.
 * @param {{ startDate: Date, endDate: Date }} dateRange
 * @returns {Promise<Array>} raw rows
 */
export async function fetchFinancialData(dateRange) {
  const { startDate, endDate } = dateRange
  const start = startDate instanceof Date ? startDate.toISOString().split('T')[0] : startDate
  const end = endDate instanceof Date ? endDate.toISOString().split('T')[0] : endDate

  const { data, error } = await supabase
    .from('billing')
    .select(`
      id,
      created_at,
      total_amount,
      amount_paid,
      remaining_balance,
      discount_amount,
      discount_type,
      payment_method,
      payment_status,
      patients (
        first_name,
        last_name
      )
    `)
    .gte('created_at', `${start}T00:00:00`)
    .lte('created_at', `${end}T23:59:59`)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Returns the previous period window for a given date range.
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {{ startDate: Date, endDate: Date }}
 */
export function getPreviousPeriod(startDate, endDate) {
  const start = startDate instanceof Date ? startDate : new Date(startDate)
  const end = endDate instanceof Date ? endDate : new Date(endDate)

  const duration = end.getTime() - start.getTime()
  const prevEnd = new Date(start.getTime() - 24 * 60 * 60 * 1000)
  const prevStart = new Date(prevEnd.getTime() - duration)

  return { startDate: prevStart, endDate: prevEnd }
}

/**
 * Fetches billing data for the period immediately before the given date range.
 * @param {{ startDate: Date, endDate: Date }} dateRange
 * @returns {Promise<Array>}
 */
export async function fetchPreviousPeriodData(dateRange) {
  const prev = getPreviousPeriod(dateRange.startDate, dateRange.endDate)
  return fetchFinancialData(prev)
}

// ==================== DATE RANGE COMPUTATION ====================

/**
 * Computes a { startDate, endDate } pair for a given period preset.
 * @param {'daily'|'weekly'|'monthly'|'yearly'|'custom'} period
 * @param {Date} currentDate
 * @returns {{ startDate: Date, endDate: Date } | null}
 */
export function computeDateRange(period, currentDate) {
  const d = currentDate instanceof Date ? new Date(currentDate) : new Date(currentDate)

  if (period === 'daily') {
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    return { startDate: day, endDate: new Date(day) }
  }

  if (period === 'weekly') {
    const dayOfWeek = d.getDay() // 0 = Sunday
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diffToMonday)
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6)
    return { startDate: monday, endDate: sunday }
  }

  if (period === 'monthly') {
    const first = new Date(d.getFullYear(), d.getMonth(), 1)
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    return { startDate: first, endDate: last }
  }

  if (period === 'yearly') {
    const jan1 = new Date(d.getFullYear(), 0, 1)
    const dec31 = new Date(d.getFullYear(), 11, 31)
    return { startDate: jan1, endDate: dec31 }
  }

  if (period === 'custom') {
    return null
  }

  return null
}

// ==================== VALIDATION ====================

/**
 * Validates that startDate is not after endDate.
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateDateRange(startDate, endDate) {
  const start = startDate instanceof Date ? startDate : new Date(startDate)
  const end = endDate instanceof Date ? endDate : new Date(endDate)

  if (start > end) {
    return { valid: false, error: 'Start date must be before end date' }
  }
  return { valid: true }
}

// ==================== KPI COMPUTATION ====================

/**
 * Derives KPI metrics from an array of billing records.
 * @param {Array} records
 * @returns {{ totalRevenue: number, totalTransactions: number, totalDiscounts: number, netRevenue: number }}
 */
export function computeKPIs(records) {
  const totalRevenue = records.reduce((sum, r) => sum + (r.total_amount || 0), 0)
  const totalTransactions = records.length
  const totalDiscounts = records.reduce((sum, r) => sum + (r.discount_amount || 0), 0)
  // Net revenue = MIN(amount_paid, total_amount) per record — caps data-entry errors
  const netRevenue = records.reduce((sum, r) => {
    const paid = r.amount_paid || 0
    const billed = r.total_amount || 0
    return sum + Math.min(paid, billed)
  }, 0)
  // Unpaid bills = SUM(total_amount - amount_paid) for non-cancelled records — deterministic formula
  const unpaidBills = records
    .filter(r => r.payment_status !== 'Cancelled')
    .reduce((sum, r) => {
      const billed = r.total_amount || 0
      const paid = r.amount_paid || 0
      return sum + Math.max(0, billed - paid)
    }, 0)

  return { totalRevenue, totalTransactions, totalDiscounts, netRevenue, unpaidBills }
}

// ==================== PERCENTAGE CHANGE ====================

/**
 * Computes the percentage change from previous to current.
 * @param {number} current
 * @param {number} previous
 * @returns {number | null}
 */
export function computePercentageChange(current, previous) {
  if (previous === 0) return null
  return ((current - previous) / previous) * 100
}

// ==================== PAYMENT METHOD NORMALIZATION ====================

const PAYMENT_METHOD_MAP = {
  'Cash': 'Cash',
  'GCash': 'GCash',
  'Maya': 'Maya',
  'Bank Transfer': 'BankTransfer',
}

/**
 * Normalizes a raw payment_method value to a canonical series key.
 * @param {string|null|undefined} value
 * @returns {'Cash'|'GCash'|'Maya'|'BankTransfer'|'Others'}
 */
export function normalizePaymentMethod(value) {
  return PAYMENT_METHOD_MAP[value] ?? 'Others'
}

// ==================== CASH FLOW DATA BUILDER ====================

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const PAYMENT_SERIES = ['Cash', 'GCash', 'Maya', 'BankTransfer', 'Others']

function emptyBucket(period) {
  return { period, Cash: 0, GCash: 0, Maya: 0, BankTransfer: 0, Others: 0 }
}

/**
 * Groups billing records into time buckets for the cash flow chart.
 * @param {Array} records - billing records with created_at and total_amount
 * @param {'daily'|'weekly'|'monthly'|'yearly'|'custom'} periodType
 * @returns {Array<{ period: string, Cash: number, GCash: number, Maya: number, BankTransfer: number, Others: number }>}
 */
export function buildCashFlowData(records, periodType) {
  const buckets = new Map()

  // Pre-populate ordered buckets for known period types
  if (periodType === 'daily') {
    for (let h = 0; h < 24; h++) {
      const key = String(h)
      buckets.set(key, emptyBucket(key))
    }
  } else if (periodType === 'weekly') {
    for (const day of WEEK_DAYS) {
      buckets.set(day, emptyBucket(day))
    }
  } else if (periodType === 'monthly') {
    for (let d = 1; d <= 31; d++) {
      const key = String(d)
      buckets.set(key, emptyBucket(key))
    }
  } else if (periodType === 'yearly') {
    for (const month of MONTH_NAMES) {
      buckets.set(month, emptyBucket(month))
    }
  }

  // Accumulate records into buckets
  for (const record of records) {
    const date = new Date(record.created_at)
    let key

    if (periodType === 'daily') {
      key = String(date.getHours())
    } else if (periodType === 'weekly') {
      // getDay(): 0=Sun,1=Mon,...,6=Sat → map to Mon-Sun index
      const jsDay = date.getDay()
      key = WEEK_DAYS[jsDay === 0 ? 6 : jsDay - 1]
    } else if (periodType === 'monthly') {
      key = String(date.getDate())
    } else if (periodType === 'yearly') {
      key = MONTH_NAMES[date.getMonth()]
    } else {
      // 'custom' or any other: YYYY-MM-DD
      key = date.toISOString().split('T')[0]
    }

    if (!buckets.has(key)) {
      buckets.set(key, emptyBucket(key))
    }

    const bucket = buckets.get(key)
    const series = normalizePaymentMethod(record.payment_method)
    bucket[series] += record.total_amount || 0
  }

  // Return sorted array
  if (periodType === 'daily') {
    return Array.from(buckets.values())
  } else if (periodType === 'weekly') {
    return WEEK_DAYS.map(day => buckets.get(day))
  } else if (periodType === 'monthly') {
    return Array.from(buckets.values())
  } else if (periodType === 'yearly') {
    return MONTH_NAMES.map(m => buckets.get(m))
  } else {
    // custom: sort by date string ascending
    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v)
  }
}

// ==================== DISCOUNT TYPE NORMALIZATION ====================

const DISCOUNT_TYPE_MAP = {
  'Senior Citizen': 'Senior Citizen',
  'PWD': 'PWD',
  'PhilHealth': 'PhilHealth',
  'HMO/Insurance': 'HMO/Insurance',
  'Employee/Staff': 'Employee/Staff',
  'Custom/Manual': 'Custom/Manual',
  'Senior Citizen & PWD': 'Senior Citizen',
}

/**
 * Normalizes a raw discount_type value to a canonical category.
 * null / empty string → excluded (returns null)
 * unrecognized → "Others"
 * @param {string|null|undefined} value
 * @returns {string|null}
 */
export function normalizeDiscountType(value) {
  if (value === null || value === undefined || value === '') return null
  return DISCOUNT_TYPE_MAP[value] ?? 'Others'
}

// ==================== DISCOUNT CHART DATA ====================

/**
 * Builds chart data for discount breakdown by type.
 * Excludes records with zero or null discount_amount.
 * @param {Array} records
 * @returns {Array<{ type: string, amount: number }>}
 */
export function buildDiscountChartData(records) {
  const totals = new Map()

  for (const record of records) {
    const amount = record.discount_amount || 0
    if (amount <= 0) continue

    const type = normalizeDiscountType(record.discount_type)
    if (type === null) continue

    totals.set(type, (totals.get(type) || 0) + amount)
  }

  return Array.from(totals.entries()).map(([type, amount]) => ({ type, amount }))
}

/**
 * Computes aggregate discount statistics.
 * Only considers records where discount_amount > 0.
 * @param {Array} records
 * @returns {{ total: number, count: number, average: number, highest: number }}
 */
export function computeDiscountStats(records) {
  const discounted = records.filter(r => (r.discount_amount || 0) > 0)

  if (discounted.length === 0) {
    return { total: 0, count: 0, average: 0, highest: 0 }
  }

  const total = discounted.reduce((sum, r) => sum + r.discount_amount, 0)
  const count = discounted.length
  const average = total / count
  const highest = Math.max(...discounted.map(r => r.discount_amount))

  return { total, count, average, highest }
}

// ==================== TABLE UTILITY FUNCTIONS ====================

/**
 * Applies multi-condition filters to billing records.
 * @param {Array} records
 * @param {{ paymentMethod?: string, discountType?: string, status?: string }} filter
 * @returns {Array}
 */
export function applyFilters(records, filter = {}) {
  return records.filter(record => {
    if (filter.paymentMethod && normalizePaymentMethod(record.payment_method) !== filter.paymentMethod) return false
    if (filter.discountType && normalizeDiscountType(record.discount_type) !== filter.discountType) return false
    if (filter.status && record.payment_status !== filter.status) return false
    return true
  })
}

/**
 * Sorts billing records by a given column and direction.
 * @param {Array} records
 * @param {string} column - field name on the record
 * @param {'asc'|'desc'} direction
 * @returns {Array}
 */
export function sortRecords(records, column, direction = 'asc') {
  const sorted = [...records].sort((a, b) => {
    let aVal = a[column]
    let bVal = b[column]

    // Numeric comparison for amount fields
    if (typeof aVal === 'number' || typeof bVal === 'number') {
      aVal = aVal || 0
      bVal = bVal || 0
      return direction === 'asc' ? aVal - bVal : bVal - aVal
    }

    // String / date comparison
    aVal = aVal ?? ''
    bVal = bVal ?? ''
    const cmp = String(aVal).localeCompare(String(bVal))
    return direction === 'asc' ? cmp : -cmp
  })
  return sorted
}

/**
 * Returns a single page slice from a records array.
 * @param {Array} records
 * @param {number} page - 0-indexed
 * @param {number} pageSize
 * @returns {Array}
 */
export function paginate(records, page, pageSize) {
  const start = page * pageSize
  return records.slice(start, start + pageSize)
}

/**
 * Serializes transaction rows to a CSV string and triggers a browser download.
 * @param {Array<Object>} rows - filtered + sorted transaction rows
 */
export function exportToCSV(rows) {
  const headers = ['Date/Time', 'Patient Name', 'Bill Amount', 'Discount Type', 'Discount Amount', 'Net Amount', 'Payment Method', 'Status']

  const escape = (val) => {
    const str = val === null || val === undefined ? '' : String(val)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const lines = [
    headers.join(','),
    ...rows.map(r => [
      escape(r.created_at || r.dateTime || ''),
      escape(r.patients ? `${r.patients.first_name || ''} ${r.patients.last_name || ''}`.trim() : (r.patientName || 'Unknown')),
      escape(r.total_amount ?? r.billAmount ?? 0),
      escape(normalizeDiscountType(r.discount_type) ?? ''),
      escape(r.discount_amount ?? r.discountAmount ?? 0),
      escape((r.total_amount ?? 0) - (r.discount_amount ?? 0)),
      escape(normalizePaymentMethod(r.payment_method ?? r.paymentMethod)),
      escape(r.payment_status ?? r.status ?? ''),
    ].join(','))
  ]

  const csv = lines.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
