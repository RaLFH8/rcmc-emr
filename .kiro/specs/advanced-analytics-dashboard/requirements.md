# Requirements Document

## Introduction

This document specifies the requirements for redesigning the Reports dashboard into an advanced analytics dashboard with comprehensive healthcare metrics, interactive visualizations, and real-time data integration. The redesign transforms a basic tabbed report interface into a professional analytics platform matching the provided design reference, featuring key performance indicators (KPIs), trend analysis, department distribution, expense tracking, and performance comparisons.

## Glossary

- **Dashboard**: The main analytics interface displaying healthcare metrics and visualizations
- **KPI_Card**: A visual component displaying a single key performance indicator with value, trend, and description
- **Chart_Component**: An interactive visualization element (donut, line, bar, or radar chart)
- **Data_Service**: Backend service layer responsible for fetching and aggregating data from Supabase
- **Metric_Calculator**: Component that computes derived metrics from raw database data
- **Date_Filter**: User interface control for selecting time ranges to filter displayed data
- **Export_Service**: Service that generates downloadable reports in various formats
- **Real_Time_Updater**: Component that refreshes dashboard data at specified intervals
- **Department**: Medical specialization category (General Medicine, Cardiology, Orthopedics, Neurology, etc.)
- **Bed_Occupancy_Rate**: Percentage of hospital beds currently occupied by inpatients
- **Patient_Satisfaction_Score**: Average rating from patient satisfaction surveys (scale 1-5)
- **Revenue_Trend**: Time-series data showing revenue changes over months
- **Expense_Category**: Classification of hospital expenses (Staff Salaries, Medical Supplies, Operational Costs, etc.)
- **Performance_Metric**: Measurable indicator of hospital performance (Recovery Rate, Emergency Response, etc.)
- **Comparison_Baseline**: Reference values for comparing hospital performance against averages

## Requirements

### Requirement 1: Display Top-Level KPI Metrics

**User Story:** As a hospital administrator, I want to see critical metrics at a glance, so that I can quickly assess overall hospital performance.

#### Acceptance Criteria

1. THE Dashboard SHALL display four KPI cards in the top row: Total Patients, Bed Occupancy Rate, Patient Satisfaction, and Total Revenue
2. WHEN calculating Total Patients, THE Metric_Calculator SHALL count all active patients from the patients table for the selected time period
3. WHEN calculating Bed Occupancy Rate, THE Metric_Calculator SHALL divide occupied beds by total beds from the inpatients table
4. WHEN calculating Patient Satisfaction, THE Metric_Calculator SHALL compute the average of all satisfaction ratings from the satisfaction_ratings table
5. WHEN calculating Total Revenue, THE Metric_Calculator SHALL sum all amount_paid values from the billing table for the selected period
6. FOR EACH KPI card, THE Dashboard SHALL display the current value, percentage change from previous period, and a descriptive trend message
7. THE Metric_Calculator SHALL compute percentage changes by comparing current period values to the equivalent previous period
8. WHEN a metric increases, THE KPI_Card SHALL display a positive indicator with green styling
9. WHEN a metric decreases, THE KPI_Card SHALL display a negative indicator with red styling
10. THE Dashboard SHALL format currency values with peso sign (₱) and thousand separators
11. THE Dashboard SHALL format percentage values with one decimal place precision
12. THE Dashboard SHALL format satisfaction scores as X.X/5.0 format

### Requirement 2: Visualize Patient Distribution by Department

**User Story:** As a hospital administrator, I want to see how patients are distributed across departments, so that I can understand resource allocation needs.

#### Acceptance Criteria

1. THE Dashboard SHALL display a donut chart showing patient distribution by department
2. WHEN aggregating patient data, THE Data_Service SHALL join consultations with doctors to determine department distribution
3. THE Chart_Component SHALL display five department categories: General Medicine, Cardiology, Orthopedics, Neurology, and Others
4. FOR EACH department, THE Chart_Component SHALL calculate the percentage of total patients
5. THE Chart_Component SHALL use distinct colors for each department segment
6. THE Chart_Component SHALL display the total patient count in the center of the donut chart
7. THE Chart_Component SHALL show a legend with department names, percentages, and color indicators
8. WHEN a user hovers over a chart segment, THE Chart_Component SHALL display detailed information for that department
9. THE Data_Service SHALL classify any specialization not in the top four as "Others"
10. THE Chart_Component SHALL sort departments by patient count in descending order

### Requirement 3: Display Revenue Trends Over Time

**User Story:** As a financial manager, I want to see revenue trends over time, so that I can identify patterns and forecast future revenue.

#### Acceptance Criteria

1. THE Dashboard SHALL display a line chart showing monthly revenue trends
2. THE Data_Service SHALL aggregate billing data by month from the billing table
3. THE Chart_Component SHALL display revenue data for the most recent six months
4. THE Chart_Component SHALL plot revenue values on the Y-axis and months on the X-axis
5. THE Chart_Component SHALL format Y-axis labels with peso sign and abbreviated numbers (e.g., ₱450K)
6. THE Chart_Component SHALL format X-axis labels as "Month YYYY" (e.g., "August 2025")
7. WHEN a user hovers over a data point, THE Chart_Component SHALL display the exact revenue value for that month
8. THE Dashboard SHALL display the current month's revenue prominently above the chart
9. THE Dashboard SHALL include a dropdown filter to select different time periods (Monthly, Quarterly, Yearly)
10. WHEN the time period filter changes, THE Chart_Component SHALL update to display the appropriate data granularity
11. THE Chart_Component SHALL use smooth curve interpolation for the line graph
12. THE Chart_Component SHALL highlight the most recent data point

### Requirement 4: Track and Display Expense Categories

**User Story:** As a financial manager, I want to see expense breakdowns by category, so that I can monitor spending and identify cost optimization opportunities.

#### Acceptance Criteria

1. THE Dashboard SHALL display a bar chart showing expenses by category
2. THE Dashboard SHALL track five expense categories: Staff Salaries & Benefits, Medical Supplies, Operational Costs, Pharmaceuticals, and Miscellaneous
3. WHEN calculating Staff Salaries, THE Metric_Calculator SHALL aggregate payroll data if available, otherwise use configured budget values
4. WHEN calculating Medical Supplies, THE Metric_Calculator SHALL sum inventory purchases from the inventory table
5. WHEN calculating Operational Costs, THE Metric_Calculator SHALL use configured operational budget values
6. WHEN calculating Pharmaceuticals, THE Metric_Calculator SHALL sum pharmaceutical inventory purchases
7. WHEN calculating Miscellaneous, THE Metric_Calculator SHALL sum other expense categories
8. THE Chart_Component SHALL display each category as a horizontal bar with distinct color coding
9. THE Chart_Component SHALL display the expense amount at the end of each bar
10. THE Dashboard SHALL display the total expenses sum above the chart
11. THE Dashboard SHALL display the percentage change in total expenses from the previous period
12. THE Chart_Component SHALL sort expense categories by amount in descending order
13. THE Chart_Component SHALL format all monetary values with peso sign and thousand separators

### Requirement 5: Compare Hospital Performance Metrics

**User Story:** As a hospital administrator, I want to compare our performance against industry averages, so that I can identify areas for improvement.

#### Acceptance Criteria

1. THE Dashboard SHALL display a radar chart comparing five performance metrics
2. THE Dashboard SHALL track Patient Satisfaction, Recovery Rate, Emergency Response, Follow-up Rate, and Treatment Success Rate
3. WHEN calculating Patient Satisfaction, THE Metric_Calculator SHALL use the average satisfaction score from satisfaction_ratings table
4. WHEN calculating Recovery Rate, THE Metric_Calculator SHALL divide successful treatments by total treatments from consultations
5. WHEN calculating Emergency Response, THE Metric_Calculator SHALL compute average response time for emergency appointments
6. WHEN calculating Follow-up Rate, THE Metric_Calculator SHALL divide completed follow-ups by scheduled follow-ups from appointments
7. WHEN calculating Treatment Success Rate, THE Metric_Calculator SHALL analyze consultation outcomes and follow-up data
8. THE Chart_Component SHALL display two overlaid polygons: "Your Hospital" and "Avg. Hospital"
9. THE Chart_Component SHALL use distinct colors for each polygon (blue for Your Hospital, gray for Average)
10. THE Chart_Component SHALL scale all metrics to a 0-5 range for consistent visualization
11. THE Chart_Component SHALL display metric labels at each axis point
12. WHEN a user hovers over a metric point, THE Chart_Component SHALL display the exact value
13. THE Dashboard SHALL store baseline comparison values in a configuration table
14. THE Dashboard SHALL allow administrators to update baseline comparison values

### Requirement 6: Implement Interactive Date Range Filtering

**User Story:** As a user, I want to filter dashboard data by date range, so that I can analyze specific time periods.

#### Acceptance Criteria

1. THE Dashboard SHALL display a date range selector in the header
2. THE Date_Filter SHALL include a start date picker and an end date picker
3. THE Date_Filter SHALL default to the current month (first day to current day)
4. WHEN a user changes the date range, THE Dashboard SHALL refresh all metrics and charts
5. THE Data_Service SHALL filter all database queries by the selected date range
6. THE Dashboard SHALL validate that the end date is not before the start date
7. WHEN an invalid date range is selected, THE Dashboard SHALL display an error message
8. THE Dashboard SHALL include preset date range buttons: "This Month", "Last Month", "Last 3 Months", "Last 6 Months", "This Year"
9. WHEN a preset button is clicked, THE Date_Filter SHALL automatically set the corresponding date range
10. THE Dashboard SHALL persist the selected date range in browser session storage
11. WHEN the dashboard is reloaded, THE Date_Filter SHALL restore the previously selected date range

### Requirement 7: Enable Data Export Functionality

**User Story:** As a hospital administrator, I want to export dashboard data, so that I can create reports for stakeholders and regulatory compliance.

#### Acceptance Criteria

1. THE Dashboard SHALL display an "Export" button in the header
2. WHEN the Export button is clicked, THE Dashboard SHALL display export format options: PDF, Excel, and CSV
3. WHEN PDF export is selected, THE Export_Service SHALL generate a PDF document containing all visible charts and metrics
4. WHEN Excel export is selected, THE Export_Service SHALL generate an Excel workbook with separate sheets for each metric category
5. WHEN CSV export is selected, THE Export_Service SHALL generate CSV files for each data table
6. THE Export_Service SHALL include the selected date range in the exported filename
7. THE Export_Service SHALL include a timestamp in the exported filename
8. THE Export_Service SHALL format the filename as "RCMC_Analytics_Report_YYYY-MM-DD_HHMMSS.ext"
9. THE Export_Service SHALL include hospital branding and logo in PDF exports
10. THE Export_Service SHALL preserve chart visualizations in PDF and Excel exports
11. WHEN export is in progress, THE Dashboard SHALL display a loading indicator
12. WHEN export completes, THE Dashboard SHALL automatically download the file
13. WHEN export fails, THE Dashboard SHALL display an error message with details

### Requirement 8: Implement Real-Time Data Updates

**User Story:** As a user, I want the dashboard to automatically refresh with current data, so that I always see up-to-date information without manual refreshing.

#### Acceptance Criteria

1. THE Dashboard SHALL automatically refresh data every 5 minutes
2. THE Real_Time_Updater SHALL fetch updated data from the database without full page reload
3. WHEN new data is available, THE Dashboard SHALL smoothly transition to updated values
4. THE Dashboard SHALL display a "Last Updated" timestamp in the header
5. THE Dashboard SHALL format the timestamp as "Last updated: HH:MM AM/PM"
6. THE Dashboard SHALL include a manual refresh button
7. WHEN the manual refresh button is clicked, THE Real_Time_Updater SHALL immediately fetch fresh data
8. THE Dashboard SHALL display a subtle loading indicator during data refresh
9. THE Dashboard SHALL not interrupt user interactions during automatic refresh
10. WHEN the browser tab is inactive, THE Real_Time_Updater SHALL pause automatic refreshing
11. WHEN the browser tab becomes active again, THE Real_Time_Updater SHALL immediately refresh data
12. THE Dashboard SHALL use Supabase real-time subscriptions for critical metrics when available

### Requirement 9: Ensure Responsive Design and Accessibility

**User Story:** As a user on any device, I want the dashboard to be fully functional and readable, so that I can access analytics from desktop, tablet, or mobile devices.

#### Acceptance Criteria

1. THE Dashboard SHALL be fully responsive across desktop (1920px+), tablet (768px-1919px), and mobile (320px-767px) viewports
2. WHEN viewed on mobile, THE Dashboard SHALL stack KPI cards vertically
3. WHEN viewed on tablet, THE Dashboard SHALL display KPI cards in a 2x2 grid
4. WHEN viewed on desktop, THE Dashboard SHALL display KPI cards in a 1x4 horizontal row
5. THE Chart_Component SHALL resize proportionally to maintain readability on all screen sizes
6. WHEN viewed on mobile, THE Dashboard SHALL display charts in full-width single-column layout
7. THE Dashboard SHALL use touch-friendly controls with minimum 44px touch targets on mobile devices
8. THE Dashboard SHALL support keyboard navigation for all interactive elements
9. THE Dashboard SHALL include ARIA labels for all charts and metrics
10. THE Dashboard SHALL maintain WCAG 2.1 AA color contrast ratios for all text and visual elements
11. THE Dashboard SHALL provide text alternatives for all chart visualizations
12. WHEN a chart cannot be displayed, THE Dashboard SHALL show the data in an accessible table format

### Requirement 10: Optimize Performance for Large Datasets

**User Story:** As a user, I want the dashboard to load quickly even with large amounts of historical data, so that I can access insights without delays.

#### Acceptance Criteria

1. THE Dashboard SHALL load and display initial data within 2 seconds on standard broadband connections
2. THE Data_Service SHALL use database indexes on all date and foreign key columns
3. THE Data_Service SHALL implement query result caching with 5-minute expiration
4. WHEN fetching large datasets, THE Data_Service SHALL use pagination with maximum 1000 records per query
5. THE Data_Service SHALL perform aggregations at the database level rather than in application code
6. THE Dashboard SHALL implement lazy loading for chart components
7. WHEN a chart is not visible in the viewport, THE Dashboard SHALL defer rendering until scrolled into view
8. THE Dashboard SHALL use React.memo or similar optimization to prevent unnecessary re-renders
9. THE Dashboard SHALL debounce date range filter changes by 500ms
10. THE Data_Service SHALL execute independent data queries in parallel
11. THE Dashboard SHALL display skeleton loaders while data is being fetched
12. WHEN data fetching exceeds 5 seconds, THE Dashboard SHALL display a timeout warning

### Requirement 11: Maintain Data Accuracy and Consistency

**User Story:** As a hospital administrator, I want dashboard metrics to be accurate and consistent, so that I can make informed decisions based on reliable data.

#### Acceptance Criteria

1. THE Metric_Calculator SHALL use database transactions to ensure data consistency
2. THE Metric_Calculator SHALL handle null and missing values gracefully without errors
3. WHEN a required data field is missing, THE Metric_Calculator SHALL use zero as default for numeric calculations
4. THE Metric_Calculator SHALL exclude soft-deleted records from all calculations
5. THE Metric_Calculator SHALL filter out test or demo data based on configured exclusion rules
6. THE Dashboard SHALL display "N/A" for metrics that cannot be calculated due to insufficient data
7. THE Dashboard SHALL display a warning icon with tooltip when data quality issues are detected
8. THE Data_Service SHALL log all calculation errors for debugging and auditing
9. THE Dashboard SHALL validate that percentage changes are within reasonable bounds (-100% to +1000%)
10. WHEN percentage changes exceed bounds, THE Dashboard SHALL display "Significant Change" instead of the percentage
11. THE Dashboard SHALL round all monetary values to 2 decimal places
12. THE Dashboard SHALL round all percentage values to 1 decimal place
13. THE Dashboard SHALL round all rating values to 1 decimal place

### Requirement 12: Implement Chart Interactivity

**User Story:** As a user, I want to interact with charts to explore detailed data, so that I can drill down into specific metrics and time periods.

#### Acceptance Criteria

1. WHEN a user hovers over any chart element, THE Chart_Component SHALL display a tooltip with detailed information
2. THE Chart_Component SHALL format tooltip values consistently with dashboard formatting rules
3. WHEN a user clicks on a chart segment in the donut chart, THE Dashboard SHALL filter other charts to show data for that department
4. WHEN a user clicks on a data point in the line chart, THE Dashboard SHALL display a detailed breakdown for that month
5. WHEN a user clicks on a bar in the expense chart, THE Dashboard SHALL show itemized expenses for that category
6. THE Chart_Component SHALL provide a "Reset Filters" button when drill-down filters are active
7. WHEN the Reset Filters button is clicked, THE Dashboard SHALL restore the original unfiltered view
8. THE Chart_Component SHALL support zoom functionality on the revenue trend line chart
9. WHEN a user selects a region on the line chart, THE Chart_Component SHALL zoom to that time range
10. THE Chart_Component SHALL include zoom reset controls
11. THE Chart_Component SHALL animate transitions when data updates
12. THE Chart_Component SHALL use smooth 300ms transitions for all animations

## Parser and Serializer Requirements

### Requirement 13: Parse and Validate Configuration Data

**User Story:** As a system administrator, I want dashboard configuration to be stored in a structured format, so that I can easily update settings and baseline values.

#### Acceptance Criteria

1. THE Dashboard SHALL store configuration in JSON format in a dashboard_config table
2. THE Configuration_Parser SHALL parse JSON configuration data into typed configuration objects
3. WHEN parsing configuration, THE Configuration_Parser SHALL validate all required fields are present
4. WHEN parsing configuration, THE Configuration_Parser SHALL validate numeric values are within acceptable ranges
5. WHEN invalid configuration is detected, THE Configuration_Parser SHALL return descriptive error messages
6. THE Configuration_Printer SHALL format configuration objects back into valid JSON
7. FOR ALL valid configuration objects, parsing then printing then parsing SHALL produce an equivalent object (round-trip property)
8. THE Configuration_Parser SHALL support schema versioning for backward compatibility
9. WHEN an older configuration version is detected, THE Configuration_Parser SHALL migrate to the current schema version
10. THE Dashboard SHALL validate configuration on application startup

### Requirement 14: Export Data Serialization

**User Story:** As a developer, I want export data to be properly serialized, so that exported files are valid and can be imported into other systems.

#### Acceptance Criteria

1. THE Export_Serializer SHALL convert dashboard data into CSV format following RFC 4180 specification
2. THE Export_Serializer SHALL properly escape special characters (commas, quotes, newlines) in CSV output
3. THE Export_Serializer SHALL convert dashboard data into Excel format using XLSX specification
4. THE Export_Serializer SHALL preserve data types (numbers, dates, text) in Excel exports
5. THE Export_Serializer SHALL convert dashboard data into PDF format using PDF/A standard
6. THE Export_Parser SHALL parse imported CSV files back into dashboard data structures
7. FOR ALL valid CSV exports, parsing the exported CSV SHALL produce equivalent data (round-trip property)
8. WHEN parsing imported data, THE Export_Parser SHALL validate data types and ranges
9. WHEN invalid data is encountered during import, THE Export_Parser SHALL return detailed error messages with row numbers
10. THE Export_Serializer SHALL include metadata headers in all export formats (export date, date range, hospital name)

## Technical Constraints

1. All data MUST be fetched from Supabase database tables (no hardcoded values)
2. The dashboard MUST use React with Tailwind CSS for styling
3. Charts MUST be implemented using a production-ready charting library (Recharts, Chart.js, or similar)
4. The dashboard MUST maintain the existing application architecture and routing
5. Database queries MUST use the existing db service layer from src/lib/supabase.js
6. The dashboard MUST handle loading states with the existing HeartbeatLoader component
7. All monetary values MUST use Philippine Peso (₱) currency formatting
8. Date and time values MUST use Philippine timezone (Asia/Manila)
9. The dashboard MUST work with the existing Supabase Row Level Security (RLS) policies
10. The dashboard MUST be compatible with modern browsers (Chrome, Firefox, Safari, Edge - last 2 versions)
