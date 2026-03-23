# Design Document: Reports & Analytics Dashboard Transformation

## Overview

This design transforms the existing Reports page into a comprehensive analytics dashboard that provides real-time insights into hospital operations. The transformation leverages the existing analytics infrastructure (components, hooks, and services) while enhancing the Reports page to display KPIs, patient distribution, revenue trends, expense breakdowns, and performance comparisons.

### Current State

The Reports page currently exists as a tabbed interface with:
- Financial reports (billing data aggregation)
- Patient reports (demographics and statistics)
- Appointment reports (status and type breakdowns)
- Inventory reports (stock levels and usage)
- Analytics tab (placeholder that renders AnalyticsDashboard component)

The AnalyticsDashboard component is already implemented with:
- KPI cards (Total Patients, Bed Occupancy, Patient Satisfaction, Total Revenue)
- Chart components (Patient Distribution, Revenue Trend, Expense Breakdown, Performance Comparison)
- Date range filtering with session storage persistence
- Export functionality (PDF, Excel, CSV)
- Real-time data fetching via useAnalytics hook
- Automatic refresh every 5 minutes with tab visibility detection

### Target State

The transformation will:
1. Make the Analytics tab the default view when users navigate to Reports
2. Ensure all metrics are calculated from live database queries (no hardcoded values)
3. Enhance the existing components to fully meet all requirements
4. Implement comprehensive error handling and loading states
5. Add accessibility features (ARIA labels, keyboard navigation)
6. Optimize performance with parallel queries and caching
7. Ensure responsive design across all device sizes

### Design Principles

- **Data Integrity**: All metrics must be calculated from actual database queries
- **Performance**: Initial page load < 2 seconds, chart rendering < 500ms
- **Reliability**: Graceful degradation when individual components fail
- **Accessibility**: WCAG 2.1 AA compliance for all interactive elements
- **Maintainability**: Clear separation of concerns between data fetching, calculation, and presentation

## Architecture

### Component Hierarchy

```
Reports (Main Container)
├── Tab Navigation
│   ├── Financial Tab
│   ├── Patients Tab
│   ├── Appointments Tab
│   ├── Inventory Tab
│   └── Analytics Tab (Default)
│
└── AnalyticsDashboard (Analytics Tab Content)
    ├── Header Section
    │   ├── Title & Last Updated
    │   ├── Refresh Button
    │   └── Export Button
    │
    ├── DateRangeFilter
    │   ├── Start Date Picker
    │   └── End Date Picker
    │
    ├── KPI Cards Grid (4 cards)
    │   ├── KPICard (Total Patients)
    │   ├── KPICard (Bed Occupancy Rate)
    │   ├── KPICard (Patient Satisfaction)
    │   └── KPICard (Total Revenue)
    │
    ├── Charts Grid (2x2 layout)
    │   ├── PatientDistributionChart (Donut)
    │   ├── RevenueTrendChart (Line)
    │   ├── ExpenseBreakdownChart (Stacked Bar)
    │   └── PerformanceComparisonChart (Radar)
    │
    └── Export Modal
        ├── PDF Export Option
        ├── Excel Export Option
        └── CSV Export Option
```

### Data Flow

```
User Action (Date Range Change)
    ↓
DateRangeFilter Component
    ↓
Update State (dateRange)
    ↓
useAnalytics Hook (Debounced 500ms)
    ↓
analyticsService (Parallel Queries)
    ↓
Supabase Database
    ├── patients table
    ├── rooms table
    ├── inpatients table
    ├── satisfaction_ratings table
    ├── billing table
    ├── consultations table
    ├── appointments table
    ├── inventory table
    └── dashboard_config table
    ↓
Data Aggregation & Calculation
    ↓
Cache (5-minute TTL)
    ↓
Update Component State
    ↓
Re-render Charts & KPIs
```

### Service Layer Architecture

```
analyticsService.js
├── Cache Management
│   ├── getCachedData()
│   ├── setCachedData()
│   └── clearCache()
│
├── Query Helpers
│   ├── queryWithTimeout()
│   ├── formatDatePH()
│   └── getPreviousPeriod()
│
├── KPI Metrics
│   ├── getKPIMetrics()
│   ├── getTotalPatients()
│   ├── getBedOccupancyRate()
│   ├── getPatientSatisfaction()
│   └── getTotalRevenue()
│
├── Chart Data
│   ├── getPatientDistribution()
│   ├── getRevenueTrend()
│   ├── getExpenseBreakdown()
│   └── getPerformanceMetrics()
│
└── Baseline Data
    └── getBaselineMetrics()
```

## Components and Interfaces

### 1. Reports Component (Main Container)

**Purpose**: Main container that manages tab navigation and renders appropriate report views.

**Props**: None (uses internal state)

**State**:
```typescript
{
  activeTab: 'financial' | 'patients' | 'appointments' | 'inventory' | 'analytics',
  loading: boolean,
  dateRange: { start: string, end: string },
  reportData: object | null
}
```

**Key Methods**:
- `loadReportData()`: Fetches data based on active tab
- `exportToCSV()`: Exports current tab data to CSV
- Tab-specific loaders: `loadFinancialReport()`, `loadPatientReport()`, etc.

**Modifications Needed**:
- Change default `activeTab` from 'financial' to 'analytics'
- Ensure Analytics tab doesn't trigger legacy report loading

### 2. AnalyticsDashboard Component

**Purpose**: Renders the complete analytics dashboard with KPIs and charts.

**Props**: None (self-contained)

**State**:
```typescript
{
  dateRange: { startDate: Date, endDate: Date },
  showExportModal: boolean,
  exporting: boolean,
  exportError: string | null
}
```

**Hooks Used**:
- `useAnalytics(dateRange)`: Fetches all analytics data
- `useState`: Local state management
- `useEffect`: Date range persistence to sessionStorage

**Key Methods**:
- `handleDateRangeChange(startDate, endDate)`: Updates date range
- `handleExport(format)`: Triggers export in specified format
- `formatLastUpdated(date)`: Formats timestamp for display

**Current Implementation**: Already complete, needs minor enhancements for accessibility

### 3. KPICard Component

**Purpose**: Displays a single KPI metric with growth indicator.

**Props**:
```typescript
{
  title: string,
  value: number,
  previousValue: number,
  format: 'number' | 'percentage' | 'rating' | 'currency'
}
```

**Computed Values**:
- `change`: value - previousValue
- `changePercentage`: ((value - previousValue) / previousValue) * 100
- `changeColor`: 'green' | 'red' | 'gray' based on change

**Rendering**:
- Icon (based on title)
- Metric value (formatted)
- Growth indicator (percentage with color)
- Subtitle (descriptive text)

**Enhancements Needed**:
- Add ARIA labels for screen readers
- Add three-dot menu for additional actions
- Ensure keyboard accessibility

### 4. PatientDistributionChart Component

**Purpose**: Displays patient distribution across departments as a donut chart.

**Props**:
```typescript
{
  data: Array<{
    department: string,
    count: number,
    percentage: number,
    color: string
  }>
}
```

**Chart Library**: Recharts (PieChart with innerRadius for donut effect)

**Features**:
- Center label showing total patient count
- Legend with percentages
- Hover tooltips
- Responsive sizing

**Enhancements Needed**:
- Add ARIA label describing chart
- Add three-dot menu for export/drill-down
- Ensure color contrast meets WCAG standards

### 5. RevenueTrendChart Component

**Purpose**: Displays revenue trends over time as a line chart.

**Props**:
```typescript
{
  data: Array<{
    period: string,
    revenue: number,
    date: Date
  }>
}
```

**Chart Library**: Recharts (LineChart)

**Features**:
- Monthly granularity dropdown
- Total revenue display above chart
- Hover tooltips with formatted currency
- Responsive sizing

**Enhancements Needed**:
- Add ARIA label describing chart
- Add three-dot menu for export
- Implement granularity filter (monthly/quarterly/yearly)

### 6. ExpenseBreakdownChart Component

**Purpose**: Displays expense breakdown by category as a stacked bar chart.

**Props**:
```typescript
{
  data: Array<{
    category: string,
    amount: number,
    percentage: number,
    color: string
  }>
}
```

**Chart Library**: Recharts (BarChart with stacked bars)

**Features**:
- Color-coded categories
- Legend with category names
- Total expense display with growth indicator
- Hover tooltips

**Enhancements Needed**:
- Add ARIA label describing chart
- Add three-dot menu for export
- Add monthly dropdown filter

### 7. PerformanceComparisonChart Component

**Purpose**: Displays hospital performance metrics compared to baseline as a radar chart.

**Props**:
```typescript
{
  data: {
    hospital: {
      patientSatisfaction: number,
      recoveryRate: number,
      emergencyResponse: number,
      followUpRate: number,
      treatmentSuccess: number
    },
    baseline: {
      patientSatisfaction: number,
      recoveryRate: number,
      emergencyResponse: number,
      followUpRate: number,
      treatmentSuccess: number
    }
  }
}
```

**Chart Library**: Recharts (RadarChart)

**Features**:
- Two overlapping radar lines (hospital vs baseline)
- 5 performance dimensions
- Legend showing "Your Hospital" and "Avg. Hospital"
- Hover tooltips

**Enhancements Needed**:
- Add ARIA label describing chart
- Add three-dot menu for export

### 8. DateRangeFilter Component

**Purpose**: Allows users to select start and end dates for filtering.

**Props**:
```typescript
{
  startDate: Date,
  endDate: Date,
  onChange: (startDate: Date, endDate: Date) => void
}
```

**Features**:
- Two date pickers (start and end)
- Validation (end date must be after start date)
- Quick select buttons (Last 7 days, Last 30 days, This Month, etc.)

**Enhancements Needed**:
- Ensure keyboard navigation works
- Add ARIA labels for date inputs
- Add validation error messages

### 9. useAnalytics Hook

**Purpose**: Custom hook that manages analytics data fetching and state.

**Parameters**:
```typescript
dateRange: { startDate: Date, endDate: Date }
```

**Returns**:
```typescript
{
  metrics: object | null,
  chartData: object | null,
  loading: boolean,
  error: object | null,
  lastUpdated: Date | null,
  refresh: () => void
}
```

**Features**:
- Automatic data fetching on mount and date range changes
- Debouncing (500ms) for date range changes
- Automatic refresh every 5 minutes
- Pause refresh when tab is inactive
- Resume refresh when tab becomes active
- Parallel data fetching for performance

**Current Implementation**: Already complete and robust

### 10. analyticsService

**Purpose**: Service layer that handles all database queries and data aggregation.

**Key Methods**:

#### getKPIMetrics(dateRange)
- Fetches all KPI metrics for current and previous periods
- Returns: `{ totalPatients, bedOccupancy, patientSatisfaction, totalRevenue }`
- Each metric includes: `{ current, previous, change, changePercentage }`

#### getPatientDistribution(dateRange)
- Queries consultations table grouped by doctor specialization
- Returns top 4 departments + "Others" category
- Returns: `Array<{ department, count, percentage, color }>`

#### getRevenueTrend(dateRange, granularity)
- Aggregates billing data by time period
- Supports monthly, quarterly, yearly granularity
- Returns: `Array<{ period, revenue, date }>`

#### getExpenseBreakdown(dateRange)
- Aggregates expenses from inventory and config tables
- Categories: Staff Salaries, Medical Supplies, Operational Costs, Pharmaceuticals, Miscellaneous
- Returns: `Array<{ category, amount, percentage, color }>`

#### getPerformanceMetrics(dateRange)
- Calculates 5 performance dimensions from multiple tables
- Returns: `{ patientSatisfaction, recoveryRate, emergencyResponse, followUpRate, treatmentSuccess }`

#### getBaselineMetrics()
- Fetches baseline metrics from dashboard_config table
- Used for performance comparison
- Returns same structure as getPerformanceMetrics

**Current Implementation**: Already complete with caching and error handling

### 11. exportService

**Purpose**: Handles data export to PDF, Excel, and CSV formats.

**Key Methods**:

#### exportToPDF(data, dateRange)
- Generates PDF report with all metrics and charts
- Uses jsPDF library
- Returns: Blob

#### exportToExcel(data, dateRange)
- Generates Excel workbook with multiple sheets
- Uses xlsx library
- Sheets: KPIs, Revenue, Expenses, Performance
- Returns: Blob

#### exportToCSV(data, dateRange)
- Generates CSV file with all data
- RFC 4180 compliant (proper escaping)
- Returns: Blob

#### generateFilename(format, dateRange)
- Creates timestamped filename
- Format: `RCMC_Analytics_Report_YYYY-MM-DD_HHMMSS.ext`
- Returns: string

#### downloadFile(blob, filename)
- Triggers browser download
- Creates temporary URL and link element

**Current Implementation**: Already complete with proper escaping and formatting

## Data Models

### KPI Metrics Model

```typescript
interface KPIMetrics {
  totalPatients: MetricValue;
  bedOccupancy: MetricValue;
  patientSatisfaction: MetricValue;
  totalRevenue: MetricValue;
}

interface MetricValue {
  current: number;
  previous: number;
  change: number;
  changePercentage: number;
}
```

**Data Sources**:
- `totalPatients`: COUNT from patients table filtered by date range and status='Active'
- `bedOccupancy`: (COUNT rooms WHERE status='Occupied') / (COUNT rooms) * 100
- `patientSatisfaction`: AVG(overall_rating) from satisfaction_ratings table
- `totalRevenue`: SUM(amount_paid) from billing table WHERE payment_status='Paid'

**Calculation Logic**:
- Current period: Data within selected date range
- Previous period: Equal-length period immediately before selected range
- Change: current - previous
- Change percentage: ((current - previous) / previous) * 100

### Patient Distribution Model

```typescript
interface PatientDistribution {
  department: string;
  count: number;
  percentage: number;
  color: string;
}
```

**Data Source**:
```sql
SELECT 
  d.specialization as department,
  COUNT(c.id) as count
FROM consultations c
INNER JOIN doctors d ON c.doctor_id = d.id
WHERE c.consultation_date >= :startDate 
  AND c.consultation_date <= :endDate
GROUP BY d.specialization
ORDER BY count DESC
```

**Processing**:
1. Get top 4 departments by count
2. Aggregate remaining departments into "Others"
3. Calculate percentages: (count / total) * 100
4. Assign colors from predefined palette

### Revenue Trend Model

```typescript
interface RevenueTrend {
  period: string;
  revenue: number;
  date: Date;
}
```

**Data Source**:
```sql
SELECT 
  amount_paid,
  created_at
FROM billing
WHERE payment_status = 'Paid'
  AND created_at >= :startDate
  AND created_at <= :endDate
ORDER BY created_at ASC
```

**Processing**:
1. Group by time period (monthly/quarterly/yearly)
2. Sum amount_paid for each period
3. Format period labels for display
4. Sort chronologically

### Expense Breakdown Model

```typescript
interface ExpenseBreakdown {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}
```

**Data Sources**:
- Staff Salaries: From dashboard_config.expense_budgets
- Medical Supplies: SUM(unit_price * quantity) from inventory WHERE category LIKE '%supply%'
- Operational Costs: From dashboard_config.expense_budgets
- Pharmaceuticals: SUM(unit_price * quantity) from inventory WHERE category LIKE '%medicine%'
- Miscellaneous: SUM(unit_price * quantity) from inventory WHERE category NOT IN above

**Processing**:
1. Fetch budget values from config
2. Calculate inventory costs by category
3. Sum all expenses for total
4. Calculate percentages: (amount / total) * 100
5. Sort by amount descending

### Performance Metrics Model

```typescript
interface PerformanceMetrics {
  patientSatisfaction: number;  // 0-5 scale
  recoveryRate: number;          // 0-5 scale
  emergencyResponse: number;     // 0-5 scale
  followUpRate: number;          // 0-5 scale
  treatmentSuccess: number;      // 0-5 scale
}
```

**Calculation Methods**:

1. **Patient Satisfaction**: AVG(overall_rating) from satisfaction_ratings
2. **Recovery Rate**: (COUNT consultations WHERE outcome LIKE '%recover%') / (COUNT consultations) * 5
3. **Emergency Response**: (COUNT appointments WHERE type='Emergency' AND status='Completed') / (COUNT appointments WHERE type='Emergency') * 5
4. **Follow-up Rate**: (COUNT appointments WHERE type='Follow-up' AND status='Completed') / (COUNT appointments WHERE type='Follow-up') * 5
5. **Treatment Success**: (COUNT consultations WHERE outcome LIKE '%success%' OR '%improved%') / (COUNT consultations) * 5

All metrics scaled to 0-5 for radar chart consistency.

### Database Schema Requirements

**Existing Tables Used**:
- `patients`: Patient records with status and created_at
- `rooms`: Room inventory with status (Occupied/Available)
- `inpatients`: Inpatient admissions
- `satisfaction_ratings`: Patient satisfaction surveys with overall_rating
- `billing`: Billing records with amount_paid, payment_status, created_at
- `consultations`: Consultation records with doctor_id, outcome, consultation_date
- `appointments`: Appointment records with type, status, appointment_date
- `inventory`: Inventory items with unit_price, quantity, category
- `doctors`: Doctor records with specialization

**New Table Required**:
```sql
CREATE TABLE IF NOT EXISTS dashboard_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  config_key TEXT UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert baseline metrics
INSERT INTO dashboard_config (config_key, config_value) VALUES
('baseline_metrics', '{
  "patientSatisfaction": 4.2,
  "recoveryRate": 4.5,
  "emergencyResponse": 3.8,
  "followUpRate": 4.0,
  "treatmentSuccess": 4.3
}'::jsonb),
('expense_budgets', '{
  "staff_salaries": 500000,
  "operational_costs": 200000
}'::jsonb);
```

**Indexes for Performance**:
```sql
-- Already exist in schema
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at);
CREATE INDEX IF NOT EXISTS idx_billing_created_at ON billing(created_at);
CREATE INDEX IF NOT EXISTS idx_consultations_date ON consultations(consultation_date);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_satisfaction_created_at ON satisfaction_ratings(created_at);
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified several areas of redundancy:

1. **KPI Calculation Properties (1.2-1.5)**: All four KPIs follow the same pattern - fetch data from database, aggregate, and calculate. These can be combined into a single comprehensive property about KPI calculation correctness.

2. **Performance Metric Calculations (5.3-5.7)**: All five performance metrics follow the same pattern - query database, filter/aggregate, scale to 0-5. These can be combined into one property.

3. **State Update Properties (6.2-6.3)**: Both test the same behavior (state updates on user input), just for different fields. Can be combined.

4. **Growth Indicator Properties (9.5-9.6, 1.7)**: All test conditional rendering based on growth value. Can be combined into one property.

5. **Responsive Layout Properties (10.1-10.3)**: All test the same responsive behavior at different breakpoints. Can be combined.

6. **Export Format Properties (7.3-7.4)**: Both test export functionality, just different formats. The underlying property is the same.

7. **Accessibility Properties (14.1-14.2)**: Both test ARIA label presence. Can be combined.

8. **Database Query Properties (8.1, 8.10)**: These are identical - testing that no hardcoded data is used.

After reflection, I've consolidated 50+ acceptance criteria into 25 unique, non-redundant properties.

### Property 1: KPI Metrics Database Calculation

*For any* date range, all KPI metrics (Total Patients, Bed Occupancy Rate, Patient Satisfaction, Total Revenue) should be calculated from live database queries with no hardcoded values, and each metric should include both current and previous period values.

**Validates: Requirements 1.2, 1.3, 1.4, 1.5, 8.1, 8.10**

### Property 2: Growth Percentage Calculation

*For any* current and previous metric values where previous is non-zero, the growth percentage should equal ((current - previous) / previous) * 100.

**Validates: Requirements 9.3**

### Property 3: Growth Indicator Rendering

*For any* growth percentage value, the growth indicator should display the correct color (green for positive, red for negative, gray for zero) and include both a symbol (+/-) and the percentage value.

**Validates: Requirements 1.7, 9.5, 9.6, 14.6**

### Property 4: Patient Distribution Percentage Calculation

*For any* set of patient counts by department, the calculated percentages should sum to 100% (within rounding tolerance of 0.1%), and each percentage should equal (department_count / total_count) * 100.

**Validates: Requirements 2.5**

### Property 5: Patient Distribution Aggregation

*For any* date range, querying the consultations table grouped by doctor specialization should return patient counts that match the sum of all consultations in that period.

**Validates: Requirements 2.2**

### Property 6: Revenue Trend Aggregation

*For any* date range and granularity (monthly/quarterly/yearly), aggregating payments by time period should produce a sum for each period that equals the total of all amount_paid values in that period where payment_status='Paid'.

**Validates: Requirements 3.2, 3.6**

### Property 7: Expense Categorization

*For any* inventory item, the categorization logic should assign it to exactly one category (Staff Salaries, Medical Supplies, Operational Costs, Pharmaceuticals, or Miscellaneous) based on its category field.

**Validates: Requirements 4.3**

### Property 8: Expense Aggregation

*For any* date range, the total expenses should equal the sum of all category expenses, and each category expense should be correctly calculated from its data source (config budgets or inventory costs).

**Validates: Requirements 4.2**

### Property 9: Performance Metrics Calculation

*For any* date range, all five performance metrics (Patient Satisfaction, Recovery Rate, Emergency Response, Follow-up Rate, Treatment Success) should be calculated from database queries and scaled to 0-5 range.

**Validates: Requirements 5.3, 5.4, 5.5, 5.6, 5.7**

### Property 10: Date Range State Updates

*For any* date selection (start or end), the DateRangeFilter component should update the corresponding state value and trigger a re-fetch of all dashboard metrics.

**Validates: Requirements 6.2, 6.3, 6.4**

### Property 11: Date Range Query Filtering

*For any* date range, all database queries should include WHERE clauses that filter by the appropriate date column (created_at, consultation_date, appointment_date, etc.) using the selected start and end dates.

**Validates: Requirements 6.5**

### Property 12: Previous Period Calculation

*For any* selected date range, the previous period should have the same duration and end exactly one day before the selected start date.

**Validates: Requirements 9.2**

### Property 13: Export Data Completeness

*For any* dashboard state and export format (CSV, Excel, PDF), the exported file should include all KPI values, all chart data, and the current date range.

**Validates: Requirements 7.3, 7.4, 7.6**

### Property 14: Export Filename Generation

*For any* date range and export format, the generated filename should include the format extension, a timestamp, and follow the pattern: RCMC_Analytics_Report_YYYY-MM-DD_HHMMSS.ext

**Validates: Requirements 7.5**

### Property 15: CSV Special Character Escaping

*For any* metric value containing special characters (commas, quotes, newlines), the CSV export should escape them according to RFC 4180 (wrap in quotes and double internal quotes).

**Validates: Requirements 16.2**

### Property 16: CSV Round-Trip Integrity

*For any* valid dashboard data, exporting to CSV then parsing then exporting again should produce an equivalent CSV structure (round-trip property).

**Validates: Requirements 18.2**

### Property 17: Responsive Grid Layout

*For any* viewport width, the KPI cards grid should display the correct number of columns: 4 columns for width >= 1024px, 2 columns for 768px <= width < 1024px, and 1 column for width < 768px.

**Validates: Requirements 10.1, 10.2, 10.3**

### Property 18: Debounced Data Fetching

*For any* sequence of date range changes within 500ms, only the final change should trigger a data fetch (debouncing property).

**Validates: Requirements 11.6**

### Property 19: Error State Display

*For any* database query failure, the affected component should display an error message and continue rendering other components that succeeded.

**Validates: Requirements 12.2**

### Property 20: Chart Tooltip Display

*For any* chart element, hovering over it should display a tooltip containing the detailed values for that element.

**Validates: Requirements 13.1**

### Property 21: Accessibility ARIA Labels

*For any* KPI card or chart component, the rendered output should include aria-label attributes that describe the metric/chart type and current value/data.

**Validates: Requirements 14.1, 14.2**

### Property 22: Donut Chart Center Display

*For any* patient distribution data, the donut chart should display the sum of all patient counts in the center of the chart.

**Validates: Requirements 2.3**

### Property 23: Chart Legend Display

*For any* chart with categorical data (patient distribution, expense breakdown), the legend should display all categories with their corresponding percentages or values.

**Validates: Requirements 2.4**

### Property 24: Current Period Metric Calculation

*For any* date range, the current period metrics should be calculated exclusively from data where the date column falls within the selected start and end dates (inclusive).

**Validates: Requirements 9.1**

### Property 25: Parallel Query Execution

*For all* independent metrics (KPIs, patient distribution, revenue trend, expense breakdown, performance metrics), the queries should be executed in parallel using Promise.all to minimize total fetch time.

**Validates: Requirements 11.4**

## Error Handling

### Error Categories

1. **Network Errors**: Failed database connections or timeouts
2. **Query Errors**: Invalid SQL or missing tables/columns
3. **Data Errors**: Unexpected data formats or null values
4. **Calculation Errors**: Division by zero or invalid operations
5. **Export Errors**: File generation failures

### Error Handling Strategy

#### Component-Level Error Boundaries

Each chart component and KPI card should handle its own errors independently:

```javascript
try {
  const data = await fetchData();
  renderChart(data);
} catch (error) {
  console.error('Chart error:', error);
  renderErrorState(error.message);
}
```

**Benefits**:
- One failing component doesn't crash the entire dashboard
- Users can still access working components
- Specific error messages for each component

#### Service-Level Error Handling

The analyticsService implements multiple layers of error handling:

1. **Query Timeout**: All queries have a 5-second timeout
   ```javascript
   const timeoutPromise = new Promise((_, reject) => {
     setTimeout(() => reject(new Error('Query timeout')), 5000);
   });
   return Promise.race([queryPromise, timeoutPromise]);
   ```

2. **Graceful Degradation**: Return default values on error
   ```javascript
   catch (error) {
     console.error('Error fetching metric:', error);
     return 0; // or appropriate default
   }
   ```

3. **Error Logging**: All errors logged to console with context
   ```javascript
   console.error('Error fetching KPI metrics:', error);
   throw new Error(`Failed to fetch KPI metrics: ${error.message}`);
   ```

#### Hook-Level Error Handling

The useAnalytics hook provides error state to components:

```javascript
const { metrics, chartData, loading, error, refresh } = useAnalytics(dateRange);

if (error) {
  return (
    <ErrorDisplay 
      message={error.message} 
      onRetry={refresh} 
    />
  );
}
```

**Error Object Structure**:
```typescript
{
  type: 'fetch_error' | 'calculation_error' | 'export_error',
  message: string,
  details?: any
}
```

### User-Facing Error Messages

All error messages should be:
- **User-friendly**: No technical jargon or stack traces
- **Actionable**: Suggest what the user can do
- **Specific**: Indicate which component failed

**Examples**:
- ❌ "Error: Cannot read property 'length' of undefined"
- ✅ "Unable to load patient distribution data. Please try again."

- ❌ "Query timeout after 5000ms"
- ✅ "The request is taking longer than expected. Please check your connection and try again."

### Retry Mechanism

Components should provide a retry button when errors are recoverable:

```javascript
<div className="error-state">
  <p>{error.message}</p>
  <button onClick={refresh}>Retry</button>
</div>
```

**Retry Logic**:
- Clear error state before retry
- Show loading state during retry
- Limit retry attempts to prevent infinite loops (max 3 attempts)

### Empty State Handling

When queries succeed but return no data:

```javascript
if (!data || data.length === 0) {
  return (
    <div className="empty-state">
      <p>No data available for the selected date range</p>
      <p>Try selecting a different date range</p>
    </div>
  );
}
```

### Export Error Handling

Export operations have specific error handling:

```javascript
try {
  const blob = await exportService.exportToPDF(data, dateRange);
  downloadFile(blob, filename);
} catch (error) {
  setExportError('Failed to generate PDF. Please try again.');
  console.error('Export error:', error);
}
```

**Export Error Display**:
- Show error message in export modal
- Keep modal open so user can try different format
- Log detailed error to console for debugging

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

- **Unit Tests**: Verify specific examples, edge cases, and error conditions
- **Property Tests**: Verify universal properties across all inputs

Together, these provide comprehensive coverage where unit tests catch concrete bugs and property tests verify general correctness.

### Unit Testing

**Framework**: Jest + React Testing Library

**Test Categories**:

1. **Component Rendering Tests**
   - KPI cards render with correct structure
   - Charts render without errors
   - Date range filter displays correctly
   - Export modal shows all format options

2. **User Interaction Tests**
   - Date selection updates state
   - Export button opens modal
   - Refresh button triggers data fetch
   - Chart hover shows tooltips

3. **Edge Case Tests**
   - Empty data sets display "No data available"
   - Zero previous value shows "N/A" for growth
   - Invalid date ranges show validation errors
   - Network errors display error messages

4. **Integration Tests**
   - Date range change triggers all queries
   - Export includes all current data
   - Tab visibility pauses/resumes refresh
   - Session storage persists date range

**Example Unit Test**:
```javascript
describe('KPICard', () => {
  it('should display growth indicator with correct color', () => {
    const { getByText } = render(
      <KPICard 
        title="Total Patients"
        value={150}
        previousValue={100}
        format="number"
      />
    );
    
    const growth = getByText('+50.0%');
    expect(growth).toHaveClass('text-green-600');
  });
  
  it('should display N/A when previous value is zero', () => {
    const { getByText } = render(
      <KPICard 
        title="Total Patients"
        value={150}
        previousValue={0}
        format="number"
      />
    );
    
    expect(getByText('N/A')).toBeInTheDocument();
  });
});
```

### Property-Based Testing

**Framework**: fast-check (JavaScript property-based testing library)

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with feature name and property number
- Tag format: `Feature: reports-analytics-dashboard-transformation, Property {number}: {property_text}`

**Property Test Categories**:

1. **Calculation Properties**
   - Growth percentage formula
   - Percentage sum to 100%
   - Previous period duration
   - Metric aggregations

2. **Data Transformation Properties**
   - CSV escaping round-trip
   - Date range filtering
   - Category assignment
   - Expense aggregation

3. **Rendering Properties**
   - Responsive grid columns
   - Growth indicator color/symbol
   - ARIA label presence
   - Tooltip display

**Example Property Test**:
```javascript
import fc from 'fast-check';

describe('Property 2: Growth Percentage Calculation', () => {
  // Feature: reports-analytics-dashboard-transformation, Property 2: Growth percentage calculation
  it('should correctly calculate growth percentage for any non-zero previous value', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0.01, max: 10000 }), // current
        fc.float({ min: 0.01, max: 10000 }), // previous (non-zero)
        (current, previous) => {
          const expected = ((current - previous) / previous) * 100;
          const actual = calculateGrowthPercentage(current, previous);
          
          // Allow small floating point tolerance
          expect(Math.abs(actual - expected)).toBeLessThan(0.01);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 4: Patient Distribution Percentage Calculation', () => {
  // Feature: reports-analytics-dashboard-transformation, Property 4: Percentage sum
  it('should have percentages sum to 100% for any distribution', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 1000 }), { minLength: 1, maxLength: 10 }),
        (counts) => {
          const distribution = calculateDistribution(counts);
          const sum = distribution.reduce((acc, d) => acc + d.percentage, 0);
          
          // Allow 0.1% tolerance for rounding
          expect(Math.abs(sum - 100)).toBeLessThan(0.1);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 15: CSV Special Character Escaping', () => {
  // Feature: reports-analytics-dashboard-transformation, Property 15: CSV escaping
  it('should properly escape special characters in CSV values', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (value) => {
          const escaped = escapeCSV(value);
          
          // If value contains special chars, should be quoted
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            expect(escaped).toMatch(/^".*"$/);
          }
          
          // Internal quotes should be doubled
          if (value.includes('"')) {
            expect(escaped).toContain('""');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 16: CSV Round-Trip Integrity', () => {
  // Feature: reports-analytics-dashboard-transformation, Property 16: CSV round-trip
  it('should preserve data through export-parse-export cycle', () => {
    fc.assert(
      fc.property(
        fc.record({
          metrics: fc.record({
            totalPatients: fc.integer({ min: 0, max: 10000 }),
            revenue: fc.float({ min: 0, max: 1000000 })
          }),
          chartData: fc.array(fc.record({
            label: fc.string(),
            value: fc.float({ min: 0, max: 1000 })
          }))
        }),
        (data) => {
          const csv1 = exportToCSV(data);
          const parsed = parseCSV(csv1);
          const csv2 = exportToCSV(parsed);
          
          expect(csv2).toEqual(csv1);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 17: Responsive Grid Layout', () => {
  // Feature: reports-analytics-dashboard-transformation, Property 17: Responsive layout
  it('should display correct number of columns for any viewport width', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 2560 }),
        (width) => {
          const columns = getGridColumns(width);
          
          if (width >= 1024) {
            expect(columns).toBe(4);
          } else if (width >= 768) {
            expect(columns).toBe(2);
          } else {
            expect(columns).toBe(1);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 18: Debounced Data Fetching', () => {
  // Feature: reports-analytics-dashboard-transformation, Property 18: Debouncing
  it('should only fetch once for rapid date changes', async () => {
    fc.assert(
      fc.asyncProperty(
        fc.array(fc.date(), { minLength: 2, maxLength: 10 }),
        async (dates) => {
          const fetchSpy = jest.fn();
          const debouncedFetch = debounce(fetchSpy, 500);
          
          // Trigger multiple changes rapidly
          dates.forEach(date => debouncedFetch(date));
          
          // Wait for debounce delay
          await new Promise(resolve => setTimeout(resolve, 600));
          
          // Should only fetch once with last date
          expect(fetchSpy).toHaveBeenCalledTimes(1);
          expect(fetchSpy).toHaveBeenCalledWith(dates[dates.length - 1]);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Test Coverage Goals

- **Line Coverage**: > 80%
- **Branch Coverage**: > 75%
- **Function Coverage**: > 85%
- **Property Test Iterations**: 100 per property

### Testing Best Practices

1. **Isolation**: Each test should be independent and not rely on others
2. **Clarity**: Test names should clearly describe what is being tested
3. **Speed**: Unit tests should run in < 5 seconds total
4. **Reliability**: Tests should not be flaky or dependent on timing
5. **Maintainability**: Tests should be easy to update when requirements change

### Continuous Integration

All tests should run automatically on:
- Every commit to feature branch
- Every pull request
- Before deployment to production

**CI Pipeline**:
1. Run linter (ESLint)
2. Run unit tests (Jest)
3. Run property tests (fast-check)
4. Generate coverage report
5. Fail build if coverage < 80%

## Implementation Plan

### Phase 1: Infrastructure Setup (Already Complete)

✅ Analytics service layer with database queries
✅ useAnalytics hook with automatic refresh
✅ Export service with PDF/Excel/CSV support
✅ All chart components (KPI, Distribution, Revenue, Expense, Performance)
✅ Date range filter component
✅ Caching with 5-minute TTL

### Phase 2: Component Enhancements (Required)

1. **Make Analytics Tab Default**
   - Change initial `activeTab` state from 'financial' to 'analytics'
   - Update tab order to show Analytics first

2. **Add Accessibility Features**
   - Add ARIA labels to all KPI cards
   - Add ARIA labels to all charts
   - Ensure keyboard navigation works for date pickers
   - Add focus indicators for interactive elements

3. **Add Three-Dot Menus**
   - Add menu to KPI cards for additional actions
   - Add menu to charts for export/drill-down options
   - Implement menu dropdown component

4. **Enhance Error Handling**
   - Add retry buttons to error states
   - Improve error messages for user-friendliness
   - Add empty state messages for no data

5. **Add Loading States**
   - Add skeleton loaders for KPI cards
   - Add skeleton loaders for charts
   - Ensure smooth transitions between loading and loaded states

### Phase 3: Database Setup (Required)

1. **Create dashboard_config Table**
   ```sql
   CREATE TABLE IF NOT EXISTS dashboard_config (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     config_key TEXT UNIQUE NOT NULL,
     config_value JSONB NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

2. **Insert Baseline Data**
   ```sql
   INSERT INTO dashboard_config (config_key, config_value) VALUES
   ('baseline_metrics', '{
     "patientSatisfaction": 4.2,
     "recoveryRate": 4.5,
     "emergencyResponse": 3.8,
     "followUpRate": 4.0,
     "treatmentSuccess": 4.3
   }'::jsonb),
   ('expense_budgets', '{
     "staff_salaries": 500000,
     "operational_costs": 200000
   }'::jsonb);
   ```

3. **Verify Indexes**
   - Ensure all date columns have indexes
   - Add composite indexes if needed for performance

### Phase 4: Testing (Required)

1. **Write Unit Tests**
   - Component rendering tests
   - User interaction tests
   - Edge case tests
   - Integration tests

2. **Write Property Tests**
   - Calculation properties
   - Data transformation properties
   - Rendering properties
   - Round-trip properties

3. **Manual Testing**
   - Test on different screen sizes
   - Test with screen readers
   - Test keyboard navigation
   - Test with slow network
   - Test with empty database

### Phase 5: Performance Optimization (Optional)

1. **Query Optimization**
   - Review query execution plans
   - Add indexes where needed
   - Optimize aggregation queries

2. **Caching Strategy**
   - Verify 5-minute TTL is appropriate
   - Consider longer TTL for baseline metrics
   - Implement cache invalidation on data changes

3. **Bundle Optimization**
   - Code splitting for chart libraries
   - Lazy loading for export functionality
   - Tree shaking for unused code

### Phase 6: Documentation (Required)

1. **User Documentation**
   - How to use the analytics dashboard
   - How to interpret each metric
   - How to export data

2. **Developer Documentation**
   - Architecture overview
   - How to add new metrics
   - How to add new charts
   - Testing guidelines

3. **API Documentation**
   - analyticsService methods
   - exportService methods
   - Hook interfaces

## Success Criteria

The feature will be considered complete when:

1. ✅ Analytics tab is the default view in Reports page
2. ✅ All metrics are calculated from live database queries (no hardcoded values)
3. ✅ All four KPI cards display with growth indicators
4. ✅ All four charts render correctly with real data
5. ✅ Date range filtering works and updates all metrics
6. ✅ Export functionality works for PDF, Excel, and CSV
7. ✅ Automatic refresh works every 5 minutes
8. ✅ Tab visibility detection pauses/resumes refresh
9. ✅ Error handling displays user-friendly messages
10. ✅ Loading states show skeleton loaders
11. ✅ Responsive design works on all screen sizes
12. ✅ Accessibility features meet WCAG 2.1 AA standards
13. ✅ Initial page load completes in < 2 seconds
14. ✅ Chart rendering completes in < 500ms
15. ✅ All unit tests pass with > 80% coverage
16. ✅ All property tests pass with 100 iterations each
17. ✅ Manual testing confirms all functionality works
18. ✅ Documentation is complete and accurate

## Risks and Mitigation

### Risk 1: Performance Degradation with Large Datasets

**Impact**: High
**Probability**: Medium

**Mitigation**:
- Implement pagination for large result sets
- Add database indexes on all date columns
- Use query timeouts to prevent long-running queries
- Cache expensive calculations
- Use parallel queries to minimize total fetch time

### Risk 2: Inaccurate Metrics Due to Data Quality Issues

**Impact**: High
**Probability**: Medium

**Mitigation**:
- Validate data before calculations
- Handle null/undefined values gracefully
- Log data quality issues for investigation
- Provide data validation tools for administrators
- Display data quality warnings when detected

### Risk 3: Export Failures with Large Datasets

**Impact**: Medium
**Probability**: Low

**Mitigation**:
- Implement streaming for large exports
- Add progress indicators for long exports
- Limit export size or add pagination
- Provide error messages with retry option
- Test with maximum expected data volume

### Risk 4: Browser Compatibility Issues

**Impact**: Medium
**Probability**: Low

**Mitigation**:
- Test on all supported browsers (Chrome, Firefox, Safari, Edge)
- Use polyfills for missing features
- Provide fallback UI for unsupported features
- Display browser compatibility warnings
- Document minimum browser versions

### Risk 5: Accessibility Compliance Gaps

**Impact**: Medium
**Probability**: Medium

**Mitigation**:
- Use automated accessibility testing tools
- Conduct manual testing with screen readers
- Follow WCAG 2.1 AA guidelines strictly
- Get accessibility review from expert
- Provide alternative text for all visual elements

## Future Enhancements

### Phase 2 Features (Post-Launch)

1. **Custom Date Range Presets**
   - Last 7 days, Last 30 days, This Month, Last Month, etc.
   - Save custom date ranges for quick access

2. **Drill-Down Functionality**
   - Click chart segments to see detailed data
   - Navigate to related reports
   - Filter other charts based on selection

3. **Scheduled Reports**
   - Email reports on schedule (daily, weekly, monthly)
   - Customize report content and format
   - Manage report subscriptions

4. **Dashboard Customization**
   - Drag and drop to rearrange components
   - Show/hide specific charts
   - Save custom dashboard layouts

5. **Comparative Analysis**
   - Compare multiple time periods side-by-side
   - Year-over-year comparisons
   - Trend analysis with forecasting

6. **Real-Time Updates**
   - WebSocket connection for live data
   - Animated transitions for data changes
   - Notification badges for significant changes

7. **Advanced Filters**
   - Filter by doctor, department, patient type
   - Multiple filter combinations
   - Save filter presets

8. **Data Annotations**
   - Add notes to specific data points
   - Mark significant events on charts
   - Share annotations with team

9. **Mobile App**
   - Native mobile app for iOS and Android
   - Push notifications for alerts
   - Offline mode with sync

10. **AI-Powered Insights**
    - Automatic anomaly detection
    - Predictive analytics
    - Natural language queries

## Conclusion

This design provides a comprehensive transformation of the Reports page into a full-featured analytics dashboard. The existing infrastructure (components, hooks, services) is already robust and well-implemented. The main work required is:

1. Making Analytics the default tab
2. Adding accessibility features (ARIA labels, keyboard navigation)
3. Creating the dashboard_config database table
4. Writing comprehensive tests (unit and property-based)
5. Enhancing error handling and loading states

The design follows best practices for:
- **Data Integrity**: All metrics from live database queries
- **Performance**: Parallel queries, caching, debouncing
- **Reliability**: Graceful error handling, automatic retry
- **Accessibility**: WCAG 2.1 AA compliance
- **Maintainability**: Clear separation of concerns, comprehensive testing

The property-based testing approach ensures correctness across all possible inputs, while unit tests verify specific behaviors and edge cases. Together, they provide confidence that the dashboard will work correctly in all scenarios.
