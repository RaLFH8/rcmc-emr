import { useState, useEffect, useRef } from 'react'
import { ChevronUp, ChevronDown, X, Download } from 'lucide-react'
import {
  applyFilters,
  sortRecords,
  paginate,
  exportToCSV,
  normalizePaymentMethod,
  normalizeDiscountType,
} from '../../services/billingFinancialService'

const PAGE_SIZES = [10, 25, 50]

const COLUMNS = [
  { key: 'created_at', label: 'Date/Time' },
  { key: 'patientName', label: 'Patient Name' },
  { key: 'total_amount', label: 'Bill Amount' },
  { key: 'discount_type', label: 'Discount Type' },
  { key: 'discount_amount', label: 'Discount Amount' },
  { key: 'netAmount', label: 'Net Amount' },
  { key: 'payment_method', label: 'Payment Method' },
  { key: 'payment_status', label: 'Status' },
]

const STATUS_OPTIONS = ['Paid', 'Partial', 'Pending', 'Cancelled', 'Refunded']
const PAYMENT_OPTIONS = ['Cash', 'GCash', 'Maya', 'BankTransfer', 'Others']
const DISCOUNT_OPTIONS = ['Senior Citizen', 'PWD', 'PhilHealth', 'HMO/Insurance', 'Employee/Staff', 'Custom/Manual', 'Others']

const formatPHP = (v) =>
  `₱${Number(v || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const formatDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/**
 * TransactionTable — paginated, filterable, sortable billing transaction table.
 *
 * @param {Object} props
 * @param {Array} props.records - raw billing rows for the period
 * @param {Object|null} props.activeFilter - { paymentMethod?, discountType?, status? }
 * @param {(filter: Object) => void} props.onFilterChange
 */
export default function TransactionTable({ records = [], activeFilter, onFilterChange }) {
  const tableRef = useRef(null)

  const [localFilter, setLocalFilter] = useState({})
  const [sortCol, setSortCol] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  // Sync external activeFilter into local filter
  useEffect(() => {
    if (activeFilter) {
      setLocalFilter(prev => ({ ...prev, ...activeFilter }))
      setPage(0)
      // Scroll into view
      tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [activeFilter])

  // Normalize records for display
  const normalized = records.map(r => ({
    ...r,
    patientName: r.patients
      ? `${r.patients.first_name || ''} ${r.patients.last_name || ''}`.trim() || 'Unknown'
      : 'Unknown',
    netAmount: (r.total_amount || 0) - (r.discount_amount || 0),
    _paymentMethod: normalizePaymentMethod(r.payment_method),
    _discountType: normalizeDiscountType(r.discount_type),
  }))

  // Build filter object for applyFilters (uses normalized keys)
  const filterForService = {
    ...(localFilter.paymentMethod ? { paymentMethod: localFilter.paymentMethod } : {}),
    ...(localFilter.discountType ? { discountType: localFilter.discountType } : {}),
    ...(localFilter.status ? { status: localFilter.status } : {}),
  }

  // Apply filters on normalized records
  const filtered = normalized.filter(r => {
    if (filterForService.paymentMethod && r._paymentMethod !== filterForService.paymentMethod) return false
    if (filterForService.discountType && r._discountType !== filterForService.discountType) return false
    if (filterForService.status && r.payment_status !== filterForService.status) return false
    return true
  })

  // Sort — map virtual columns to real keys
  const sortKey = sortCol === 'patientName' ? 'patientName'
    : sortCol === 'netAmount' ? 'netAmount'
    : sortCol

  const sorted = sortRecords(filtered, sortKey, sortDir)
  const totalPages = Math.ceil(sorted.length / pageSize)
  const paged = paginate(sorted, page, pageSize)

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
    setPage(0)
  }

  const setFilter = (key, value) => {
    const next = { ...localFilter, [key]: value || undefined }
    if (!value) delete next[key]
    setLocalFilter(next)
    setPage(0)
    onFilterChange && onFilterChange(next)
  }

  const clearAll = () => {
    setLocalFilter({})
    setPage(0)
    onFilterChange && onFilterChange({})
  }

  const activeChips = Object.entries(localFilter).filter(([, v]) => v)

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <ChevronUp className="w-3 h-3 text-slate-300" />
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-teal-500" />
      : <ChevronDown className="w-3 h-3 text-teal-500" />
  }

  return (
    <div ref={tableRef} className="bg-white rounded-xl shadow-sm mx-6 mb-6 overflow-hidden">
      {/* Toolbar */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
        <h3 className="text-base font-semibold text-slate-800 mr-2">Transactions</h3>

        {/* Filter dropdowns */}
        <select
          value={localFilter.paymentMethod || ''}
          onChange={(e) => setFilter('paymentMethod', e.target.value)}
          className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Methods</option>
          {PAYMENT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>

        <select
          value={localFilter.discountType || ''}
          onChange={(e) => setFilter('discountType', e.target.value)}
          className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Discounts</option>
          {DISCOUNT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>

        <select
          value={localFilter.status || ''}
          onChange={(e) => setFilter('status', e.target.value)}
          className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>

        {/* Page size */}
        <select
          value={pageSize}
          onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0) }}
          className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          {PAGE_SIZES.map(s => <option key={s} value={s}>{s} / page</option>)}
        </select>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-slate-500">{filtered.length} records</span>
          <button
            onClick={() => exportToCSV(sorted)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 text-white rounded-lg text-sm font-semibold hover:bg-teal-600 transition-colors"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <div className="px-6 py-2 flex flex-wrap gap-2 bg-slate-50 border-b border-slate-100">
          {activeChips.map(([key, val]) => (
            <span
              key={key}
              className="flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-medium"
            >
              {val}
              <button onClick={() => setFilter(key, '')} className="hover:text-teal-600">
                <X size={12} />
              </button>
            </span>
          ))}
          <button onClick={clearAll} className="text-xs text-slate-500 hover:text-slate-700 underline">
            Clear All
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        {paged.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            No transactions match the current filters.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {COLUMNS.map(({ key, label }) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer select-none whitespace-nowrap"
                  >
                    <span className="flex items-center gap-1">
                      {label}
                      <SortIcon col={key} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{formatDate(row.created_at)}</td>
                  <td className="py-3 px-4 font-medium text-slate-900">{row.patientName}</td>
                  <td className="py-3 px-4 text-slate-700">{formatPHP(row.total_amount)}</td>
                  <td className="py-3 px-4 text-slate-600">{row._discountType || '—'}</td>
                  <td className="py-3 px-4 text-slate-600">{row.discount_amount > 0 ? formatPHP(row.discount_amount) : '—'}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{formatPHP(row.netAmount)}</td>
                  <td className="py-3 px-4 text-slate-600">{row._paymentMethod}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={row.payment_status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1 rounded-lg text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1 rounded-lg text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }) {
  const colors = {
    Paid: 'bg-green-100 text-green-700',
    Partial: 'bg-blue-100 text-blue-700',
    Pending: 'bg-yellow-100 text-yellow-700',
    Cancelled: 'bg-red-100 text-red-700',
    Refunded: 'bg-purple-100 text-purple-700',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[status] || 'bg-slate-100 text-slate-700'}`}>
      {status || '—'}
    </span>
  )
}
