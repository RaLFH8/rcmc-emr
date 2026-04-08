import { useState, useEffect } from 'react'
import { X, User, Phone, Mail, MapPin, Heart, AlertTriangle, Activity, Calendar, Edit2 } from 'lucide-react'
import { db } from '../lib/supabase'
import VitalSignsBadge from './VitalSignsBadge'

/**
 * PatientProfileModal — quick-peek read-only patient profile.
 * Triggered by clicking a patient name anywhere in the app.
 * Props:
 *   patient   {object}  patient record (required)
 *   onClose   {function}
 *   onEdit    {function} optional — opens full edit modal
 */
export default function PatientProfileModal({ patient, onClose, onEdit }) {
  const [activeTab, setActiveTab] = useState('summary')
  const [latestVitals, setLatestVitals] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!patient?.id) return
    loadData()
  }, [patient?.id])

  async function loadData() {
    setLoading(true)
    try {
      const [vitals, appointments, consultations] = await Promise.all([
        db.getVitalsByPatient(patient.id).catch(() => []),
        db.getAppointmentsByPatient(patient.id).catch(() => []),
        db.getConsultations(patient.id).catch(() => []),
      ])
      setLatestVitals(vitals?.[0] || null)

      // Merge and sort recent activity (last 3)
      const activity = [
        ...appointments.slice(0, 3).map(a => ({
          type: 'appointment',
          date: a.appointment_date,
          label: a.reason || 'Appointment',
          sub: `Dr. ${a.doctor?.first_name || ''} ${a.doctor?.last_name || ''}`.trim(),
          status: a.status,
        })),
        ...consultations.slice(0, 3).map(c => ({
          type: 'consultation',
          date: c.consultation_date?.split('T')[0],
          label: c.chief_complaint || 'Consultation',
          sub: c.diagnosis || '',
          status: 'Completed',
        })),
      ]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 4)

      setRecentActivity(activity)
    } finally {
      setLoading(false)
    }
  }

  if (!patient) return null

  const initials = `${patient.first_name?.[0] || ''}${patient.last_name?.[0] || ''}`.toUpperCase()
  const fullName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim()
  const age = patient.date_of_birth
    ? Math.floor((new Date() - new Date(patient.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  const allergies = Array.isArray(patient.allergies)
    ? patient.allergies.filter(Boolean).join(', ')
    : patient.allergies || ''

  const medHistory = Array.isArray(patient.medical_history)
    ? patient.medical_history.filter(Boolean).join(', ')
    : patient.medical_history || ''

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-teal-700 font-bold text-lg">{initials}</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{fullName}</h2>
                <p className="text-sm text-slate-500">{patient.patient_number}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  patient.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {patient.status || 'Active'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onEdit && (
                <button
                  onClick={() => { onClose(); onEdit(patient) }}
                  className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                  title="Edit patient"
                >
                  <Edit2 size={16} />
                </button>
              )}
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            {[
              { label: 'Age', value: age ? `${age} yrs` : '—' },
              { label: 'Gender', value: patient.gender || '—' },
              { label: 'Blood Type', value: patient.blood_type || '—' },
              { label: 'PhilHealth', value: patient.philhealth_number ? '✓' : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 rounded-lg p-2 text-center">
                <p className="text-xs text-slate-400">{label}</p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact row */}
        <div className="px-6 py-3 border-b border-slate-100 flex flex-wrap gap-4 text-sm text-slate-600">
          {patient.contact_number && (
            <span className="flex items-center gap-1.5">
              <Phone size={13} className="text-slate-400" />
              {patient.contact_number}
            </span>
          )}
          {patient.email && (
            <span className="flex items-center gap-1.5">
              <Mail size={13} className="text-slate-400" />
              {patient.email}
            </span>
          )}
          {patient.address && (
            <span className="flex items-center gap-1.5">
              <MapPin size={13} className="text-slate-400" />
              <span className="truncate max-w-[200px]">{patient.address}</span>
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-6">
          {[
            { key: 'summary', label: 'Summary' },
            { key: 'vitals', label: 'Latest Vitals' },
            { key: 'activity', label: 'Recent Activity' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === key
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-slate-400 text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-teal-500 border-t-transparent" />
              Loading…
            </div>
          ) : (
            <>
              {/* Summary */}
              {activeTab === 'summary' && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={14} className="text-amber-500" />
                      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Allergies</span>
                    </div>
                    <p className="text-sm text-slate-700 bg-amber-50 rounded-lg px-3 py-2">
                      {allergies || 'None recorded'}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Heart size={14} className="text-red-400" />
                      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Medical History</span>
                    </div>
                    <p className="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2">
                      {medHistory || 'None recorded'}
                    </p>
                  </div>
                  {(patient.emergency_contact_name || patient.emergency_contact_number) && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Phone size={14} className="text-slate-400" />
                        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Emergency Contact</span>
                      </div>
                      <p className="text-sm text-slate-700">
                        {patient.emergency_contact_name}
                        {patient.emergency_contact_number && ` — ${patient.emergency_contact_number}`}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Latest Vitals */}
              {activeTab === 'vitals' && (
                <div>
                  {latestVitals ? (
                    <div>
                      <p className="text-xs text-slate-400 mb-3">
                        Recorded: {new Date(latestVitals.recorded_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {latestVitals.blood_pressure_systolic && latestVitals.blood_pressure_diastolic && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-slate-400 mb-1">Blood Pressure</p>
                            <div className="flex items-center gap-1">
                              <VitalSignsBadge field="blood_pressure_systolic" value={latestVitals.blood_pressure_systolic} />
                              <span className="text-slate-400">/</span>
                              <VitalSignsBadge field="blood_pressure_diastolic" value={latestVitals.blood_pressure_diastolic} unit="mmHg" />
                            </div>
                          </div>
                        )}
                        {latestVitals.heart_rate && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-slate-400 mb-1">Heart Rate</p>
                            <VitalSignsBadge field="heart_rate" value={latestVitals.heart_rate} unit="bpm" />
                          </div>
                        )}
                        {latestVitals.temperature && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-slate-400 mb-1">Temperature</p>
                            <VitalSignsBadge field="temperature" value={latestVitals.temperature} unit="°C" />
                          </div>
                        )}
                        {latestVitals.oxygen_saturation && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-slate-400 mb-1">O₂ Saturation</p>
                            <VitalSignsBadge field="oxygen_saturation" value={latestVitals.oxygen_saturation} unit="%" />
                          </div>
                        )}
                        {latestVitals.respiratory_rate && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-slate-400 mb-1">Resp. Rate</p>
                            <VitalSignsBadge field="respiratory_rate" value={latestVitals.respiratory_rate} unit="/min" />
                          </div>
                        )}
                        {latestVitals.weight && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-slate-400 mb-1">Weight</p>
                            <VitalSignsBadge field="weight" value={latestVitals.weight} unit="kg" />
                          </div>
                        )}
                      </div>
                      {latestVitals.notes && (
                        <p className="text-xs text-slate-500 mt-3 bg-slate-50 rounded-lg px-3 py-2">{latestVitals.notes}</p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Activity size={32} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-sm text-slate-400">No vitals recorded yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* Recent Activity */}
              {activeTab === 'activity' && (
                <div>
                  {recentActivity.length > 0 ? (
                    <div className="space-y-3">
                      {recentActivity.map((item, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            item.type === 'consultation' ? 'bg-blue-100' : 'bg-green-100'
                          }`}>
                            {item.type === 'consultation'
                              ? <Activity size={14} className="text-blue-600" />
                              : <Calendar size={14} className="text-green-600" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-700 truncate">{item.label}</p>
                            {item.sub && <p className="text-xs text-slate-500 truncate">{item.sub}</p>}
                            <p className="text-xs text-slate-400 mt-0.5">{item.date}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${
                            item.status === 'Completed' ? 'bg-teal-100 text-teal-700' :
                            item.status === 'Scheduled' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar size={32} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-sm text-slate-400">No recent activity</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
