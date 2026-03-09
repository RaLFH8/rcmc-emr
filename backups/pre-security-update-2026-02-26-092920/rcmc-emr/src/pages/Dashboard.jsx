import { useEffect, useState } from 'react'
import { Users, Stethoscope, Calendar, Bed, RefreshCw, Download, Search, Filter, ChevronLeft, ChevronRight, MapPin, DollarSign, TrendingUp, ShoppingCart, Pill } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts'
import StatCard from '../components/StatCard'
import { db } from '../lib/supabase'
import HeartbeatLoader from '../components/HeartbeatLoader'
import { useAuth } from '../context/AuthContext'

const Dashboard = () => {
  const { userProfile } = useAuth()
  const isAdmin = userProfile?.role === 'admin'
  
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    bookAppointments: 0,
    roomAvailability: 0
  })
  const [loading, setLoading] = useState(true)
  const [patients, setPatients] = useState([])
  const [selectedDate, setSelectedDate] = useState(12)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [chartView, setChartView] = useState('monthly') // daily, weekly, monthly
  const [showPerformanceReport, setShowPerformanceReport] = useState(false)
  const [doctors, setDoctors] = useState([])
  const [doctorPerformance, setDoctorPerformance] = useState([])
  const [todayAppointments, setTodayAppointments] = useState([])
  const [patientChartData, setPatientChartData] = useState([])
  const [patientsLastMonth, setPatientsLastMonth] = useState(0)
  const [topServices, setTopServices] = useState([])
  const [topMedicines, setTopMedicines] = useState([])
  const [salesStats, setSalesStats] = useState({
    totalRevenue: 0,
    servicesRevenue: 0,
    medicineRevenue: 0,
    roomRevenue: 0,
    monthlyGrowth: 0,
    topSellingService: 'N/A',
    topSellingMedicine: 'N/A'
  })

  // Sales by category (for pie chart) - Now loaded from database
  const [salesByCategory, setSalesByCategory] = useState([
    { name: 'Services', value: 0, color: '#14b8a6' },
    { name: 'Medicines', value: 0, color: '#8b5cf6' },
    { name: 'Rooms', value: 0, color: '#f59e0b' },
  ])

  // Monthly sales trend - Now loaded from database
  const [monthlySalesData, setMonthlySalesData] = useState([])

  // Get chart data - returns patient chart data or empty array
  const getChartData = () => {
    return patientChartData.length > 0 ? patientChartData : []
  }

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [
        statsData, 
        patientsData, 
        doctorsData, 
        appointmentsData, 
        todayApts,
        roomData,
        patientsLastMonthData,
        topServicesData,
        topMedicinesData
      ] = await Promise.all([
        db.getStats(),
        db.getPatients(4, 0),
        db.getDoctors(),
        db.getAppointments(),
        db.getTodayAppointments(),
        db.getRoomAvailability(),
        db.getPatientStatistics(),
        db.getTopServices(5),
        db.getTopMedicines(5)
      ])
      
      setStats({
        totalPatients: statsData.totalPatients,
        totalDoctors: statsData.totalDoctors,
        bookAppointments: statsData.monthlyAppointments,
        roomAvailability: roomData.available
      })

      setPatients(patientsData)
      setDoctors(doctorsData)
      setTodayAppointments(todayApts.slice(0, 4)) // Show first 4 appointments
      setPatientsLastMonth(patientsLastMonthData)
      setTopServices(topServicesData.length > 0 ? topServicesData : [
        { name: 'No data yet', sales: 0, count: 0 }
      ])
      setTopMedicines(topMedicinesData.length > 0 ? topMedicinesData : [
        { name: 'No data yet', sales: 0, count: 0 }
      ])

      // Calculate doctor performance from real data
      const today = new Date().toISOString().split('T')[0]
      const performance = doctorsData.map(doctor => {
        // Count appointments for this doctor
        const doctorAppointments = appointmentsData.filter(apt => apt.doctor_id === doctor.id)
        const todayAppointments = doctorAppointments.filter(apt => apt.appointment_date === today)
        
        return {
          id: doctor.id,
          name: `Dr. ${doctor.first_name} ${doctor.last_name}`,
          specialization: doctor.specialization,
          patientCount: doctorAppointments.length,
          appointmentsToday: todayAppointments.length,
          avgConsultTime: '25 min', // Static for now
          satisfaction: 4.8, // Static for now
          avatar: `https://ui-avatars.com/api/?name=${doctor.first_name}+${doctor.last_name}&background=14b8a6&color=fff`
        }
      })
      
      setDoctorPerformance(performance)

      // Generate patient growth chart data (last 6 months)
      const monthlyPatientData = await db.getPatientGrowthData(6)
      const chartData = Object.entries(monthlyPatientData).map(([month, count]) => {
        const date = new Date(month)
        return {
          label: date.toLocaleDateString('en-US', { month: 'short' }),
          value: count,
          comparison: Math.floor(count * 0.8) // Simulated previous period
        }
      })
      
      // If no data, show empty chart
      if (chartData.length === 0) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
        setPatientChartData(months.map(month => ({ label: month, value: 0, comparison: 0 })))
      } else {
        setPatientChartData(chartData)
      }

      // Load real-time revenue data
      const revenueData = await db.getRevenueStats()
      const topService = topServicesData.length > 0 ? topServicesData[0].name : 'N/A'
      const topMedicine = topMedicinesData.length > 0 ? topMedicinesData[0].name : 'N/A'
      
      setSalesStats({
        totalRevenue: revenueData.totalRevenue,
        servicesRevenue: revenueData.totalRevenue * 0.58, // Approximate breakdown
        medicineRevenue: revenueData.totalRevenue * 0.33,
        roomRevenue: revenueData.totalRevenue * 0.09,
        monthlyGrowth: 0, // Calculate from previous month if needed
        topSellingService: topService,
        topSellingMedicine: topMedicine
      })

      // Load monthly revenue trend
      const monthlyTrend = await db.getMonthlyRevenueTrend(7)
      if (monthlyTrend.length > 0) {
        setMonthlySalesData(monthlyTrend)
      }

      // Load revenue by category
      const categoryData = await db.getRevenueByCategory()
      if (categoryData.length > 0) {
        setSalesByCategory(categoryData)
      }
      
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
        <HeartbeatLoader message="Loading dashboard..." />
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

      {/* Patient Statistics & Appointment List */}
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
              {todayAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">No appointments scheduled for today</p>
                </div>
              ) : (
                todayAppointments.map(apt => (
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

      {/* Sales KPI Section (Admin Only) */}
      {isAdmin && (
        <>
          <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">Sales Overview</h2>
                <p className="text-teal-100">Track revenue from services, medicines, and rooms</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                <Download size={18} />
                Export Report
              </button>
            </div>

            <div className="grid grid-cols-4 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <DollarSign size={24} className="text-white" />
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-full">+{salesStats.monthlyGrowth}%</span>
                </div>
                <p className="text-3xl font-bold mb-1">₱{salesStats.totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-teal-100">Total Revenue</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <ShoppingCart size={24} className="text-white" />
                  <TrendingUp size={16} className="text-emerald-300" />
                </div>
                <p className="text-3xl font-bold mb-1">₱{salesStats.servicesRevenue.toLocaleString()}</p>
                <p className="text-sm text-teal-100">Services Revenue</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <Pill size={24} className="text-white" />
                  <TrendingUp size={16} className="text-emerald-300" />
                </div>
                <p className="text-3xl font-bold mb-1">₱{salesStats.medicineRevenue.toLocaleString()}</p>
                <p className="text-sm text-teal-100">Medicine Revenue</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <Bed size={24} className="text-white" />
                  <TrendingUp size={16} className="text-emerald-300" />
                </div>
                <p className="text-3xl font-bold mb-1">₱{salesStats.roomRevenue.toLocaleString()}</p>
                <p className="text-sm text-teal-100">Room Revenue</p>
              </div>
            </div>
          </div>

          {/* Sales Analytics */}
          <div className="grid grid-cols-3 gap-6">
            {/* Monthly Sales Trend */}
            <div className="col-span-2 bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Revenue Trend</h2>
                  <p className="text-sm text-slate-500">Monthly breakdown by category</p>
                </div>
                <select className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option>Last 7 Months</option>
                  <option>Last 6 Months</option>
                  <option>Last 3 Months</option>
                </select>
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlySalesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="month" 
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
                    tickFormatter={(value) => `₱${value / 1000}k`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
                            <p className="text-sm font-semibold text-slate-900 mb-2">{payload[0].payload.month}</p>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-teal-500"></div>
                                  <span className="text-xs text-slate-600">Services</span>
                                </div>
                                <span className="text-sm font-bold text-slate-900">₱{payload[0].value.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                                  <span className="text-xs text-slate-600">Medicines</span>
                                </div>
                                <span className="text-sm font-bold text-slate-900">₱{payload[1].value.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                  <span className="text-xs text-slate-600">Rooms</span>
                                </div>
                                <span className="text-sm font-bold text-slate-900">₱{payload[2].value.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="services" fill="#14b8a6" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="medicines" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="rooms" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Revenue Distribution */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-6">Revenue Distribution</h2>
              
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={salesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {salesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
                            <p className="text-sm font-semibold text-slate-900">{payload[0].name}</p>
                            <p className="text-lg font-bold text-teal-600">₱{payload[0].value.toLocaleString()}</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-3 mt-6">
                {salesByCategory.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm text-slate-600">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">
                      {((item.value / salesStats.totalRevenue) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Selling Items */}
          <div className="grid grid-cols-2 gap-6">
            {/* Top Services */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900">Top Services</h2>
                <button className="text-sm text-teal-600 hover:text-teal-700">View All</button>
              </div>

              <div className="space-y-4">
                {topServices.map((service, index) => (
                  <div key={service.name} className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-100 text-teal-600 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">{service.name}</p>
                      <p className="text-xs text-slate-500">{service.count} transactions</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">₱{service.sales.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Medicines */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900">Top Medicines</h2>
                <button className="text-sm text-teal-600 hover:text-teal-700">View All</button>
              </div>

              <div className="space-y-4">
                {topMedicines.map((medicine, index) => (
                  <div key={medicine.name} className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 text-purple-600 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">{medicine.name}</p>
                      <p className="text-xs text-slate-500">{medicine.count} units sold</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">₱{medicine.sales.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Doctor Performance - Patient Count */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Doctor Performance</h2>
                <p className="text-sm text-slate-500">Patient count and consultation metrics</p>
              </div>
              <button 
                onClick={() => setShowPerformanceReport(true)}
                className="text-sm text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"
              >
                View Detailed Report
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="overflow-x-auto">
              {doctorPerformance.length === 0 ? (
                <div className="text-center py-12">
                  <Stethoscope className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 font-semibold mb-2">No Doctors Yet</p>
                  <p className="text-sm text-slate-500">Add doctors to see performance metrics</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Doctor</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Specialization</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Total Patients</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Today's Appointments</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Avg Consult Time</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Satisfaction</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctorPerformance.map((doctor, index) => (
                      <tr key={doctor.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <img src={doctor.avatar} alt={doctor.name} className="w-10 h-10 rounded-full" />
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{doctor.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-slate-600">{doctor.specialization}</span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-lg font-bold text-slate-900">{doctor.patientCount}</span>
                            <span className="text-xs text-slate-500">patients</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold bg-teal-100 text-teal-700">
                            {doctor.appointmentsToday}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="text-sm text-slate-600">{doctor.avgConsultTime}</span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-sm font-semibold text-amber-500">★</span>
                            <span className="text-sm font-semibold text-slate-900">{doctor.satisfaction}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center">
                            <div className="w-24 bg-slate-200 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-teal-400 to-teal-600 h-2 rounded-full"
                                style={{ width: `${Math.min((doctor.patientCount / Math.max(...doctorPerformance.map(d => d.patientCount), 1)) * 100, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Summary Stats */}
            {doctorPerformance.length > 0 && (
              <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-200">
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-900">
                    {doctorPerformance.reduce((sum, d) => sum + d.patientCount, 0)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Total Patients</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-teal-600">
                    {doctorPerformance.reduce((sum, d) => sum + d.appointmentsToday, 0)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Today's Appointments</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-900">
                    {Math.round(doctorPerformance.reduce((sum, d) => sum + d.patientCount, 0) / doctorPerformance.length) || 0}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Avg Patients/Doctor</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-500">
                    {doctorPerformance.length > 0 ? (doctorPerformance.reduce((sum, d) => sum + d.satisfaction, 0) / doctorPerformance.length).toFixed(1) : '0.0'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Avg Satisfaction</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}

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

      {/* Performance Detailed Report Modal */}
      {showPerformanceReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Detailed Performance Report</h2>
                <p className="text-sm text-slate-500 mt-1">Comprehensive metrics and analytics</p>
              </div>
              <button 
                onClick={() => setShowPerformanceReport(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4">
                  <p className="text-sm text-teal-700 font-semibold">Total Patients</p>
                  <p className="text-3xl font-bold text-teal-900 mt-2">
                    {doctorPerformance.reduce((sum, d) => sum + d.patientCount, 0)}
                  </p>
                  <p className="text-xs text-teal-600 mt-1">Across all doctors</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                  <p className="text-sm text-blue-700 font-semibold">Today's Appointments</p>
                  <p className="text-3xl font-bold text-blue-900 mt-2">
                    {doctorPerformance.reduce((sum, d) => sum + d.appointmentsToday, 0)}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">Scheduled for today</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                  <p className="text-sm text-purple-700 font-semibold">Avg Patients/Doctor</p>
                  <p className="text-3xl font-bold text-purple-900 mt-2">
                    {doctorPerformance.length > 0 ? Math.round(doctorPerformance.reduce((sum, d) => sum + d.patientCount, 0) / doctorPerformance.length) : 0}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">Per doctor</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4">
                  <p className="text-sm text-amber-700 font-semibold">Avg Satisfaction</p>
                  <p className="text-3xl font-bold text-amber-900 mt-2">
                    {doctorPerformance.length > 0 ? (doctorPerformance.reduce((sum, d) => sum + d.satisfaction, 0) / doctorPerformance.length).toFixed(1) : '0.0'} ★
                  </p>
                  <p className="text-xs text-amber-600 mt-1">Overall rating</p>
                </div>
              </div>

              {/* Detailed Table */}
              {doctorPerformance.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
                  <Stethoscope className="w-20 h-20 text-slate-300 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-slate-600 mb-2">No Doctors Yet</p>
                  <p className="text-sm text-slate-500">Add doctors to see detailed performance metrics</p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left py-4 px-6 text-xs font-semibold text-slate-700 uppercase">Doctor</th>
                          <th className="text-left py-4 px-6 text-xs font-semibold text-slate-700 uppercase">Specialization</th>
                          <th className="text-center py-4 px-6 text-xs font-semibold text-slate-700 uppercase">Total Patients</th>
                          <th className="text-center py-4 px-6 text-xs font-semibold text-slate-700 uppercase">Today</th>
                          <th className="text-center py-4 px-6 text-xs font-semibold text-slate-700 uppercase">Avg Time</th>
                          <th className="text-center py-4 px-6 text-xs font-semibold text-slate-700 uppercase">Rating</th>
                          <th className="text-center py-4 px-6 text-xs font-semibold text-slate-700 uppercase">Performance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {doctorPerformance.map((doctor, index) => (
                          <tr key={doctor.id} className="border-t border-slate-100 hover:bg-slate-50">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <img src={doctor.avatar} alt={doctor.name} className="w-12 h-12 rounded-full" />
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">{doctor.name}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-sm text-slate-600">{doctor.specialization}</span>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span className="text-lg font-bold text-slate-900">{doctor.patientCount}</span>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-teal-100 text-teal-700">
                                {doctor.appointmentsToday}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span className="text-sm text-slate-600">{doctor.avgConsultTime}</span>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <span className="text-lg font-bold text-amber-500">★</span>
                                <span className="text-sm font-semibold text-slate-900">{doctor.satisfaction}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-32 bg-slate-200 rounded-full h-3">
                                  <div 
                                    className="bg-gradient-to-r from-teal-400 to-teal-600 h-3 rounded-full transition-all"
                                    style={{ width: `${Math.min((doctor.patientCount / Math.max(...doctorPerformance.map(d => d.patientCount), 1)) * 100, 100)}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs font-semibold text-slate-600">
                                  {Math.round((doctor.patientCount / Math.max(...doctorPerformance.map(d => d.patientCount), 1)) * 100)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Export Button */}
              <div className="flex justify-end gap-3">
                <button className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Export Report
                </button>
                <button 
                  onClick={() => setShowPerformanceReport(false)}
                  className="px-6 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
