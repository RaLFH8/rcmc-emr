import { Calendar as CalendarIcon } from 'lucide-react'
import { memo } from 'react'

const CalendarView = memo(({ appointments, selectedWeek, onAppointmentClick, currentTime, hasFilters }) => {
  // Get week days (Monday through Saturday)
  const getWeekDays = (startDate) => {
    const days = []
    const start = new Date(startDate)
    
    // Find Monday of the week
    const dayOfWeek = start.getDay()
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Adjust to Monday
    start.setDate(start.getDate() + diff)
    
    // Generate 6 days (Mon-Sat)
    for (let i = 0; i < 6; i++) {
      const day = new Date(start)
      day.setDate(start.getDate() + i)
      days.push(day)
    }
    
    return days
  }

  // Get time slots (9 AM - 6 PM)
  const getTimeSlots = () => {
    const slots = []
    for (let hour = 9; hour <= 18; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`)
    }
    return slots
  }

  // Get appointments for a specific day and time slot
  const getAppointmentsForSlot = (day, time) => {
    const dateStr = day.toISOString().split('T')[0]
    return appointments.filter(apt => {
      return apt.appointment_date === dateStr && apt.appointment_time === time
    })
  }

  // Check if a time slot is the current time
  const isCurrentTimeSlot = (day, time) => {
    if (!currentTime) return false
    
    const now = new Date(currentTime)
    const slotDate = new Date(day)
    
    // Check if same date
    if (slotDate.toDateString() !== now.toDateString()) return false
    
    // Check if current hour matches slot hour
    const slotHour = parseInt(time.split(':')[0])
    const currentHour = now.getHours()
    
    // Only highlight if within business hours
    if (currentHour < 9 || currentHour > 18) return false
    
    return currentHour === slotHour
  }

  const weekDays = getWeekDays(selectedWeek)
  const timeSlots = getTimeSlots()

  if (appointments.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <CalendarIcon size={48} className="mx-auto text-slate-300 mb-4" />
        <p className="text-slate-600 text-lg font-semibold mb-2">
          {hasFilters ? 'No appointments match the selected filters' : 'No appointments scheduled for this week'}
        </p>
        <p className="text-slate-500 text-sm">
          {hasFilters ? 'Try adjusting your filters to see more results' : 'Click "New Appointment" to schedule one'}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Desktop View - Full 6-day grid */}
      <div className="hidden lg:block overflow-x-auto">
        <div className="min-w-[1200px]">
          {/* Calendar Header - Day Names and Dates */}
          <div className="grid grid-cols-[100px_repeat(6,1fr)] border-b-2 border-slate-200">
            <div className="bg-slate-100 p-4"></div>
            {weekDays.map((day, index) => (
              <div key={index} className="bg-teal-50 border-l border-slate-200 p-4 text-center">
                <p className="font-bold text-slate-900">
                  {day.toLocaleDateString('en-US', { weekday: 'long' })}
                </p>
                <p className="text-sm text-slate-600">
                  {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
            ))}
          </div>

          {/* Calendar Grid - Time Slots and Appointments */}
          {timeSlots.map((time, timeIndex) => (
            <div 
              key={time} 
              className={`grid grid-cols-[100px_repeat(6,1fr)] border-b border-slate-100 ${
                timeIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50'
              }`}
            >
              {/* Time Label */}
              <div className="p-4 flex items-start justify-center font-semibold text-slate-600 border-r border-slate-200">
                {time}
              </div>

              {/* Day Cells */}
              {weekDays.map((day, dayIndex) => {
                const slotAppointments = getAppointmentsForSlot(day, time)
                const isCurrent = isCurrentTimeSlot(day, time)
                
                return (
                  <div
                    key={dayIndex}
                    data-day={dayIndex}
                    data-time={timeIndex}
                    className={`border-l border-slate-200 p-2 min-h-[80px] ${
                      isCurrent ? 'bg-yellow-50' : ''
                    }`}
                  >
                    {slotAppointments.length > 0 && (
                      <div className="space-y-2">
                        {slotAppointments.map((apt) => (
                          <div
                            key={apt.id}
                            data-testid="appointment-card"
                            data-status={apt.status}
                            onClick={() => onAppointmentClick && onAppointmentClick(apt)}
                            className="cursor-pointer"
                          >
                            <AppointmentCard appointment={apt} viewMode="calendar" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Tablet View - 3 days per row (Mon-Wed, Thu-Sat) */}
      <div className="hidden md:block lg:hidden">
        {/* First 3 days */}
        <div className="border-b-4 border-slate-300 mb-4">
          <div className="grid grid-cols-[80px_repeat(3,1fr)] border-b-2 border-slate-200">
            <div className="bg-slate-100 p-3"></div>
            {weekDays.slice(0, 3).map((day, index) => (
              <div key={index} className="bg-teal-50 border-l border-slate-200 p-3 text-center">
                <p className="font-bold text-slate-900 text-sm">
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </p>
                <p className="text-xs text-slate-600">
                  {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
          {timeSlots.map((time, timeIndex) => (
            <div 
              key={time} 
              className={`grid grid-cols-[80px_repeat(3,1fr)] border-b border-slate-100 ${
                timeIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50'
              }`}
            >
              <div className="p-3 flex items-start justify-center font-semibold text-slate-600 text-sm border-r border-slate-200">
                {time}
              </div>
              {weekDays.slice(0, 3).map((day, dayIndex) => {
                const slotAppointments = getAppointmentsForSlot(day, time)
                const isCurrent = isCurrentTimeSlot(day, time)
                return (
                  <div
                    key={dayIndex}
                    className={`border-l border-slate-200 p-2 min-h-[70px] ${
                      isCurrent ? 'bg-yellow-50' : ''
                    }`}
                  >
                    {slotAppointments.length > 0 && (
                      <div className="space-y-1">
                        {slotAppointments.map((apt) => (
                          <div
                            key={apt.id}
                            onClick={() => onAppointmentClick && onAppointmentClick(apt)}
                            className="cursor-pointer"
                          >
                            <AppointmentCard appointment={apt} viewMode="calendar" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Last 3 days */}
        <div>
          <div className="grid grid-cols-[80px_repeat(3,1fr)] border-b-2 border-slate-200">
            <div className="bg-slate-100 p-3"></div>
            {weekDays.slice(3, 6).map((day, index) => (
              <div key={index} className="bg-teal-50 border-l border-slate-200 p-3 text-center">
                <p className="font-bold text-slate-900 text-sm">
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </p>
                <p className="text-xs text-slate-600">
                  {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
          {timeSlots.map((time, timeIndex) => (
            <div 
              key={time} 
              className={`grid grid-cols-[80px_repeat(3,1fr)] border-b border-slate-100 ${
                timeIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50'
              }`}
            >
              <div className="p-3 flex items-start justify-center font-semibold text-slate-600 text-sm border-r border-slate-200">
                {time}
              </div>
              {weekDays.slice(3, 6).map((day, dayIndex) => {
                const slotAppointments = getAppointmentsForSlot(day, time)
                const isCurrent = isCurrentTimeSlot(day, time)
                return (
                  <div
                    key={dayIndex}
                    className={`border-l border-slate-200 p-2 min-h-[70px] ${
                      isCurrent ? 'bg-yellow-50' : ''
                    }`}
                  >
                    {slotAppointments.length > 0 && (
                      <div className="space-y-1">
                        {slotAppointments.map((apt) => (
                          <div
                            key={apt.id}
                            onClick={() => onAppointmentClick && onAppointmentClick(apt)}
                            className="cursor-pointer"
                          >
                            <AppointmentCard appointment={apt} viewMode="calendar" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile View - 1 day per row */}
      <div className="block md:hidden">
        {weekDays.map((day, dayIdx) => (
          <div key={dayIdx} className="border-b-4 border-slate-300 mb-4 last:mb-0">
            <div className="bg-teal-50 border-b-2 border-slate-200 p-3 text-center">
              <p className="font-bold text-slate-900">
                {day.toLocaleDateString('en-US', { weekday: 'long' })}
              </p>
              <p className="text-sm text-slate-600">
                {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
            {timeSlots.map((time, timeIndex) => {
              const slotAppointments = getAppointmentsForSlot(day, time)
              const isCurrent = isCurrentTimeSlot(day, time)
              
              return (
                <div 
                  key={time} 
                  className={`flex border-b border-slate-100 ${
                    timeIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                  } ${isCurrent ? 'bg-yellow-50' : ''}`}
                >
                  <div className="w-16 p-2 flex items-start justify-center font-semibold text-slate-600 text-xs border-r border-slate-200">
                    {time}
                  </div>
                  <div className="flex-1 p-2 min-h-[60px]">
                    {slotAppointments.length > 0 && (
                      <div className="space-y-1">
                        {slotAppointments.map((apt) => (
                          <div
                            key={apt.id}
                            onClick={() => onAppointmentClick && onAppointmentClick(apt)}
                            className="cursor-pointer"
                          >
                            <AppointmentCard appointment={apt} viewMode="calendar" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
})

CalendarView.displayName = 'CalendarView'

// AppointmentCard component for calendar view
const AppointmentCard = memo(({ appointment, viewMode }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'Confirmed':
        return 'bg-green-100 text-green-700 border-green-300'
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'Completed':
        return 'bg-teal-100 text-teal-700 border-teal-300'
      case 'Cancelled':
        return 'bg-red-100 text-red-700 border-red-300'
      case 'No Show':
        return 'bg-gray-100 text-gray-700 border-gray-300'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300'
    }
  }

  const renderBookingSourceBadge = (bookingSource) => {
    if (bookingSource === 'online') {
      return (
        <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-semibold" title="Online Booking">
          🌐 Online
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-semibold" title="Walk-in">
          👤 Walk-in
        </span>
      )
    }
  }

  return (
    <div className={`rounded-lg p-2 border-2 ${getStatusColor(appointment.status)} hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between gap-1 mb-1">
        <p className="text-xs font-semibold truncate flex-1">
          {appointment.patient?.first_name} {appointment.patient?.last_name}
        </p>
        {renderBookingSourceBadge(appointment.booking_source || 'walk-in')}
      </div>
      {viewMode === 'calendar' && (
        <p className="text-xs text-slate-600">{appointment.appointment_time}</p>
      )}
      <p className="text-xs truncate mt-1">{appointment.reason}</p>
      <div className="flex items-center gap-1 mt-1">
        <span className={`text-xs px-1.5 py-0.5 rounded ${getStatusColor(appointment.status)}`}>
          {appointment.status}
        </span>
      </div>
    </div>
  )
})

AppointmentCard.displayName = 'AppointmentCard'

export default CalendarView
