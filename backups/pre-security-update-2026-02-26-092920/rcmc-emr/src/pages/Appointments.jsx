import { useEffect, useState } from 'react'
import { Plus, Calendar as CalendarIcon, Clock, User, X, Search, Filter, CheckCircle, PlayCircle, FileText } from 'lucide-react'
import { db } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import HeartbeatLoader from '../components/HeartbeatLoader'

const Appointments = () => {
  const { userProfile } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [viewMode, setViewMode] = useState('all') // 'all' or 'queue'
  const [selectedDoctor, setSelectedDoctor] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '',
    reason: '',
    status: 'Scheduled',
    notes: ''
  })

  useEffect(() => {
    loadData()
    // Auto-set doctor filter if user is a doctor
    if (userProfile?.role === 'doctor' && userProfile?.id) {
      setSelectedDoctor(userProfile.id.toString())
      setViewMode('queue')
    }
  }, [selectedDate, userProfile])

  const loadData = async () => {
    try {
      setLoading(true)
      const [appointmentsData, patientsData, doctorsData] = await Promise.all([
        db.getAppointments(selectedDate),
        db.getPatients(1000),
        db.getDoctors()
      ])
      setAppointments(appointmentsData)
      setPatients(patientsData)
      setDoctors(doctorsData)
    } catch (error) {
      console.error('Error loading data:', error)
      alert('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await db.addAppointment(formData)
      await loadData()
      closeModal()
    } catch (error) {
      console.error('Error saving appointment:', error)
      alert('Failed to save appointment: ' + error.message)
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      await db.updateAppointment(id, { status: newStatus })
      await loadData()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setFormData({
      patient_id: '',
      doctor_id: '',
      appointment_date: new Date().toISOString().split('T')[0],
      appointment_time: '',
      reason: '',
      status: 'Scheduled',
      notes: ''
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-blue-100 text-blue-700'
      case 'Confirmed':
        return 'bg-green-100 text-green-700'
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-700'
      case 'Completed':
        return 'bg-teal-100 text-teal-700'
      case 'Cancelled':
        return 'bg-red-100 text-red-700'
      case 'No Show':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const groupedAppointments = appointments.reduce((acc, apt) => {
    const time = apt.appointment_time
    if (!acc[time]) acc[time] = []
    acc[time].push(apt)
    return acc
  }, {})

  const timeSlots = Object.keys(groupedAppointments).sort()

  // Filter appointments based on selected doctor and status
  const filteredAppointments = appointments.filter(apt => {
    const doctorMatch = selectedDoctor === 'all' || apt.doctor_id?.toString() === selectedDoctor
    const statusMatch = statusFilter === 'all' || apt.status === statusFilter
    return doctorMatch && statusMatch
  })

  // Queue view - group by status
  const queueAppointments = {
    waiting: filteredAppointments.filter(apt => apt.status === 'Scheduled' || apt.status === 'Confirmed'),
    inProgress: filteredAppointments.filter(apt => apt.status === 'In Progress'),
    completed: filteredAppointments.filter(apt => apt.status === 'Completed')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <HeartbeatLoader message="Loading appointments..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Appointments</h1>
          <p className="text-sm text-slate-600 mt-1">Manage patient appointments and schedules</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors shadow-sm"
        >
          <Plus size={20} />
          New Appointment
        </button>
      </div>

      {/* View Mode Toggle & Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('all')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                viewMode === 'all' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-600'
              }`}
            >
              All Appointments
            </button>
            <button
              onClick={() => setViewMode('queue')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                viewMode === 'queue' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-600'
              }`}
            >
              Patient Queue
            </button>
          </div>

          {/* Date Selector */}
          <div className="flex items-center gap-2">
            <CalendarIcon size={18} className="text-slate-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>

          {/* Doctor Filter */}
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-600" />
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            >
              <option value="all">All Doctors</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  Dr. {doctor.first_name} {doctor.last_name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter (only in queue view) */}
          {viewMode === 'queue' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            >
              <option value="all">All Status</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Confirmed">Confirmed</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          )}

          <div className="flex-1"></div>
          <div className="text-sm text-slate-600">
            <span className="font-semibold">{filteredAppointments.length}</span> appointments
          </div>
        </div>
      </div>

      {/* Queue View */}
      {viewMode === 'queue' ? (
        <div className="grid grid-cols-3 gap-6">
          {/* Waiting */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-blue-50 border-b-2 border-blue-200 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-blue-900">Waiting</h3>
                <span className="px-3 py-1 bg-blue-200 text-blue-900 rounded-full text-sm font-semibold">
                  {queueAppointments.waiting.length}
                </span>
              </div>
            </div>
            <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
              {queueAppointments.waiting.length === 0 ? (
                <p className="text-center text-slate-500 py-8 text-sm">No patients waiting</p>
              ) : (
                queueAppointments.waiting.map((apt) => (
                  <div key={apt.id} className="bg-slate-50 rounded-lg p-4 border-2 border-slate-200 hover:border-blue-300 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User size={18} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">
                            {apt.patient?.first_name} {apt.patient?.last_name}
                          </p>
                          <p className="text-xs text-slate-500">{apt.appointment_time}</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 mb-3">{apt.reason}</p>
                    <button
                      onClick={() => handleStatusChange(apt.id, 'In Progress')}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-semibold"
                    >
                      <PlayCircle size={16} />
                      Start Consultation
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* In Progress */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-yellow-50 border-b-2 border-yellow-200 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-yellow-900">In Progress</h3>
                <span className="px-3 py-1 bg-yellow-200 text-yellow-900 rounded-full text-sm font-semibold">
                  {queueAppointments.inProgress.length}
                </span>
              </div>
            </div>
            <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
              {queueAppointments.inProgress.length === 0 ? (
                <p className="text-center text-slate-500 py-8 text-sm">No active consultations</p>
              ) : (
                queueAppointments.inProgress.map((apt) => (
                  <div key={apt.id} className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-300">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                          <User size={18} className="text-yellow-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">
                            {apt.patient?.first_name} {apt.patient?.last_name}
                          </p>
                          <p className="text-xs text-slate-500">{apt.appointment_time}</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 mb-3">{apt.reason}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.open(`#/prescriptions?patient=${apt.patient_id}`, '_blank')}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors text-sm font-semibold"
                      >
                        <FileText size={16} />
                        Prescribe
                      </button>
                      <button
                        onClick={() => handleStatusChange(apt.id, 'Completed')}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-semibold"
                      >
                        <CheckCircle size={16} />
                        Complete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Completed */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-teal-50 border-b-2 border-teal-200 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-teal-900">Completed</h3>
                <span className="px-3 py-1 bg-teal-200 text-teal-900 rounded-full text-sm font-semibold">
                  {queueAppointments.completed.length}
                </span>
              </div>
            </div>
            <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
              {queueAppointments.completed.length === 0 ? (
                <p className="text-center text-slate-500 py-8 text-sm">No completed consultations</p>
              ) : (
                queueAppointments.completed.map((apt) => (
                  <div key={apt.id} className="bg-slate-50 rounded-lg p-4 border-2 border-slate-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                          <CheckCircle size={18} className="text-teal-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">
                            {apt.patient?.first_name} {apt.patient?.last_name}
                          </p>
                          <p className="text-xs text-slate-500">{apt.appointment_time}</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600">{apt.reason}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Timeline View */
        /* Timeline View */
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {timeSlots.length === 0 ? (
            <div className="p-12 text-center">
              <CalendarIcon size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-600 text-lg font-semibold mb-2">No appointments scheduled</p>
              <p className="text-slate-500 text-sm">Click "New Appointment" to schedule one</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {timeSlots.map((time) => (
                <div key={time} className="p-6">
                  <div className="flex items-start gap-6">
                    <div className="flex items-center gap-2 text-slate-600 min-w-[100px]">
                      <Clock size={16} />
                      <span className="font-semibold">{time}</span>
                    </div>
                    <div className="flex-1 space-y-3">
                      {groupedAppointments[time].map((apt) => (
                        <div
                          key={apt.id}
                          className="bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                                  <User size={20} className="text-teal-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900">
                                    {apt.patient?.first_name} {apt.patient?.last_name}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    Patient #{apt.patient?.patient_number}
                                  </p>
                                </div>
                              </div>
                              <div className="ml-13 space-y-1">
                                <p className="text-sm text-slate-700">
                                  <span className="font-semibold">Doctor:</span> Dr. {apt.doctor?.first_name} {apt.doctor?.last_name}
                                </p>
                                <p className="text-sm text-slate-700">
                                  <span className="font-semibold">Reason:</span> {apt.reason}
                                </p>
                                {apt.notes && (
                                  <p className="text-sm text-slate-600">
                                    <span className="font-semibold">Notes:</span> {apt.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <select
                                value={apt.status}
                                onChange={(e) => handleStatusChange(apt.id, e.target.value)}
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(apt.status)} border-0 cursor-pointer`}
                              >
                                <option value="Scheduled">Scheduled</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                                <option value="No Show">No Show</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-slate-900">New Appointment</h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Patient *</label>
                  <select
                    required
                    value={formData.patient_id}
                    onChange={(e) => setFormData({...formData, patient_id: e.target.value})}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Select Patient</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.first_name} {patient.last_name} - {patient.patient_number}
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
                    <option value="">Select Doctor</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        Dr. {doctor.first_name} {doctor.last_name} - {doctor.specialization}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.appointment_date}
                      onChange={(e) => setFormData({...formData, appointment_date: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Time *</label>
                    <input
                      type="time"
                      required
                      value={formData.appointment_time}
                      onChange={(e) => setFormData({...formData, appointment_time: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Reason for Visit *</label>
                  <input
                    type="text"
                    required
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    placeholder="e.g., Regular checkup, Follow-up, etc."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows="3"
                    placeholder="Additional notes or instructions..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors"
                >
                  Schedule Appointment
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

export default Appointments
