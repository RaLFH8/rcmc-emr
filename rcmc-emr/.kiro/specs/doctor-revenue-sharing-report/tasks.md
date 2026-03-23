# Implementation Plan: Doctor Revenue Sharing Report

## Overview

This implementation plan breaks down the Doctor Revenue Sharing Report feature into discrete, actionable coding tasks. The feature adds a new tab to the Reports & Analytics section that displays per-doctor consultation counts and revenue breakdowns with automatic 60/40 split calculations. The implementation follows a bottom-up approach: database optimization → service layer → UI components → integration → testing.

## Tasks

- [x] 1. Database optimization and indexing
  - Create database indexes for optimal query performance
  - Add indexes on consultations(doctor_id, consultation_date)
  - Add indexes on billing(consultation_id, payment_status)
  - Add index on doctors(status) for active doctor filtering
  - _Requirements: 9.3, 9.6_

- [ ] 2. Implement DoctorRevenueService core functionality
  - [x] 2.1 Create doctorRevenueService.js with revenue calculation methods
    - Implement calculateRevenueSplit(amount, doctorPercentage) function
    - Implement categorizeRevenue(items) function for billing item categorization
    - Add revenue category mapping logic (consultation, procedure, service, medicine, lab, other)
    - _Requirements: 2.1, 2.2, 2.4, 3.1, 3.2, 3.5_

  - [ ]* 2.2 Write property test for revenue split calculation
    - **Property 6: Revenue Split Calculation**
    - **Validates: Requirements 3.1, 3.2, 3.4, 3.5**
    - Test that doctorShare = amount × 0.60 and clinicShare = amount × 0.40
    - Test that doctorShare + clinicShare equals original amount (within 0.01)
    - Use fast-check with 100 iterations testing amounts from 0 to 1,000,000

  - [ ]* 2.3 Write property test for revenue categorization
    - **Property 4: Revenue Categorization Completeness**
    - **Validates: Requirements 2.2, 2.4**
    - Test that every billing item is assigned to exactly one category
    - Test all category mapping rules (consultation, procedure, service, medicine, lab, other)

  - [x] 2.4 Implement getRevenueReport(dateRange, doctorId) method
    - Query consultations table with date range filtering
    - Join with billing table to get revenue data
    - Join with doctors table to get doctor information
    - Apply role-based filtering (doctorId parameter)
    - Aggregate revenue by doctor and category
    - Calculate consultation counts
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 4.3, 4.4, 8.2, 8.3_

  - [ ]* 2.5 Write property test for date range filtering
    - **Property 9: Date Range Filtering**
    - **Validates: Requirements 4.3, 6.3**
    - Test that only consultations within date range are included
    - Generate random consultations with various dates
    - Verify filtered results match expected date range

  - [ ]* 2.6 Write property test for active doctors display
    - **Property 1: Active Doctors Display**
    - **Validates: Requirements 1.1, 7.3**
    - Test that only doctors with status "Active" appear in report
    - Generate random doctors with various statuses
    - Verify only active doctors in results

  - [x] 2.7 Implement getSummaryStatistics(dateRange) method
    - Calculate total consultations across all doctors
    - Calculate total revenue, total doctor share, total clinic share
    - Calculate data quality score (consultations with billing / total consultations)
    - _Requirements: 6.2, 6.5, 6.6, 7.5_

  - [ ]* 2.8 Write property test for summary statistics
    - **Property 15: Summary Statistics Calculation**
    - **Validates: Requirements 6.2, 6.5, 6.6**
    - Test that summary totals equal sum of individual doctor values
    - Test grand total aggregation accuracy

  - [ ]* 2.9 Write unit tests for edge cases
    - Test consultation without billing (count but ₱0.00 revenue)
    - Test zero or null billing amounts
    - Test malformed JSONB billing items
    - Test empty date ranges
    - _Requirements: 7.1, 7.2, 7.4_

- [x] 3. Checkpoint - Verify service layer functionality
  - Ensure all service methods work correctly
  - Verify database queries return expected data
  - Confirm property tests pass
  - Ask the user if questions arise

- [x] 4. Implement export functionality
  - [x] 4.1 Extend exportService.js with revenue report export methods
    - Implement exportRevenueReportCSV(data, dateRange) function
    - Implement exportRevenueReportPDF(data, dateRange) function
    - Implement exportRevenueReportExcel(data, dateRange) function
    - Add filename generation with date range (e.g., "doctor-revenue-report-2024-01-01-to-2024-01-31.csv")
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 4.2 Write property test for CSV export data integrity
    - **Property 11: CSV Export Data Integrity**
    - **Validates: Requirements 5.2, 5.7**
    - Test that CSV contains all report data
    - Verify RFC 4180 compliance
    - Test column headers and data formatting

  - [ ]* 4.3 Write property test for export filename format
    - **Property 14: Export Filename Format**
    - **Validates: Requirements 5.5**
    - Test filename follows pattern "doctor-revenue-report-{startDate}-to-{endDate}.{extension}"
    - Verify date format is YYYY-MM-DD

  - [ ]* 4.4 Write unit tests for export error handling
    - Test export failure scenarios
    - Test alternative format fallback
    - Verify error messages displayed to user

- [x] 5. Implement React components
  - [x] 5.1 Create RevenueSummaryCards component
    - Display total consultations, total revenue, total doctor share, total clinic share
    - Use KPICard component for consistent styling
    - Add percentage indicators for 60/40 split
    - Format currency values with ₱ symbol and two decimal places
    - _Requirements: 6.1, 6.2, 6.4, 6.7_

  - [x] 5.2 Create DoctorRevenueTable component
    - Display doctor list with consultation count and revenue breakdown
    - Show revenue by category (consultation fees, procedures, services, medicine, labs, other)
    - Display doctor share (60%) and clinic share (40%) for each category
    - Implement sorting by consultation count (default descending)
    - Add expandable rows for detailed category breakdown
    - Format all currency values with ₱ symbol
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 2.3, 2.6, 3.3, 3.6_

  - [ ]* 5.3 Write property test for currency formatting
    - **Property 20: Currency Formatting**
    - **Validates: Requirements 2.6**
    - Test that all amounts display with ₱ symbol, two decimals, thousands separators

  - [x] 5.4 Create DoctorRevenueReport main component
    - Set up component state (loading, reportData, error, exportFormat)
    - Implement loadReportData() method using DoctorRevenueService
    - Implement handleDateRangeChange(start, end) method
    - Implement handleExport(format) method
    - Add loading indicator with HeartbeatLoader
    - Add error handling and display
    - Integrate RevenueSummaryCards and DoctorRevenueTable
    - Add export buttons (CSV, PDF, Excel)
    - _Requirements: 1.1, 4.1, 5.1, 9.1_

  - [ ]* 5.5 Write integration test for complete report flow
    - Test full user flow: load report → change date range → export
    - Verify data loads correctly
    - Verify UI updates on date range change
    - Verify export triggers download

- [x] 6. Implement access control and permissions
  - [x] 6.1 Add role-based access control to DoctorRevenueReport component
    - Check user role on component mount
    - Redirect non-admin/non-doctor users to dashboard
    - Filter data by doctorId for doctor role users
    - Show all data for admin role users
    - Display unauthorized access message
    - _Requirements: 8.1, 8.2, 8.3, 8.5_

  - [ ]* 6.2 Write property test for role-based access control
    - **Property 17: Role-Based Access Control**
    - **Validates: Requirements 8.1, 8.5**
    - Test that only admin and doctor roles can access report

  - [ ]* 6.3 Write property test for role-based data filtering
    - **Property 18: Role-Based Data Filtering**
    - **Validates: Requirements 8.2, 8.3**
    - Test that doctors see only their own data
    - Test that admins see all doctors' data

- [x] 7. Integrate into Reports & Analytics section
  - [x] 7.1 Add "Doctor Revenue Sharing" tab to Reports.jsx
    - Add new tab to tabs array with label "Doctor Revenue Sharing"
    - Add tab icon (DollarSign from lucide-react)
    - Conditionally render DoctorRevenueReport component when tab is active
    - Hide tab for non-admin/non-doctor users
    - _Requirements: 10.1, 10.4, 8.4_

  - [x] 7.2 Integrate DateRangeFilter component
    - Reuse existing DateRangeFilter component from analytics
    - Pass dateRange state to DoctorRevenueReport
    - Preserve date range when switching between tabs
    - _Requirements: 4.1, 4.2, 10.3, 10.5_

  - [ ]* 7.3 Write property test for date range state persistence
    - **Property 24: Date Range State Persistence**
    - **Validates: Requirements 10.5**
    - Test that date range is preserved when switching tabs

  - [x] 7.4 Apply consistent styling and design patterns
    - Use Tailwind CSS classes matching existing reports
    - Follow existing color scheme and typography
    - Ensure responsive design for mobile and tablet
    - _Requirements: 10.2_

- [x] 8. Checkpoint - Verify integration and UI
  - Test navigation to Doctor Revenue Sharing tab
  - Verify date range filtering works correctly
  - Test export functionality for all formats
  - Verify role-based access control
  - Ensure all tests pass
  - Ask the user if questions arise

- [x] 9. Implement performance optimizations
  - [x] 9.1 Add caching layer to DoctorRevenueService
    - Implement in-memory cache with 5-minute TTL
    - Cache report data by date range and doctorId
    - Implement cache invalidation on data updates
    - _Requirements: 9.6_

  - [x] 9.2 Add pagination for large doctor lists
    - Implement pagination when more than 50 doctors
    - Add page size selector (25, 50, 100)
    - Add pagination controls (previous, next, page numbers)
    - _Requirements: 9.4_

  - [x] 9.3 Add performance monitoring and warnings
    - Display warning for date ranges exceeding 2 years
    - Implement query timeout (5 seconds)
    - Add loading progress indicator
    - _Requirements: 9.1, 9.2, 9.5_

  - [ ]* 9.4 Write performance test for query speed
    - Test that report loads in <3 seconds for 1-year date range
    - Test export generation completes in <5 seconds
    - Verify no memory leaks on repeated report generation

- [x] 10. Implement error handling and data quality
  - [x] 10.1 Add comprehensive error handling
    - Handle authentication errors (redirect to login)
    - Handle authorization errors (redirect to dashboard)
    - Handle database query errors (display error message, retry button)
    - Handle data validation errors (inline validation messages)
    - Handle export errors (error modal with alternative formats)
    - _Requirements: 7.6_

  - [ ]* 10.2 Write property test for date range validation
    - **Property 10: Date Range Validation**
    - **Validates: Requirements 4.6**
    - Test that endDate < startDate displays validation error

  - [ ]* 10.3 Write property test for large date range warning
    - **Property 25: Large Date Range Warning**
    - **Validates: Requirements 9.5**
    - Test that date ranges >730 days display warning message

  - [x] 10.4 Add data quality indicators
    - Display data quality score in summary section
    - Show percentage of consultations with complete billing
    - Add tooltip explaining data quality score
    - Highlight doctors with incomplete billing data
    - _Requirements: 7.5_

  - [ ]* 10.5 Write property test for data quality score
    - **Property 16: Data Quality Score Calculation**
    - **Validates: Requirements 7.5**
    - Test that score = (consultations with billing / total consultations) × 100

  - [ ]* 10.6 Write unit tests for missing data handling
    - Test consultation without billing (included in count, ₱0.00 revenue)
    - Test zero or null billing amounts
    - Test doctor with no consultations in date range
    - Test malformed JSONB billing items
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 11. Final checkpoint and testing
  - Run all unit tests and verify 80% code coverage
  - Run all property tests (25 properties) and verify they pass
  - Run integration tests for complete user flows
  - Test with real data in development environment
  - Verify accessibility (keyboard navigation, ARIA labels, color contrast)
  - Test on multiple browsers (Chrome, Firefox, Safari, Edge)
  - Test on mobile and tablet devices
  - Ensure all tests pass, ask the user if questions arise

- [x] 12. Documentation and deployment preparation
  - [x] 12.1 Update user documentation
    - Add Doctor Revenue Sharing Report section to user guide
    - Document date range filtering options
    - Document export functionality
    - Document role-based access control
    - Add screenshots and examples

  - [x] 12.2 Create deployment checklist
    - Verify database indexes are created
    - Verify all tests pass in CI/CD pipeline
    - Verify code review completed
    - Verify security review completed
    - Document rollback plan
    - Configure monitoring and alerts

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and user feedback
- Property tests validate universal correctness properties using fast-check library
- Unit tests validate specific examples and edge cases
- Integration tests validate complete user flows
- The implementation follows a bottom-up approach: database → service → UI → integration
- All currency values use Philippine Peso (₱) formatting
- The 60/40 revenue split is hardcoded but designed for easy configuration in the future
- The feature integrates seamlessly with existing Reports & Analytics section
- Performance optimizations ensure sub-3-second load times for typical date ranges
- Comprehensive error handling ensures graceful degradation when data is missing or incomplete
