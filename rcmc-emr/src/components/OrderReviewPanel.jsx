import { useState } from 'react'
import { Plus, Edit2, Trash2, AlertCircle } from 'lucide-react'

/**
 * OrderReviewPanel Component
 * 
 * Displays extracted medical orders for physician review and confirmation.
 * Allows editing, removing, and manually adding orders before saving to database.
 */
const OrderReviewPanel = ({ orders, onConfirm, onEdit, onRemove, onAdd }) => {
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingIndex, setEditingIndex] = useState(null)
  const [newOrder, setNewOrder] = useState({
    type: 'medication',
    details: '',
    priority: 'routine'
  })

  const orderTypeLabels = {
    medication: 'Medication',
    lab_test: 'Lab Test',
    procedure: 'Procedure',
    diet: 'Diet',
    activity_restriction: 'Activity Restriction'
  }

  const orderTypeColors = {
    medication: 'bg-blue-100 text-blue-700 border-blue-300',
    lab_test: 'bg-purple-100 text-purple-700 border-purple-300',
    procedure: 'bg-orange-100 text-orange-700 border-orange-300',
    diet: 'bg-green-100 text-green-700 border-green-300',
    activity_restriction: 'bg-red-100 text-red-700 border-red-300'
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

  const handleAddOrder = () => {
    if (!newOrder.details.trim()) {
      alert('Order details are required')
      return
    }

    onAdd({
      type: newOrder.type,
      details: newOrder.details.trim(),
      priority: newOrder.priority,
      confidence: 1.0, // Manual orders have 100% confidence
      sourceText: newOrder.details.trim()
    })

    // Reset form
    setNewOrder({
      type: 'medication',
      details: '',
      priority: 'routine'
    })
    setShowAddModal(false)
  }

  const handleEditOrder = () => {
    if (!newOrder.details.trim()) {
      alert('Order details are required')
      return
    }

    onEdit(editingIndex, {
      ...orders[editingIndex],
      type: newOrder.type,
      details: newOrder.details.trim(),
      priority: newOrder.priority
    })

    // Reset form
    setNewOrder({
      type: 'medication',
      details: '',
      priority: 'routine'
    })
    setShowEditModal(false)
    setEditingIndex(null)
  }

  const openEditModal = (index) => {
    const order = orders[index]
    setNewOrder({
      type: order.type,
      details: order.details,
      priority: order.priority
    })
    setEditingIndex(index)
    setShowEditModal(true)
  }

  const closeModals = () => {
    setShowAddModal(false)
    setShowEditModal(false)
    setEditingIndex(null)
    setNewOrder({
      type: 'medication',
      details: '',
      priority: 'routine'
    })
  }

  return (
    <div className="bg-white border-2 border-teal-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Extracted Orders</h3>
          <p className="text-sm text-slate-600">Review and confirm medical orders before saving</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors text-sm font-semibold"
        >
          <Plus size={16} />
          Add Order
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
          <AlertCircle size={48} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-600 font-semibold">No orders detected</p>
          <p className="text-slate-500 text-sm mt-1">Add orders manually or enter treatment text above</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order, index) => (
            <div
              key={index}
              className={`border-2 rounded-lg p-4 ${orderTypeColors[order.type]}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wide">
                    {orderTypeLabels[order.type]}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${priorityColors[order.priority]}`}>
                    {priorityLabels[order.priority]}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(index)}
                    className="p-1.5 hover:bg-white hover:bg-opacity-50 rounded transition-colors"
                    title="Edit order"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => onRemove(index)}
                    className="p-1.5 hover:bg-white hover:bg-opacity-50 rounded transition-colors"
                    title="Remove order"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p className="text-sm font-medium">{order.details}</p>
              {order.confidence < 0.8 && (
                <p className="text-xs mt-2 opacity-75">
                  ⚠️ Low confidence ({Math.round(order.confidence * 100)}%) - please verify
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {orders.length > 0 && (
        <div className="mt-4 pt-4 border-t border-teal-200">
          <button
            onClick={onConfirm}
            className="w-full py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors font-semibold"
          >
            Confirm {orders.length} Order{orders.length !== 1 ? 's' : ''}
          </button>
        </div>
      )}

      {/* Add Order Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-900">Add New Order</h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Order Type *</label>
                <select
                  value={newOrder.type}
                  onChange={(e) => setNewOrder({ ...newOrder, type: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="medication">Medication</option>
                  <option value="lab_test">Lab Test</option>
                  <option value="procedure">Procedure</option>
                  <option value="diet">Diet</option>
                  <option value="activity_restriction">Activity Restriction</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Order Details *</label>
                <textarea
                  value={newOrder.details}
                  onChange={(e) => setNewOrder({ ...newOrder, details: e.target.value })}
                  rows="4"
                  placeholder="Enter order details..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Priority *</label>
                <select
                  value={newOrder.priority}
                  onChange={(e) => setNewOrder({ ...newOrder, priority: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="routine">Routine</option>
                  <option value="urgent">Urgent</option>
                  <option value="stat">STAT (Immediate)</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={handleAddOrder}
                className="flex-1 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors"
              >
                Add Order
              </button>
              <button
                onClick={closeModals}
                className="px-8 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-900">Edit Order</h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Order Type *</label>
                <select
                  value={newOrder.type}
                  onChange={(e) => setNewOrder({ ...newOrder, type: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="medication">Medication</option>
                  <option value="lab_test">Lab Test</option>
                  <option value="procedure">Procedure</option>
                  <option value="diet">Diet</option>
                  <option value="activity_restriction">Activity Restriction</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Order Details *</label>
                <textarea
                  value={newOrder.details}
                  onChange={(e) => setNewOrder({ ...newOrder, details: e.target.value })}
                  rows="4"
                  placeholder="Enter order details..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Priority *</label>
                <select
                  value={newOrder.priority}
                  onChange={(e) => setNewOrder({ ...newOrder, priority: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="routine">Routine</option>
                  <option value="urgent">Urgent</option>
                  <option value="stat">STAT (Immediate)</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={handleEditOrder}
                className="flex-1 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={closeModals}
                className="px-8 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderReviewPanel
