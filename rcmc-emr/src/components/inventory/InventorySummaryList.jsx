import { Pill, AlertTriangle } from 'lucide-react'
import { getWorstCaseStatus } from '../../utils/inventoryBatchUtils'

const InventorySummaryList = ({ summaries, selectedMedicine, onSelect, searchTerm, categoryFilter, statusFilter, inventory = [] }) => {
  const filtered = summaries.filter(s => {
    const matchesSearch = !searchTerm ||
      (s.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.supplier ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !categoryFilter || categoryFilter === 'All' || s.category === categoryFilter

    let matchesStatus = true
    if (statusFilter && statusFilter !== 'All') {
      const batchesForMed = inventory.filter(b => b.name === s.name)
      if (statusFilter === 'Expiring Soon') {
        matchesStatus = batchesForMed.some(b => b.status === 'Expiring Soon')
      } else if (statusFilter === 'Expired') {
        matchesStatus = batchesForMed.some(b => b.status === 'Expired')
      } else {
        matchesStatus = getWorstCaseStatus(batchesForMed) === statusFilter
      }
    }

    return matchesSearch && matchesCategory && matchesStatus
  })

  if (filtered.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500">
        <Pill size={40} className="mx-auto mb-3 text-slate-300" />
        <p className="font-semibold">No medicines found</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Medicine Name</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Category</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Total Stock</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Batches</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Earliest Expiry</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {filtered.map((summary, idx) => {
            const batchesForMedicine = inventory.filter(b => b.name === summary.name)
            const worstStatus = getWorstCaseStatus(batchesForMedicine)
            const isSelected = selectedMedicine === summary.name
            return (
              <tr
                key={`${summary.name}-${idx}`}
                onClick={() => onSelect(summary.name)}
                className={`cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-teal-50 border-l-4 border-teal-500'
                    : worstStatus !== 'In Stock'
                    ? 'bg-amber-50 border-l-4 border-amber-400 hover:bg-amber-100'
                    : 'hover:bg-slate-50'
                }`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-teal-100 rounded-lg flex items-center justify-center">
                      <Pill size={18} className="text-teal-600" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900">{summary.name}</span>
                      {batchesForMedicine.some(b => b.status === 'Expiring Soon') && (
                        <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-700">Expiring Soon</span>
                      )}
                      {batchesForMedicine.some(b => b.status === 'Expired') && (
                        <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700">Has Expired</span>
                      )}
                    </div>
                    {worstStatus !== 'In Stock' && <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{summary.category ?? '—'}</td>
                <td className="px-6 py-4 text-sm font-semibold text-slate-900">{summary.total_stock ?? 0}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{summary.batch_count ?? 0}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{summary.earliest_expiry ?? '—'}</td>
                <td className="px-6 py-4">
                  {worstStatus === 'Expired' || worstStatus === 'Out of Stock' ? (
                    <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                      {worstStatus}
                    </span>
                  ) : worstStatus === 'Critical' ? (
                    <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                      {worstStatus}
                    </span>
                  ) : worstStatus === 'Low Stock' ? (
                    <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                      {worstStatus}
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      In Stock
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={e => { e.stopPropagation(); onSelect(summary.name) }}
                    className="text-xs px-3 py-1 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
                  >
                    View Batches
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default InventorySummaryList
