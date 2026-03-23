import { useState } from 'react'
import { X } from 'lucide-react'
import { generateBatchNumber } from '../../utils/inventoryBatchUtils'

const CATEGORIES = [
  'Anti-Infectives', 'Cardiovascular & Hypertension', 'Respiratory & Allergy',
  'Gastrointestinal & Metabolism', 'Analgesics & Anti-Inflammatory',
  'Vitamins & Supplements', 'Steroids & Hormones', 'Vaccines & Biologicals'
]
const UNITS = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Piece', 'Bottle', 'Box']

const REQUIRED = ['name', 'stock', 'reorder_level', 'unit', 'price', 'expiration_date']

const BatchForm = ({ initialData, medicineName, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: medicineName ?? initialData?.name ?? '',
    category: initialData?.category ?? 'Anti-Infectives',
    unit: initialData?.unit ?? 'Tablet',
    price: initialData?.price ?? '',
    supplier: initialData?.supplier ?? '',
    stock: initialData?.stock ?? '',
    reorder_level: initialData?.reorder_level ?? '',
    batch_number: initialData?.batch_number ?? '',
    lot_number: initialData?.lot_number ?? '',
    expiration_date: initialData?.expiration_date ?? '',
    manufacture_date: initialData?.manufacture_date ?? '',
  })
  const [errors, setErrors] = useState({})

  const set = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }))
  }

  const validate = () => {
    const newErrors = {}
    for (const field of REQUIRED) {
      if (!formData[field] && formData[field] !== 0) {
        newErrors[field] = 'This field is required'
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    const data = { ...formData }
    if (!data.batch_number) {
      data.batch_number = generateBatchNumber()
    }
    onSave(data)
  }

  const field = (label, key, type = 'text', extra = {}) => (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
      <input
        type={type}
        value={formData[key]}
        onChange={e => set(key, e.target.value)}
        readOnly={extra.readOnly}
        className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm ${
          errors[key] ? 'border-red-400' : 'border-slate-200'
        } ${extra.readOnly ? 'bg-slate-50 text-slate-500' : ''}`}
        {...(extra.min !== undefined ? { min: extra.min } : {})}
        {...(extra.step !== undefined ? { step: extra.step } : {})}
      />
      {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-slate-900">
            {initialData?.id ? 'Edit Batch' : 'Add Batch'}
            {medicineName && <span className="text-teal-600"> — {medicineName}</span>}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Medicine name */}
          {field('Medicine Name *', 'name', 'text', { readOnly: !!medicineName })}

          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={e => set('category', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {/* Unit */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Unit *</label>
              <select
                value={formData.unit}
                onChange={e => set('unit', e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm ${errors.unit ? 'border-red-400' : 'border-slate-200'}`}
              >
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              {errors.unit && <p className="text-xs text-red-500 mt-1">{errors.unit}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {field('Price (₱) *', 'price', 'number', { min: 0, step: '0.01' })}
            {field('Supplier', 'supplier')}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {field('Stock *', 'stock', 'number', { min: 0 })}
            {field('Reorder Level *', 'reorder_level', 'number', { min: 0 })}
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Batch Information</p>
            <div className="grid grid-cols-2 gap-4">
              {field('Batch Number (auto if blank)', 'batch_number')}
              {field('Lot Number', 'lot_number')}
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {field('Expiration Date *', 'expiration_date', 'date')}
              {field('Manufacture Date', 'manufacture_date', 'date')}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors"
            >
              {initialData?.id ? 'Update Batch' : 'Add Batch'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BatchForm
