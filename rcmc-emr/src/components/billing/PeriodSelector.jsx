import { useState } from 'react'
import { Calendar } from 'lucide-react'
import { computeDateRange, validateDateRange } from '../../services/billingFinancialService'

const PRESETS = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
]

/**
 * PeriodSelector — sticky date range control for the Financial Tab.
 *
 * @param {Object} props
 * @param {'daily'|'weekly'|'monthly'|'yearly'|'custom'} props.activePeriod
 * @param {{ startDate: Date, endDate: Date }} props.dateRange
 * @param {(range: Object, period: string) => void} props.onDateRangeChange
 */
export default function PeriodSelector({ activePeriod, dateRange, onDateRangeChange }) {
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [customError, setCustomError] = useState('')

  const handlePreset = (key) => {
    const range = computeDateRange(key, new Date())
    onDateRangeChange(range, key)
    setCustomError('')
  }

  const handleCustomApply = () => {
    if (!customStart || !customEnd) {
      setCustomError('Please select both start and end dates.')
      return
    }
    const start = new Date(customStart)
    const end = new Date(customEnd)
    const validation = validateDateRange(start, end)
    if (!validation.valid) {
      setCustomError(validation.error)
      return
    }
    setCustomError('')
    onDateRangeChange({ startDate: start, endDate: end }, 'custom')
  }

  const fmt = (date) => {
    if (!date) return ''
    const d = date instanceof Date ? date : new Date(date)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-center gap-3">
      {/* Preset buttons */}
      <div className="flex gap-2">
        {PRESETS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handlePreset(key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activePeriod === key
                ? 'bg-teal-500 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-slate-200" />

      {/* Custom range */}
      <div className="flex items-center gap-2 flex-wrap">
        <Calendar size={16} className="text-slate-400" />
        <input
          type="date"
          value={customStart}
          onChange={(e) => setCustomStart(e.target.value)}
          className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <span className="text-slate-400 text-sm">to</span>
        <input
          type="date"
          value={customEnd}
          onChange={(e) => setCustomEnd(e.target.value)}
          className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <button
          onClick={handleCustomApply}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
            activePeriod === 'custom'
              ? 'bg-teal-500 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Apply
        </button>
      </div>

      {/* Inline error */}
      {customError && (
        <p className="w-full text-xs text-red-600 mt-1">{customError}</p>
      )}

      {/* Active range label */}
      {dateRange?.startDate && (
        <span className="ml-auto text-xs text-slate-500">
          {fmt(dateRange.startDate)} — {fmt(dateRange.endDate)}
        </span>
      )}
    </div>
  )
}
