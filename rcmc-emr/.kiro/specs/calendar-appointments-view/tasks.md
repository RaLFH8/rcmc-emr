# Implementation Plan: Calendar Appointments View

## Overview

This implementation transforms the Appointments page from a simple timeline view into a dual-view system with a calendar-based weekly grid (Monday-Friday, 9 AM - 6 PM) and the existing patient queue. The implementation preserves all existing functionality (SOAP notes, medical history, patient queue, status management, booking, notifications) while adding new calendar visualization, date navigation, filtering, and CSV export capabilities.

## Implementation Approach

- Build calendar components incrementally alongside existing queue view
- Use React hooks for state management with derived state patterns
- Implement week-scoped data fetching with client-side filtering
- Add property-based tests for universal correctness properties
- Preserve all existing workflows and functionality

## Tasks

- [x] 1. Set up calendar view infrastructure and state management
  - Create CalendarView component with basic structure
  - Add view mode state ('calendar' | 'queue') with role-based defaults
  - Add selectedWeek state for tracking displayed week
  - Implement week range calculation utilities (getWeekStart, getWeekDays)
  - Update Appointments.jsx to conditionally render CalendarView or PatientQueue based on viewMode
  - _Requirements: 1.1, 2.1, 2.5, 2.6_

- [ ]* 1.1 Write property test for view mode toggle behavior
  - **Property 6: View Mode Toggle Behavior**
  - **Validates: Requirements 2.2, 2.3**

- [ ]* 1.2 Write property test for view mode state persistence
  - **Property 7: View Mode State Persistence**
  - **Validates: Requirements 2.4**

- [ ] 2. Implement calendar grid structure and time slot rendering
  - [x] 2.1 Create CalendarGrid component with 5-day column layout
    - Render day columns for Monday through Friday
    - Add day headers with day name and date display
    - Implement responsive grid layout (breakpoints at 1024px, 768px)
    - _Requirements: 1.1, 14.1, 14.2, 14.3_
  
  - [x] 2.2 Create TimeSlotCell component for hourly slots
    - Render 10 time slot rows (09:00 through 18:00)
    - Add time labels column on the left
    - Implement alternating row colors for visual hierarchy
    - Add data attributes for testing (data-day, data-time)
    - _Requirements: 1.2, 18.1, 18.5_
  
  - [ ]* 2.3 Write property test for calendar grid structure
    - **Property 1: Calendar Grid Structure**
    - **Validates: Requirements 1.1, 1.2**

- [ ] 3. Implement appointment positioning and card rendering in calendar
  - [x] 3.1 Create appointment positioning logic
    - Implement getAppointmentsForSlot(day, time) function
    - Map appointments to correct grid cells based on date and time
    - Handle multiple appointments in same slot with vertical stacking
    - _Requirements: 1.3, 1.6_
  
  - [x] 3.2 Adapt AppointmentCard component for calendar view
    - Add viewMode prop to distinguish calendar vs queue rendering
    - Display appointment time in calendar view
    - Maintain patient name, status badge, booking source badge
    - Ensure consistent status color coding
    - _Requirements: 1.4, 1.5, 1.7, 12.1_
  
  - [ ]* 3.3 Write property test for appointment positioning
    - **Property 2: Appointment Positioning**
    - **Validates: Requirements 1.3**
  
  - [ ]* 3.4 Write property test for appointment card content
    - **Property 3: Appointment Card Content**
    - **Validates: Requirements 1.4, 1.5, 12.1**
  
  - [ ]* 3.5 Write property test for multiple appointments stacking
    - **Property 4: Multiple Appointments Stacking**
    - **Validates: Requirements 1.6**
  
  - [ ]* 3.6 Write unit tests for booking source badge rendering
    - Test online bookings show blue badge with globe icon
    - Test walk-in bookings show green badge with user-plus icon
    - _Requirements: 12.2, 12.3, 12.4_

- [ ] 4. Checkpoint - Verify calendar grid renders correctly
  - Ensure calendar displays 5 days × 10 time slots
  - Verify appointments appear in correct cells
  - Test with multiple appointments in same slot
  - Ensure all tests pass, ask the user if questions arise

- [ ] 5. Implement date navigation controls
  - [x] 5.1 Create DateNavigator component
    - Display current week range (e.g., "Jan 6 - Jan 10, 2025")
    - Add Previous Week button (shifts by -7 days)
    - Add Next Week button (shifts by +7 days)
    - Add Today button (returns to current week)
    - Add month selector dropdown
    - _Requirements: 3.1, 3.2, 3.3, 3.6, 3.8_
  
  - [x] 5.2 Implement week navigation logic
    - Create handleWeekChange function to update selectedWeek state
    - Implement getFirstMondayOfMonth for month selector
    - Trigger data fetch when week changes
    - _Requirements: 3.4, 3.5, 3.7_
  
  - [ ]* 5.3 Write property test for week navigation
    - **Property 8: Week Navigation**
    - **Validates: Requirements 3.4, 3.5**
  
  - [ ]* 5.4 Write property test for month selection navigation
    - **Property 9: Month Selection Navigation**
    - **Validates: Requirements 3.7**
  
  - [ ]* 5.5 Write property test for today button navigation
    - **Property 10: Today Button Navigation**
    - **Validates: Requirements 3.8**
  
  - [ ]* 5.6 Write unit tests for date navigation edge cases
    - Test navigation to first week of year
    - Test navigation to last week of year
    - Test month selector with months starting on different days

- [x] 6. Implement filter bar with doctor and status filters
  - [x] 6.1 Create FilterBar component
    - Add view mode toggle (Calendar View / Patient Queue)
    - Integrate DateNavigator (calendar view only)
    - Add doctor filter dropdown (All Doctors + individual doctors)
    - Add status filter dropdown (All Status + individual statuses)
    - Add appointment count display
    - Add Export button (calendar view only)
    - _Requirements: 4.1, 4.2, 5.1, 5.2, 17.1, 17.4_
  
  - [x] 6.2 Implement filter application logic
    - Create filteredAppointments derived state
    - Apply doctor filter to appointments array
    - Apply status filter to appointments array
    - Ensure filters apply to both calendar and queue views
    - Preserve filters when switching views
    - _Requirements: 4.3, 4.4, 4.5, 5.3, 5.5, 5.6_
  
  - [ ]* 6.3 Write property test for status filter application
    - **Property 11: Status Filter Application**
    - **Validates: Requirements 4.3, 4.4**
  
  - [ ]* 6.4 Write property test for doctor filter application
    - **Property 12: Doctor Filter Application**
    - **Validates: Requirements 5.3, 5.5**
  
  - [ ]* 6.5 Write property test for filter persistence across views
    - **Property 13: Filter Persistence Across Views**
    - **Validates: Requirements 4.5, 5.6**
  
  - [ ]* 6.6 Write unit tests for role-based doctor filter defaults
    - Test doctor users auto-filter to their appointments
    - Test staff users see all doctors by default
    - _Requirements: 5.4_

- [x] 7. Implement CSV export functionality
  - [x] 7.1 Create exportService utility
    - Implement exportToCSV function
    - Generate CSV with columns: Date, Time, Patient Name, Doctor Name, Reason, Status, Booking Source
    - Apply current filters to exported data
    - Generate filename with date range pattern
    - Trigger browser download
    - _Requirements: 6.2, 6.3, 6.4, 6.5_
  
  - [x] 7.2 Wire export button to exportService
    - Add onClick handler to Export button
    - Pass filteredAppointments and week range to exportService
    - Handle export errors gracefully with fallback
    - _Requirements: 6.1_
  
  - [ ]* 7.3 Write property test for CSV export data accuracy
    - **Property 14: CSV Export Data Accuracy**
    - **Validates: Requirements 6.2, 6.4**
  
  - [ ]* 7.4 Write property test for CSV export filename format
    - **Property 15: CSV Export Filename Format**
    - **Validates: Requirements 6.5**
  
  - [ ]* 7.5 Write unit tests for export error handling
    - Test export failure shows error notification
    - Test clipboard copy fallback when download fails

- [x] 8. Checkpoint - Verify navigation and filtering work correctly
  - Test week navigation (previous, next, today, month selector)
  - Test doctor filter in both views
  - Test status filter in both views
  - Test filter persistence when switching views
  - Test CSV export with various filter combinations
  - Ensure all tests pass, ask the user if questions arise

- [x] 9. Implement appointment card interactions and modals
  - [x] 9.1 Add click handlers to appointment cards
    - Implement onAppointmentClick handler
    - Display appointment details modal on click
    - Show patient info, doctor info, reason, notes, status
    - Add status change dropdown
    - Add action buttons based on status
    - _Requirements: 7.1, 7.2, 7.3, 7.5, 7.6, 7.7_
  
  - [x] 9.2 Implement status change persistence
    - Update appointment status in database on change
    - Reload calendar data after status update
    - Handle concurrent updates with optimistic UI
    - _Requirements: 7.4_
  
  - [ ]* 9.3 Write property test for appointment card click interaction
    - **Property 16: Appointment Card Click Interaction**
    - **Validates: Requirements 7.1, 7.2**
  
  - [ ]* 9.4 Write property test for status change persistence
    - **Property 17: Status Change Persistence**
    - **Validates: Requirements 7.4**
  
  - [ ]* 9.5 Write property test for status-based action buttons
    - **Property 18: Status-Based Action Buttons**
    - **Validates: Requirements 7.5, 7.6, 7.7**

- [x] 10. Implement current time slot highlighting
  - [x] 10.1 Create time slot highlighting logic
    - Implement isCurrentTimeSlot(day, time) function
    - Check if displayed week includes current date
    - Check if current time is within business hours (09:00-18:00)
    - Apply highlight styling to current time slot
    - _Requirements: 15.1, 15.2, 15.4_
  
  - [x] 10.2 Add automatic highlight updates
    - Use setInterval to update highlight every minute
    - Clean up interval on component unmount
    - _Requirements: 15.3_
  
  - [ ]* 10.3 Write property test for current time slot highlighting
    - **Property 27: Current Time Slot Highlighting**
    - **Validates: Requirements 15.1, 15.2**
  
  - [ ]* 10.4 Write property test for time slot highlight updates
    - **Property 28: Time Slot Highlight Updates**
    - **Validates: Requirements 15.3**
  
  - [ ]* 10.5 Write property test for outside business hours highlighting
    - **Property 29: Outside Business Hours Highlighting**
    - **Validates: Requirements 15.4**

- [x] 11. Implement empty states and error handling
  - [x] 11.1 Create EmptyState component
    - Display message for no appointments in week
    - Display message for no filter matches
    - Add calendar icon and "New Appointment" button
    - _Requirements: 16.1, 16.2, 16.3, 16.4_
  
  - [x] 11.2 Add loading and error states
    - Display loading indicator during data fetch
    - Display error message on fetch failure
    - Add retry button for failed fetches
    - _Requirements: 13.5, 13.6_
  
  - [ ]* 11.3 Write unit tests for empty state handling
    - Test empty state when no appointments exist
    - Test filtered empty state when filters match nothing
    - _Requirements: 16.1, 16.4_

- [x] 12. Implement appointment count display
  - [x] 12.1 Add appointment count calculation
    - Count filteredAppointments array length
    - Display count in FilterBar
    - Update count when filters change
    - Update count when week changes
    - _Requirements: 17.1, 17.2, 17.3_
  
  - [ ]* 12.2 Write property test for appointment count accuracy
    - **Property 30: Appointment Count Accuracy**
    - **Validates: Requirements 17.1, 17.2, 17.3**

- [x] 13. Optimize data fetching and performance
  - [x] 13.1 Implement week-scoped data fetching
    - Modify loadData to accept startDate and endDate parameters
    - Fetch only appointments where appointment_date is within week range
    - Update query to use date range filter
    - _Requirements: 13.1, 13.2, 20.1_
  
  - [x] 13.2 Implement client-side filter application
    - Apply doctor and status filters to loaded data without refetch
    - Use derived state for filteredAppointments
    - _Requirements: 13.3_
  
  - [x] 13.3 Implement parallel data loading
    - Use Promise.all to fetch appointments, patients, doctors concurrently
    - _Requirements: 13.4_
  
  - [x] 13.4 Add data caching optimization
    - Cache patient and doctor data to avoid redundant fetches
    - Only refetch appointments when week changes
    - Prevent refetch on view mode toggle
    - _Requirements: 20.2, 20.5_
  
  - [x] 13.5 Add React component memoization
    - Wrap AppointmentCard with React.memo
    - Wrap CalendarGrid with React.memo
    - Use useMemo for expensive calculations
    - _Requirements: 20.4_
  
  - [ ]* 13.6 Write property test for week-scoped data fetching
    - **Property 22: Week-Scoped Data Fetching**
    - **Validates: Requirements 13.1, 13.2, 20.1**
  
  - [ ]* 13.7 Write property test for client-side filter application
    - **Property 23: Client-Side Filter Application**
    - **Validates: Requirements 13.3**
  
  - [ ]* 13.8 Write property test for parallel data loading
    - **Property 24: Parallel Data Loading**
    - **Validates: Requirements 13.4**
  
  - [ ]* 13.9 Write property test for loading state display
    - **Property 25: Loading State Display**
    - **Validates: Requirements 13.5**
  
  - [ ]* 13.10 Write property test for error state display
    - **Property 26: Error State Display**
    - **Validates: Requirements 13.6**
  
  - [ ]* 13.11 Write property test for data caching optimization
    - **Property 31: Data Caching Optimization**
    - **Validates: Requirements 20.2**
  
  - [ ]* 13.12 Write property test for view switch without refetch
    - **Property 32: View Switch Without Refetch**
    - **Validates: Requirements 20.5**
  
  - [ ]* 13.13 Write property test for component memoization
    - **Property 33: Component Memoization**
    - **Validates: Requirements 20.4**
  
  - [ ]* 13.14 Write unit tests for performance optimization
    - Test no refetch on view mode toggle
    - Test week-scoped fetching date range
    - Test caching prevents redundant queries

- [x] 14. Checkpoint - Verify performance and optimization
  - Test calendar loads within 2 seconds
  - Verify only week-scoped data is fetched
  - Confirm no refetch on view toggle
  - Check component memoization prevents unnecessary re-renders
  - Ensure all tests pass, ask the user if questions arise

- [x] 15. Verify patient queue preservation
  - [x] 15.1 Verify queue view functionality
    - Confirm three columns render (Waiting, In Progress, Completed)
    - Verify appointments group by status correctly
    - Test Start Consultation button for Waiting appointments
    - Test Prescribe and Complete buttons for In Progress appointments
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_
  
  - [ ]* 15.2 Write property test for queue column filtering
    - **Property 19: Queue Column Filtering**
    - **Validates: Requirements 8.2, 8.3, 8.4**
  
  - [ ]* 15.3 Write property test for queue action buttons
    - **Property 20: Queue Action Buttons**
    - **Validates: Requirements 8.6, 8.7**

- [x] 16. Verify SOAP note workflow preservation
  - [x] 16.1 Test SOAP note modal functionality
    - Verify Start Consultation opens SOAP modal
    - Confirm four text areas render (Subjective, Objective, Assessment, Plan)
    - Test pre-population of Subjective with appointment reason
    - Test pre-population of Objective with vital signs
    - Verify Save & Continue persists SOAP data to appointments table
    - Verify Save & Continue updates status to "In Progress"
    - Test View Medical History button
    - Test Prescribe button navigation
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_
  
  - [x] 16.2 Test consultation completion workflow
    - Verify Complete button opens Review & Complete modal
    - Confirm SOAP note summary displays
    - Test consultation record creation with status "pending_billing"
    - Verify appointment status updates to "Completed"
    - Confirm SOAP fields clear from appointments table
    - _Requirements: 9.9, 9.10, 9.11, 9.12, 9.13_
  
  - [ ]* 16.3 Write integration tests for SOAP workflow
    - Test complete workflow from Start Consultation to Complete
    - Verify SOAP data persists correctly
    - Test consultation record creation

- [x] 17. Verify new appointment creation preservation
  - [x] 17.1 Test new appointment modal
    - Verify New Appointment button opens modal
    - Test existing patient selection
    - Test new patient registration flow
    - Confirm required fields (doctor, date, time, reason)
    - Verify patient record creation for new patients
    - Test appointment record creation with booking_source "walk-in"
    - Verify SMS notification sending
    - Confirm calendar data reload after creation
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9_
  
  - [ ]* 17.2 Write integration tests for appointment creation
    - Test complete workflow for new patient appointment
    - Test complete workflow for existing patient appointment
    - Verify appointment appears in calendar after creation

- [x] 18. Verify medical history modal preservation
  - [x] 18.1 Test medical history modal
    - Verify View Medical History button fetches consultation records
    - Confirm consultations display in reverse chronological order
    - Test consultation details display (date, doctor, complaint, diagnosis, prescription, notes)
    - Verify "No previous consultations" message when empty
    - Test Close button
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  
  - [ ]* 18.2 Write unit tests for medical history modal
    - Test modal displays consultation records correctly
    - Test empty state when no consultations exist

- [x] 19. Verify booking source badge display
  - [x] 19.1 Test booking source badges in both views
    - Verify online bookings show blue badge with globe icon
    - Verify walk-in bookings show green badge with user-plus icon
    - Confirm badges visible in calendar view
    - Confirm badges visible in queue view
    - _Requirements: 12.1, 12.2, 12.3, 12.4_
  
  - [ ]* 19.2 Write property test for booking source badge visibility
    - **Property 21: Booking Source Badge Visibility**
    - **Validates: Requirements 12.2, 12.3, 12.4**

- [x] 20. Verify notification integration preservation
  - [x] 20.1 Test appointment notifications
    - Verify SMS notification sent for walk-in appointments
    - Confirm notification includes patient name, date, time, reason, doctor name
    - Test notification failure doesn't block appointment creation
    - Verify sendAppointmentNotifications utility function usage
    - Confirm notifications work in both calendar and queue views
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_
  
  - [ ]* 20.2 Write unit tests for notification integration
    - Test SMS notification sending for walk-in appointments
    - Test graceful failure when SMS sending fails

- [x] 21. Implement responsive calendar layout
  - [x] 21.1 Add responsive breakpoints
    - Implement 3 days per row at viewport < 1024px
    - Implement 1 day per row at viewport < 768px
    - Scale appointment card text appropriately
    - Maintain readability at all viewport sizes
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_
  
  - [ ]* 21.2 Write unit tests for responsive layout
    - Test grid layout at different viewport widths
    - Test appointment card scaling

- [x] 22. Implement calendar grid styling
  - [x] 22.1 Apply visual hierarchy styling
    - Add alternating row colors (white and light gray)
    - Add border lines between days and time slots
    - Style day headers with day name and date
    - Use bold text and distinct background for headers
    - Left-align time slot labels with clear font
    - Apply teal primary color scheme
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6_
  
  - [ ]* 22.2 Write unit tests for calendar styling
    - Test alternating row colors
    - Test day header styling
    - Test time slot label styling

- [x] 23. Final integration testing and verification
  - [x] 23.1 Test complete user workflows
    - Test staff member viewing calendar and creating appointment
    - Test doctor viewing queue and completing consultation
    - Test filtering and exporting calendar data
    - Test week navigation and date selection
    - Test view mode switching with filter persistence
  
  - [x] 23.2 Verify all existing functionality preserved
    - Confirm SOAP notes work identically
    - Confirm patient queue works identically
    - Confirm medical history works identically
    - Confirm appointment creation works identically
    - Confirm notifications work identically
  
  - [x] 23.3 Run full test suite
    - Execute all unit tests
    - Execute all property-based tests (100 iterations each)
    - Execute all integration tests
    - Verify 80% code coverage minimum
    - Ensure all 33 correctness properties pass

- [x] 24. Final checkpoint - Complete feature verification
  - Verify calendar view displays correctly with all features
  - Verify patient queue view unchanged and fully functional
  - Verify all filters work in both views
  - Verify date navigation works correctly
  - Verify CSV export works correctly
  - Verify all existing functionality preserved
  - Verify performance meets requirements (< 2 second load)
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (33 total)
- Unit tests validate specific examples and edge cases
- Integration tests verify complete workflows
- All existing functionality must remain unchanged
- No database schema changes required
- Frontend runs on port 3002, backend API on port 3003
- All data from database (no hardcoded values)
- High fidelity design matching reference calendar image
