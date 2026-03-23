# Requirements Document: Reports & Analytics Dashboard Transformation

## Introduction

This feature transforms the current basic Reports page into a comprehensive analytics dashboard that provides real-time insights into hospital operations. The dashboard will display key performance indicators (KPIs), patient distribution, revenue trends, expense breakdowns, and performance comparisons using live data from the database. All metrics must be calculated from actual database queries with no hardcoded values, supporting date range filtering and data export capabilities.

## Glossary

- **Analytics_Dashboard**: The transformed Reports page displaying comprehensive hospital metrics and visualizations
- **KPI_Card**: A visual component displaying a single key performance indicator with growth trends
- **Date_Range_Filter**: A UI component allowing users to select start and end dates for data filtering
- **Chart_Component**: A reusable visualization component (donut, line, bar, or radar chart)
- **Export_Service**: A utility service that exports dashboard data to CSV/Excel formats
- **Database_Query**: A Supabase query that retrieves live data from hospital tables
- **Growth_Indicator**: A percentage showing increase or decrease compared to previous period
- **Metric_Calculator**: A utility function that computes KPIs from raw database data
- **Patient_Distribution**: Breakdown of patients by department or specialty
- **Revenue_Trend**: Time-series data showing revenue changes over selected period
- **Expense_Breakdown**: Categorized hospital expenses with stacked visualization
- **Performance_Comparison**: Radar chart comparing hospital metrics against benchmarks
- **Real_Time_Data**: Live data fetched from database tables without caching delays

## Requirements

### Requirement 1: KPI Cards Display

**User Story:** As a hospital administrator, I want to see four key performance indicator cards at the top of the dashboard, so that I can quickly assess overall hospital performance.

#### Acceptance Criteria

1. THE Analytics_Dashboard SHALL display four KPI_Cards in a horizontal row at the top of the page
2. WHEN the page loads, THE Analytics_Dashboard SHALL fetch Total Patients count from the patients table
3. WHEN the page loads, THE Analytics_Dashboard SHALL calculate Bed Occupancy Rate from rooms and inpatients tables
4. WHEN the page loads, THE Analytics_Dashboard SHALL compute Patient Satisfaction average from satisfaction_ratings table
5. WHEN the page loads, THE Analytics_Dashboard SHALL sum Total Revenue from payments table
6. THE KPI_Card SHALL display an icon, metric value, Growth_Indicator, and descriptive subtitle
7. THE Growth_Indicator SHALL show percentage change compared to the previous period with color coding (green for positive, red for negative)
8. THE KPI_Card SHALL include a three-dot menu in the top right corner for additional actions

### Requirement 2: Patient Distribution Visualization

**User Story:** As a hospital administrator, I want to see patient distribution across departments, so that I can understand which specialties are most utilized.

#### Acceptance Criteria

1. THE Analytics_Dashboard SHALL display a Patient_Distribution donut chart in the middle-left section
2. WHEN the Date_Range_Filter changes, THE Chart_Component SHALL query consultations table grouped by department
3. THE Chart_Component SHALL display the total patient count in the center of the donut chart
4. THE Chart_Component SHALL show a legend below the chart with percentages for each department
5. THE Chart_Component SHALL calculate percentages dynamically from actual patient counts
6. THE Chart_Component SHALL include a three-dot menu for export or drill-down options

### Requirement 3: Revenue Trends Visualization

**User Story:** As a financial manager, I want to see revenue trends over time, so that I can identify patterns and forecast future revenue.

#### Acceptance Criteria

1. THE Analytics_Dashboard SHALL display a Revenue_Trend line chart in the middle-right section
2. WHEN the Date_Range_Filter changes, THE Chart_Component SHALL aggregate payments by day or month
3. THE Chart_Component SHALL display monthly revenue data from March to August (or selected range)
4. THE Chart_Component SHALL show Y-axis values from 0 to maximum revenue with proper scaling
5. THE Chart_Component SHALL include a monthly dropdown filter for granular time selection
6. THE Chart_Component SHALL display total revenue for the selected period above the chart
7. THE Chart_Component SHALL include a three-dot menu for export options

### Requirement 4: Expense Overview Visualization

**User Story:** As a financial manager, I want to see expense breakdowns by category, so that I can identify cost optimization opportunities.

#### Acceptance Criteria

1. THE Analytics_Dashboard SHALL display an Expense_Breakdown stacked bar chart in the bottom-left section
2. WHEN the Date_Range_Filter changes, THE Chart_Component SHALL aggregate expenses from payments, inventory, and services tables
3. THE Chart_Component SHALL categorize expenses into: Staff Salaries & Benefits, Medical Supplies, Operational Costs, Pharmaceuticals, and Miscellaneous
4. THE Chart_Component SHALL display daily expense bars with color-coded categories
5. THE Chart_Component SHALL show total expense amount with Growth_Indicator
6. THE Chart_Component SHALL include a monthly dropdown filter
7. THE Chart_Component SHALL display a color-coded legend for expense categories

### Requirement 5: Performance Comparison Visualization

**User Story:** As a hospital administrator, I want to compare our hospital's performance against average benchmarks, so that I can identify areas for improvement.

#### Acceptance Criteria

1. THE Analytics_Dashboard SHALL display a Performance_Comparison radar chart in the bottom-right section
2. WHEN the page loads, THE Chart_Component SHALL calculate five performance metrics from database tables
3. THE Chart_Component SHALL compute Patient Satisfaction from satisfaction_ratings table
4. THE Chart_Component SHALL calculate Recovery Rate from consultations table (successful treatments / total treatments)
5. THE Chart_Component SHALL compute Emergency Response time from appointments table (emergency appointments)
6. THE Chart_Component SHALL calculate Follow-up Rate from appointments table (follow-up appointments / total consultations)
7. THE Chart_Component SHALL compute Treatment Success Rate from consultations table
8. THE Chart_Component SHALL display two overlapping radar lines: "Your Hospital" (blue) and "Avg. Hospital" (orange)
9. THE Chart_Component SHALL include a three-dot menu for export options

### Requirement 6: Date Range Filtering

**User Story:** As a user, I want to filter all dashboard metrics by date range, so that I can analyze specific time periods.

#### Acceptance Criteria

1. THE Analytics_Dashboard SHALL display a Date_Range_Filter component at the top of the page
2. WHEN a user selects a start date, THE Date_Range_Filter SHALL update the startDate state
3. WHEN a user selects an end date, THE Date_Range_Filter SHALL update the endDate state
4. WHEN the date range changes, THE Analytics_Dashboard SHALL re-fetch all metrics with the new date filter
5. THE Database_Query SHALL include WHERE clauses filtering by created_at or date columns
6. THE Analytics_Dashboard SHALL display a loading state while re-fetching filtered data

### Requirement 7: Data Export Functionality

**User Story:** As a hospital administrator, I want to export dashboard data to CSV or Excel, so that I can perform offline analysis or share reports.

#### Acceptance Criteria

1. THE Analytics_Dashboard SHALL display an "Export" button with dropdown in the top-right corner
2. WHEN a user clicks the Export button, THE Analytics_Dashboard SHALL show export format options (CSV, Excel)
3. WHEN a user selects CSV format, THE Export_Service SHALL generate a CSV file with all visible metrics
4. WHEN a user selects Excel format, THE Export_Service SHALL generate an Excel file with all visible metrics
5. THE Export_Service SHALL include current date range filters in the exported filename
6. THE Export_Service SHALL include all KPI values, chart data, and calculated metrics in the export
7. WHEN export completes, THE Analytics_Dashboard SHALL trigger a browser download of the file

### Requirement 8: Real-Time Data Integration

**User Story:** As a user, I want all dashboard metrics to reflect live database data, so that I always see current hospital status.

#### Acceptance Criteria

1. THE Analytics_Dashboard SHALL fetch all metrics from Database_Query calls to Supabase
2. THE Database_Query SHALL query patients table for Total Patients count
3. THE Database_Query SHALL query rooms and inpatients tables for Bed Occupancy Rate calculation
4. THE Database_Query SHALL query satisfaction_ratings table for Patient Satisfaction average
5. THE Database_Query SHALL query payments table for Total Revenue sum
6. THE Database_Query SHALL query consultations table for Patient_Distribution by department
7. THE Database_Query SHALL query payments table for Revenue_Trend time-series data
8. THE Database_Query SHALL query payments, inventory, and services tables for Expense_Breakdown
9. THE Database_Query SHALL query consultations, satisfaction_ratings, and appointments tables for Performance_Comparison metrics
10. THE Analytics_Dashboard SHALL NOT include any hardcoded metric values

### Requirement 9: Growth Calculation Logic

**User Story:** As a hospital administrator, I want to see growth percentages for each metric, so that I can track performance trends.

#### Acceptance Criteria

1. THE Metric_Calculator SHALL compute current period metrics from the selected date range
2. THE Metric_Calculator SHALL compute previous period metrics from an equal-length period before the selected range
3. THE Metric_Calculator SHALL calculate growth percentage as: ((current - previous) / previous) * 100
4. WHEN previous period value is zero, THE Metric_Calculator SHALL display "N/A" or "New" instead of percentage
5. THE Growth_Indicator SHALL display positive growth in green color with "+" prefix
6. THE Growth_Indicator SHALL display negative growth in red color with "-" prefix
7. THE Growth_Indicator SHALL display zero growth in gray color

### Requirement 10: Responsive Design Implementation

**User Story:** As a user on any device, I want the dashboard to adapt to my screen size, so that I can view analytics on desktop, tablet, or mobile.

#### Acceptance Criteria

1. WHEN viewport width is >= 1024px, THE Analytics_Dashboard SHALL display KPI_Cards in a 4-column grid
2. WHEN viewport width is >= 768px AND < 1024px, THE Analytics_Dashboard SHALL display KPI_Cards in a 2-column grid
3. WHEN viewport width is < 768px, THE Analytics_Dashboard SHALL display KPI_Cards in a 1-column stack
4. WHEN viewport width is >= 1024px, THE Analytics_Dashboard SHALL display charts in a 2-column grid
5. WHEN viewport width is < 1024px, THE Analytics_Dashboard SHALL display charts in a 1-column stack
6. THE Chart_Component SHALL resize dynamically to fit container width
7. THE Analytics_Dashboard SHALL maintain readability and usability at all breakpoints

### Requirement 11: Performance Optimization

**User Story:** As a user, I want the dashboard to load quickly, so that I can access insights without delays.

#### Acceptance Criteria

1. WHEN the page loads, THE Analytics_Dashboard SHALL complete initial render within 2 seconds
2. WHEN data is fetched, THE Chart_Component SHALL render within 500 milliseconds
3. THE Database_Query SHALL use indexed columns for WHERE clauses to optimize query speed
4. THE Analytics_Dashboard SHALL implement parallel data fetching for independent metrics
5. THE Analytics_Dashboard SHALL cache expensive calculations for the current date range
6. WHEN date range changes, THE Analytics_Dashboard SHALL debounce re-fetch requests by 300ms

### Requirement 12: Error Handling and Loading States

**User Story:** As a user, I want clear feedback when data is loading or errors occur, so that I understand the dashboard status.

#### Acceptance Criteria

1. WHEN the page loads, THE Analytics_Dashboard SHALL display skeleton loaders for each KPI_Card and Chart_Component
2. WHEN a Database_Query fails, THE Analytics_Dashboard SHALL display an error message in the affected component
3. WHEN a Database_Query fails, THE Analytics_Dashboard SHALL log the error details to the console
4. WHEN retry is possible, THE Analytics_Dashboard SHALL display a "Retry" button in the error state
5. WHEN no data exists for the selected date range, THE Chart_Component SHALL display "No data available" message
6. THE Analytics_Dashboard SHALL continue displaying other components when one component fails

### Requirement 13: Chart Interactivity

**User Story:** As a user, I want to interact with charts, so that I can explore data in detail.

#### Acceptance Criteria

1. WHEN a user hovers over a chart element, THE Chart_Component SHALL display a tooltip with detailed values
2. WHEN a user clicks a legend item, THE Chart_Component SHALL toggle visibility of that data series
3. WHEN a user clicks a chart segment, THE Chart_Component SHALL trigger a drill-down action (if applicable)
4. THE Chart_Component SHALL support smooth animations when data updates
5. THE Chart_Component SHALL maintain aspect ratio during window resize

### Requirement 14: Accessibility Compliance

**User Story:** As a user with disabilities, I want the dashboard to be accessible, so that I can use assistive technologies to view analytics.

#### Acceptance Criteria

1. THE KPI_Card SHALL include aria-label attributes describing the metric and value
2. THE Chart_Component SHALL include aria-label attributes describing the chart type and data
3. THE Date_Range_Filter SHALL be keyboard navigable with tab and arrow keys
4. THE Export_Service button SHALL be keyboard accessible with Enter key activation
5. THE Analytics_Dashboard SHALL maintain color contrast ratio of at least 4.5:1 for text
6. THE Growth_Indicator SHALL not rely solely on color to convey meaning (include +/- symbols)

### Requirement 15: CSV Parser and Pretty Printer for Export

**User Story:** As a developer, I want a robust CSV parser and pretty printer, so that exported data is correctly formatted and can be re-imported if needed.

#### Acceptance Criteria

1. THE Export_Service SHALL use a CSV parser to structure dashboard data into rows and columns
2. THE CSV parser SHALL escape special characters (commas, quotes, newlines) in cell values
3. THE CSV parser SHALL include headers as the first row with metric names
4. THE Export_Service SHALL use a CSV pretty printer to format the output with consistent spacing
5. THE CSV pretty printer SHALL ensure all rows have the same number of columns
6. FOR ALL valid dashboard data, exporting then importing then exporting SHALL produce an equivalent CSV file (round-trip property)
7. WHEN a CSV export is generated, THE Export_Service SHALL validate the output format before download

## Parser and Serializer Requirements

### Requirement 16: CSV Export Parser

**User Story:** As a developer, I want to parse dashboard data into CSV format, so that users can export analytics for offline use.

#### Acceptance Criteria

1. WHEN the Export_Service is invoked, THE CSV_Parser SHALL parse dashboard metrics into CSV structure
2. WHEN a metric value contains special characters, THE CSV_Parser SHALL escape them according to RFC 4180
3. THE CSV_Parser SHALL include column headers: Metric, Value, Growth, Period, Timestamp
4. THE CSV_Parser SHALL format date values as ISO 8601 strings
5. THE CSV_Parser SHALL format numeric values with appropriate precision (2 decimal places for currency)

### Requirement 17: CSV Pretty Printer

**User Story:** As a user, I want exported CSV files to be well-formatted, so that they are readable in spreadsheet applications.

#### Acceptance Criteria

1. THE CSV_Pretty_Printer SHALL format CSV output with consistent column alignment
2. THE CSV_Pretty_Printer SHALL use UTF-8 encoding with BOM for Excel compatibility
3. THE CSV_Pretty_Printer SHALL separate columns with commas and rows with CRLF line endings
4. THE CSV_Pretty_Printer SHALL quote fields containing commas, quotes, or newlines

### Requirement 18: Round-Trip CSV Property

**User Story:** As a developer, I want to ensure CSV export integrity, so that exported data can be reliably re-imported.

#### Acceptance Criteria

1. FOR ALL valid dashboard data objects, THE Export_Service SHALL generate valid CSV output
2. FOR ALL valid CSV output, parsing then pretty-printing then parsing SHALL produce an equivalent data structure (round-trip property)
3. THE Export_Service SHALL include a validation function that verifies round-trip integrity
4. WHEN round-trip validation fails, THE Export_Service SHALL log an error and prevent download

## Technical Constraints

- Must use React with functional components and hooks
- Must use Recharts library for all chart visualizations
- Must use Supabase client for all database queries
- Must use Tailwind CSS for styling to match reference design
- Must support modern browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)
- Must not exceed 2-second initial page load time
- Must not exceed 500ms chart rendering time
- Must handle up to 10,000 data points per chart without performance degradation

## Non-Functional Requirements

- All database queries must use parameterized queries to prevent SQL injection
- All user inputs (date ranges) must be validated before use in queries
- All error messages must be user-friendly without exposing technical details
- All exported files must include timestamp in filename for version tracking
- All chart colors must match the reference design color scheme (#14B8A6 primary)
