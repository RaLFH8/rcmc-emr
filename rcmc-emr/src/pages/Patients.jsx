import { useEffect, useState } from 'react'
import { Plus, Search, Edit2, Trash2, X, User, Calendar, FileText, Activity, DollarSign, Bed, Download, Upload } from 'lucide-react'
import { db } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import HeartbeatLoader from '../components/HeartbeatLoader'
import { PatientImportModal } from '../components/import/PatientImportModal'

const Patients = () => {
  const { userProfile } = useAuth()
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [viewingPatient, setViewingPatient] = useState(null)
  const [editingPatient, setEditingPatient] = useState(null)
  const [consultations, setConsultations] = useState([])
  const [appointments, setAppointments] = useState([])
  const [payments, setPayments] = useState([])
  const [admissions, setAdmissions] = useState([])
  const [loadingConsultations, setLoadingConsultations] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    contact_number: '',
    email: '',
    address: '',
    blood_type: '',
    allergies: '',
    medical_history: '',
    emergency_contact_name: '',
    emergency_contact_number: '',
    // Vital Signs
    weight: '',
    blood_pressure: '',
    temperature: '',
    heart_rate: '',
    respiratory_rate: '',
    oxygen_saturation: ''
  })

  useEffect(() => {
    loadPatients()
  }, [searchTerm])

  const loadPatients = async () => {
    try {
      setLoading(true)
      const data = await db.getPatients(100, 0, searchTerm)
      setPatients(data)
    } catch (error) {
      console.error('Error loading patients:', error)
      alert('Failed to load patients')
    } finally {
      setLoading(false)
    }
  }

  // Export to CSV
  const handleExport = () => {
    const headers = ['Patient Number', 'First Name', 'Last Name', 'Date of Birth', 'Gender', 'Contact Number', 'Email', 'Address', 'Blood Type', 'Emergency Contact', 'Emergency Phone', 'Status']
    const csvData = patients.map(patient => [
      patient.patient_number,
      patient.first_name,
      patient.last_name,
      patient.date_of_birth,
      patient.gender,
      patient.contact_number,
      patient.email || '',
      patient.address,
      patient.blood_type || '',
      patient.emergency_contact_name,
      patient.emergency_contact_number,
      patient.status
    ])

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `patients_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Convert medical_history and allergies to proper JSONB/array format
      let medicalHistoryValue
      const medicalHistoryStr = String(formData.medical_history || '')
      if (!medicalHistoryStr || medicalHistoryStr.trim() === '') {
        medicalHistoryValue = [] // Empty array for JSONB
      } else {
        medicalHistoryValue = [medicalHistoryStr.trim()] // Single item array
      }
      
      let allergiesValue
      const allergiesStr = String(formData.allergies || '')
      if (!allergiesStr || allergiesStr.trim() === '') {
        allergiesValue = [] // Empty array
      } else {
        allergiesValue = [allergiesStr.trim()] // Single item array
      }
      
      const patientData = {
        ...formData,
        medical_history: medicalHistoryValue,
        allergies: allergiesValue
      }
      
      if (editingPatient) {
        await db.updatePatient(editingPatient.id, patientData)
      } else {
        await db.addPatient(patientData)
      }
      await loadPatients()
      closeModal()
    } catch (error) {
      console.error('Error saving patient:', error)
      alert('Failed to save patient: ' + error.message)
    }
  }

  const handleEdit = (patient) => {
    setEditingPatient(patient)
    
    // Convert array fields back to strings for the form
    const allergiesString = Array.isArray(patient.allergies) 
      ? patient.allergies.join(', ') 
      : (patient.allergies || '')
    
    const medicalHistoryString = Array.isArray(patient.medical_history)
      ? patient.medical_history.join(', ')
      : (patient.medical_history || '')
    
    setFormData({
      first_name: patient.first_name,
      last_name: patient.last_name,
      date_of_birth: patient.date_of_birth,
      gender: patient.gender,
      contact_number: patient.contact_number || '',
      email: patient.email || '',
      address: patient.address || '',
      blood_type: patient.blood_type || '',
      allergies: allergiesString,
      medical_history: medicalHistoryString,
      emergency_contact_name: patient.emergency_contact_name || '',
      emergency_contact_number: patient.emergency_contact_number || '',
      height: patient.height || '',
      weight: patient.weight || '',
      blood_pressure: patient.blood_pressure || '',
      temperature: patient.temperature || '',
      heart_rate: patient.heart_rate || '',
      respiratory_rate: patient.respiratory_rate || '',
      oxygen_saturation: patient.oxygen_saturation || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to deactivate this patient?')) {
      try {
        await db.deletePatient(id)
        await loadPatients()
      } catch (error) {
        console.error('Error deleting patient:', error)
        alert('Failed to delete patient')
      }
    }
  }

  const handleViewHistory = async (patient) => {
    setViewingPatient(patient)
    setShowHistoryModal(true)
    
    // Load all patient history data
    setLoadingConsultations(true)
    try {
      const [consultationsData, appointmentsData, paymentsData, admissionsData] = await Promise.all([
        db.getConsultations(patient.id),
        db.getAppointmentsByPatient(patient.id),
        db.getBillingByPatient(patient.id),
        db.getInpatientsByPatient(patient.id)
      ])
      console.log('Loaded consultations for patient:', patient.id, consultationsData)
      console.log('Loaded appointments for patient:', patient.id, appointmentsData)
      console.log('Loaded payments for patient:', patient.id, paymentsData)
      console.log('Loaded admissions for patient:', patient.id, admissionsData)
      setConsultations(consultationsData || [])
      setAppointments(appointmentsData || [])
      setPayments(paymentsData || [])
      setAdmissions(admissionsData || [])
    } catch (error) {
      console.error('Error loading patient history:', error)
      setConsultations([])
      setAppointments([])
      setPayments([])
      setAdmissions([])
    } finally {
      setLoadingConsultations(false)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingPatient(null)
    setFormData({
      first_name: '',
      last_name: '',
      date_of_birth: '',
      gender: '',
      contact_number: '',
      email: '',
      address: '',
      blood_type: '',
      allergies: '',
      medical_history: '',
      emergency_contact_name: '',
      emergency_contact_number: '',
      height: '',
      weight: '',
      blood_pressure: '',
      temperature: '',
      heart_rate: '',
      respiratory_rate: '',
      oxygen_saturation: ''
    })
  }



  const calculateAge = (dob) => {
    const today = new Date()
    const birthDate = new Date(dob)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <HeartbeatLoader message="Loading patients..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Patient Management</h1>
          <p className="text-sm text-slate-600 mt-1">Manage patient records and information</p>
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
            Add Patient
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, patient number, or contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Patient</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Patient #</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Age/Gender</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Contact</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Blood Type</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                        <User size={20} className="text-teal-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{patient.first_name} {patient.last_name}</p>
                        <p className="text-xs text-slate-500">{patient.email || 'No email'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-mono text-sm text-slate-700">{patient.patient_number}</span>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-sm text-slate-700">{calculateAge(patient.date_of_birth)} years</p>
                    <p className="text-xs text-slate-500">{patient.gender}</p>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-sm text-slate-700">{patient.contact_number || 'N/A'}</p>
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-semibold">
                      {patient.blood_type || 'Unknown'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewHistory(patient)}
                        className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                        title="View History"
                      >
                        <FileText size={18} />
                      </button>
                      <button
                        onClick={() => handleEdit(patient)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Patient"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(patient.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Deactivate Patient"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-slate-900">
                {editingPatient ? 'Edit Patient' : 'Add New Patient'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Personal Information</h3>
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
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Date of Birth *</label>
                      <input
                        type="date"
                        required
                        value={formData.date_of_birth}
                        onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Gender *</label>
                      <select
                        required
                        value={formData.gender}
                        onChange={(e) => setFormData({...formData, gender: e.target.value})}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Blood Type</label>
                      <select
                        value={formData.blood_type}
                        onChange={(e) => setFormData({...formData, blood_type: e.target.value})}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="">Select Blood Type</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Contact Information</h3>
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
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Address</label>
                      <textarea
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        rows="2"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Medical Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Allergies</label>
                      <textarea
                        value={formData.allergies}
                        onChange={(e) => setFormData({...formData, allergies: e.target.value})}
                        rows="2"
                        placeholder="List any known allergies..."
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Medical History</label>
                      <textarea
                        value={formData.medical_history}
                        onChange={(e) => setFormData({...formData, medical_history: e.target.value})}
                        rows="3"
                        placeholder="Previous conditions, surgeries, chronic illnesses..."
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Vital Signs */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Activity size={20} className="text-teal-600" />
                    Vital Signs
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Weight (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.weight}
                        onChange={(e) => setFormData({...formData, weight: e.target.value})}
                        placeholder="e.g., 65"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Blood Pressure (mmHg)</label>
                      <input
                        type="text"
                        value={formData.blood_pressure}
                        onChange={(e) => setFormData({...formData, blood_pressure: e.target.value})}
                        placeholder="e.g., 120/80"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Temperature (°C)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.temperature}
                        onChange={(e) => setFormData({...formData, temperature: e.target.value})}
                        placeholder="e.g., 36.5"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Heart Rate (bpm)</label>
                      <input
                        type="number"
                        value={formData.heart_rate}
                        onChange={(e) => setFormData({...formData, heart_rate: e.target.value})}
                        placeholder="e.g., 72"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Respiratory Rate (breaths/min)</label>
                      <input
                        type="number"
                        value={formData.respiratory_rate}
                        onChange={(e) => setFormData({...formData, respiratory_rate: e.target.value})}
                        placeholder="e.g., 16"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Oxygen Saturation (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.oxygen_saturation}
                        onChange={(e) => setFormData({...formData, oxygen_saturation: e.target.value})}
                        placeholder="e.g., 98"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Emergency Contact</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Contact Name</label>
                      <input
                        type="text"
                        value={formData.emergency_contact_name}
                        onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Contact Number</label>
                      <input
                        type="tel"
                        value={formData.emergency_contact_number}
                        onChange={(e) => setFormData({...formData, emergency_contact_number: e.target.value})}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors"
                >
                  {editingPatient ? 'Update Patient' : 'Add Patient'}
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

      {/* Patient History Modal */}
      {showHistoryModal && viewingPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                  <User size={24} className="text-teal-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {viewingPatient.first_name} {viewingPatient.last_name}
                  </h2>
                  <p className="text-sm text-slate-600">Patient #{viewingPatient.patient_number}</p>
                </div>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {/* Patient Info Summary */}
              <div className="bg-slate-50 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Patient Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Age</p>
                    <p className="font-semibold text-slate-900">{calculateAge(viewingPatient.date_of_birth)} years</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Gender</p>
                    <p className="font-semibold text-slate-900">{viewingPatient.gender}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Blood Type</p>
                    <p className="font-semibold text-slate-900">{viewingPatient.blood_type || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Contact</p>
                    <p className="font-semibold text-slate-900">{viewingPatient.contact_number || 'N/A'}</p>
                  </div>
                </div>
                {viewingPatient.allergies && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-xs text-slate-600 mb-1">Allergies</p>
                    <p className="text-sm text-red-600 font-semibold">{viewingPatient.allergies}</p>
                  </div>
                )}
              </div>

              {/* History Tabs */}
              <div className="space-y-6">
                {/* Appointments History */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar size={20} className="text-teal-600" />
                    <h3 className="text-lg font-bold text-slate-900">Appointment History</h3>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-6">
                    {loadingConsultations ? (
                      <div className="text-center py-8">
                        <HeartbeatLoader message="Loading appointments..." />
                      </div>
                    ) : appointments.length === 0 ? (
                      <p className="text-center text-sm text-slate-500 py-8">
                        No appointments recorded yet
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {appointments.map((appointment) => {
                          const appointmentDate = new Date(appointment.appointment_date)
                          const monthShort = appointmentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          const year = appointmentDate.getFullYear()
                          
                          return (
                            <div key={appointment.id} className="flex items-start gap-4 p-4 bg-white rounded-lg">
                              <div className="text-center min-w-[60px]">
                                <p className="text-xs text-slate-600">{monthShort}</p>
                                <p className="text-lg font-bold text-slate-900">{year}</p>
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-slate-900">{appointment.reason || 'Consultation'}</p>
                                <p className="text-sm text-slate-600">
                                  Dr. {appointment.doctor?.first_name} {appointment.doctor?.last_name}
                                  {appointment.doctor?.specialization && ` - ${appointment.doctor.specialization}`}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                  Time: {appointment.appointment_time} • Status: {appointment.status}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                        <p className="text-center text-sm text-slate-500 py-4">
                          Total Appointments: {appointments.length}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Consultations/Medical Records */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Activity size={20} className="text-blue-600" />
                    <h3 className="text-lg font-bold text-slate-900">Medical Records & Consultations</h3>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-6">
                    {loadingConsultations ? (
                      <div className="text-center py-8">
                        <HeartbeatLoader message="Loading consultations..." />
                      </div>
                    ) : consultations.length === 0 ? (
                      <p className="text-center text-sm text-slate-500 py-8">
                        No consultations recorded yet
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {consultations.map((consultation) => (
                          <div key={consultation.id} className="p-4 bg-white rounded-lg border border-slate-200">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="font-semibold text-slate-900">{consultation.chief_complaint || 'Consultation'}</p>
                                <p className="text-sm text-slate-600 mt-1">
                                  Dr. {consultation.doctor?.first_name} {consultation.doctor?.last_name}
                                </p>
                              </div>
                              <span className="text-xs text-slate-500">
                                {new Date(consultation.consultation_date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            
                            {/* SOAP Note Display */}
                            <div className="space-y-2 text-sm">
                              {consultation.chief_complaint && (
                                <div>
                                  <span className="font-semibold text-slate-700">S (Subjective):</span>
                                  <p className="text-slate-600 ml-4">{consultation.chief_complaint}</p>
                                </div>
                              )}
                              
                              {consultation.vital_signs && consultation.vital_signs.notes && (
                                <div>
                                  <span className="font-semibold text-slate-700">O (Objective):</span>
                                  <p className="text-slate-600 ml-4 whitespace-pre-wrap">{consultation.vital_signs.notes}</p>
                                </div>
                              )}
                              
                              {consultation.diagnosis && (
                                <div>
                                  <span className="font-semibold text-slate-700">A (Assessment):</span>
                                  <p className="text-slate-600 ml-4">{consultation.diagnosis}</p>
                                </div>
                              )}
                              
                              {consultation.prescription && (
                                <div>
                                  <span className="font-semibold text-slate-700">P (Plan):</span>
                                  <p className="text-slate-600 ml-4 whitespace-pre-wrap">{consultation.prescription}</p>
                                </div>
                              )}
                            </div>
                            
                            {/* Full Notes if available */}
                            {consultation.notes && (
                              <details className="mt-3">
                                <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-700">
                                  View Complete Notes
                                </summary>
                                <div className="mt-2 p-3 bg-slate-50 rounded text-xs text-slate-700 whitespace-pre-wrap">
                                  {consultation.notes}
                                </div>
                              </details>
                            )}
                          </div>
                        ))}
                        <p className="text-center text-sm text-slate-500 py-4 border-t border-slate-200">
                          Total Consultations: {consultations.length}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment History */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign size={20} className="text-green-600" />
                    <h3 className="text-lg font-bold text-slate-900">Payment History</h3>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-6">
                    {loadingConsultations ? (
                      <div className="text-center py-8">
                        <HeartbeatLoader message="Loading payments..." />
                      </div>
                    ) : payments.length === 0 ? (
                      <div className="text-center py-8">
                        <DollarSign size={48} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-slate-500">No payment history</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {payments.map((payment) => {
                          const paymentDate = new Date(payment.created_at)
                          const formattedDate = paymentDate.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })
                          
                          return (
                            <div key={payment.id} className="flex items-center justify-between p-4 bg-white rounded-lg">
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {payment.invoice_number || 'Payment'}
                                </p>
                                <p className="text-xs text-slate-500">{formattedDate}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-slate-900">
                                  ₱{parseFloat(payment.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  payment.payment_status === 'Paid' 
                                    ? 'bg-green-100 text-green-700' 
                                    : payment.payment_status === 'Partial'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {payment.payment_status}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                        <div className="pt-3 border-t border-slate-200">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-slate-900">Total Paid</p>
                            <p className="text-xl font-bold text-green-600">
                              ₱{payments
                                .filter(p => p.payment_status === 'Paid')
                                .reduce((sum, p) => sum + parseFloat(p.total_amount || 0), 0)
                                .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Admission History */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Bed size={20} className="text-purple-600" />
                    <h3 className="text-lg font-bold text-slate-900">Admission History</h3>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-6">
                    {loadingConsultations ? (
                      <div className="text-center py-8">
                        <HeartbeatLoader message="Loading admissions..." />
                      </div>
                    ) : admissions.length === 0 ? (
                      <div className="text-center py-8">
                        <Bed size={48} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-slate-500">No admission history</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {admissions.map((admission) => {
                          const admissionDate = new Date(admission.admission_date)
                          const dischargeDate = admission.discharge_date ? new Date(admission.discharge_date) : null
                          const isActive = !admission.discharge_date
                          
                          return (
                            <div key={admission.id} className="p-4 bg-white rounded-lg border-l-4 border-purple-500">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="font-semibold text-slate-900">
                                    Room {admission.room?.room_number} - {admission.room?.room_type}
                                  </p>
                                  <p className="text-sm text-slate-600">
                                    Dr. {admission.doctor?.first_name} {admission.doctor?.last_name}
                                  </p>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  isActive 
                                    ? 'bg-purple-100 text-purple-700' 
                                    : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {isActive ? 'Active' : 'Discharged'}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 space-y-1">
                                <p>
                                  <strong>Admitted:</strong> {admissionDate.toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric' 
                                  })}
                                </p>
                                {dischargeDate && (
                                  <p>
                                    <strong>Discharged:</strong> {dischargeDate.toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric', 
                                      year: 'numeric' 
                                    })}
                                  </p>
                                )}
                                {admission.diagnosis && (
                                  <p>
                                    <strong>Diagnosis:</strong> {admission.diagnosis}
                                  </p>
                                )}
                              </div>
                            </div>
                          )
                        })}
                        <p className="text-center text-sm text-slate-500 py-4">
                          Total Admissions: {admissions.length}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      <PatientImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => {
          loadPatients();
          setShowImportModal(false);
        }}
      />
    </div>
  )
}

export default Patients
