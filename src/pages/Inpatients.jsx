import { useState, useEffect } from 'react'
import { Plus, Search, User, Bed, Calendar, Clock, X, Activity } from 'lucide-react'
import { db } from '../lib/supabase'
import SkeletonLoader from '../components/SkeletonLoader'

const Inpatients = () => {
  const [inpatients, setInpatients] = useState([])
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [viewingPatient, setViewingPatient] = useState(null)
  const [formData, setFormData] = useState({
    patient_id: '',
    room_id: '',
    doctor_id: '',
    admission_date: new Date().toISOString().split('T')[0],
    diagnosis: '',
    treatment_plan: '',
    status: 'Stable',
    notes: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [inpatientsData, patientsData, doctorsData, roomsData] = await Promise.all([
        db.getInpatients(),
        db.getPatients(1000),
        db.getDoctors(),
        db.getRooms()
      ])
      
      // Transform inpatients data
      const transformedInpatients = inpatientsData.map(inp => ({
        id: inp.id,
        patient_id: inp.patient_id,
        patient_name: inp.patient ? `${inp.patient.first_name} ${inp.patient.last_name}` : 'Unknown',
        patient_number: inp.patient?.patient_number || 'N/A',
        room_id: inp.room_id,
        room_number: inp.room?.room_number || 'N/A',
        doctor_id: inp.doctor_id,
        doctor: inp.doctor ? `Dr. ${inp.doctor.first_name} ${inp.doctor.last_name}` : 'Unknown',
        admission_date: inp.admission_date?.split('T')[0] || '',
        diagnosis: inp.diagnosis || '',
        status: inp.status || 'Stable',
        notes: inp.notes || ''
      }))
      
      setInpatients(transformedInpatients)
      setPatients(patientsData)
      setDoctors(doctorsData)
      setRooms(roomsData.filter(r => r.status === 'Available'))
    } catch (error) {
      console.error('Error loading data:', error)
      alert('Failed to load data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const inpatientData = {
        patient_id: formData.patient_id,
        room_id: formData.room_id,
        doctor_id: formData.doctor_id,
        admission_date: formData.admission_date,
        admission_reason: formData.diagnosis, // Use diagnosis as admission reason
        diagnosis: formData.diagnosis,
        treatment_plan: formData.treatment_plan,
        status: formData.status,
        daily_notes: formData.notes ? [{ date: new Date().toISOString(), note: formData.notes }] : []
      }
      await db.addInpatient(inpatientData)
      await loadData()
      closeModal()
    } catch (error) {
      console.error('Error admitting patient:', error)
      alert('Failed to admit patient: ' + error.message)
    }
  }

  const handleDischarge = async (id) => {
    if (confirm('Are you sure you want to discharge this patient?')) {
      try {
        await db.dischargeInpatient(id, new Date().toISOString().split('T')[0])
        await loadData()
      } catch (error) {
        console.error('Error discharging patient:', error)
        alert('Failed to discharge patient: ' + error.message)
      }
    }
  }

  const handleView = (patient) => {
    setViewingPatient(patient)
  }

  const closeModal = () => {
    setShowModal(false)
    setFormData({
      patient_id: '',
      room_id: '',
      doctor_id: '',
      admission_date: new Date().toISOString().split('T')[0],
      diagnosis: '',
      treatment_plan: '',
      status: 'Stable',
      notes: ''
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Stable':
        return 'bg-green-100 text-green-700'
      case 'Critical':
        return 'bg-red-100 text-red-700'
      case 'Improving':
        return 'bg-blue-100 text-blue-700'
      case 'Observation':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const getDaysAdmitted = (admissionDate) => {
    const today = new Date()
    const admission = new Date(admissionDate)
    const diffTime = Math.abs(today - admission)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const filteredInpatients = inpatients.filter(patient => {
    const matchesSearch = patient.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.patient_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.room_number.includes(searchTerm)
    const matchesStatus = filterStatus === 'All' || patient.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: inpatients.length,
    critical: inpatients.filter(p => p.status === 'Critical').length,
    stable: inpatients.filter(p => p.status === 'Stable').length,
    improving: inpatients.filter(p => p.status === 'Improving').length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SkeletonLoader variant="table" message="Loading inpatients..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inpatient Management</h1>
          <p className="text-sm text-slate-600 mt-1">Monitor and manage admitted patients</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors shadow-sm"
        >
          <Plus size={20} />
          Admit Patient
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-600 font-semibold">Total Inpatients</p>
            <Bed size={20} className="text-slate-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-600 font-semibold">Critical</p>
            <Activity size={20} className="text-red-500" />
          </div>
          <p className="text-3xl font-bold text-red-600">{stats.critical}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-600 font-semibold">Stable</p>
            <Activity size={20} className="text-green-500" />
          </div>
          <p className="text-3xl font-bold text-green-600">{stats.stable}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-600 font-semibold">Improving</p>
            <Activity size={20} className="text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-blue-600">{stats.improving}</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by patient name, number, or room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="flex gap-2">
            {['All', 'Critical', 'Stable', 'Improving', 'Observation'].map((status) => (
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
      </div>

      {/* Inpatients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInpatients.map((patient) => (
          <div key={patient.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                  <User size={24} className="text-teal-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{patient.patient_name}</h3>
                  <p className="text-xs text-slate-500 font-mono">{patient.patient_number}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(patient.status)}`}>
                {patient.status}
              </span>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Bed size={16} className="text-slate-400" />
                <span className="font-semibold">Room:</span>
                <span>{patient.room_number}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Calendar size={16} className="text-slate-400" />
                <span className="font-semibold">Admitted:</span>
                <span>{new Date(patient.admission_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <span className="text-xs text-slate-500">({getDaysAdmitted(patient.admission_date)} days)</span>
              </div>
              <div className="text-sm text-slate-700">
                <span className="font-semibold">Diagnosis:</span> {patient.diagnosis}
              </div>
              <div className="text-sm text-slate-700">
                <span className="font-semibold">Doctor:</span> {patient.doctor}
              </div>
              {patient.notes && (
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-600">{patient.notes}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
              <button
                onClick={() => handleView(patient)}
                className="flex-1 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-semibold"
              >
                View Details
              </button>
              <button
                onClick={() => handleDischarge(patient.id)}
                className="flex-1 px-4 py-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors text-sm font-semibold"
              >
                Discharge
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredInpatients.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Bed size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-600 text-lg font-semibold mb-2">No inpatients found</p>
          <p className="text-slate-500 text-sm">
            {searchTerm ? 'Try a different search term' : 'Click "Admit Patient" to add one'}
          </p>
        </div>
      )}

      {/* Admit Patient Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-slate-900">Admit Patient</h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Select Patient *</label>
                  <select
                    required
                    value={formData.patient_id}
                    onChange={(e) => setFormData({...formData, patient_id: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">-- Select Patient --</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.first_name} {patient.last_name} ({patient.patient_number})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Room *</label>
                    <select
                      required
                      value={formData.room_id}
                      onChange={(e) => setFormData({...formData, room_id: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">-- Select Room --</option>
                      {rooms.map(room => (
                        <option key={room.id} value={room.id}>
                          {room.room_number} - {room.room_type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Doctor *</label>
                    <select
                      required
                      value={formData.doctor_id}
                      onChange={(e) => setFormData({...formData, doctor_id: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">-- Select Doctor --</option>
                      {doctors.map(doctor => (
                        <option key={doctor.id} value={doctor.id}>
                          Dr. {doctor.first_name} {doctor.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Admission Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.admission_date}
                      onChange={(e) => setFormData({...formData, admission_date: e.target.value})}
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
                      <option value="Stable">Stable</option>
                      <option value="Critical">Critical</option>
                      <option value="Improving">Improving</option>
                      <option value="Observation">Observation</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Diagnosis *</label>
                  <input
                    type="text"
                    required
                    value={formData.diagnosis}
                    onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                    placeholder="e.g., Pneumonia, Post-operative care..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Treatment Plan</label>
                  <textarea
                    value={formData.treatment_plan}
                    onChange={(e) => setFormData({...formData, treatment_plan: e.target.value})}
                    rows="2"
                    placeholder="Treatment plan details..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows="3"
                    placeholder="Additional notes or observations..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors"
                >
                  Admit Patient
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

      {/* View Patient Details Modal */}
      {viewingPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Patient Details</h2>
              <button onClick={() => setViewingPatient(null)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
                  <User size={32} className="text-teal-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">{viewingPatient.patient_name}</h3>
                  <p className="text-slate-600 font-mono">{viewingPatient.patient_number}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Room Number</p>
                  <p className="text-lg font-semibold text-slate-900">{viewingPatient.room_number}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(viewingPatient.status)}`}>
                    {viewingPatient.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Admission Date</p>
                  <p className="font-semibold text-slate-900">
                    {new Date(viewingPatient.admission_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-slate-500">{getDaysAdmitted(viewingPatient.admission_date)} days admitted</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Attending Doctor</p>
                  <p className="font-semibold text-slate-900">{viewingPatient.doctor}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-600 mb-1">Diagnosis</p>
                <p className="text-slate-900">{viewingPatient.diagnosis}</p>
              </div>

              {viewingPatient.notes && (
                <div>
                  <p className="text-sm text-slate-600 mb-1">Notes</p>
                  <p className="text-slate-900">{viewingPatient.notes}</p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 flex gap-3">
                <button className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors">
                  Update Status
                </button>
                <button 
                  onClick={() => {
                    setViewingPatient(null)
                    handleDischarge(viewingPatient.id)
                  }}
                  className="flex-1 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors"
                >
                  Discharge Patient
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Inpatients
