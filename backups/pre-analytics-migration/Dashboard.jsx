import { useState, useEffect } from 'react';
import { RefreshCw, Download, Users, Activity, Heart, DollarSign } from 'lucide-react';
import KPICard from '../components/analytics/KPICard';
import PatientDistributionChart from '../components/analytics/PatientDistributionChart';
import RevenueTrendChart from '../components/analytics/RevenueTrendChart';
import ExpenseBreakdownChart from '../components/analytics/ExpenseBreakdownChart';
import PerformanceComparisonChart from '../components/analytics/PerformanceComparisonChart';
import DateRangeFilter from '../components/analytics/DateRangeFilter';
import useAnalytics from '../hooks/useAnalytics';
import exportService from '../services/exportService';
import HeartbeatLoader from '../components/HeartbeatLoader';
import { useAuth } from '../context/AuthContext';

/**
 * Advanced Analytics Dashboard
 * 
 * Displays comprehensive healthcare metrics with interactive visualizations,
 * date range filtering, real-time updates, and data export capabilities.
 * 
 * Features:
 * - Four KPI cards (Total Patients, Bed Occupancy, Patient Satisfaction, Total Revenue)
 * - Four interactive charts (Patient Distribution, Revenue Trend, Expense Breakdown, Performance Comparison)
 * - Date range filtering with presets
 * - Automatic refresh every 5 minutes
 * - Manual refresh button
 * - Export to PDF, Excel, and CSV
 * - Responsive design (mobile, tablet, desktop)
 * - Loading states and error handling
 * 
 * Validates: Requirements 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.4, 9.1-9.6, 10.6, 10.11, 12.3-12.7
 */

const Dashboard = () => {
  const { userProfile } = useAuth();
  
  // Initialize date range to current month (first day to current day)
  const getDefaultDateRange = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return {
      startDate: firstDay,
      endDate: now
    };
  };

  // Try to restore date range from session storage
  const getInitialDateRange = () => {
    try {
      const stored = sessionStorage.getItem('dashboardDateRange');
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
    return getDefaultDateRange();
  };

  const [dateRange, setDateRange] = useState(getInitialDateRange);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);

  // Use analytics hook for data fetching and real-time updates
  const { metrics, chartData, loading, error, lastUpdated, refresh } = useAnalytics(dateRange);

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

  // Loading state
  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-full">
        <HeartbeatLoader message="Loading analytics dashboard..." />
      </div>
    );
  }

  // Error state
  if (error && !metrics) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Failed to Load Dashboard</h2>
          <p className="text-slate-600 mb-4">{error.message}</p>
          <button
            onClick={refresh}
            className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Dashboard Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            Analytics Dashboard
          </h1>
          <p className="text-sm text-slate-600">
            Comprehensive healthcare metrics and insights
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Last Updated */}
          {lastUpdated && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>Last updated: {formatLastUpdated(lastUpdated)}</span>
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh dashboard data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {/* Export Button */}
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <DateRangeFilter
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onChange={handleDateRangeChange}
        />
      </div>

      {/* Error Banner */}
      {error && metrics && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">Failed to refresh data</p>
            <p className="text-sm text-red-700 mt-1">{error.message}</p>
          </div>
          <button
            onClick={refresh}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Patients"
          value={metrics?.totalPatients?.current || 0}
          previousValue={metrics?.totalPatients?.previous || 0}
          format="number"
          icon={Users}
          iconColor="teal"
          trend={metrics?.totalPatients?.changePercentage >= 0 ? 'up' : 'down'}
          trendPercentage={metrics?.totalPatients?.changePercentage || 0}
          description="Active patients in selected period"
        />

        <KPICard
          title="Bed Occupancy Rate"
          value={metrics?.bedOccupancy?.current || 0}
          previousValue={metrics?.bedOccupancy?.previous || 0}
          format="percentage"
          icon={Activity}
          iconColor="purple"
          trend={metrics?.bedOccupancy?.changePercentage >= 0 ? 'up' : 'down'}
          trendPercentage={metrics?.bedOccupancy?.changePercentage || 0}
          description="Current bed utilization"
        />

        <KPICard
          title="Patient Satisfaction"
          value={metrics?.patientSatisfaction?.current || 0}
          previousValue={metrics?.patientSatisfaction?.previous || 0}
          format="rating"
          icon={Heart}
          iconColor="pink"
          trend={metrics?.patientSatisfaction?.changePercentage >= 0 ? 'up' : 'down'}
          trendPercentage={metrics?.patientSatisfaction?.changePercentage || 0}
          description="Average satisfaction score"
        />

        <KPICard
          title="Total Revenue"
          value={metrics?.totalRevenue?.current || 0}
          previousValue={metrics?.totalRevenue?.previous || 0}
          format="currency"
          icon={DollarSign}
          iconColor="teal"
          trend={metrics?.totalRevenue?.changePercentage >= 0 ? 'up' : 'down'}
          trendPercentage={metrics?.totalRevenue?.changePercentage || 0}
          description="Revenue from paid billing"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Distribution Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Patient Distribution by Department
          </h2>
          {loading ? (
            <div className="flex items-center justify-center h-80">
              <div className="animate-pulse text-slate-400">Loading chart...</div>
            </div>
          ) : (
            <PatientDistributionChart
              data={chartData?.patientDistribution || []}
              totalPatients={metrics?.totalPatients?.current || 0}
            />
          )}
        </div>

        {/* Revenue Trend Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Revenue Trend
          </h2>
          {loading ? (
            <div className="flex items-center justify-center h-80">
              <div className="animate-pulse text-slate-400">Loading chart...</div>
            </div>
          ) : (
            <RevenueTrendChart
              data={chartData?.revenueTrend || []}
              timeGranularity="monthly"
            />
          )}
        </div>

        {/* Expense Breakdown Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Expense Breakdown
          </h2>
          {loading ? (
            <div className="flex items-center justify-center h-80">
              <div className="animate-pulse text-slate-400">Loading chart...</div>
            </div>
          ) : (
            <ExpenseBreakdownChart
              data={chartData?.expenseBreakdown || []}
            />
          )}
        </div>

        {/* Performance Comparison Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Performance Metrics
          </h2>
          {loading ? (
            <div className="flex items-center justify-center h-80">
              <div className="animate-pulse text-slate-400">Loading chart...</div>
            </div>
          ) : (
            <PerformanceComparisonChart
              hospitalData={chartData?.performanceComparison?.hospital || {}}
              baselineData={chartData?.performanceComparison?.baseline || {}}
            />
          )}
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Export Dashboard Data</h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-1 hover:bg-slate-100 rounded transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-slate-600 mb-6">
              Choose a format to export your analytics data:
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleExport('pdf')}
                disabled={exporting}
                className="w-full flex items-center justify-between p-4 border-2 border-slate-200 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-900">PDF Document</p>
                    <p className="text-xs text-slate-500">Formatted report with charts</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => handleExport('xlsx')}
                disabled={exporting}
                className="w-full flex items-center justify-between p-4 border-2 border-slate-200 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-900">Excel Workbook</p>
                    <p className="text-xs text-slate-500">Multiple sheets with data</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => handleExport('csv')}
                disabled={exporting}
                className="w-full flex items-center justify-between p-4 border-2 border-slate-200 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-900">CSV File</p>
                    <p className="text-xs text-slate-500">Plain text data format</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {exportError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{exportError}</p>
              </div>
            )}

            {exporting && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-600">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating export...</span>
              </div>
            )}

            <button
              onClick={() => setShowExportModal(false)}
              disabled={exporting}
              className="w-full mt-4 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
