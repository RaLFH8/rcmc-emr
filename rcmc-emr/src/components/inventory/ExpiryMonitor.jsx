import { AlertTriangle, CheckCircle } from 'lucide-react'

const daysBadgeColor = (days) => {
  if (days <= 30) return 'bg-red-100 text-red-700'
  if (days <= 60) return 'bg-amber-100 text-amber-700'
  return 'bg-yellow-100 text-yellow-700'
}

const ExpiryMonitor = ({ expiringBatches, expiredBatches }) => {
  return (
    <div className="space-y-6">
      {/* Expiring Soon */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
          <AlertTriangle size={18} className="text-amber-500" />
          <h3 className="font-bold text-slate-900">Expiring Within 90 Days</h3>
          <span className="ml-auto text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
            {expiringBatches.length}
          </span>
        </div>
        {expiringBatches.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            <CheckCircle size={32} className="mx-auto mb-2 text-green-400" />
            No batches expiring within 90 days.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Medicine</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Batch #</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Expiry Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Days Left</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expiringBatches.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-semibold text-slate-900">{b.name}</td>
                    <td className="px-6 py-3 font-mono text-xs text-slate-600">{b.batch_number ?? '—'}</td>
                    <td className="px-6 py-3 text-slate-700">{b.stock}</td>
                    <td className="px-6 py-3 text-slate-600">{b.expiration_date}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${daysBadgeColor(b.days_until_expiry)}`}>
                        {b.days_until_expiry}d
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Expired */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
          <AlertTriangle size={18} className="text-red-500" />
          <h3 className="font-bold text-slate-900">Expired (with remaining stock)</h3>
          <span className="ml-auto text-xs font-semibold bg-red-100 text-red-700 px-2 py-1 rounded-full">
            {expiredBatches.length}
          </span>
        </div>
        {expiredBatches.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            <CheckCircle size={32} className="mx-auto mb-2 text-green-400" />
            No expired batches with remaining stock.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Medicine</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Batch #</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Expiry Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Days Expired</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expiredBatches.map(b => (
                  <tr key={b.id} className="hover:bg-red-50">
                    <td className="px-6 py-3 font-semibold text-slate-900">{b.name}</td>
                    <td className="px-6 py-3 font-mono text-xs text-slate-600">{b.batch_number ?? '—'}</td>
                    <td className="px-6 py-3 text-red-700 font-semibold">{b.stock}</td>
                    <td className="px-6 py-3 text-slate-600">{b.expiration_date}</td>
                    <td className="px-6 py-3">
                      <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                        {b.days_expired}d ago
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default ExpiryMonitor
