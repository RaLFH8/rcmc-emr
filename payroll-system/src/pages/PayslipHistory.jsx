import { useEffect, useState } from 'react'
import { History, Download, Trash2, Filter, Calendar, User } from 'lucide-react'
import { db } from '../lib/supabase'

const PayslipHistory = () => {
  const [history, setHistory] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEmployee, setSelectedEmployee] = useState('all')
  const [selectedPeriodType, setSelectedPeriodType] = useState('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [historyData, employeesData] = await Promise.all([
        db.getPayslipHistory(),
        db.getEmployees()
      ])
      setHistory(historyData)
      setEmployees(employeesData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this payslip record?')) return
    
    try {
      await db.deletePayslipHistory(id)
      await loadData()
    } catch (error) {
      console.error('Error deleting payslip:', error)
      alert('Failed to delete payslip record')
    }
  }

  const filteredHistory = history.filter(item => {
    if (selectedEmployee !== 'all' && item.employee_id !== selectedEmployee) return false
    if (selectedPeriodType !== 'all' && item.period_type !== selectedPeriodType) return false
    return true
  })

  const totalPayslips = filteredHistory.length
  const totalNetPay = filteredHistory.reduce((sum, item) => sum + Number(item.net_pay), 0)
  const monthlyPayslips = filteredHistory.filter(item => item.period_type === 'monthly').length
  const weeklyPayslips = filteredHistory.filter(item => item.period_type === 'weekly').length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-spectro-purple border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading payslip history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4 md:space-y-6 mt-16 lg:mt-0">
      <div className="flex flex-col gap-3 md:gap-4">
        <div className="flex-shrink-0">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Payslip History</h1>
          <p className="text-slate-600 dark:text-gray-400 text-xs md:text-sm mt-1">View all generated payslips</p>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <User size={18} className="text-slate-600 dark:text-gray-400" />
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="px-4 py-2 text-sm bg-white dark:bg-white/5 border border-slate-300 dark:border-spectro-border rounded-lg text-slate-900 dark:text-gray-300 focus:outline-none focus:border-spectro-purple"
            >
              <option value="all">All Employees</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-600 dark:text-gray-400" />
            <select
              value={selectedPeriodType}
              onChange={(e) => setSelectedPeriodType(e.target.value)}
              className="px-4 py-2 text-sm bg-white dark:bg-white/5 border border-slate-300 dark:border-spectro-border rounded-lg text-slate-900 dark:text-gray-300 focus:outline-none focus:border-spectro-purple"
            >
              <option value="all">All Periods</option>
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-6">
          <p className="text-sm text-slate-600 dark:text-gray-400 font-medium mb-2">Total Payslips</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalPayslips}</p>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <p className="text-sm text-slate-600 dark:text-gray-400 font-medium mb-2">Monthly Payslips</p>
          <p className="text-3xl font-bold text-spectro-purple">{monthlyPayslips}</p>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <p className="text-sm text-slate-600 dark:text-gray-400 font-medium mb-2">Weekly Payslips</p>
          <p className="text-3xl font-bold text-spectro-teal">{weeklyPayslips}</p>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <p className="text-sm text-slate-600 dark:text-gray-400 font-medium mb-2">Total Net Pay</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">₱{totalNetPay.toLocaleString()}</p>
        </div>
      </div>

      {/* History Table */}
      <div className="glass-card rounded-2xl">
        <div className="p-6 border-b border-slate-200 dark:border-spectro-border">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Payslip Records</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-spectro-border">
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 dark:text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 dark:text-gray-500 uppercase tracking-wider">Period Type</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 dark:text-gray-500 uppercase tracking-wider">Period</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 dark:text-gray-500 uppercase tracking-wider">Work Days</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 dark:text-gray-500 uppercase tracking-wider">Basic Salary</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 dark:text-gray-500 uppercase tracking-wider">Deductions</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 dark:text-gray-500 uppercase tracking-wider">Net Pay</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 dark:text-gray-500 uppercase tracking-wider">Generated</th>
                <th className="text-right py-4 px-6 text-xs font-semibold text-slate-600 dark:text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center">
                    <History size={48} className="mx-auto mb-4 text-slate-400 dark:text-gray-600" />
                    <p className="text-slate-600 dark:text-gray-400 text-lg font-medium">No payslip records found</p>
                    <p className="text-slate-500 dark:text-gray-500 text-sm mt-2">Generate payslips from the Payroll page to see them here</p>
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 dark:border-spectro-border hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">{item.employee_name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white text-sm">{item.employee_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        item.period_type === 'monthly' 
                          ? 'bg-spectro-purple/20 text-spectro-purple' 
                          : 'bg-spectro-teal/20 text-spectro-teal'
                      }`}>
                        {item.period_type}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-700 dark:text-gray-300 text-sm">{item.period_label}</td>
                    <td className="py-4 px-6 text-slate-700 dark:text-gray-300 text-sm">{item.work_days} days</td>
                    <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white text-sm">
                      ₱{Number(item.basic_salary).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 font-semibold text-red-600 dark:text-red-400 text-sm">
                      ₱{Number(item.total_deductions).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 font-bold text-spectro-teal text-sm">
                      ₱{Number(item.net_pay).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-slate-600 dark:text-gray-400 text-xs">
                      {new Date(item.generated_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
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

export default PayslipHistory
