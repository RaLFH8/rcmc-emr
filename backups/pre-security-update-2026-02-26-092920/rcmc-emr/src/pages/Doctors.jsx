import { useEffect, useState } from 'react'
import { Plus, Search, Edit2, Trash2, X, User, Phone, Mail, Stethoscope } from 'lucide-react'
import { db, supabase } from '../lib/supabase'
import HeartbeatLoader from '../components/HeartbeatLoader'

const Doctors = () => {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState(null)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    specialization: '',
    license_number: '',
    contact_number: '',
    email: '',
    schedule: '',
    consultation_fee: '',
    status: 'Active'
  })

  useEffect(() => {
    loadDoctors()
  }, [])

  const loadDoctors = async () => {
    try {
      setLoading(true)
      const data = await db.getDoctors()
      setDoctors(data)
    } catch (error) {
      console.error('Error loading doctors:', error)
      alert('Failed to load doctors')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Prepare data with proper type conversion
      const dataToSave = {
        ...formData,
        consultation_fee: formData.consultation_fee === '' ? null : parseFloat(formData.consultation_fee)
      }

      if (editingDoctor) {
        const { error } = await supabase
          .from('doctors')
          .update(dataToSave)
          .eq('id', editingDoctor.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('doctors')
          .insert([dataToSave])
        
        if (error) throw error
      }
      await loadDoctors()
      closeModal()
    } catch (error) {
      console.error('Error saving doctor:', error)
      alert('Failed to save doctor: ' + error.message)
    }
  }

  const handleEdit = (doctor) => {
    setEditingDoctor(doctor)
    setFormData({
      first_name: doctor.first_name,
      last_name: doctor.last_name,
      specialization: doctor.specialization,
      license_number: doctor.license_number || '',
      contact_number: doctor.contact_number || '',
      email: doctor.email || '',
      schedule: doctor.schedule || '',
      consultation_fee: doctor.consultation_fee || '',
      status: doctor.status
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to deactivate this doctor?')) {
      try {
        const { error } = await supabase
          .from('doctors')
          .update({ status: 'Inactive' })
          .eq('id', id)
        
        if (error) throw error
        await loadDoctors()
      } catch (error) {
        console.error('Error deleting doctor:', error)
        alert('Failed to delete doctor')
      }
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingDoctor(null)
    setFormData({
      first_name: '',
      last_name: '',
      specialization: '',
      license_number: '',
      contact_number: '',
      email: '',
      schedule: '',
      consultation_fee: '',
      status: 'Active'
    })
  }

  const filteredDoctors = doctors.filter(doctor =>
    `${doctor.first_name} ${doctor.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doctor.license_number && doctor.license_number.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <HeartbeatLoader message="Loading doctors..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Doctor Management</h1>
          <p className="text-sm text-slate-600 mt-1">Manage doctor profiles and schedules</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors shadow-sm"
        >
          <Plus size={20} />
          Add Doctor
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, specialization, or license number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.map((doctor) => (
          <div key={doctor.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                  <Stethoscope size={24} className="text-teal-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">
                    Dr. {doctor.first_name} {doctor.last_name}
                  </h3>
                  <p className="text-sm text-teal-600 font-semibold">{doctor.specialization}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {doctor.license_number && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="font-semibold">License:</span>
                  <span className="font-mono">{doctor.license_number}</span>
                </div>
              )}
              {doctor.contact_number && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone size={14} />
                  <span>{doctor.contact_number}</span>
                </div>
              )}
              {doctor.email && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail size={14} />
                  <span className="truncate">{doctor.email}</span>
                </div>
              )}
              {doctor.schedule && (
                <div className="text-sm text-slate-600">
                  <span className="font-semibold">Schedule:</span> {doctor.schedule}
                </div>
              )}
              {doctor.consultation_fee && (
                <div className="text-sm text-slate-600">
                  <span className="font-semibold">Fee:</span> ₱{Number(doctor.consultation_fee).toLocaleString()}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
              <button
                onClick={() => handleEdit(doctor)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit2 size={16} />
                <span className="text-sm font-semibold">Edit</span>
              </button>
              <button
                onClick={() => handleDelete(doctor.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
                <span className="text-sm font-semibold">Remove</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredDoctors.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Stethoscope size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-600 text-lg font-semibold mb-2">No doctors found</p>
          <p className="text-slate-500 text-sm">
            {searchTerm ? 'Try a different search term' : 'Click "Add Doctor" to add one'}
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-slate-900">
                {editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">First Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.last_name}
                      onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Specialization *</label>
                  <input
                    type="text"
                    required
                    value={formData.specialization}
                    onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                    placeholder="e.g., General Practitioner, Pediatrician, etc."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">License Number</label>
                  <input
                    type="text"
                    value={formData.license_number}
                    onChange={(e) => setFormData({...formData, license_number: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Contact Number</label>
                    <input
                      type="tel"
                      value={formData.contact_number}
                      onChange={(e) => setFormData({...formData, contact_number: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Schedule</label>
                  <input
                    type="text"
                    value={formData.schedule}
                    onChange={(e) => setFormData({...formData, schedule: e.target.value})}
                    placeholder="e.g., Mon-Fri 9AM-5PM"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Consultation Fee (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.consultation_fee}
                    onChange={(e) => setFormData({...formData, consultation_fee: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors"
                >
                  {editingDoctor ? 'Update Doctor' : 'Add Doctor'}
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

export default Doctors
