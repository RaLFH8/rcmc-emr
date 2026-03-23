import { useEffect, useState } from 'react'
import { Download, Calendar, TrendingUp, Users, DollarSign } from 'lucide-react'
import { db } from '../lib/supabase'

const Reports = () => {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [reportType, setReportType] = useState('summary')

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    try {
      setLoading(true)
      const data = await db.getEmployees()
      setEmployees(data)
    } catch (error) {
      console.error('Error loading employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = () => {
    const totalSalary = employees.reduce((sum, emp) => sum + Number(emp.salary), 0)
    const totalSSS = employees.reduce((sum, emp) => sum + Number(emp.sss || 0), 0)
    const totalPhilHealth = employees.reduce((sum, emp) => sum + Number(emp.philhealth || 0), 0)
    const totalPagIbig = employees.reduce((sum, emp) => sum + Number(emp.pagibig || 0), 0)
    const totalDeductions = totalSSS + totalPhilHealth + totalPagIbig
    const netPayroll = totalSalary - totalDeductions

    return {
      totalSalary,
      totalSSS,
      totalPhilHealth,
      totalPagIbig,
      totalDeductions,
      netPayroll,
      employeeCount: employees.length,
      activeEmployees: employees.filter(e => e.status === 'Active').length
    }
  }

  const exportToCSV = () => {
    const stats = calculateStats()
    const monthYear = new Date(selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    
    let csvContent = `RIZALCARE MEDICAL CLINIC - Payroll Report\n`
    csvContent += `Period: ${monthYear}\n`
    csvContent += `Generated: ${new Date().toLocaleDateString('en-US')}\n\n`
    
    if (reportType === 'summary') {
      csvContent += `Summary Report\n`
      csvContent += `Total Employees,${stats.employeeCount}\n`
      csvContent += `Active Employees,${stats.activeEmployees}\n`
      csvContent += `Total Payroll,₱${stats.totalSalary.toLocaleString()}\n`
      csvContent += `Total Deductions,₱${stats.totalDeductions.toLocaleString()}\n`
      csvContent += `Net Payroll,₱${stats.netPayroll.toLocaleString()}\n\n`
    }
    
    csvContent += `Employee Name,Position,Department,Basic Salary,SSS,PhilHealth,Pag-IBIG,Total Deductions,Net Pay,Status\n`
    
    employees.forEach(emp => {
      const totalDed = Number(emp.sss || 0) + Number(emp.philhealth || 0) + Number(emp.pagibig || 0)
      const netPay = Number(emp.salary) - totalDed
      csvContent += `${emp.name},${emp.position},${emp.department},${emp.salary},${emp.sss || 0},${emp.philhealth || 0},${emp.pagibig || 0},${totalDed},${netPay},${emp.status}\n`
    })

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `payroll-report-${selectedMonth}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const stats = calculateStats()
  const monthYear = new Date(selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-spectro-purple border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-slate-600 dark:text-gray-400 text-sm mt-1">Generate and export payroll reports</p>
        </div>
        <div className="flex gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-white/5 border border-slate-300 dark:border-spectro-border rounded-lg text-slate-900 dark:text-gray-300 focus:outline-none focus:border-spectro-purple"
          />
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-6 py-2 gradient-primary rounded-lg text-white font-semibold glow-primary hover:opacity-90 transition-opacity"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="flex gap-3">
        <button
          onClick={() => setReportType('summary')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            reportType === 'summary'
              ? 'gradient-primary text-white glow-primary'
              : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-white/10'
          }`}
        >
          Summary Report
        </button>
        <button
          onClick={() => setReportType('detailed')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            reportType === 'detailed'
              ? 'gradient-primary text-white glow-primary'
              : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-white/10'
          }`}
        >
          Detailed Report
        </button>
        <button
          onClick={() => setReportType('deductions')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            reportType === 'deductions'
              ? 'gradient-primary text-white glow-primary'
              : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-white/10'
          }`}
        >
          Deductions Report
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-spectro-purple/20 rounded-lg flex items-center justify-center">
              <Users size={20} className="text-spectro-purple" />
            </div>
            <p className="text-sm text-slate-600 dark:text-gray-400 font-medium">Total Employees</p>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.employeeCount}</p>
          <p className="text-xs text-slate-500 dark:text-gray-500 mt-1">{stats.activeEmployees} active</p>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-spectro-teal/20 rounded-lg flex items-center justify-center">
              <DollarSign size={20} className="text-spectro-teal" />
            </div>
            <p className="text-sm text-slate-600 dark:text-gray-400 font-medium">Total Payroll</p>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">₱{stats.totalSalary.toLocaleString()}</p>
          <p className="text-xs text-slate-500 dark:text-gray-500 mt-1">Gross amount</p>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp size={20} className="text-red-600 dark:text-red-400" />
            </div>
            <p className="text-sm text-slate-600 dark:text-gray-400 font-medium">Total Deductions</p>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">₱{stats.totalDeductions.toLocaleString()}</p>
          <p className="text-xs text-slate-500 dark:text-gray-500 mt-1">All contributions</p>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Calendar size={20} className="text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm text-slate-600 dark:text-gray-400 font-medium">Net Payroll</p>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">₱{stats.netPayroll.toLocaleString()}</p>
          <p className="text-xs text-slate-500 dark:text-gray-500 mt-1">After deductions</p>
        </div>
      </div>

      {/* Report Content */}
      {reportType === 'summary' && (
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white tracking-tight mb-6">Payroll Summary - {monthYear}</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b border-spectro-border">
              <span className="text-gray-400">Total Employees</span>
              <span className="text-white font-semibold">{stats.employeeCount}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-spectro-border">
              <span className="text-gray-400">Active Employees</span>
              <span className="text-white font-semibold">{stats.activeEmployees}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-spectro-border">
              <span className="text-gray-400">Total Basic Salary</span>
              <span className="text-white font-semibold">₱{stats.totalSalary.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-spectro-border">
              <span className="text-gray-400">SSS Contributions</span>
              <span className="text-red-400 font-semibold">₱{stats.totalSSS.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-spectro-border">
              <span className="text-gray-400">PhilHealth Contributions</span>
              <span className="text-red-400 font-semibold">₱{stats.totalPhilHealth.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-spectro-border">
              <span className="text-gray-400">Pag-IBIG Contributions</span>
              <span className="text-red-400 font-semibold">₱{stats.totalPagIbig.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-4 bg-white/5 rounded-lg px-4 mt-4">
              <span className="text-white font-bold text-lg">Net Payroll</span>
              <span className="text-spectro-teal font-bold text-lg">₱{stats.netPayroll.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {reportType === 'detailed' && (
        <div className="glass-card rounded-2xl">
          <div className="p-6 border-b border-spectro-border">
            <h2 className="text-xl font-bold text-white tracking-tight">Detailed Employee Report - {monthYear}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-spectro-border">
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Basic Salary</th>
                  <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Deductions</th>
                  <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Net Pay</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const totalDed = Number(emp.sss || 0) + Number(emp.philhealth || 0) + Number(emp.pagibig || 0)
                  const netPay = Number(emp.salary) - totalDed
                  
                  return (
                    <tr key={emp.id} className="border-b border-spectro-border hover:bg-white/5 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">{emp.name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-white text-sm">{emp.name}</p>
                            <p className="text-xs text-gray-500">{emp.position}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-300 text-sm">{emp.department}</td>
                      <td className="py-4 px-6 text-right font-semibold text-white text-sm">₱{emp.salary.toLocaleString()}</td>
                      <td className="py-4 px-6 text-right font-semibold text-red-400 text-sm">₱{totalDed.toLocaleString()}</td>
                      <td className="py-4 px-6 text-right font-bold text-spectro-teal text-sm">₱{netPay.toLocaleString()}</td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          emp.status === 'Active' 
                            ? 'bg-spectro-teal/10 text-spectro-teal' 
                            : 'bg-gray-500/10 text-gray-400'
                        }`}>
                          {emp.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reportType === 'deductions' && (
        <div className="glass-card rounded-2xl">
          <div className="p-6 border-b border-spectro-border">
            <h2 className="text-xl font-bold text-white tracking-tight">Government Deductions Report - {monthYear}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-spectro-border">
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">SSS</th>
                  <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">PhilHealth</th>
                  <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pag-IBIG</th>
                  <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const totalDed = Number(emp.sss || 0) + Number(emp.philhealth || 0) + Number(emp.pagibig || 0)
                  
                  return (
                    <tr key={emp.id} className="border-b border-spectro-border hover:bg-white/5 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">{emp.name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-white text-sm">{emp.name}</p>
                            <p className="text-xs text-gray-500">{emp.position}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right text-gray-300 text-sm">₱{(emp.sss || 0).toLocaleString()}</td>
                      <td className="py-4 px-6 text-right text-gray-300 text-sm">₱{(emp.philhealth || 0).toLocaleString()}</td>
                      <td className="py-4 px-6 text-right text-gray-300 text-sm">₱{(emp.pagibig || 0).toLocaleString()}</td>
                      <td className="py-4 px-6 text-right font-bold text-red-400 text-sm">₱{totalDed.toLocaleString()}</td>
                    </tr>
                  )
                })}
                <tr className="bg-white/5 font-bold">
                  <td className="py-4 px-6 text-white">TOTAL</td>
                  <td className="py-4 px-6 text-right text-white">₱{stats.totalSSS.toLocaleString()}</td>
                  <td className="py-4 px-6 text-right text-white">₱{stats.totalPhilHealth.toLocaleString()}</td>
                  <td className="py-4 px-6 text-right text-white">₱{stats.totalPagIbig.toLocaleString()}</td>
                  <td className="py-4 px-6 text-right text-spectro-teal">₱{stats.totalDeductions.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reports
