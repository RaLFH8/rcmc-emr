import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { db } from '../lib/supabase'
import jsPDF from 'jspdf'

const Payroll = () => {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [previewEmployee, setPreviewEmployee] = useState(null)
  const [editingCashAdvance, setEditingCashAdvance] = useState(null)
  const [editingIncentive, setEditingIncentive] = useState(null)
  const [payPeriodType, setPayPeriodType] = useState('monthly') // 'monthly' or 'weekly'
  const [employeeDates, setEmployeeDates] = useState({}) // Store start/end dates per employee

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

  const calculateWorkDays = (employeeId) => {
    const dates = employeeDates[employeeId]
    if (payPeriodType === 'weekly' && dates?.startDate && dates?.endDate) {
      const start = new Date(dates.startDate)
      const end = new Date(dates.endDate)
      return Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1
    }
    return 30 // Default to 30 days for monthly
  }

  const calculateSalary = (basicSalary, employeeId) => {
    const workDays = calculateWorkDays(employeeId)
    // Basic Salary is daily rate, multiply by work days
    return Number(basicSalary) * workDays
  }

  const getSalaryAmount = (emp) => {
    return calculateSalary(emp.salary, emp.id)
  }

  const getIncentiveAmount = (emp) => {
    return Number(emp.incentive || 0) // Full amount, NOT prorated
  }

  const getSSSAmount = (emp) => {
    const sssSalary = Number(emp.sss_salary || emp.salary)
    const monthlySSS = sssSalary * 0.075 // 7.5% of SSS salary
    
    if (payPeriodType === 'weekly') {
      return monthlySSS / 4 // Divide by 4 for weekly
    }
    return monthlySSS // Full monthly SSS
  }

  const getCashAdvanceAmount = (emp) => {
    return Number(emp.cash_advance || 0) // Use stored value directly
  }

  const getPhilHealthAmount = (emp) => {
    return Number(emp.philhealth || 0) // Use stored value directly
  }

  const getPagIbigAmount = (emp) => {
    return Number(emp.pagibig || 0) // Use stored value directly
  }

  const calculateNetPay = (emp) => {
    const salary = getSalaryAmount(emp)
    const incentive = getIncentiveAmount(emp)
    const sss = getSSSAmount(emp)
    const philhealth = getPhilHealthAmount(emp)
    const pagibig = getPagIbigAmount(emp)
    const cashAdvance = getCashAdvanceAmount(emp)
    const deductions = sss + philhealth + pagibig + cashAdvance
    return salary + incentive - deductions
  }

  const updateCashAdvance = async (employeeId, newAmount) => {
    try {
      await db.updateEmployee(employeeId, { cash_advance: Number(newAmount) || 0 })
      await loadEmployees()
      setEditingCashAdvance(null)
    } catch (error) {
      console.error('Error updating cash advance:', error)
      alert('Failed to update cash advance')
    }
  }

  const updateIncentive = async (employeeId, newAmount) => {
    try {
      await db.updateEmployee(employeeId, { incentive: Number(newAmount) || 0 })
      await loadEmployees()
      setEditingIncentive(null)
    } catch (error) {
      console.error('Error updating incentive:', error)
      alert('Failed to update incentive')
    }
  }

  const downloadPayslipPDF = async (employee) => {
    const doc = new jsPDF()
    const salary = getSalaryAmount(employee)
    const incentive = getIncentiveAmount(employee)
    const sss = getSSSAmount(employee)
    const philhealth = getPhilHealthAmount(employee)
    const pagibig = getPagIbigAmount(employee)
    const cashAdvance = getCashAdvanceAmount(employee)
    const totalDed = sss + philhealth + pagibig + cashAdvance
    const netPay = salary + incentive - totalDed
    const monthYear = new Date(selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    
    let periodLabel = monthYear
    let workDays = ''
    let startDate = null
    let endDate = null
    
    const dates = employeeDates[employee.id]
    if (payPeriodType === 'weekly' && dates?.startDate && dates?.endDate) {
      const start = new Date(dates.startDate)
      const end = new Date(dates.endDate)
      const days = calculateWorkDays(employee.id)
      periodLabel = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      workDays = `${days} ${days === 1 ? 'day' : 'days'}`
      startDate = dates.startDate
      endDate = dates.endDate
    }
    
    const dateIssued = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    
    // Format currency without peso symbol (jsPDF doesn't handle it well)
    const formatAmount = (amount) => {
      return 'PHP ' + Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
    
    // Header
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('RIZALCARE MEDICAL CLINIC', 105, 20, { align: 'center' })
    
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('GF IPDL8 Bldg., 25 G. Dikit St., Brgy. Bagumbayan, Pililla, Rizal', 105, 27, { align: 'center' })
    doc.text('Phone: 0938-775-1504 / 0976-273-9445', 105, 32, { align: 'center' })
    
    // Line under header
    doc.setLineWidth(0.5)
    doc.line(20, 36, 190, 36)
    
    // Title
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('PAYSLIP', 105, 45, { align: 'center' })
    
    // Employee Info
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Employee Name:', 20, 58)
    doc.setFont('helvetica', 'normal')
    doc.text(employee.name, 60, 58)
    
    doc.setFont('helvetica', 'bold')
    doc.text('Pay Period:', 120, 58)
    doc.setFont('helvetica', 'normal')
    doc.text(periodLabel, 150, 58)
    
    doc.setFont('helvetica', 'bold')
    doc.text('Position:', 20, 65)
    doc.setFont('helvetica', 'normal')
    doc.text(employee.position, 60, 65)
    
    doc.setFont('helvetica', 'bold')
    doc.text('Date Issued:', 120, 65)
    doc.setFont('helvetica', 'normal')
    doc.text(dateIssued, 150, 65)
    
    doc.setFont('helvetica', 'bold')
    doc.text('Department:', 20, 72)
    doc.setFont('helvetica', 'normal')
    doc.text(employee.department, 60, 72)
    
    if (workDays) {
      doc.setFont('helvetica', 'bold')
      doc.text('Work Days:', 120, 72)
      doc.setFont('helvetica', 'normal')
      doc.text(workDays, 150, 72)
    }
    
    // Table
    let yPos = 85
    
    // Table header
    doc.setFillColor(240, 240, 240)
    doc.rect(20, yPos, 170, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.text('Description', 25, yPos + 5)
    doc.text('Amount', 170, yPos + 5, { align: 'right' })
    
    yPos += 10
    
    // Basic Salary
    doc.setFont('helvetica', 'normal')
    doc.text(payPeriodType === 'weekly' ? 'Weekly Salary' : 'Basic Salary', 25, yPos)
    doc.text(formatAmount(salary), 185, yPos, { align: 'right' })
    
    yPos += 7
    
    // Incentive
    if (incentive > 0) {
      doc.text('Incentive', 25, yPos)
      doc.text(formatAmount(incentive), 185, yPos, { align: 'right' })
      yPos += 7
    }
    
    yPos += 1
    
    // Deductions header
    doc.setFillColor(250, 250, 250)
    doc.rect(20, yPos - 3, 170, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.text('Deductions', 25, yPos + 2)
    
    yPos += 10
    
    // SSS
    doc.setFont('helvetica', 'normal')
    doc.text('  SSS Contribution', 25, yPos)
    doc.text(formatAmount(sss), 185, yPos, { align: 'right' })
    
    yPos += 7
    
    // PhilHealth
    doc.text('  PhilHealth Contribution', 25, yPos)
    doc.text(formatAmount(philhealth), 185, yPos, { align: 'right' })
    
    yPos += 7
    
    // Pag-IBIG
    doc.text('  Pag-IBIG Contribution', 25, yPos)
    doc.text(formatAmount(pagibig), 185, yPos, { align: 'right' })
    
    yPos += 7
    
    // Cash Advance
    doc.text('  Cash Advance', 25, yPos)
    doc.text(formatAmount(cashAdvance), 185, yPos, { align: 'right' })
    
    yPos += 10
    
    // Total Deductions
    doc.setFillColor(240, 240, 240)
    doc.rect(20, yPos - 3, 170, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.text('Total Deductions', 25, yPos + 2)
    doc.text(formatAmount(totalDed), 185, yPos + 2, { align: 'right' })
    
    yPos += 15
    
    // Net Pay Box
    doc.setFillColor(240, 240, 240)
    doc.setLineWidth(1)
    doc.rect(20, yPos, 170, 12, 'FD')
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('NET PAY:', 25, yPos + 8)
    doc.setFontSize(14)
    doc.text(formatAmount(netPay), 185, yPos + 8, { align: 'right' })
    
    // Signatures
    yPos += 40
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.line(25, yPos, 80, yPos)
    doc.text('Employee Signature', 52, yPos + 5, { align: 'center' })
    
    doc.line(110, yPos, 165, yPos)
    doc.text('Authorized Signature', 137, yPos + 5, { align: 'center' })
    
    // Save PDF
    doc.save(`Payslip_${employee.name.replace(/\s+/g, '_')}_${monthYear.replace(/\s+/g, '_')}.pdf`)
    
    // Save to payslip history
    try {
      await db.savePayslipHistory({
        employee_id: employee.id,
        employee_name: employee.name,
        period_type: payPeriodType,
        period_label: periodLabel,
        start_date: startDate,
        end_date: endDate,
        work_days: payPeriodType === 'weekly' ? calculateWorkDays(employee.id) : 30,
        basic_salary: salary,
        incentive: incentive,
        sss_deduction: sss,
        philhealth_deduction: philhealth,
        pagibig_deduction: pagibig,
        cash_advance: cashAdvance,
        total_deductions: totalDed,
        net_pay: netPay
      })
      console.log('Payslip saved to history')
    } catch (error) {
      console.error('Error saving payslip history:', error)
      // Don't block PDF download if history save fails
    }
    
    // Close the preview modal after download
    setPreviewEmployee(null)
  }

  const totalPayroll = employees.reduce((sum, emp) => sum + getSalaryAmount(emp), 0)
  const totalDeductions = employees.reduce((sum, emp) => 
    sum + getSSSAmount(emp) + getPhilHealthAmount(emp) + getPagIbigAmount(emp) + getCashAdvanceAmount(emp), 0
  )
  const totalNetPay = totalPayroll - totalDeductions

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-spectro-purple border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading payroll...</p>
        </div>
      </div>
    )
  }

  const PayslipPreview = ({ employee }) => {
    const salary = getSalaryAmount(employee)
    const incentive = getIncentiveAmount(employee)
    const sss = getSSSAmount(employee)
    const philhealth = getPhilHealthAmount(employee)
    const pagibig = getPagIbigAmount(employee)
    const cashAdvance = getCashAdvanceAmount(employee)
    const totalDed = sss + philhealth + pagibig + cashAdvance
    const netPay = salary + incentive - totalDed
    const monthYear = new Date(selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    
    let periodLabel = monthYear
    let workDays = ''
    
    const dates = employeeDates[employee.id]
    if (payPeriodType === 'weekly' && dates?.startDate && dates?.endDate) {
      const start = new Date(dates.startDate)
      const end = new Date(dates.endDate)
      const days = calculateWorkDays(employee.id)
      periodLabel = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      workDays = `${days} ${days === 1 ? 'day' : 'days'}`
    }
    
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Payslip Preview</h2>
            <div className="flex gap-2">
              <button
                onClick={() => downloadPayslipPDF(employee)}
                className="flex items-center gap-2 px-4 py-2 bg-spectro-purple text-white rounded-lg hover:bg-spectro-purple/90 transition-colors"
              >
                <Download size={18} />
                Download PDF
              </button>
              <button
                onClick={() => setPreviewEmployee(null)}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <X size={18} />
                Close
              </button>
            </div>
          </div>
          
          <div className="p-8">
            <PayslipContent employee={employee} salary={salary} incentive={incentive} sss={sss} philhealth={philhealth} pagibig={pagibig} cashAdvance={cashAdvance} totalDed={totalDed} netPay={netPay} monthYear={periodLabel} workDays={workDays} />
          </div>
        </div>
      </div>
    )
  }
  
  const PayslipContent = ({ employee, salary, incentive, sss, philhealth, pagibig, cashAdvance, totalDed, netPay, monthYear, workDays }) => {
    return (
      <div>
        {/* Header */}
        <div className="text-center border-b-2 border-gray-900 pb-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">RIZALCARE MEDICAL CLINIC</h1>
          <p className="text-sm text-gray-700">GF IPDL8 Bldg., 25 G. Dikit St., Brgy. Bagumbayan, Pililla, Rizal</p>
          <p className="text-sm text-gray-700">Phone: 0938-775-1504 / 0976-273-9445</p>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-gray-900">PAYSLIP</h2>
        </div>

        {/* Employee Info */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-8 text-sm">
          <div className="flex">
            <span className="font-semibold text-gray-700 w-32">Employee Name:</span>
            <span className="text-gray-900">{employee.name}</span>
          </div>
          <div className="flex">
            <span className="font-semibold text-gray-700 w-32">Pay Period:</span>
            <span className="text-gray-900">{monthYear}</span>
          </div>
          <div className="flex">
            <span className="font-semibold text-gray-700 w-32">Position:</span>
            <span className="text-gray-900">{employee.position}</span>
          </div>
          <div className="flex">
            <span className="font-semibold text-gray-700 w-32">Date Issued:</span>
            <span className="text-gray-900">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <div className="flex">
            <span className="font-semibold text-gray-700 w-32">Department:</span>
            <span className="text-gray-900">{employee.department}</span>
          </div>
          {workDays && (
            <div className="flex">
              <span className="font-semibold text-gray-700 w-32">Work Days:</span>
              <span className="text-gray-900">{workDays}</span>
            </div>
          )}
        </div>

        {/* Earnings and Deductions */}
        <div className="border border-gray-300 mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Description</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="py-3 px-4 text-gray-900">{payPeriodType === 'weekly' ? 'Weekly Salary' : 'Basic Salary'}</td>
                <td className="py-3 px-4 text-right text-gray-900 font-mono">₱{salary.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              {incentive > 0 && (
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-4 text-gray-900">Incentive</td>
                  <td className="py-3 px-4 text-right text-gray-900 font-mono">₱{incentive.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              )}
              <tr className="bg-gray-50 border-b border-gray-300">
                <td className="py-2 px-4 font-semibold text-gray-900">Deductions</td>
                <td className="py-2 px-4"></td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 px-4 pl-8 text-gray-700">SSS Contribution</td>
                <td className="py-2 px-4 text-right text-gray-900 font-mono">₱{sss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 px-4 pl-8 text-gray-700">PhilHealth Contribution</td>
                <td className="py-2 px-4 text-right text-gray-900 font-mono">₱{philhealth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="py-2 px-4 pl-8 text-gray-700">Pag-IBIG Contribution</td>
                <td className="py-2 px-4 text-right text-gray-900 font-mono">₱{pagibig.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="py-2 px-4 pl-8 text-gray-700">Cash Advance</td>
                <td className="py-2 px-4 text-right text-gray-900 font-mono">₱{cashAdvance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              <tr className="bg-gray-100">
                <td className="py-3 px-4 font-semibold text-gray-900">Total Deductions</td>
                <td className="py-3 px-4 text-right text-gray-900 font-semibold font-mono">₱{totalDed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Net Pay */}
        <div className="bg-gray-100 border-2 border-gray-900 p-4 mb-8">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900">NET PAY:</span>
            <span className="text-2xl font-bold text-gray-900 font-mono">₱{netPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-16 mt-16">
          <div className="text-center">
            <div className="border-t-2 border-gray-900 pt-2 mt-16">
              <p className="text-sm text-gray-700">Employee Signature</p>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t-2 border-gray-900 pt-2 mt-16">
              <p className="text-sm text-gray-700">Authorized Signature</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4 md:space-y-6 mt-16 lg:mt-0">
      <div className="flex flex-col gap-3 md:gap-4">
        <div className="flex-shrink-0">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight dark:text-white text-slate-900">Payroll Management</h1>
          <p className="dark:text-gray-400 text-slate-600 text-xs md:text-sm mt-1">Process and manage employee payroll</p>
        </div>
        <div className="flex gap-2 md:gap-3 items-center flex-wrap">
          <div className="flex gap-1 md:gap-2 bg-white dark:bg-spectro-bg border-2 border-slate-300 dark:border-spectro-border rounded-lg p-1 md:p-1.5 shadow-sm">
            <button
              onClick={() => setPayPeriodType('monthly')}
              className={`px-3 md:px-5 py-2 md:py-2.5 rounded-md text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${
                payPeriodType === 'monthly'
                  ? 'bg-spectro-purple text-white shadow-lg'
                  : 'text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/10'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setPayPeriodType('weekly')}
              className={`px-3 md:px-5 py-2 md:py-2.5 rounded-md text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${
                payPeriodType === 'weekly'
                  ? 'bg-spectro-purple text-white shadow-lg'
                  : 'text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/10'
              }`}
            >
              Weekly
            </button>
          </div>
          {payPeriodType === 'monthly' && (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 md:px-4 py-2 text-sm bg-white dark:bg-white/5 border border-slate-300 dark:border-spectro-border rounded-lg text-slate-900 dark:text-gray-300 focus:outline-none focus:border-spectro-purple focus:ring-2 focus:ring-spectro-purple/20 w-full sm:w-auto shadow-sm"
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <p className="text-sm text-slate-600 dark:text-gray-400 font-medium mb-2">Total Payroll</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">₱{totalPayroll.toLocaleString()}</p>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <p className="text-sm text-slate-600 dark:text-gray-400 font-medium mb-2">Total Deductions</p>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">₱{totalDeductions.toLocaleString()}</p>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <p className="text-sm text-slate-600 dark:text-gray-400 font-medium mb-2">Net Payroll</p>
          <p className="text-3xl font-bold text-spectro-teal">₱{totalNetPay.toLocaleString()}</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl">
        <div className="p-6 border-b dark:border-spectro-border border-slate-200">
          <h2 className="text-xl font-bold dark:text-white text-slate-900 tracking-tight">Payroll Breakdown</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-spectro-border border-slate-200">
                <th className="text-left py-4 px-6 text-xs font-semibold dark:text-gray-500 text-slate-600 uppercase tracking-wider">Employee</th>
                {payPeriodType === 'weekly' && (
                  <>
                    <th className="text-left py-4 px-6 text-xs font-semibold dark:text-gray-500 text-slate-600 uppercase tracking-wider">Start Date</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold dark:text-gray-500 text-slate-600 uppercase tracking-wider">End Date</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold dark:text-gray-500 text-slate-600 uppercase tracking-wider">Days</th>
                  </>
                )}
                <th className="text-left py-4 px-6 text-xs font-semibold dark:text-gray-500 text-slate-600 uppercase tracking-wider">Salary</th>
                <th className="text-left py-4 px-6 text-xs font-semibold dark:text-gray-500 text-slate-600 uppercase tracking-wider">Incentive</th>
                <th className="text-left py-4 px-6 text-xs font-semibold dark:text-gray-500 text-slate-600 uppercase tracking-wider">SSS</th>
                <th className="text-left py-4 px-6 text-xs font-semibold dark:text-gray-500 text-slate-600 uppercase tracking-wider">PhilHealth</th>
                <th className="text-left py-4 px-6 text-xs font-semibold dark:text-gray-500 text-slate-600 uppercase tracking-wider">Pag-IBIG</th>
                <th className="text-left py-4 px-6 text-xs font-semibold dark:text-gray-500 text-slate-600 uppercase tracking-wider">Cash Advance</th>
                <th className="text-left py-4 px-6 text-xs font-semibold dark:text-gray-500 text-slate-600 uppercase tracking-wider">Deductions</th>
                <th className="text-left py-4 px-6 text-xs font-semibold dark:text-gray-500 text-slate-600 uppercase tracking-wider">Net Pay</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => {
                const salary = getSalaryAmount(emp)
                const incentive = getIncentiveAmount(emp)
                const sss = getSSSAmount(emp)
                const philhealth = getPhilHealthAmount(emp)
                const pagibig = getPagIbigAmount(emp)
                const cashAdvance = getCashAdvanceAmount(emp)
                const totalDed = sss + philhealth + pagibig + cashAdvance
                const netPay = salary + incentive - totalDed
                
                return (
                  <tr key={emp.id} className="border-b dark:border-spectro-border border-slate-100 dark:hover:bg-white/5 hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6">
                      <div 
                        className="flex items-center gap-3 cursor-pointer hover:text-spectro-teal transition-colors"
                        onClick={() => setPreviewEmployee(emp)}
                      >
                        <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">{emp.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-semibold dark:text-white text-slate-900 text-sm hover:text-spectro-teal">{emp.name}</p>
                          <p className="text-xs dark:text-gray-500 text-slate-500">{emp.position}</p>
                        </div>
                      </div>
                    </td>
                    {payPeriodType === 'weekly' && (
                      <>
                        <td className="py-4 px-6">
                          <input
                            type="date"
                            value={employeeDates[emp.id]?.startDate || ''}
                            onChange={(e) => setEmployeeDates({...employeeDates, [emp.id]: {...employeeDates[emp.id], startDate: e.target.value}})}
                            className="px-2 py-1 text-xs border dark:border-spectro-border border-slate-300 rounded dark:bg-white/5 bg-white dark:text-gray-300 text-slate-900 focus:outline-none focus:border-spectro-purple"
                          />
                        </td>
                        <td className="py-4 px-6">
                          <input
                            type="date"
                            value={employeeDates[emp.id]?.endDate || ''}
                            onChange={(e) => setEmployeeDates({...employeeDates, [emp.id]: {...employeeDates[emp.id], endDate: e.target.value}})}
                            className="px-2 py-1 text-xs border dark:border-spectro-border border-slate-300 rounded dark:bg-white/5 bg-white dark:text-gray-300 text-slate-900 focus:outline-none focus:border-spectro-purple"
                          />
                        </td>
                        <td className="py-4 px-6 dark:text-gray-300 text-slate-700 text-sm font-semibold">
                          {calculateWorkDays(emp.id)}
                        </td>
                      </>
                    )}
                    <td className="py-4 px-6 font-semibold dark:text-white text-slate-900 text-sm">₱{salary.toLocaleString()}</td>
                    <td className="py-4 px-6 dark:text-gray-300 text-slate-700 text-sm">
                      {editingIncentive === emp.id ? (
                        <input
                          type="number"
                          defaultValue={emp.incentive || 0}
                          onBlur={(e) => updateIncentive(emp.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateIncentive(emp.id, e.target.value)
                            } else if (e.key === 'Escape') {
                              setEditingIncentive(null)
                            }
                          }}
                          autoFocus
                          className="w-24 px-2 py-1 border border-spectro-teal rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-spectro-teal"
                        />
                      ) : (
                        <span 
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingIncentive(emp.id)
                          }}
                          className="cursor-pointer hover:text-spectro-teal transition-colors"
                        >
                          ₱{incentive.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 dark:text-gray-300 text-slate-700 text-sm">₱{sss.toLocaleString()}</td>
                    <td className="py-4 px-6 dark:text-gray-300 text-slate-700 text-sm">₱{philhealth.toLocaleString()}</td>
                    <td className="py-4 px-6 dark:text-gray-300 text-slate-700 text-sm">₱{pagibig.toLocaleString()}</td>
                    <td className="py-4 px-6 dark:text-gray-300 text-slate-700 text-sm">
                      {editingCashAdvance === emp.id ? (
                        <input
                          type="number"
                          defaultValue={emp.cash_advance || 0}
                          onBlur={(e) => updateCashAdvance(emp.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateCashAdvance(emp.id, e.target.value)
                            } else if (e.key === 'Escape') {
                              setEditingCashAdvance(null)
                            }
                          }}
                          autoFocus
                          className="w-24 px-2 py-1 border border-spectro-purple rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-spectro-purple"
                        />
                      ) : (
                        <span 
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingCashAdvance(emp.id)
                          }}
                          className="cursor-pointer hover:text-spectro-purple transition-colors"
                        >
                          ₱{cashAdvance.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 font-semibold text-red-400 text-sm">₱{totalDed.toLocaleString()}</td>
                    <td className="py-4 px-6 font-bold text-spectro-teal text-sm">₱{netPay.toLocaleString()}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {previewEmployee && <PayslipPreview employee={previewEmployee} />}
    </div>
  )
}

export default Payroll
