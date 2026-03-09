import { useEffect, useState } from 'react'
import { Search, Filter, Download, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react'
import { db } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import HeartbeatLoader from '../components/HeartbeatLoader'

const Orders = () => {
  const { userProfile } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState(['pending', 'in_progress'])
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    loadOrders()
    
    // Subscribe to real-time updates
    const subscription = db.subscribeToOrders((payload) => {
      console.log('Order update received:', payload)
      loadOrders() // Reload orders on any change
    })

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [statusFilter, priorityFilter, typeFilter])

  const loadOrders = async () => {
    try {
      setLoading(true)
      
      const filters = {}
      if (statusFilter.length > 0 && !statusFilter.includes('all')) {
        filters.status = statusFilter
      }
      if (priorityFilter !== 'all') {
        filters.priority = priorityFilter
      }
      if (typeFilter !== 'all') {
        filters.type = typeFilter
      }

      let ordersData
      if (searchTerm.trim()) {
        ordersData = await db.searchOrders(searchTerm, filters)
      } else {
        ordersData = await db.getAllOrders(filters)
      }

      setOrders(ordersData)
    } catch (error) {
      console.error('Error loading orders:', error)
      alert('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await db.updateOrderStatus(orderId, newStatus, userProfile.id)
      await loadOrders()
      alert('Order status updated successfully')
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('Failed to update order status: ' + error.message)
    }
  }

  const handleExportCSV = () => {
    // Prepare CSV data
    const headers = ['Patient', 'Order Type', 'Details', 'Priority', 'Status', 'Created At', 'Created By']
    const rows = filteredOrders.map(order => [
      `${order.patient?.first_name} ${order.patient?.last_name}`,
      order.order_type,
      order.order_details,
      order.priority,
      order.status,
      new Date(order.created_at).toLocaleString(),
      order.created_by_user?.full_name || 'Unknown'
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const orderTypeLabels = {
    medication: 'Medication',
    lab_test: 'Lab Test',
    procedure: 'Procedure',
    diet: 'Diet',
    activity_restriction: 'Activity Restriction'
  }

  const orderTypeColors = {
    medication: 'bg-blue-100 text-blue-700',
    lab_test: 'bg-purple-100 text-purple-700',
    procedure: 'bg-orange-100 text-orange-700',
    diet: 'bg-green-100 text-green-700',
    activity_restriction: 'bg-red-100 text-red-700'
  }

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700'
  }

  const statusIcons = {
    pending: Clock,
    in_progress: AlertCircle,
    completed: CheckCircle,
    cancelled: XCircle
  }

  const priorityColors = {
    stat: 'bg-red-500 text-white',
    urgent: 'bg-orange-500 text-white',
    routine: 'bg-slate-400 text-white'
  }

  const priorityLabels = {
    stat: 'STAT',
    urgent: 'URGENT',
    routine: 'Routine'
  }

  // Filter orders based on search term
  const filteredOrders = orders

  const handleToggleStatus = (status) => {
    if (statusFilter.includes(status)) {
      setStatusFilter(statusFilter.filter(s => s !== status))
    } else {
      setStatusFilter([...statusFilter, status])
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <HeartbeatLoader message="Loading orders..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Medical Orders</h1>
          <p className="text-sm text-slate-600 mt-1">Track and manage patient medical orders</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-6 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors shadow-sm"
        >
          <Download size={20} />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search by patient name or order details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && loadOrders()}
            className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-3 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
            <div className="flex flex-wrap gap-2">
              {['pending', 'in_progress', 'completed', 'cancelled'].map(status => (
                <button
                  key={status}
                  onClick={() => handleToggleStatus(status)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    statusFilter.includes(status)
                      ? statusColors[status]
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Priorities</option>
              <option value="stat">STAT</option>
              <option value="urgent">Urgent</option>
              <option value="routine">Routine</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Order Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Types</option>
              <option value="medication">Medication</option>
              <option value="lab_test">Lab Test</option>
              <option value="procedure">Procedure</option>
              <option value="diet">Diet</option>
              <option value="activity_restriction">Activity Restriction</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <p className="text-sm text-slate-600">
            Showing <span className="font-semibold">{filteredOrders.length}</span> order{filteredOrders.length !== 1 ? 's' : ''}
          </p>
          <button
            onClick={loadOrders}
            className="text-sm text-teal-600 hover:text-teal-700 font-semibold"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Filter size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-600 font-semibold">No orders found</p>
            <p className="text-slate-500 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Order Details</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredOrders.map((order) => {
                  const StatusIcon = statusIcons[order.status]
                  return (
                    <tr 
                      key={order.id} 
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedOrder(order)
                        setShowDetailModal(true)
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-slate-900">
                          {order.patient?.first_name} {order.patient?.last_name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {order.patient?.patient_number}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${orderTypeColors[order.order_type]}`}>
                          {orderTypeLabels[order.order_type]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900 max-w-md truncate">
                          {order.order_details}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${priorityColors[order.priority]}`}>
                          {priorityLabels[order.priority]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${statusColors[order.status]}`}>
                          <StatusIcon size={14} />
                          {order.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-slate-500">
                          {order.created_by_user?.full_name || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={order.status}
                          onChange={(e) => {
                            e.stopPropagation()
                            handleStatusUpdate(order.id, e.target.value)
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          disabled={order.status === 'completed' || order.status === 'cancelled'}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Order Details</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Order ID: {selectedOrder.id.slice(0, 8)}...
                </p>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  setSelectedOrder(null)
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Patient Info */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Patient Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Name:</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {selectedOrder.patient?.first_name} {selectedOrder.patient?.last_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Patient Number:</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {selectedOrder.patient?.patient_number}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Info */}
              <div>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Order Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-600">Type:</label>
                    <div className="mt-1">
                      <span className={`px-3 py-1 rounded text-sm font-semibold ${orderTypeColors[selectedOrder.order_type]}`}>
                        {orderTypeLabels[selectedOrder.order_type]}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-600">Priority:</label>
                    <div className="mt-1">
                      <span className={`px-3 py-1 rounded text-sm font-bold ${priorityColors[selectedOrder.priority]}`}>
                        {priorityLabels[selectedOrder.priority]}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-600">Status:</label>
                    <div className="mt-1">
                      <span className={`px-3 py-1 rounded text-sm font-semibold ${statusColors[selectedOrder.status]}`}>
                        {selectedOrder.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-600">Details:</label>
                    <p className="text-sm text-slate-900 mt-1 bg-white border border-slate-200 rounded-lg p-3">
                      {selectedOrder.order_details}
                    </p>
                  </div>
                  {selectedOrder.notes && (
                    <div>
                      <label className="text-xs text-slate-600">Notes:</label>
                      <p className="text-sm text-slate-900 mt-1 bg-white border border-slate-200 rounded-lg p-3">
                        {selectedOrder.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Audit Trail */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide mb-3">Audit Trail</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Created By:</span>
                    <span className="font-semibold text-blue-900">
                      Dr. {selectedOrder.created_by_user?.first_name} {selectedOrder.created_by_user?.last_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Created At:</span>
                    <span className="font-semibold text-blue-900">
                      {new Date(selectedOrder.created_at).toLocaleString()}
                    </span>
                  </div>
                  {selectedOrder.completed_at && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Completed By:</span>
                        <span className="font-semibold text-blue-900">
                          {selectedOrder.completed_by_user?.first_name} {selectedOrder.completed_by_user?.last_name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Completed At:</span>
                        <span className="font-semibold text-blue-900">
                          {new Date(selectedOrder.completed_at).toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                  {selectedOrder.cancelled_at && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Cancelled By:</span>
                        <span className="font-semibold text-blue-900">
                          {selectedOrder.cancelled_by_user?.first_name} {selectedOrder.cancelled_by_user?.last_name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Cancelled At:</span>
                        <span className="font-semibold text-blue-900">
                          {new Date(selectedOrder.cancelled_at).toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                  {selectedOrder.appointment_id && (
                    <div className="flex justify-between">
                      <span className="text-blue-700">Source:</span>
                      <span className="font-semibold text-blue-900">
                        Consultation (ID: {selectedOrder.appointment_id.slice(0, 8)}...)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  setSelectedOrder(null)
                }}
                className="w-full py-3 bg-slate-600 text-white rounded-xl font-semibold hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Orders
