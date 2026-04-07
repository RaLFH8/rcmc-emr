import { useEffect, useState, useMemo } from 'react'
import { Plus, User, X, CheckCircle, PlayCircle, FileText, History, Globe, UserPlus, Activity } from 'lucide-react'
import { db } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import SkeletonLoader from '../components/SkeletonLoader'
import { sendAppointmentNotifications } from '../utils/appointmentNotifications'
import { exportToCSV, copyToClipboard } from '../utils/exportService'
import CalendarView from '../components/CalendarView'
import FilterBar from '../components/FilterBar'
import OrderReviewPanel from '../components/OrderReviewPanel'
import MedicalHistoryTimeline from '../components/MedicalHistoryTimeline'
import { parseOrders } from '../utils/orderParser'
import VitalSignsForm from '../components/VitalSignsForm'
import VitalSignsBadge from '../components/VitalSignsBadge'

// Format a Date to local YYYY-MM-DD (timezone-safe)
const toLocalDateStr = (d) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const Appointments = () => {
  const { userProfile } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedDate, setSelectedDate] = useState(toLocalDateStr(new Date()))
  const [viewMode, setViewMode] = useState('calendar') // 'calendar' or 'queue'
  const [selectedWeek, setSelectedWeek] = useState(new Date())
  const [selectedDoctor, setSelectedDoctor] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    appointment_date: toLocalDateStr(new Date()),
    appointment_time: '',
    reason: '',
    status: 'Scheduled',
    notes: ''
  })
  const [isNewPatient, setIsNewPatient] = useState(false)
  const [newPatientData, setNewPatientData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    contact_number: '',
    email: '',
    address: ''
  })
  const [showSoapModal, setShowSoapModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showMedicalHistoryModal, setShowMedicalHistoryModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [patientConsultations, setPatientConsultations] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [soapData, setSoapData] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: ''
  })
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [detailsAppointment, setDetailsAppointment] = useState(null)
  const [error, setError] = useState(null)
  const [extractedOrders, setExtractedOrders] = useState([])
  const [patientSearch, setPatientSearch] = useState('')
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)
  const [confirmedOrders, setConfirmedOrders] = useState([])
  const [showOrderReview, setShowOrderReview] = useState(false)

  // Vitals state
  const [vitalsMap, setVitalsMap] = useState({}) // appointmentId -> vitals record or null
  const [vitalsModalApt, setVitalsModalApt] = useState(null)
  const [soapVitals, setSoapVitals] = useState(null)
  const [soapVitalsLoading, setSoapVitalsLoading] = useState(false)

  // Initialize view mode once when userProfile loads — don't reset on date changes
  useEffect(() => {
    if (userProfile) {
      if (userProfile.role === 'doctor') {
        setViewMode('queue')
      } else {
        setViewMode('calendar')
      }
    }
  }, [userProfile])

  useEffect(() => {
    loadData()
  }, [selectedDate, selectedWeek, userProfile])

  // After doctors are loaded, resolve the logged-in doctor's record ID
  useEffect(() => {
    if (userProfile?.role === 'doctor' && userProfile?.id && doctors.length > 0) {
      const doctorRecord = doctors.find(d => d.user_id === userProfile.id)
      if (doctorRecord) {
        setSelectedDoctor(doctorRecord.id.toString())
      }
    }
  }, [doctors, userProfile])

  // Separate effect for view mode changes - don't refetch data
  useEffect(() => {
    // View mode change doesn't trigger data refetch
    // Data is already loaded and filtered client-side
  }, [viewMode])

  // Update current time every minute for time slot highlighting
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute
    
    return () => clearInterval(interval)
  }, [])

  // Utility: Get Monday of the week for a given date
  const getWeekStart = (date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day // Adjust to Monday
    d.setDate(d.getDate() + diff)
    d.setHours(0, 0, 0, 0)
    return d
  }

  // Utility: Get week days (Monday through Saturday)
  const getWeekDays = (startDate) => {
    const days = []
    const start = new Date(startDate)
    for (let i = 0; i < 6; i++) {
      const day = new Date(start)
      day.setDate(start.getDate() + i)
      days.push(day)
    }
    return days
  }

  // Week navigation handlers
  const handleWeekChange = (newWeek) => {
    setSelectedWeek(newWeek)
  }

  const handleTodayClick = () => {
    setSelectedWeek(new Date())
  }

  const handleExport = async () => {
    try {
      // Get week range for filename
      const weekStart = getWeekStart(selectedWeek)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 5) // Saturday
      
      // Export filtered appointments
      const result = await exportToCSV(filteredAppointments, weekStart, weekEnd)
      
      if (result.success) {
        alert(`Exported ${filteredAppointments.length} appointments to ${result.filename}`)
      }
    } catch (error) {
      console.error('Export failed:', error)
      
      // Try clipboard copy as fallback
      try {
        await copyToClipboard(filteredAppointments)
        alert('Export failed, but data was copied to clipboard. You can paste it into a spreadsheet.')
      } catch (clipboardError) {
        alert('Export failed: ' + error.message)
      }
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Always fetch all appointments — client-side filtering handles date/mode scoping.
      // This avoids stale-closure issues where viewMode may not reflect the latest state
      // when loadData is called from a useEffect.
      const allAppointments = await db.getAppointments()
      
      // Fetch patients and doctors in parallel
      const [patientsData, doctorsData] = await Promise.all([
        db.getPatients(1000),
        db.getDoctors()
      ])
      
      setAppointments(allAppointments)
      setPatients(patientsData.data || [])
      setDoctors(doctorsData)

      // Batch-fetch vitals for all loaded appointments
      const ids = allAppointments.map(a => a.id).filter(Boolean)
      if (ids.length > 0) {
        try {
          const map = await db.getVitalsByAppointmentIds(ids)
          const obj = {}
          map.forEach((v, k) => { obj[k] = v })
          setVitalsMap(obj)
        } catch (err) {
          console.error('Error fetching vitals map:', err)
          setVitalsMap({})
        }
      } else {
        setVitalsMap({})
      }
    } catch (error) {
      console.error('Error loading data:', error)
      setError('Failed to load appointments. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return

    // For existing patients we can do optimistic UI immediately.
    // For new patients we must create the patient record first (needs a real ID),
    // so we still await that before closing the modal.
    const tempId = `temp-${Date.now()}`

    try {
      setSubmitting(true)
      let patientId = formData.patient_id
      let patientRecord = isNewPatient ? newPatientData : patients.find(p => p.id === patientId)

      // New patient: must persist first to get a real patient ID
      if (isNewPatient) {
        const patientDataWithDefaults = {
          ...newPatientData,
          emergency_contact_name: newPatientData.emergency_contact_name || 'To be updated',
          emergency_contact_number: newPatientData.emergency_contact_number || newPatientData.contact_number
        }
        const newPatient = await db.addPatient(patientDataWithDefaults)
        patientId = newPatient.id
        patientRecord = newPatient
      }

      // Build optimistic appointment record for instant UI feedback
      const doctor = doctors.find(d => d.id === formData.doctor_id)
      const optimisticAppointment = {
        id: tempId,
        ...formData,
        patient_id: patientId,
        booking_source: 'walk-in',
        status: 'Scheduled',
        patient: patientRecord,
        doctor: doctor || null,
        _optimistic: true
      }

      // Add to UI immediately and close modal — feels instant
      setAppointments(prev => [optimisticAppointment, ...prev])
      closeModal()

      // Persist to DB in background
      const savedAppointment = await db.addAppointment({
        ...formData,
        patient_id: patientId,
        booking_source: 'walk-in'
      })

      // Replace temp record with real one from DB
      setAppointments(prev =>
        prev.map(apt => apt.id === tempId ? { ...savedAppointment, patient: patientRecord, doctor: doctor || null } : apt)
      )

      // SMS notification — non-blocking
      if (patientRecord && (patientRecord.contact_number || patientRecord.phone)) {
        const notificationData = {
          first_name: patientRecord.first_name,
          last_name: patientRecord.last_name,
          mobile_number: patientRecord.contact_number || patientRecord.phone,
          phone: patientRecord.contact_number || patientRecord.phone,
          appointment_date: formData.appointment_date,
          appointment_time: formData.appointment_time,
          reason: formData.reason,
          doctor: doctor
        }
        sendAppointmentNotifications(notificationData, 'walk-in').catch(err =>
          console.warn('SMS notification failed (non-critical):', err)
        )
      }
    } catch (error) {
      console.error('Error saving appointment:', error)
      // Roll back optimistic record on failure
      setAppointments(prev => prev.filter(apt => apt.id !== tempId))
      alert('Failed to save appointment: ' + error.message)
    } finally {
      setSubmitting(false)
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
    setIsNewPatient(false)
    setPatientSearch('')
    setShowPatientDropdown(false)
    setFormData({
      patient_id: '',
      doctor_id: '',
      appointment_date: toLocalDateStr(new Date()),
      appointment_time: '',
      reason: '',
      status: 'Scheduled',
      notes: ''
    })
    setNewPatientData({
      first_name: '',
      last_name: '',
      date_of_birth: '',
      gender: '',
      contact_number: '',
      email: '',
      address: ''
    })
  }

  const handleStartConsultation = async (apt) => {
    setSelectedAppointment(apt)
    
    // Load existing SOAP data from database if present, otherwise use appointment reason
    setSoapData({
      subjective: apt.soap_subjective || apt.reason || '',
      objective: apt.soap_objective || '',
      assessment: apt.soap_assessment || '',
      plan: apt.soap_plan || ''
    })
    setShowSoapModal(true)

    // Fetch vitals for the SOAP objective section
    setSoapVitals(null)
    setSoapVitalsLoading(true)
    try {
      let vitals = await db.getVitalsByAppointment(apt.id)
      if (!vitals && apt.patient_id) {
        const prior = await db.getVitalsByPatient(apt.patient_id)
        vitals = prior && prior.length > 0 ? { ...prior[0], _isPrior: true } : null
      }
      setSoapVitals(vitals)
    } catch (err) {
      console.error('Error fetching vitals for SOAP:', err)
      setSoapVitals(null)
    } finally {
      setSoapVitalsLoading(false)
    }
  }

  const handleViewMedicalHistory = async () => {
    if (!selectedAppointment?.patient_id) return
    
    try {
      setLoadingHistory(true)
      const consultations = await db.getConsultations(selectedAppointment.patient_id)
      setPatientConsultations(consultations)
      setShowMedicalHistoryModal(true)
    } catch (error) {
      console.error('Error loading medical history:', error)
      alert('Failed to load medical history')
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleSaveSoap = async () => {
    if (!selectedAppointment) return
    
    try {
      const alreadyInProgress = selectedAppointment.status === 'In Progress'
      // Update appointment status to In Progress AND persist SOAP data to database
      await db.updateAppointment(selectedAppointment.id, { 
        status: 'In Progress',
        soap_subjective: soapData.subjective,
        soap_objective: soapData.objective,
        soap_assessment: soapData.assessment,
        soap_plan: soapData.plan
      })
      
      // Reload data
      await loadData()
      
      // Close SOAP modal (but keep soapData in state!)
      setShowSoapModal(false)
      
      alert(alreadyInProgress ? 'SOAP note updated.' : 'SOAP note saved. Patient moved to In Progress.')
    } catch (error) {
      console.error('Error saving SOAP note:', error)
      alert('Failed to save SOAP note: ' + error.message)
    }
  }

  const handleCompleteConsultation = async () => {
    if (!selectedAppointment) return
    
    try {
      // Fetch latest appointment data from database to get SOAP notes
      const latestAppointment = await db.getAppointmentById(selectedAppointment.id)
      
      // Use database values if state is empty (handles re-render case)
      const finalSoapData = {
        subjective: soapData.subjective || latestAppointment.soap_subjective || '',
        objective: soapData.objective || latestAppointment.soap_objective || '',
        assessment: soapData.assessment || latestAppointment.soap_assessment || '',
        plan: soapData.plan || latestAppointment.soap_plan || ''
      }
      
      // Validate required fields
      if (!finalSoapData.assessment || !finalSoapData.assessment.trim()) {
        alert('Assessment (Diagnosis) is required to complete consultation')
        return
      }

      // Parse orders from treatment plan
      const parsedOrders = parseOrders(finalSoapData.plan)

      // If plan has content, always show order review panel
      // If parser found structured orders, use those; otherwise create one order from the full plan text
      if (finalSoapData.plan && finalSoapData.plan.trim()) {
        const ordersToReview = parsedOrders.length > 0
          ? parsedOrders
          : [{
              type: 'procedure',
              details: finalSoapData.plan.trim(),
              priority: 'routine',
              confidence: 1,
              sourceText: finalSoapData.plan.trim()
            }]
        setExtractedOrders(ordersToReview)
        setConfirmedOrders(ordersToReview)
        setShowOrderReview(true)
        return // Wait for order confirmation
      }

      // No plan text, proceed with completion without orders
      await completeConsultationWithOrders([])
    } catch (error) {
      console.error('Error completing consultation:', error)
      alert('Failed to complete consultation: ' + error.message)
    }
  }

  const completeConsultationWithOrders = async (orders) => {
    if (!selectedAppointment) return

    try {
      // Fetch latest appointment data
      const latestAppointment = await db.getAppointmentById(selectedAppointment.id)
      
      const finalSoapData = {
        subjective: soapData.subjective || latestAppointment.soap_subjective || '',
        objective: soapData.objective || latestAppointment.soap_objective || '',
        assessment: soapData.assessment || latestAppointment.soap_assessment || '',
        plan: soapData.plan || latestAppointment.soap_plan || ''
      }
      
      // Create consultation record with SOAP format and pending_billing status
      const consultationRecord = {
        patient_id: selectedAppointment.patient_id,
        doctor_id: selectedAppointment.doctor_id,
        appointment_id: selectedAppointment.id,
        chief_complaint: finalSoapData.subjective || '',
        vital_signs: finalSoapData.objective ? { notes: finalSoapData.objective } : {},
        diagnosis: finalSoapData.assessment || '',
        prescription: finalSoapData.plan || '',
        notes: `SOAP Note:\nS: ${finalSoapData.subjective || 'Not recorded'}\nO: ${finalSoapData.objective || 'Not recorded'}\nA: ${finalSoapData.assessment || 'Not recorded'}\nP: ${finalSoapData.plan || 'Not recorded'}`,
        consultation_date: new Date().toISOString(),
        status: 'pending_billing',
        completed_at: new Date().toISOString(),
        completed_by: userProfile.id
      }
      
      // Create consultation record
      await db.addConsultation(consultationRecord)

      // Create orders if any were confirmed
      if (orders.length > 0) {
        const orderRecords = orders.map(order => ({
          appointment_id: selectedAppointment.id,
          patient_id: selectedAppointment.patient_id,
          order_type: order.type,
          order_details: order.details,
          status: 'pending',
          priority: order.priority,
          created_by: userProfile.id
        }))

        await db.createOrders(orderRecords)
      }
      
      // Update appointment status to completed AND clear SOAP fields from appointments table
      await db.updateAppointment(selectedAppointment.id, { 
        status: 'Completed',
        soap_subjective: null,
        soap_objective: null,
        soap_assessment: null,
        soap_plan: null
      })
      
      // Reload data
      await loadData()
      
      // Close modals and reset
      setShowReviewModal(false)
      setShowOrderReview(false)
      setSelectedAppointment(null)
      setSoapData({
        subjective: '',
        objective: '',
        assessment: '',
        plan: ''
      })
      setExtractedOrders([])
      setConfirmedOrders([])
      
      alert(`Consultation completed${orders.length > 0 ? ` with ${orders.length} order(s)` : ''} and sent to billing queue!`)
    } catch (error) {
      console.error('Error completing consultation:', error)
      alert('Failed to complete consultation: ' + error.message)
    }
  }

  const handleOrdersConfirmed = () => {
    completeConsultationWithOrders(confirmedOrders)
  }

  const handleOrderEdit = (index, updatedOrder) => {
    const newOrders = [...confirmedOrders]
    newOrders[index] = updatedOrder
    setConfirmedOrders(newOrders)
  }

  const handleOrderRemove = (index) => {
    const newOrders = confirmedOrders.filter((_, i) => i !== index)
    setConfirmedOrders(newOrders)
  }

  const handleOrderAdd = (newOrder) => {
    setConfirmedOrders([...confirmedOrders, newOrder])
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

  const renderBookingSourceBadge = (bookingSource) => {
    if (bookingSource === 'online') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-semibold" title="Online Booking">
          <Globe size={12} />
          Online
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-semibold" title="Walk-in">
          <UserPlus size={12} />
          Walk-in
        </span>
      )
    }
  }

  // Filter appointments based on selected doctor, status, and week (memoized)
  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const doctorMatch = selectedDoctor === 'all' || apt.doctor_id?.toString() === selectedDoctor
      const statusMatch = statusFilter === 'all' || apt.status === statusFilter

      // In calendar mode, also filter to the selected week (Mon–Sat)
      if (viewMode === 'calendar') {
        const weekStart = getWeekStart(selectedWeek)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 5)
        const startStr = toLocalDateStr(weekStart)
        const endStr = toLocalDateStr(weekEnd)
        const aptDate = String(apt.appointment_date || '').slice(0, 10)
        const weekMatch = aptDate >= startStr && aptDate <= endStr
        return doctorMatch && statusMatch && weekMatch
      }

      // In queue mode, filter to the selected date
      if (viewMode === 'queue') {
        const aptDate = String(apt.appointment_date || '').slice(0, 10)
        return doctorMatch && statusMatch && aptDate === selectedDate
      }

      return doctorMatch && statusMatch
    })
  }, [appointments, selectedDoctor, statusFilter, viewMode, selectedWeek, selectedDate])

  // Queue view - group by status (memoized)
  const queueAppointments = useMemo(() => ({
    waiting: filteredAppointments.filter(apt => apt.status === 'Scheduled' || apt.status === 'Confirmed'),
    inProgress: filteredAppointments.filter(apt => apt.status === 'In Progress'),
    completed: filteredAppointments.filter(apt => apt.status === 'Completed')
  }), [filteredAppointments])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SkeletonLoader variant="table" rows={5} message="Loading appointments..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Error Loading Appointments</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={loadData}
            className="px-6 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors"
          >
            Retry
          </button>
        </div>
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
      <FilterBar 
        viewMode={viewMode}
        selectedWeek={selectedWeek}
        selectedDate={selectedDate}
        selectedDoctor={selectedDoctor}
        statusFilter={statusFilter}
        doctors={doctors}
        appointmentCount={filteredAppointments.length}
        onViewModeChange={setViewMode}
        onWeekChange={handleWeekChange}
        onTodayClick={handleTodayClick}
        onDoctorChange={setSelectedDoctor}
        onStatusChange={setStatusFilter}
        onDateChange={setSelectedDate}
        onExport={handleExport}
      />

      {/* Calendar View or Queue View */}
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
                      {renderBookingSourceBadge(apt.booking_source || 'walk-in')}
                    </div>
                    <p className="text-xs text-slate-600 mb-3">{apt.reason}</p>
                    {/* Record Vitals button */}
                    {(userProfile?.role === 'admin' || userProfile?.role === 'doctor' || userProfile?.role === 'receptionist') && (
                      <div className="mb-2">
                        {vitalsMap[apt.id] ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-semibold">
                            <CheckCircle size={12} /> Vitals Recorded
                          </span>
                        ) : (
                          <button
                            onClick={() => setVitalsModalApt(apt)}
                            className="px-3 py-1 text-xs font-semibold border border-teal-500 text-teal-600 rounded-md hover:bg-teal-50 transition-colors"
                          >
                            <Activity size={12} className="inline mr-1" />
                            Record Vitals
                          </button>
                        )}
                      </div>
                    )}
                    {(userProfile?.role === 'doctor' || userProfile?.role === 'admin') && (
                    <button
                      onClick={() => handleStartConsultation(apt)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-semibold"
                    >
                      <PlayCircle size={16} />
                      Start Consultation
                    </button>
                    )}
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
                      {renderBookingSourceBadge(apt.booking_source || 'walk-in')}
                    </div>
                    <p className="text-xs text-slate-600 mb-3">{apt.reason}</p>
                    <div className="flex gap-2 mb-2">
                      <button
                        onClick={async () => {
                          const latestApt = await db.getAppointmentById(apt.id)
                          setSelectedAppointment(latestApt)
                          setSoapData({
                            subjective: latestApt.soap_subjective || latestApt.reason || '',
                            objective: latestApt.soap_objective || '',
                            assessment: latestApt.soap_assessment || '',
                            plan: latestApt.soap_plan || ''
                          })
                          setShowSoapModal(true)
                          // Fetch vitals for SOAP
                          setSoapVitals(null)
                          setSoapVitalsLoading(true)
                          try {
                            let vitals = await db.getVitalsByAppointment(latestApt.id)
                            if (!vitals && latestApt.patient_id) {
                              const prior = await db.getVitalsByPatient(latestApt.patient_id)
                              vitals = prior && prior.length > 0 ? { ...prior[0], _isPrior: true } : null
                            }
                            setSoapVitals(vitals)
                          } catch (err) {
                            console.error('Error fetching vitals for SOAP:', err)
                            setSoapVitals(null)
                          } finally {
                            setSoapVitalsLoading(false)
                          }
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-semibold"
                      >
                        <FileText size={16} />
                        Edit SOAP
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          // Store patient ID in sessionStorage for Prescriptions page to read
                          sessionStorage.setItem('selectedPatientId', apt.patient_id)
                          // Navigate to prescriptions page
                          const event = new CustomEvent('navigateTo', { detail: 'prescriptions' })
                          window.dispatchEvent(event)
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors text-sm font-semibold"
                      >
                        <FileText size={16} />
                        Prescribe
                      </button>
                      <button
                        onClick={async () => {
                          // Fetch latest appointment data with SOAP fields
                          const latestApt = await db.getAppointmentById(apt.id)
                          setSelectedAppointment(latestApt)
                          
                          // Load SOAP data from database
                          setSoapData({
                            subjective: latestApt.soap_subjective || '',
                            objective: latestApt.soap_objective || '',
                            assessment: latestApt.soap_assessment || '',
                            plan: latestApt.soap_plan || ''
                          })
                          
                          setShowReviewModal(true)
                        }}
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
                      {renderBookingSourceBadge(apt.booking_source || 'walk-in')}
                    </div>
                    <p className="text-xs text-slate-600">{apt.reason}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Calendar View */
        <CalendarView 
          appointments={filteredAppointments}
          selectedWeek={selectedWeek}
          onAppointmentClick={(apt) => {
            setDetailsAppointment(apt)
            setShowDetailsModal(true)
          }}
          currentTime={currentTime}
          hasFilters={selectedDoctor !== 'all' || statusFilter !== 'all'}
        />
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
                {/* Patient Selection Toggle */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-slate-700">Patient Information</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsNewPatient(!isNewPatient)
                        setFormData({...formData, patient_id: ''})
                      }}
                      className="px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-semibold hover:bg-teal-600 transition-colors"
                    >
                      {isNewPatient ? '← Select Existing Patient' : '+ Add New Patient'}
                    </button>
                  </div>

                  {!isNewPatient ? (
                    /* Select Existing Patient */
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Select Patient *</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search by name or patient number..."
                          value={patientSearch}
                          onChange={(e) => {
                            setPatientSearch(e.target.value)
                            setShowPatientDropdown(true)
                            if (!e.target.value) setFormData({...formData, patient_id: ''})
                          }}
                          onFocus={() => setShowPatientDropdown(true)}
                          onBlur={() => setTimeout(() => setShowPatientDropdown(false), 150)}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                        {showPatientDropdown && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                            {patients
                              .filter(p => {
                                const q = patientSearch.toLowerCase()
                                return !q ||
                                  `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
                                  (p.patient_number || '').toLowerCase().includes(q)
                              })
                              .map(patient => (
                                <div
                                  key={patient.id}
                                  onMouseDown={() => {
                                    setFormData({...formData, patient_id: patient.id})
                                    setPatientSearch(`${patient.first_name} ${patient.last_name} - ${patient.patient_number}`)
                                    setShowPatientDropdown(false)
                                  }}
                                  className="px-4 py-2 cursor-pointer hover:bg-teal-50 text-sm text-slate-700"
                                >
                                  {patient.first_name} {patient.last_name}
                                  <span className="text-slate-400 ml-2 text-xs">{patient.patient_number}</span>
                                </div>
                              ))
                            }
                            {patients.filter(p => {
                              const q = patientSearch.toLowerCase()
                              return !q ||
                                `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
                                (p.patient_number || '').toLowerCase().includes(q)
                            }).length === 0 && (
                              <div className="px-4 py-3 text-sm text-slate-400">No patients found</div>
                            )}
                          </div>
                        )}
                      </div>
                      {/* hidden required validation helper */}
                      <input type="text" required readOnly value={formData.patient_id} className="sr-only" tabIndex={-1} />
                    </div>
                  ) : (
                    /* Add New Patient Form */
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                          <input
                            type="text"
                            required
                            value={newPatientData.first_name}
                            onChange={(e) => setNewPatientData({...newPatientData, first_name: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
                          <input
                            type="text"
                            required
                            value={newPatientData.last_name}
                            onChange={(e) => setNewPatientData({...newPatientData, last_name: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth *</label>
                          <input
                            type="date"
                            required
                            value={newPatientData.date_of_birth}
                            onChange={(e) => setNewPatientData({...newPatientData, date_of_birth: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Gender *</label>
                          <select
                            required
                            value={newPatientData.gender}
                            onChange={(e) => setNewPatientData({...newPatientData, gender: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                          >
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Number *</label>
                          <input
                            type="tel"
                            required
                            value={newPatientData.contact_number}
                            onChange={(e) => setNewPatientData({...newPatientData, contact_number: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                          <input
                            type="email"
                            value={newPatientData.email}
                            onChange={(e) => setNewPatientData({...newPatientData, email: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Address *</label>
                        <input
                          type="text"
                          required
                          value={newPatientData.address}
                          onChange={(e) => setNewPatientData({...newPatientData, address: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                        />
                      </div>
                    </div>
                  )}
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
                  disabled={submitting}
                  className="flex-1 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none"
                >
                  {submitting ? 'Scheduling...' : 'Schedule Appointment'}
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

      {/* SOAP Note Modal */}
      {showSoapModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">SOAP Note</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Patient: {selectedAppointment.patient?.first_name} {selectedAppointment.patient?.last_name} ({selectedAppointment.patient?.patient_number})
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleViewMedicalHistory}
                  disabled={loadingHistory}
                  className="p-2 hover:bg-teal-50 rounded-lg transition-colors group relative"
                  title="View Medical History"
                >
                  <History size={24} className="text-teal-600" />
                  {loadingHistory && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-teal-600 border-t-transparent"></div>
                    </div>
                  )}
                </button>
                <button 
                  onClick={() => {
                    setShowSoapModal(false)
                    setSelectedAppointment(null)
                  }} 
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* S - Subjective */}
              <div>
                <label className="block text-lg font-bold text-slate-900 mb-2">
                  S - SUBJECTIVE (Chief Complaint)
                </label>
                <textarea
                  value={soapData.subjective}
                  onChange={(e) => setSoapData({...soapData, subjective: e.target.value})}
                  rows="3"
                  placeholder="Patient's description of symptoms, concerns, and reason for visit..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* O - Objective */}
              <div>
                <label className="block text-lg font-bold text-slate-900 mb-2">
                  O - OBJECTIVE (Physical Findings & Vital Signs)
                </label>
                {/* Structured vitals panel */}
                <div className="mb-3">
                  {soapVitalsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-teal-500 border-t-transparent"></div>
                      Loading vitals…
                    </div>
                  ) : soapVitals && !soapVitals._isPrior ? (
                    <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-2">
                      <p className="text-xs font-semibold text-teal-700 mb-3 flex items-center gap-1">
                        <Activity size={14} /> Vitals recorded for this visit
                      </p>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div><span className="text-slate-500 text-xs">BP</span><br /><VitalSignsBadge field="blood_pressure_systolic" value={soapVitals.blood_pressure_systolic} /><span className="text-slate-400">/</span><VitalSignsBadge field="blood_pressure_diastolic" value={soapVitals.blood_pressure_diastolic} unit="mmHg" /></div>
                        <div><span className="text-slate-500 text-xs">HR</span><br /><VitalSignsBadge field="heart_rate" value={soapVitals.heart_rate} unit="bpm" /></div>
                        <div><span className="text-slate-500 text-xs">Temp</span><br /><VitalSignsBadge field="temperature" value={soapVitals.temperature} unit="°C" /></div>
                        <div><span className="text-slate-500 text-xs">RR</span><br /><VitalSignsBadge field="respiratory_rate" value={soapVitals.respiratory_rate} unit="/min" /></div>
                        <div><span className="text-slate-500 text-xs">O₂ Sat</span><br /><VitalSignsBadge field="oxygen_saturation" value={soapVitals.oxygen_saturation} unit="%" /></div>
                        <div><span className="text-slate-500 text-xs">Weight</span><br /><VitalSignsBadge field="weight" value={soapVitals.weight} unit="kg" /></div>
                      </div>
                    </div>
                  ) : soapVitals && soapVitals._isPrior ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-2">
                      <p className="text-xs font-semibold text-amber-700 mb-3">
                        Reference: vitals from {new Date(soapVitals.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} (prior visit)
                      </p>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div><span className="text-slate-500 text-xs">BP</span><br /><VitalSignsBadge field="blood_pressure_systolic" value={soapVitals.blood_pressure_systolic} /><span className="text-slate-400">/</span><VitalSignsBadge field="blood_pressure_diastolic" value={soapVitals.blood_pressure_diastolic} unit="mmHg" /></div>
                        <div><span className="text-slate-500 text-xs">HR</span><br /><VitalSignsBadge field="heart_rate" value={soapVitals.heart_rate} unit="bpm" /></div>
                        <div><span className="text-slate-500 text-xs">Temp</span><br /><VitalSignsBadge field="temperature" value={soapVitals.temperature} unit="°C" /></div>
                        <div><span className="text-slate-500 text-xs">RR</span><br /><VitalSignsBadge field="respiratory_rate" value={soapVitals.respiratory_rate} unit="/min" /></div>
                        <div><span className="text-slate-500 text-xs">O₂ Sat</span><br /><VitalSignsBadge field="oxygen_saturation" value={soapVitals.oxygen_saturation} unit="%" /></div>
                        <div><span className="text-slate-500 text-xs">Weight</span><br /><VitalSignsBadge field="weight" value={soapVitals.weight} unit="kg" /></div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 mb-2">No vitals on file for this patient</p>
                  )}
                </div>
                <textarea
                  value={soapData.objective}
                  onChange={(e) => setSoapData({...soapData, objective: e.target.value})}
                  rows="4"
                  placeholder="Additional physical examination findings, lab results..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* A - Assessment */}
              <div>
                <label className="block text-lg font-bold text-slate-900 mb-2">
                  A - ASSESSMENT (Diagnosis)
                </label>
                <textarea
                  value={soapData.assessment}
                  onChange={(e) => setSoapData({...soapData, assessment: e.target.value})}
                  rows="3"
                  placeholder="Clinical diagnosis, differential diagnosis, assessment of condition..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* P - Plan */}
              <div>
                <label className="block text-lg font-bold text-slate-900 mb-2">
                  P - PLAN (Treatment & Follow-up)
                </label>
                <textarea
                  value={soapData.plan}
                  onChange={(e) => setSoapData({...soapData, plan: e.target.value})}
                  rows="4"
                  placeholder="Treatment plan, medications, follow-up instructions, patient education..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Doctor Info */}
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                <p className="text-sm text-teal-900">
                  <span className="font-semibold">Doctor:</span> Dr. {selectedAppointment.doctor?.first_name} {selectedAppointment.doctor?.last_name}
                </p>
                <p className="text-sm text-teal-900 mt-1">
                  <span className="font-semibold">Date:</span> {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSaveSoap}
                  className="flex-1 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors"
                >
                  Save & Continue
                </button>
                <button
                  onClick={() => {
                    // Store patient ID for Prescriptions page
                    sessionStorage.setItem('selectedPatientId', selectedAppointment.patient_id)
                    // Navigate to prescriptions page
                    const event = new CustomEvent('navigateTo', { detail: 'prescriptions' })
                    window.dispatchEvent(event)
                  }}
                  className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors"
                >
                  Prescribe
                </button>
                <button
                  onClick={() => {
                    setShowSoapModal(false)
                    setSelectedAppointment(null)
                  }}
                  className="px-8 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review & Complete Modal */}
      {showReviewModal && selectedAppointment && !showOrderReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Review & Complete Consultation</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Patient: {selectedAppointment.patient?.first_name} {selectedAppointment.patient?.last_name} ({selectedAppointment.patient?.patient_number})
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowReviewModal(false)
                  setSelectedAppointment(null)
                }} 
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Consultation Summary */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">CONSULTATION SUMMARY</h3>
                
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Chief Complaint (Subjective):</p>
                    <p className="text-sm text-slate-900 mt-1">{soapData.subjective || 'Not recorded'}</p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-700">Physical Findings (Objective):</p>
                    <p className="text-sm text-slate-900 mt-1 whitespace-pre-wrap">{soapData.objective || 'Not recorded'}</p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-700">Diagnosis (Assessment):</p>
                    <p className="text-sm text-slate-900 mt-1">{soapData.assessment || 'Not recorded'}</p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-700">Treatment Plan:</p>
                    <p className="text-sm text-slate-900 mt-1 whitespace-pre-wrap">{soapData.plan || 'Not recorded'}</p>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
                <p className="text-sm font-semibold text-yellow-900">⚠️ This will create a permanent medical record</p>
                <p className="text-xs text-yellow-800 mt-1">
                  Doctor: Dr. {selectedAppointment.doctor?.first_name} {selectedAppointment.doctor?.last_name}
                </p>
                <p className="text-xs text-yellow-800">
                  Date: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCompleteConsultation}
                  className="flex-1 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors"
                >
                  Complete & Save to Medical History
                </button>
                <button
                  onClick={() => {
                    setShowReviewModal(false)
                    setSelectedAppointment(null)
                  }}
                  className="px-8 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Review Modal */}
      {showOrderReview && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Review Medical Orders</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Patient: {selectedAppointment.patient?.first_name} {selectedAppointment.patient?.last_name}
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowOrderReview(false)
                  setExtractedOrders([])
                  setConfirmedOrders([])
                }} 
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-blue-900">📋 Orders Detected in Treatment Plan</p>
                <p className="text-xs text-blue-800 mt-1">
                  Review the extracted orders below. You can edit, remove, or add orders before confirming.
                </p>
              </div>

              <OrderReviewPanel
                orders={confirmedOrders.length > 0 ? confirmedOrders : extractedOrders}
                onConfirm={handleOrdersConfirmed}
                onEdit={handleOrderEdit}
                onRemove={handleOrderRemove}
                onAdd={handleOrderAdd}
              />

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    // Skip orders and complete without them
                    completeConsultationWithOrders([])
                  }}
                  className="px-8 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                >
                  Skip Orders
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Medical History Modal */}
      {showMedicalHistoryModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <History size={28} className="text-teal-600" />
                  Medical History
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Patient: {selectedAppointment.patient?.first_name} {selectedAppointment.patient?.last_name} ({selectedAppointment.patient?.patient_number})
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowMedicalHistoryModal(false)
                  setPatientConsultations([])
                }} 
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <MedicalHistoryTimeline 
                patientId={selectedAppointment.patient?.id} 
                className=""
              />
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => {
                  setShowMedicalHistoryModal(false)
                  setPatientConsultations([])
                }}
                className="w-full py-3 bg-slate-600 text-white rounded-xl font-semibold hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Details Modal */}
      {showDetailsModal && detailsAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Appointment Details</h2>
                <p className="text-sm text-slate-600 mt-1">
                  {detailsAppointment.appointment_date} at {detailsAppointment.appointment_time}
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowDetailsModal(false)
                  setDetailsAppointment(null)
                }} 
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Patient Information */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Patient Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Name:</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {detailsAppointment.patient?.first_name} {detailsAppointment.patient?.last_name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Patient Number:</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {detailsAppointment.patient?.patient_number || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Contact:</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {detailsAppointment.patient?.contact_number || detailsAppointment.patient?.phone || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Doctor Information */}
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-teal-700 uppercase tracking-wide mb-3">Doctor Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-teal-600">Doctor:</span>
                    <span className="text-sm font-semibold text-teal-900">
                      Dr. {detailsAppointment.doctor?.first_name} {detailsAppointment.doctor?.last_name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-teal-600">Specialization:</span>
                    <span className="text-sm font-semibold text-teal-900">
                      {detailsAppointment.doctor?.specialization || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Appointment Details */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-blue-700 uppercase tracking-wide mb-3">Appointment Details</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-600">Reason for Visit:</span>
                    <span className="text-sm font-semibold text-blue-900">
                      {detailsAppointment.reason}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-600">Booking Source:</span>
                    <span className="text-sm font-semibold text-blue-900">
                      {renderBookingSourceBadge(detailsAppointment.booking_source || 'walk-in')}
                    </span>
                  </div>
                  {detailsAppointment.notes && (
                    <div>
                      <span className="text-sm text-blue-600 block mb-1">Notes:</span>
                      <p className="text-sm text-blue-900 whitespace-pre-wrap">
                        {detailsAppointment.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Change */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Change Status</label>
                <select
                  value={detailsAppointment.status}
                  onChange={async (e) => {
                    const newStatus = e.target.value
                    try {
                      await db.updateAppointment(detailsAppointment.id, { status: newStatus })
                      // Update local state
                      setDetailsAppointment({ ...detailsAppointment, status: newStatus })
                      // Reload data
                      await loadData()
                      alert('Status updated successfully!')
                    } catch (error) {
                      console.error('Error updating status:', error)
                      alert('Failed to update status: ' + error.message)
                    }
                  }}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="No Show">No Show</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {(detailsAppointment.status === 'Scheduled' || detailsAppointment.status === 'Confirmed') && (userProfile?.role === 'doctor' || userProfile?.role === 'admin') && (
                  <button
                    onClick={() => {
                      setShowDetailsModal(false)
                      handleStartConsultation(detailsAppointment)
                    }}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-yellow-500 text-white rounded-xl font-semibold hover:bg-yellow-600 transition-colors"
                  >
                    <PlayCircle size={20} />
                    Start Consultation
                  </button>
                )}

                {detailsAppointment.status === 'In Progress' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowDetailsModal(false)
                        // Store patient ID in sessionStorage for Prescriptions page to read
                        sessionStorage.setItem('selectedPatientId', detailsAppointment.patient_id)
                        // Navigate to prescriptions page
                        const event = new CustomEvent('navigateTo', { detail: 'prescriptions' })
                        window.dispatchEvent(event)
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors"
                    >
                      <FileText size={20} />
                      Prescribe
                    </button>
                    <button
                      onClick={async () => {
                        setShowDetailsModal(false)
                        // Fetch latest appointment data with SOAP fields
                        const latestApt = await db.getAppointmentById(detailsAppointment.id)
                        setSelectedAppointment(latestApt)
                        
                        // Load SOAP data from database
                        setSoapData({
                          subjective: latestApt.soap_subjective || '',
                          objective: latestApt.soap_objective || '',
                          assessment: latestApt.soap_assessment || '',
                          plan: latestApt.soap_plan || ''
                        })
                        
                        setShowReviewModal(true)
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors"
                    >
                      <CheckCircle size={20} />
                      Complete
                    </button>
                  </div>
                )}

                <button
                  onClick={async () => {
                    if (!detailsAppointment?.patient_id) return
                    
                    try {
                      setLoadingHistory(true)
                      const consultations = await db.getConsultations(detailsAppointment.patient_id)
                      setPatientConsultations(consultations)
                      setSelectedAppointment(detailsAppointment)
                      setShowDetailsModal(false)
                      setShowMedicalHistoryModal(true)
                    } catch (error) {
                      console.error('Error loading medical history:', error)
                      alert('Failed to load medical history')
                    } finally {
                      setLoadingHistory(false)
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-500 text-white rounded-xl font-semibold hover:bg-slate-600 transition-colors"
                >
                  <History size={20} />
                  View Medical History
                </button>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => {
                  setShowDetailsModal(false)
                  setDetailsAppointment(null)
                }}
                className="w-full py-3 bg-slate-600 text-white rounded-xl font-semibold hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Vitals Modal */}
      {vitalsModalApt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Record Vital Signs</h2>
                <p className="text-sm text-slate-600 mt-1">
                  {vitalsModalApt.patient?.first_name} {vitalsModalApt.patient?.last_name}
                </p>
              </div>
              <button onClick={() => setVitalsModalApt(null)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <VitalSignsForm
                patientId={vitalsModalApt.patient_id}
                appointmentId={vitalsModalApt.id}
                initialValues={vitalsMap[vitalsModalApt.id] || {}}
                mode="appointments"
                onSuccess={async () => {
                  try {
                    const updated = await db.getVitalsByAppointment(vitalsModalApt.id)
                    setVitalsMap(prev => ({ ...prev, [vitalsModalApt.id]: updated }))
                  } catch (err) {
                    console.error('Error refreshing vitals:', err)
                  }
                  setVitalsModalApt(null)
                }}
                onCancel={() => setVitalsModalApt(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Appointments
