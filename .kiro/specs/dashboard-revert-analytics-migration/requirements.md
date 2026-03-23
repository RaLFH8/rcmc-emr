# Requirements Document

## Introduction

This feature involves reverting the Dashboard page to its original implementation and migrating the advanced analytics dashboard functionality to the Reports module. The original Dashboard provides a comprehensive overview with stat cards, patient statistics, appointment lists, sales overview (admin only), and doctor performance metrics. The advanced analytics dashboard features KPI cards, interactive charts, date range filtering, and export capabilities that should be integrated into the Reports module alongside existing tab-based reports.

## Glossary

- **Dashboard**: The main landing page showing overview statistics, patient charts, appointments, and sales data
- **Reports_Module**: The reporting section with tab-based reports (Financial, Patients, Appointments, Inventory)
- **Analytics_Dashboard**: The advanced analytics interface with KPI cards, interactive charts, and export functionality
- **Backup_Dashboard**: The original Dashboard.jsx file stored in the backup directory
- **KPI_Card**: Key Performance Indicator display component showing metrics with trends
- **Chart_Component**: Interactive visualization components (Patient Distribution, Revenue Trend, Expense Breakdown, Performance Comparison)
- **Date_Range_Filter**: Component allowing users to select start and end dates for data filtering
- **Export_Service**: Service handling data export to PDF, Excel, and CSV formats
- **Tab_Based_Report**: Existing report interface with tabs for different report categories

## Requirements

### Requirement 1: Restore Original Dashboard

**User Story:** As a user, I want the Dashboard to show the original overview interface, so that I can see stat cards, patient statistics, appointment calendar, and sales overview in the familiar layout.

#### Acceptance Criteria

1. THE Dashboard SHALL display four stat cards (Total Patient, Total Doctor, Book Appointment, Room Availability)
2. THE Dashboard SHALL display a patient statistics chart with daily/weekly/monthly view options
3. THE Dashboard SHALL display an appointment list with calendar navigation
4. WHERE the user is an admin, THE Dashboard SHALL display sales overview section with revenue KPIs
5. WHERE the user is an admin, THE Dashboard SHALL display revenue trend charts and top services/medicines
6. THE Dashboard SHALL display doctor performance metrics with patient counts
7. THE Dashboard SHALL display a recent patients table
8. THE Dashboard SHALL load all data from the database using existing db service methods

### Requirement 2: Migrate Analytics to Reports Module

**User Story:** As a user, I want to access advanced analytics from the Reports module, so that I can view comprehensive metrics alongside existing reports.

#### Acceptance Criteria

1. THE Reports_Module SHALL include a new "Analytics" tab alongside existing tabs
2. WHEN the Analytics tab is selected, THE Reports_Module SHALL display the advanced analytics dashboard
3. THE Analytics_Dashboard SHALL display four KPI cards (Total Patients, Bed Occupancy, Patient Satisfaction, Total Revenue)
4. THE Analytics_Dashboard SHALL display patient distribution chart by department
5. THE Analytics_Dashboard SHALL display revenue trend chart with monthly data
6. THE Analytics_Dashboard SHALL display expense breakdown chart
7. THE Analytics_Dashboard SHALL display performance comparison chart
8. THE Analytics_Dashboard SHALL maintain all existing chart interactivity and tooltips

### Requirement 3: Preserve Date Range Filtering

**User Story:** As a user, I want to filter analytics data by date range, so that I can analyze specific time periods.

#### Acceptance Criteria

1. THE Analytics_Dashboard SHALL display a date range filter component
2. WHEN a user selects a start date and end date, THE Analytics_Dashboard SHALL update all metrics and charts
3. THE Date_Range_Filter SHALL provide preset options (Last 7 Days, Last 30 Days, Last 3 Months, Last 6 Months, Last Year)
4. THE Date_Range_Filter SHALL allow custom date selection
5. THE Analytics_Dashboard SHALL persist the selected date range in session storage
6. WHEN the Analytics tab is reopened, THE Analytics_Dashboard SHALL restore the previously selected date range

### Requirement 4: Preserve Export Functionality

**User Story:** As a user, I want to export analytics data, so that I can share reports or perform offline analysis.

#### Acceptance Criteria

1. THE Analytics_Dashboard SHALL display an Export button
2. WHEN the Export button is clicked, THE Analytics_Dashboard SHALL display a modal with format options
3. THE Export_Modal SHALL offer three format options: PDF, Excel (XLSX), and CSV
4. WHEN a format is selected, THE Export_Service SHALL generate the export file with current date range data
5. THE Export_Service SHALL include all KPI metrics in the export
6. THE Export_Service SHALL include all chart data in the export
7. WHEN export is complete, THE Export_Service SHALL trigger a file download
8. IF export fails, THEN THE Analytics_Dashboard SHALL display an error message

### Requirement 5: Preserve Real-Time Updates

**User Story:** As a user, I want analytics data to refresh automatically, so that I see current information without manual intervention.

#### Acceptance Criteria

1. THE Analytics_Dashboard SHALL automatically refresh data every 5 minutes
2. THE Analytics_Dashboard SHALL display a "Last updated" timestamp
3. THE Analytics_Dashboard SHALL provide a manual Refresh button
4. WHEN the Refresh button is clicked, THE Analytics_Dashboard SHALL reload all metrics and charts
5. WHILE data is loading, THE Analytics_Dashboard SHALL display loading indicators
6. IF data loading fails, THEN THE Analytics_Dashboard SHALL display the previous data with an error banner

### Requirement 6: Maintain Existing Reports Functionality

**User Story:** As a user, I want existing reports to continue working, so that I can access financial, patient, appointment, and inventory reports.

#### Acceptance Criteria

1. THE Reports_Module SHALL preserve all existing tabs (Financial, Patients, Appointments, Inventory)
2. THE Reports_Module SHALL preserve all existing report data loading logic
3. THE Reports_Module SHALL preserve all existing CSV export functionality for tab-based reports
4. THE Reports_Module SHALL preserve all existing date range filtering for tab-based reports
5. WHEN switching between tabs, THE Reports_Module SHALL load the appropriate report data
6. THE Reports_Module SHALL maintain responsive design for all screen sizes

### Requirement 7: Preserve Analytics Components

**User Story:** As a developer, I want to reuse existing analytics components, so that the migration maintains consistency and reduces code duplication.

#### Acceptance Criteria

1. THE Analytics_Dashboard SHALL use the existing KPICard component
2. THE Analytics_Dashboard SHALL use the existing PatientDistributionChart component
3. THE Analytics_Dashboard SHALL use the existing RevenueTrendChart component
4. THE Analytics_Dashboard SHALL use the existing ExpenseBreakdownChart component
5. THE Analytics_Dashboard SHALL use the existing PerformanceComparisonChart component
6. THE Analytics_Dashboard SHALL use the existing DateRangeFilter component
7. THE Analytics_Dashboard SHALL use the existing useAnalytics hook
8. THE Analytics_Dashboard SHALL use the existing exportService

### Requirement 8: File Management

**User Story:** As a developer, I want proper file management during the migration, so that the codebase remains clean and maintainable.

#### Acceptance Criteria

1. THE Dashboard.jsx SHALL be replaced with the backup version from backups/pre-security-update-2026-02-26-092920/rcmc-emr/src/pages/Dashboard.jsx
2. THE Reports.jsx SHALL be updated to include the Analytics tab and dashboard
3. THE System SHALL preserve all existing analytics component files in src/components/analytics/
4. THE System SHALL preserve all existing analytics service files (analyticsService.js, exportService.js)
5. THE System SHALL preserve all existing analytics utility files (metricCalculations.js, configurationParser.js)
6. THE System SHALL preserve the useAnalytics hook in src/hooks/
7. THE System SHALL not delete any analytics-related files
8. THE System SHALL maintain all import paths for analytics components in the Reports module

### Requirement 9: Responsive Design

**User Story:** As a user, I want both Dashboard and Reports to work on all devices, so that I can access them from desktop, tablet, or mobile.

#### Acceptance Criteria

1. THE Dashboard SHALL display responsively on mobile (320px+), tablet (768px+), and desktop (1024px+) screens
2. THE Analytics_Dashboard SHALL display responsively on mobile, tablet, and desktop screens
3. WHEN viewed on mobile, THE Dashboard SHALL stack stat cards vertically
4. WHEN viewed on mobile, THE Analytics_Dashboard SHALL stack KPI cards vertically
5. WHEN viewed on mobile, THE Charts SHALL scale appropriately and remain interactive
6. THE Reports_Module tab navigation SHALL adapt to mobile screens with horizontal scrolling if needed

### Requirement 10: Error Handling

**User Story:** As a user, I want clear error messages when data fails to load, so that I understand what went wrong and can take action.

#### Acceptance Criteria

1. IF Dashboard data loading fails, THEN THE Dashboard SHALL display an error message with retry option
2. IF Analytics data loading fails, THEN THE Analytics_Dashboard SHALL display an error message with retry option
3. IF export fails, THEN THE Export_Modal SHALL display an error message
4. IF date range is invalid, THEN THE Date_Range_Filter SHALL display a validation error
5. THE Error_Messages SHALL be user-friendly and actionable
6. THE System SHALL log detailed error information to the console for debugging

### Requirement 11: Performance

**User Story:** As a user, I want pages to load quickly, so that I can access information without delays.

#### Acceptance Criteria

1. THE Dashboard SHALL load initial data within 2 seconds on standard network conditions
2. THE Analytics_Dashboard SHALL load initial data within 2 seconds on standard network conditions
3. THE Dashboard SHALL use loading indicators during data fetching
4. THE Analytics_Dashboard SHALL use loading indicators during data fetching
5. THE System SHALL cache analytics data for 5 minutes to reduce database queries
6. THE Charts SHALL render smoothly without blocking the UI thread

### Requirement 12: Data Consistency

**User Story:** As a user, I want consistent data across Dashboard and Reports, so that I can trust the information displayed.

#### Acceptance Criteria

1. THE Dashboard SHALL use the same database queries as the Analytics_Dashboard for overlapping metrics
2. THE Dashboard revenue data SHALL match the Analytics_Dashboard revenue data for the same time period
3. THE Dashboard patient count SHALL match the Analytics_Dashboard patient count for the same time period
4. THE System SHALL use consistent date formatting across Dashboard and Reports
5. THE System SHALL use consistent currency formatting (Philippine Peso) across Dashboard and Reports
6. THE System SHALL use consistent number formatting across Dashboard and Reports
