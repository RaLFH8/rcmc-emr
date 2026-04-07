import { useEffect, useState, useRef } from 'react'
import { Plus, Search, Edit2, Trash2, X, User, Calendar, FileText, Activity, DollarSign, Bed, Download, ClipboardList, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { db } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useRealtime } from '../context/RealtimeContext'
import SkeletonLoader from '../components/SkeletonLoader'
import MedicalHistoryTimeline from '../components/MedicalHistoryTimeline'
import { useToast } from '../components/Toast'
import VitalSignsForm from '../components/VitalSignsForm'
import VitalSignsBadge from '../components/VitalSignsBadge'

const PAGE_SIZE = 20

const Patients = () => {
  const { userProfile } = useAuth()
  const { lastUpdate } = useRealtime()
  const toast = useToast()
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [genderFilter, setGenderFilter] = useState('')
  const [bloodTypeFilter, setBloodTypeFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [viewingPatient, setViewingPatient] = useState(null)
  const [editingPatient, setEditingPatient] = useState(null)
  const [activeHistoryTab, setActiveHistoryTab] = useState('appointments')
  const [consultations, setConsultations] = useState([])
  const [appointments, setAppointments] = useState([])
  const [payments, setPayments] = useState([])
  const [admissions, setAdmissions] = useState([])
  const [orders, setOrders] = useState([])
  const [loadingConsultations, setLoadingConsultations] = useState(false)

  // Vitals tab state
  const [patientVitals, setPatientVitals] = useState([])
  const [vitalsLoading, setVitalsLoading] = useState(false)
  const [showVitalsForm, setShowVitalsForm] = useState(false)
  const tabScrollRef = useRef(null)
  const [editingVitals, setEditingVitals] = useState(null)
  const [patientAppointmentsForVitals, setPatientAppointmentsForVitals] = useState([])

  // Consultation form state
  const [showConsultationForm, setShowConsultationForm] = useState(false)

  // Initial vitals state for new patient registration
  const emptyInitialVitals = { blood_pressure: '', heart_rate: '', temperature: '', respiratory_rate: '', oxygen_saturation: '', weight: '', notes: '' }
  const [initialVitals, setInitialVitals] = useState(emptyInitialVitals)
  const [editingConsultation, setEditingConsultation] = useState(null)
  const [doctors, setDoctors] = useState([])
  const [consultationFormData, setConsultationFormData] = useState({
    consultation_date: '',
    doctor_id: '',
    chief_complaint: '',
    objective: '',
    diagnosis: '',
    prescription: '',
    notes: '',
  })
  const [savingConsultation, setSavingConsultation] = useState(false)
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
    height: '',
    weight: '',
    philhealth_number: '',
  })

  // Reset page when filters/search change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, genderFilter, bloodTypeFilter])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPatients()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, genderFilter, bloodTypeFilter, currentPage])

  // React to real-time updates for orders when viewing patient history
  useEffect(() => {
    if (lastUpdate.doctor_orders && viewingPatient && showHistoryModal) {
      // Reload orders for the current patient
      db.getOrdersByPatient(viewingPatient.id)
        .then(ordersData => setOrders(ordersData || []))
        .catch(error => {
          console.error('Error reloading orders:', error)
        })
    }
  }, [lastUpdate.doctor_orders, viewingPatient, showHistoryModal])

  const loadPatients = async () => {
    try {
      setLoading(true)
      const offset = (currentPage - 1) * PAGE_SIZE
      const { data, count } = await db.getPatients(PAGE_SIZE, offset, searchTerm, genderFilter, bloodTypeFilter)
      setPatients(data)
      setTotalCount(count)
    } catch (error) {
      console.error('Error loading patients:', error)
      toast.error('Failed to load patients')
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = async () => {
    try {
      const data = await db.getPatientsForExport(searchTerm, genderFilter, bloodTypeFilter)
      const headers = ['Patient Number', 'First Name', 'Last Name', 'Date of Birth', 'Gender', 'Blood Type', 'Contact Number', 'Email', 'Address', 'PhilHealth Number', 'Status']
      const rows = data.map(p => [
        p.patient_number || '',
        p.first_name || '',
        p.last_name || '',
        p.date_of_birth || '',
        p.gender || '',
        p.blood_type || '',
        p.contact_number || '',
        p.email || '',
        `"${(p.address || '').replace(/"/g, '""')}"`,
        p.philhealth_number || '',
        p.status || '',
      ])
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
      const today = new Date().toISOString().split('T')[0]
      const filename = `patients-export-${today}.csv`
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting patients:', error)
      toast.error('Failed to export patients')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      let medicalHistoryValue
      const medicalHistoryStr = String(formData.medical_history || '')
      if (!medicalHistoryStr || medicalHistoryStr.trim() === '') {
        medicalHistoryValue = []
      } else {
        medicalHistoryValue = [medicalHistoryStr.trim()]
      }

      let allergiesValue
      const allergiesStr = String(formData.allergies || '')
      if (!allergiesStr || allergiesStr.trim() === '') {
        allergiesValue = []
      } else {
        allergiesValue = [allergiesStr.trim()]
      }

      const patientData = {
        ...formData,
        medical_history: medicalHistoryValue,
        allergies: allergiesValue,
      }

      if (editingPatient) {
        await db.updatePatient(editingPatient.id, patientData)
        toast.success('Patient updated successfully')
      } else {
        const newPatient = await db.addPatient(patientData)
        toast.success('Patient added successfully')
        // Save initial vitals if any were entered
        const hasVitals = Object.entries(initialVitals).some(([k, v]) => k !== 'notes' && v !== '')
        if (hasVitals && newPatient?.id) {
          try {
            const parseBP = (str) => {
              const m = str?.trim().match(/^(\d+)\s*\/\s*(\d+)$/)
              return m ? { systolic: parseInt(m[1]), diastolic: parseInt(m[2]) } : null
            }
            const bp = parseBP(initialVitals.blood_pressure)
            const vitalsRecord = {
              patient_id: newPatient.id,
              appointment_id: null,
              recorded_at: new Date().toISOString(),
              blood_pressure_systolic: bp?.systolic ?? null,
              blood_pressure_diastolic: bp?.diastolic ?? null,
              heart_rate: initialVitals.heart_rate ? parseFloat(initialVitals.heart_rate) : null,
              temperature: initialVitals.temperature ? parseFloat(initialVitals.temperature) : null,
              respiratory_rate: initialVitals.respiratory_rate ? parseFloat(initialVitals.respiratory_rate) : null,
              oxygen_saturation: initialVitals.oxygen_saturation ? parseFloat(initialVitals.oxygen_saturation) : null,
              weight: initialVitals.weight ? parseFloat(initialVitals.weight) : null,
              notes: initialVitals.notes || null,
            }
            await db.upsertVitals(vitalsRecord)
          } catch (vErr) {
            console.error('Error saving initial vitals:', vErr)
            // Non-blocking — patient was saved successfully
          }
        }
      }
      await loadPatients()
      closeModal()
    } catch (error) {
      console.error('Error saving patient:', error)
      toast.error('Failed to save patient: ' + error.message)
    }
  }

  const handleEdit = (patient) => {
    setEditingPatient(patient)
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
      philhealth_number: patient.philhealth_number || '',
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
        toast.error('Failed to delete patient')
      }
    }
  }

  const handleViewHistory = async (patient) => {
    setViewingPatient(patient)
    setActiveHistoryTab('timeline')
    setShowHistoryModal(true)
    setLoadingConsultations(true)
    try {
      const [consultationsData, appointmentsData, paymentsData, admissionsData, ordersData, doctorsData] = await Promise.all([
        db.getConsultations(patient.id).catch(err => { console.error('Error loading consultations:', err); return [] }),
        db.getAppointmentsByPatient(patient.id).catch(err => { console.error('Error loading appointments:', err); return [] }),
        db.getBillingByPatient(patient.id).catch(err => { console.error('Error loading payments:', err); return [] }),
        db.getInpatientsByPatient(patient.id).catch(err => { console.error('Error loading admissions:', err); return [] }),
        db.getOrdersByPatient(patient.id).catch(err => { console.error('Error loading orders:', err); return [] }),
        db.getDoctors().catch(() => []),
      ])
      setConsultations(consultationsData)
      setAppointments(appointmentsData)
      setPayments(paymentsData)
      setAdmissions(admissionsData)
      setOrders(ordersData)
      setDoctors(doctorsData)
    } finally {
      setLoadingConsultations(false)
    }
  }

  const loadPatientVitals = async (patientId) => {
    setVitalsLoading(true)
    try {
      const data = await db.getVitalsByPatient(patientId)
      setPatientVitals(data || [])
    } catch (err) {
      console.error('Error loading vitals:', err)
      toast.error('Failed to load vitals')
    } finally {
      setVitalsLoading(false)
    }
  }

  const handleVitalsTabActivate = async (patient) => {
    await loadPatientVitals(patient.id)
  }

  const handleAddVitals = async () => {
    try {
      const apts = await db.getAppointmentsByPatient(viewingPatient.id)
      setPatientAppointmentsForVitals(apts || [])
    } catch (err) {
      console.error('Error loading appointments for vitals:', err)
      setPatientAppointmentsForVitals([])
    }
    setEditingVitals(null)
    setShowVitalsForm(true)
  }

  const handleEditVitals = async (vitalsRecord) => {
    try {
      const apts = await db.getAppointmentsByPatient(viewingPatient.id)
      setPatientAppointmentsForVitals(apts || [])
    } catch (err) {
      setPatientAppointmentsForVitals([])
    }
    setEditingVitals(vitalsRecord)
    setShowVitalsForm(true)
  }

  const handleDeleteVitals = async (id) => {
    if (!window.confirm('Delete this vitals record? This cannot be undone.')) return
    try {
      await db.deleteVitals(id)
      await loadPatientVitals(viewingPatient.id)
    } catch (err) {
      console.error('Error deleting vitals:', err)
      toast.error('Failed to delete vitals record')
    }
  }

  const toLocalDatetimeValue = (date) => {
    const d = date ? new Date(date) : new Date()
    const pad = n => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const handleOpenConsultationForm = (consultation = null) => {
    if (consultation) {
      setEditingConsultation(consultation)
      setConsultationFormData({
        consultation_date: toLocalDatetimeValue(consultation.consultation_date),
        doctor_id: consultation.doctor_id || '',
        chief_complaint: consultation.chief_complaint || '',
        objective: consultation.vital_signs?.notes || '',
        diagnosis: consultation.diagnosis || '',
        prescription: consultation.prescription || '',
        notes: consultation.notes || '',
      })
    } else {
      setEditingConsultation(null)
      setConsultationFormData({
        consultation_date: toLocalDatetimeValue(),
        doctor_id: '',
        chief_complaint: '',
        objective: '',
        diagnosis: '',
        prescription: '',
        notes: '',
      })
    }
    setShowConsultationForm(true)
  }

  const handleSaveConsultation = async (e) => {
    e.preventDefault()
    if (!viewingPatient) return
    setSavingConsultation(true)
    try {
      const record = {
        patient_id: viewingPatient.id,
        doctor_id: consultationFormData.doctor_id || null,
        consultation_date: new Date(consultationFormData.consultation_date).toISOString(),
        chief_complaint: consultationFormData.chief_complaint || null,
        vital_signs: consultationFormData.objective ? { notes: consultationFormData.objective } : {},
        diagnosis: consultationFormData.diagnosis || null,
        prescription: consultationFormData.prescription || null,
        notes: consultationFormData.notes || null,
        status: 'completed',
      }
      if (editingConsultation) {
        await db.updateConsultation(editingConsultation.id, record)
        toast.success('Consultation updated')
      } else {
        await db.addConsultation(record)
        toast.success('Consultation added')
      }
      const updated = await db.getConsultations(viewingPatient.id)
      setConsultations(updated)
      setShowConsultationForm(false)
    } catch (err) {
      console.error('Error saving consultation:', err)
      toast.error('Failed to save consultation: ' + err.message)
    } finally {
      setSavingConsultation(false)
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
      philhealth_number: '',
    })
    setInitialVitals(emptyInitialVitals)
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

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SkeletonLoader variant="table" message="Loading patients..." />
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
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download size={18} />
            Export CSV
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors shadow-sm"
          >
            <Plus size={20} />
            Add Patient
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, patient number, or contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          >
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          <select
            value={bloodTypeFilter}
            onChange={(e) => setBloodTypeFilter(e.target.value)}
            className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          >
            <option value="">All Blood Types</option>
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
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Last Visit</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
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
                    <p className="text-sm text-slate-700">
                      {patient.last_visit
                        ? new Date(patient.last_visit).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'No visits'}
                    </p>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      patient.status === 'Active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {patient.status || 'Active'}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              Page {currentPage} of {totalPages} &nbsp;·&nbsp; {totalCount} patients
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => p - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Registration Modal */}
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
                {/* 1. Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">First Name *</label>
                      <input type="text" required value={formData.first_name}
                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name *</label>
                      <input type="text" required value={formData.last_name}
                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Date of Birth *</label>
                      <input type="date" required value={formData.date_of_birth}
                        onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Gender *</label>
                      <select required value={formData.gender}
                        onChange={(e) => setFormData({...formData, gender: e.target.value})}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500">
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Blood Type</label>
                      <select value={formData.blood_type}
                        onChange={(e) => setFormData({...formData, blood_type: e.target.value})}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500">
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

                {/* 2. Initial Vital Signs (new patients only) */}
                {!editingPatient && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">Initial Vital Signs <span className="text-sm font-normal text-slate-400">(optional)</span></h3>
                    <p className="text-xs text-slate-500 mb-4">Saved as baseline vitals and shown in the SOAP note Objective section.</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Blood Pressure (mmHg)</label>
                        <input type="text" value={initialVitals.blood_pressure}
                          onChange={e => setInitialVitals(p => ({ ...p, blood_pressure: e.target.value }))}
                          placeholder="e.g. 120/80"
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Heart Rate (bpm)</label>
                        <input type="number" value={initialVitals.heart_rate}
                          onChange={e => setInitialVitals(p => ({ ...p, heart_rate: e.target.value }))}
                          placeholder="30–250"
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Temperature (°C)</label>
                        <input type="number" step="0.1" value={initialVitals.temperature}
                          onChange={e => setInitialVitals(p => ({ ...p, temperature: e.target.value }))}
                          placeholder="34–42"
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Resp. Rate (/min)</label>
                        <input type="number" value={initialVitals.respiratory_rate}
                          onChange={e => setInitialVitals(p => ({ ...p, respiratory_rate: e.target.value }))}
                          placeholder="8–40"
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">O₂ Saturation (%)</label>
                        <input type="number" value={initialVitals.oxygen_saturation}
                          onChange={e => setInitialVitals(p => ({ ...p, oxygen_saturation: e.target.value }))}
                          placeholder="70–100"
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Weight (kg)</label>
                        <input type="number" step="0.1" value={initialVitals.weight}
                          onChange={e => setInitialVitals(p => ({ ...p, weight: e.target.value }))}
                          placeholder="1–300"
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Notes</label>
                        <textarea value={initialVitals.notes}
                          onChange={e => setInitialVitals(p => ({ ...p, notes: e.target.value }))}
                          rows={2} placeholder="Additional observations..."
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Medical Information */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Medical Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Allergies</label>
                      <textarea value={formData.allergies}
                        onChange={(e) => setFormData({...formData, allergies: e.target.value})}
                        rows="2" placeholder="List any known allergies..."
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Medical History</label>
                      <textarea value={formData.medical_history}
                        onChange={(e) => setFormData({...formData, medical_history: e.target.value})}
                        rows="3" placeholder="Previous conditions, surgeries, chronic illnesses..."
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                  </div>
                </div>

                {/* 4. Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Contact Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Contact Number</label>
                      <input type="tel" value={formData.contact_number}
                        onChange={(e) => setFormData({...formData, contact_number: e.target.value})}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                      <input type="email" value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">PhilHealth Number</label>
                      <input type="text" value={formData.philhealth_number}
                        onChange={(e) => setFormData({...formData, philhealth_number: e.target.value})}
                        placeholder="e.g., 12-345678901-2"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Address</label>
                      <textarea value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        rows="2"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                  </div>
                </div>

                {/* 5. Emergency Contact */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Emergency Contact</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Contact Name</label>
                      <input type="text" value={formData.emergency_contact_name}
                        onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Contact Number</label>
                      <input type="tel" value={formData.emergency_contact_number}
                        onChange={(e) => setFormData({...formData, emergency_contact_number: e.target.value})}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button type="submit"
                  className="flex-1 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors">
                  {editingPatient ? 'Update Patient' : 'Add Patient'}
                </button>
                <button type="button" onClick={closeModal}
                  className="px-8 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patient History Modal — Tabbed */}
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
                    <p className="font-semibold text-slate-900">
                      {Array.isArray(viewingPatient.allergies) ? viewingPatient.allergies.join(', ') : viewingPatient.allergies}
                    </p>
                  </div>
                )}
              </div>

              {/* Tab Bar */}
              <div className="flex items-center gap-1 mb-6 border-b border-slate-200">
                <button
                  onClick={() => tabScrollRef.current?.scrollBy({ left: -160, behavior: 'smooth' })}
                  className="flex-shrink-0 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <div ref={tabScrollRef} className="flex gap-1 overflow-x-auto scrollbar-hide flex-1">
                  {[
                    { key: 'timeline', label: 'Timeline', count: appointments.length + consultations.length + orders.length + payments.length + admissions.length, icon: Clock },
                    { key: 'appointments', label: 'Appointments', count: appointments.length, icon: Calendar },
                    { key: 'consultations', label: 'Consultations', count: consultations.length, icon: Activity },
                    { key: 'orders', label: 'Orders', count: orders.length, icon: ClipboardList },
                    { key: 'payments', label: 'Payments', count: payments.length, icon: DollarSign },
                    { key: 'admissions', label: 'Admissions', count: admissions.length, icon: Bed },
                    { key: 'vitals', label: 'Vital Signs', count: patientVitals.length, icon: Activity },
                  ].map(({ key, label, count, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => {
                        setActiveHistoryTab(key)
                        if (key === 'vitals' && viewingPatient) {
                          handleVitalsTabActivate(viewingPatient)
                        }
                      }}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                        activeHistoryTab === key
                          ? 'border-teal-500 text-teal-600'
                          : 'border-transparent text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <Icon size={16} />
                      {label}
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        activeHistoryTab === key ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {count}
                      </span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => tabScrollRef.current?.scrollBy({ left: 160, behavior: 'smooth' })}
                  className="flex-shrink-0 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Tab Content */}
              {loadingConsultations ? (
                <div className="py-8">
                  <SkeletonLoader variant="list" rows={3} message="Loading history..." />
                </div>
              ) : (
                <>
                  {/* Timeline Tab */}
                  {activeHistoryTab === 'timeline' && (
                    <MedicalHistoryTimeline 
                      patientId={viewingPatient.id} 
                      className="bg-slate-50 rounded-xl p-6"
                      preloadedData={{ consultations, appointments, orders, payments, admissions }}
                    />
                  )}

                  {/* Appointments Tab */}
                  {activeHistoryTab === 'appointments' && (
                    <div className="bg-slate-50 rounded-xl p-6">
                      {appointments.length === 0 ? (
                        <p className="text-center text-sm text-slate-500 py-8">No appointments recorded yet</p>
                      ) : (
                        <div className="space-y-3">
                          {appointments.map((appointment) => {
                            const appointmentDate = new Date(appointment.appointment_date)
                            return (
                              <div key={appointment.id} className="flex items-start gap-4 p-4 bg-white rounded-lg">
                                <div className="text-center min-w-[60px]">
                                  <p className="text-xs text-slate-600">
                                    {appointmentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </p>
                                  <p className="text-lg font-bold text-slate-900">{appointmentDate.getFullYear()}</p>
                                </div>
                                <div className="flex-1">
                                  <p className="font-semibold text-slate-900">{appointment.reason || 'Consultation'}</p>
                                  <p className="text-sm text-slate-600">
                                    Dr. {appointment.doctor?.first_name} {appointment.doctor?.last_name}
                                    {appointment.doctor?.specialization && ` - ${appointment.doctor.specialization}`}
                                  </p>
                                  <p className="text-xs text-slate-500 mt-1">
                                    Time: {appointment.appointment_time} · Status: {appointment.status}
                                  </p>
                                </div>
                              </div>
                            )
                          })}
                          <p className="text-center text-sm text-slate-500 py-4">Total: {appointments.length}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Consultations Tab */}
                  {activeHistoryTab === 'consultations' && (
                    <div className="bg-slate-50 rounded-xl p-6">
                      <div className="flex justify-end mb-4">
                        <button
                          onClick={() => handleOpenConsultationForm()}
                          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors"
                        >
                          <Plus size={16} /> Add Consultation
                        </button>
                      </div>
                      {consultations.length === 0 ? (
                        <p className="text-center text-sm text-slate-500 py-8">No consultations recorded yet</p>
                      ) : (
                        <div className="space-y-3">
                          {/* Vital Signs Trend */}
                          {(() => {
                            const vitalsData = consultations
                              .filter(c => c.vital_signs?.blood_pressure || c.vital_signs?.weight || c.vital_signs?.temperature)
                              .slice(0, 6)
                              .reverse()
                            return (
                              <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4">
                                <h4 className="text-sm font-semibold text-slate-700 mb-3">Vital Signs Trend</h4>
                                {vitalsData.length === 0 ? (
                                  <p className="text-xs text-slate-400 py-1">No vital signs recorded in consultations yet</p>
                                ) : (
                                  <>
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-xs">
                                        <thead>
                                          <tr className="text-slate-500 border-b border-slate-100">
                                            <th className="text-left py-1 pr-3 font-medium">Date</th>
                                            <th className="text-left py-1 pr-3 font-medium">BP</th>
                                            <th className="text-left py-1 pr-3 font-medium">Temp (°C)</th>
                                            <th className="text-left py-1 pr-3 font-medium">Weight (kg)</th>
                                            <th className="text-left py-1 font-medium">Pulse</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {vitalsData.map((c, i) => (
                                            <tr key={c.id} className={`border-b border-slate-50 ${i === vitalsData.length - 1 ? 'font-semibold text-teal-700' : 'text-slate-600'}`}>
                                              <td className="py-1.5 pr-3">{new Date(c.consultation_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                                              <td className="py-1.5 pr-3">{c.vital_signs?.blood_pressure || '—'}</td>
                                              <td className="py-1.5 pr-3">{c.vital_signs?.temperature || '—'}</td>
                                              <td className="py-1.5 pr-3">{c.vital_signs?.weight || '—'}</td>
                                              <td className="py-1.5">{c.vital_signs?.pulse_rate || c.vital_signs?.heart_rate || '—'}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                    <p className="text-xs text-teal-600 mt-2 font-medium">↑ Most recent visit highlighted</p>
                                  </>
                                )}
                              </div>
                            )
                          })()}
                          {consultations.map((consultation) => (
                            <div key={consultation.id} className="p-4 bg-white rounded-lg border border-slate-200">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <p className="font-semibold text-slate-900">{consultation.chief_complaint || 'Consultation'}</p>
                                  <p className="text-sm text-slate-600 mt-1">
                                    Dr. {consultation.doctor?.first_name} {consultation.doctor?.last_name}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-500">
                                    {new Date(consultation.consultation_date).toLocaleDateString('en-US', {
                                      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}
                                  </span>
                                  <button
                                    onClick={() => handleOpenConsultationForm(consultation)}
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="Edit"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                </div>
                              </div>
                              <div className="space-y-2 text-sm">
                                {consultation.chief_complaint && (
                                  <div>
                                    <span className="font-semibold text-slate-700">S (Subjective):</span>
                                    <p className="text-slate-600 ml-4">{consultation.chief_complaint}</p>
                                  </div>
                                )}
                                {consultation.vital_signs?.notes && (
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
                              {consultation.notes && (
                                <details className="mt-3">
                                  <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-700">View Complete Notes</summary>
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
                  )}

                  {/* Orders Tab */}
                  {activeHistoryTab === 'orders' && (
                    <div className="bg-slate-50 rounded-xl p-6">
                      {orders.length === 0 ? (
                        <div className="text-center py-8">
                          <ClipboardList size={48} className="mx-auto text-slate-300 mb-2" />
                          <p className="text-slate-500">No orders recorded yet</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Group orders by status */}
                          {['pending', 'in_progress', 'completed', 'cancelled'].map(status => {
                            const statusOrders = orders.filter(order => order.status === status)
                            if (statusOrders.length === 0) return null
                            
                            const statusColors = {
                              pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
                              in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
                              completed: 'bg-green-100 text-green-700 border-green-200',
                              cancelled: 'bg-red-100 text-red-700 border-red-200'
                            }

                            const orderTypeLabels = {
                              medication: 'Medication',
                              lab_test: 'Lab Test',
                              procedure: 'Procedure',
                              diet: 'Diet',
                              activity_restriction: 'Activity Restriction'
                            }

                            const orderTypeColors = {
                              medication: 'bg-blue-50 text-blue-700 border-blue-200',
                              lab_test: 'bg-purple-50 text-purple-700 border-purple-200',
                              procedure: 'bg-orange-50 text-orange-700 border-orange-200',
                              diet: 'bg-green-50 text-green-700 border-green-200',
                              activity_restriction: 'bg-red-50 text-red-700 border-red-200'
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

                            return (
                              <div key={status} className="mb-6">
                                <h4 className={`text-sm font-bold uppercase tracking-wide mb-3 px-3 py-1 rounded-lg inline-block border ${statusColors[status]}`}>
                                  {status.replace('_', ' ')} ({statusOrders.length})
                                </h4>
                                <div className="space-y-3">
                                  {statusOrders.map((order) => (
                                    <div key={order.id} className="p-4 bg-white rounded-lg border border-slate-200">
                                      <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                          <span className={`px-2 py-1 rounded text-xs font-semibold border ${orderTypeColors[order.order_type]}`}>
                                            {orderTypeLabels[order.order_type] || order.order_type}
                                          </span>
                                          <span className={`px-2 py-1 rounded text-xs font-bold ${priorityColors[order.priority]}`}>
                                            {priorityLabels[order.priority] || order.priority}
                                          </span>
                                        </div>
                                        <span className="text-xs text-slate-500">
                                          {new Date(order.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                          })}
                                        </span>
                                      </div>
                                      <div className="space-y-2">
                                        <div>
                                          <p className="text-sm font-semibold text-slate-900 mb-1">Order Details:</p>
                                          <p className="text-sm text-slate-700 bg-slate-50 rounded p-2">{order.order_details}</p>
                                        </div>
                                        {order.notes && (
                                          <div>
                                            <p className="text-sm font-semibold text-slate-900 mb-1">Notes:</p>
                                            <p className="text-sm text-slate-700 bg-slate-50 rounded p-2">{order.notes}</p>
                                          </div>
                                        )}
                                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                          <div className="text-xs text-slate-500">
                                            <span className="font-semibold">Created by:</span> Dr. {order.created_by_user?.full_name || `${order.created_by_user?.first_name || ''} ${order.created_by_user?.last_name || ''}`.trim() || 'Unknown'}
                                          </div>
                                          {order.appointment_id && (
                                            <div className="text-xs text-teal-600 font-semibold">
                                              📋 From SOAP Note
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          })}
                          <div className="pt-3 border-t border-slate-200 text-center">
                            <p className="text-sm text-slate-500">Total Orders: {orders.length}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Payments Tab */}
                  {activeHistoryTab === 'payments' && (
                    <div className="bg-slate-50 rounded-xl p-6">
                      {payments.length === 0 ? (
                        <div className="text-center py-8">
                          <DollarSign size={48} className="mx-auto text-slate-300 mb-2" />
                          <p className="text-slate-500">No payment history</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {payments.map((payment) => (
                            <div key={payment.id} className="flex items-center justify-between p-4 bg-white rounded-lg">
                              <div>
                                <p className="font-semibold text-slate-900">{payment.invoice_number || 'Payment'}</p>
                                <p className="text-xs text-slate-500">
                                  {new Date(payment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-slate-900">
                                  ₱{parseFloat(payment.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  payment.payment_status === 'Paid' ? 'bg-green-100 text-green-700'
                                  : payment.payment_status === 'Partial' ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                                }`}>
                                  {payment.payment_status}
                                </span>
                              </div>
                            </div>
                          ))}
                          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                            <p className="font-semibold text-slate-900">Total Paid</p>
                            <p className="text-xl font-bold text-green-600">
                              ₱{payments.filter(p => p.payment_status === 'Paid')
                                .reduce((sum, p) => sum + parseFloat(p.total_amount || 0), 0)
                                .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Admissions Tab */}
                  {activeHistoryTab === 'admissions' && (
                    <div className="bg-slate-50 rounded-xl p-6">
                      {admissions.length === 0 ? (
                        <div className="text-center py-8">
                          <Bed size={48} className="mx-auto text-slate-300 mb-2" />
                          <p className="text-slate-500">No admission history</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {admissions.map((admission) => {
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
                                  <span className={`text-xs px-2 py-1 rounded-full ${isActive ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}`}>
                                    {isActive ? 'Active' : 'Discharged'}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-500 space-y-1">
                                  <p><strong>Admitted:</strong> {new Date(admission.admission_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                  {admission.discharge_date && (
                                    <p><strong>Discharged:</strong> {new Date(admission.discharge_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                  )}
                                  {admission.diagnosis && <p><strong>Diagnosis:</strong> {admission.diagnosis}</p>}
                                </div>
                              </div>
                            )
                          })}
                          <p className="text-center text-sm text-slate-500 py-4">Total Admissions: {admissions.length}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Vital Signs Tab */}
                  {activeHistoryTab === 'vitals' && (
                    <div className="bg-slate-50 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Vital Signs History</h4>
                        <button
                          onClick={handleAddVitals}
                          className="flex items-center gap-1 px-3 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors"
                        >
                          <Plus size={14} /> Add Vitals
                        </button>
                      </div>
                      {vitalsLoading ? (
                        <div className="py-8 flex items-center justify-center gap-2 text-slate-500 text-sm">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-teal-500 border-t-transparent"></div>
                          Loading vitals…
                        </div>
                      ) : patientVitals.length === 0 ? (
                        <div className="text-center py-8">
                          <Activity size={48} className="mx-auto text-slate-300 mb-2" />
                          <p className="text-slate-500">No vitals recorded yet</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-xs text-slate-500 border-b border-slate-200">
                                <th className="text-left py-2 pr-3 font-semibold">Date/Time</th>
                                <th className="text-left py-2 pr-3 font-semibold">BP</th>
                                <th className="text-left py-2 pr-3 font-semibold">HR</th>
                                <th className="text-left py-2 pr-3 font-semibold">Temp</th>
                                <th className="text-left py-2 pr-3 font-semibold">RR</th>
                                <th className="text-left py-2 pr-3 font-semibold">O₂ Sat</th>
                                <th className="text-left py-2 pr-3 font-semibold">Weight</th>
                                <th className="text-left py-2 pr-3 font-semibold">Notes</th>
                                <th className="text-left py-2 pr-3 font-semibold">Recorded By</th>
                                <th className="text-left py-2 font-semibold">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {patientVitals.map((v) => (
                                <tr key={v.id} className="border-b border-slate-100 hover:bg-white transition-colors">
                                  <td className="py-2 pr-3 text-xs text-slate-600 whitespace-nowrap">
                                    {new Date(v.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}<br />
                                    <span className="text-slate-400">{new Date(v.recorded_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                                  </td>
                                  <td className="py-2 pr-3">
                                    {v.blood_pressure_systolic && v.blood_pressure_diastolic
                                      ? <><VitalSignsBadge field="blood_pressure_systolic" value={v.blood_pressure_systolic} /><span className="text-slate-400">/</span><VitalSignsBadge field="blood_pressure_diastolic" value={v.blood_pressure_diastolic} /></>
                                      : <span className="text-slate-400">—</span>}
                                  </td>
                                  <td className="py-2 pr-3"><VitalSignsBadge field="heart_rate" value={v.heart_rate} unit="bpm" /></td>
                                  <td className="py-2 pr-3"><VitalSignsBadge field="temperature" value={v.temperature} unit="°C" /></td>
                                  <td className="py-2 pr-3"><VitalSignsBadge field="respiratory_rate" value={v.respiratory_rate} unit="/min" /></td>
                                  <td className="py-2 pr-3"><VitalSignsBadge field="oxygen_saturation" value={v.oxygen_saturation} unit="%" /></td>
                                  <td className="py-2 pr-3"><VitalSignsBadge field="weight" value={v.weight} unit="kg" /></td>
                                  <td className="py-2 pr-3 text-xs text-slate-600 max-w-[120px] truncate">{v.notes || '—'}</td>
                                  <td className="py-2 pr-3 text-xs text-slate-600">{v.recorded_by ? v.recorded_by.slice(0, 8) + '…' : '—'}</td>
                                  <td className="py-2">
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => handleEditVitals(v)}
                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                        title="Edit"
                                      >
                                        <Edit2 size={14} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteVitals(v.id)}
                                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                        title="Delete"
                                      >
                                        <Trash2 size={14} />
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
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Vitals Form Modal */}
      {showVitalsForm && viewingPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{editingVitals ? 'Edit Vital Signs' : 'Add Vital Signs'}</h2>
                <p className="text-sm text-slate-600 mt-1">{viewingPatient.first_name} {viewingPatient.last_name}</p>
              </div>
              <button onClick={() => setShowVitalsForm(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <VitalSignsForm
                patientId={viewingPatient.id}
                appointmentId={editingVitals?.appointment_id || null}
                patientAppointments={patientAppointmentsForVitals}
                initialValues={editingVitals || {}}
                mode="patients"
                onSuccess={async () => {
                  setShowVitalsForm(false)
                  setEditingVitals(null)
                  await loadPatientVitals(viewingPatient.id)
                }}
                onCancel={() => {
                  setShowVitalsForm(false)
                  setEditingVitals(null)
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Consultation Form Modal */}
      {showConsultationForm && viewingPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{editingConsultation ? 'Edit Consultation' : 'Add Consultation'}</h2>
                <p className="text-sm text-slate-600 mt-1">{viewingPatient.first_name} {viewingPatient.last_name}</p>
              </div>
              <button onClick={() => setShowConsultationForm(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveConsultation} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Date &amp; Time <span className="text-red-500">*</span></label>
                  <input
                    type="datetime-local"
                    required
                    value={consultationFormData.consultation_date}
                    onChange={e => setConsultationFormData(p => ({ ...p, consultation_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Doctor</label>
                  <select
                    value={consultationFormData.doctor_id}
                    onChange={e => setConsultationFormData(p => ({ ...p, doctor_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">— Select doctor —</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>Dr. {d.first_name} {d.last_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">S — Chief Complaint / Subjective</label>
                <textarea
                  rows={2}
                  value={consultationFormData.chief_complaint}
                  onChange={e => setConsultationFormData(p => ({ ...p, chief_complaint: e.target.value }))}
                  placeholder="Patient's chief complaint and history..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">O — Objective / Examination Findings</label>
                <textarea
                  rows={2}
                  value={consultationFormData.objective}
                  onChange={e => setConsultationFormData(p => ({ ...p, objective: e.target.value }))}
                  placeholder="Physical examination findings, vitals..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">A — Assessment / Diagnosis</label>
                <textarea
                  rows={2}
                  value={consultationFormData.diagnosis}
                  onChange={e => setConsultationFormData(p => ({ ...p, diagnosis: e.target.value }))}
                  placeholder="Diagnosis or clinical impression..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">P — Plan / Treatment</label>
                <textarea
                  rows={2}
                  value={consultationFormData.prescription}
                  onChange={e => setConsultationFormData(p => ({ ...p, prescription: e.target.value }))}
                  placeholder="Treatment plan, medications, follow-up..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Additional Notes</label>
                <textarea
                  rows={2}
                  value={consultationFormData.notes}
                  onChange={e => setConsultationFormData(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Any additional notes..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConsultationForm(false)}
                  className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingConsultation}
                  className="px-4 py-2 text-sm font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50"
                >
                  {savingConsultation ? 'Saving…' : (editingConsultation ? 'Update' : 'Save Consultation')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default Patients
