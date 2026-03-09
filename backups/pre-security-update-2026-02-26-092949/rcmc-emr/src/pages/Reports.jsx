import { useState, useEffect } from 'react'
import { Calendar, Download, FileText, TrendingUp, Users, DollarSign, Package, Activity } from 'lucide-react'
import { db } from '../lib/supabase'
import HeartbeatLoader from '../components/HeartbeatLoader'

const Reports = () => {
  const [activeTab, setActiveTab] = useState('financial')
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [reportData, setReportData] = useState(null)

  useEffect(() => {
    loadReportData()
  }, [activeTab, dateRange])

  const loadReportData = async () => {
    setLoading(true)
    try {
      switch (activeTab) {
        case 'financial':
          await loadFinancialReport()
          break
        case 'patients':
          await loadPatientReport()
          break
        case 'appointments':
          await loadAppointmentReport()
          break
        case 'inventory':
          await loadInventoryReport()
          break
        default:
          break
      }
    } catch (error) {
      console.error('Error loading report:', error)
      alert('Error loading report: ' + error.message)
      // Set empty data to prevent white page
      setReportData({})
    } finally {
      setLoading(false)
    }
  }

  const loadFinancialReport = async () => {
    const billingData = await db.getBilling(1000, 0, '', 'All')
    
    // Filter by date range
    const filtered = billingData.filter(bill => {
      const billDate = new Date(bill.created_at).toISOString().split('T')[0]
      return billDate >= dateRange.start && billDate <= dateRange.end
    })

    const totalRevenue = filtered.reduce((sum, bill) => sum + parseFloat(bill.total_amount || 0), 0)
    const totalPaid = filtered.reduce((sum, bill) => sum + parseFloat(bill.amount_paid || 0), 0)
    const outstanding = filtered.reduce((sum, bill) => sum + parseFloat(bill.remaining_balance || 0), 0)

    const byMethod = {}
    const byStatus = {}
    
    filtered.forEach(bill => {
      const method = bill.payment_method || 'Cash'
      const status = bill.payment_status || 'Pending'
      
      byMethod[method] = (byMethod[method] || 0) + parseFloat(bill.amount_paid || 0)
      byStatus[status] = (byStatus[status] || 0) + 1
    })

    setReportData({
      totalRevenue,
      totalPaid,
      outstanding,
      transactionCount: filtered.length,
      avgTransaction: filtered.length > 0 ? totalPaid / filtered.length : 0,
      byMethod,
      byStatus,
      transactions: filtered
    })
  }

  const loadPatientReport = async () => {
    try {
      const patients = await db.getPatients(10000)
      
      // Get all patients for total count
      const allPatients = patients || []
      
      // Filter by date range for new patients
      const filtered = allPatients.filter(patient => {
        if (!patient.created_at) return false
        const createdDate = new Date(patient.created_at).toISOString().split('T')[0]
        return createdDate >= dateRange.start && createdDate <= dateRange.end
      })

      const genderBreakdown = {}
      const ageGroups = { '0-17': 0, '18-35': 0, '36-50': 0, '51-65': 0, '65+': 0 }
      const bloodTypes = {}

      // Use all patients for demographics
      allPatients.forEach(patient => {
        // Gender
        const gender = patient.gender || 'Unknown'
        genderBreakdown[gender] = (genderBreakdown[gender] || 0) + 1

        // Age groups - calculate from date_of_birth if age not available
        let age = patient.age || 0
        if (!age && patient.date_of_birth) {
          const birthDate = new Date(patient.date_of_birth)
          const today = new Date()
          age = today.getFullYear() - birthDate.getFullYear()
        }
        
        if (age < 18) ageGroups['0-17']++
        else if (age < 36) ageGroups['18-35']++
        else if (age < 51) ageGroups['36-50']++
        else if (age < 66) ageGroups['51-65']++
        else ageGroups['65+']++

        // Blood type
        const bloodType = patient.blood_type || 'Unknown'
        bloodTypes[bloodType] = (bloodTypes[bloodType] || 0) + 1
      })

      setReportData({
        totalPatients: allPatients.length,
        genderBreakdown,
        ageGroups,
        bloodTypes,
        newPatients: filtered.length
      })
    } catch (error) {
      console.error('Error in loadPatientReport:', error)
      throw error
    }
  }

  const loadAppointmentReport = async () => {
    try {
      const appointments = await db.getAppointments()
      
      // Filter by date range
      const filtered = (appointments || []).filter(apt => {
        if (!apt.appointment_date) return false
        const aptDate = apt.appointment_date
        return aptDate >= dateRange.start && aptDate <= dateRange.end
      })

      const byStatus = {}
      const byType = {}
      
      filtered.forEach(apt => {
        const status = apt.status || 'Scheduled'
        const type = apt.appointment_type || 'Consultation'
        
        byStatus[status] = (byStatus[status] || 0) + 1
        byType[type] = (byType[type] || 0) + 1
      })

      setReportData({
        totalAppointments: filtered.length,
        byStatus,
        byType,
        completed: byStatus['Completed'] || 0,
        cancelled: byStatus['Cancelled'] || 0,
        noShow: byStatus['No Show'] || 0
      })
    } catch (error) {
      console.error('Error in loadAppointmentReport:', error)
      throw error
    }
  }

  const loadInventoryReport = async () => {
    try {
      const inventory = await db.getInventory()
      const billingData = await db.getBilling(1000, 0, '', 'All')
      
      // Filter billing by date range
      const filtered = (billingData || []).filter(bill => {
        if (!bill.created_at) return false
        const billDate = new Date(bill.created_at).toISOString().split('T')[0]
        return billDate >= dateRange.start && billDate <= dateRange.end
      })

      // Calculate inventory usage
      const usage = {}
      filtered.forEach(bill => {
        if (bill.items && Array.isArray(bill.items)) {
          bill.items.forEach(item => {
            if (item.type === 'inventory') {
              if (!usage[item.name]) {
                usage[item.name] = { quantity: 0, revenue: 0 }
              }
              usage[item.name].quantity += item.quantity || 1
              usage[item.name].revenue += parseFloat(item.total || item.price || 0)
            }
          })
        }
      })

      const topItems = Object.entries(usage)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)

      const inventoryList = inventory || []
      const lowStock = inventoryList.filter(item => item.status === 'Low Stock' || item.status === 'Critical')
      const outOfStock = inventoryList.filter(item => item.status === 'Out of Stock')

      setReportData({
        totalItems: inventoryList.length,
        lowStock: lowStock.length,
        outOfStock: outOfStock.length,
        topItems,
        lowStockItems: lowStock,
        outOfStockItems: outOfStock
      })
    } catch (error) {
      console.error('Error in loadInventoryReport:', error)
      throw error
    }
  }

  const exportToCSV = () => {
    if (!reportData) {
      alert('No data to export')
      return
    }

    let csvContent = ''
    let filename = ''

    try {
      switch (activeTab) {
        case 'financial':
          csvContent = 'Receipt Number,Patient,Date,Amount,Paid,Balance,Method,Status\n'
          if (reportData.transactions && reportData.transactions.length > 0) {
            reportData.transactions.forEach(t => {
              csvContent += `${t.receipt_number || 'N/A'},${t.patient_name || 'N/A'},${t.date || 'N/A'},${t.total_amount || 0},${t.amount_paid || 0},${t.remaining_balance || 0},${t.payment_method || 'N/A'},${t.payment_status || 'N/A'}\n`
            })
          }
          filename = `Financial_Report_${dateRange.start}_${dateRange.end}.csv`
          break
        
        case 'patients':
          csvContent = 'Metric,Value\n'
          csvContent += `Total Patients,${reportData.totalPatients || 0}\n`
          csvContent += `New Patients,${reportData.newPatients || 0}\n`
          if (reportData.genderBreakdown) {
            Object.entries(reportData.genderBreakdown).forEach(([gender, count]) => {
              csvContent += `${gender},${count}\n`
            })
          }
          filename = `Patient_Report_${dateRange.start}_${dateRange.end}.csv`
          break
        
        case 'appointments':
          csvContent = 'Metric,Value\n'
          csvContent += `Total Appointments,${reportData.totalAppointments || 0}\n`
          csvContent += `Completed,${reportData.completed || 0}\n`
          csvContent += `Cancelled,${reportData.cancelled || 0}\n`
          csvContent += `No Show,${reportData.noShow || 0}\n`
          filename = `Appointment_Report_${dateRange.start}_${dateRange.end}.csv`
          break
        
        case 'inventory':
          csvContent = 'Item,Quantity Sold,Revenue\n'
          if (reportData.topItems && reportData.topItems.length > 0) {
            reportData.topItems.forEach(item => {
              csvContent += `${item.name},${item.quantity},${item.revenue.toFixed(2)}\n`
            })
          }
          filename = `Inventory_Report_${dateRange.start}_${dateRange.end}.csv`
          break
      }

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting CSV:', error)
      alert('Error exporting CSV: ' + error.message)
    }
  }

  const tabs = [
    { id: 'financial', label: 'Financial', icon: DollarSign },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'inventory', label: 'Inventory', icon: Package }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-sm text-slate-600 mt-1">Generate comprehensive reports and insights</p>
        </div>
        
        {/* Date Range Selector */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-slate-400" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
            <span className="text-slate-500">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors text-sm font-semibold min-h-[44px]"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm p-2">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors min-h-[44px] ${
                  activeTab === tab.id
                    ? 'bg-teal-500 text-white'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon size={18} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        {loading ? (
          <div className="py-12">
            <HeartbeatLoader message="Generating report..." />
          </div>
        ) : !reportData ? (
          <div className="py-12 text-center">
            <FileText size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-600 font-semibold">No data available</p>
            <p className="text-sm text-slate-500 mt-1">Adjust the date range and try again</p>
          </div>
        ) : (
          <>
            {activeTab === 'financial' && <FinancialReport data={reportData} />}
            {activeTab === 'patients' && <PatientReport data={reportData} />}
            {activeTab === 'appointments' && <AppointmentReport data={reportData} />}
            {activeTab === 'inventory' && <InventoryReport data={reportData} />}
          </>
        )}
      </div>
    </div>
  )
}

// Financial Report Component
const FinancialReport = ({ data }) => (
  <div className="space-y-6">
    {/* Summary Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4">
        <p className="text-sm text-teal-700 font-semibold mb-1">Total Revenue</p>
        <p className="text-2xl font-bold text-teal-900">₱{data.totalRevenue.toLocaleString()}</p>
      </div>
      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
        <p className="text-sm text-green-700 font-semibold mb-1">Total Collected</p>
        <p className="text-2xl font-bold text-green-900">₱{data.totalPaid.toLocaleString()}</p>
      </div>
      <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4">
        <p className="text-sm text-amber-700 font-semibold mb-1">Outstanding</p>
        <p className="text-2xl font-bold text-amber-900">₱{data.outstanding.toLocaleString()}</p>
      </div>
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
        <p className="text-sm text-blue-700 font-semibold mb-1">Transactions</p>
        <p className="text-2xl font-bold text-blue-900">{data.transactionCount}</p>
      </div>
    </div>

    {/* Payment Methods */}
    <div>
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Revenue by Payment Method</h3>
      <div className="space-y-3">
        {Object.entries(data.byMethod).map(([method, amount]) => (
          <div key={method} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <span className="font-medium text-slate-700">{method}</span>
            <span className="text-lg font-bold text-slate-900">₱{amount.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>

    {/* Payment Status */}
    <div>
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Payment Status Distribution</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Object.entries(data.byStatus).map(([status, count]) => (
          <div key={status} className="bg-slate-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{count}</p>
            <p className="text-sm text-slate-600 mt-1">{status}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
)

// Patient Report Component
const PatientReport = ({ data }) => {
  if (!data || !data.totalPatients) {
    return (
      <div className="py-12 text-center">
        <Users size={48} className="mx-auto text-slate-300 mb-4" />
        <p className="text-slate-600 font-semibold">No patient data available</p>
        <p className="text-sm text-slate-500 mt-1">Add patients to see analytics</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4">
          <p className="text-sm text-teal-700 font-semibold mb-1">Total Patients</p>
          <p className="text-2xl font-bold text-teal-900">{data.totalPatients || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
          <p className="text-sm text-blue-700 font-semibold mb-1">New Patients</p>
          <p className="text-2xl font-bold text-blue-900">{data.newPatients || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
          <p className="text-sm text-purple-700 font-semibold mb-1">Growth Rate</p>
          <p className="text-2xl font-bold text-purple-900">
            {data.totalPatients > 0 ? ((data.newPatients / data.totalPatients) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>

      {/* Gender Breakdown */}
      {data.genderBreakdown && Object.keys(data.genderBreakdown).length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Gender Distribution</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(data.genderBreakdown).map(([gender, count]) => (
              <div key={gender} className="bg-slate-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-slate-900">{count}</p>
                <p className="text-sm text-slate-600 mt-1">{gender}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Age Groups */}
      {data.ageGroups && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Age Distribution</h3>
          <div className="space-y-3">
            {Object.entries(data.ageGroups).map(([group, count]) => (
              <div key={group} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="font-medium text-slate-700">{group} years</span>
                <span className="text-lg font-bold text-slate-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blood Types */}
      {data.bloodTypes && Object.keys(data.bloodTypes).length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Blood Type Distribution</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(data.bloodTypes).map(([type, count]) => (
              <div key={type} className="bg-slate-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-slate-900">{count}</p>
                <p className="text-sm text-slate-600 mt-1">{type}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Appointment Report Component
const AppointmentReport = ({ data }) => {
  if (!data || !data.totalAppointments) {
    return (
      <div className="py-12 text-center">
        <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
        <p className="text-slate-600 font-semibold">No appointment data available</p>
        <p className="text-sm text-slate-500 mt-1">Schedule appointments to see analytics</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4">
          <p className="text-sm text-teal-700 font-semibold mb-1">Total Appointments</p>
          <p className="text-2xl font-bold text-teal-900">{data.totalAppointments || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
          <p className="text-sm text-green-700 font-semibold mb-1">Completed</p>
          <p className="text-2xl font-bold text-green-900">{data.completed || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4">
          <p className="text-sm text-red-700 font-semibold mb-1">Cancelled</p>
          <p className="text-2xl font-bold text-red-900">{data.cancelled || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4">
          <p className="text-sm text-amber-700 font-semibold mb-1">No Show</p>
          <p className="text-2xl font-bold text-amber-900">{data.noShow || 0}</p>
        </div>
      </div>

      {/* Status Breakdown */}
      {data.byStatus && Object.keys(data.byStatus).length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Appointment Status</h3>
          <div className="space-y-3">
            {Object.entries(data.byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="font-medium text-slate-700">{status}</span>
                <span className="text-lg font-bold text-slate-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Type Breakdown */}
      {data.byType && Object.keys(data.byType).length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Appointment Types</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(data.byType).map(([type, count]) => (
              <div key={type} className="bg-slate-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-slate-900">{count}</p>
                <p className="text-sm text-slate-600 mt-1">{type}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Inventory Report Component
const InventoryReport = ({ data }) => {
  if (!data || data.totalItems === undefined) {
    return (
      <div className="py-12 text-center">
        <Package size={48} className="mx-auto text-slate-300 mb-4" />
        <p className="text-slate-600 font-semibold">No inventory data available</p>
        <p className="text-sm text-slate-500 mt-1">Add inventory items to see analytics</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4">
          <p className="text-sm text-teal-700 font-semibold mb-1">Total Items</p>
          <p className="text-2xl font-bold text-teal-900">{data.totalItems || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4">
          <p className="text-sm text-amber-700 font-semibold mb-1">Low Stock</p>
          <p className="text-2xl font-bold text-amber-900">{data.lowStock || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4">
          <p className="text-sm text-red-700 font-semibold mb-1">Out of Stock</p>
          <p className="text-2xl font-bold text-red-900">{data.outOfStock || 0}</p>
        </div>
      </div>

      {/* Top Selling Items */}
      {data.topItems && data.topItems.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Top Selling Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Item</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Quantity Sold</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.topItems.map((item, index) => (
                  <tr key={index} className="border-b border-slate-100">
                    <td className="py-3 px-4 font-medium text-slate-900">{item.name}</td>
                    <td className="py-3 px-4 text-slate-700">{item.quantity}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">₱{item.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data.topItems && data.topItems.length === 0 && (
        <div className="text-center py-8 bg-slate-50 rounded-lg">
          <p className="text-slate-600">No sales data available for the selected date range</p>
        </div>
      )}

      {/* Low Stock Alert */}
      {data.lowStockItems && data.lowStockItems.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Low Stock Alert</h3>
          <div className="space-y-2">
            {data.lowStockItems.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                <span className="font-medium text-amber-900">{item.name}</span>
                <span className="text-sm text-amber-700">Stock: {item.stock}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Reports
