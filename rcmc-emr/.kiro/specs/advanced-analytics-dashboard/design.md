# Design Document: Advanced Analytics Dashboard

## Overview

The Advanced Analytics Dashboard transforms the existing Reports page into a comprehensive healthcare analytics platform featuring real-time KPI metrics, interactive visualizations, and data export capabilities. This design leverages React with Recharts for visualizations, Supabase for data persistence, and Tailwind CSS for responsive styling.

### Design Goals

- Provide at-a-glance visibility into critical hospital metrics
- Enable data-driven decision making through interactive visualizations
- Support multiple time-range analyses with flexible date filtering
- Ensure responsive design across desktop, tablet, and mobile devices
- Optimize performance for large datasets through caching and lazy loading
- Maintain data accuracy and consistency across all metrics

### Key Features

1. **KPI Metric Cards**: Four top-level indicators (Total Patients, Bed Occupancy, Patient Satisfaction, Total Revenue)
2. **Patient Distribution Chart**: Donut chart showing department-wise patient allocation
3. **Revenue Trends**: Line chart with time-series revenue analysis
4. **Expense Tracking**: Bar chart categorizing hospital expenses
5. **Performance Comparison**: Radar chart comparing hospital metrics against baselines
6. **Interactive Filtering**: Date range selector with preset options
7. **Data Export**: PDF, Excel, and CSV export functionality
8. **Real-time Updates**: Automatic data refresh every 5 minutes

## Architecture

### Component Hierarchy

```
Dashboard (Container)
├── DashboardHeader
│   ├── DateRangeFilter
│   ├── RefreshButton
│   └── ExportButton
├── KPIMetricsRow
│   ├── KPICard (Total Patients)
│   ├── KPICard (Bed Occupancy)
│   ├── KPICard (Patient Satisfaction)
│   └── KPICard (Total Revenue)
├── ChartsGrid
│   ├── PatientDistributionChart (Donut)
│   ├── RevenueTrendChart (Line)
│   ├── ExpenseBreakdownChart (Bar)
│   └── PerformanceComparisonChart (Radar)
└── LoadingState / ErrorBoundary
```

### Data Flow Architecture

```
User Interaction
    ↓
Dashboard Component (State Management)
    ↓
Data Service Layer (src/services/analyticsService.js)
    ↓
Supabase Client (src/lib/supabase.js)
    ↓
Database Queries (with caching)
    ↓
Metric Calculator (aggregations & transformations)
    ↓
Chart Components (Recharts)
    ↓
Rendered Visualizations
```

### State Management Strategy

The dashboard will use React hooks for local state management:

- `useState` for component-level state (filters, loading states, data)
- `useEffect` for data fetching and real-time updates
- `useMemo` for expensive calculations (metric aggregations)
- `useCallback` for memoized event handlers
- Custom hook `useAnalytics` to encapsulate data fetching logic

### Technology Stack

- **Frontend Framework**: React 18.2.0
- **Charting Library**: Recharts 2.15.4
- **Styling**: Tailwind CSS 3.4.1
- **Database**: Supabase (PostgreSQL)
- **Export Libraries**: 
  - jsPDF 2.5.1 (PDF generation)
  - xlsx 0.18.5 (Excel export)
- **Icons**: Lucide React 0.344.0

## Components and Interfaces

### 1. Dashboard Container Component

**File**: `src/pages/Dashboard.jsx` (redesign existing)

**Props**: None (uses routing context)

**State**:
```typescript
interface DashboardState {
  dateRange: { startDate: Date; endDate: Date }
  metrics: KPIMetrics
  chartData: ChartDataSets
  loading: boolean
  error: Error | null
  lastUpdated: Date
  autoRefreshEnabled: boolean
}
```

**Key Methods**:
- `loadDashboardData()`: Fetches all metrics and chart data
- `handleDateRangeChange(startDate, endDate)`: Updates date filter
- `handleRefresh()`: Manually triggers data reload
- `handleExport(format)`: Initiates export process

### 2. KPICard Component

**File**: `src/components/analytics/KPICard.jsx` (new)

**Props**:
```typescript
interface KPICardProps {
  title: string
  value: number | string
  previousValue: number
  format: 'number' | 'currency' | 'percentage' | 'rating'
  icon: LucideIcon
  iconColor: string
  trend?: 'up' | 'down' | 'neutral'
  trendPercentage?: number
  description?: string
}
```

**Rendering Logic**:
- Displays formatted value based on `format` prop
- Calculates and displays trend indicator
- Shows percentage change with color coding (green for positive, red for negative)
- Applies appropriate number formatting (₱ for currency, % for percentage, X.X/5.0 for ratings)

### 3. DateRangeFilter Component

**File**: `src/components/analytics/DateRangeFilter.jsx` (new)

**Props**:
```typescript
interface DateRangeFilterProps {
  startDate: Date
  endDate: Date
  onChange: (startDate: Date, endDate: Date) => void
  presets: DatePreset[]
}

interface DatePreset {
  label: string
  getValue: () => { startDate: Date; endDate: Date }
}
```

**Features**:
- Two date pickers (start and end)
- Preset buttons: "This Month", "Last Month", "Last 3 Months", "Last 6 Months", "This Year"
- Validation to ensure end date >= start date
- Session storage persistence

### 4. Chart Components

#### PatientDistributionChart

**File**: `src/components/analytics/PatientDistributionChart.jsx` (new)

**Props**:
```typescript
interface PatientDistributionChartProps {
  data: DepartmentData[]
  totalPatients: number
  onSegmentClick?: (department: string) => void
}

interface DepartmentData {
  department: string
  count: number
  percentage: number
  color: string
}
```

**Chart Type**: Recharts `<PieChart>` with `innerRadius` for donut effect

**Features**:
- Center label showing total patient count
- Legend with department names and percentages
- Hover tooltips with detailed information
- Click interaction for drill-down filtering

#### RevenueTrendChart

**File**: `src/components/analytics/RevenueTrendChart.jsx` (new)

**Props**:
```typescript
interface RevenueTrendChartProps {
  data: RevenueTrendData[]
  timeGranularity: 'monthly' | 'quarterly' | 'yearly'
  onTimeGranularityChange: (granularity: string) => void
  onDataPointClick?: (dataPoint: RevenueTrendData) => void
}

interface RevenueTrendData {
  period: string
  revenue: number
  date: Date
}
```

**Chart Type**: Recharts `<LineChart>` with smooth curves

**Features**:
- Smooth curve interpolation
- Formatted Y-axis (₱450K format)
- Formatted X-axis (Month YYYY)
- Hover tooltips with exact values
- Highlighted most recent data point
- Time granularity dropdown selector
- Zoom functionality for detailed analysis

#### ExpenseBreakdownChart

**File**: `src/components/analytics/ExpenseBreakdownChart.jsx` (new)

**Props**:
```typescript
interface ExpenseBreakdownChartProps {
  data: ExpenseData[]
  totalExpenses: number
  previousPeriodTotal: number
  onCategoryClick?: (category: string) => void
}

interface ExpenseData {
  category: string
  amount: number
  color: string
  percentage: number
}
```

**Chart Type**: Recharts `<BarChart>` with horizontal bars

**Features**:
- Horizontal bar layout
- Amount labels at bar ends
- Distinct color coding per category
- Sorted by amount (descending)
- Total expenses display with trend
- Click interaction for itemized breakdown

#### PerformanceComparisonChart

**File**: `src/components/analytics/PerformanceComparisonChart.jsx` (new)

**Props**:
```typescript
interface PerformanceComparisonChartProps {
  hospitalData: PerformanceMetrics
  baselineData: PerformanceMetrics
  onMetricClick?: (metric: string) => void
}

interface PerformanceMetrics {
  patientSatisfaction: number
  recoveryRate: number
  emergencyResponse: number
  followUpRate: number
  treatmentSuccess: number
}
```

**Chart Type**: Recharts `<RadarChart>`

**Features**:
- Two overlaid polygons (hospital vs baseline)
- Distinct colors (blue for hospital, gray for baseline)
- All metrics scaled to 0-5 range
- Metric labels at axis points
- Hover tooltips with exact values
- Legend for data series

### 5. Export Service

**File**: `src/services/exportService.js` (new)

**Interface**:
```typescript
interface ExportService {
  exportToPDF(data: DashboardData, dateRange: DateRange): Promise<Blob>
  exportToExcel(data: DashboardData, dateRange: DateRange): Promise<Blob>
  exportToCSV(data: DashboardData, dateRange: DateRange): Promise<Blob>
}
```

**Methods**:

- `exportToPDF()`: Uses jsPDF to generate PDF with charts (via html2canvas for chart rendering)
- `exportToExcel()`: Uses xlsx library to create multi-sheet workbook
- `exportToCSV()`: Generates RFC 4180 compliant CSV files
- `generateFilename(format, dateRange)`: Creates timestamped filename

**Export Format**:
- Filename: `RCMC_Analytics_Report_YYYY-MM-DD_HHMMSS.{ext}`
- PDF: Includes hospital logo, all charts, and formatted metrics
- Excel: Separate sheets for KPIs, Revenue, Expenses, Performance
- CSV: Multiple files zipped together (one per data category)

### 6. Analytics Service

**File**: `src/services/analyticsService.js` (new)

**Interface**:
```typescript
interface AnalyticsService {
  getKPIMetrics(dateRange: DateRange): Promise<KPIMetrics>
  getPatientDistribution(dateRange: DateRange): Promise<DepartmentData[]>
  getRevenueTrend(dateRange: DateRange, granularity: string): Promise<RevenueTrendData[]>
  getExpenseBreakdown(dateRange: DateRange): Promise<ExpenseData[]>
  getPerformanceMetrics(dateRange: DateRange): Promise<PerformanceMetrics>
  getBaselineMetrics(): Promise<PerformanceMetrics>
}
```

**Caching Strategy**:
- In-memory cache with 5-minute TTL
- Cache key includes date range and query parameters
- Automatic cache invalidation on data mutations

## Data Models

### Database Schema Extensions

#### dashboard_config Table (new)

```sql
CREATE TABLE dashboard_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  schema_version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Purpose**: Stores dashboard configuration including baseline comparison values and expense budget allocations.

**Example Data**:
```json
{
  "baseline_metrics": {
    "patientSatisfaction": 4.2,
    "recoveryRate": 4.5,
    "emergencyResponse": 3.8,
    "followUpRate": 4.0,
    "treatmentSuccess": 4.3
  },
  "expense_budgets": {
    "staff_salaries": 500000,
    "operational_costs": 200000
  }
}
```

#### Indexes for Performance

```sql
-- Optimize billing queries by date
CREATE INDEX idx_billing_created_at ON billing(created_at);
CREATE INDEX idx_billing_payment_status ON billing(payment_status);

-- Optimize consultations queries
CREATE INDEX idx_consultations_date ON consultations(consultation_date);
CREATE INDEX idx_consultations_doctor_id ON consultations(doctor_id);

-- Optimize appointments queries
CREATE INDEX idx_appointments_date ON appointments(appointment_date);

-- Optimize satisfaction ratings queries
CREATE INDEX idx_satisfaction_created_at ON satisfaction_ratings(created_at);
```

### Data Aggregation Queries

#### KPI Metrics Query

```sql
-- Total Patients (for date range)
SELECT COUNT(DISTINCT id) as total_patients
FROM patients
WHERE created_at BETWEEN $1 AND $2
  AND status = 'Active';

-- Bed Occupancy Rate
SELECT 
  COUNT(CASE WHEN status = 'Occupied' THEN 1 END)::FLOAT / 
  COUNT(*)::FLOAT * 100 as occupancy_rate
FROM rooms;

-- Patient Satisfaction Average
SELECT AVG(overall_rating) as avg_satisfaction
FROM satisfaction_ratings
WHERE created_at BETWEEN $1 AND $2;

-- Total Revenue
SELECT SUM(amount_paid) as total_revenue
FROM billing
WHERE created_at BETWEEN $1 AND $2
  AND payment_status = 'Paid';
```

#### Patient Distribution Query

```sql
SELECT 
  d.specialization as department,
  COUNT(c.id) as patient_count,
  ROUND(COUNT(c.id)::NUMERIC / SUM(COUNT(c.id)) OVER () * 100, 1) as percentage
FROM consultations c
JOIN doctors d ON c.doctor_id = d.id
WHERE c.consultation_date BETWEEN $1 AND $2
GROUP BY d.specialization
ORDER BY patient_count DESC
LIMIT 5;
```

#### Revenue Trend Query

```sql
SELECT 
  TO_CHAR(created_at, 'YYYY-MM') as month,
  SUM(amount_paid) as revenue
FROM billing
WHERE created_at BETWEEN $1 AND $2
  AND payment_status = 'Paid'
GROUP BY TO_CHAR(created_at, 'YYYY-MM')
ORDER BY month;
```

#### Expense Breakdown Query

```sql
-- Staff Salaries (from config or payroll if available)
-- Medical Supplies (from inventory purchases)
SELECT 
  SUM(unit_price * quantity) as medical_supplies_cost
FROM inventory
WHERE created_at BETWEEN $1 AND $2;

-- Pharmaceuticals (from inventory where category = 'Medicine')
SELECT 
  SUM(unit_price * quantity) as pharmaceutical_cost
FROM inventory
WHERE category = 'Medicine'
  AND created_at BETWEEN $1 AND $2;
```

#### Performance Metrics Queries

```sql
-- Recovery Rate
SELECT 
  COUNT(CASE WHEN outcome = 'Recovered' THEN 1 END)::FLOAT /
  COUNT(*)::FLOAT * 5 as recovery_rate_scaled
FROM consultations
WHERE consultation_date BETWEEN $1 AND $2;

-- Emergency Response Time
SELECT 
  AVG(EXTRACT(EPOCH FROM (actual_start_time - appointment_time)) / 60) as avg_response_minutes
FROM appointments
WHERE appointment_type = 'Emergency'
  AND appointment_date BETWEEN $1 AND $2;

-- Follow-up Rate
SELECT 
  COUNT(CASE WHEN status = 'Completed' THEN 1 END)::FLOAT /
  COUNT(*)::FLOAT * 5 as followup_rate_scaled
FROM appointments
WHERE appointment_type = 'Follow-up'
  AND appointment_date BETWEEN $1 AND $2;
```

### TypeScript Interfaces

```typescript
interface KPIMetrics {
  totalPatients: {
    current: number
    previous: number
    change: number
    changePercentage: number
  }
  bedOccupancy: {
    current: number
    previous: number
    change: number
    changePercentage: number
  }
  patientSatisfaction: {
    current: number
    previous: number
    change: number
    changePercentage: number
  }
  totalRevenue: {
    current: number
    previous: number
    change: number
    changePercentage: number
  }
}

interface DateRange {
  startDate: Date
  endDate: Date
}

interface ChartDataSets {
  patientDistribution: DepartmentData[]
  revenueTrend: RevenueTrendData[]
  expenseBreakdown: ExpenseData[]
  performanceComparison: {
    hospital: PerformanceMetrics
    baseline: PerformanceMetrics
  }
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies and consolidations:

**Redundancy Analysis**:
- Properties 1.10, 1.11, 1.12 (formatting rules) can be consolidated into a single comprehensive formatting property
- Properties 1.8 and 1.9 (trend indicators) can be combined into one property about conditional styling
- Properties 4.3-4.7 (expense calculations) are all similar calculation rules that can be combined
- Properties 5.3-5.7 (performance metric calculations) can be combined into one property
- Properties 11.11, 11.12, 11.13 (rounding rules) can be consolidated
- Properties 7.6, 7.7, 7.8 (filename formatting) can be combined into one comprehensive property
- Properties 14.2 and 14.1 overlap (CSV escaping is part of RFC 4180 compliance)

**Consolidated Properties**:
The following properties represent unique validation value after removing redundancies:

### Property 1: KPI Metric Calculations

*For any* date range, calculating Total Patients should count all active patients with created_at within that range, Bed Occupancy should divide occupied beds by total beds, Patient Satisfaction should average all satisfaction ratings within the range, and Total Revenue should sum all amount_paid values from paid billing records within the range.

**Validates: Requirements 1.2, 1.3, 1.4, 1.5**

### Property 2: Percentage Change Calculation

*For any* two time periods (current and previous), the percentage change should be calculated as ((current - previous) / previous) * 100, and this formula should be applied consistently to all KPI metrics.

**Validates: Requirements 1.7**

### Property 3: Value Formatting Consistency

*For any* numeric value displayed on the dashboard, currency values should be formatted with ₱ and thousand separators, percentages should have one decimal place, and satisfaction scores should be formatted as X.X/5.0.

**Validates: Requirements 1.10, 1.11, 1.12**

### Property 4: Trend Indicator Styling

*For any* KPI metric, when the value increases from the previous period, the indicator should display with green styling, and when it decreases, the indicator should display with red styling.

**Validates: Requirements 1.8, 1.9**

### Property 5: KPI Card Information Completeness

*For any* KPI card, it should display the current value, percentage change from the previous period, and a trend indicator.

**Validates: Requirements 1.6**

### Property 6: Department Distribution Percentage Sum

*For any* patient distribution data, the sum of all department percentages should equal 100% (within 0.1% tolerance for rounding).

**Validates: Requirements 2.4**

### Property 7: Department Color Uniqueness

*For any* set of departments in the patient distribution chart, each department should have a distinct color value.

**Validates: Requirements 2.5**

### Property 8: Top Department Classification

*For any* patient distribution dataset, specializations not in the top four by patient count should be classified as "Others".

**Validates: Requirements 2.9**

### Property 9: Department Sorting Order

*For any* patient distribution data, departments should be sorted by patient count in descending order.

**Validates: Requirements 2.10**

### Property 10: Revenue Aggregation by Month

*For any* billing data, aggregating by month should group all records with the same year-month combination and sum their amount_paid values.

**Validates: Requirements 3.2**

### Property 11: Axis Label Formatting

*For any* revenue value on the Y-axis, it should be formatted with ₱ and abbreviated (K for thousands, M for millions), and for any date on the X-axis, it should be formatted as "Month YYYY".

**Validates: Requirements 3.5, 3.6**

### Property 12: Time Granularity Data Update

*For any* time period filter change (monthly, quarterly, yearly), the chart data should update to display the appropriate granularity.

**Validates: Requirements 3.10**

### Property 13: Expense Category Calculations

*For any* date range, Staff Salaries should aggregate from payroll or config, Medical Supplies should sum inventory purchases, Operational Costs should use config values, Pharmaceuticals should sum medicine inventory purchases, and Miscellaneous should sum other expenses.

**Validates: Requirements 4.3, 4.4, 4.5, 4.6, 4.7**

### Property 14: Expense Percentage Change

*For any* two time periods, the total expense percentage change should be calculated using the same formula as KPI metrics.

**Validates: Requirements 4.11**

### Property 15: Expense Sorting Order

*For any* expense data, categories should be sorted by amount in descending order.

**Validates: Requirements 4.12**

### Property 16: Expense Value Formatting

*For any* monetary value in the expense chart, it should be formatted with ₱ and thousand separators.

**Validates: Requirements 4.13**

### Property 17: Performance Metric Scaling

*For any* performance metric value, it should be scaled to a 0-5 range for consistent visualization in the radar chart.

**Validates: Requirements 5.10**

### Property 18: Performance Metric Calculations

*For any* date range, Patient Satisfaction should use average satisfaction score, Recovery Rate should divide successful treatments by total treatments, Emergency Response should compute average response time, Follow-up Rate should divide completed follow-ups by scheduled follow-ups, and Treatment Success Rate should analyze consultation outcomes.

**Validates: Requirements 5.3, 5.4, 5.5, 5.6, 5.7**

### Property 19: Date Range Refresh Trigger

*For any* date range change, all metrics and charts should refresh with data filtered to the new date range.

**Validates: Requirements 6.4**

### Property 20: Query Date Filtering

*For any* database query, when a date range is selected, the query should filter records by that date range.

**Validates: Requirements 6.5**

### Property 21: Date Range Validation

*For any* date range input, the end date should not be before the start date, and invalid ranges should be rejected.

**Validates: Requirements 6.6**

### Property 22: Preset Date Range Application

*For any* preset button click, the date filter should automatically set the corresponding date range (This Month, Last Month, Last 3 Months, Last 6 Months, This Year).

**Validates: Requirements 6.9**

### Property 23: Date Range Persistence Round-Trip

*For any* valid date range, storing it in session storage then retrieving it should produce an equivalent date range.

**Validates: Requirements 6.10, 6.11**

### Property 24: Export Filename Formatting

*For any* export operation, the filename should follow the format "RCMC_Analytics_Report_YYYY-MM-DD_HHMMSS.{ext}" and include both the date range and timestamp.

**Validates: Requirements 7.6, 7.7, 7.8**

### Property 25: Export Format Generation

*For any* dashboard data, the export service should be able to generate valid PDF, Excel, and CSV formats.

**Validates: Requirements 7.3, 7.4, 7.5**

### Property 26: Timestamp Formatting

*For any* timestamp, it should be formatted as "Last updated: HH:MM AM/PM" when displayed in the dashboard header.

**Validates: Requirements 8.5**

### Property 27: Touch Target Minimum Size

*For any* interactive element on mobile devices, the touch target should be at least 44px in both dimensions.

**Validates: Requirements 9.7**

### Property 28: ARIA Label Presence

*For any* chart or metric component, it should include appropriate ARIA labels for accessibility.

**Validates: Requirements 9.9**

### Property 29: Chart Text Alternatives

*For any* chart visualization, there should be a text alternative (aria-label or data table) available.

**Validates: Requirements 9.11**

### Property 30: Cache Expiration

*For any* cached query result, it should expire after 5 minutes and trigger a fresh database query.

**Validates: Requirements 10.3**

### Property 31: Query Pagination Limit

*For any* large dataset query, the data service should use pagination with a maximum of 1000 records per query.

**Validates: Requirements 10.4**

### Property 32: Date Filter Debouncing

*For any* date range filter change, the query should be debounced by 500ms before execution.

**Validates: Requirements 10.9**

### Property 33: Null Value Handling

*For any* metric calculation, null or missing values should be handled gracefully without throwing errors.

**Validates: Requirements 11.2**

### Property 34: Missing Field Default Values

*For any* required numeric field that is missing, the metric calculator should use zero as the default value.

**Validates: Requirements 11.3**

### Property 35: Soft-Deleted Record Exclusion

*For any* metric calculation, soft-deleted records (status = 'Inactive' or 'Deleted') should be excluded.

**Validates: Requirements 11.4**

### Property 36: Test Data Exclusion

*For any* metric calculation, test or demo data should be filtered out based on configured exclusion rules.

**Validates: Requirements 11.5**

### Property 37: Insufficient Data Handling

*For any* metric that cannot be calculated due to insufficient data, the dashboard should display "N/A".

**Validates: Requirements 11.6**

### Property 38: Percentage Change Bounds Validation

*For any* percentage change calculation, if the result is outside the bounds of -100% to +1000%, the dashboard should display "Significant Change" instead of the percentage.

**Validates: Requirements 11.9, 11.10**

### Property 39: Numeric Value Rounding

*For any* numeric value, monetary values should be rounded to 2 decimal places, percentages to 1 decimal place, and ratings to 1 decimal place.

**Validates: Requirements 11.11, 11.12, 11.13**

### Property 40: Tooltip Formatting Consistency

*For any* chart tooltip, values should be formatted consistently with the dashboard's formatting rules (currency, percentage, rating formats).

**Validates: Requirements 12.2**

### Property 41: Configuration Validation

*For any* configuration JSON, the parser should validate that all required fields are present and numeric values are within acceptable ranges.

**Validates: Requirements 13.3, 13.4**

### Property 42: Configuration Error Messages

*For any* invalid configuration, the parser should return descriptive error messages indicating which fields are invalid and why.

**Validates: Requirements 13.5**

### Property 43: Configuration Round-Trip

*For any* valid configuration object, parsing then printing then parsing should produce an equivalent object.

**Validates: Requirements 13.7**

### Property 44: CSV RFC 4180 Compliance

*For any* dashboard data, the CSV export should follow RFC 4180 specification, properly escaping special characters (commas, quotes, newlines).

**Validates: Requirements 14.1, 14.2**

### Property 45: Excel Data Type Preservation

*For any* dashboard data exported to Excel, numbers should remain numbers, dates should remain dates, and text should remain text (no type coercion).

**Validates: Requirements 14.4**

### Property 46: CSV Export Round-Trip

*For any* valid CSV export, parsing the exported CSV should produce equivalent data to the original.

**Validates: Requirements 14.7**

### Property 47: Import Data Validation

*For any* imported data, the parser should validate data types and ranges, returning detailed error messages with row numbers for invalid data.

**Validates: Requirements 14.8, 14.9**

### Property 48: Export Metadata Inclusion

*For any* export in any format (PDF, Excel, CSV), the file should include metadata headers with export date, date range, and hospital name.

**Validates: Requirements 14.10**


## Error Handling

### Error Categories

#### 1. Data Fetching Errors

**Scenarios**:
- Network connectivity issues
- Supabase service unavailable
- Query timeout (>5 seconds)
- Invalid query parameters

**Handling Strategy**:
```javascript
try {
  const data = await analyticsService.getKPIMetrics(dateRange)
  setMetrics(data)
  setError(null)
} catch (error) {
  if (error.code === 'PGRST116') {
    // No data found
    setMetrics(getEmptyMetrics())
    setError({ type: 'no_data', message: 'No data available for the selected period' })
  } else if (error.message.includes('timeout')) {
    setError({ type: 'timeout', message: 'Request timed out. Please try again.' })
  } else {
    setError({ type: 'fetch_error', message: 'Failed to load data. Please refresh the page.' })
    console.error('Data fetch error:', error)
  }
}
```

**User Feedback**:
- Display error banner at top of dashboard
- Show retry button
- Maintain last successfully loaded data if available
- Log error details to console for debugging

#### 2. Calculation Errors

**Scenarios**:
- Division by zero (e.g., bed occupancy with 0 total beds)
- Null or undefined values in calculations
- Invalid data types
- Missing required fields

**Handling Strategy**:
```javascript
function calculateBedOccupancy(occupiedBeds, totalBeds) {
  if (totalBeds === null || totalBeds === undefined || totalBeds === 0) {
    return { value: 'N/A', error: 'No bed data available' }
  }
  
  const occupancy = (occupiedBeds / totalBeds) * 100
  return { value: Math.round(occupancy * 10) / 10, error: null }
}
```

**User Feedback**:
- Display "N/A" for metrics that cannot be calculated
- Show warning icon with tooltip explaining the issue
- Continue displaying other metrics that can be calculated

#### 3. Validation Errors

**Scenarios**:
- Invalid date range (end date before start date)
- Date range too large (>2 years)
- Invalid export format selection
- Invalid configuration values

**Handling Strategy**:
```javascript
function validateDateRange(startDate, endDate) {
  if (endDate < startDate) {
    return { valid: false, error: 'End date cannot be before start date' }
  }
  
  const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24)
  if (daysDiff > 730) {
    return { valid: false, error: 'Date range cannot exceed 2 years' }
  }
  
  return { valid: true, error: null }
}
```

**User Feedback**:
- Display inline error message below date picker
- Prevent form submission until validation passes
- Highlight invalid fields with red border

#### 4. Export Errors

**Scenarios**:
- Insufficient data for export
- File generation failure
- Browser download blocked
- Insufficient memory for large exports

**Handling Strategy**:
```javascript
async function handleExport(format) {
  setExporting(true)
  setExportError(null)
  
  try {
    const blob = await exportService.exportToPDF(dashboardData, dateRange)
    downloadFile(blob, generateFilename(format, dateRange))
  } catch (error) {
    if (error.message.includes('memory')) {
      setExportError('Export too large. Please select a smaller date range.')
    } else {
      setExportError('Export failed. Please try again.')
    }
    console.error('Export error:', error)
  } finally {
    setExporting(false)
  }
}
```

**User Feedback**:
- Display loading spinner during export
- Show success notification on completion
- Display error modal with details and retry option
- Suggest reducing date range for large exports

#### 5. Real-Time Update Errors

**Scenarios**:
- Supabase real-time subscription failure
- WebSocket connection dropped
- Update conflict (concurrent modifications)

**Handling Strategy**:
```javascript
useEffect(() => {
  const subscription = supabase
    .channel('dashboard_updates')
    .on('postgres_changes', { event: '*', schema: 'public' }, handleUpdate)
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setRealtimeStatus('connected')
      } else if (status === 'CHANNEL_ERROR') {
        setRealtimeStatus('error')
        // Fall back to polling
        startPolling()
      }
    })
  
  return () => subscription.unsubscribe()
}, [])
```

**User Feedback**:
- Display connection status indicator
- Automatically fall back to polling if real-time fails
- Show "Reconnecting..." message during connection issues

### Error Boundary Implementation

```javascript
class DashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Dashboard error:', error, errorInfo)
    // Log to error tracking service (e.g., Sentry)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-slate-600 mb-4">
            The dashboard encountered an unexpected error.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
          >
            Reload Dashboard
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
```

### Logging Strategy

**Error Logging**:
- Log all errors to browser console with context
- Include timestamp, user ID, and error stack trace
- Log failed queries with parameters for debugging

**Performance Logging**:
- Log query execution times
- Track component render times
- Monitor cache hit/miss rates

**User Action Logging**:
- Log date range changes
- Log export operations
- Log chart interactions (clicks, hovers)

## Testing Strategy

### Dual Testing Approach

The dashboard will use both unit tests and property-based tests for comprehensive coverage:

- **Unit Tests**: Verify specific examples, edge cases, error conditions, and integration points
- **Property Tests**: Verify universal properties across all inputs through randomization

Together, these approaches ensure both concrete bug detection and general correctness validation.

### Unit Testing

**Framework**: Vitest (already configured in project)

**Test Organization**:
```
src/
├── components/
│   └── analytics/
│       ├── KPICard.test.jsx
│       ├── DateRangeFilter.test.jsx
│       ├── PatientDistributionChart.test.jsx
│       ├── RevenueTrendChart.test.jsx
│       ├── ExpenseBreakdownChart.test.jsx
│       └── PerformanceComparisonChart.test.jsx
├── services/
│   ├── analyticsService.test.js
│   └── exportService.test.js
└── pages/
    └── Dashboard.test.jsx
```

**Unit Test Focus Areas**:

1. **Component Rendering**:
   - KPI cards display correct titles and icons
   - Charts render with correct data
   - Loading states display properly
   - Error states display appropriate messages

2. **User Interactions**:
   - Date range picker updates state
   - Export button triggers download
   - Chart clicks trigger drill-down
   - Refresh button fetches new data

3. **Edge Cases**:
   - Empty data sets
   - Single data point
   - Very large numbers
   - Null/undefined values

4. **Integration Points**:
   - Service layer calls Supabase correctly
   - Components receive and display service data
   - Error boundaries catch component errors

**Example Unit Test**:
```javascript
describe('KPICard', () => {
  it('should display formatted currency value', () => {
    const { getByText } = render(
      <KPICard
        title="Total Revenue"
        value={450000}
        previousValue={400000}
        format="currency"
        icon={DollarSign}
        iconColor="teal"
      />
    )
    
    expect(getByText('₱450,000')).toBeInTheDocument()
  })
  
  it('should display green trend indicator for positive change', () => {
    const { container } = render(
      <KPICard
        title="Total Patients"
        value={150}
        previousValue={100}
        format="number"
        icon={Users}
        iconColor="teal"
      />
    )
    
    const trendIndicator = container.querySelector('.text-green-600')
    expect(trendIndicator).toBeInTheDocument()
    expect(trendIndicator).toHaveTextContent('50.0%')
  })
})
```

### Property-Based Testing

**Framework**: fast-check (to be installed: `npm install --save-dev fast-check`)

**Configuration**: Minimum 100 iterations per property test

**Property Test Focus Areas**:

1. **Calculation Properties**:
   - Metric calculations produce consistent results
   - Percentage changes follow mathematical rules
   - Aggregations are commutative and associative

2. **Formatting Properties**:
   - All currency values have ₱ and thousand separators
   - All percentages have exactly 1 decimal place
   - All dates follow specified format

3. **Validation Properties**:
   - Invalid date ranges are always rejected
   - Percentage changes within bounds or show "Significant Change"
   - Null values never cause crashes

4. **Round-Trip Properties**:
   - Configuration: parse → print → parse = identity
   - CSV Export: export → import → export = identity
   - Session Storage: save → load → save = identity

**Example Property Test**:
```javascript
import fc from 'fast-check'

describe('Property: Currency Formatting', () => {
  /**
   * Feature: advanced-analytics-dashboard
   * Property 3: Value Formatting Consistency
   * 
   * For any numeric value displayed on the dashboard, currency values
   * should be formatted with ₱ and thousand separators.
   */
  it('should format all currency values with ₱ and thousand separators', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000000 }), // Random currency amount
        (amount) => {
          const formatted = formatCurrency(amount)
          
          // Should start with ₱
          expect(formatted).toMatch(/^₱/)
          
          // Should have thousand separators for amounts >= 1000
          if (amount >= 1000) {
            expect(formatted).toMatch(/,/)
          }
          
          // Should be parseable back to original amount
          const parsed = parseFormattedCurrency(formatted)
          expect(parsed).toBe(amount)
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Property: Percentage Change Calculation', () => {
  /**
   * Feature: advanced-analytics-dashboard
   * Property 2: Percentage Change Calculation
   * 
   * For any two time periods (current and previous), the percentage change
   * should be calculated as ((current - previous) / previous) * 100.
   */
  it('should calculate percentage change consistently', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }), // Previous value (non-zero)
        fc.integer({ min: 0, max: 10000 }), // Current value
        (previous, current) => {
          const percentageChange = calculatePercentageChange(current, previous)
          const expected = ((current - previous) / previous) * 100
          
          expect(percentageChange).toBeCloseTo(expected, 1)
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Property: Date Range Validation', () => {
  /**
   * Feature: advanced-analytics-dashboard
   * Property 21: Date Range Validation
   * 
   * For any date range input, the end date should not be before the start date,
   * and invalid ranges should be rejected.
   */
  it('should reject date ranges where end date is before start date', () => {
    fc.assert(
      fc.property(
        fc.date(), // Random start date
        fc.date(), // Random end date
        (date1, date2) => {
          const startDate = date1 < date2 ? date1 : date2
          const endDate = date1 < date2 ? date2 : date1
          
          // Valid range should pass
          const validResult = validateDateRange(startDate, endDate)
          expect(validResult.valid).toBe(true)
          
          // Invalid range (swapped) should fail
          const invalidResult = validateDateRange(endDate, startDate)
          expect(invalidResult.valid).toBe(false)
          expect(invalidResult.error).toBeTruthy()
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Property: Configuration Round-Trip', () => {
  /**
   * Feature: advanced-analytics-dashboard
   * Property 43: Configuration Round-Trip
   * 
   * For any valid configuration object, parsing then printing then parsing
   * should produce an equivalent object.
   */
  it('should preserve configuration through parse-print-parse cycle', () => {
    fc.assert(
      fc.property(
        fc.record({
          baseline_metrics: fc.record({
            patientSatisfaction: fc.float({ min: 0, max: 5 }),
            recoveryRate: fc.float({ min: 0, max: 5 }),
            emergencyResponse: fc.float({ min: 0, max: 5 }),
            followUpRate: fc.float({ min: 0, max: 5 }),
            treatmentSuccess: fc.float({ min: 0, max: 5 })
          }),
          expense_budgets: fc.record({
            staff_salaries: fc.integer({ min: 0, max: 10000000 }),
            operational_costs: fc.integer({ min: 0, max: 10000000 })
          })
        }),
        (config) => {
          const json = printConfiguration(config)
          const parsed = parseConfiguration(json)
          const json2 = printConfiguration(parsed)
          
          expect(json).toEqual(json2)
          expect(parsed).toEqual(config)
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Property: CSV Export Round-Trip', () => {
  /**
   * Feature: advanced-analytics-dashboard
   * Property 46: CSV Export Round-Trip
   * 
   * For any valid CSV export, parsing the exported CSV should produce
   * equivalent data to the original.
   */
  it('should preserve data through export-import cycle', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            date: fc.date(),
            revenue: fc.integer({ min: 0, max: 10000000 }),
            expenses: fc.integer({ min: 0, max: 10000000 }),
            patients: fc.integer({ min: 0, max: 1000 })
          }),
          { minLength: 1, maxLength: 100 }
        ),
        (data) => {
          const csv = exportToCSV(data)
          const imported = importFromCSV(csv)
          
          expect(imported).toEqual(data)
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

### Test Coverage Goals

- **Line Coverage**: Minimum 80%
- **Branch Coverage**: Minimum 75%
- **Function Coverage**: Minimum 85%
- **Property Test Coverage**: All 48 correctness properties

### Continuous Integration

**Test Execution**:
- Run all tests on every commit
- Run property tests with 100 iterations in CI
- Generate coverage reports
- Fail build if coverage drops below thresholds

**Test Commands**:
```bash
# Run all tests once
npm test

# Run tests in watch mode during development
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run only property-based tests
npm test -- --grep "Property:"
```

### Manual Testing Checklist

**Responsive Design**:
- [ ] Test on desktop (1920px+)
- [ ] Test on tablet (768px-1919px)
- [ ] Test on mobile (320px-767px)
- [ ] Verify touch targets on mobile (44px minimum)

**Browser Compatibility**:
- [ ] Chrome (latest 2 versions)
- [ ] Firefox (latest 2 versions)
- [ ] Safari (latest 2 versions)
- [ ] Edge (latest 2 versions)

**Accessibility**:
- [ ] Keyboard navigation works for all interactive elements
- [ ] Screen reader announces all charts and metrics
- [ ] Color contrast meets WCAG 2.1 AA standards
- [ ] Focus indicators are visible

**Performance**:
- [ ] Initial load completes within 2 seconds
- [ ] Date range changes respond within 500ms
- [ ] Charts render smoothly without jank
- [ ] Large exports complete without browser freeze

**Data Accuracy**:
- [ ] KPI metrics match database queries
- [ ] Charts display correct data
- [ ] Percentage changes calculate correctly
- [ ] Exports contain accurate data

## Implementation Notes

### Development Phases

**Phase 1: Foundation (Week 1)**
- Set up analytics service layer
- Implement database queries with indexes
- Create KPI metric calculations
- Build KPICard component

**Phase 2: Visualizations (Week 2)**
- Implement patient distribution chart
- Implement revenue trend chart
- Implement expense breakdown chart
- Implement performance comparison chart

**Phase 3: Interactivity (Week 3)**
- Add date range filter
- Implement real-time updates
- Add chart interactions (hover, click, zoom)
- Implement drill-down filtering

**Phase 4: Export & Polish (Week 4)**
- Implement PDF export
- Implement Excel export
- Implement CSV export
- Add loading states and error handling
- Optimize performance

**Phase 5: Testing & Documentation (Week 5)**
- Write unit tests
- Write property-based tests
- Conduct accessibility audit
- Performance testing and optimization
- User acceptance testing

### Dependencies to Install

```bash
npm install fast-check --save-dev
```

### Database Migrations

```sql
-- Create dashboard_config table
CREATE TABLE IF NOT EXISTS dashboard_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  schema_version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default baseline metrics
INSERT INTO dashboard_config (config_key, config_value)
VALUES (
  'baseline_metrics',
  '{"patientSatisfaction": 4.2, "recoveryRate": 4.5, "emergencyResponse": 3.8, "followUpRate": 4.0, "treatmentSuccess": 4.3}'
)
ON CONFLICT (config_key) DO NOTHING;

-- Insert default expense budgets
INSERT INTO dashboard_config (config_key, config_value)
VALUES (
  'expense_budgets',
  '{"staff_salaries": 500000, "operational_costs": 200000}'
)
ON CONFLICT (config_key) DO NOTHING;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_billing_created_at ON billing(created_at);
CREATE INDEX IF NOT EXISTS idx_billing_payment_status ON billing(payment_status);
CREATE INDEX IF NOT EXISTS idx_consultations_date ON consultations(consultation_date);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor_id ON consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_satisfaction_created_at ON satisfaction_ratings(created_at);
```

### Performance Optimization Checklist

- [ ] Database indexes created for all date and foreign key columns
- [ ] Query result caching implemented with 5-minute TTL
- [ ] Lazy loading implemented for chart components
- [ ] React.memo applied to expensive components
- [ ] Date filter changes debounced by 500ms
- [ ] Parallel query execution for independent data
- [ ] Skeleton loaders displayed during data fetch
- [ ] Large datasets paginated (max 1000 records)

### Security Considerations

- **Row Level Security**: Ensure RLS policies are in place for all dashboard queries
- **Data Access**: Verify user has permission to view analytics data
- **Export Limits**: Implement rate limiting for export operations
- **Input Validation**: Sanitize all user inputs (date ranges, filters)
- **SQL Injection**: Use parameterized queries for all database operations

---

**Design Document Version**: 1.0  
**Last Updated**: 2025-01-XX  
**Status**: Ready for Implementation
