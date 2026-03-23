import { X, Edit2, Trash2, Plus } from 'lucide-react'
import { getFifoBatches } from '../../utils/inventoryBatchUtils'

const statusColors = {
  'In Stock': 'bg-green-100 text-green-700',
  'Low Stock': 'bg-yellow-100 text-yellow-700',
  'Critical': 'bg-orange-100 text-orange-700',
  'Out of Stock': 'bg-red-100 text-red-700',
  'Expiring Soon': 'bg-amber-100 text-amber-700',
  'Expired': 'bg-red-200 text-red-800',
}

const BatchDetailPanel = ({ medicine, batches, onAddBatch, onEditBatch, onDeleteBatch, onClose }) => {
  const sorted = [...(batches ?? [])].sort((a, b) => {
    if (!a.expiration_date) return 1
    if (!b.expiration_date) return -1
    return a.expiration_date.localeCompare(b.expiration_date)
  })

  const fifoSet = new Set(getFifoBatches(sorted).map(b => b.id))

  const handleDelete = (batch) => {
    if (batch.stock > 0) {
      if (!confirm(`This batch still has ${batch.stock} units. Are you sure?`)) return
    }
    onDeleteBatch(batch)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{medicine}</h3>
          <p className="text-xs text-slate-500">{sorted.length} batch{sorted.length !== 1 ? 'es' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAddBatch(medicine)}
            className="flex items-center gap-1 px-3 py-2 bg-teal-500 text-white rounded-lg text-sm font-semibold hover:bg-teal-600 transition-colors"
          >
            <Plus size={16} />
            Add Batch
          </button>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Batch list */}
      <div className="overflow-y-auto flex-1">
        {sorted.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No batches yet. Click "Add Batch" to add one.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Batch #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Lot #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Stock</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Expiry</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Mfg Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map(batch => (
                <tr key={batch.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-700">{batch.batch_number ?? '—'}</span>
                      {fifoSet.has(batch.id) && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          Dispense First
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-mono text-xs">{batch.lot_number ?? '—'}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{batch.stock}</td>
                  <td className="px-4 py-3 text-slate-600">{batch.expiration_date ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{batch.manufacture_date ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${statusColors[batch.status] ?? 'bg-slate-100 text-slate-700'}`}>
                      {batch.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditBatch(batch)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit batch"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(batch)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete batch"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default BatchDetailPanel
