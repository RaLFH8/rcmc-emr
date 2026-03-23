# Requirements Document

## Introduction

This document specifies the requirements for redesigning the RCMC EMR Dashboard to match a specific reference design pixel-by-pixel. The redesign focuses on creating a clean, modern interface with proper layout structure, spacing, and visual hierarchy while ensuring all data is dynamically loaded from the database with no hardcoded values.

## Glossary

- **Dashboard**: The main landing page of the RCMC EMR system that displays key metrics, statistics, and patient information
- **Stat_Card**: A component displaying a single metric with an icon, value, and trend indicator
- **Patient_Statistics_Chart**: An area chart showing patient growth over time with comparison data
- **Appointment_List**: A sidebar component showing a calendar and today's scheduled appointments
- **Recent_Patients_Table**: A table displaying the most recently registered or updated patients
- **Database**: The Supabase PostgreSQL database that stores all application data
- **Reference_Design**: The target visual design that the dashboard must match exactly
- **Responsive_Layout**: A layout that adapts to different screen sizes while maintaining visual integrity

## Requirements

### Requirement 1: Header Section Layout

**User Story:** As a user, I want to see a welcoming header with my name, last updated timestamp, and export functionality, so that I can quickly understand the dashboard status and export data when needed.

#### Acceptance Criteria

1. THE Dashboard SHALL display a welcome message with the user's name and role
2. THE Dashboard SHALL display a subtitle describing the current status
3. THE Dashboard SHALL display a "Last updated" timestamp with the current date
4. THE Dashboard SHALL display a refresh button next to the timestamp
5. THE Dashboard SHALL display an "Export CSV" button with a download icon
6. THE Header_Section SHALL use proper spacing and alignment matching the Reference_Design

### Requirement 2: Stat Cards Grid Layout

**User Story:** As a user, I want to see four key metrics in a horizontal row at the top of the dashboard, so that I can quickly assess the clinic's current status.

#### Acceptance Criteria

1. THE Dashboard SHALL display exactly four Stat_Cards in a horizontal grid layout
2. THE Stat_Cards SHALL be arranged in the order: Total Patient, Total Doctor, Book Appointment, Room Availability
3. WHEN the viewport is desktop size, THE Dashboard SHALL display all four Stat_Cards in a single row (grid-cols-4)
4. THE Stat_Card SHALL display an icon with a gradient background
5. THE Stat_Card SHALL display a numeric value loaded from the Database
6. THE Stat_Card SHALL display a percentage trend indicator
7. THE Stat_Card SHALL use proper spacing between cards matching the Reference_Design
8. THE Total_Patient_Card SHALL use a teal gradient background for the icon
9. THE Total_Doctor_Card SHALL use a purple gradient background for the icon
10. THE Book_Appointment_Card SHALL use a teal gradient background for the icon
11. THE Room_Availability_Card SHALL use a pink gradient background for the icon

### Requirement 3: Two-Column Layout Below Stat Cards

**User Story:** As a user, I want to see patient statistics and appointment information side by side, so that I can monitor both metrics and schedules simultaneously.

#### Acceptance Criteria

1. THE Dashboard SHALL display a two-column layout below the Stat_Cards
2. THE Left_Column SHALL occupy two-thirds of the width (col-span-2)
3. THE Right_Column SHALL occupy one-third of the width (col-span-1)
4. THE Left_Column SHALL contain the Patient_Statistics_Chart
5. THE Right_Column SHALL contain the Appointment_List
6. WHEN the viewport is mobile size, THE Dashboard SHALL stack the columns vertically

### Requirement 4: Patient Statistics Chart

**User Story:** As a user, I want to see a visual chart of patient growth over time, so that I can track clinic performance trends.

#### Acceptance Criteria

1. THE Patient_Statistics_Chart SHALL display a title "Patient Statistics"
2. THE Patient_Statistics_Chart SHALL display a dropdown selector with options: Daily, Weekly, Monthly
3. THE Patient_Statistics_Chart SHALL display the total patient count for the selected period
4. THE Patient_Statistics_Chart SHALL display a trend indicator showing growth since last period
5. THE Patient_Statistics_Chart SHALL render an area chart with gradient fill
6. THE Patient_Statistics_Chart SHALL display a solid line for current period data
7. THE Patient_Statistics_Chart SHALL display a dashed line for comparison period data
8. THE Patient_Statistics_Chart SHALL load all data from the Database
9. THE Patient_Statistics_Chart SHALL display proper axis labels and grid lines
10. THE Patient_Statistics_Chart SHALL use teal color (#14b8a6) for the main line and fill

### Requirement 5: Appointment List with Calendar

**User Story:** As a user, I want to see a calendar and today's appointments in the sidebar, so that I can quickly check the schedule.

#### Acceptance Criteria

1. THE Appointment_List SHALL display a title "Appointment List"
2. THE Appointment_List SHALL display a refresh button
3. THE Appointment_List SHALL display a calendar showing the current month
4. THE Appointment_List SHALL display month navigation buttons (previous/next)
5. THE Appointment_List SHALL highlight the selected date
6. WHEN a user clicks a date, THE Appointment_List SHALL update the selected date
7. THE Appointment_List SHALL display a "Schedule" section below the calendar
8. THE Appointment_List SHALL display up to 4 appointments for the selected date
9. THE Appointment_List SHALL load appointment data from the Database
10. WHEN no appointments exist for the selected date, THE Appointment_List SHALL display an empty state message
11. THE Appointment_List SHALL display doctor avatar, name, patient name, time, and status for each appointment
12. THE Appointment_List SHALL use color-coded status badges (green for Completed, blue for In Progress, yellow for Scheduled)

### Requirement 6: Recent Patients Table

**User Story:** As a user, I want to see a table of recent patients at the bottom of the dashboard, so that I can quickly access patient information.

#### Acceptance Criteria

1. THE Recent_Patients_Table SHALL display a title "Recent Patients"
2. THE Recent_Patients_Table SHALL display a subtitle describing the table content
3. THE Recent_Patients_Table SHALL display a search input field with a search icon
4. THE Recent_Patients_Table SHALL display a filter button
5. THE Recent_Patients_Table SHALL display columns: No, Item (Name), Gender, Date of Birth, Location, Contact
6. THE Recent_Patients_Table SHALL load all patient data from the Database
7. THE Recent_Patients_Table SHALL display at least 4 recent patients
8. THE Recent_Patients_Table SHALL format dates in "MMM DD, YYYY" format
9. THE Recent_Patients_Table SHALL truncate long location addresses with ellipsis
10. THE Recent_Patients_Table SHALL display a location pin icon next to addresses
11. THE Recent_Patients_Table SHALL use hover effects on table rows

### Requirement 7: No Hardcoded Data

**User Story:** As a developer, I want all dashboard data to come from the database, so that the dashboard reflects real-time clinic information.

#### Acceptance Criteria

1. THE Dashboard SHALL NOT contain any hardcoded patient data
2. THE Dashboard SHALL NOT contain any hardcoded doctor data
3. THE Dashboard SHALL NOT contain any hardcoded appointment data
4. THE Dashboard SHALL NOT contain any hardcoded statistics or metrics
5. THE Dashboard SHALL load all stat card values from the Database
6. THE Dashboard SHALL load all chart data from the Database
7. THE Dashboard SHALL load all appointment data from the Database
8. THE Dashboard SHALL load all patient data from the Database
9. WHEN the Database is empty, THE Dashboard SHALL display appropriate empty state messages
10. WHEN data fails to load, THE Dashboard SHALL display error messages

### Requirement 8: Responsive Design

**User Story:** As a user, I want the dashboard to work on all screen sizes, so that I can access it from any device.

#### Acceptance Criteria

1. WHEN the viewport width is greater than 1024px, THE Dashboard SHALL display the desktop layout
2. WHEN the viewport width is between 768px and 1024px, THE Dashboard SHALL display the tablet layout
3. WHEN the viewport width is less than 768px, THE Dashboard SHALL display the mobile layout
4. THE Stat_Cards SHALL stack vertically on mobile devices
5. THE Two_Column_Layout SHALL stack vertically on mobile devices
6. THE Recent_Patients_Table SHALL be horizontally scrollable on mobile devices
7. THE Dashboard SHALL maintain proper spacing and padding on all screen sizes

### Requirement 9: Visual Design Consistency

**User Story:** As a user, I want the dashboard to match the reference design exactly, so that I have a consistent and professional user experience.

#### Acceptance Criteria

1. THE Dashboard SHALL use the exact color scheme from the Reference_Design
2. THE Dashboard SHALL use the exact spacing and padding from the Reference_Design
3. THE Dashboard SHALL use the exact typography (font sizes, weights) from the Reference_Design
4. THE Dashboard SHALL use the exact border radius values from the Reference_Design
5. THE Dashboard SHALL use the exact shadow styles from the Reference_Design
6. THE Stat_Cards SHALL match the Reference_Design icon sizes and positioning
7. THE Patient_Statistics_Chart SHALL match the Reference_Design chart styling
8. THE Appointment_List SHALL match the Reference_Design calendar styling
9. THE Recent_Patients_Table SHALL match the Reference_Design table styling

### Requirement 10: Loading States

**User Story:** As a user, I want to see loading indicators while data is being fetched, so that I know the system is working.

#### Acceptance Criteria

1. WHEN the Dashboard is loading data, THE Dashboard SHALL display a loading indicator
2. THE Loading_Indicator SHALL use the HeartbeatLoader component
3. THE Loading_Indicator SHALL display a message "Loading dashboard..."
4. WHEN data loading is complete, THE Dashboard SHALL hide the loading indicator
5. THE Dashboard SHALL display all loaded data immediately after loading completes
