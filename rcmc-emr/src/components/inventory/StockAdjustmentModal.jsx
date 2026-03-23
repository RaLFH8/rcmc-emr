import { useState } from 'react'
import { X, ArrowUpDown } from 'lucide-react'
import { computeStatus } from '../../utils/inventoryBatchUtils'

const StockAdjustmentModal = ({ batch, onClose, onSave }) => {
  const [amount, setAmount] = useState('')
  const [direction, setDirection] = useState('Add')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const validate = () => {
    const n = parseInt(amount, 10)
    if (!amount || isNaN(n) || n <= 0 || !Number.isInteger(n)) {
      return 'Amount must be a positive whole number.'
    }
    if (direction === 'Deduct' && n > batch.stock) {
      return `Cannot deduct ${n} — only ${batch.stock} units in stock.`
    }
    return null
  }

  const handleConfirm = async () => {
    const validationError = validate()
    if (validationError) { setError(validationError); return }

    const n = parseInt(amount, 10)
    const newStock = direction === 'Add' ? batch.stock + n : batch.stock - n
    const newStatus = computeStatus(newStock, batch.reorder_level, batch.expiration_date)

    setSaving(true)
    setError('')
    try {
      await onSave(batch.id, newStock, newStatus)
      onClose()
    } catch (err) {
      setError(err.message ?? 'Failed to save adjustment.')
      setSaving(false)
    }
  }

  const previewStock = (() => {
    const n = parseInt(amount, 10)
    if (!amount || isNaN(n) || n <= 0) return null
    const result = direction === 'Add' ? batch.stock + n : batch.stock - n
    return result < 0 ? null : result
  })()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <ArrowUpDown size={18} className="text-teal-600" />
            <h2 className="text-lg font-bold text-slate-900">Adjust Stock</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Batch info */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-1">
            <p className="font-semibold text-slate-900">{batch.name}</p>
            <p className="text-xs text-slate-500">Batch: {batch.batch_number ?? '—'}</p>
            <p className="text-sm text-slate-700">
              Current stock: <span className="font-bold">{batch.stock}</span>
            </p>
          </div>

          {/* Direction toggle */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Adjustment Type</label>
            <div className="flex gap-2">
              {['Add', 'Deduct'].map(d => (
                <button
                  key={d}
                  onClick={() => { setDirection(d); setError('') }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                    direction === d
                      ? d === 'Add'
                        ? 'bg-green-500 text-white border-green-500'
                        : 'bg-red-500 text-white border-red-500'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {d === 'Add' ? '+ Add Stock' : '− Deduct Stock'}
                </button>
              ))}
            </div>
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Amount</label>
            <input
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={e => { setAmount(e.target.value); setError('') }}
              placeholder="Enter quantity"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>

          {/* Preview */}
          {previewStock !== null && (
            <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 text-sm text-teal-800">
              New stock after adjustment: <span className="font-bold">{previewStock}</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="flex-1 py-2.5 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors text-sm disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default StockAdjustmentModal
