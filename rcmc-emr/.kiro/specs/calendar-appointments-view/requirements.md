# Requirements Document

## Introduction

This feature transforms the Appointments page from a simple list/timeline view to a sophisticated calendar-based weekly view with integrated patient queue functionality. The new interface will display appointments in a week grid format (Monday-Friday, 9 AM - 6 PM) while preserving all existing functionality including SOAP notes, patient queue management, status tracking, and appointment creation.

## Glossary

- **Calendar_View**: The weekly grid interface displaying appointments organized by day and time slot
- **Patient_Queue**: The kanban-style board showing appointments grouped by status (Waiting/In Progress/Completed)
- **Appointment_Card**: A visual component displaying patient name, appointment type, status badge, and booking source
- **Time_Slot**: A specific time period in the calendar grid (e.g., 9:00 AM, 10:00 AM)
- **SOAP_Note**: Subjective, Objective, Assessment, Plan medical documentation format
- **Booking_Source**: Origin of appointment (Online or Walk-in)
- **Status_Badge**: Visual indicator of appointment status (Scheduled/Confirmed/In Progress/Completed/Cancelled/No Show)
- **View_Toggle**: UI control to switch between Calendar View and Patient Queue
- **Date_Navigator**: Controls for moving between weeks and selecting months
- **Medical_History**: Patient's previous consultation records
- **Consultation_Workflow**: The process from appointment start through SOAP note creation to completion

## Requirements

### Requirement 1: Calendar Weekly View Display

**User Story:** As a clinic staff member, I want to view appointments in a weekly calendar grid, so that I can visualize the schedule across multiple days at once.

#### Acceptance Criteria

1. THE Calendar_View SHALL display a grid with days as columns (Monday through Friday)
2. THE Calendar_View SHALL display time slots as rows (9 AM through 6 PM in 1-hour increments)
3. WHEN an appointment exists for a specific day and time, THE Calendar_View SHALL display an Appointment_Card in the corresponding grid cell
4. THE Appointment_Card SHALL display patient name, appointment type, and Status_Badge
5. THE Appointment_Card SHALL display the Booking_Source badge (Online or Walk-in)
6. WHEN multiple appointments exist in the same time slot, THE Calendar_View SHALL stack them vertically within the cell
7. THE Calendar_View SHALL use color coding consistent with existing status colors (blue for Scheduled, green for Confirmed, yellow for In Progress, teal for Completed, red for Cancelled, gray for No Show)

### Requirement 2: View Mode Toggle

**User Story:** As a clinic staff member, I want to toggle between calendar view and patient queue view, so that I can choose the most appropriate visualization for my current task.

#### Acceptance Criteria

1. THE View_Toggle SHALL provide two options: "Calendar View" and "Patient Queue"
2. WHEN the user selects "Calendar View", THE System SHALL display the weekly calendar grid
3. WHEN the user selects "Patient Queue", THE System SHALL display the kanban board with Waiting/In Progress/Completed columns
4. THE System SHALL preserve the selected view mode in component state during the session
5. WHEN a doctor user logs in, THE System SHALL default to "Patient Queue" view
6. WHEN a non-doctor user logs in, THE System SHALL default to "Calendar View"

### Requirement 3: Date Navigation Controls

**User Story:** As a clinic staff member, I want to navigate between weeks and months, so that I can view appointments for different time periods.

#### Acceptance Criteria

1. THE Date_Navigator SHALL display the current week range (e.g., "Jan 6 - Jan 10, 2025")
2. THE Date_Navigator SHALL provide a "Previous Week" button
3. THE Date_Navigator SHALL provide a "Next Week" button
4. WHEN the user clicks "Previous Week", THE Calendar_View SHALL display appointments for the previous week
5. WHEN the user clicks "Next Week", THE Calendar_View SHALL display appointments for the next week
6. THE Date_Navigator SHALL provide a month selector dropdown
7. WHEN the user selects a month, THE Calendar_View SHALL display the first week of that month
8. THE Date_Navigator SHALL provide a "Today" button that returns to the current week

### Requirement 4: Status Filter Integration

**User Story:** As a clinic staff member, I want to filter appointments by status in calendar view, so that I can focus on specific appointment types.

#### Acceptance Criteria

1. THE Calendar_View SHALL display a status filter dropdown
2. THE status filter SHALL include options: All Status, Scheduled, Confirmed, In Progress, Completed, Cancelled, No Show
3. WHEN the user selects a status filter, THE Calendar_View SHALL display only appointments matching that status
4. THE status filter SHALL apply to both Calendar_View and Patient_Queue
5. THE System SHALL preserve the selected filter when switching between view modes

### Requirement 5: Doctor Filter Integration

**User Story:** As a clinic staff member, I want to filter appointments by doctor in calendar view, so that I can view a specific doctor's schedule.

#### Acceptance Criteria

1. THE Calendar_View SHALL display a doctor filter dropdown
2. THE doctor filter SHALL include "All Doctors" option and individual doctor options
3. WHEN the user selects a doctor filter, THE Calendar_View SHALL display only appointments for that doctor
4. WHEN a doctor user logs in, THE System SHALL automatically filter to show only their appointments
5. THE doctor filter SHALL apply to both Calendar_View and Patient_Queue
6. THE System SHALL preserve the selected filter when switching between view modes

### Requirement 6: Export Functionality

**User Story:** As a clinic administrator, I want to export the calendar view data, so that I can generate reports or share schedules externally.

#### Acceptance Criteria

1. THE Calendar_View SHALL display an "Export" button
2. WHEN the user clicks "Export", THE System SHALL generate a CSV file containing appointment data for the displayed week
3. THE exported CSV SHALL include columns: Date, Time, Patient Name, Doctor Name, Reason, Status, Booking Source
4. THE exported CSV SHALL respect active filters (doctor filter and status filter)
5. THE exported CSV filename SHALL include the date range (e.g., "appointments_2025-01-06_to_2025-01-10.csv")

### Requirement 7: Appointment Card Interactions

**User Story:** As a clinic staff member, I want to interact with appointment cards in the calendar view, so that I can manage appointments efficiently.

#### Acceptance Criteria

1. WHEN the user clicks an Appointment_Card, THE System SHALL display appointment details in a modal
2. THE appointment details modal SHALL display patient information, doctor information, reason, notes, and current status
3. THE appointment details modal SHALL provide a status change dropdown
4. WHEN the user changes the status, THE System SHALL update the appointment in the database
5. THE appointment details modal SHALL provide action buttons based on status (Start Consultation, Complete, View History)
6. WHEN the appointment status is "Scheduled" or "Confirmed", THE modal SHALL display "Start Consultation" button
7. WHEN the appointment status is "In Progress", THE modal SHALL display "Prescribe" and "Complete" buttons

### Requirement 8: Patient Queue Preservation

**User Story:** As a doctor, I want the patient queue view to remain unchanged, so that my existing workflow is not disrupted.

#### Acceptance Criteria

1. THE Patient_Queue SHALL display three columns: Waiting, In Progress, Completed
2. THE Waiting column SHALL display appointments with status "Scheduled" or "Confirmed"
3. THE In Progress column SHALL display appointments with status "In Progress"
4. THE Completed column SHALL display appointments with status "Completed"
5. THE Patient_Queue SHALL display the same Appointment_Card format as the current implementation
6. THE Patient_Queue SHALL provide "Start Consultation" button for Waiting appointments
7. THE Patient_Queue SHALL provide "Prescribe" and "Complete" buttons for In Progress appointments
8. THE Patient_Queue SHALL preserve all existing functionality including SOAP notes, medical history, and consultation workflow

### Requirement 9: SOAP Note Workflow Preservation

**User Story:** As a doctor, I want the SOAP note workflow to remain unchanged, so that I can continue documenting consultations in the same manner.

#### Acceptance Criteria

1. WHEN the user clicks "Start Consultation", THE System SHALL display the SOAP Note modal
2. THE SOAP Note modal SHALL display four text areas: Subjective, Objective, Assessment, Plan
3. THE SOAP Note modal SHALL pre-populate Subjective with appointment reason
4. THE SOAP Note modal SHALL pre-populate Objective with patient vital signs if available
5. WHEN the user clicks "Save & Continue", THE System SHALL persist SOAP data to the appointments table
6. WHEN the user clicks "Save & Continue", THE System SHALL update appointment status to "In Progress"
7. THE SOAP Note modal SHALL provide a "View Medical History" button
8. THE SOAP Note modal SHALL provide a "Prescribe" button that navigates to the Prescriptions page
9. WHEN the user clicks "Complete", THE System SHALL display the Review & Complete modal
10. THE Review & Complete modal SHALL display the SOAP note summary
11. WHEN the user confirms completion, THE System SHALL create a consultation record with status "pending_billing"
12. WHEN the user confirms completion, THE System SHALL update appointment status to "Completed"
13. WHEN the user confirms completion, THE System SHALL clear SOAP fields from the appointments table

### Requirement 10: New Appointment Creation Preservation

**User Story:** As a clinic staff member, I want to create new appointments using the existing modal, so that the appointment booking process remains consistent.

#### Acceptance Criteria

1. THE Calendar_View SHALL display a "New Appointment" button
2. WHEN the user clicks "New Appointment", THE System SHALL display the appointment creation modal
3. THE appointment creation modal SHALL provide options to select existing patient or add new patient
4. WHEN adding a new patient, THE modal SHALL display patient registration fields (first name, last name, date of birth, gender, contact number, email, address)
5. THE appointment creation modal SHALL require doctor selection, date, time, and reason for visit
6. WHEN the user submits the form, THE System SHALL create the patient record if new patient option was selected
7. WHEN the user submits the form, THE System SHALL create the appointment record with booking_source set to "walk-in"
8. WHEN the user submits the form, THE System SHALL send SMS notification if patient has contact number
9. WHEN the appointment is created, THE System SHALL reload the calendar data

### Requirement 11: Medical History Modal Preservation

**User Story:** As a doctor, I want to view patient medical history during consultations, so that I can make informed clinical decisions.

#### Acceptance Criteria

1. WHEN the user clicks "View Medical History" in the SOAP Note modal, THE System SHALL fetch patient consultation records
2. THE Medical History modal SHALL display all previous consultations in reverse chronological order
3. FOR EACH consultation, THE modal SHALL display consultation date, doctor name, chief complaint, diagnosis, prescription, and notes
4. WHEN no previous consultations exist, THE modal SHALL display "No previous consultations" message
5. THE Medical History modal SHALL provide a "Close" button

### Requirement 12: Booking Source Badge Display

**User Story:** As a clinic staff member, I want to see the booking source for each appointment, so that I can distinguish between online and walk-in appointments.

#### Acceptance Criteria

1. THE Appointment_Card SHALL display a Booking_Source badge
2. WHEN booking_source is "online", THE badge SHALL display "Online" with a globe icon and blue styling
3. WHEN booking_source is "walk-in" or null, THE badge SHALL display "Walk-in" with a user-plus icon and green styling
4. THE Booking_Source badge SHALL be visible in both Calendar_View and Patient_Queue

### Requirement 13: Real-time Data Loading

**User Story:** As a clinic staff member, I want appointment data to load from the database, so that I always see current information.

#### Acceptance Criteria

1. WHEN the Calendar_View loads, THE System SHALL fetch appointments from the database for the displayed week
2. WHEN the user navigates to a different week, THE System SHALL fetch appointments for that week
3. WHEN the user changes filters, THE System SHALL apply filters to the loaded appointment data
4. THE System SHALL fetch patient data, doctor data, and appointment data in parallel for performance
5. WHILE data is loading, THE System SHALL display a loading indicator
6. WHEN data loading fails, THE System SHALL display an error message

### Requirement 14: Responsive Calendar Layout

**User Story:** As a clinic staff member, I want the calendar view to be readable on different screen sizes, so that I can use it on various devices.

#### Acceptance Criteria

1. THE Calendar_View SHALL use a responsive grid layout
2. WHEN the viewport width is less than 1024px, THE Calendar_View SHALL display 3 days per row
3. WHEN the viewport width is less than 768px, THE Calendar_View SHALL display 1 day per row
4. THE Appointment_Card SHALL scale text size appropriately for the container width
5. THE Calendar_View SHALL maintain readability at all supported viewport sizes

### Requirement 15: Time Slot Highlighting

**User Story:** As a clinic staff member, I want to see the current time slot highlighted, so that I can quickly identify the present moment in the schedule.

#### Acceptance Criteria

1. WHEN the displayed week includes the current date, THE Calendar_View SHALL highlight the current time slot
2. THE current time slot SHALL have a distinct background color (light yellow or light blue)
3. THE current time slot highlight SHALL update automatically every minute
4. WHEN the current time is outside business hours (before 9 AM or after 6 PM), THE System SHALL not highlight any time slot

### Requirement 16: Empty State Handling

**User Story:** As a clinic staff member, I want to see helpful messages when no appointments exist, so that I understand the calendar state.

#### Acceptance Criteria

1. WHEN no appointments exist for the displayed week, THE Calendar_View SHALL display an empty state message
2. THE empty state message SHALL include a calendar icon and text "No appointments scheduled for this week"
3. THE empty state message SHALL include a "New Appointment" button
4. WHEN filters result in no matching appointments, THE Calendar_View SHALL display "No appointments match the selected filters"

### Requirement 17: Appointment Count Display

**User Story:** As a clinic staff member, I want to see the total number of appointments, so that I can quickly assess workload.

#### Acceptance Criteria

1. THE Calendar_View SHALL display the total count of appointments for the displayed week
2. THE appointment count SHALL respect active filters
3. THE appointment count SHALL update when filters change or when navigating to different weeks
4. THE appointment count SHALL be displayed near the filter controls with format "X appointments"

### Requirement 18: Calendar Grid Styling

**User Story:** As a clinic staff member, I want the calendar to have clear visual hierarchy, so that I can quickly scan the schedule.

#### Acceptance Criteria

1. THE Calendar_View SHALL use alternating row colors for time slots (white and light gray)
2. THE Calendar_View SHALL use border lines to separate days and time slots
3. THE day headers SHALL display day name and date (e.g., "Monday, Jan 6")
4. THE day headers SHALL use bold text and a distinct background color
5. THE time slot labels SHALL be left-aligned and use a monospace or clear sans-serif font
6. THE Calendar_View SHALL use the same color scheme as the existing application (teal primary color)

### Requirement 19: Notification Integration Preservation

**User Story:** As a clinic staff member, I want appointment notifications to continue working, so that patients receive SMS confirmations.

#### Acceptance Criteria

1. WHEN a walk-in appointment is created, THE System SHALL send SMS notification to the patient
2. THE SMS notification SHALL include patient name, appointment date, appointment time, reason, and doctor name
3. WHEN SMS sending fails, THE System SHALL log a warning but not block appointment creation
4. THE System SHALL use the existing sendAppointmentNotifications utility function
5. THE notification functionality SHALL work identically in both Calendar_View and Patient_Queue

### Requirement 20: Performance Optimization

**User Story:** As a clinic staff member, I want the calendar to load quickly, so that I can access appointment information without delay.

#### Acceptance Criteria

1. THE System SHALL fetch only appointments within the displayed week date range
2. THE System SHALL cache patient and doctor data to avoid redundant database queries
3. THE Calendar_View SHALL render within 2 seconds on a standard broadband connection
4. THE System SHALL use React component memoization to prevent unnecessary re-renders
5. WHEN switching between Calendar_View and Patient_Queue, THE System SHALL not refetch data
