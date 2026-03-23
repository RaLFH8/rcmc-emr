# Implementation Plan: Dashboard Pixel-Perfect Redesign

## Overview

This implementation plan transforms the RCMC EMR Dashboard from its current analytics-heavy design to a clean, modern interface that matches the reference design pixel-by-pixel. The redesign removes advanced analytics features (which have been moved to the Reports module) and focuses on essential dashboard elements: header, stat cards, patient statistics chart, appointment list with calendar, and recent patients table. All data will be dynamically loaded from the Supabase database with zero hardcoded values.

## Tasks

- [x] 1. Remove advanced analytics features from Dashboard.jsx
  - Remove Sales KPI section (Sales Overview card with revenue breakdown)
  - Remove Sales Analytics section (Revenue Trend chart and Revenue Distribution pie chart)
  - Remove Top Selling Items section (Top Services and Top Medicines tables)
  - Remove Doctor Performance section (performance table and detailed report modal)
  - Remove all related state variables: `showPerformanceReport`, `doctors`, `doctorPerformance`, `topServices`, `topMedicines`, `salesStats`, `salesByCategory`, `monthlySalesData`
  - Remove unused imports: `DollarSign`, `TrendingUp`, `ShoppingCart`, `Pill`, `BarChart`, `Bar`, `PieChart`, `Pie`, `Cell`, `Legend`
  - Keep only the essential sections: Header, Stat Cards, Patient Statistics Chart, Appointment List, Recent Patients Table
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1_

- [x] 2. Implement header section with proper layout and functionality
  - [x] 2.1 Update header structure to match reference design
    - Display welcome message with user's name and role from AuthContext
    - Display subtitle: "Here's what's happening at your clinic today"
    - Add "Last updated" timestamp with current date (format: "Month DD, YYYY")
    - Add refresh button next to timestamp with RefreshCw icon
    - Add "Export CSV" button with Download icon
    - Apply proper spacing and alignment using Tailwind classes
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_
  
  - [ ]* 2.2 Write property test for header content
    - **Property 1: Header Section Content**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**
    - Test that header displays all required elements for any authenticated user
    - Verify welcome message contains user name and role
    - Verify timestamp, refresh button, and export button are present

  - [x] 2.3 Implement refresh functionality
    - Create `handleRefresh` function that calls `loadData()`
    - Update timestamp to current date when refresh is triggered
    - Add loading state during refresh
    - _Requirements: 1.4_

  - [x] 2.4 Implement CSV export functionality
    - Create `handleExport` function that exports dashboard data to CSV
    - Include stat card values, recent patients, and today's appointments
    - Format CSV with proper headers and data rows
    - Trigger browser download with filename: "dashboard-export-{date}.csv"
    - _Requirements: 1.5_

- [x] 3. Update stat cards grid layout
  - [x] 3.1 Verify stat cards structure and order
    - Ensure exactly 4 stat cards are displayed
    - Verify order: Total Patient, Total Doctor, Book Appointment, Room Availability
    - Confirm responsive grid classes: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6`
    - _Requirements: 2.1, 2.2, 2.3, 2.7_
  
  - [ ]* 3.2 Write property test for stat cards grid
    - **Property 2: Stat Cards Grid Structure and Styling**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.8, 2.9, 2.10, 2.11**
    - Test that exactly 4 cards are displayed in correct order
    - Verify each card has correct icon gradient background
    - Verify values come from database (no hardcoded values)
    - Test with various stat values from database

  - [x] 3.2 Update stat card gradient backgrounds
    - Verify Total Patient card uses: `bg-gradient-to-br from-teal-400 to-teal-600`
    - Verify Total Doctor card uses: `bg-gradient-to-br from-purple-400 to-purple-600`
    - Verify Book Appointment card uses: `bg-gradient-to-br from-teal-400 to-teal-600`
    - Verify Room Availability card uses: `bg-gradient-to-br from-pink-400 to-pink-600`
    - _Requirements: 2.8, 2.9, 2.10, 2.11_

  - [x] 3.3 Calculate real trend percentages from database
    - Fetch previous month's stats using `db.getStatsForMonth(previousMonth)`
    - Calculate percentage change: `((current - previous) / previous) * 100`
    - Format trend as "+X.X%" or "-X.X%"
    - Update trend color: green for positive, red for negative
    - _Requirements: 2.6_

- [x] 4. Verify two-column layout structure
  - [x] 4.1 Confirm layout grid configuration
    - Verify grid classes: `grid grid-cols-1 lg:grid-cols-3 gap-6`
    - Verify Patient Statistics Chart has: `lg:col-span-2`
    - Verify Appointment List has: `lg:col-span-1`
    - Test responsive stacking on mobile and tablet
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  
  - [ ]* 4.2 Write property test for two-column layout
    - **Property 3: Two-Column Layout Structure**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
    - Test that layout uses correct grid classes
    - Verify column span values for desktop viewport
    - Test responsive stacking on mobile viewport

- [x] 5. Update Patient Statistics Chart
  - [x] 5.1 Verify chart structure and styling
    - Confirm title: "Patient Statistics"
    - Confirm dropdown selector with options: Daily, Weekly, Monthly
    - Verify total patient count display above chart
    - Verify trend indicator with emerald-600 color
    - Verify chart height: 280px
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 5.2 Update chart line styling to match reference design
    - Set main line color: `#14b8a6` (teal-500)
    - Set main line width: `3px`
    - Set comparison line as dashed: `strokeDasharray="5 5"`
    - Set comparison line color: `#94a3b8` (slate-400)
    - Configure gradient fill with id: "colorValue"
    - Set gradient stops: 5% at #5eead4 (opacity 0.4), 95% at #5eead4 (opacity 0.05)
    - _Requirements: 4.5, 4.6, 4.7, 4.10_

  - [x] 5.3 Configure chart grid and axes
    - Set grid color: `#f1f5f9` (slate-100)
    - Set grid to horizontal only: `vertical={false}`
    - Set axis label color: `#94a3b8` (slate-400)
    - Set axis font size: 13px
    - Remove axis lines: `axisLine={false}`
    - Remove tick lines: `tickLine={false}`
    - _Requirements: 4.9_

  - [ ]* 5.4 Write property test for chart data transformation
    - **Property 5: Chart Data Round Trip**
    - **Validates: Requirements 4.8**
    - Test that patient growth data from database is accurately transformed to chart data points
    - Verify month labels and patient counts are preserved
    - Test with various date ranges and patient counts

  - [x] 5.5 Implement chart view switching (Daily, Weekly, Monthly)
    - Create `handleViewChange` function to update `chartView` state
    - Fetch appropriate data based on selected view
    - Daily: Last 7 days of patient registrations
    - Weekly: Last 8 weeks of patient registrations
    - Monthly: Last 6 months of patient registrations (current implementation)
    - Update chart data and comparison data accordingly
    - _Requirements: 4.2_

- [x] 6. Checkpoint - Verify header, stat cards, and chart implementation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Update Appointment List with Calendar
  - [x] 7.1 Verify calendar structure and styling
    - Confirm title: "Appointment List"
    - Confirm refresh button with RefreshCw icon
    - Verify calendar grid: 7 columns for days of week
    - Verify month navigation buttons (ChevronLeft, ChevronRight)
    - Verify day names row: Mon, Tue, Wed, Thu, Fri, Sat, Sun
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [ ]* 7.2 Write property test for calendar date selection
    - **Property 6: Calendar Date Selection**
    - **Validates: Requirements 5.5, 5.6**
    - Test that clicking a valid date updates selectedDate state
    - Verify selected date has teal-500 background
    - Test with various dates and months

  - [x] 7.3 Update calendar date styling
    - Selected date: `bg-teal-500 text-white font-semibold`
    - Unselected date: `hover:bg-slate-100 text-slate-700`
    - Empty cells: no styling, disabled
    - Date button: `aspect-square flex items-center justify-center text-sm rounded-lg`
    - _Requirements: 5.5, 5.6_

  - [x] 7.4 Verify appointment list structure
    - Confirm "Schedule" section title
    - Confirm "View All" button
    - Verify max 4 appointments displayed
    - Verify appointment item structure: avatar, doctor name, patient name, time, status badge
    - _Requirements: 5.7, 5.8, 5.11_

  - [ ]* 7.5 Write property test for appointment list data
    - **Property 7: Appointment List Structure and Data**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.7, 5.8, 5.9, 5.10, 5.11, 5.12**
    - Test that appointment list displays all required elements
    - Verify appointments are loaded from database
    - Verify max 4 appointments are displayed
    - Verify empty state when no appointments
    - Test status badge colors for different statuses

  - [x] 7.6 Update appointment status badge colors
    - Completed: `bg-green-100 text-green-700`
    - In Progress: `bg-blue-100 text-blue-700`
    - Scheduled: `bg-yellow-100 text-yellow-700`
    - Cancelled: `bg-red-100 text-red-700`
    - _Requirements: 5.12_

  - [x] 7.7 Implement empty state for appointments
    - Display Calendar icon (w-12 h-12, slate-300 color)
    - Display message: "No appointments scheduled for today"
    - Center align content
    - _Requirements: 5.10_

- [x] 8. Update Recent Patients Table
  - [x] 8.1 Verify table header structure
    - Confirm title: "Recent Patients"
    - Confirm subtitle: "Real-time inventory status across all locations"
    - Verify search input with Search icon
    - Verify filter button with Filter icon
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [x] 8.2 Verify table column structure
    - Confirm columns: No, Item (Name), Gender, Date of Birth, Location, Contact
    - Verify column headers use uppercase with tracking-wider
    - Verify header styling: `text-xs font-semibold text-slate-600 uppercase tracking-wider`
    - _Requirements: 6.5_

  - [ ]* 8.3 Write property test for recent patients table
    - **Property 8: Recent Patients Table Structure**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.8, 6.9, 6.10, 6.11**
    - Test that table displays all required elements
    - Verify patients are loaded from database
    - Verify date formatting as "MMM DD, YYYY"
    - Verify location truncation with ellipsis
    - Test hover effects on table rows

  - [x] 8.3 Update date formatting for Date of Birth column
    - Use format: "MMM DD, YYYY" (e.g., "Jan 15, 2025")
    - Implement using: `new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })`
    - _Requirements: 6.8_

  - [x] 8.4 Update location column with MapPin icon and truncation
    - Add MapPin icon (w-3 h-3) before address
    - Truncate address to 20 characters with ellipsis
    - Use flex layout: `flex items-center gap-1`
    - Apply max-width: `max-w-[150px]`
    - _Requirements: 6.9, 6.10_

  - [x] 8.5 Verify table row hover effects
    - Apply hover class: `hover:bg-slate-50 transition-colors`
    - Ensure smooth transition
    - _Requirements: 6.11_

- [x] 9. Implement database-driven data loading
  - [x] 9.1 Verify all data queries in loadData function
    - Confirm `db.getStats()` for stat card values
    - Confirm `db.getPatients(4, 0)` for recent patients (limit 4)
    - Confirm `db.getTodayAppointments()` for today's appointments
    - Confirm `db.getRoomAvailability()` for room stats
    - Confirm `db.getPatientStatistics()` for last month patient count
    - Confirm `db.getPatientGrowthData(6)` for chart data (last 6 months)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_
  
  - [ ]* 9.2 Write property test for database-driven data
    - **Property 9: Database-Driven Data Loading**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9**
    - Test that all displayed data comes from database queries
    - Verify no hardcoded arrays or objects are used for display
    - Test empty state handling when database is empty
    - Mock database responses and verify UI updates correctly

  - [x] 9.2 Remove any remaining hardcoded data
    - Search for hardcoded arrays or objects in Dashboard.jsx
    - Replace with database queries or empty state handling
    - Verify no static data is displayed
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 9.3 Implement empty state handling
    - When stats are zero, display "0" (not "N/A")
    - When patients array is empty, display empty table with message
    - When appointments array is empty, display empty state with Calendar icon
    - When chart data is empty, display chart with zero values
    - _Requirements: 7.9_

  - [x] 9.4 Implement error handling for data loading
    - Wrap all database queries in try-catch block
    - Log errors to console for debugging
    - Display user-friendly error message or toast notification
    - Set default/empty values to prevent UI crashes
    - _Requirements: 7.10_

  - [ ]* 9.5 Write property test for error handling
    - **Property 10: Error Handling**
    - **Validates: Requirements 7.10**
    - Test that database query failures are caught
    - Verify error messages are displayed
    - Verify application doesn't crash on error
    - Mock database failures and verify graceful degradation

- [x] 10. Implement responsive layout
  - [x] 10.1 Verify responsive breakpoints for stat cards
    - Mobile (< 768px): `grid-cols-1` (stack vertically)
    - Tablet (768px - 1024px): `md:grid-cols-2` (2 columns)
    - Desktop (> 1024px): `lg:grid-cols-4` (4 columns)
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [x] 10.2 Verify responsive breakpoints for two-column layout
    - Mobile (< 1024px): `grid-cols-1` (stack vertically)
    - Desktop (> 1024px): `lg:grid-cols-3` (3 columns with 2:1 ratio)
    - _Requirements: 8.2, 8.3, 8.5_

  - [ ]* 10.3 Write property test for responsive layout
    - **Property 11: Responsive Layout Behavior**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6**
    - Test that appropriate responsive classes are applied
    - Verify stat cards stack on mobile
    - Verify two-column layout stacks on mobile/tablet
    - Verify table is scrollable on mobile
    - Test with various viewport sizes

  - [x] 10.3 Verify table horizontal scroll on mobile
    - Confirm wrapper div has: `overflow-x-auto`
    - Confirm table has minimum width: `min-w-[640px]`
    - Test on mobile viewport to ensure scrolling works
    - _Requirements: 8.6_

  - [x] 10.4 Verify spacing and padding on all screen sizes
    - Test dashboard on mobile (375px), tablet (768px), and desktop (1440px)
    - Verify all elements maintain proper spacing
    - Verify no horizontal overflow
    - Verify touch targets are at least 44x44px on mobile
    - _Requirements: 8.7_

- [x] 11. Implement loading states
  - [x] 11.1 Verify HeartbeatLoader implementation
    - Confirm loading state is set to true on component mount
    - Confirm HeartbeatLoader is displayed when loading is true
    - Confirm message: "Loading dashboard..."
    - Confirm loader is centered: `flex items-center justify-center h-full`
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [ ]* 11.2 Write property test for loading state
    - **Property 12: Loading State Display**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**
    - Test that HeartbeatLoader is displayed when loading is true
    - Verify loader message is correct
    - Test that loader is hidden when loading is false
    - Verify data is rendered immediately after loading completes

  - [x] 11.2 Verify loading state transitions
    - Confirm loading is set to false after data is loaded
    - Confirm all data is rendered immediately after loading completes
    - Test that no flash of empty content occurs
    - _Requirements: 10.4, 10.5_

- [x] 12. Final checkpoint - Comprehensive testing and verification
  - Run all property-based tests and unit tests
  - Test dashboard on multiple screen sizes (mobile, tablet, desktop)
  - Verify all data is loaded from database with no hardcoded values
  - Test error handling by simulating database failures
  - Verify loading states work correctly
  - Test refresh functionality
  - Test CSV export functionality
  - Verify pixel-perfect match to reference design
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples and edge cases
- The current Dashboard.jsx has 1025 lines with advanced analytics features that will be removed, resulting in a cleaner ~400-500 line implementation
- All removed analytics features (Sales KPIs, Revenue Charts, Doctor Performance) have been moved to the Reports module
- Focus on pixel-perfect match to reference design with proper spacing, colors, and typography
