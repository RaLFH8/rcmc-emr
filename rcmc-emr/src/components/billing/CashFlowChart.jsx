import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const SERIES = [
  { key: 'Cash', color: '#14b8a6' },
  { key: 'GCash', color: '#3b82f6' },
  { key: 'Maya', color: '#8b5cf6' },
  { key: 'BankTransfer', color: '#f59e0b' },
  { key: 'Others', color: '#94a3b8' },
]

const formatPHP = (v) => `₱${Number(v).toLocaleString('en-PH', { minimumFractionDigits: 0 })}`

/**
 * CashFlowChart — stacked bar chart of revenue by payment method over time.
 *
 * @param {Object} props
 * @param {Array} props.data - [{ period, Cash, GCash, Maya, BankTransfer, Others }]
 * @param {string|null} props.activeSeries - highlighted payment method key
 * @param {(method: string) => void} props.onSeriesClick
 */
export default function CashFlowChart({ data = [], activeSeries, onSeriesClick }) {
  // Compute per-method totals for the summary row
  const totals = SERIES.reduce((acc, { key }) => {
    acc[key] = data.reduce((sum, d) => sum + (d[key] || 0), 0)
    return acc
  }, {})
  const grandTotal = Object.values(totals).reduce((s, v) => s + v, 0)

  const isEmpty = grandTotal === 0

  return (
    <div className="bg-white rounded-xl shadow-sm mx-6 mb-4 p-6">
      <h3 className="text-base font-semibold text-slate-800 mb-4">Cash Flow by Payment Method</h3>

      {isEmpty ? (
        <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
          No data for this period
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => formatPHP(value)} />
              <Legend />
              {SERIES.map(({ key, color }) => (
                <Bar
                  key={key}
                  dataKey={key}
                  stackId="a"
                  fill={color}
                  opacity={activeSeries && activeSeries !== key ? 0.3 : 1}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onSeriesClick && onSeriesClick(key)}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>

          {/* Summary row */}
          <div className="mt-4 grid grid-cols-5 gap-2 border-t border-slate-100 pt-4">
            {SERIES.map(({ key, color }) => {
              const pct = grandTotal > 0 ? ((totals[key] / grandTotal) * 100).toFixed(1) : '0.0'
              return (
                <button
                  key={key}
                  onClick={() => onSeriesClick && onSeriesClick(key)}
                  className={`text-center p-2 rounded-lg transition-colors ${
                    activeSeries === key ? 'ring-2 ring-offset-1' : 'hover:bg-slate-50'
                  }`}
                  style={{ '--tw-ring-color': color }}
                >
                  <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: color }} />
                  <p className="text-xs font-semibold text-slate-700">{key}</p>
                  <p className="text-xs text-slate-500">{formatPHP(totals[key])}</p>
                  <p className="text-xs text-slate-400">{pct}%</p>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
