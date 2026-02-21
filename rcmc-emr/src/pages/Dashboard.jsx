import { useEffect, useState } from 'react'
import { Users, Stethoscope, Calendar, Bed, RefreshCw, Download, Search, Filter, ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import StatCard from '../components/StatCard'
import { db } from '../lib/supabase'

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPatients: 432,
    totalDoctors: 536,
    bookAppointments: 149,
    roomAvailability: 120
  })
  const [loading, setLoading] = useState(true)
  const [patients, setPatients] = useState([])
  const [selectedDate, setSelectedDate] = useState(12)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [chartView, setChartView] = useState('monthly') // daily, weekly, monthly

  // Daily chart data (last 7 days)
  const dailyChartData = [
    { label: 'Mon', value: 12, comparison: 10 },
    { label: 'Tue', value: 15, comparison: 13 },
    { label: 'Wed', value: 10, comparison: 8 },
    { label: 'Thu', value: 18, comparison: 14 },
    { label: 'Fri', value: 20, comparison: 16 },
    { label: 'Sat', value: 16, comparison: 12 },
    { label: 'Sun', value: 14, comparison: 11 },
  ]

  // Weekly chart data (last 7 weeks)
  const weeklyChartData = [
    { label: 'Week 1', value: 85, comparison: 75 },
    { label: 'Week 2', value: 92, comparison: 80 },
    { label: 'Week 3', value: 78, comparison: 70 },
    { label: 'Week 4', value: 95, comparison: 82 },
    { label: 'Week 5', value: 88, comparison: 78 },
    { label: 'Week 6', value: 90, comparison: 85 },
    { label: 'Week 7', value: 98, comparison: 88 },
  ]

  // Monthly chart data (last 7 months)
  const monthlyChartData = [
    { label: 'Jan', value: 45, comparison: 38 },
    { label: 'Feb', value: 50, comparison: 42 },
    { label: 'Mar', value: 35, comparison: 28 },
    { label: 'April', value: 58, comparison: 37 },
    { label: 'May', value: 62, comparison: 48 },
    { label: 'Jun', value: 55, comparison: 45 },
    { label: 'Jul', value: 68, comparison: 52 },
  ]

  // Get current chart data based on view
  const getChartData = () => {
    switch (chartView) {
      case 'daily':
        return dailyChartData
      case 'weekly':
        return weeklyChartData
      case 'monthly':
      default:
        return monthlyChartData
    }
  }

  // Schedule data
  const scheduleData = [
    { id: 1, name: 'Dr. Ashlynn Kenter', date: 'May 12, 2025', time: '09:10 pm', avatar: 'https://ui-avatars.com/api/?name=Ashlynn+Kenter&background=14b8a6&color=fff' },
    { id: 2, name: 'Dr. Charlie Gouse', date: 'May 22, 2025', time: '08:10 pm', avatar: 'https://ui-avatars.com/api/?name=Charlie+Gouse&background=3b82f6&color=fff' },
    { id: 3, name: 'Dr. Justin Bergson', date: 'May 12, 2025', time: '10:00 pm', avatar: 'https://ui-avatars.com/api/?name=Justin+Bergson&background=8b5cf6&color=fff' },
    { id: 4, name: 'Dr. Madelyn Geldt', date: 'May 12, 2025', time: '09:00 pm', avatar: 'https://ui-avatars.com/api/?name=Madelyn+Geldt&background=ec4899&color=fff' },
  ]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const statsData = await db.getStats()
      setStats({
        totalPatients: statsData.totalPatients,
        totalDoctors: statsData.totalDoctors,
        bookAppointments: statsData.monthlyAppointments,
        roomAvailability: 120 // Static for now
      })

      const patientsData = await db.getPatients(4, 0)
      setPatients(patientsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calendar generation
  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    const days = []
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    return days
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Welcome back, Dr. Kierra Carder!</h1>
          <p className="text-sm text-slate-600">Here's what's happening at your clinic today</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>Last updated: April 16, 2025</span>
            <button className="p-1 hover:bg-slate-100 rounded">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-6">
        <StatCard
          title="Total Patient"
          value={stats.totalPatients}
          trend="11.4%"
          icon={Users}
          iconBg="bg-gradient-to-br from-teal-400 to-teal-600"
        />
        <StatCard
          title="Total Doctor"
          value={stats.totalDoctors}
          trend="-10.5%"
          icon={Stethoscope}
          iconBg="bg-gradient-to-br from-purple-400 to-purple-600"
        />
        <StatCard
          title="Book Appointment"
          value={stats.bookAppointments}
          trend="14.6%"
          icon={Calendar}
          iconBg="bg-gradient-to-br from-teal-400 to-teal-600"
        />
        <StatCard
          title="Room Availability"
          value={stats.roomAvailability}
          trend="-16.8%"
          icon={Bed}
          iconBg="bg-gradient-to-br from-pink-400 to-pink-600"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Patient Statistics Chart */}
        <div className="col-span-2 bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Patient Statistics</h2>
            <select 
              value={chartView}
              onChange={(e) => setChartView(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-slate-700"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="mb-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">
                {chartView === 'daily' ? '14' : chartView === 'weekly' ? '98' : '73'}
              </span>
              <span className="text-sm text-emerald-600 flex items-center gap-1">
                ↑ 0.10% since last {chartView === 'daily' ? 'day' : chartView === 'weekly' ? 'week' : 'month'}
              </span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={getChartData()}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5eead4" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#5eead4" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis 
                dataKey="label" 
                stroke="#94a3b8" 
                style={{ fontSize: '13px' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                stroke="#94a3b8" 
                style={{ fontSize: '13px' }}
                axisLine={false}
                tickLine={false}
                ticks={chartView === 'daily' ? [0, 5, 10, 15, 20] : [0, 20, 40, 60, 100]}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                          <Users className="w-4 h-4 text-teal-500" />
                          <span className="text-sm font-semibold text-slate-900">Total Patient</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-8">
                            <span className="text-xs text-slate-600">Sept 29, 2024</span>
                            <span className="text-sm font-bold text-slate-900">{payload[0].value}</span>
                          </div>
                          <div className="flex items-center justify-between gap-8">
                            <span className="text-xs text-slate-600">Sept 29, 2024</span>
                            <span className="text-sm font-bold text-slate-900">{payload[0].payload.comparison}</span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              {/* Comparison line (dashed) */}
              <Area
                type="monotone"
                dataKey="comparison"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="none"
                dot={false}
              />
              {/* Main line (solid) */}
              <Area
                type="monotone"
                dataKey="value"
                stroke="#14b8a6"
                strokeWidth={3}
                fill="url(#colorValue)"
                dot={{ fill: '#14b8a6', strokeWidth: 2, r: 4, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#14b8a6', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Appointment List */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Appointment List</h2>
            <button className="p-1 hover:bg-slate-100 rounded">
              <RefreshCw className="w-4 h-4 text-slate-600" />
            </button>
          </div>

          {/* Calendar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">{monthNames[currentMonth.getMonth()]}, {currentMonth.getFullYear()}</h3>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
                  className="p-1 hover:bg-slate-100 rounded"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
                  className="p-1 hover:bg-slate-100 rounded"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-center text-xs font-medium text-slate-500 py-1">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth(currentMonth).map((day, index) => (
                <button
                  key={index}
                  onClick={() => day && setSelectedDate(day)}
                  className={`aspect-square flex items-center justify-center text-sm rounded-lg transition-colors ${
                    day === selectedDate
                      ? 'bg-teal-500 text-white font-semibold'
                      : day
                      ? 'hover:bg-slate-100 text-slate-700'
                      : ''
                  }`}
                  disabled={!day}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Schedule */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900">Schedule</h3>
              <button className="text-sm text-teal-600 hover:text-teal-700">View All</button>
            </div>

            <div className="space-y-3">
              {scheduleData.map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <img src={item.avatar} alt={item.name} className="w-10 h-10 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.date} • {item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Patients Table */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Recent Patients</h2>
              <p className="text-sm text-slate-500">Real-time inventory status across all locations</p>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search"
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">No</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Item</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Gender</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Date of Birth</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Location</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Contact</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient, index) => (
                <tr key={patient.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6 text-sm text-slate-900">{index + 1}</td>
                  <td className="py-4 px-6 text-sm text-slate-900 font-medium">{patient.first_name} {patient.last_name}</td>
                  <td className="py-4 px-6 text-sm text-slate-600">{patient.gender}</td>
                  <td className="py-4 px-6 text-sm text-slate-600">{new Date(patient.date_of_birth).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td className="py-4 px-6 text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate max-w-[150px]">{patient.address.substring(0, 20)}...</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-600">{patient.contact_number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
