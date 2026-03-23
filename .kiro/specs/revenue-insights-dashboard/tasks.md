# Implementation Plan: Revenue Insights Dashboard

## Overview

This implementation plan breaks down the Revenue Insights Dashboard feature into actionable coding tasks. The feature adds a comprehensive analytics component to the Reports page with six revenue views, interactive charts, CSV export, and period-over-period comparison. All data is fetched from Supabase using optimized queries with caching.

## Tasks

- [x] 1. Set up project structure and configuration files
  - Create directory structure for analytics components
  - Create view configuration file with all 6 revenue views
  - Set up color palette and chart configuration constants
  - _Requirements: 1.1, 2.1_

- [ ] 2. Create CSV utility modules
  - [x] 2.1 Implement CSV parser with special character escaping
    - Write parseToCSV function with proper field escaping
    - Implement escapeCSVField for commas, quotes, and newlines
    - Add parseFromCSV for round-trip testing support
    - Implement parseCSVLine with quote handling
    - _Requirements: 21.1, 21.2, 21.3, 22.4_
  
  - [ ]* 2.2 Write property test for CSV parser
    - **Property 17: CSV Special Character Escaping**
    - **Validates: Requirements 21.2, 22.4**
  
  - [ ]* 2.3 Write property test for CSV round-trip integrity
    - **Property 18: CSV Round-Trip Property**
    - **Validates: Requirements 23.2**
  
  - [ ] 2.4 Implement CSV pretty printer with UTF-8 encoding
    - Write prettyPrintCSV function with BOM for Excel compatibility
    - Implement downloadCSV function for browser download
    - Add URL cleanup after download
    - _Requirements: 21.6, 22.1_
  
  - [ ]* 2.5 Write property test for CSV number formatting
    - **Property 16: CSV Number Formatting**
    - **Validates: Requirements 21.4, 21.5**

- [ ] 3. Extend analytics service with revenue query functions
  - [ ] 3.1 Implement getDepartmentRevenue query
    - Write Supabase query with JOIN on consultations and billing
    - Add date range filtering with inclusive bounds
    - Group by department and calculate totals
    - Sort by revenue descending and limit to top 10
    - Calculate percentages for each department
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_
  
  - [ ] 3.2 Implement getServiceTypeRevenue query
    - Write Supabase query with JSONB array parsing for billing items
    - Implement CASE statement for service categorization
    - Add date range filtering and payment status check
    - Calculate totals and percentages per service type
    - Assign colors to each service category
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  
  - [ ] 3.3 Implement getPaymentMethodDistribution query
    - Write Supabase query grouping by payment_method
    - Filter by date range and payment status
    - Calculate transaction counts and revenue totals
    - Sort by revenue descending
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  
  - [ ] 3.4 Implement getDoctorPerformance query
    - Write Supabase query with JOIN on doctors, consultations, and billing
    - Concatenate doctor first_name and last_name
    - Filter by active doctors and date range
    - Calculate patient counts and revenue per doctor
    - Limit to top 10 doctors by revenue
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_
  
  - [ ] 3.5 Implement getInventoryCosts query
    - Write Supabase query with JOIN on inventory and billing items
    - Parse JSONB billing items and match with inventory
    - Calculate quantity × unit_price for total costs
    - Group by item_name and category
    - Limit to top 10 items by cost
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  
  - [ ] 3.6 Implement getPatientTypeRevenue query
    - Write CTE to categorize patients (new/returning, inpatient/outpatient, emergency)
    - Check consultation history for new vs returning classification
    - Check inpatients table for admission status
    - Check appointment_type for emergency classification
    - Calculate revenue per patient category
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [ ] 3.7 Add caching logic to analytics service
    - Implement getCachedData and setCachedData functions
    - Create cache key from view and date range
    - Set 5-minute cache expiration
    - Add cache invalidation on date range change
    - _Requirements: 17.3, 17.4_
  
  - [ ]* 3.8 Write property test for date range filtering
    - **Property 10: Date Range Filtering**
    - **Validates: Requirements 15.3, 15.4, 15.5**
  
  - [ ]* 3.9 Write property test for data sorting
    - **Property 2: Data Sorting Invariant**
    - **Validates: Requirements 3.4, 4.4, 5.4, 6.5, 7.4, 8.4**
  
  - [ ]* 3.10 Write property test for total revenue calculation
    - **Property 3: Total Revenue Calculation**
    - **Validates: Requirements 3.8, 4.6, 5.6, 6.7, 7.6, 8.5**

- [ ] 4. Checkpoint - Verify database queries
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Create chart subcomponents
  - [ ] 5.1 Implement CustomLabel component
    - Create functional component accepting Recharts label props
    - Format value using formatCurrency utility
    - Position label at end of bar with proper offset
    - Apply consistent styling (color, font size, weight)
    - _Requirements: 11.3, 11.4, 11.7_
  
  - [ ]* 5.2 Write property test for chart label formatting
    - **Property 7: Chart Label Formatting**
    - **Validates: Requirements 11.3, 11.4, 11.7**
  
  - [ ] 5.3 Implement CustomTooltip component
    - Create functional component accepting Recharts tooltip props
    - Display category name, amount, and percentage
    - Conditionally show count field if available
    - Apply white background with border and shadow
    - _Requirements: 12.1, 12.2, 12.3_
  
  - [ ]* 5.4 Write property test for tooltip content completeness
    - **Property 9: Tooltip Content Completeness**
    - **Validates: Requirements 12.1, 12.2, 12.3**

- [ ] 6. Build main RevenueInsightsChart component
  - [ ] 6.1 Set up component structure and state management
    - Create functional component with dateRange prop
    - Initialize state for activeView, isMenuOpen, viewDataCache, loading, error
    - Import all necessary dependencies (React, Recharts, icons)
    - Set up refs for menu button and menu container
    - _Requirements: 1.1, 2.1, 9.1_
  
  - [ ] 6.2 Implement view tab navigation
    - Map over REVENUE_VIEWS to render tab buttons
    - Add click handlers to update activeView state
    - Apply conditional styling for active tab (teal background)
    - Add icons and labels with responsive visibility
    - _Requirements: 2.2, 2.3, 2.4, 2.5_
  
  - [ ]* 6.3 Write property test for view tab state management
    - **Property 1: View Tab State Management**
    - **Validates: Requirements 2.3**
  
  - [ ] 6.4 Implement data fetching with lazy loading
    - Create useEffect hook triggered by activeView and dateRange changes
    - Check viewDataCache before fetching
    - Call appropriate query function from analyticsService
    - Update viewDataCache with fetched data
    - Handle loading and error states
    - _Requirements: 9.5, 9.6, 15.2, 17.1, 17.2_
  
  - [ ]* 6.5 Write property test for view data reactivity
    - **Property 11: View Data Reactivity**
    - **Validates: Requirements 9.5, 9.6, 15.2, 17.1**
  
  - [ ]* 6.6 Write property test for cache hit behavior
    - **Property 12: Cache Hit Behavior**
    - **Validates: Requirements 17.3, 17.4**
  
  - [ ] 6.7 Implement total revenue and period comparison display
    - Calculate total revenue from current view data
    - Fetch previous period data for comparison
    - Calculate percentage change using calculatePercentageChange utility
    - Display total with formatCurrency
    - Show green/red/amber indicator based on change direction
    - _Requirements: 9.2, 9.3, 9.4, 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ]* 6.8 Write property test for currency formatting
    - **Property 4: Currency Formatting Consistency**
    - **Validates: Requirements 9.2, 9.3, 9.4**
  
  - [ ]* 6.9 Write property test for period comparison calculation
    - **Property 5: Period Comparison Calculation**
    - **Validates: Requirements 10.1, 10.2**
  
  - [ ]* 6.10 Write property test for period comparison visual indicator
    - **Property 6: Period Comparison Visual Indicator**
    - **Validates: Requirements 10.3, 10.4, 10.5**
  
  - [ ] 6.11 Implement horizontal bar chart with Recharts
    - Set up ResponsiveContainer with 350px height
    - Configure BarChart with sorted data (top 10 items)
    - Add XAxis with currency formatting
    - Add YAxis with category names and 150px width
    - Add CartesianGrid with dashed lines
    - Add Bar with teal color, rounded corners, and CustomLabel
    - Add Tooltip with CustomTooltip component
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 12.1_
  
  - [ ]* 6.12 Write property test for top 10 limiting
    - **Property 8: Top 10 Limiting**
    - **Validates: Requirements 11.8**
  
  - [ ] 6.13 Implement no data state
    - Add conditional rendering when data array is empty
    - Display current view icon in gray
    - Show "No data available" message
    - Add descriptive subtext
    - _Requirements: 9.7_
  
  - [ ] 6.14 Implement legend section
    - Create grid layout (2 columns mobile, 3 on md+)
    - Display up to 6 legend items with color indicators
    - Show category name and formatted amount
    - Apply responsive styling
    - _Requirements: 13.1, 13.2, 13.3_
  
  - [ ] 6.15 Implement export menu and CSV download
    - Add three-dot menu button with click handler
    - Create dropdown menu with "Export Data" option
    - Implement handleExport function
    - Generate CSV using parseToCSV utility
    - Format CSV with prettyPrintCSV
    - Generate filename with view label and current date
    - Trigger download using downloadCSV
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_
  
  - [ ]* 6.16 Write property test for CSV export completeness
    - **Property 14: CSV Export Completeness**
    - **Validates: Requirements 14.4, 14.5, 14.6**
  
  - [ ]* 6.17 Write property test for CSV filename generation
    - **Property 15: CSV Filename Generation**
    - **Validates: Requirements 14.7**
  
  - [ ] 6.18 Add error handling and retry logic
    - Wrap data fetching in try-catch blocks
    - Display error messages in UI
    - Implement fetchWithRetry with exponential backoff
    - Add timeout handling (5 second limit)
    - Ensure errors in one view don't affect others
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_
  
  - [ ]* 6.19 Write property test for error isolation
    - **Property 13: Error Isolation**
    - **Validates: Requirements 18.5**
  
  - [ ] 6.20 Implement accessibility features
    - Add ARIA labels to all interactive elements
    - Add role="tab" and aria-selected to view tabs
    - Add aria-expanded and aria-haspopup to menu button
    - Add role="menu" and role="menuitem" to export menu
    - Add role="img" and aria-label to chart
    - Add role="status" and aria-live to loading/error states
    - Implement keyboard navigation (Tab, Enter, Space, Escape)
    - Add focus management for menu open/close
    - Ensure all icons have aria-hidden="true"
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7_
  
  - [ ]* 6.21 Write unit tests for accessibility
    - Test ARIA attributes with jest-axe
    - Test keyboard navigation
    - Test focus management
    - Verify color contrast ratios
  
  - [ ] 6.22 Implement responsive design
    - Apply responsive classes for tab labels (hidden sm:inline)
    - Apply responsive grid for legend (grid-cols-2 md:grid-cols-3)
    - Ensure chart container is full width
    - Test on mobile, tablet, and desktop breakpoints
    - _Requirements: 16.1, 16.2, 16.3_
  
  - [ ] 6.23 Add performance optimizations
    - Wrap expensive calculations in useMemo
    - Implement debounced date range with useDebounce hook
    - Add lazy view loading (fetch only when tab is clicked)
    - Configure ResponsiveContainer with debounced resize
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [ ] 7. Checkpoint - Verify component functionality
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Integrate into Reports page
  - [ ] 8.1 Replace ExpenseBreakdownChart with RevenueInsightsChart
    - Import RevenueInsightsChart in Reports.jsx
    - Replace ExpenseBreakdownChart component in AnalyticsDashboard
    - Pass dateRange prop from parent component
    - Verify layout and spacing in grid
    - _Requirements: 1.2, 1.3, 15.1_
  
  - [ ]* 8.2 Write integration test for Reports page
    - Test component renders in Reports page
    - Test dateRange prop is passed correctly
    - Test layout with other analytics components
  
  - [ ] 8.3 Add database indexes for query optimization
    - Create index on consultations(consultation_date, department)
    - Create index on consultations(doctor_id, consultation_date)
    - Create index on billing(bill_date, payment_status)
    - Create index on billing(payment_method, bill_date)
    - Create index on billing(consultation_id)
    - Create index on inventory(item_name)
    - _Requirements: 17.1_
  
  - [ ] 8.4 Verify integration and data flow
    - Test all 6 views load correctly
    - Test date range changes update all views
    - Test export works from Reports page
    - Test caching works across view switches
    - Test error handling doesn't break Reports page
    - _Requirements: 1.1, 1.2, 1.3, 15.1, 15.2_

- [ ] 9. Final checkpoint - Comprehensive testing
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (18 total)
- Unit tests validate specific examples and edge cases
- Minimum 80% unit test coverage required
- All 18 property tests must run with minimum 100 iterations using fast-check
- Component uses JavaScript/JSX with React and Recharts library
- All data fetched from Supabase with optimized queries
- CSV export uses custom parser and pretty printer utilities
- Accessibility compliance with ARIA attributes and keyboard navigation
- Performance optimizations include caching, memoization, and debouncing
