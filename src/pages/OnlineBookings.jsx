import { useState, useEffect } from 'react'
import { Calendar, Clock, User, Phone, Mail, CheckCircle, XCircle, AlertCircle, Filter } from 'lucide-react'
import { db } from '../lib/supabase'

const OnlineBookings = () => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadBookings()
  }, [filter])

  const loadBookings = async () => {
    try {
      setLoading(true)
      // Always load all bookings to get accurate counts
      const data = await db.getOnlineBookings('all')
      setBookings(data)
    } catch (error) {
      console.error('Error loading bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (bookingId) => {
    if (!confirm('Approve this booking?')) return

    try {
      setProcessing(true)
      await db.updateBookingStatus(bookingId, 'confirmed')
      await loadBookings()
      setSelectedBooking(null)
    } catch (error) {
      console.error('Error approving booking:', error)
      alert('Failed to approve booking')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async (bookingId) => {
    if (!confirm('Reject this booking? This cannot be undone.')) return

    try {
      setProcessing(true)
      await db.updateBookingStatus(bookingId, 'rejected')
      await loadBookings()
      setSelectedBooking(null)
    } catch (error) {
      console.error('Error rejecting booking:', error)
      alert('Failed to reject booking')
    } finally {
      setProcessing(false)
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-slate-100 text-slate-800'
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || styles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (timeStr) => {
    const [hour, minute] = timeStr.split(':')
    const h = parseInt(hour)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h
    return `${displayHour}:${minute} ${ampm}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Online Bookings</h1>
          <p className="text-slate-600 mt-1">Review and manage appointment requests</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-1 inline-flex gap-1">
        {['pending', 'confirmed', 'rejected', 'all'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
              filter === status
                ? 'bg-teal-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            {status !== 'all' && (
              <span className="ml-2 text-xs">
                ({bookings.filter(b => b.booking_status === status).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto"></div>
            <p className="text-sm text-slate-600 mt-2">Loading bookings...</p>
          </div>
        ) : (() => {
          const filteredBookings = filter === 'all' ? bookings : bookings.filter(b => b.booking_status === filter)
          return filteredBookings.length === 0 ? (
            <div className="p-8 text-center">
              <AlertCircle size={48} className="mx-auto text-slate-300 mb-2" />
              <p className="text-slate-600">No {filter !== 'all' ? filter : ''} bookings found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="p-6 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => setSelectedBooking(booking)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-900">
                        {booking.patient?.first_name} {booking.patient?.last_name}
                      </h3>
                      {getStatusBadge(booking.booking_status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar size={16} />
                        <span>{formatDate(booking.appointment_date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock size={16} />
                        <span>{formatTime(booking.appointment_time)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <User size={16} />
                        <span>Dr. {booking.doctor?.first_name} {booking.doctor?.last_name}</span>
                      </div>
                    </div>

                    {booking.reason && (
                      <p className="text-sm text-slate-600 mt-2">
                        <span className="font-medium">Reason:</span> {booking.reason}
                      </p>
                    )}
                  </div>

                  {booking.booking_status === 'pending' && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleApprove(booking.id)
                        }}
                        disabled={processing}
                        className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                        title="Approve"
                      >
                        <CheckCircle size={20} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleReject(booking.id)
                        }}
                        disabled={processing}
                        className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                        title="Reject"
                      >
                        <XCircle size={20} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              ))}
            </div>
          )
        })()}
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Booking Details</h2>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <XCircle size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Status */}
              <div>
                <label className="text-sm font-semibold text-slate-700">Status</label>
                <div className="mt-1">
                  {getStatusBadge(selectedBooking.booking_status)}
                </div>
              </div>

              {/* Appointment Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Date</label>
                  <p className="text-slate-900 mt-1">{formatDate(selectedBooking.appointment_date)}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">Time</label>
                  <p className="text-slate-900 mt-1">{formatTime(selectedBooking.appointment_time)}</p>
                </div>
              </div>

              {/* Doctor */}
              <div>
                <label className="text-sm font-semibold text-slate-700">Doctor</label>
                <p className="text-slate-900 mt-1">
                  Dr. {selectedBooking.doctor?.first_name} {selectedBooking.doctor?.last_name}
                  {selectedBooking.doctor?.specialization && (
                    <span className="text-slate-600 text-sm ml-2">
                      ({selectedBooking.doctor.specialization})
                    </span>
                  )}
                </p>
              </div>

              {/* Patient Info */}
              <div className="border-t border-slate-200 pt-4">
                <h3 className="font-semibold text-slate-900 mb-3">Patient Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Name</label>
                    <p className="text-slate-900 mt-1">
                      {selectedBooking.patient?.first_name} {selectedBooking.patient?.last_name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Gender</label>
                    <p className="text-slate-900 mt-1">{selectedBooking.patient?.gender}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Contact</label>
                    <p className="text-slate-900 mt-1">{selectedBooking.patient?.contact_number}</p>
                  </div>
                  {selectedBooking.patient?.email && (
                    <div>
                      <label className="text-sm font-semibold text-slate-700">Email</label>
                      <p className="text-slate-900 mt-1">{selectedBooking.patient.email}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Reason */}
              {selectedBooking.reason && (
                <div>
                  <label className="text-sm font-semibold text-slate-700">Reason for Visit</label>
                  <p className="text-slate-900 mt-1">{selectedBooking.reason}</p>
                </div>
              )}

              {/* Actions */}
              {selectedBooking.booking_status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => handleApprove(selectedBooking.id)}
                    disabled={processing}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-slate-400 flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={20} />
                    Approve Booking
                  </button>
                  <button
                    onClick={() => handleReject(selectedBooking.id)}
                    disabled={processing}
                    className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:bg-slate-400 flex items-center justify-center gap-2"
                  >
                    <XCircle size={20} />
                    Reject Booking
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OnlineBookings
