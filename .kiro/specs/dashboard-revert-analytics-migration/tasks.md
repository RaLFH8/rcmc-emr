# Implementation Plan: Dashboard Revert and Analytics Migration

## Overview

This implementation plan guides the migration of the RCMC EMR Dashboard back to its original implementation while moving the advanced analytics dashboard to the Reports module as a new "Analytics" tab. The approach ensures data preservation, maintains backward compatibility, and provides comprehensive test coverage.

## Tasks

- [x] 1. Backup current state and verify prerequisites
  - Create backup of current Dashboard.jsx to backups/pre-analytics-migration/
  - Create backup of current Reports.jsx to backups/pre-analytics-migration/
  - Verify backup file exists at backups/pre-security-update-2026-02-26-092920/rcmc-emr/src/pages/Dashboard.jsx
  - Verify all analytics component files exist in src/components/analytics/
  - Verify analytics service files exist (analyticsService.js, exportService.js, useAnalytics.js)
  - Document current Dashboard and Reports state for rollback reference
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 2. Restore original Dashboard implementation
  - [x] 2.1 Copy backup Dashboard.jsx to src/pages/Dashboard.jsx
    - Copy file from backups/pre-security-update-2026-02-26-092920/rcmc-emr/src/pages/Dashboard.jsx
    - Verify file size matches backup (approximately 30KB)
    - Verify imports include StatCard, Recharts components
    - Verify imports do NOT include analytics components
    - _Requirements: 1.1, 8.1_
  
  - [x] 2.2 Verify Dashboard component structure and features
    - Verify four stat cards render: Total Patient, Total Doctor, Book Appointment, Room Availability
    - Verify patient statistics chart with daily/weekly/monthly toggle exists
    - Verify appointment calendar with date navigation exists
    - Verify sales overview section exists with admin-only conditional rendering
    - Verify doctor performance metrics table exists
    - Verify recent patients table exists
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_
  
  - [ ]* 2.3 Write unit tests for Dashboard component
    - Test four stat cards render correctly
    - Test sales section displays for admin users only
    - Test sales section hidden for non-admin users
    - Test loading state displays HeartbeatLoader
    - Test error message displays when data loading fails
    - Test patient chart view toggle (daily/weekly/monthly)
    - Test appointment calendar navigation
    - Test doctor performance table rendering
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 9.1, 9.2, 9.3_

- [x] 3. Checkpoint - Verify Dashboard restoration
  - Test Dashboard loads without errors in browser
  - Verify all stat cards display data correctly
  - Verify admin user sees sales overview section
  - Verify non-admin user does not see sales section
  - Verify charts render with real data
  - Check browser console for errors
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Enhance Reports module with Analytics tab
  - [x] 4.1 Add Analytics tab to Reports tabs array
    - Add new tab object: { id: 'analytics', label: 'Analytics', icon: TrendingUp }
    - Add TrendingUp icon import from lucide-react
    - Verify tab appears in Reports navigation alongside existing tabs
    - _Requirements: 2.1, 6.1_
  
  - [x] 4.2 Import analytics dependencies in Reports.jsx
    - Import RefreshCw, Download, Heart icons from lucide-react
    - Import KPICard from '../components/analytics/KPICard'
    - Import PatientDistributionChart from '../components/analytics/PatientDistributionChart'
    - Import RevenueTrendChart from '../components/analytics/RevenueTrendChart'
    - Import ExpenseBreakdownChart from '../components/analytics/ExpenseBreakdownChart'
    - Import PerformanceComparisonChart from '../components/analytics/PerformanceComparisonChart'
    - Import DateRangeFilter from '../components/analytics/DateRangeFilter'
    - Import useAnalytics hook from '../hooks/useAnalytics'
    - Import exportService from '../services/exportService'
    - _Requirements: 2.2, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_
  
  - [x] 4.3 Create AnalyticsDashboard embedded component in Reports.jsx
    - Create AnalyticsDashboard functional component
    - Implement getInitialDateRange function to restore from session storage
    - Initialize dateRange state with getInitialDateRange
    - Initialize showExportModal, exporting, exportError states
    - Call useAnalytics hook with dateRange parameter
    - Implement useEffect to persist dateRange to session storage
    - Implement handleDateRangeChange function
    - Implement handleExport function for PDF/Excel/CSV formats
    - Implement formatLastUpdated helper function
    - _Requirements: 2.3, 3.1, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.1, 5.2_
  
  - [x] 4.4 Implement AnalyticsDashboard UI rendering
    - Render header with title "Analytics Dashboard" and last updated timestamp
    - Render DateRangeFilter component with dateRange and onChange handler
    - Render refresh button with onClick handler calling refresh()
    - Render export button with onClick handler showing export modal
    - Render four KPI cards: Total Patients, Bed Occupancy, Patient Satisfaction, Total Revenue
    - Render PatientDistributionChart with chartData.patientDistribution
    - Render RevenueTrendChart with chartData.revenueTrend
    - Render ExpenseBreakdownChart with chartData.expenseBreakdown
    - Render PerformanceComparisonChart with chartData.performanceComparison
    - Render loading state with HeartbeatLoader when loading is true
    - Render error state with error message and retry button when error exists
    - Render export modal with PDF/Excel/CSV format options
    - _Requirements: 2.4, 2.5, 2.6, 2.7, 3.2, 3.3, 3.4, 4.8, 5.3, 5.4, 5.5, 11.1, 11.2, 11.3, 11.4_
  
  - [x] 4.5 Add conditional rendering for Analytics tab in Reports component
    - Add condition: {activeTab === 'analytics' && <AnalyticsDashboard />}
    - Ensure condition is placed before existing tab conditions
    - Verify existing tab conditions remain unchanged
    - Update loading condition to exclude analytics tab: !reportData && activeTab !== 'analytics'
    - _Requirements: 2.8, 6.5_
  
  - [ ]* 4.6 Write unit tests for Reports with Analytics tab
    - Test Analytics tab appears in tabs array
    - Test Analytics tab renders AnalyticsDashboard when clicked
    - Test existing tabs (Financial, Patients, Appointments, Inventory) still render
    - Test existing CSV export functionality preserved
    - Test tab switching between Analytics and other tabs
    - Test loading state for Analytics tab
    - _Requirements: 2.1, 6.1, 6.2, 6.3, 6.4, 6.5, 9.1, 9.2_
  
  - [ ]* 4.7 Write unit tests for AnalyticsDashboard component
    - Test four KPI cards render with correct titles
    - Test date range filter renders with preset options
    - Test export modal displays when export button clicked
    - Test export modal shows PDF/Excel/CSV format options
    - Test refresh button calls refresh function
    - Test loading state displays HeartbeatLoader
    - Test error state displays error message
    - _Requirements: 2.4, 2.5, 2.6, 2.7, 3.3, 3.4, 4.8, 5.3, 5.4, 5.5, 9.1, 9.2_

- [x] 5. Checkpoint - Verify Reports enhancement
  - Test Reports page loads without errors
  - Verify Analytics tab appears in navigation
  - Click Analytics tab and verify AnalyticsDashboard renders
  - Verify all four KPI cards display
  - Verify all four charts render
  - Test date range filter changes update charts
  - Test export button shows modal
  - Switch to Financial tab and verify it still works
  - Switch back to Analytics tab and verify state preserved
  - Check browser console for errors
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement property-based tests
  - [ ]* 6.1 Write property test for date range update triggers data refresh
    - **Property 1: Date Range Update Triggers Data Refresh**
    - **Validates: Requirements 3.2**
    - Use fast-check to generate random valid date ranges
    - Render useAnalytics hook with initial date range
    - Change date range and verify metrics are recalculated
    - Run 100 iterations
    - _Requirements: 3.2_
  
  - [ ]* 6.2 Write property test for session storage round-trip
    - **Property 2: Date Range Session Storage Round-Trip**
    - **Validates: Requirements 3.5, 3.6**
    - Use fast-check to generate random date ranges
    - Store date range to session storage as JSON
    - Retrieve and deserialize from session storage
    - Verify retrieved date range matches original
    - Run 100 iterations
    - _Requirements: 3.5, 3.6_
  
  - [ ]* 6.3 Write property test for export data completeness
    - **Property 4: Export Data Completeness**
    - **Validates: Requirements 4.5, 4.6**
    - Use fast-check to generate export formats (pdf, xlsx, csv)
    - Create mock data with all KPI metrics and chart data
    - Call export service for each format
    - Verify blob is generated with size > 0
    - For CSV, verify content includes all metric names
    - Run 100 iterations
    - _Requirements: 4.5, 4.6_
  
  - [ ]* 6.4 Write property test for revenue data consistency
    - **Property 11: Revenue Data Consistency**
    - **Validates: Requirements 12.2, 12.3**
    - Use fast-check to generate random date ranges
    - Query revenue from Dashboard logic (db.getRevenueStats)
    - Query revenue from Analytics logic (analyticsService.getKPIMetrics)
    - Verify both return numeric values
    - Verify both use same data source
    - Run 100 iterations
    - _Requirements: 12.2, 12.3_
  
  - [ ]* 6.5 Write property test for formatting consistency
    - **Property 12: Consistent Data Formatting**
    - **Validates: Requirements 12.4, 12.5, 12.6**
    - Use fast-check to generate random currency amounts
    - Format using Dashboard style: ₱${amount.toLocaleString()}
    - Format using Analytics style: ₱${amount.toLocaleString()}
    - Verify both formats match exactly
    - Verify peso sign (₱) is present
    - Verify thousands separators for amounts >= 1000
    - Run 100 iterations
    - _Requirements: 12.4, 12.5, 12.6_
  
  - [ ]* 6.6 Write property test for cache behavior
    - **Property 10: Analytics Data Caching**
    - **Validates: Requirements 11.5**
    - Use fast-check to generate random date ranges
    - Clear analytics service cache
    - Make first call to getKPIMetrics and record time
    - Make second call immediately and record time
    - Verify second call is much faster (< 100ms difference)
    - Verify data from both calls matches
    - Run 50 iterations (fewer due to async nature)
    - _Requirements: 11.5_

- [x] 7. Verify analytics files preservation
  - Verify src/components/analytics/KPICard.jsx unchanged
  - Verify src/components/analytics/PatientDistributionChart.jsx unchanged
  - Verify src/components/analytics/RevenueTrendChart.jsx unchanged
  - Verify src/components/analytics/ExpenseBreakdownChart.jsx unchanged
  - Verify src/components/analytics/PerformanceComparisonChart.jsx unchanged
  - Verify src/components/analytics/DateRangeFilter.jsx unchanged
  - Verify src/hooks/useAnalytics.js unchanged
  - Verify src/services/analyticsService.js unchanged
  - Verify src/services/exportService.js unchanged
  - Verify src/utils/metricCalculations.js unchanged
  - Verify src/utils/configurationParser.js unchanged
  - _Requirements: 8.3, 8.4, 8.5, 8.6_

- [x] 8. Integration testing and validation
  - [x] 8.1 Test Dashboard to Analytics navigation flow
    - Log in as admin user
    - View Dashboard and verify sales data displays
    - Navigate to Reports > Analytics tab
    - Verify analytics data loads correctly
    - Compare revenue figures between Dashboard and Analytics
    - Verify values are consistent
    - _Requirements: 12.1, 12.2, 12.3_
  
  - [x] 8.2 Test date range filtering and export flow
    - Navigate to Reports > Analytics tab
    - Change date range to "Last 30 Days" preset
    - Verify all charts update with new data
    - Click Export button
    - Select PDF format
    - Verify PDF downloads with correct filename
    - Open PDF and verify it contains correct date range
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  
  - [x] 8.3 Test tab switching preservation
    - Navigate to Reports > Financial tab
    - Wait for financial data to load
    - Switch to Analytics tab
    - Verify analytics data loads
    - Switch back to Financial tab
    - Verify financial data is still displayed (not reloaded)
    - _Requirements: 6.2, 6.3, 6.4, 6.5_
  
  - [x] 8.4 Test error recovery flow
    - Simulate network failure (disconnect or use browser dev tools)
    - Navigate to Dashboard
    - Verify error message displays with retry button
    - Restore network connection
    - Click retry button
    - Verify data loads successfully
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_
  
  - [x] 8.5 Test responsive design on multiple devices
    - Test Dashboard on mobile viewport (375px width)
    - Verify stat cards stack vertically
    - Test Dashboard on tablet viewport (768px width)
    - Verify 2-column grid for stat cards
    - Test Dashboard on desktop viewport (1440px width)
    - Verify 4-column grid for stat cards
    - Test Analytics on mobile viewport
    - Verify KPI cards stack vertically and charts are full-width
    - Test Analytics on tablet viewport
    - Verify 2-column KPI grid
    - Test Analytics on desktop viewport
    - Verify 4-column KPI grid and 2-column chart grid
    - _Requirements: 9.1, 9.2, 9.3_

- [x] 9. Final checkpoint and deployment preparation
  - Run all unit tests and verify 100% pass
  - Run all property-based tests and verify 100% pass
  - Run production build: npm run build
  - Verify build completes without errors
  - Test production build locally
  - Verify Dashboard loads correctly in production build
  - Verify Reports > Analytics tab works in production build
  - Check browser console for any warnings or errors
  - Verify no analytics component files were deleted
  - Verify import paths are correct
  - Test with admin user account
  - Test with non-admin user account (doctor/nurse)
  - Document any issues found for resolution
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties across many inputs
- Unit tests validate specific examples and edge cases
- The implementation preserves all existing analytics functionality
- Rollback plan available: restore Dashboard.jsx and Reports.jsx from backups/pre-analytics-migration/
- All analytics component files must remain unchanged throughout implementation
- Session storage is used for date range persistence (non-sensitive data only)
- Export functionality supports PDF, Excel, and CSV formats
- Data consistency between Dashboard and Analytics is critical for user trust
