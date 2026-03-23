import { useEffect, useState } from 'react'
import { Users, Stethoscope, Calendar, Bed, RefreshCw, Download, Search, Filter, ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import StatCard from '../components/StatCard'
import { db, supabase } from '../lib/supabase'
import SkeletonLoader from '../components/SkeletonLoader'
import { useAuth } from '../context/AuthContext'

const Dashboard = ({ setCurrentPage }) => {
  const { userProfile } = useAuth()
  
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    bookAppointments: 0,
    roomAvailability: 0,
    patientTrend: '+0.0%',
    doctorTrend: '+0.0%',
    appointmentTrend: '+0.0%',
    roomTrend: '+0.0%'
  })
  const [loading, setLoading] = useState(true)
  const [patients, setPatients] = useState([])
  const [allPatients, setAllPatients] = useState([]) // Store all patients for filtering
  const [selectedDate, setSelectedDate] = useState(new Date()) // Changed to Date object
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [chartView, setChartView] = useState('monthly') // daily, weekly, monthly
  const [todayAppointments, setTodayAppointments] = useState([])
  const [selectedDateAppointments, setSelectedDateAppointments] = useState([]) // Appointments for selected date
  const [patientChartData, setPatientChartData] = useState([])
  const [patientsLastMonth, setPatientsLastMonth] = useState(0)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState('') // Search state
  const [filterOpen, setFilterOpen] = useState(false) // Filter dropdown state
  const [genderFilter, setGenderFilter] = useState('all') // Gender filter

  // Get chart data - returns patient chart data or empty array
  const getChartData = () => {
    return patientChartData.length > 0 ? patientChartData : []
  }

  // Format date as "Month DD, YYYY"
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  // Load appointments for a specific date
  const loadAppointmentsForDate = async (date) => {
    try {
      const dateString = date.toISOString().split('T')[0]
      const appointments = await db.getAppointments(dateString)
      setSelectedDateAppointments(appointments.slice(0, 4)) // Show first 4 appointments
    } catch (error) {
      console.error('Error loading appointments for date:', error)
      setSelectedDateAppointments([])
    }
  }

  // Handle date click in calendar
  const handleDateClick = async (day) => {
    if (!day) return
    
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    setSelectedDate(newDate)
    await loadAppointmentsForDate(newDate)
  }

  // Handle search input change
  const handleSearchChange = async (e) => {
    const query = e.target.value
    setSearchQuery(query)
    
    try {
      // Fetch patients with search term
      const searchResults = await db.getPatients(20, 0, query)
      
      // Apply gender filter if active
      let filteredResults = searchResults
      if (genderFilter !== 'all') {
        filteredResults = searchResults.filter(p => p.gender === genderFilter)
      }
      
      setPatients(filteredResults.slice(0, 4)) // Show first 4
    } catch (error) {
      console.error('Error searching patients:', error)
    }
  }

  // Handle filter button click
  const handleFilterClick = () => {
    setFilterOpen(!filterOpen)
  }

  // Handle gender filter change
  const handleGenderFilterChange = async (gender) => {
    setGenderFilter(gender)
    setFilterOpen(false)
    
    try {
      // Fetch patients with current search term
      const searchResults = await db.getPatients(20, 0, searchQuery)
      
      // Apply gender filter
      let filteredResults = searchResults
      if (gender !== 'all') {
        filteredResults = searchResults.filter(p => p.gender === gender)
      }
      
      setPatients(filteredResults.slice(0, 4)) // Show first 4
    } catch (error) {
      console.error('Error filtering patients:', error)
    }
  }

  // Handle refresh button click
  const handleRefresh = async () => {
    setLoading(true)
    await loadData()
    setLastUpdated(new Date())
  }

  // Handle CSV export
  const handleExport = () => {
    try {
      // Prepare CSV data
      const csvRows = []
      
      // Add header
      csvRows.push('Dashboard Export - ' + formatDate(new Date()))
      csvRows.push('')
      
      // Add stat cards section
      csvRows.push('STATISTICS')
      csvRows.push('Metric,Value')
      csvRows.push(`Total Patients,${stats.totalPatients}`)
      csvRows.push(`Total Doctors,${stats.totalDoctors}`)
      csvRows.push(`Monthly Appointments,${stats.bookAppointments}`)
      csvRows.push(`Room Availability,${stats.roomAvailability}`)
      csvRows.push('')
      
      // Add recent patients section
      csvRows.push('RECENT PATIENTS')
      csvRows.push('No,Name,Gender,Date of Birth,Location,Contact')
      patients.forEach((patient, index) => {
        const dob = new Date(patient.date_of_birth).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        })
        csvRows.push(`${index + 1},"${patient.first_name} ${patient.last_name}",${patient.gender},${dob},"${patient.address}",${patient.contact_number}`)
      })
      csvRows.push('')
      
      // Add today's appointments section
      csvRows.push("TODAY'S APPOINTMENTS")
      csvRows.push('Doctor,Patient,Time,Status')
      todayAppointments.forEach(apt => {
        const doctorName = apt.doctor ? `Dr. ${apt.doctor.first_name} ${apt.doctor.last_name}` : 'N/A'
        const patientName = apt.patient ? `${apt.patient.first_name} ${apt.patient.last_name}` : 'N/A'
        csvRows.push(`"${doctorName}","${patientName}",${apt.appointment_time},${apt.status}`)
      })
      
      // Create CSV content
      const csvContent = csvRows.join('\n')
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      const filename = `dashboard-export-${new Date().toISOString().split('T')[0]}.csv`
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error exporting CSV:', error)
      alert('Failed to export CSV. Please try again.')
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    // Reload chart data when view changes
    loadChartData()
  }, [chartView])

  useEffect(() => {
    // Load appointments for selected date when it changes
    if (selectedDate) {
      loadAppointmentsForDate(selectedDate)
    }
  }, [selectedDate])

  const loadChartData = async () => {
    try {
      let chartData = []
      
      if (chartView === 'daily') {
        // Last 7 days of patient registrations
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - 7)
        
        const { data, error } = await supabase
          .from('patients')
          .select('created_at')
          .gte('created_at', startDate.toISOString())
          .eq('status', 'Active')
          .order('created_at')
        
        if (error) throw error
        
        // Group by day
        const dailyData = {}
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        
        // Initialize last 7 days
        for (let i = 6; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          const dayKey = date.toISOString().split('T')[0]
          dailyData[dayKey] = { count: 0, label: days[date.getDay()] }
        }
        
        // Count patients per day
        if (data) {
          data.forEach(patient => {
            const dayKey = patient.created_at.split('T')[0]
            if (dailyData[dayKey]) {
              dailyData[dayKey].count++
            }
          })
        }
        
        chartData = Object.entries(dailyData).map(([, info]) => ({
          label: info.label,
          value: info.count,
          comparison: Math.floor(info.count * 0.8) // Simulated previous period
        }))
        
      } else if (chartView === 'weekly') {
        // Last 8 weeks of patient registrations
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - 8 * 7)
        
        const { data, error } = await supabase
          .from('patients')
          .select('created_at')
          .gte('created_at', startDate.toISOString())
          .eq('status', 'Active')
          .order('created_at')
        
        if (error) throw error
        
        // Group by week
        const weeklyData = {}
        
        // Initialize last 8 weeks
        for (let i = 7; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i * 7)
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay()) // Start of week (Sunday)
          const weekKey = weekStart.toISOString().split('T')[0]
          const weekLabel = `W${8 - i}`
          weeklyData[weekKey] = { count: 0, label: weekLabel }
        }
        
        // Count patients per week
        if (data) {
          data.forEach(patient => {
            const patientDate = new Date(patient.created_at)
            const weekStart = new Date(patientDate)
            weekStart.setDate(patientDate.getDate() - patientDate.getDay())
            const weekKey = weekStart.toISOString().split('T')[0]
            
            if (weeklyData[weekKey]) {
              weeklyData[weekKey].count++
            }
          })
        }
        
        chartData = Object.entries(weeklyData).map(([, info]) => ({
          label: info.label,
          value: info.count,
          comparison: Math.floor(info.count * 0.8) // Simulated previous period
        }))
        
      } else {
        // Monthly view (last 6 months) - existing implementation
        const monthlyPatientData = await db.getPatientGrowthData(6)
        chartData = Object.entries(monthlyPatientData).map(([month, count]) => {
          const date = new Date(month)
          return {
            label: date.toLocaleDateString('en-US', { month: 'short' }),
            value: count,
            comparison: Math.floor(count * 0.8) // Simulated previous period
          }
        })
      }
      
      // If no data, show empty chart with appropriate labels
      if (chartData.length === 0) {
        if (chartView === 'daily') {
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
          chartData = days.map(day => ({ label: day, value: 0, comparison: 0 }))
        } else if (chartView === 'weekly') {
          chartData = Array.from({ length: 8 }, (_, i) => ({ 
            label: `W${i + 1}`, 
            value: 0, 
            comparison: 0 
          }))
        } else {
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
          chartData = months.map(month => ({ label: month, value: 0, comparison: 0 }))
        }
      }
      
      setPatientChartData(chartData)
      
    } catch (error) {
      console.error('Error loading chart data:', error)
      // Set empty chart data with appropriate labels based on view
      let emptyChartData = []
      if (chartView === 'daily') {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        emptyChartData = days.map(day => ({ label: day, value: 0, comparison: 0 }))
      } else if (chartView === 'weekly') {
        emptyChartData = Array.from({ length: 8 }, (_, i) => ({ 
          label: `W${i + 1}`, 
          value: 0, 
          comparison: 0 
        }))
      } else {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
        emptyChartData = months.map(month => ({ label: month, value: 0, comparison: 0 }))
      }
      setPatientChartData(emptyChartData)
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Get current date ranges
      const now = new Date()
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()
      
      // Fetch main data with individual error handling
      const [
        statsData, 
        patientsData, 
        todayApts,
        roomData,
        patientsLastMonthData
      ] = await Promise.all([
        db.getStats().catch(err => {
          console.error('Error fetching stats:', err)
          return { totalPatients: 0, totalDoctors: 0, monthlyAppointments: 0, todayAppointments: 0 }
        }),
        db.getPatients(4, 0).catch(err => {
          console.error('Error fetching patients:', err)
          return []
        }),
        db.getTodayAppointments().catch(err => {
          console.error('Error fetching today\'s appointments:', err)
          return []
        }),
        db.getRoomAvailability().catch(err => {
          console.error('Error fetching room availability:', err)
          return { available: 0, total: 0 }
        }),
        db.getPatientStatistics().catch(err => {
          console.error('Error fetching patient statistics:', err)
          return 0
        })
      ])
      
      // Calculate trends by comparing current month to previous month
      const calculateTrend = (current, previous) => {
        if (previous === 0) return current > 0 ? '+100.0%' : '+0.0%'
        const change = ((current - previous) / previous) * 100
        const sign = change >= 0 ? '+' : ''
        return `${sign}${change.toFixed(1)}%`
      }
      
      // Fetch previous month's data for trend calculation with individual error handling
      const [prevPatients, prevDoctors, prevAppointments, prevRooms] = await Promise.all([
        supabase.from('patients').select('id', { count: 'exact', head: true })
          .eq('status', 'Active')
          .lt('created_at', currentMonthStart)
          .then(({ count, error }) => {
            if (error) throw error
            return { count }
          })
          .catch(err => {
            console.error('Error fetching previous patients count:', err)
            return { count: 0 }
          }),
        supabase.from('doctors').select('id', { count: 'exact', head: true })
          .eq('status', 'Active')
          .lt('created_at', currentMonthStart)
          .then(({ count, error }) => {
            if (error) throw error
            return { count }
          })
          .catch(err => {
            console.error('Error fetching previous doctors count:', err)
            return { count: 0 }
          }),
        supabase.from('appointments').select('id', { count: 'exact', head: true })
          .gte('appointment_date', previousMonthStart.split('T')[0])
          .lt('appointment_date', previousMonthEnd.split('T')[0])
          .then(({ count, error }) => {
            if (error) throw error
            return { count }
          })
          .catch(err => {
            console.error('Error fetching previous appointments count:', err)
            return { count: 0 }
          }),
        supabase.from('rooms').select('status')
          .then(({ data, error }) => {
            if (error) throw error
            // For rooms, we'll compare current availability to total rooms
            // This is a simplified trend calculation
            return { count: data?.length || 0 }
          })
          .catch(err => {
            console.error('Error fetching previous rooms count:', err)
            return { count: 0 }
          })
      ])
      
      // For doctors, scope the patient count to only their own patients
      let displayPatientCount = statsData.totalPatients || 0
      if (userProfile?.role === 'doctor' && userProfile?.doctor_id) {
        displayPatientCount = await db.getDoctorPatientCount(userProfile.doctor_id).catch(() => statsData.totalPatients || 0)
      }

      setStats({
        totalPatients: displayPatientCount,
        totalDoctors: statsData.totalDoctors || 0,
        bookAppointments: statsData.monthlyAppointments || 0,
        roomAvailability: roomData.available || 0,
        patientTrend: calculateTrend(displayPatientCount, prevPatients.count || 0),
        doctorTrend: calculateTrend(statsData.totalDoctors || 0, prevDoctors.count || 0),
        appointmentTrend: calculateTrend(statsData.monthlyAppointments || 0, prevAppointments.count || 0),
        roomTrend: calculateTrend(roomData.available || 0, Math.floor((prevRooms.count || 0) * 0.8)) // Estimate previous availability
      })

      setPatients(patientsData || [])
      setAllPatients(patientsData || []) // Store all patients
      setTodayAppointments((todayApts || []).slice(0, 4)) // Show first 4 appointments
      setPatientsLastMonth(patientsLastMonthData || 0)

      // Initialize selected date to today and load appointments
      const today = new Date()
      setSelectedDate(today)
      await loadAppointmentsForDate(today)

      // Load initial chart data
      await loadChartData()
      
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      // Set default values to prevent UI crashes
      setStats({
        totalPatients: 0,
        totalDoctors: 0,
        bookAppointments: 0,
        roomAvailability: 0,
        patientTrend: '+0.0%',
        doctorTrend: '+0.0%',
        appointmentTrend: '+0.0%',
        roomTrend: '+0.0%'
      })
      setPatients([])
      setTodayAppointments([])
      setPatientsLastMonth(0)
      setPatientChartData([])
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
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <SkeletonLoader variant="dashboard" message="Loading dashboard..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            Welcome back, {userProfile?.role === 'doctor' ? 'Dr. ' : ''}{userProfile?.full_name || 'User'}!
          </h1>
          <p className="text-sm text-slate-600">Here's what's happening at your clinic today</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>Last updated: {formatDate(lastUpdated)}</span>
            <button 
              onClick={handleRefresh}
              className="p-2 hover:bg-slate-100 rounded"
              aria-label="Refresh dashboard data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
            aria-label="Export data as CSV"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Patient"
          value={stats.totalPatients}
          trend={stats.patientTrend || "+0.0%"}
          icon={Users}
          iconBg="bg-gradient-to-br from-teal-400 to-teal-600"
        />
        <StatCard
          title="Total Doctor"
          value={stats.totalDoctors}
          trend={stats.doctorTrend || "+0.0%"}
          icon={Stethoscope}
          iconBg="bg-gradient-to-br from-purple-400 to-purple-600"
        />
        <StatCard
          title="Book Appointment"
          value={stats.bookAppointments}
          trend={stats.appointmentTrend || "+0.0%"}
          icon={Calendar}
          iconBg="bg-gradient-to-br from-teal-400 to-teal-600"
        />
        <StatCard
          title="Room Availability"
          value={stats.roomAvailability}
          trend={stats.roomTrend || "+0.0%"}
          icon={Bed}
          iconBg="bg-gradient-to-br from-pink-400 to-pink-600"
        />
      </div>

      {/* Patient Statistics & Appointment List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Statistics Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
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
                {patientsLastMonth}
              </span>
              <span className="text-sm text-emerald-600 flex items-center gap-1">
                ↑ Since last month
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
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Appointment List</h2>
            <button 
              onClick={() => loadAppointmentsForDate(selectedDate)}
              className="p-2 hover:bg-slate-100 rounded"
              aria-label="Refresh appointments"
            >
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
                  className="p-2 hover:bg-slate-100 rounded"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
                  className="p-2 hover:bg-slate-100 rounded"
                  aria-label="Next month"
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
                  onClick={() => handleDateClick(day)}
                  className={`aspect-square flex items-center justify-center text-sm rounded-lg transition-colors ${
                    day === selectedDate.getDate() && 
                    currentMonth.getMonth() === selectedDate.getMonth() &&
                    currentMonth.getFullYear() === selectedDate.getFullYear()
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
              <button className="text-sm text-teal-600 hover:text-teal-700" onClick={() => setCurrentPage?.('appointments')}>View All</button>
            </div>

            <div className="space-y-3">
              {selectedDateAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">No appointments scheduled for this date</p>
                </div>
              ) : (
                selectedDateAppointments.map(apt => (
                  <div key={apt.id} className="flex items-center gap-3">
                    <img 
                      src={apt.doctor?.first_name ? `https://ui-avatars.com/api/?name=${apt.doctor.first_name}+${apt.doctor.last_name}&background=14b8a6&color=fff` : 'https://ui-avatars.com/api/?name=Doctor&background=14b8a6&color=fff'} 
                      alt={apt.doctor ? `Dr. ${apt.doctor.first_name} ${apt.doctor.last_name}` : 'Doctor'} 
                      className="w-10 h-10 rounded-full" 
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {apt.doctor ? `Dr. ${apt.doctor.first_name} ${apt.doctor.last_name}` : 'Doctor'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {apt.patient ? `${apt.patient.first_name} ${apt.patient.last_name}` : 'Patient'} • {apt.appointment_time}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      apt.status === 'Completed' ? 'bg-green-100 text-green-700' :
                      apt.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                      apt.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {apt.status}
                    </span>
                  </div>
                ))
              )}
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
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="relative">
                <button 
                  onClick={handleFilterClick}
                  className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
                >
                  <Filter className="w-4 h-4" />
                  Filter
                </button>
                
                {/* Filter Dropdown */}
                {filterOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                    <div className="p-2">
                      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-2 py-1">Gender</p>
                      <button
                        onClick={() => handleGenderFilterChange('all')}
                        className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-slate-50 ${
                          genderFilter === 'all' ? 'bg-teal-50 text-teal-700 font-medium' : 'text-slate-700'
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => handleGenderFilterChange('Male')}
                        className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-slate-50 ${
                          genderFilter === 'Male' ? 'bg-teal-50 text-teal-700 font-medium' : 'text-slate-700'
                        }`}
                      >
                        Male
                      </button>
                      <button
                        onClick={() => handleGenderFilterChange('Female')}
                        className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-slate-50 ${
                          genderFilter === 'Female' ? 'bg-teal-50 text-teal-700 font-medium' : 'text-slate-700'
                        }`}
                      >
                        Female
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
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
              {patients.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">No patients registered yet</p>
                  </td>
                </tr>
              ) : (
                patients.map((patient, index) => (
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
