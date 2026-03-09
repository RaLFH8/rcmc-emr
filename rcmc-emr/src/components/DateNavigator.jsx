import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

const DateNavigator = ({ selectedWeek, onWeekChange, onTodayClick }) => {
  // Get Monday of the week
  const getWeekStart = (date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    d.setDate(d.getDate() + diff)
    d.setHours(0, 0, 0, 0)
    return d
  }

  // Get Saturday of the week
  const getWeekEnd = (date) => {
    const start = getWeekStart(date)
    const end = new Date(start)
    end.setDate(start.getDate() + 5) // Saturday is 5 days after Monday
    return end
  }

  // Get first Monday of a month
  const getFirstMondayOfMonth = (year, month) => {
    const firstDay = new Date(year, month, 1)
    const dayOfWeek = firstDay.getDay()
    const diff = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7
    const firstMonday = new Date(year, month, 1 + diff)
    
    // If first Monday is after the 7th, use the Monday before the 1st
    if (firstMonday.getDate() > 7) {
      firstMonday.setDate(firstMonday.getDate() - 7)
    }
    
    return firstMonday
  }

  const handlePreviousWeek = () => {
    const newWeek = new Date(selectedWeek)
    newWeek.setDate(newWeek.getDate() - 7)
    onWeekChange(newWeek)
  }

  const handleNextWeek = () => {
    const newWeek = new Date(selectedWeek)
    newWeek.setDate(newWeek.getDate() + 7)
    onWeekChange(newWeek)
  }

  const handleMonthChange = (e) => {
    const [year, month] = e.target.value.split('-').map(Number)
    const firstMonday = getFirstMondayOfMonth(year, month - 1) // month is 0-indexed
    onWeekChange(firstMonday)
  }

  const weekStart = getWeekStart(selectedWeek)
  const weekEnd = getWeekEnd(selectedWeek)

  // Format week range display
  const formatWeekRange = () => {
    const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' })
    const startDay = weekStart.getDate()
    const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' })
    const endDay = weekEnd.getDate()
    const year = weekEnd.getFullYear()

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} - ${endDay}, ${year}`
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`
    }
  }

  // Get current month value for selector
  const getCurrentMonthValue = () => {
    const year = weekStart.getFullYear()
    const month = (weekStart.getMonth() + 1).toString().padStart(2, '0')
    return `${year}-${month}`
  }

  // Generate month options (current year ± 1 year)
  const generateMonthOptions = () => {
    const options = []
    const currentYear = new Date().getFullYear()
    
    for (let year = currentYear - 1; year <= currentYear + 1; year++) {
      for (let month = 0; month < 12; month++) {
        const date = new Date(year, month, 1)
        const value = `${year}-${(month + 1).toString().padStart(2, '0')}`
        const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        options.push({ value, label })
      }
    }
    
    return options
  }

  return (
    <div className="flex items-center gap-3">
      {/* Week Range Display */}
      <div className="flex items-center gap-2 bg-teal-50 px-4 py-2 rounded-lg">
        <Calendar size={18} className="text-teal-600" />
        <span className="font-semibold text-slate-900 text-sm">
          {formatWeekRange()}
        </span>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={handlePreviousWeek}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          title="Previous Week"
        >
          <ChevronLeft size={20} className="text-slate-600" />
        </button>
        <button
          onClick={onTodayClick}
          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-semibold text-slate-700 transition-colors"
        >
          Today
        </button>
        <button
          onClick={handleNextWeek}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          title="Next Week"
        >
          <ChevronRight size={20} className="text-slate-600" />
        </button>
      </div>

      {/* Month Selector */}
      <select
        value={getCurrentMonthValue()}
        onChange={handleMonthChange}
        className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
      >
        {generateMonthOptions().map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default DateNavigator
