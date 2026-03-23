import { useEffect, useState } from 'react'
import { Plus, Search, Edit2, Trash2, X, User, Phone, Mail, Stethoscope, MessageSquare, QrCode, Download } from 'lucide-react'
import { db, supabase } from '../lib/supabase'
import { generateDoctorQR, downloadQRCode, generateBatchQRCodes } from '../utils/qrGenerator'
import SkeletonLoader from '../components/SkeletonLoader'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

function deserializeSchedule(jsonb) {
  return Array.from({ length: 7 }, (_, i) => {
    const day = jsonb?.[String(i)] ?? jsonb?.[i]
    if (!day || typeof day !== 'object') return { enabled: false, start: 8, end: 17 }
    const start = day.start ?? day.startTime ?? day.from ?? 8
    const end = day.end ?? day.endTime ?? day.to ?? 17
    return { enabled: true, start: Number(start), end: Number(end) }
  })
}

function serializeSchedule(uiSchedule) {
  const result = {}
  uiSchedule.forEach((day, i) => {
    if (day.enabled) result[String(i)] = { start: day.start, end: day.end }
  })
  return Object.keys(result).length > 0 ? result : null
}

const Doctors = () => {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState(null)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [feedbackData, setFeedbackData] = useState([])
  const [loadingFeedback, setLoadingFeedback] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [showQRModal, setShowQRModal] = useState(false)
  const [qrCodeData, setQRCodeData] = useState(null)
  const [generatingQR, setGeneratingQR] = useState(false)
  const [scheduleUI, setScheduleUI] = useState(deserializeSchedule(null))
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    specialization: '',
    license_number: '',
    contact_number: '',
    email: '',
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
      const serializedSchedule = serializeSchedule(scheduleUI)
      // Prepare data with proper type conversion
      const dataToSave = {
        ...formData,
        schedule: serializedSchedule,
        consultation_fee: formData.consultation_fee === '' ? null : parseFloat(formData.consultation_fee)
      }

      if (editingDoctor) {
        const { data: updated, error } = await supabase
          .from('doctors')
          .update(dataToSave)
          .eq('id', editingDoctor.id)
          .select()
        
        if (error) throw error
        if (!updated || updated.length === 0) {
          throw new Error('Update was blocked — no rows returned. Check Supabase RLS policies for the doctors table.')
        }
      } else {
        const { data: inserted, error } = await supabase
          .from('doctors')
          .insert([dataToSave])
          .select()
        
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
    setScheduleUI(deserializeSchedule(doctor.schedule))
    setFormData({
      first_name: doctor.first_name,
      last_name: doctor.last_name,
      specialization: doctor.specialization,
      license_number: doctor.license_number || '',
      contact_number: doctor.contact_number || '',
      email: doctor.email || '',
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
    setScheduleUI(deserializeSchedule(null))
    setFormData({
      first_name: '',
      last_name: '',
      specialization: '',
      license_number: '',
      contact_number: '',
      email: '',
      consultation_fee: '',
      status: 'Active'
    })
  }

  const viewFeedback = async (doctor) => {
    setSelectedDoctor(doctor)
    setShowFeedbackModal(true)
    setLoadingFeedback(true)
    
    try {
      const feedback = await db.getDoctorFeedback(doctor.id, 50)
      setFeedbackData(feedback)
    } catch (error) {
      console.error('Error loading feedback:', error)
      alert('Failed to load feedback')
    } finally {
      setLoadingFeedback(false)
    }
  }

  const closeFeedbackModal = () => {
    setShowFeedbackModal(false)
    setSelectedDoctor(null)
    setFeedbackData([])
  }

  const generateQR = async (doctor) => {
    setSelectedDoctor(doctor)
    setGeneratingQR(true)
    setShowQRModal(true)
    
    try {
      const result = await generateDoctorQR(
        doctor.id,
        `${doctor.first_name} ${doctor.last_name}`
      )
      
      if (result.success) {
        setQRCodeData(result)
      } else {
        alert('Failed to generate QR code: ' + result.error)
        setShowQRModal(false)
      }
    } catch (error) {
      console.error('Error generating QR code:', error)
      alert('Failed to generate QR code')
      setShowQRModal(false)
    } finally {
      setGeneratingQR(false)
    }
  }

  const handleDownloadQR = () => {
    if (qrCodeData && selectedDoctor) {
      const filename = `qr-${selectedDoctor.first_name}-${selectedDoctor.last_name}.png`
      downloadQRCode(qrCodeData.dataUrl, filename)
    }
  }

  const closeQRModal = () => {
    setShowQRModal(false)
    setSelectedDoctor(null)
    setQRCodeData(null)
  }

  const generateAllQRCodes = async () => {
    if (!confirm('Generate QR codes for all active doctors? This will download multiple files.')) {
      return
    }

    try {
      const results = await generateBatchQRCodes(doctors)
      
      // Download each QR code
      results.forEach((result, index) => {
        if (result.success) {
          const doctor = doctors[index]
          const filename = `qr-${doctor.first_name}-${doctor.last_name}.png`
          setTimeout(() => {
            downloadQRCode(result.dataUrl, filename)
          }, index * 500) // Stagger downloads
        }
      })
      
      alert(`Generated ${results.filter(r => r.success).length} QR codes`)
    } catch (error) {
      console.error('Error generating batch QR codes:', error)
      alert('Failed to generate QR codes')
    }
  }

  const exportFeedbackCSV = async (doctorId = null) => {
    try {
      const responses = await db.exportSurveyResponses(doctorId)
      
      if (responses.length === 0) {
        alert('No feedback data to export')
        return
      }

      // CSV headers
      const headers = [
        'Doctor Name',
        'Professionalism Rating',
        'Waiting Time Rating',
        'Cleanliness Rating',
        'Average Rating',
        'Comments',
        'Sentiment',
        'Submission Date'
      ]

      // Escape CSV special characters
      const escapeCSV = (value) => {
        if (value === null || value === undefined) return ''
        const str = String(value)
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }

      // Build CSV rows
      const rows = responses.map(response => {
        const doctorName = response.doctor 
          ? `Dr. ${response.doctor.first_name} ${response.doctor.last_name}`
          : 'Unknown'
        
        const avgRating = (
          (response.professionalism_rating + 
           response.waiting_time_rating + 
           response.cleanliness_rating) / 3
        ).toFixed(2)

        return [
          escapeCSV(doctorName),
          escapeCSV(response.professionalism_rating),
          escapeCSV(response.waiting_time_rating),
          escapeCSV(response.cleanliness_rating),
          escapeCSV(avgRating),
          escapeCSV(response.comments || ''),
          escapeCSV(response.sentiment_classification || 'N/A'),
          escapeCSV(new Date(response.submission_timestamp).toLocaleString())
        ].join(',')
      })

      // Combine headers and rows
      const csv = [headers.join(','), ...rows].join('\n')

      // Create blob and download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `patient-feedback-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      alert(`Exported ${responses.length} feedback responses`)
    } catch (error) {
      console.error('Error exporting feedback:', error)
      alert('Failed to export feedback')
    }
  }

  const filteredDoctors = doctors.filter(doctor =>
    `${doctor.first_name} ${doctor.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doctor.license_number && doctor.license_number.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SkeletonLoader variant="card" columns={3} message="Loading doctors..." />
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
        <div className="flex gap-3">
          <button
            onClick={() => exportFeedbackCSV()}
            className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors shadow-sm"
          >
            <Download size={20} />
            Export All Feedback
          </button>
          <button
            onClick={generateAllQRCodes}
            className="flex items-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-xl font-semibold hover:bg-purple-600 transition-colors shadow-sm"
          >
            <QrCode size={20} />
            Generate All QR Codes
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors shadow-sm"
          >
            <Plus size={20} />
            Add Doctor
          </button>
        </div>
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
                  <span className="font-semibold">Schedule:</span>{' '}
                  {Object.entries(doctor.schedule)
                    .filter(([day]) => !isNaN(Number(day)) && Number(day) >= 0 && Number(day) <= 6)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([day, hours]) => {
                      if (!hours || typeof hours !== 'object') return null
                      const start = hours.start ?? hours.startTime ?? hours.from
                      const end = hours.end ?? hours.endTime ?? hours.to
                      if (start == null || end == null) return null
                      const dayName = DAY_NAMES[Number(day)]
                      if (!dayName) return null
                      return `${dayName} ${String(start).padStart(2,'0')}:00–${String(end).padStart(2,'0')}:00`
                    })
                    .filter(Boolean)
                    .join(', ')}
                </div>
              )}
              {doctor.consultation_fee && (
                <div className="text-sm text-slate-600">
                  <span className="font-semibold">Fee:</span> ₱{Number(doctor.consultation_fee).toLocaleString()}
                </div>
              )}
              {/* Satisfaction Metrics */}
              <div className="pt-2 border-t border-slate-100">
                {doctor.total_reviews > 0 ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500 text-lg">★</span>
                      <span className="font-bold text-slate-900">{Number(doctor.satisfaction_score).toFixed(2)}</span>
                    </div>
                    <span className="text-xs text-slate-500">
                      ({doctor.total_reviews} {doctor.total_reviews === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                ) : (
                  <div className="text-sm text-slate-400 italic">No reviews yet</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
              <button
                onClick={() => handleEdit(doctor)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit2 size={16} />
                <span className="text-sm font-semibold">Edit</span>
              </button>
              <button
                onClick={() => generateQR(doctor)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              >
                <QrCode size={16} />
                <span className="text-sm font-semibold">QR</span>
              </button>
              {doctor.total_reviews > 0 && (
                <button
                  onClick={() => viewFeedback(doctor)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                >
                  <MessageSquare size={16} />
                  <span className="text-sm font-semibold">Feedback</span>
                </button>
              )}
              <button
                onClick={() => handleDelete(doctor.id)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                  <div className="border border-slate-200 rounded-xl p-3 space-y-1">
                    {DAY_NAMES.map((name, i) => (
                      <div key={i} className="flex items-center gap-3 py-1">
                        <input
                          type="checkbox"
                          id={`day-${i}`}
                          checked={scheduleUI[i].enabled}
                          onChange={(e) => {
                            const updated = [...scheduleUI]
                            updated[i] = { ...updated[i], enabled: e.target.checked }
                            setScheduleUI(updated)
                          }}
                          className="w-4 h-4 accent-teal-500"
                        />
                        <label htmlFor={`day-${i}`} className="w-10 text-sm font-medium text-slate-700 cursor-pointer">{name}</label>
                        {scheduleUI[i].enabled && (
                          <>
                            <select
                              value={scheduleUI[i].start}
                              onChange={(e) => {
                                const updated = [...scheduleUI]
                                updated[i] = { ...updated[i], start: Number(e.target.value) }
                                setScheduleUI(updated)
                              }}
                              className="px-2 py-1 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                              {HOURS.map(h => <option key={h} value={h}>{String(h).padStart(2,'0')}:00</option>)}
                            </select>
                            <span className="text-sm text-slate-500">to</span>
                            <select
                              value={scheduleUI[i].end}
                              onChange={(e) => {
                                const updated = [...scheduleUI]
                                updated[i] = { ...updated[i], end: Number(e.target.value) }
                                setScheduleUI(updated)
                              }}
                              className="px-2 py-1 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                              {HOURS.map(h => <option key={h} value={h}>{String(h).padStart(2,'0')}:00</option>)}
                            </select>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
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

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Patient Feedback
                </h2>
                {selectedDoctor && (
                  <p className="text-sm text-slate-600 mt-1">
                    Dr. {selectedDoctor.first_name} {selectedDoctor.last_name}
                  </p>
                )}
              </div>
              <button onClick={closeFeedbackModal} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {loadingFeedback ? (
                <div className="flex items-center justify-center py-12">
                  <SkeletonLoader variant="list" rows={3} message="Loading feedback..." />
                </div>
              ) : feedbackData.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-600 text-lg font-semibold">No feedback yet</p>
                  <p className="text-slate-500 text-sm mt-2">Patient reviews will appear here</p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <button
                      onClick={() => exportFeedbackCSV(selectedDoctor.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
                    >
                      <Download size={16} />
                      Export This Doctor's Feedback
                    </button>
                  </div>
                  <div className="space-y-4">
                    {feedbackData.map((feedback, index) => (
                      <div key={index} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex gap-4">
                            <div>
                              <div className="text-xs text-slate-500 mb-1">Professionalism</div>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <span key={i} className={`text-sm ${i < feedback.professionalism_rating ? 'text-yellow-500' : 'text-slate-300'}`}>
                                    ★
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-500 mb-1">Waiting Time</div>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <span key={i} className={`text-sm ${i < feedback.waiting_time_rating ? 'text-yellow-500' : 'text-slate-300'}`}>
                                    ★
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-500 mb-1">Cleanliness</div>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <span key={i} className={`text-sm ${i < feedback.cleanliness_rating ? 'text-yellow-500' : 'text-slate-300'}`}>
                                    ★
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-slate-500">
                              {new Date(feedback.submission_timestamp).toLocaleDateString()}
                            </div>
                            {feedback.sentiment_classification && (
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mt-1 ${
                                feedback.sentiment_classification === 'Positive' ? 'bg-green-100 text-green-700' :
                                feedback.sentiment_classification === 'Negative' ? 'bg-red-100 text-red-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {feedback.sentiment_classification}
                              </span>
                            )}
                          </div>
                        </div>
                        {feedback.comments && (
                          <div className="mt-3 pt-3 border-t border-slate-200">
                            <p className="text-sm text-slate-700">{feedback.comments}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Survey QR Code
                </h2>
                {selectedDoctor && (
                  <p className="text-sm text-slate-600 mt-1">
                    Dr. {selectedDoctor.first_name} {selectedDoctor.last_name}
                  </p>
                )}
              </div>
              <button onClick={closeQRModal} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {generatingQR ? (
                <div className="flex items-center justify-center py-12">
                  <SkeletonLoader variant="card" columns={1} message="Generating QR code..." />
                </div>
              ) : qrCodeData ? (
                <div className="space-y-4">
                  <div className="flex justify-center bg-slate-50 p-6 rounded-xl">
                    <img 
                      src={qrCodeData.dataUrl} 
                      alt="QR Code" 
                      className="w-64 h-64"
                    />
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-xs text-blue-800 font-semibold mb-1">Survey URL:</p>
                    <p className="text-xs text-blue-600 break-all font-mono">{qrCodeData.url}</p>
                  </div>
                  <button
                    onClick={handleDownloadQR}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors"
                  >
                    <Download size={20} />
                    Download QR Code
                  </button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-600">Failed to generate QR code</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Doctors
