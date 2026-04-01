import { useState, useEffect } from 'react'
import { Calendar, Activity, ClipboardList, FileText, TestTube, DollarSign, Bed, Clock, User } from 'lucide-react'
import { db } from '../lib/supabase'
import SkeletonLoader from './SkeletonLoader'

const MedicalHistoryTimeline = ({ patientId, className = '', preloadedData = null }) => {
  const [timelineEvents, setTimelineEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (preloadedData) {
      // Use pre-loaded data from parent — no extra queries needed
      buildTimeline(
        preloadedData.consultations || [],
        preloadedData.appointments || [],
        preloadedData.orders || [],
        preloadedData.payments || [],
        preloadedData.admissions || []
      )
      setLoading(false)
    } else if (patientId) {
      loadTimelineData()
    }
  }, [patientId, preloadedData])

  const buildTimeline = (consultations, appointments, orders, payments, admissions) => {
      // Create lookup maps for SOAP order integration
      const consultationMap = new Map(consultations.map(c => [c.appointment_id, c]))
      const appointmentMap = new Map(appointments.map(a => [a.id, a]))

      // Transform all events into timeline format
      const events = []

      // Add consultations
      consultations.forEach(consultation => {
        events.push({
          id: `consultation-${consultation.id}`,
          type: 'consultation',
          date: new Date(consultation.consultation_date),
          title: consultation.chief_complaint || 'Consultation',
          subtitle: `Dr. ${consultation.doctor?.first_name || ''} ${consultation.doctor?.last_name || ''}`.trim(),
          details: {
            diagnosis: consultation.diagnosis,
            prescription: consultation.prescription,
            notes: consultation.notes,
            vital_signs: consultation.vital_signs
          },
          icon: Activity,
          color: 'bg-blue-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        })
      })

      // Add appointments
      appointments.forEach(appointment => {
        events.push({
          id: `appointment-${appointment.id}`,
          type: 'appointment',
          date: new Date(appointment.appointment_date),
          title: appointment.reason || 'Appointment',
          subtitle: `Dr. ${appointment.doctor?.first_name || ''} ${appointment.doctor?.last_name || ''}`.trim(),
          details: {
            time: appointment.appointment_time,
            status: appointment.status,
            notes: appointment.notes
          },
          icon: Calendar,
          color: 'bg-green-500',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        })
      })

      // Add orders (enhanced for task 3.6 - SOAP orders timeline integration)
      orders.forEach(order => {
        const orderTypeLabels = {
          medication: 'Medication Order',
          lab_test: 'Lab Test Order',
          procedure: 'Procedure Order',
          diet: 'Diet Order',
          activity_restriction: 'Activity Restriction'
        }

        const priorityColors = {
          stat: 'bg-red-500',
          urgent: 'bg-orange-500',
          routine: 'bg-purple-500'
        }

        // Enhanced SOAP order integration - get originating consultation details
        const originatingConsultation = order.appointment_id ? consultationMap.get(order.appointment_id) : null
        const originatingAppointment = order.appointment_id ? appointmentMap.get(order.appointment_id) : null

        events.push({
          id: `order-${order.id}`,
          type: 'order',
          date: new Date(order.created_at),
          title: orderTypeLabels[order.order_type] || 'Medical Order',
          subtitle: `${order.priority?.toUpperCase() || 'ROUTINE'} - ${order.status?.replace('_', ' ').toUpperCase() || 'PENDING'}`,
          details: {
            order_details: order.order_details,
            notes: order.notes,
            priority: order.priority,
            status: order.status,
            order_type: order.order_type,
            created_by: order.created_by_user?.full_name || `${order.created_by_user?.first_name || ''} ${order.created_by_user?.last_name || ''}`.trim() || 'Unknown',
            from_soap: !!order.appointment_id,
            // Enhanced connection to originating consultation
            originating_consultation: originatingConsultation,
            originating_appointment: originatingAppointment,
            appointment_id: order.appointment_id
          },
          icon: ClipboardList,
          color: priorityColors[order.priority] || 'bg-purple-500',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200'
        })
      })

      // Add payments
      payments.forEach(payment => {
        events.push({
          id: `payment-${payment.id}`,
          type: 'payment',
          date: new Date(payment.created_at),
          title: `Payment - ${payment.invoice_number || 'Invoice'}`,
          subtitle: `₱${parseFloat(payment.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} - ${payment.payment_status}`,
          details: {
            amount: payment.total_amount,
            status: payment.payment_status,
            invoice_number: payment.invoice_number
          },
          icon: DollarSign,
          color: payment.payment_status === 'Paid' ? 'bg-green-500' : 'bg-yellow-500',
          bgColor: payment.payment_status === 'Paid' ? 'bg-green-50' : 'bg-yellow-50',
          borderColor: payment.payment_status === 'Paid' ? 'border-green-200' : 'border-yellow-200'
        })
      })

      // Add admissions
      admissions.forEach(admission => {
        events.push({
          id: `admission-${admission.id}`,
          type: 'admission',
          date: new Date(admission.admission_date),
          title: `Hospital Admission - Room ${admission.room?.room_number || 'N/A'}`,
          subtitle: `Dr. ${admission.doctor?.first_name || ''} ${admission.doctor?.last_name || ''}`.trim(),
          details: {
            room: admission.room,
            diagnosis: admission.diagnosis,
            discharge_date: admission.discharge_date,
            status: admission.discharge_date ? 'Discharged' : 'Active'
          },
          icon: Bed,
          color: admission.discharge_date ? 'bg-slate-500' : 'bg-indigo-500',
          bgColor: admission.discharge_date ? 'bg-slate-50' : 'bg-indigo-50',
          borderColor: admission.discharge_date ? 'border-slate-200' : 'border-indigo-200'
        })
      })

      // Sort all events chronologically by date (newest first)
      events.sort((a, b) => b.date - a.date)

      setTimelineEvents(events)
  }

  const loadTimelineData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [consultations, appointments, orders, , payments, admissions] = await Promise.all([
        db.getConsultations(patientId).catch(() => []),
        db.getAppointmentsByPatient(patientId).catch(() => []),
        db.getOrdersByPatient(patientId).catch(() => []),
        Promise.resolve([]),
        db.getBillingByPatient(patientId).catch(() => []),
        db.getInpatientsByPatient(patientId).catch(() => [])
      ])

      buildTimeline(consultations, appointments, orders, payments, admissions)
    } catch (err) {
      console.error('Error loading timeline data:', err)
      setError('Failed to load medical history timeline')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderEventDetails = (event) => {
    switch (event.type) {
      case 'consultation':
        return (
          <div className="space-y-2 text-sm">
            {event.details.diagnosis && (
              <div>
                <span className="font-semibold text-slate-700">Diagnosis:</span>
                <p className="text-slate-600 ml-2">{event.details.diagnosis}</p>
              </div>
            )}
            {event.details.prescription && (
              <div>
                <span className="font-semibold text-slate-700">Treatment:</span>
                <p className="text-slate-600 ml-2 whitespace-pre-wrap">{event.details.prescription}</p>
              </div>
            )}
            {event.details.notes && (
              <div>
                <span className="font-semibold text-slate-700">Notes:</span>
                <p className="text-slate-600 ml-2 whitespace-pre-wrap">{event.details.notes}</p>
              </div>
            )}
          </div>
        )

      case 'order':
        return (
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-semibold text-slate-700">Order Details:</span>
              <p className="text-slate-600 ml-2 bg-slate-50 rounded p-2">{event.details.order_details}</p>
            </div>
            {event.details.notes && (
              <div>
                <span className="font-semibold text-slate-700">Notes:</span>
                <p className="text-slate-600 ml-2 bg-slate-50 rounded p-2">{event.details.notes}</p>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                <span className="font-semibold">Ordered by:</span> {event.details.created_by}
              </div>
              {event.details.from_soap && (
                <div className="text-xs text-teal-600 font-semibold">
                  📋 From SOAP Note
                </div>
              )}
            </div>
            {/* Enhanced SOAP order integration - show connection to originating consultation */}
            {event.details.from_soap && event.details.originating_consultation && (
              <div className="mt-3 pt-2 border-t border-slate-100 bg-teal-50 rounded p-2">
                <div className="text-xs text-teal-700 font-semibold mb-1">
                  🔗 Originating Consultation
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div>
                    <span className="font-semibold">Date:</span> {new Date(event.details.originating_consultation.consultation_date).toLocaleDateString()}
                  </div>
                  {event.details.originating_consultation.chief_complaint && (
                    <div>
                      <span className="font-semibold">Chief Complaint:</span> {event.details.originating_consultation.chief_complaint}
                    </div>
                  )}
                  {event.details.originating_consultation.diagnosis && (
                    <div>
                      <span className="font-semibold">Diagnosis:</span> {event.details.originating_consultation.diagnosis}
                    </div>
                  )}
                  <div className="text-xs text-teal-600 mt-1">
                    Consultation ID: {event.details.appointment_id?.slice(0, 8)}...
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      case 'appointment':
        return (
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-4">
              <span className="text-slate-600">Time: {event.details.time}</span>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                event.details.status === 'Completed' ? 'bg-green-100 text-green-700' :
                event.details.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {event.details.status}
              </span>
            </div>
            {event.details.notes && (
              <div>
                <span className="font-semibold text-slate-700">Notes:</span>
                <p className="text-slate-600 ml-2">{event.details.notes}</p>
              </div>
            )}
          </div>
        )

      case 'payment':
        return (
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Amount: ₱{parseFloat(event.details.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                event.details.status === 'Paid' ? 'bg-green-100 text-green-700' :
                event.details.status === 'Partial' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {event.details.status}
              </span>
            </div>
          </div>
        )

      case 'admission':
        return (
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Room: {event.details.room?.room_number} ({event.details.room?.room_type})</span>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                event.details.status === 'Active' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'
              }`}>
                {event.details.status}
              </span>
            </div>
            {event.details.diagnosis && (
              <div>
                <span className="font-semibold text-slate-700">Diagnosis:</span>
                <p className="text-slate-600 ml-2">{event.details.diagnosis}</p>
              </div>
            )}
            {event.details.discharge_date && (
              <div>
                <span className="font-semibold text-slate-700">Discharged:</span>
                <span className="text-slate-600 ml-2">{new Date(event.details.discharge_date).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className={`${className}`}>
        <SkeletonLoader variant="list" rows={5} message="Loading medical history timeline..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${className} text-center py-8`}>
        <div className="text-red-500 mb-2">
          <FileText size={48} className="mx-auto mb-2" />
          <p className="font-semibold">Error Loading Timeline</p>
          <p className="text-sm text-slate-600">{error}</p>
        </div>
        <button
          onClick={loadTimelineData}
          className="mt-4 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  if (timelineEvents.length === 0) {
    return (
      <div className={`${className} text-center py-12`}>
        <Clock size={48} className="mx-auto text-slate-300 mb-4" />
        <p className="text-slate-600 font-semibold">No Medical History</p>
        <p className="text-slate-500 text-sm mt-1">No medical events recorded for this patient</p>
      </div>
    )
  }

  return (
    <div className={`${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-900 mb-2">Medical History Timeline</h3>
        <p className="text-sm text-slate-600">
          Chronological view of all medical events including consultations, orders, appointments, and more
        </p>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200"></div>

        <div className="space-y-6">
          {timelineEvents.map((event, index) => {
            const Icon = event.icon
            return (
              <div key={event.id} className="relative flex items-start gap-4">
                {/* Timeline dot */}
                <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full ${event.color} shadow-sm`}>
                  <Icon size={20} className="text-white" />
                </div>

                {/* Event content */}
                <div className={`flex-1 ${event.bgColor} border ${event.borderColor} rounded-xl p-4 shadow-sm`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-slate-900">{event.title}</h4>
                      <p className="text-sm text-slate-600">{event.subtitle}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">{formatDate(event.date)}</p>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold mt-1 ${
                        event.type === 'consultation' ? 'bg-blue-100 text-blue-700' :
                        event.type === 'order' ? 'bg-purple-100 text-purple-700' :
                        event.type === 'appointment' ? 'bg-green-100 text-green-700' :
                        event.type === 'payment' ? 'bg-yellow-100 text-yellow-700' :
                        event.type === 'admission' ? 'bg-indigo-100 text-indigo-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {event.type.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {renderEventDetails(event)}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-slate-200 text-center">
        <p className="text-sm text-slate-500">
          Total Events: {timelineEvents.length} • Last Updated: {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  )
}

export default MedicalHistoryTimeline