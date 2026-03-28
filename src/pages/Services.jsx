import { useState, useEffect, useMemo } from 'react'
import { Plus, Search, Edit2, Trash2, X, Package, DollarSign, Activity, Upload, Download, ArrowUpDown } from 'lucide-react'
import { db } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import SkeletonLoader from '../components/SkeletonLoader'
import ServicesCSVImportModal from '../components/services/ServicesCSVImportModal'

const SERVICES_TEMPLATE_ROWS = [
  'name,category,price,description,code,status',
  'Complete Blood Count,Hematology,350,Full blood panel test,LAB-001,Active',
  'Chest X-Ray,Diagnostic Services,500,Standard chest radiograph,DX-001,Active',
  'IV Insertion,Nursing Procedures,150,Peripheral IV line insertion,,Active',
]

function downloadServicesTemplate() {
  const blob = new Blob([SERVICES_TEMPLATE_ROWS.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'services_import_template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function exportServicesCSV(services) {
  const header = 'name,category,price,description,code,status'
  const escape = (v) => {
    const s = v === null || v === undefined ? '' : String(v)
    return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s
  }
  const rows = services.map(s =>
    [s.name, s.category, s.price, s.description, s.code, s.status].map(escape).join(',')
  )
  const csv = [header, ...rows].join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const now = new Date()
  a.download = `services_export_${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Name A–Z' },
  { value: 'name_desc', label: 'Name Z–A' },
  { value: 'price_asc', label: 'Price Low–High' },
  { value: 'price_desc', label: 'Price High–Low' },
]

const Services = () => {
  const { userProfile: _userProfile } = useAuth()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showImportModal, setShowImportModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [sortBy, setSortBy] = useState('name_asc')
  const [showModal, setShowModal] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'Consultation',
    price: '',
    description: '',
    status: 'Active'
  })

  const CATEGORY_LIST = [
    'Consultation',
    'Laboratory',
    'Imaging',
    'Procedure',
    'Therapy',
    'Other',
  ]

  const categories = ['All', ...CATEGORY_LIST]

  useEffect(() => {
    loadServices()
  }, [])

  const loadServices = async () => {
    try {
      setLoading(true)
      const data = await db.getServices()
      setServices(data)
    } catch (error) {
      console.error('Error loading services:', error)
      alert('Failed to load services: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      let code = formData.code
      if (!editingService && !code) {
        const categoryPrefix = formData.category.substring(0, 3).toUpperCase()
        const timestamp = Date.now().toString().slice(-6)
        code = `${categoryPrefix}-${timestamp}`
      }
      const serviceData = {
        ...formData,
        code,
        price: parseFloat(formData.price)
      }
      if (editingService) {
        await db.updateService(editingService.id, serviceData)
      } else {
        await db.addService(serviceData)
      }
      await loadServices()
      closeModal()
    } catch (error) {
      console.error('Error saving service:', error)
      alert('Failed to save service: ' + error.message)
    }
  }

  const handleEdit = (service) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      code: service.code,
      category: service.category,
      price: service.price,
      description: service.description,
      status: service.status
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this service?')) {
      try {
        await db.deleteService(id)
        await loadServices()
      } catch (error) {
        console.error('Error deleting service:', error)
        alert('Failed to delete service: ' + error.message)
      }
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingService(null)
    setFormData({
      name: '',
      code: '',
      category: 'Consultation',
      price: '',
      description: '',
      status: 'Active'
    })
  }

  const getCategoryColor = (category) => {
    const colors = {
      'Consultation': 'bg-blue-100 text-blue-700',
      'Laboratory': 'bg-purple-100 text-purple-700',
      'Imaging': 'bg-indigo-100 text-indigo-700',
      'Procedure': 'bg-orange-100 text-orange-700',
      'Therapy': 'bg-green-100 text-green-700',
      'Other': 'bg-slate-100 text-slate-700',
    }
    return colors[category] || 'bg-slate-100 text-slate-700'
  }

  const isVariablePrice = (service) => service.price === 0 || service.price === null

  const filteredServices = useMemo(() => {
    let result = services.filter(service => {
      const q = searchTerm.toLowerCase()
      const matchesSearch = !q ||
        service.name.toLowerCase().includes(q) ||
        (service.description ?? '').toLowerCase().includes(q) ||
        (service.code ?? '').toLowerCase().includes(q)
      const matchesCategory = filterCategory === 'All' || service.category === filterCategory
      const matchesStatus = filterStatus === 'All' || service.status === filterStatus
      return matchesSearch && matchesCategory && matchesStatus
    })

    result = [...result].sort((a, b) => {
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name)
      if (sortBy === 'name_desc') return b.name.localeCompare(a.name)
      if (sortBy === 'price_asc') return (a.price ?? 0) - (b.price ?? 0)
      if (sortBy === 'price_desc') return (b.price ?? 0) - (a.price ?? 0)
      return 0
    })

    return result
  }, [services, searchTerm, filterCategory, filterStatus, sortBy])

  // Distinct categories actually in use
  const activeCategoryCount = useMemo(() => {
    return new Set(services.map(s => s.category).filter(Boolean)).size
  }, [services])

  const stats = {
    total: services.length,
    active: services.filter(s => s.status === 'Active').length,
    avgPrice: services.length > 0 ? services.reduce((sum, s) => sum + (s.price ?? 0), 0) / services.length : 0
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Services & Items</h1>
          <p className="text-sm text-slate-600 mt-1">Manage medical services, tests, and procedures</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={downloadServicesTemplate}
            className="flex items-center gap-2 px-5 py-3 border-2 border-slate-300 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
          >
            <Download size={18} />
            CSV Template
          </button>
          <button
            onClick={() => exportServicesCSV(services)}
            className="flex items-center gap-2 px-5 py-3 border-2 border-slate-300 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
          >
            <Download size={18} />
            Export CSV
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-5 py-3 border-2 border-teal-500 text-teal-600 rounded-xl font-semibold hover:bg-teal-50 transition-colors"
          >
            <Upload size={18} />
            Import CSV
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors shadow-sm"
          >
            <Plus size={20} />
            Add Service
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-600 font-semibold">Total Services</p>
            <Package size={20} className="text-slate-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-600 font-semibold">Active</p>
            <Activity size={20} className="text-green-500" />
          </div>
          <p className="text-3xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-600 font-semibold">Avg Price</p>
            <DollarSign size={20} className="text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-blue-600">₱{stats.avgPrice.toFixed(0)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-600 font-semibold">Categories in Use</p>
            <Package size={20} className="text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-purple-600">{activeCategoryCount}</p>
        </div>
      </div>

      {/* Search, Filter, Sort */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, description, or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-semibold text-slate-700"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <div className="flex items-center gap-2">
            <ArrowUpDown size={16} className="text-slate-400 flex-shrink-0" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-semibold text-slate-700"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
        {/* Category filter pills */}
        <div className="flex gap-2 overflow-x-auto mt-4">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setFilterCategory(category)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors whitespace-nowrap ${
                filterCategory === category
                  ? 'bg-teal-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full bg-white rounded-xl shadow-sm p-12 text-center">
            <SkeletonLoader variant="table" message="Loading services..." />
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-slate-600">No services found. Click "Add Service" to create one.</p>
          </div>
        ) : (
          filteredServices.map((service) => (
            <div key={service.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-slate-900">{service.name}</h3>
                    {service.status === 'Inactive' && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
                        Inactive
                      </span>
                    )}
                  </div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(service.category)}`}>
                    {service.category}
                  </span>
                </div>
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
                  <Package size={24} className="text-teal-600" />
                </div>
              </div>

              {service.code && (
                <p className="text-xs text-slate-400 font-mono mb-2">{service.code}</p>
              )}

              <p className="text-sm text-slate-600 mb-4">{service.description}</p>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 mb-4">
                <span className="text-sm text-slate-600">Price</span>
                {isVariablePrice(service) ? (
                  <span className="text-sm font-semibold text-amber-600 bg-amber-50 px-3 py-1 rounded-lg">Variable Price</span>
                ) : (
                  <span className="text-2xl font-bold text-teal-600">₱{service.price.toLocaleString()}</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(service)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 size={16} />
                  <span className="text-sm font-semibold">Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                  <span className="text-sm font-semibold">Delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-slate-900">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Service Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Complete Blood Count"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Service Code {editingService ? '*' : '(Auto-generated if left blank)'}
                  </label>
                  <input
                    type="text"
                    required={!!editingService}
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    placeholder="e.g., LAB-001 (auto-generated)"
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
                      {CATEGORY_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Price (₱) * <span className="text-slate-400 font-normal text-xs">— enter 0 for variable</span>
                    </label>
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
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows="3"
                    placeholder="Brief description of the service..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Status *</label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors"
                >
                  {editingService ? 'Update Service' : 'Add Service'}
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

      {showImportModal && (
        <ServicesCSVImportModal
          onImportComplete={() => { setShowImportModal(false); loadServices() }}
          onClose={() => setShowImportModal(false)}
        />
      )}
    </div>
  )
}

export default Services
