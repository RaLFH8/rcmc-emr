# Requirements Document

## Introduction

This document defines the requirements for a Doctor Revenue Sharing Report feature in the RCMC EMR system. The feature will provide a comprehensive financial summary showing per-doctor consultation counts and revenue breakdown across multiple service categories (procedures, services, medicine, labs, etc.), with an automatic 60/40 revenue split calculation where 60% is allocated to the doctor and 40% to the clinic.

The report will be accessible from the Reports & Analytics section under the Financial category, providing clinic administrators and doctors with transparent visibility into revenue distribution and consultation activity.

## Glossary

- **Revenue_Sharing_Report**: A financial report that displays doctor-specific revenue data with automatic split calculations
- **Consultation**: A medical appointment where a doctor examines and treats a patient
- **Revenue_Category**: Classification of billable items (procedures, services, medicine, labs, consultation fees, etc.)
- **Doctor_Share**: The portion of revenue allocated to the doctor (60% of total)
- **Clinic_Share**: The portion of revenue allocated to the clinic (40% of total)
- **Billing_System**: The EMR module that tracks patient charges and payments
- **Date_Range_Filter**: User interface control allowing selection of start and end dates for report data
- **Export_Service**: Functionality to download report data in various formats (CSV, PDF, Excel)
- **Analytics_Dashboard**: The Reports & Analytics section of the EMR system

## Requirements

### Requirement 1: Display Per-Doctor Consultation Count

**User Story:** As a clinic administrator, I want to see the total number of consultations performed by each doctor within a selected date range, so that I can track doctor productivity and workload distribution.

#### Acceptance Criteria

1. WHEN the Revenue_Sharing_Report is loaded, THE Report SHALL display a list of all active doctors
2. FOR EACH doctor, THE Report SHALL display the total count of completed consultations within the selected date range
3. THE Report SHALL only count consultations with status "Completed" or linked to paid/partial billing records
4. WHEN no consultations exist for a doctor in the date range, THE Report SHALL display zero (0) as the consultation count
5. THE Report SHALL sort doctors by consultation count in descending order by default

### Requirement 2: Calculate Revenue by Category

**User Story:** As a clinic administrator, I want to see revenue broken down by category (procedures, services, medicine, labs, consultation fees) for each doctor, so that I can understand which services generate the most income.

#### Acceptance Criteria

1. WHEN the Revenue_Sharing_Report is generated, THE Billing_System SHALL aggregate revenue from all billing items linked to each doctor's consultations
2. THE Report SHALL categorize revenue into the following categories: "Consultation Fees", "Procedures", "Services", "Medicine", "Labs", "Other"
3. FOR EACH doctor and category combination, THE Report SHALL calculate the total revenue amount
4. THE Report SHALL derive category classification from the billing items JSONB structure in the billing table
5. WHEN a billing item does not match predefined categories, THE Report SHALL classify it as "Other"
6. THE Report SHALL display revenue amounts in Philippine Peso (₱) format with two decimal places

### Requirement 3: Apply 60/40 Revenue Split

**User Story:** As a clinic administrator, I want the system to automatically calculate the 60/40 revenue split (60% doctor, 40% clinic) for each revenue category, so that I can quickly determine payment amounts without manual calculation.

#### Acceptance Criteria

1. FOR ALL revenue amounts in the report, THE Report SHALL calculate Doctor_Share as 60% of the total revenue
2. FOR ALL revenue amounts in the report, THE Report SHALL calculate Clinic_Share as 40% of the total revenue
3. THE Report SHALL display both the total revenue and the split amounts (Doctor_Share and Clinic_Share) for each category
4. THE Report SHALL apply the 60/40 split consistently across all revenue categories
5. THE Report SHALL round split amounts to two decimal places using standard rounding rules
6. THE Report SHALL display a grand total row showing the sum of all Doctor_Share amounts and all Clinic_Share amounts

### Requirement 4: Date Range Filtering

**User Story:** As a clinic administrator, I want to filter the revenue sharing report by custom date ranges, so that I can generate reports for specific periods (weekly, monthly, quarterly, yearly).

#### Acceptance Criteria

1. WHEN the Revenue_Sharing_Report page loads, THE Date_Range_Filter SHALL default to the current month (first day to last day)
2. THE Date_Range_Filter SHALL provide input fields for start date and end date
3. WHEN a user selects a date range, THE Report SHALL refresh and display data only for consultations and billing within that range
4. THE Report SHALL use the consultation_date field from the consultations table for date filtering
5. THE Date_Range_Filter SHALL include preset options: "Today", "This Week", "This Month", "Last Month", "This Quarter", "This Year", "Custom"
6. WHEN the end date is before the start date, THE Report SHALL display a validation error message
7. THE Report SHALL allow date ranges spanning multiple years

### Requirement 5: Export Report Data

**User Story:** As a clinic administrator, I want to export the doctor revenue sharing report to CSV, PDF, or Excel formats, so that I can share the data with stakeholders or maintain offline records.

#### Acceptance Criteria

1. THE Report SHALL provide an export button with format options: CSV, PDF, Excel
2. WHEN a user clicks the CSV export option, THE Export_Service SHALL generate a CSV file containing all report data with proper column headers
3. WHEN a user clicks the PDF export option, THE Export_Service SHALL generate a formatted PDF document with the clinic logo, report title, date range, and all revenue data
4. WHEN a user clicks the Excel export option, THE Export_Service SHALL generate an XLSX file with formatted cells and formulas for totals
5. THE exported file SHALL include the selected date range in the filename (e.g., "doctor-revenue-report-2024-01-01-to-2024-01-31.csv")
6. THE Export_Service SHALL trigger a browser download of the generated file
7. THE exported data SHALL match exactly what is displayed in the on-screen report

### Requirement 6: Display Summary Statistics

**User Story:** As a clinic administrator, I want to see summary statistics at the top of the report (total consultations, total revenue, total doctor share, total clinic share), so that I can quickly understand overall performance without reviewing individual doctor details.

#### Acceptance Criteria

1. THE Report SHALL display a summary section at the top showing aggregate statistics across all doctors
2. THE summary section SHALL include: Total Consultations, Total Revenue, Total Doctor Share, Total Clinic Share
3. THE summary statistics SHALL update automatically when the date range changes
4. THE summary section SHALL use visual cards with distinct colors for each metric
5. THE Report SHALL calculate Total Doctor Share as the sum of all individual doctor shares
6. THE Report SHALL calculate Total Clinic Share as the sum of all individual clinic shares
7. THE summary section SHALL display percentage indicators showing the 60/40 split ratio

### Requirement 7: Handle Missing or Incomplete Data

**User Story:** As a clinic administrator, I want the report to handle cases where consultation or billing data is missing or incomplete, so that the report remains accurate and does not display incorrect calculations.

#### Acceptance Criteria

1. WHEN a consultation has no linked billing record, THE Report SHALL exclude that consultation from revenue calculations but include it in the consultation count
2. WHEN a billing record has zero or null total_amount, THE Report SHALL treat the revenue as ₱0.00 for that record
3. WHEN a doctor has no consultations in the selected date range, THE Report SHALL still display the doctor's name with zero values
4. WHEN billing items JSONB is empty or malformed, THE Report SHALL log a warning and skip that billing record
5. THE Report SHALL display a data quality indicator showing the percentage of consultations with complete billing information
6. WHEN critical data is missing (e.g., doctor information), THE Report SHALL display an error message instead of partial data

### Requirement 8: Access Control and Permissions

**User Story:** As a system administrator, I want to restrict access to the revenue sharing report based on user roles, so that sensitive financial information is only visible to authorized personnel.

#### Acceptance Criteria

1. THE Report SHALL be accessible only to users with role "admin" or "doctor"
2. WHEN a user with role "doctor" accesses the report, THE Report SHALL display only that doctor's own revenue data
3. WHEN a user with role "admin" accesses the report, THE Report SHALL display revenue data for all doctors
4. WHEN a user with role "receptionist" attempts to access the report, THE Analytics_Dashboard SHALL hide the revenue sharing report option
5. THE Report SHALL verify user permissions on page load and redirect unauthorized users to the dashboard
6. THE Report SHALL apply row-level security policies when querying consultation and billing data

### Requirement 9: Performance and Data Loading

**User Story:** As a clinic administrator, I want the revenue sharing report to load quickly even with large amounts of historical data, so that I can access the information without long wait times.

#### Acceptance Criteria

1. WHEN the report is loading data, THE Report SHALL display a loading indicator with progress feedback
2. THE Report SHALL complete data loading and rendering within 3 seconds for date ranges up to 1 year
3. THE Report SHALL use database indexes on consultation_date, doctor_id, and bill_date fields for optimized queries
4. THE Report SHALL implement pagination when displaying more than 50 doctors
5. WHEN the date range exceeds 2 years, THE Report SHALL display a warning message suggesting a shorter range for better performance
6. THE Report SHALL cache aggregated data for 5 minutes to reduce database load on repeated views

### Requirement 10: Integration with Existing Reports Section

**User Story:** As a clinic administrator, I want the doctor revenue sharing report to be seamlessly integrated into the existing Reports & Analytics section, so that I can access it alongside other financial reports.

#### Acceptance Criteria

1. THE Analytics_Dashboard SHALL include a new tab or section labeled "Doctor Revenue Sharing" under the Financial category
2. THE Report SHALL follow the same visual design patterns and styling as existing financial reports
3. THE Report SHALL use the same Date_Range_Filter component used by other reports for consistency
4. THE Report SHALL be accessible from the main Reports navigation menu
5. WHEN a user switches between report types, THE Analytics_Dashboard SHALL preserve the selected date range
6. THE Report SHALL use the existing Export_Service infrastructure for file generation
