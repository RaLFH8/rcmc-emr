import { useState, useRef, useEffect } from 'react'
import { Plus, Search, Edit2, Trash2, X, Package, AlertTriangle, TrendingDown, Download, Pill, Upload } from 'lucide-react'
import { useInventory } from '../context/InventoryContext'
import { useAuth } from '../context/AuthContext'
import { db } from '../lib/supabase'
import HeartbeatLoader from '../components/HeartbeatLoader'
import { InventoryImportModal } from '../components/import/InventoryImportModal'

const Inventory = () => {
  const { inventory, loadInventory } = useInventory()
  const { userProfile } = useAuth()
  const [localInventory, setLocalInventory] = useState([])
  
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    category: 'Analgesic',
    stock: '',
    reorder_level: '',
    unit: 'Tablet',
    price: '',
    supplier: '',
    expiry_date: '',
    status: 'In Stock'
  })


  useEffect(() => {
    loadData()
  }, [inventory])

  const loadData = async () => {
    try {
      setLoading(true)
      setLocalInventory(inventory)
    } catch (error) {
      console.error('Error loading inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const categories = ['All', 'Analgesic', 'Antibiotic', 'Antihistamine', 'Antacid', 'Antidiabetic', 'Antihypertensive', 'Bronchodilator', 'Supplement', 'Antiplatelet', 'Other']
  const units = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Piece', 'Bottle', 'Box']
  const statuses = ['All', 'In Stock', 'Low Stock', 'Critical', 'Out of Stock']

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const itemData = {
        name: formData.name,
        category: formData.category,
        stock: parseInt(formData.stock),
        reorder_level: parseInt(formData.reorder_level),
        unit: formData.unit,
        price: parseFloat(formData.price),
        supplier: formData.supplier,
        expiry_date: formData.expiry_date,
        status: formData.status
      }

      if (editingItem) {
        await db.updateInventoryItem(editingItem.id, itemData)
      } else {
        await db.addInventoryItem(itemData)
      }
      
      await loadInventory()
      closeModal()
    } catch (error) {
      console.error('Error saving inventory item:', error)
      alert('Failed to save item: ' + error.message)
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      category: item.category,
      stock: item.stock,
      reorder_level: item.reorder_level,
      unit: item.unit,
      price: item.price,
      supplier: item.supplier,
      expiry_date: item.expiry_date,
      status: item.status
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await db.deleteInventoryItem(id)
        await loadInventory()
      } catch (error) {
        console.error('Error deleting item:', error)
        alert('Failed to delete item: ' + error.message)
      }
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingItem(null)
    setFormData({
      name: '',
      category: 'Analgesic',
      stock: '',
      reorder_level: '',
      unit: 'Tablet',
      price: '',
      supplier: '',
      expiry_date: '',
      status: 'In Stock'
    })
  }

  // Export to CSV
  const handleExport = () => {
    const headers = ['ID', 'Name', 'Category', 'Stock', 'Reorder Level', 'Unit', 'Price', 'Supplier', 'Expiry Date', 'Status']
    const csvData = localInventory.map(item => [
      item.id,
      item.name,
      item.category,
      item.stock,
      item.reorder_level,
      item.unit,
      item.price,
      item.supplier,
      item.expiry_date,
      item.status
    ])

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `inventory_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Stock':
        return 'bg-green-100 text-green-700'
      case 'Low Stock':
        return 'bg-yellow-100 text-yellow-700'
      case 'Critical':
        return 'bg-orange-100 text-orange-700'
      case 'Out of Stock':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const filteredInventory = localInventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.supplier.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory
    const matchesStatus = filterStatus === 'All' || item.status === filterStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  const stats = {
    total: localInventory.length,
    inStock: localInventory.filter(i => i.status === 'In Stock').length,
    lowStock: localInventory.filter(i => i.status === 'Low Stock' || i.status === 'Critical').length,
    totalValue: localInventory.reduce((sum, i) => sum + (i.stock * i.price), 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Medicine Inventory</h1>
          <p className="text-sm text-slate-600 mt-1">Track and manage medicine stock levels</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors shadow-sm"
          >
            <Download size={20} />
            Export CSV
          </button>
          {/* Only show import button for admin and staff */}
          {(userProfile?.role === 'admin' || userProfile?.role === 'staff') && (
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors shadow-sm"
            >
              <Upload size={20} />
              Import CSV
            </button>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors shadow-sm"
          >
            <Plus size={20} />
            Add Medicine
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-600 font-semibold">Total Items</p>
            <Package size={20} className="text-slate-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-600 font-semibold">In Stock</p>
            <Pill size={20} className="text-green-500" />
          </div>
          <p className="text-3xl font-bold text-green-600">{stats.inStock}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-600 font-semibold">Low Stock</p>
            <AlertTriangle size={20} className="text-orange-500" />
          </div>
          <p className="text-3xl font-bold text-orange-600">{stats.lowStock}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-600 font-semibold">Total Value</p>
            <TrendingDown size={20} className="text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-blue-600">₱{stats.totalValue.toLocaleString()}</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search medicines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <HeartbeatLoader message="Loading inventory..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Medicine</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Unit</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Expiry</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                        <Pill size={20} className="text-teal-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{item.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.category}</td>
                  <td className="px-6 py-4">
                    <span className={`font-semibold ${item.stock <= item.reorder_level ? 'text-orange-600' : 'text-slate-900'}`}>
                      {item.stock}
                    </span>
                    <span className="text-xs text-slate-500 ml-1">/ {item.reorder_level}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.unit}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">₱{item.price}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.supplier}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.expiry_date}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {filteredInventory.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Package size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-600 text-lg font-semibold mb-2">No items found</p>
          <p className="text-slate-500 text-sm">
            {searchTerm ? 'Try a different search term' : 'Click "Add Medicine" to add one'}
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-slate-900">
                {editingItem ? 'Edit Medicine' : 'Add New Medicine'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Medicine Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Paracetamol 500mg"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Category *</label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {categories.filter(c => c !== 'All').map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Unit *</label>
                    <select
                      required
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {units.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Current Stock *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Reorder Level *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.reorder_level}
                      onChange={(e) => setFormData({...formData, reorder_level: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Price (₱) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Expiry Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.expiry_date}
                      onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Supplier *</label>
                  <input
                    type="text"
                    required
                    value={formData.supplier}
                    onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                    placeholder="e.g., PharmaCorp"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors"
                >
                  {editingItem ? 'Update Medicine' : 'Add Medicine'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-8 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      <InventoryImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => {
          loadInventory();
          setShowImportModal(false);
        }}
      />
    </div>
  )
}

export default Inventory
