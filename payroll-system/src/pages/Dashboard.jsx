import { useEffect, useState } from 'react'
import { Coins, Users, TrendingUp, Wallet } from 'lucide-react'
import StatCard from '../components/StatCard'
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { db } from '../lib/supabase'

const Dashboard = ({ setCurrentPage }) => {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalPayroll: 0,
    totalEmployees: 0,
    activeTax: 0,
    netPay: 0
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      await db.initializeSampleData()
      const employeeData = await db.getEmployees()
      setEmployees(employeeData)

      const totalSalary = employeeData.reduce((sum, emp) => sum + Number(emp.salary), 0)
      const totalDeductions = employeeData.reduce((sum, emp) => 
        sum + Number(emp.sss || 0) + Number(emp.philhealth || 0) + Number(emp.pagibig || 0), 0
      )
      
      setStats({
        totalPayroll: totalSalary,
        totalEmployees: employeeData.length,
        activeTax: totalDeductions,
        netPay: totalSalary - totalDeductions
      })
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Chart data
  const areaChartData = [
    { month: 'Jan', amount: 450000 },
    { month: 'Feb', amount: 480000 },
    { month: 'Mar', amount: 520000 },
    { month: 'Apr', amount: 490000 },
    { month: 'May', amount: 550000 },
    { month: 'Jun', amount: 580000 },
  ]

  const pieChartData = [
    { name: 'Engineering', value: 35, color: '#A855F7' },
    { name: 'Operations', value: 25, color: '#2DD4BF' },
    { name: 'Design', value: 20, color: '#EC4899' },
    { name: 'Marketing', value: 20, color: '#F59E0B' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-workly-coral border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-workly-text-secondary">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm mb-1 text-workly-text-secondary">
            Welcome back, Admin 👋
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-workly-text-primary">
            Dashboard Overview
          </h1>
        </div>
        <button 
          onClick={() => setCurrentPage('reports')}
          className="px-6 py-3 bg-workly-coral text-white rounded-workly font-semibold text-sm hover:opacity-90 transition-opacity shadow-workly"
        >
          Create a Report →
        </button>
      </div>

      {/* Stats Grid - 12 column layout */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-3">
          <StatCard
            title="Total Payroll"
            value={`₱${stats.totalPayroll.toLocaleString()}`}
            change="+8.2%"
            icon={Coins}
            gradient="gradient-primary"
          />
        </div>
        <div className="col-span-3">
          <StatCard
            title="Total Employees"
            value={stats.totalEmployees}
            change="+12"
            icon={Users}
            gradient="bg-gradient-to-br from-pink-500 to-rose-500"
          />
        </div>
        <div className="col-span-3">
          <StatCard
            title="Active Tax"
            value={`₱${stats.activeTax.toLocaleString()}`}
            change="+5.1%"
            icon={TrendingUp}
            gradient="bg-gradient-to-br from-cyan-500 to-blue-500"
          />
        </div>
        <div className="col-span-3">
          <StatCard
            title="Net Pay"
            value={`₱${stats.netPay.toLocaleString()}`}
            change="+7.8%"
            icon={Wallet}
            gradient="bg-gradient-to-br from-amber-500 to-orange-500"
          />
        </div>
      </div>

      {/* Charts Row - 12 column layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Main Chart - 8 columns */}
        <div className="col-span-8 glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Payroll Expenses Breakdown
            </h2>
            <select className={`px-4 py-2 border rounded-lg text-sm focus:outline-none ${
              theme === 'dark'
                ? 'bg-white/5 border-spectro-border text-gray-400 focus:border-spectro-purple'
                : 'bg-white border-slate-200 text-slate-700 focus:border-purple-400'
            }`}>
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={areaChartData}>
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A855F7" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#2DD4BF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1A1C2E', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="#A855F7" 
                strokeWidth={3}
                fill="url(#colorGradient)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - 4 columns */}
        <div className="col-span-4 glass-card rounded-2xl p-6">
          <h2 className={`text-xl font-bold tracking-tight mb-6 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            Department Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: theme === 'dark' ? '#1A1C2E' : '#ffffff',
                  border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgb(226, 232, 240)',
                  borderRadius: '8px',
                  color: theme === 'dark' ? '#fff' : '#0f172a'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {pieChartData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'}`}>
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Employee Table */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            Recent Employees
          </h2>
          <button className={`text-sm font-semibold transition-colors ${
            theme === 'dark'
              ? 'text-spectro-teal hover:text-spectro-purple'
              : 'text-purple-600 hover:text-teal-600'
          }`}>
            View All →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${theme === 'dark' ? 'border-spectro-border' : 'border-slate-200'}`}>
                <th className={`text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider ${
                  theme === 'dark' ? 'text-gray-500' : 'text-slate-600'
                }`}>Employee</th>
                <th className={`text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider ${
                  theme === 'dark' ? 'text-gray-500' : 'text-slate-600'
                }`}>Position</th>
                <th className={`text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider ${
                  theme === 'dark' ? 'text-gray-500' : 'text-slate-600'
                }`}>Department</th>
                <th className={`text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider ${
                  theme === 'dark' ? 'text-gray-500' : 'text-slate-600'
                }`}>Salary</th>
                <th className={`text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider ${
                  theme === 'dark' ? 'text-gray-500' : 'text-slate-600'
                }`}>Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.slice(0, 4).map((emp) => (
                <tr key={emp.id} className={`border-b transition-colors ${
                  theme === 'dark'
                    ? 'border-spectro-border hover:bg-white/5'
                    : 'border-slate-100 hover:bg-slate-50'
                }`}>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        theme === 'dark' ? 'gradient-primary' : 'gradient-light'
                      }`}>
                        <span className="text-white font-semibold text-sm">{emp.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {emp.name}
                        </p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-slate-500'}`}>
                          {emp.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className={`py-4 px-4 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-slate-700'}`}>
                    {emp.position}
                  </td>
                  <td className={`py-4 px-4 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-slate-700'}`}>
                    {emp.department}
                  </td>
                  <td className={`py-4 px-4 font-mono font-semibold text-sm ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>
                    ₱{emp.salary.toLocaleString()}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      emp.status === 'Active' 
                        ? theme === 'dark'
                          ? 'bg-spectro-teal/10 text-spectro-teal'
                          : 'bg-emerald-50 text-emerald-700'
                        : theme === 'dark'
                          ? 'bg-gray-500/10 text-gray-400'
                          : 'bg-slate-100 text-slate-600'
                    }`}>
                      {emp.status}
                    </span>
                  </td>
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
