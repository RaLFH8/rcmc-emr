import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

const BAR_COLOR = '#14b8a6'
const ACTIVE_COLOR = '#0f766e'

const formatPHP = (v) =>
  `₱${Number(v).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/**
 * DiscountSummary — horizontal bar chart + stats panel.
 *
 * @param {Object} props
 * @param {Array<{ type: string, amount: number }>} props.data
 * @param {{ total, count, average, highest }} props.stats
 * @param {string|null} props.activeType
 * @param {(type: string) => void} props.onTypeClick
 */
export default function DiscountSummary({ data = [], stats, activeType, onTypeClick }) {
  const isEmpty = !data || data.length === 0

  return (
    <div className="bg-white rounded-xl shadow-sm mx-6 mb-4 p-6">
      <h3 className="text-base font-semibold text-slate-800 mb-4">Discount Breakdown</h3>

      {isEmpty ? (
        <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
          No discounts for this period
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Horizontal bar chart */}
          <ResponsiveContainer width="100%" height={Math.max(160, data.length * 44)}>
            <BarChart
              layout="vertical"
              data={data}
              margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="type" tick={{ fontSize: 11 }} width={110} />
              <Tooltip formatter={(value) => formatPHP(value)} />
              <Bar
                dataKey="amount"
                radius={[0, 4, 4, 0]}
                style={{ cursor: 'pointer' }}
                onClick={(entry) => onTypeClick && onTypeClick(entry.type)}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.type}
                    fill={activeType && activeType !== entry.type ? '#cbd5e1' : (activeType === entry.type ? ACTIVE_COLOR : BAR_COLOR)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Stats panel */}
          {stats && (
            <div className="grid grid-cols-2 gap-4 content-start">
              <StatBox label="Total Discounts" value={formatPHP(stats.total)} />
              <StatBox label="Discounted Transactions" value={stats.count.toLocaleString()} />
              <StatBox label="Average Discount" value={formatPHP(stats.average)} />
              <StatBox label="Highest Discount" value={formatPHP(stats.highest)} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StatBox({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-lg p-4">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-lg font-bold text-slate-900">{value}</p>
    </div>
  )
}
