import { Filter, Download, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import DateNavigator from './DateNavigator'

const FilterBar = ({
  viewMode,
  selectedWeek,
  selectedDate,
  selectedDoctor,
  statusFilter,
  doctors,
  appointmentCount,
  onViewModeChange,
  onWeekChange,
  onTodayClick,
  onDoctorChange,
  onStatusChange,
  onDateChange,
  onExport
}) => {
  // Parse YYYY-MM-DD safely without timezone shifting
  const parseDateLocal = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d)
  }

  const toDateStr = (d) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const handlePrevDay = () => {
    if (!selectedDate) return
    const d = parseDateLocal(selectedDate)
    d.setDate(d.getDate() - 1)
    onDateChange?.(toDateStr(d))
  }

  const handleNextDay = () => {
    if (!selectedDate) return
    const d = parseDateLocal(selectedDate)
    d.setDate(d.getDate() + 1)
    onDateChange?.(toDateStr(d))
  }

  const handleTodayQueue = () => {
    onDateChange?.(toDateStr(new Date()))
  }

  const formatQueueDate = () => {
    if (!selectedDate) return ''
    const d = parseDateLocal(selectedDate)
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  }
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex flex-wrap items-center gap-4">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => onViewModeChange('calendar')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
              viewMode === 'calendar' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-600'
            }`}
          >
            Schedule
          </button>
          <button
            onClick={() => onViewModeChange('queue')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
              viewMode === 'queue' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-600'
            }`}
          >
            Patient Queue
          </button>
        </div>

        {/* Date Navigator (Calendar View only) */}
        {viewMode === 'calendar' && (
          <DateNavigator 
            selectedWeek={selectedWeek}
            onWeekChange={onWeekChange}
            onTodayClick={onTodayClick}
          />
        )}

        {/* Date Navigator (Queue View only) */}
        {viewMode === 'queue' && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-teal-50 px-4 py-2 rounded-lg">
              <Calendar size={18} className="text-teal-600" />
              <span className="font-semibold text-slate-900 text-sm">{formatQueueDate()}</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={handlePrevDay} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Previous Day">
                <ChevronLeft size={20} className="text-slate-600" />
              </button>
              <button onClick={handleTodayQueue} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-semibold text-slate-700 transition-colors">
                Today
              </button>
              <button onClick={handleNextDay} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Next Day">
                <ChevronRight size={20} className="text-slate-600" />
              </button>
            </div>
            <input
              type="date"
              value={selectedDate || ''}
              onChange={(e) => onDateChange?.(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>
        )}

        {/* Doctor Filter */}
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-slate-600" />
          <select
            value={selectedDoctor}
            onChange={(e) => onDoctorChange(e.target.value)}
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

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
        >
          <option value="all">All Status</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Confirmed">Confirmed</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
          <option value="No Show">No Show</option>
        </select>

        {/* Export Button (Calendar View only) */}
        {viewMode === 'calendar' && onExport && (
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-semibold text-slate-700 transition-colors"
            title="Export to CSV"
          >
            <Download size={18} />
            Export
          </button>
        )}

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Appointment Count */}
        <div className="text-sm text-slate-600">
          <span className="font-semibold">{appointmentCount}</span> appointments
        </div>
      </div>
    </div>
  )
}

export default FilterBar
