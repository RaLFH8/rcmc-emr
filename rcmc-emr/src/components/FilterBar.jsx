import { Filter, Download } from 'lucide-react'
import DateNavigator from './DateNavigator'

const FilterBar = ({
  viewMode,
  selectedWeek,
  selectedDoctor,
  statusFilter,
  doctors,
  appointmentCount,
  onViewModeChange,
  onWeekChange,
  onTodayClick,
  onDoctorChange,
  onStatusChange,
  onExport
}) => {
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
            Calendar View
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
