import React, { useState, useEffect } from 'react'
import { Download, FileText, FileSpreadsheet, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { getRevenueReport } from '../services/doctorRevenueService'
import {
  exportRevenueReportCSV,
  exportRevenueReportPDF,
  exportRevenueReportExcel,
  generateRevenueReportFilename,
  downloadFile
} from '../services/exportService'
import RevenueSummaryCards from '../components/revenue/RevenueSummaryCards'
import DoctorRevenueTable from '../components/revenue/DoctorRevenueTable'
import DateRangeFilter from '../components/analytics/DateRangeFilter'

/**
 * Doctor Revenue Report Page
 * 
 * Main component for displaying the Doctor Revenue Sharing Report.
 * Shows per-doctor consultation counts and revenue breakdowns with automatic 60/40 split.
 * Supports date range filtering and export to CSV, PDF, and Excel formats.
 * 
 * Validates: Requirements 1.1, 4.1, 5.1, 8.1, 8.2, 8.3, 8.5, 9.1, 10.1
 */
const DoctorRevenueReport = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  // State management
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState(null)
  const [error, setError] = useState(null)
  const [exportFormat, setExportFormat] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [sortBy, setSortBy] = useState('consultationCount')
  const [sortOrder, setSortOrder] = useState('desc')

  // Date range state - default to current month
  const getDefaultDateRange = () => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return { startDate: firstDay, endDate: lastDay }
  }

  const [dateRange, setDateRange] = useState(getDefaultDateRange())

  // Check access control on mount
  useEffect(() => {
    if (!user) {
      // Not authenticated - redirect to login
      sessionStorage.setItem('redirectAfterLogin', '/reports?tab=doctor-revenue')
      navigate('/login')
      return
    }

    // Check role-based access
    if (!['admin', 'doctor'].includes(user.role)) {
      // Unauthorized role - redirect to dashboard
      console.warn(`Unauthorized access attempt by user ${user.id} with role ${user.role}`)
      navigate('/dashboard')
      return
    }
  }, [user, navigate])

  // Load report data when date range changes
  useEffect(() => {
    if (user && ['admin', 'doctor'].includes(user.role)) {
      loadReportData()
    }
  }, [dateRange, user])

  /**
   * Load report data from service layer
   * Applies role-based filtering (doctors see only their own data)
   */
  const loadReportData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Format date range for API
      const formattedDateRange = {
        startDate: dateRange.startDate.toISOString().split('T')[0],
        endDate: dateRange.endDate.toISOString().split('T')[0]
      }

      // Apply role-based filtering
      const doctorId = user.role === 'doctor' ? user.doctor_id : null

      // Fetch report data
      const data = await getRevenueReport(formattedDateRange, doctorId)
      
      // Apply sorting
      const sortedData = {
        ...data,
        doctors: sortDoctors(data.doctors, sortBy, sortOrder)
      }

      setReportData(sortedData)
    } catch (err) {
      console.error('Error loading revenue report:', err)
      setError(err.message || 'Failed to load revenue report. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Sort doctors array by specified column and order
   */
  const sortDoctors = (doctors, column, order) => {
    const sorted = [...doctors].sort((a, b) => {
      let aVal, bVal

      switch (column) {
        case 'doctorName':
          aVal = a.doctorName.toLowerCase()
          bVal = b.doctorName.toLowerCase()
          return order === 'asc' 
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal)
        
        case 'consultationCount':
          aVal = a.consultationCount
          bVal = b.consultationCount
          break
        
        case 'totalRevenue':
          aVal = a.totalRevenue
          bVal = b.totalRevenue
          break
        
        default:
          return 0
      }

      return order === 'asc' ? aVal - bVal : bVal - aVal
    })

    return sorted
  }

  /**
   * Handle date range change from DateRangeFilter
   */
  const handleDateRangeChange = (start, end) => {
    setDateRange({ startDate: start, endDate: end })
  }

  /**
   * Handle sort column change
   */
  const handleSort = (column) => {
    if (sortBy === column) {
      // Toggle sort order
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // New column - default to descending
      setSortBy(column)
      setSortOrder('desc')
    }

    // Re-sort data
    if (reportData) {
      setReportData({
        ...reportData,
        doctors: sortDoctors(reportData.doctors, column, sortOrder === 'asc' ? 'desc' : 'asc')
      })
    }
  }

  /**
   * Handle export to specified format
   */
  const handleExport = async (format) => {
    if (!reportData) return

    try {
      setExporting(true)
      setExportFormat(format)

      const formattedDateRange = {
        startDate: dateRange.startDate.toISOString().split('T')[0],
        endDate: dateRange.endDate.toISOString().split('T')[0]
      }

      let blob
      switch (format) {
        case 'csv':
          blob = await exportRevenueReportCSV(reportData, formattedDateRange)
          break
        case 'pdf':
          blob = await exportRevenueReportPDF(reportData, formattedDateRange)
          break
        case 'xlsx':
          blob = await exportRevenueReportExcel(reportData, formattedDateRange)
          break
        default:
          throw new Error('Invalid export format')
      }

      const filename = generateRevenueReportFilename(format, formattedDateRange)
      downloadFile(blob, filename)
    } catch (err) {
      console.error('Export failed:', err)
      setError(`Failed to export ${format.toUpperCase()}: ${err.message}`)
    } finally {
      setExporting(false)
      setExportFormat(null)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading revenue report...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Report</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={loadReportData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Doctor Revenue Sharing Report</h1>
          <p className="text-slate-600 mt-1">
            60% Doctor Share / 40% Clinic Share
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
          >
            {exporting && exportFormat === 'csv' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            Export CSV
          </button>

          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
          >
            {exporting && exportFormat === 'pdf' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Export PDF
          </button>

          <button
            onClick={() => handleExport('xlsx')}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
          >
            {exporting && exportFormat === 'xlsx' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            Export Excel
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <DateRangeFilter
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onChange={handleDateRangeChange}
        />
      </div>

      {/* Summary Cards */}
      {reportData && (
        <RevenueSummaryCards
          totalConsultations={reportData.summary.totalConsultations}
          totalRevenue={reportData.summary.totalRevenue}
          totalDoctorShare={reportData.summary.totalDoctorShare}
          totalClinicShare={reportData.summary.totalClinicShare}
          dataQualityScore={reportData.dataQualityScore}
        />
      )}

      {/* Doctor Revenue Table */}
      {reportData && (
        <DoctorRevenueTable
          doctors={reportData.doctors}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
      )}
    </div>
  )
}

export default DoctorRevenueReport
