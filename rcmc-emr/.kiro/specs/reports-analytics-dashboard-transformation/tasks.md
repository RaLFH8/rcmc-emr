# Implementation Plan: Reports & Analytics Dashboard Transformation

## Overview

This implementation plan transforms the existing Reports page into a comprehensive analytics dashboard. The existing infrastructure (AnalyticsDashboard component, useAnalytics hook, analyticsService, exportService, and chart components) is already implemented. This plan focuses on enhancements, database setup, accessibility improvements, and comprehensive testing.

## Tasks

- [x] 1. Database setup and configuration
  - Create dashboard_config table in Supabase
  - Insert baseline metrics for performance comparison
  - Insert expense budget configuration
  - Verify all required indexes exist on date columns
  - _Requirements: 8.1-8.10, 5.8_

- [x] 2. Make Analytics tab the default view
  - [x] 2.1 Update Reports component default tab
    - Change initial activeTab state from 'financial' to 'analytics'
    - Update tab order to display Analytics first in navigation
    - Ensure Analytics tab doesn't trigger legacy report loading
    - _Requirements: 1.1_
  
  - [ ]* 2.2 Write unit tests for default tab behavior
    - Test that Analytics tab is active on initial render
    - Test that switching tabs works correctly
    - Test that Analytics tab loads without errors
    - _Requirements: 1.1_

- [x] 3. Enhance KPICard component with accessibility and interactivity
  - [x] 3.1 Add ARIA labels to KPICard component
    - Add aria-label describing metric name and current value
    - Add aria-live="polite" for dynamic value updates
    - Add role="region" for semantic structure
    - _Requirements: 14.1, 14.6_
  
  - [x] 3.2 Add three-dot menu to KPICard
    - Create dropdown menu component with export/details options
    - Position menu in top-right corner of card
    - Ensure keyboard accessibility (Tab, Enter, Escape keys)
    - _Requirements: 1.8_
  
  - [ ]* 3.3 Write unit tests for KPICard enhancements
    - Test ARIA labels are present and correct
    - Test three-dot menu opens and closes
    - Test keyboard navigation works
    - _Requirements: 14.1, 1.8_

- [x] 4. Enhance chart components with accessibility
  - [x] 4.1 Add ARIA labels to PatientDistributionChart
    - Add aria-label describing chart type and data summary
    - Add aria-describedby for legend
    - Ensure chart is keyboard navigable
    - _Requirements: 14.2_
  
  - [x] 4.2 Add ARIA labels to RevenueTrendChart
    - Add aria-label describing chart type and date range
    - Add aria-describedby for data points
    - Ensure chart is keyboard navigable
    - _Requirements: 14.2_
  
  - [x] 4.3 Add ARIA labels to ExpenseBreakdownChart
    - Add aria-label describing chart type and categories
    - Add aria-describedby for legend
    - Ensure chart is keyboard navigable
    - _Requirements: 14.2_
  
  - [x] 4.4 Add ARIA labels to PerformanceComparisonChart
    - Add aria-label describing chart type and metrics
    - Add aria-describedby for comparison data
    - Ensure chart is keyboard navigable
    - _Requirements: 14.2_
  
  - [ ]* 4.5 Write unit tests for chart accessibility
    - Test all charts have correct ARIA labels
    - Test keyboard navigation works for all charts
    - Test screen reader announcements are correct
    - _Requirements: 14.2_

- [x] 5. Add three-dot menus to chart components
  - [x] 5.1 Add menu to PatientDistributionChart
    - Create menu with export and drill-down options
    - Position in top-right corner of chart container
    - Implement export functionality for chart data
    - _Requirements: 2.6_
  
  - [x] 5.2 Add menu to RevenueTrendChart
    - Create menu with export and granularity options
    - Implement monthly/quarterly/yearly filter
    - _Requirements: 3.5, 3.7_
  
  - [x] 5.3 Add menu to ExpenseBreakdownChart
    - Create menu with export and filter options
    - Implement monthly dropdown filter
    - _Requirements: 4.6_
  
  - [x] 5.4 Add menu to PerformanceComparisonChart
    - Create menu with export options
    - _Requirements: 5.9_
  
  - [ ]* 5.5 Write unit tests for chart menus
    - Test menus open and close correctly
    - Test export functionality works
    - Test filter options update chart data
    - _Requirements: 2.6, 3.7, 4.6, 5.9_

- [x] 6. Enhance DateRangeFilter with keyboard accessibility
  - [x] 6.1 Ensure keyboard navigation works
    - Test Tab key navigation between date inputs
    - Test Arrow keys work in date pickers
    - Test Enter key confirms date selection
    - Add focus indicators for active input
    - _Requirements: 14.3_
  
  - [x] 6.2 Add validation and error messages
    - Validate end date is after start date
    - Display user-friendly error messages
    - Prevent invalid date range submission
    - _Requirements: 6.2, 6.3_
  
  - [ ]* 6.3 Write unit tests for DateRangeFilter
    - Test keyboard navigation works
    - Test validation prevents invalid ranges
    - Test error messages display correctly
    - _Requirements: 14.3, 6.2, 6.3_

- [x] 7. Checkpoint - Verify accessibility and interactivity
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Enhance error handling and loading states
  - [ ] 8.1 Add skeleton loaders to KPICard
    - Create skeleton component matching KPICard layout
    - Display during initial load and data refresh
    - Ensure smooth transition to loaded state
    - _Requirements: 12.1_
  
  - [ ] 8.2 Add skeleton loaders to chart components
    - Create skeleton components for each chart type
    - Display during initial load and data refresh
    - Ensure smooth transitions
    - _Requirements: 12.1_
  
  - [ ] 8.3 Improve error messages for user-friendliness
    - Replace technical error messages with user-friendly text
    - Add specific guidance for common errors
    - Remove stack traces from user-facing messages
    - _Requirements: 12.2, 12.3_
  
  - [ ] 8.4 Add retry buttons to error states
    - Add "Retry" button to all error displays
    - Implement retry logic with loading state
    - Limit retry attempts to 3 to prevent infinite loops
    - _Requirements: 12.4_
  
  - [ ] 8.5 Add empty state messages
    - Display "No data available" when queries return empty
    - Suggest selecting different date range
    - Ensure empty state doesn't look like error
    - _Requirements: 12.5_
  
  - [ ]* 8.6 Write unit tests for error handling
    - Test skeleton loaders display during loading
    - Test error messages are user-friendly
    - Test retry button works correctly
    - Test empty states display appropriately
    - _Requirements: 12.1-12.5_

- [ ] 9. Implement utility functions for calculations
  - [ ] 9.1 Create metricCalculations.js utility
    - Implement calculateGrowthPercentage(current, previous)
    - Implement calculateDistribution(counts)
    - Implement calculatePreviousPeriod(startDate, endDate)
    - Implement formatMetricValue(value, format)
    - _Requirements: 9.1-9.3_
  
  - [ ]* 9.2 Write property test for growth percentage calculation
    - **Property 2: Growth Percentage Calculation**
    - **Validates: Requirements 9.3**
    - Test formula: ((current - previous) / previous) * 100
    - Test with 100 random current/previous value pairs
    - Verify floating point tolerance < 0.01
  
  - [ ]* 9.3 Write property test for distribution percentage sum
    - **Property 4: Patient Distribution Percentage Calculation**
    - **Validates: Requirements 2.5**
    - Test that percentages sum to 100% (tolerance 0.1%)
    - Test with 100 random count arrays
    - Verify each percentage = (count / total) * 100
  
  - [ ]* 9.4 Write property test for previous period calculation
    - **Property 12: Previous Period Calculation**
    - **Validates: Requirements 9.2**
    - Test that previous period has same duration
    - Test that previous period ends one day before start date
    - Test with 100 random date ranges

- [ ] 10. Enhance analyticsService with additional queries
  - [ ] 10.1 Verify KPI metrics query correctness
    - Review getTotalPatients query for date filtering
    - Review getBedOccupancyRate query for accuracy
    - Review getPatientSatisfaction query for average calculation
    - Review getTotalRevenue query for sum calculation
    - _Requirements: 8.2-8.5_
  
  - [ ] 10.2 Verify chart data query correctness
    - Review getPatientDistribution query for grouping
    - Review getRevenueTrend query for time-series aggregation
    - Review getExpenseBreakdown query for categorization
    - Review getPerformanceMetrics query for calculations
    - _Requirements: 8.6-8.9_
  
  - [ ]* 10.3 Write property test for KPI database calculation
    - **Property 1: KPI Metrics Database Calculation**
    - **Validates: Requirements 1.2-1.5, 8.1, 8.10**
    - Test that all KPIs are fetched from database
    - Test that no hardcoded values are used
    - Test that current and previous periods are included
  
  - [ ]* 10.4 Write property test for patient distribution aggregation
    - **Property 5: Patient Distribution Aggregation**
    - **Validates: Requirements 2.2**
    - Test that sum of department counts equals total consultations
    - Test with various date ranges
  
  - [ ]* 10.5 Write property test for revenue trend aggregation
    - **Property 6: Revenue Trend Aggregation**
    - **Validates: Requirements 3.2, 3.6**
    - Test that period sums equal total payments
    - Test with different granularities (monthly/quarterly/yearly)
  
  - [ ]* 10.6 Write property test for expense categorization
    - **Property 7: Expense Categorization**
    - **Validates: Requirements 4.3**
    - Test that each item is assigned to exactly one category
    - Test with various inventory items
  
  - [ ]* 10.7 Write property test for expense aggregation
    - **Property 8: Expense Aggregation**
    - **Validates: Requirements 4.2**
    - Test that total expenses equal sum of categories
    - Test that each category is correctly calculated
  
  - [ ]* 10.8 Write property test for performance metrics calculation
    - **Property 9: Performance Metrics Calculation**
    - **Validates: Requirements 5.3-5.7**
    - Test that all 5 metrics are calculated from database
    - Test that all metrics are scaled to 0-5 range

- [ ] 11. Checkpoint - Verify data calculations and queries
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Enhance exportService with CSV improvements
  - [ ] 12.1 Implement CSV special character escaping
    - Create escapeCSV(value) function
    - Escape commas, quotes, and newlines per RFC 4180
    - Wrap values with special chars in quotes
    - Double internal quotes
    - _Requirements: 16.2_
  
  - [ ] 12.2 Implement CSV pretty printer
    - Create formatCSV(data) function
    - Use UTF-8 encoding with BOM for Excel compatibility
    - Use CRLF line endings
    - Ensure consistent column alignment
    - _Requirements: 17.1-17.4_
  
  - [ ] 12.3 Add CSV validation function
    - Create validateCSVRoundTrip(data) function
    - Test export -> parse -> export produces same result
    - Log errors if validation fails
    - _Requirements: 18.3, 18.4_
  
  - [ ]* 12.4 Write property test for CSV special character escaping
    - **Property 15: CSV Special Character Escaping**
    - **Validates: Requirements 16.2**
    - Test with 100 random strings
    - Verify special chars are properly escaped
    - Verify quoted fields are correct
  
  - [ ]* 12.5 Write property test for CSV round-trip integrity
    - **Property 16: CSV Round-Trip Integrity**
    - **Validates: Requirements 18.2**
    - Test export -> parse -> export produces equivalent CSV
    - Test with 100 random data structures
    - Verify data integrity is maintained

- [ ] 13. Enhance export functionality
  - [ ] 13.1 Verify export data completeness
    - Ensure all KPI values are included in exports
    - Ensure all chart data is included in exports
    - Ensure date range is included in exports
    - _Requirements: 7.6_
  
  - [ ] 13.2 Improve export filename generation
    - Use format: RCMC_Analytics_Report_YYYY-MM-DD_HHMMSS.ext
    - Include date range in filename
    - Add timestamp for version tracking
    - _Requirements: 7.5_
  
  - [ ] 13.3 Add export error handling
    - Display user-friendly error messages in modal
    - Keep modal open on error for retry
    - Log detailed errors to console
    - _Requirements: 12.2, 12.3_
  
  - [ ]* 13.4 Write property test for export data completeness
    - **Property 13: Export Data Completeness**
    - **Validates: Requirements 7.3, 7.4, 7.6**
    - Test that all data is included in exports
    - Test with various dashboard states
    - Test all export formats (CSV, Excel, PDF)
  
  - [ ]* 13.5 Write property test for export filename generation
    - **Property 14: Export Filename Generation**
    - **Validates: Requirements 7.5**
    - Test filename format is correct
    - Test timestamp is included
    - Test extension matches format

- [ ] 14. Implement responsive design enhancements
  - [ ] 14.1 Verify KPI cards responsive grid
    - Test 4 columns at >= 1024px width
    - Test 2 columns at 768px-1023px width
    - Test 1 column at < 768px width
    - _Requirements: 10.1-10.3_
  
  - [ ] 14.2 Verify charts responsive grid
    - Test 2 columns at >= 1024px width
    - Test 1 column at < 1024px width
    - Ensure charts resize to fit container
    - _Requirements: 10.4-10.6_
  
  - [ ]* 14.3 Write property test for responsive grid layout
    - **Property 17: Responsive Grid Layout**
    - **Validates: Requirements 10.1-10.3**
    - Test correct column count for any viewport width
    - Test with 100 random viewport widths (320-2560px)

- [ ] 15. Implement performance optimizations
  - [ ] 15.1 Verify parallel query execution
    - Ensure all independent queries use Promise.all
    - Verify queries don't wait unnecessarily
    - Measure total fetch time improvement
    - _Requirements: 11.4_
  
  - [ ] 15.2 Verify debounced data fetching
    - Ensure date range changes are debounced by 500ms
    - Test that rapid changes only trigger one fetch
    - _Requirements: 11.6_
  
  - [ ] 15.3 Verify caching strategy
    - Ensure 5-minute TTL is working
    - Test cache invalidation on manual refresh
    - Verify cache keys are unique per date range
    - _Requirements: 11.5_
  
  - [ ]* 15.4 Write property test for parallel query execution
    - **Property 25: Parallel Query Execution**
    - **Validates: Requirements 11.4**
    - Test that independent queries execute in parallel
    - Verify total time is less than sequential execution
  
  - [ ]* 15.5 Write property test for debounced data fetching
    - **Property 18: Debounced Data Fetching**
    - **Validates: Requirements 11.6**
    - Test that rapid changes only fetch once
    - Test with 100 random date change sequences
    - Verify only last change triggers fetch

- [ ] 16. Checkpoint - Verify performance and responsiveness
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Implement additional property tests for data integrity
  - [ ]* 17.1 Write property test for growth indicator rendering
    - **Property 3: Growth Indicator Rendering**
    - **Validates: Requirements 1.7, 9.5, 9.6, 14.6**
    - Test correct color for any growth value
    - Test symbol (+/-) is included
    - Test percentage is displayed
  
  - [ ]* 17.2 Write property test for date range state updates
    - **Property 10: Date Range State Updates**
    - **Validates: Requirements 6.2, 6.3, 6.4**
    - Test that date selection updates state
    - Test that state change triggers re-fetch
  
  - [ ]* 17.3 Write property test for date range query filtering
    - **Property 11: Date Range Query Filtering**
    - **Validates: Requirements 6.5**
    - Test that queries include WHERE clauses
    - Test that date columns are filtered correctly
  
  - [ ]* 17.4 Write property test for current period metric calculation
    - **Property 24: Current Period Metric Calculation**
    - **Validates: Requirements 9.1**
    - Test that only data within date range is included
    - Test with various date ranges
  
  - [ ]* 17.5 Write property test for error state display
    - **Property 19: Error State Display**
    - **Validates: Requirements 12.2**
    - Test that errors display in affected component only
    - Test that other components continue rendering
  
  - [ ]* 17.6 Write property test for chart tooltip display
    - **Property 20: Chart Tooltip Display**
    - **Validates: Requirements 13.1**
    - Test that hover shows tooltip
    - Test that tooltip contains correct values
  
  - [ ]* 17.7 Write property test for accessibility ARIA labels
    - **Property 21: Accessibility ARIA Labels**
    - **Validates: Requirements 14.1, 14.2**
    - Test that all components have ARIA labels
    - Test that labels describe content correctly
  
  - [ ]* 17.8 Write property test for donut chart center display
    - **Property 22: Donut Chart Center Display**
    - **Validates: Requirements 2.3**
    - Test that center shows sum of all counts
    - Test with various distribution data
  
  - [ ]* 17.9 Write property test for chart legend display
    - **Property 23: Chart Legend Display**
    - **Validates: Requirements 2.4**
    - Test that legend shows all categories
    - Test that percentages/values are correct

- [ ] 18. Write comprehensive unit tests
  - [ ]* 18.1 Write unit tests for Reports component
    - Test Analytics tab is default on mount
    - Test tab switching works correctly
    - Test date range persistence to sessionStorage
    - _Requirements: 1.1_
  
  - [ ]* 18.2 Write unit tests for AnalyticsDashboard component
    - Test component renders without errors
    - Test date range change triggers data fetch
    - Test export modal opens and closes
    - Test refresh button works
    - _Requirements: 6.4, 7.2_
  
  - [ ]* 18.3 Write unit tests for KPICard component
    - Test card renders with correct structure
    - Test growth indicator shows correct color
    - Test "N/A" displays when previous is zero
    - Test formatting for different metric types
    - _Requirements: 1.6, 1.7, 9.4_
  
  - [ ]* 18.4 Write unit tests for chart components
    - Test PatientDistributionChart renders donut correctly
    - Test RevenueTrendChart renders line correctly
    - Test ExpenseBreakdownChart renders stacked bars correctly
    - Test PerformanceComparisonChart renders radar correctly
    - _Requirements: 2.1, 3.1, 4.1, 5.1_
  
  - [ ]* 18.5 Write unit tests for DateRangeFilter component
    - Test date selection updates state
    - Test validation prevents invalid ranges
    - Test keyboard navigation works
    - _Requirements: 6.2, 6.3, 14.3_
  
  - [ ]* 18.6 Write unit tests for useAnalytics hook
    - Test hook fetches data on mount
    - Test hook refetches on date range change
    - Test automatic refresh every 5 minutes
    - Test tab visibility pauses/resumes refresh
    - _Requirements: 8.1-8.10_
  
  - [ ]* 18.7 Write unit tests for analyticsService
    - Test getKPIMetrics returns correct structure
    - Test getPatientDistribution groups by department
    - Test getRevenueTrend aggregates by period
    - Test getExpenseBreakdown categorizes correctly
    - Test getPerformanceMetrics calculates all 5 metrics
    - _Requirements: 8.1-8.10_
  
  - [ ]* 18.8 Write unit tests for exportService
    - Test exportToPDF generates valid PDF
    - Test exportToExcel generates valid Excel file
    - Test exportToCSV generates valid CSV
    - Test downloadFile triggers browser download
    - _Requirements: 7.3, 7.4, 7.7_
  
  - [ ]* 18.9 Write unit tests for error handling
    - Test skeleton loaders display during loading
    - Test error messages display on query failure
    - Test retry button clears error and refetches
    - Test empty state displays when no data
    - _Requirements: 12.1-12.5_
  
  - [ ]* 18.10 Write unit tests for edge cases
    - Test with empty database
    - Test with very large datasets
    - Test with invalid date ranges
    - Test with network timeouts
    - Test with missing database tables
    - _Requirements: 11.1-11.6, 12.1-12.6_

- [ ] 19. Final checkpoint - Comprehensive testing
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 20. Manual testing and verification
  - [ ] 20.1 Test on different screen sizes
    - Test on desktop (1920x1080, 1366x768)
    - Test on tablet (768x1024, 1024x768)
    - Test on mobile (375x667, 414x896)
    - Verify responsive layout works correctly
    - _Requirements: 10.1-10.7_
  
  - [ ] 20.2 Test with screen readers
    - Test with NVDA (Windows)
    - Test with JAWS (Windows)
    - Test with VoiceOver (macOS)
    - Verify all ARIA labels are announced correctly
    - _Requirements: 14.1-14.6_
  
  - [ ] 20.3 Test keyboard navigation
    - Test Tab key navigation through all interactive elements
    - Test Enter key activates buttons and links
    - Test Escape key closes modals and menus
    - Test Arrow keys work in date pickers
    - _Requirements: 14.3, 14.4_
  
  - [ ] 20.4 Test with slow network
    - Throttle network to 3G speed
    - Verify loading states display correctly
    - Verify page remains usable during loading
    - _Requirements: 12.1, 12.6_
  
  - [ ] 20.5 Test with empty database
    - Clear all data from database tables
    - Verify empty states display correctly
    - Verify no errors are thrown
    - _Requirements: 12.5_
  
  - [ ] 20.6 Test export functionality
    - Export to PDF and verify content
    - Export to Excel and verify content
    - Export to CSV and verify content
    - Verify filenames are correct
    - _Requirements: 7.3-7.7_
  
  - [ ] 20.7 Test date range filtering
    - Select various date ranges
    - Verify all metrics update correctly
    - Verify queries include date filters
    - _Requirements: 6.1-6.6_
  
  - [ ] 20.8 Test automatic refresh
    - Wait 5 minutes and verify data refreshes
    - Switch to another tab and verify refresh pauses
    - Switch back and verify refresh resumes
    - _Requirements: 11.4_
  
  - [ ] 20.9 Test error scenarios
    - Disconnect network and verify error messages
    - Restore network and verify retry works
    - Test with invalid database credentials
    - _Requirements: 12.2-12.4_
  
  - [ ] 20.10 Performance testing
    - Measure initial page load time (should be < 2 seconds)
    - Measure chart rendering time (should be < 500ms)
    - Test with 10,000 data points per chart
    - _Requirements: 11.1-11.3_

- [ ] 21. Final verification and deployment preparation
  - Verify all acceptance criteria are met
  - Verify all tests pass with > 80% coverage
  - Verify documentation is complete
  - Verify no console errors or warnings
  - Create deployment checklist

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties with 100 iterations each
- Unit tests validate specific examples and edge cases
- The existing infrastructure (components, hooks, services) is already robust and well-implemented
- Main work focuses on accessibility, error handling, testing, and database setup
- All metrics must be calculated from live database queries with no hardcoded values
