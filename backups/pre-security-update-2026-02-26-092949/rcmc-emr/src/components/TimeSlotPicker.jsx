import { useState, useEffect } from 'react'
import { Clock, CheckCircle } from 'lucide-react'
import { db } from '../lib/supabase'

const TimeSlotPicker = ({ selectedDate, selectedDoctor, onSelectSlot, selectedSlot }) => {
  const [availableSlots, setAvailableSlots] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (selectedDate && selectedDoctor) {
      loadAvailableSlots()
    }
  }, [selectedDate, selectedDoctor])

  const loadAvailableSlots = async () => {
    try {
      setLoading(true)
      
      // Get existing appointments for this doctor and date
      const appointments = await db.getAppointments(selectedDate)
      const bookedSlots = appointments
        .filter(apt => apt.doctor_id?.toString() === selectedDoctor && apt.status !== 'Cancelled')
        .map(apt => apt.appointment_time)

      // Generate time slots (8 AM - 5 PM, 30-minute intervals)
      const slots = []
      const startHour = 8
      const endHour = 17
      
      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute of [0, 30]) {
          const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
          const isBooked = bookedSlots.includes(timeStr)
          
          slots.push({
            time: timeStr,
            display: formatTime(timeStr),
            available: !isBooked
          })
        }
      }

      setAvailableSlots(slots)
    } catch (error) {
      console.error('Error loading slots:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (time) => {
    const [hour, minute] = time.split(':')
    const h = parseInt(hour)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h
    return `${displayHour}:${minute} ${ampm}`
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto"></div>
        <p className="text-sm text-slate-600 mt-2">Loading available slots...</p>
      </div>
    )
  }

  if (!selectedDate || !selectedDoctor) {
    return (
      <div className="text-center py-8 text-slate-500">
        <Clock size={48} className="mx-auto mb-2 text-slate-300" />
        <p>Please select a date and doctor first</p>
      </div>
    )
  }

  const availableCount = availableSlots.filter(s => s.available).length

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900">Select Time Slot</h3>
        <span className="text-sm text-slate-600">
          {availableCount} slots available
        </span>
      </div>

      {availableCount === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-lg">
          <p className="text-slate-600">No available slots for this date</p>
          <p className="text-sm text-slate-500 mt-1">Please select a different date</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto p-2">
          {availableSlots.map((slot) => (
            <button
              key={slot.time}
              type="button"
              disabled={!slot.available}
              onClick={() => onSelectSlot(slot.time)}
              className={`
                p-3 rounded-lg text-sm font-semibold transition-all
                ${!slot.available 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed line-through' 
                  : selectedSlot === slot.time
                  ? 'bg-teal-500 text-white shadow-md'
                  : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-teal-500 hover:text-teal-600'
                }
              `}
            >
              <div className="flex items-center justify-center gap-1">
                {selectedSlot === slot.time && <CheckCircle size={14} />}
                {slot.display}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default TimeSlotPicker
