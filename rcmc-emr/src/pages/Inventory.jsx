import { useState } from 'react'
import { Plus, Search, Package, AlertTriangle, Clock, XCircle, Upload, Download, FileDown } from 'lucide-react'
import { useInventory } from '../context/InventoryContext'
import { db } from '../lib/supabase'
import { exportInventoryCSV, getWorstCaseStatus } from '../utils/inventoryBatchUtils'
import SkeletonLoader from '../components/SkeletonLoader'
import InventorySummaryList from '../components/inventory/InventorySummaryList'
import BatchDetailPanel from '../components/inventory/BatchDetailPanel'
import BatchForm from '../components/inventory/BatchForm'
import ExpiryMonitor from '../components/inventory/ExpiryMonitor'
import CSVImportModal from '../components/inventory/CSVImportModal'
import StockAdjustmentModal from '../components/inventory/StockAdjustmentModal'

const INVENTORY_TEMPLATE_ROWS = [
  'item_name,price,stock,unit,category,supplier,reorder_level,batch_number,lot_number,expiration_date,manufacture_date',
  'Amoxicillin 500mg,12.50,100,capsule,Anti-Infectives,PharmaCorp,20,BATCH-001,LOT-001,2026-12-31,2024-01-01',
  'Paracetamol 500mg,5.00,200,tablet,Analgesics & Anti-Inflammatory,MedSupply,30,BATCH-002,LOT-002,2027-06-30,2024-03-01',
]

function downloadInventoryTemplate() {
  const blob = new Blob([INVENTORY_TEMPLATE_ROWS.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'inventory_import_template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

const CATEGORIES = [
  'All', 'Anti-Infectives', 'Cardiovascular & Hypertension', 'Respiratory & Allergy',
  'Gastrointestinal & Metabolism', 'Analgesics & Anti-Inflammatory',
  'Vitamins & Supplements', 'Steroids & Hormones', 'Vaccines & Biologicals'
]
const STATUSES = ['All', 'In Stock', 'Low Stock', 'Critical', 'Out of Stock', 'Expiring Soon', 'Expired']

const Inventory = () => {
  const { inventory, summaries, expiringBatches, expiredBatches, loading, loadInventory } = useInventory()

  const [activeTab, setActiveTab] = useState('inventory')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedMedicine, setSelectedMedicine] = useState(null)
  const [showBatchForm, setShowBatchForm] = useState(false)
  const [editingBatch, setEditingBatch] = useState(null)
  const [batchFormMedicine, setBatchFormMedicine] = useState(null)
  const [showImport, setShowImport] = useState(false)
  const [adjustingBatch, setAdjustingBatch] = useState(null)

  // Stats — computed from summaries using worst-case status per medicine
  const totalMedicines = summaries.length
  const inStockCount = summaries.filter(s => (s.total_stock ?? 0) > 0).length
  const outOfStockCount = summaries.filter(s => (s.total_stock ?? 0) === 0).length
  const expiringSoonCount = expiringBatches.length
  const expiredCount = expiredBatches.length
  const lowStockCount = summaries.filter(s => getWorstCaseStatus(inventory.filter(b => b.name === s.name)) === 'Low Stock').length
  const criticalCount = summaries.filter(s => getWorstCaseStatus(inventory.filter(b => b.name === s.name)) === 'Critical').length

  const selectedBatches = selectedMedicine
    ? inventory.filter(b => b.name === selectedMedicine)
    : []

  const handleAddBatch = (medicineName) => {
    setBatchFormMedicine(medicineName)
    setEditingBatch(null)
    setShowBatchForm(true)
  }

  const handleEditBatch = (batch) => {
    setEditingBatch(batch)
    setBatchFormMedicine(null)
    setShowBatchForm(true)
  }

  const handleDeleteBatch = async (batch) => {
    try {
      await db.deleteInventoryItem(batch.id)
      await loadInventory()
      if (selectedBatches.length <= 1) setSelectedMedicine(null)
    } catch (err) {
      alert('Failed to delete batch: ' + err.message)
    }
  }

  const handleSaveBatch = async (formData) => {
    try {
      const itemData = {
        name: formData.name,
        category: formData.category,
        unit: formData.unit,
        price: parseFloat(formData.price),
        supplier: formData.supplier,
        stock: parseInt(formData.stock),
        reorder_level: parseInt(formData.reorder_level),
        batch_number: formData.batch_number,
        lot_number: formData.lot_number,
        expiration_date: formData.expiration_date || null,
        manufacture_date: formData.manufacture_date || null,
      }
      if (editingBatch?.id) {
        await db.updateInventoryItem(editingBatch.id, itemData)
      } else {
        await db.addInventoryItem(itemData)
      }
      await loadInventory()
      setShowBatchForm(false)
      setEditingBatch(null)
      setBatchFormMedicine(null)
    } catch (err) {
      alert('Failed to save batch: ' + err.message)
    }
  }

  const handleAdjustSave = async (id, newStock, newStatus) => {
    await db.updateInventoryItem(id, { stock: newStock, status: newStatus })
    await loadInventory()
  }

  const handleDispose = async (batch) => {
    const confirmed = confirm(
      `Dispose all stock of "${batch.name}" (Batch: ${batch.batch_number ?? 'N/A'})?\n\nThis will set stock to 0 and mark it as Out of Stock.`
    )
    if (!confirmed) return
    await db.updateInventoryItem(batch.id, { stock: 0, status: 'Out of Stock' })
    await loadInventory()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Medicine Inventory</h1>
          <p className="text-sm text-slate-600 mt-1">Track medicines by batch with expiry monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={downloadInventoryTemplate}
            title="Download CSV template"
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-colors text-sm"
          >
            <FileDown size={16} />
            CSV Template
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors text-sm"
          >
            <Upload size={16} />
            Import CSV
          </button>
          <button
            onClick={() => exportInventoryCSV(inventory)}
            title="Export current inventory to CSV"
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors text-sm"
          >
            <Download size={16} />
            Export CSV
          </button>
          <button
            onClick={() => { setBatchFormMedicine(null); setEditingBatch(null); setShowBatchForm(true) }}
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors shadow-sm text-sm"
          >
            <Plus size={18} />
            Add Medicine
          </button>
        </div>
      </div>

      {/* Stats Cards — now 7 cards including Out of Stock */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-slate-600 font-semibold uppercase tracking-wide">Total</p>
            <Package size={18} className="text-slate-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{totalMedicines}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-slate-600 font-semibold uppercase tracking-wide">In Stock</p>
            <Package size={18} className="text-green-500" />
          </div>
          <p className="text-3xl font-bold text-green-600">{inStockCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-slate-600 font-semibold uppercase tracking-wide">Low Stock</p>
            <AlertTriangle size={18} className="text-yellow-500" />
          </div>
          <p className={`text-3xl font-bold ${lowStockCount > 0 ? 'text-yellow-500' : 'text-slate-400'}`}>{lowStockCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-slate-600 font-semibold uppercase tracking-wide">Critical</p>
            <AlertTriangle size={18} className="text-orange-500" />
          </div>
          <p className={`text-3xl font-bold ${criticalCount > 0 ? 'text-orange-500' : 'text-slate-400'}`}>{criticalCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-slate-600 font-semibold uppercase tracking-wide">Out of Stock</p>
            <XCircle size={18} className="text-slate-400" />
          </div>
          <p className={`text-3xl font-bold ${outOfStockCount > 0 ? 'text-slate-600' : 'text-slate-400'}`}>{outOfStockCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-slate-600 font-semibold uppercase tracking-wide">Expiring</p>
            <Clock size={18} className="text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-amber-600">{expiringSoonCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-slate-600 font-semibold uppercase tracking-wide">Expired</p>
            <XCircle size={18} className="text-red-500" />
          </div>
          <p className="text-3xl font-bold text-red-600">{expiredCount}</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {['inventory', 'expiry'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab === 'inventory' ? 'Inventory' : 'Expiry Monitor'}
            {tab === 'expiry' && expiringSoonCount + expiredCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">
                {expiringSoonCount + expiredCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'inventory' && (
        <>
          {/* Search & Filters */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search medicines..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm min-w-0 max-w-[200px]"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Summary List + Detail Panel */}
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <SkeletonLoader variant="table" message="Loading inventory..." />
            </div>
          ) : (
            <div className={`grid gap-4 ${selectedMedicine ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <InventorySummaryList
                  summaries={summaries}
                  inventory={inventory}
                  selectedMedicine={selectedMedicine}
                  onSelect={name => setSelectedMedicine(prev => prev === name ? null : name)}
                  searchTerm={searchTerm}
                  categoryFilter={categoryFilter}
                  statusFilter={statusFilter}
                />
              </div>
              {selectedMedicine && (
                <BatchDetailPanel
                  medicine={selectedMedicine}
                  batches={selectedBatches}
                  onAddBatch={handleAddBatch}
                  onEditBatch={handleEditBatch}
                  onDeleteBatch={handleDeleteBatch}
                  onAdjustBatch={batch => setAdjustingBatch(batch)}
                  onClose={() => setSelectedMedicine(null)}
                />
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'expiry' && (
        <ExpiryMonitor
          expiringBatches={expiringBatches}
          expiredBatches={expiredBatches}
          onDispose={handleDispose}
        />
      )}

      {/* Batch Form Modal */}
      {showBatchForm && (
        <BatchForm
          initialData={editingBatch}
          medicineName={batchFormMedicine}
          onSave={handleSaveBatch}
          onClose={() => { setShowBatchForm(false); setEditingBatch(null); setBatchFormMedicine(null) }}
        />
      )}

      {/* CSV Import Modal */}
      {showImport && (
        <CSVImportModal
          inventory={inventory}
          onClose={() => setShowImport(false)}
          onImportComplete={() => { loadInventory(); setShowImport(false); }}
        />
      )}

      {/* Stock Adjustment Modal */}
      {adjustingBatch && (
        <StockAdjustmentModal
          batch={adjustingBatch}
          onClose={() => setAdjustingBatch(null)}
          onSave={handleAdjustSave}
        />
      )}
    </div>
  )
}

export default Inventory
