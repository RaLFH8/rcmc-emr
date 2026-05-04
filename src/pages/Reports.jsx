import { useState, useEffect, useMemo } from 'react'
import { Calendar, Download, FileText, TrendingUp, Users, DollarSign, Package, Activity, RefreshCw, Heart, UserCheck, CreditCard, Tag, ChevronUp, ChevronDown } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts'
import { db } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import SkeletonLoader from '../components/SkeletonLoader'
import KPICard from '../components/analytics/KPICard'
import PatientDistributionChart from '../components/analytics/PatientDistributionChart'
import RevenueTrendChart from '../components/analytics/RevenueTrendChart'
import RevenueInsightsChart from '../components/analytics/RevenueInsightsChart'
import PerformanceComparisonChart from '../components/analytics/PerformanceComparisonChart'
import DateRangeFilter from '../components/analytics/DateRangeFilter'
import useAnalytics from '../hooks/useAnalytics'
import exportService from '../services/exportService'
import DoctorRevenueReport from './DoctorRevenueReport'
import FinancialTab from '../components/billing/FinancialTab'

const Reports = () => {
  const { user, userProfile } = useAuth()
  const [activeTab, setActiveTab] = useState('analytics')
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
    // Skip loading for tabs that manage their own data
    if (activeTab === 'analytics' || activeTab === 'doctor-revenue' || activeTab === 'financial') {
      return
    }
    
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
    const billingResult = await db.getBilling(5000, 0, '', 'All')
    
    // getBilling returns { data: [...], count: N } — unwrap the array
    const billingData = billingResult?.data || billingResult || []
    
    // Filter by date range — compare date-only strings to avoid timezone/time issues
    const filtered = billingData.filter(bill => {
      if (!bill.created_at) return false
      const billDate = bill.created_at.substring(0, 10)
      return billDate >= dateRange.start && billDate <= dateRange.end
    })

    const totalRevenue = filtered.reduce((sum, bill) => sum + parseFloat(bill.total_amount || 0), 0)
    const totalPaid = filtered.reduce((sum, bill) => sum + parseFloat(bill.amount_paid || 0), 0)
    const totalDiscounts = filtered.reduce((sum, bill) => sum + parseFloat(bill.discount_amount || 0), 0)
    const outstanding = totalRevenue - totalPaid

    // Payment method breakdown (Cash, GCash, Maya, Bank Transfer, Others)
    const PAYMENT_METHODS = ['Cash', 'GCash', 'Maya', 'Bank Transfer']
    const byMethod = {}
    const byStatus = {}
    const discountByType = {}

    filtered.forEach(bill => {
      const rawMethod = (bill.payment_method || 'Cash').trim()
      const method = PAYMENT_METHODS.includes(rawMethod) ? rawMethod : 'Others'
      const status = bill.payment_status || 'Pending'
      const discountType = bill.discount_type || null
      const discountAmt = parseFloat(bill.discount_amount || 0)

      byMethod[method] = (byMethod[method] || 0) + parseFloat(bill.total_amount || 0)
      byStatus[status] = (byStatus[status] || 0) + 1

      if (discountType && discountAmt > 0) {
        if (!discountByType[discountType]) {
          discountByType[discountType] = { amount: 0, count: 0 }
        }
        discountByType[discountType].amount += discountAmt
        discountByType[discountType].count += 1
      }
    })

    // Build cash flow chart data grouped by date within range
    const cashFlowByDate = {}
    filtered.forEach(bill => {
      const date = bill.created_at.substring(0, 10)
      const rawMethod = (bill.payment_method || 'Cash').trim()
      const method = PAYMENT_METHODS.includes(rawMethod) ? rawMethod : 'Others'
      if (!cashFlowByDate[date]) {
        cashFlowByDate[date] = { date, Cash: 0, GCash: 0, Maya: 0, 'Bank Transfer': 0, Others: 0 }
      }
      cashFlowByDate[date][method] = (cashFlowByDate[date][method] || 0) + parseFloat(bill.total_amount || 0)
    })
    const cashFlowData = Object.values(cashFlowByDate).sort((a, b) => a.date.localeCompare(b.date))

    // --- Period summaries ---
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    const dailyBills = billingData.filter(b => b.created_at && b.created_at.substring(0, 10) === todayStr)
    const dailyIncome = dailyBills.reduce((sum, b) => sum + parseFloat(b.amount_paid || 0), 0)

    const weekAgo = new Date(today)
    weekAgo.setDate(today.getDate() - 6)
    const weekAgoStr = weekAgo.toISOString().split('T')[0]
    const weeklyBills = billingData.filter(b => {
      if (!b.created_at) return false
      const d = b.created_at.substring(0, 10)
      return d >= weekAgoStr && d <= todayStr
    })
    const weeklyIncome = weeklyBills.reduce((sum, b) => sum + parseFloat(b.amount_paid || 0), 0)

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
    const monthlyBills = billingData.filter(b => {
      if (!b.created_at) return false
      const d = b.created_at.substring(0, 10)
      return d >= monthStart && d <= todayStr
    })
    const monthlyIncome = monthlyBills.reduce((sum, b) => sum + parseFloat(b.amount_paid || 0), 0)

    const yearStart = `${today.getFullYear()}-01-01`
    const yearlyBills = billingData.filter(b => {
      if (!b.created_at) return false
      const d = b.created_at.substring(0, 10)
      return d >= yearStart && d <= todayStr
    })
    const yearlyIncome = yearlyBills.reduce((sum, b) => sum + parseFloat(b.amount_paid || 0), 0)

    setReportData({
      totalRevenue,
      totalPaid,
      outstanding,
      totalDiscounts,
      transactionCount: filtered.length,
      avgTransaction: filtered.length > 0 ? totalRevenue / filtered.length : 0,
      byMethod,
      byStatus,
      discountByType,
      cashFlowData,
      transactions: filtered,
      dailyIncome,
      weeklyIncome,
      monthlyIncome,
      yearlyIncome,
      dailyCount: dailyBills.length,
      weeklyCount: weeklyBills.length,
      monthlyCount: monthlyBills.length,
      yearlyCount: yearlyBills.length,
    })
  }

  const loadPatientReport = async () => {
    try {
      const result = await db.getPatients(10000)
      
      // getPatients returns { data: [...], count: N } — unwrap the array
      const patients = result?.data || result || []
      
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
      const billingResult = await db.getBilling(1000, 0, '', 'All')
      
      // getBilling returns { data: [...], count: N } — unwrap the array
      const billingData = billingResult?.data || billingResult || []
      
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
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'financial', label: 'Financial', icon: DollarSign },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'inventory', label: 'Inventory', icon: Package },
    // Only show Doctor Revenue Sharing tab to admin and doctor roles
    ...(userProfile && ['admin', 'doctor'].includes(userProfile.role) 
      ? [{ id: 'doctor-revenue', label: 'Doctor Revenue Sharing', icon: UserCheck }]
      : [])
  ]

  return (
    <div className="space-y-6 w-full max-w-full">
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
            <SkeletonLoader variant="list" rows={5} message="Generating report..." />
          </div>
        ) : !reportData && activeTab !== 'analytics' && activeTab !== 'doctor-revenue' && activeTab !== 'financial' ? (
          <div className="py-12 text-center">
            <FileText size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-600 font-semibold">No data available</p>
            <p className="text-sm text-slate-500 mt-1">Adjust the date range and try again</p>
          </div>
        ) : (
          <>
            {activeTab === 'analytics' && <AnalyticsDashboard />}
            {activeTab === 'financial' && <FinancialTab />}
            {activeTab === 'patients' && <PatientReport data={reportData} />}
            {activeTab === 'appointments' && <AppointmentReport data={reportData} />}
            {activeTab === 'inventory' && <InventoryReport data={reportData} />}
            {activeTab === 'doctor-revenue' && <DoctorRevenueReport />}
          </>
        )}
      </div>
    </div>
  )
}

// Analytics Dashboard Component
const AnalyticsDashboard = () => {
  // Date range management with session storage
  const getInitialDateRange = () => {
    try {
      const stored = sessionStorage.getItem('analyticsDateRange');
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          startDate: new Date(parsed.startDate),
          endDate: new Date(parsed.endDate)
        };
      }
    } catch (error) {
      console.error('Error restoring date range:', error);
    }
    
    // Default to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startDate: firstDay, endDate: now };
  };

  const [dateRange, setDateRange] = useState(getInitialDateRange);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);

  // Use analytics hook
  const { metrics, chartData, loading, error, lastUpdated, refresh } = useAnalytics(dateRange);

  // Persist date range to session storage
  useEffect(() => {
    try {
      sessionStorage.setItem('analyticsDateRange', JSON.stringify({
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString()
      }));
    } catch (error) {
      console.warn('Failed to persist date range:', error);
    }
  }, [dateRange]);

  // Handle date range change
  const handleDateRangeChange = (startDate, endDate) => {
    setDateRange({ startDate, endDate });
  };

  // Handle export
  const handleExport = async (format) => {
    setExporting(true);
    setExportError(null);

    try {
      const data = { metrics, chartData };
      const dateRangeFormatted = {
        startDate: dateRange.startDate.toISOString().split('T')[0],
        endDate: dateRange.endDate.toISOString().split('T')[0]
      };

      let blob;
      if (format === 'pdf') {
        blob = await exportService.exportToPDF(data, dateRangeFormatted);
      } else if (format === 'xlsx') {
        blob = await exportService.exportToExcel(data, dateRangeFormatted);
      } else if (format === 'csv') {
        blob = await exportService.exportToCSV(data, dateRangeFormatted);
      }

      const filename = exportService.generateFilename(format, dateRangeFormatted);
      exportService.downloadFile(blob, filename);

      setShowExportModal(false);
    } catch (err) {
      console.error('Export error:', err);
      setExportError(err.message || 'Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Format last updated timestamp
  const formatLastUpdated = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="py-12">
        <SkeletonLoader variant="dashboard" message="Loading analytics..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <Activity size={48} className="mx-auto text-red-300 mb-4" />
        <p className="text-slate-600 font-semibold">Failed to load analytics</p>
        <p className="text-sm text-slate-500 mt-1">{error}</p>
        <button
          onClick={refresh}
          className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Header with Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 w-full">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Analytics Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">
            Last updated: {formatLastUpdated(lastUpdated)}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={refresh}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-sm font-medium"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <DateRangeFilter
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
        onChange={handleDateRangeChange}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        <KPICard
          title="Total Patients"
          value={metrics?.totalPatients?.current || 0}
          previousValue={metrics?.totalPatients?.previous || 0}
          format="number"
          icon={Users}
          iconColor="bg-blue-500"
        />
        <KPICard
          title="Bed Occupancy Rate"
          value={metrics?.bedOccupancy?.current || 0}
          previousValue={metrics?.bedOccupancy?.previous || 0}
          format="percentage"
          icon={Activity}
          iconColor="bg-teal-500"
        />
        <KPICard
          title="Patient Satisfaction"
          value={metrics?.patientSatisfaction?.current || 0}
          previousValue={metrics?.patientSatisfaction?.previous || 0}
          format="rating"
          icon={Heart}
          iconColor="bg-pink-500"
        />
        <KPICard
          title="Total Revenue"
          value={metrics?.totalRevenue?.current || 0}
          previousValue={metrics?.totalRevenue?.previous || 0}
          format="currency"
          icon={DollarSign}
          iconColor="bg-green-500"
        />
        <KPICard
          title="Net Revenue"
          value={metrics?.netRevenue?.current || 0}
          previousValue={metrics?.netRevenue?.previous || 0}
          format="currency"
          icon={Tag}
          iconColor="bg-emerald-500"
        />
        <KPICard
          title="Accounts Receivable"
          value={metrics?.accountsReceivable?.current || 0}
          previousValue={metrics?.accountsReceivable?.previous || 0}
          format="currency"
          icon={CreditCard}
          iconColor="bg-orange-500"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        <div className="bg-white rounded-xl shadow-sm p-6 min-w-0">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Patient Distribution</h3>
          <PatientDistributionChart 
            data={chartData?.patientDistribution || []} 
            totalPatients={chartData?.patientDistribution?.reduce((sum, dept) => sum + dept.count, 0) || 0}
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 min-w-0">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Revenue Trend</h3>
          <RevenueTrendChart data={chartData?.revenueTrend || []} />
        </div>

        <div className="min-w-0">
          <RevenueInsightsChart 
            data={chartData?.revenueInsights || {}} 
            totalRevenue={metrics?.totalRevenue?.current || 0}
            previousPeriodTotal={metrics?.totalRevenue?.previous || 0}
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 min-w-0">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Performance Comparison</h3>
          <PerformanceComparisonChart data={chartData?.performanceComparison || {}} />
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Export Dashboard Data</h3>
            
            {exportError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{exportError}</p>
              </div>
            )}

            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleExport('pdf')}
                disabled={exporting}
                className="w-full flex items-center gap-3 p-4 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                <FileText size={20} className="text-red-600" />
                <div className="text-left">
                  <p className="font-medium text-slate-900">PDF Document</p>
                  <p className="text-sm text-slate-500">Formatted report with charts</p>
                </div>
              </button>

              <button
                onClick={() => handleExport('xlsx')}
                disabled={exporting}
                className="w-full flex items-center gap-3 p-4 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                <FileText size={20} className="text-green-600" />
                <div className="text-left">
                  <p className="font-medium text-slate-900">Excel Workbook</p>
                  <p className="text-sm text-slate-500">Spreadsheet with multiple sheets</p>
                </div>
              </button>

              <button
                onClick={() => handleExport('csv')}
                disabled={exporting}
                className="w-full flex items-center gap-3 p-4 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                <FileText size={20} className="text-blue-600" />
                <div className="text-left">
                  <p className="font-medium text-slate-900">CSV File</p>
                  <p className="text-sm text-slate-500">Comma-separated values</p>
                </div>
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowExportModal(false);
                  setExportError(null);
                }}
                disabled={exporting}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Financial Report Component
const FinancialReport = ({ data }) => {
  if (!data || data.totalRevenue === undefined) {
    return (
      <div className="py-12 text-center">
        <DollarSign size={48} className="mx-auto text-slate-300 mb-4" />
        <p className="text-slate-600 font-semibold">No financial data available</p>
        <p className="text-sm text-slate-500 mt-1">Adjust the date range and try again</p>
      </div>
    )
  }

  const fmt = (n) => (n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="space-y-6">
      {/* Period Income Summary */}
      <div>
        <h3 className="text-base font-semibold text-slate-700 mb-3">Income Summary</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl p-4">
            <p className="text-xs text-sky-600 font-semibold uppercase tracking-wide mb-1">Today</p>
            <p className="text-2xl font-bold text-sky-900">₱{fmt(data.dailyIncome)}</p>
            <p className="text-xs text-sky-600 mt-1">{data.dailyCount || 0} transaction{data.dailyCount !== 1 ? 's' : ''}</p>
          </div>
          <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl p-4">
            <p className="text-xs text-violet-600 font-semibold uppercase tracking-wide mb-1">This Week</p>
            <p className="text-2xl font-bold text-violet-900">₱{fmt(data.weeklyIncome)}</p>
            <p className="text-xs text-violet-600 mt-1">{data.weeklyCount || 0} transaction{data.weeklyCount !== 1 ? 's' : ''}</p>
          </div>
          <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4">
            <p className="text-xs text-teal-600 font-semibold uppercase tracking-wide mb-1">This Month</p>
            <p className="text-2xl font-bold text-teal-900">₱{fmt(data.monthlyIncome)}</p>
            <p className="text-xs text-teal-600 mt-1">{data.monthlyCount || 0} transaction{data.monthlyCount !== 1 ? 's' : ''}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4">
            <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide mb-1">This Year</p>
            <p className="text-2xl font-bold text-amber-900">₱{fmt(data.yearlyIncome)}</p>
            <p className="text-xs text-amber-600 mt-1">{data.yearlyCount || 0} transaction{data.yearlyCount !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Date Range Summary Cards */}
      <div>
        <h3 className="text-base font-semibold text-slate-700 mb-3">Selected Date Range</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4 flex flex-col">
            <p className="text-sm text-teal-700 font-semibold mb-1">Total Billed</p>
            <p className="text-2xl font-bold text-teal-900">₱{fmt(data.totalRevenue)}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 flex flex-col">
            <p className="text-sm text-green-700 font-semibold mb-1">Total Collected</p>
            <p className="text-2xl font-bold text-green-900">₱{fmt(data.totalPaid)}</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 flex flex-col">
            <p className="text-sm text-red-700 font-semibold mb-1">Outstanding</p>
            <p className="text-2xl font-bold text-red-900">₱{fmt(data.outstanding)}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 flex flex-col">
            <p className="text-sm text-blue-700 font-semibold mb-1">Transactions</p>
            <p className="text-2xl font-bold text-blue-900">{data.transactionCount || 0}</p>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Revenue by Payment Method</h3>
        <div className="space-y-3">
          {Object.entries(data.byMethod).map(([method, amount]) => (
            <div key={method} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="font-medium text-slate-700">{method}</span>
              <span className="text-lg font-bold text-slate-900">₱{fmt(amount)}</span>
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
}

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
        <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4 flex flex-col">
          <p className="text-sm text-teal-700 font-semibold mb-1">Total Patients</p>
          <p className="text-2xl font-bold text-teal-900">{data.totalPatients || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 flex flex-col">
          <p className="text-sm text-blue-700 font-semibold mb-1">New Patients</p>
          <p className="text-2xl font-bold text-blue-900">{data.newPatients || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 flex flex-col">
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
        <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4 flex flex-col">
          <p className="text-sm text-teal-700 font-semibold mb-1">Total Appointments</p>
          <p className="text-2xl font-bold text-teal-900">{data.totalAppointments || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 flex flex-col">
          <p className="text-sm text-green-700 font-semibold mb-1">Completed</p>
          <p className="text-2xl font-bold text-green-900">{data.completed || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 flex flex-col">
          <p className="text-sm text-red-700 font-semibold mb-1">Cancelled</p>
          <p className="text-2xl font-bold text-red-900">{data.cancelled || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 flex flex-col">
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
        <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4 flex flex-col">
          <p className="text-sm text-teal-700 font-semibold mb-1">Total Items</p>
          <p className="text-2xl font-bold text-teal-900">{data.totalItems || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 flex flex-col">
          <p className="text-sm text-amber-700 font-semibold mb-1">Low Stock</p>
          <p className="text-2xl font-bold text-amber-900">{data.lowStock || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 flex flex-col">
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
