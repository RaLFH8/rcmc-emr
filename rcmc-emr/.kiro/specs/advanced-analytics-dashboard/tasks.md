# Implementation Plan: Advanced Analytics Dashboard

## Overview

This implementation plan transforms the existing Reports page into a comprehensive healthcare analytics platform with real-time KPI metrics, interactive visualizations, and data export capabilities. The implementation follows a phased approach: foundation (database and services), visualizations (chart components), interactivity (filters and real-time updates), export functionality, and comprehensive testing.

The dashboard will display four KPI cards (Total Patients, Bed Occupancy, Patient Satisfaction, Total Revenue), four interactive charts (Patient Distribution donut, Revenue Trend line, Expense Breakdown bar, Performance Comparison radar), date range filtering with presets, and export functionality (PDF, Excel, CSV). All data will be fetched from Supabase with no hardcoded values.

## Tasks

- [ ] 1. Set up database schema and performance indexes
  - Create dashboard_config table for storing baseline metrics and expense budgets
  - Add performance indexes on billing, consultations, appointments, and satisfaction_ratings tables
  - Insert default baseline metrics and expense budget configuration
  - Run migration script in Supabase SQL Editor
  - _Requirements: 5.13, 10.2, 13.1_

- [x] 2. Implement analytics service layer
  - [x] 2.1 Create analyticsService.js with data fetching methods
    - Create src/services/analyticsService.js file
    - Implement getKPIMetrics(dateRange) method with queries for Total Patients, Bed Occupancy, Patient Satisfaction, Total Revenue
    - Implement getPatientDistribution(dateRange) method with department aggregation query
    - Implement getRevenueTrend(dateRange, granularity) method with time-series aggregation
    - Implement getExpenseBreakdown(dateRange) method with category calculations
    - Implement getPerformanceMetrics(dateRange) and getBaselineMetrics() methods
    - Add in-memory caching with 5-minute TTL
    - Add error handling for network failures and query timeouts
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 2.2, 3.2, 4.3-4.7, 5.3-5.7, 10.3_

  - [ ]* 2.2 Write property test for analytics service caching
    - **Property 30: Cache Expiration**
    - **Validates: Requirements 10.3**

  - [ ]* 2.3 Write unit tests for analyticsService.js
    - Test successful data fetching for all methods
    - Test error handling for network failures
    - Test query timeout handling
    - Test cache hit/miss scenarios
    - _Requirements: 1.2-1.5, 2.2, 3.2, 4.3-4.7, 5.3-5.7_

- [x] 3. Implement KPI metric calculations and formatting
  - [x] 3.1 Create metric calculation utilities
    - Create src/utils/metricCalculations.js file
    - Implement calculatePercentageChange(current, previous) function
    - Implement formatCurrency(value) function with ₱ and thousand separators
    - Implement formatPercentage(value) function with 1 decimal place
    - Implement formatSatisfactionScore(value) function as X.X/5.0
    - Add null/undefined value handling with zero defaults
    - Add bounds validation for percentage changes (-100% to +1000%)
    - _Requirements: 1.7, 1.10, 1.11, 1.12, 11.2, 11.3, 11.9, 11.10, 11.11, 11.12, 11.13_

  - [ ]* 3.2 Write property test for percentage change calculation
    - **Property 2: Percentage Change Calculation**
    - **Validates: Requirements 1.7**

  - [ ]* 3.3 Write property test for currency formatting
    - **Property 3: Value Formatting Consistency**
    - **Validates: Requirements 1.10, 1.11, 1.12**

  - [ ]* 3.4 Write unit tests for metric calculations
    - Test percentage change with positive, negative, and zero values
    - Test currency formatting with various amounts
    - Test percentage formatting edge cases
    - Test satisfaction score formatting
    - Test null value handling
    - _Requirements: 1.7, 1.10-1.12, 11.2, 11.3_

- [x] 4. Build KPI Card component
  - [x] 4.1 Create KPICard component with styling
    - Create src/components/analytics/KPICard.jsx file
    - Implement component with props: title, value, previousValue, format, icon, iconColor, trend, trendPercentage
    - Add conditional styling for trend indicators (green for up, red for down)
    - Display formatted value based on format prop (number, currency, percentage, rating)
    - Display percentage change with trend arrow
    - Add responsive design (full width on mobile, grid on tablet/desktop)
    - _Requirements: 1.1, 1.6, 1.8, 1.9, 1.10-1.12, 9.2-9.4_

  - [ ]* 4.2 Write property test for trend indicator styling
    - **Property 4: Trend Indicator Styling**
    - **Validates: Requirements 1.8, 1.9**

  - [ ]* 4.3 Write unit tests for KPICard component
    - Test rendering with different format types
    - Test trend indicator colors
    - Test percentage change display
    - Test responsive layout
    - _Requirements: 1.1, 1.6, 1.8, 1.9_

- [x] 5. Checkpoint - Verify KPI metrics display correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement Patient Distribution Chart
  - [x] 6.1 Create PatientDistributionChart component
    - Create src/components/analytics/PatientDistributionChart.jsx file
    - Implement Recharts PieChart with innerRadius for donut effect
    - Display center label with total patient count
    - Add legend with department names, percentages, and color indicators
    - Implement hover tooltips with detailed information
    - Add click handler for drill-down filtering (onSegmentClick prop)
    - Use distinct colors for each department (5 colors)
    - Sort departments by patient count descending
    - Classify non-top-4 specializations as "Others"
    - _Requirements: 2.1, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 12.1, 12.3_

  - [ ]* 6.2 Write property test for department percentage sum
    - **Property 6: Department Distribution Percentage Sum**
    - **Validates: Requirements 2.4**

  - [ ]* 6.3 Write property test for department color uniqueness
    - **Property 7: Department Color Uniqueness**
    - **Validates: Requirements 2.5**

  - [ ]* 6.4 Write unit tests for PatientDistributionChart
    - Test chart rendering with sample data
    - Test center label display
    - Test legend rendering
    - Test hover tooltip display
    - Test click interaction
    - _Requirements: 2.1, 2.3-2.10_

- [x] 7. Implement Revenue Trend Chart
  - [x] 7.1 Create RevenueTrendChart component
    - Create src/components/analytics/RevenueTrendChart.jsx file
    - Implement Recharts LineChart with smooth curve interpolation
    - Format Y-axis labels with ₱ and abbreviated numbers (₱450K format)
    - Format X-axis labels as "Month YYYY"
    - Add hover tooltips with exact revenue values
    - Highlight most recent data point
    - Add time granularity dropdown selector (Monthly, Quarterly, Yearly)
    - Implement zoom functionality for detailed analysis
    - Add zoom reset controls
    - Animate transitions with 300ms duration
    - _Requirements: 3.1, 3.3, 3.4, 3.5, 3.6, 3.7, 3.9, 3.10, 3.11, 3.12, 12.1, 12.8, 12.9, 12.10, 12.11_

  - [ ]* 7.2 Write property test for revenue aggregation by month
    - **Property 10: Revenue Aggregation by Month**
    - **Validates: Requirements 3.2**

  - [ ]* 7.3 Write property test for axis label formatting
    - **Property 11: Axis Label Formatting**
    - **Validates: Requirements 3.5, 3.6**

  - [ ]* 7.4 Write unit tests for RevenueTrendChart
    - Test chart rendering with time-series data
    - Test axis formatting
    - Test tooltip display
    - Test time granularity switching
    - Test zoom functionality
    - _Requirements: 3.1, 3.3-3.12_

- [x] 8. Implement Expense Breakdown Chart
  - [x] 8.1 Create ExpenseBreakdownChart component
    - Create src/components/analytics/ExpenseBreakdownChart.jsx file
    - Implement Recharts BarChart with horizontal bars
    - Display five expense categories: Staff Salaries, Medical Supplies, Operational Costs, Pharmaceuticals, Miscellaneous
    - Use distinct color coding for each category
    - Display amount labels at bar ends with ₱ formatting
    - Sort categories by amount descending
    - Display total expenses sum above chart
    - Display percentage change from previous period
    - Add click handler for itemized breakdown (onCategoryClick prop)
    - _Requirements: 4.1, 4.2, 4.8, 4.9, 4.10, 4.11, 4.12, 4.13, 12.1, 12.5_

  - [ ]* 8.2 Write property test for expense category calculations
    - **Property 13: Expense Category Calculations**
    - **Validates: Requirements 4.3, 4.4, 4.5, 4.6, 4.7**

  - [ ]* 8.3 Write property test for expense sorting order
    - **Property 15: Expense Sorting Order**
    - **Validates: Requirements 4.12**

  - [ ]* 8.4 Write unit tests for ExpenseBreakdownChart
    - Test chart rendering with expense data
    - Test bar sorting
    - Test amount label formatting
    - Test total expenses display
    - Test click interaction
    - _Requirements: 4.1, 4.2, 4.8-4.13_

- [x] 9. Implement Performance Comparison Chart
  - [x] 9.1 Create PerformanceComparisonChart component
    - Create src/components/analytics/PerformanceComparisonChart.jsx file
    - Implement Recharts RadarChart with two overlaid polygons
    - Display five performance metrics: Patient Satisfaction, Recovery Rate, Emergency Response, Follow-up Rate, Treatment Success Rate
    - Use distinct colors (blue for hospital, gray for baseline)
    - Scale all metrics to 0-5 range
    - Display metric labels at axis points
    - Add hover tooltips with exact values
    - Add legend for data series
    - Add click handler for metric details (onMetricClick prop)
    - _Requirements: 5.1, 5.2, 5.8, 5.9, 5.10, 5.11, 5.12, 12.1, 12.2_

  - [ ]* 9.2 Write property test for performance metric scaling
    - **Property 17: Performance Metric Scaling**
    - **Validates: Requirements 5.10**

  - [ ]* 9.3 Write property test for performance metric calculations
    - **Property 18: Performance Metric Calculations**
    - **Validates: Requirements 5.3, 5.4, 5.5, 5.6, 5.7**

  - [ ]* 9.4 Write unit tests for PerformanceComparisonChart
    - Test chart rendering with performance data
    - Test metric scaling
    - Test polygon overlay
    - Test hover tooltips
    - Test click interaction
    - _Requirements: 5.1, 5.2, 5.8-5.12_

- [x] 10. Checkpoint - Verify all charts render correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement Date Range Filter component
  - [x] 11.1 Create DateRangeFilter component
    - Create src/components/analytics/DateRangeFilter.jsx file
    - Implement start date and end date pickers
    - Add preset buttons: "This Month", "Last Month", "Last 3 Months", "Last 6 Months", "This Year"
    - Implement date range validation (end date >= start date)
    - Display inline error message for invalid ranges
    - Implement session storage persistence
    - Default to current month (first day to current day)
    - Call onChange callback when date range changes
    - _Requirements: 6.1, 6.2, 6.3, 6.6, 6.7, 6.8, 6.9, 6.10, 6.11_

  - [ ]* 11.2 Write property test for date range validation
    - **Property 21: Date Range Validation**
    - **Validates: Requirements 6.6**

  - [ ]* 11.3 Write property test for date range persistence round-trip
    - **Property 23: Date Range Persistence Round-Trip**
    - **Validates: Requirements 6.10, 6.11**

  - [ ]* 11.4 Write unit tests for DateRangeFilter
    - Test date picker rendering
    - Test preset button clicks
    - Test validation error display
    - Test session storage persistence
    - Test onChange callback
    - _Requirements: 6.1-6.11_

- [x] 12. Implement real-time updates and refresh functionality
  - [x] 12.1 Create useAnalytics custom hook
    - Create src/hooks/useAnalytics.js file
    - Implement data fetching logic with loading and error states
    - Implement automatic refresh every 5 minutes
    - Pause refresh when browser tab is inactive
    - Resume refresh when tab becomes active
    - Implement manual refresh function
    - Add debouncing for date range changes (500ms)
    - Return metrics, chartData, loading, error, lastUpdated, and refresh function
    - _Requirements: 8.1, 8.2, 8.3, 8.6, 8.7, 8.8, 8.9, 8.10, 8.11, 10.9_

  - [ ]* 12.2 Write property test for query date filtering
    - **Property 20: Query Date Filtering**
    - **Validates: Requirements 6.5**

  - [ ]* 12.3 Write property test for date filter debouncing
    - **Property 32: Date Filter Debouncing**
    - **Validates: Requirements 10.9**

  - [ ]* 12.4 Write unit tests for useAnalytics hook
    - Test data fetching on mount
    - Test automatic refresh timer
    - Test manual refresh
    - Test tab visibility handling
    - Test debouncing
    - _Requirements: 8.1-8.11, 10.9_

- [x] 13. Implement export service
  - [x] 13.1 Create exportService.js with PDF, Excel, and CSV export
    - Create src/services/exportService.js file
    - Implement exportToPDF(data, dateRange) using jsPDF and html2canvas
    - Implement exportToExcel(data, dateRange) using xlsx library
    - Implement exportToCSV(data, dateRange) following RFC 4180 specification
    - Implement generateFilename(format, dateRange) with format "RCMC_Analytics_Report_YYYY-MM-DD_HHMMSS.ext"
    - Include hospital branding and logo in PDF exports
    - Preserve chart visualizations in PDF and Excel exports
    - Create separate Excel sheets for KPIs, Revenue, Expenses, Performance
    - Properly escape special characters in CSV (commas, quotes, newlines)
    - Include metadata headers (export date, date range, hospital name) in all formats
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 14.1, 14.2, 14.3, 14.4, 14.5, 14.10_

  - [ ]* 13.2 Write property test for export filename formatting
    - **Property 24: Export Filename Formatting**
    - **Validates: Requirements 7.6, 7.7, 7.8**

  - [ ]* 13.3 Write property test for CSV RFC 4180 compliance
    - **Property 44: CSV RFC 4180 Compliance**
    - **Validates: Requirements 14.1, 14.2**

  - [ ]* 13.4 Write property test for CSV export round-trip
    - **Property 46: CSV Export Round-Trip**
    - **Validates: Requirements 14.7**

  - [ ]* 13.5 Write unit tests for exportService.js
    - Test PDF generation with sample data
    - Test Excel generation with multiple sheets
    - Test CSV generation with special characters
    - Test filename formatting
    - Test metadata inclusion
    - _Requirements: 7.2-7.10, 14.1-14.5, 14.10_

- [x] 14. Implement configuration parser and validator
  - [x] 14.1 Create configurationParser.js for dashboard_config table
    - Create src/utils/configurationParser.js file
    - Implement parseConfiguration(json) function to parse JSON into typed objects
    - Implement printConfiguration(config) function to format objects back to JSON
    - Implement validateConfiguration(config) function to check required fields and ranges
    - Add schema versioning support
    - Implement schema migration for older versions
    - Return descriptive error messages for invalid configuration
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.8, 13.9, 13.10_

  - [ ]* 14.2 Write property test for configuration round-trip
    - **Property 43: Configuration Round-Trip**
    - **Validates: Requirements 13.7**

  - [ ]* 14.3 Write property test for configuration validation
    - **Property 41: Configuration Validation**
    - **Validates: Requirements 13.3, 13.4**

  - [ ]* 14.4 Write unit tests for configurationParser.js
    - Test parsing valid configuration
    - Test validation with missing fields
    - Test validation with out-of-range values
    - Test error message generation
    - Test schema migration
    - _Requirements: 13.1-13.10_

- [x] 15. Redesign Dashboard page with all components
  - [x] 15.1 Redesign src/pages/Dashboard.jsx
    - Import all analytics components (KPICard, charts, DateRangeFilter)
    - Import useAnalytics hook
    - Implement DashboardHeader with DateRangeFilter, RefreshButton, ExportButton, and LastUpdated timestamp
    - Implement KPIMetricsRow with four KPICard components (Total Patients, Bed Occupancy, Patient Satisfaction, Total Revenue)
    - Implement ChartsGrid with four chart components in responsive layout
    - Add loading states with skeleton loaders
    - Add error boundary for error handling
    - Implement export button click handler with format selection modal
    - Implement chart interaction handlers (drill-down, zoom, reset filters)
    - Add responsive layout (mobile: single column, tablet: 2-column grid, desktop: 4-column grid for KPIs)
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.4, 9.1-9.6, 10.6, 10.11, 12.3-12.7_

  - [ ]* 15.2 Write property test for date range refresh trigger
    - **Property 19: Date Range Refresh Trigger**
    - **Validates: Requirements 6.4**

  - [ ]* 15.3 Write unit tests for Dashboard page
    - Test component rendering
    - Test date range filter interaction
    - Test export button click
    - Test manual refresh button
    - Test chart interactions
    - Test loading states
    - Test error states
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1-6.4, 7.1, 8.4-8.8_

- [x] 16. Implement error handling and user feedback
  - [x] 16.1 Add comprehensive error handling
    - Create src/components/analytics/ErrorBoundary.jsx for dashboard errors
    - Add error handling in analyticsService for network failures, timeouts, and query errors
    - Display error banners with retry buttons
    - Show "N/A" for metrics that cannot be calculated
    - Add warning icons with tooltips for data quality issues
    - Display loading spinners during export operations
    - Show success notifications on export completion
    - Display error modals for export failures with retry option
    - Add connection status indicator for real-time updates
    - Log all errors to console with context
    - _Requirements: 8.8, 11.2, 11.6, 11.7, 11.8, 7.11, 7.12, 7.13_

  - [ ]* 16.2 Write property test for null value handling
    - **Property 33: Null Value Handling**
    - **Validates: Requirements 11.2**

  - [ ]* 16.3 Write property test for insufficient data handling
    - **Property 37: Insufficient Data Handling**
    - **Validates: Requirements 11.6**

  - [ ]* 16.4 Write unit tests for error handling
    - Test error boundary rendering
    - Test network error handling
    - Test timeout error handling
    - Test null value handling
    - Test insufficient data display
    - _Requirements: 11.2, 11.6, 11.7, 11.8_

- [x] 17. Implement accessibility features
  - [x] 17.1 Add ARIA labels and keyboard navigation
    - Add ARIA labels to all KPI cards
    - Add ARIA labels to all chart components
    - Add aria-label or data table alternatives for charts
    - Implement keyboard navigation for all interactive elements
    - Ensure minimum 44px touch targets on mobile
    - Verify WCAG 2.1 AA color contrast ratios
    - Add focus indicators for keyboard navigation
    - Test with screen reader
    - _Requirements: 9.7, 9.8, 9.9, 9.10, 9.11, 9.12_

  - [ ]* 17.2 Write property test for touch target minimum size
    - **Property 27: Touch Target Minimum Size**
    - **Validates: Requirements 9.7**

  - [ ]* 17.3 Write property test for ARIA label presence
    - **Property 28: ARIA Label Presence**
    - **Validates: Requirements 9.9**

  - [ ]* 17.4 Write unit tests for accessibility
    - Test ARIA label presence
    - Test keyboard navigation
    - Test focus indicators
    - Test touch target sizes
    - _Requirements: 9.7-9.12_

- [x] 18. Optimize performance
  - [x] 18.1 Implement performance optimizations
    - Apply React.memo to KPICard, chart components
    - Implement useMemo for expensive metric calculations
    - Implement useCallback for event handlers
    - Add lazy loading for chart components
    - Verify database indexes are created
    - Test query execution times (should be < 2 seconds)
    - Test cache hit/miss rates
    - Verify parallel query execution for independent data
    - Test debouncing on date filter changes
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10_

  - [ ]* 18.2 Write property test for query pagination limit
    - **Property 31: Query Pagination Limit**
    - **Validates: Requirements 10.4**

  - [ ]* 18.3 Write unit tests for performance optimizations
    - Test React.memo prevents unnecessary re-renders
    - Test lazy loading defers rendering
    - Test debouncing delays query execution
    - _Requirements: 10.6, 10.7, 10.8, 10.9_

- [x] 19. Implement chart interactivity features
  - [x] 19.1 Add drill-down and zoom functionality
    - Implement drill-down filtering on donut chart segment click
    - Implement detailed breakdown on line chart data point click
    - Implement itemized expenses on bar chart click
    - Implement metric details on radar chart click
    - Add "Reset Filters" button when drill-down is active
    - Implement zoom functionality on revenue trend chart
    - Add zoom reset controls
    - Implement smooth 300ms transitions for all animations
    - Format tooltip values consistently with dashboard formatting
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9, 12.10, 12.11, 12.12_

  - [ ]* 19.2 Write property test for tooltip formatting consistency
    - **Property 40: Tooltip Formatting Consistency**
    - **Validates: Requirements 12.2**

  - [ ]* 19.3 Write unit tests for chart interactivity
    - Test drill-down filtering
    - Test zoom functionality
    - Test reset filters button
    - Test tooltip display
    - Test animation transitions
    - _Requirements: 12.1-12.12_

- [x] 20. Implement data accuracy validations
  - [x] 20.1 Add data validation and consistency checks
    - Implement soft-deleted record exclusion (status = 'Inactive' or 'Deleted')
    - Implement test data exclusion based on configured rules
    - Add percentage change bounds validation (-100% to +1000%)
    - Display "Significant Change" for out-of-bounds percentage changes
    - Implement numeric value rounding (monetary: 2 decimals, percentage: 1 decimal, rating: 1 decimal)
    - Add data quality issue detection with warning icons
    - Log all calculation errors for debugging
    - _Requirements: 11.1, 11.4, 11.5, 11.9, 11.10, 11.11, 11.12, 11.13, 11.8_

  - [ ]* 20.2 Write property test for soft-deleted record exclusion
    - **Property 35: Soft-Deleted Record Exclusion**
    - **Validates: Requirements 11.4**

  - [ ]* 20.3 Write property test for percentage change bounds validation
    - **Property 38: Percentage Change Bounds Validation**
    - **Validates: Requirements 11.9, 11.10**

  - [ ]* 20.4 Write property test for numeric value rounding
    - **Property 39: Numeric Value Rounding**
    - **Validates: Requirements 11.11, 11.12, 11.13**

  - [ ]* 20.5 Write unit tests for data validation
    - Test soft-deleted record exclusion
    - Test test data exclusion
    - Test percentage change bounds
    - Test numeric rounding
    - _Requirements: 11.1, 11.4, 11.5, 11.9-11.13_

- [x] 21. Implement export data serialization
  - [x] 21.1 Add import/export data validation
    - Implement importFromCSV(csv) function to parse CSV back to data structures
    - Add data type validation during import (numbers, dates, text)
    - Add range validation during import
    - Return detailed error messages with row numbers for invalid data
    - Preserve data types in Excel exports (no type coercion)
    - _Requirements: 14.4, 14.6, 14.7, 14.8, 14.9_

  - [ ]* 21.2 Write property test for Excel data type preservation
    - **Property 45: Excel Data Type Preservation**
    - **Validates: Requirements 14.4**

  - [ ]* 21.3 Write property test for import data validation
    - **Property 47: Import Data Validation**
    - **Validates: Requirements 14.8, 14.9**

  - [ ]* 21.4 Write property test for export metadata inclusion
    - **Property 48: Export Metadata Inclusion**
    - **Validates: Requirements 14.10**

  - [ ]* 21.5 Write unit tests for import/export
    - Test CSV import with valid data
    - Test CSV import with invalid data
    - Test error message generation with row numbers
    - Test Excel data type preservation
    - Test metadata inclusion
    - _Requirements: 14.4, 14.6-14.10_

- [x] 22. Final checkpoint - Comprehensive testing and verification
  - Run all unit tests and property-based tests
  - Verify all 48 correctness properties pass
  - Test responsive design on desktop, tablet, and mobile
  - Test browser compatibility (Chrome, Firefox, Safari, Edge)
  - Conduct accessibility audit with screen reader
  - Verify performance metrics (2-second initial load, 500ms filter response)
  - Test data accuracy against database queries
  - Verify all exports generate valid files
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples, edge cases, and integration points
- All data MUST come from Supabase (no hardcoded values)
- Use React 18.2.0, Recharts 2.15.4, Tailwind CSS 3.4.1, jsPDF 2.5.1, xlsx 0.18.5, fast-check for property testing
- Install fast-check: `npm install --save-dev fast-check`
- Run database migration script before starting implementation
- Use existing HeartbeatLoader component for loading states
- Maintain existing application architecture and routing
- All monetary values use Philippine Peso (₱) formatting
- Date/time values use Philippine timezone (Asia/Manila)
