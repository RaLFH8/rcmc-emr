import { useState, useEffect } from 'react'
import { Bed, Plus, Edit2, Trash2, X, CheckCircle, XCircle } from 'lucide-react'
import { db } from '../lib/supabase'
import HeartbeatLoader from '../components/HeartbeatLoader'

const Rooms = () => {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingRoom, setEditingRoom] = useState(null)
  const [filterStatus, setFilterStatus] = useState('All')
  const [formData, setFormData] = useState({
    room_number: '',
    room_type: 'Private',
    status: 'Available',
    floor: '1',
    capacity: 1,
    daily_rate: '',
    amenities: ''
  })

  useEffect(() => {
    loadRooms()
  }, [])

  const loadRooms = async () => {
    try {
      setLoading(true)
      const data = await db.getRooms()
      setRooms(data)
    } catch (error) {
      console.error('Error loading rooms:', error)
      alert('Failed to load rooms: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Convert amenities string to array for database
      const roomData = {
        ...formData,
        amenities: formData.amenities 
          ? formData.amenities.split(',').map(a => a.trim()).filter(a => a !== '')
          : []
      }
      
      if (editingRoom) {
        await db.updateRoom(editingRoom.id, roomData)
      } else {
        await db.addRoom(roomData)
      }
      await loadRooms()
      closeModal()
    } catch (error) {
      console.error('Error saving room:', error)
      alert('Failed to save room: ' + error.message)
    }
  }

  const handleEdit = (room) => {
    setEditingRoom(room)
    setFormData({
      room_number: room.room_number,
      room_type: room.room_type,
      status: room.status,
      floor: room.floor || '1',
      capacity: room.capacity || 1,
      daily_rate: room.daily_rate || '',
      amenities: Array.isArray(room.amenities) ? room.amenities.join(', ') : (room.amenities || '')
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this room?')) {
      try {
        await db.deleteRoom(id)
        await loadRooms()
      } catch (error) {
        console.error('Error deleting room:', error)
        alert('Failed to delete room: ' + error.message)
      }
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingRoom(null)
    setFormData({
      room_number: '',
      room_type: 'Private',
      status: 'Available',
      floor: '1',
      capacity: 1,
      daily_rate: '',
      amenities: ''
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available':
        return 'bg-green-100 text-green-700'
      case 'Occupied':
        return 'bg-red-100 text-red-700'
      case 'Maintenance':
        return 'bg-yellow-100 text-yellow-700'
      case 'Reserved':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const getRoomTypeColor = (type) => {
    switch (type) {
      case 'ICU':
        return 'bg-purple-100 text-purple-700'
      case 'Private':
        return 'bg-teal-100 text-teal-700'
      case 'Semi-Private':
        return 'bg-blue-100 text-blue-700'
      case 'Ward':
        return 'bg-slate-100 text-slate-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const filteredRooms = filterStatus === 'All' 
    ? rooms 
    : rooms.filter(room => room.status === filterStatus)

  const stats = {
    total: rooms.length,
    available: rooms.filter(r => r.status === 'Available').length,
    occupied: rooms.filter(r => r.status === 'Occupied').length,
    maintenance: rooms.filter(r => r.status === 'Maintenance').length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Room Management</h1>
          <p className="text-sm text-slate-600 mt-1">Manage hospital rooms and bed availability</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors shadow-sm"
        >
          <Plus size={20} />
          Add Room
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-600 font-semibold">Total Rooms</p>
            <Bed size={20} className="text-slate-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-600 font-semibold">Available</p>
            <CheckCircle size={20} className="text-green-500" />
          </div>
          <p className="text-3xl font-bold text-green-600">{stats.available}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-600 font-semibold">Occupied</p>
            <XCircle size={20} className="text-red-500" />
          </div>
          <p className="text-3xl font-bold text-red-600">{stats.occupied}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-600 font-semibold">Maintenance</p>
            <Bed size={20} className="text-yellow-500" />
          </div>
          <p className="text-3xl font-bold text-yellow-600">{stats.maintenance}</p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex gap-2">
          {['All', 'Available', 'Occupied', 'Maintenance', 'Reserved'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                filterStatus === status
                  ? 'bg-teal-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full bg-white rounded-xl shadow-sm p-12 text-center">
            <HeartbeatLoader message="Loading rooms..." />
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-slate-600">No rooms found. Click "Add Room" to create one.</p>
          </div>
        ) : (
          filteredRooms.map((room) => (
          <div key={room.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Room {room.room_number}</h3>
                <p className="text-sm text-slate-600">Floor {room.floor}</p>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                <Bed size={24} className="text-teal-600" />
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Type:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoomTypeColor(room.room_type)}`}>
                  {room.room_type}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Status:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(room.status)}`}>
                  {room.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Capacity:</span>
                <span className="text-sm font-semibold text-slate-900">{room.capacity}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Rate/Day:</span>
                <span className="text-sm font-semibold text-slate-900">₱{room.daily_rate?.toLocaleString() || '0'}</span>
              </div>
              {room.patient_name && (
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-500">Current Patient:</p>
                  <p className="text-sm font-semibold text-slate-900">{room.patient_name}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
              <button
                onClick={() => handleEdit(room)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit2 size={16} />
                <span className="text-sm font-semibold">Edit</span>
              </button>
              <button
                onClick={() => handleDelete(room.id)}
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
                {editingRoom ? 'Edit Room' : 'Add New Room'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Room Number *</label>
                    <input
                      type="text"
                      required
                      value={formData.room_number}
                      onChange={(e) => setFormData({...formData, room_number: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Floor *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.floor}
                      onChange={(e) => setFormData({...formData, floor: parseInt(e.target.value)})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Room Type *</label>
                    <select
                      required
                      value={formData.room_type}
                      onChange={(e) => setFormData({...formData, room_type: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="Private">Private</option>
                      <option value="Semi-Private">Semi-Private</option>
                      <option value="Ward">Ward</option>
                      <option value="ICU">ICU</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Status *</label>
                    <select
                      required
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="Available">Available</option>
                      <option value="Occupied">Occupied</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Reserved">Reserved</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Capacity *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.capacity}
                      onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Rate per Day (₱) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.daily_rate}
                      onChange={(e) => setFormData({...formData, daily_rate: parseFloat(e.target.value)})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Amenities</label>
                  <textarea
                    value={formData.amenities}
                    onChange={(e) => setFormData({...formData, amenities: e.target.value})}
                    rows="3"
                    placeholder="e.g., TV, AC, Private bathroom..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors"
                >
                  {editingRoom ? 'Update Room' : 'Add Room'}
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
    </div>
  )
}

export default Rooms
