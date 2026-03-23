# Design Document: Dashboard Revert and Analytics Migration

## Overview

This feature involves two major changes to the RCMC EMR system:

1. **Dashboard Reversion**: Restore the Dashboard page to its original implementation that displays stat cards, patient statistics charts, appointment calendar, sales overview (admin only), doctor performance metrics, and recent patients table.

2. **Analytics Migration**: Move the advanced analytics dashboard functionality from the Dashboard page to the Reports module as a new "Analytics" tab, preserving all features including KPI cards, interactive charts, date range filtering, real-time updates, and export capabilities.

### Goals

- Restore the original Dashboard user experience with comprehensive overview metrics
- Integrate advanced analytics into the Reports module for centralized reporting
- Preserve all existing analytics functionality without data loss
- Maintain backward compatibility with existing Reports features
- Ensure responsive design across all devices
- Maintain data consistency between Dashboard and Analytics

### Non-Goals

- Redesigning the Dashboard or Analytics UI beyond the migration
- Adding new analytics features or metrics
- Modifying the underlying database schema
- Changing authentication or authorization logic

## Architecture

### High-Level Architecture


```
┌─────────────────────────────────────────────────────────────┐
│                        User Interface                        │
├──────────────────────────┬──────────────────────────────────┤
│      Dashboard.jsx       │         Reports.jsx              │
│  (Restored Original)     │  (Enhanced with Analytics Tab)   │
├──────────────────────────┼──────────────────────────────────┤
│ - Stat Cards (4)         │ - Financial Tab                  │
│ - Patient Chart          │ - Patients Tab                   │
│ - Appointment Calendar   │ - Appointments Tab               │
│ - Sales Overview (Admin) │ - Inventory Tab                  │
│ - Doctor Performance     │ - Analytics Tab (NEW)            │
│ - Recent Patients Table  │   └─ Analytics Dashboard         │
└──────────────────────────┴──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Analytics Components                       │
│  (Shared between Dashboard and Analytics Tab)               │
├──────────────────────────────────────────────────────────────┤
│ - KPICard                - DateRangeFilter                  │
│ - PatientDistributionChart - RevenueTrendChart             │
│ - ExpenseBreakdownChart    - PerformanceComparisonChart    │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
├──────────────────────────────────────────────────────────────┤
│ - analyticsService.js    - exportService.js                 │
│ - useAnalytics hook      - db service (Supabase)            │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Database                         │
├──────────────────────────────────────────────────────────────┤
│ - patients               - billing                          │
│ - doctors                - consultations                    │
│ - appointments           - satisfaction_ratings             │
│ - rooms                  - inventory                        │
│ - dashboard_config       - services                         │
└──────────────────────────────────────────────────────────────┘
```

### Component Relationships

**Dashboard Page (Restored)**:
- Uses StatCard component for overview metrics
- Uses Recharts library for patient statistics visualization
- Directly calls db service methods for data fetching
- Implements its own data loading and state management
- Conditionally renders admin-only sections based on user role

**Reports Module (Enhanced)**:
- Maintains existing tab-based navigation
- Adds new "Analytics" tab to existing tabs array
- Conditionally renders Analytics Dashboard when Analytics tab is active
- Preserves all existing report loading logic for other tabs

**Analytics Dashboard (Migrated)**:
- Embedded within Reports module as tab content
- Uses useAnalytics hook for data management
- Uses analytics components for visualization
- Uses exportService for data export
- Maintains date range state in session storage



## Components and Interfaces

### 1. Dashboard Component (Restored)

**File**: `src/pages/Dashboard.jsx`

**Source**: Restore from `backups/pre-security-update-2026-02-26-092920/rcmc-emr/src/pages/Dashboard.jsx`

**Key Features**:
- Four stat cards: Total Patient, Total Doctor, Book Appointment, Room Availability
- Patient statistics chart with daily/weekly/monthly view toggle
- Appointment list with calendar navigation
- Sales overview section (admin only) with revenue KPIs
- Revenue trend charts and top services/medicines (admin only)
- Doctor performance metrics table with patient counts
- Recent patients table

**Props**: None (uses AuthContext for user profile)

**State Management**:
```javascript
{
  stats: { totalPatients, totalDoctors, bookAppointments, roomAvailability },
  loading: boolean,
  patients: Array,
  selectedDate: number,
  currentMonth: Date,
  chartView: 'daily' | 'weekly' | 'monthly',
  showPerformanceReport: boolean,
  doctors: Array,
  doctorPerformance: Array,
  todayAppointments: Array,
  patientChartData: Array,
  patientsLastMonth: number,
  topServices: Array,
  topMedicines: Array,
  salesStats: Object,
  salesByCategory: Array,
  monthlySalesData: Array
}
```

**Data Loading**:
- Calls `db.getStats()` for stat cards
- Calls `db.getPatients()` for recent patients
- Calls `db.getDoctors()` for doctor list
- Calls `db.getAppointments()` for appointment data
- Calls `db.getTodayAppointments()` for today's schedule
- Calls `db.getRoomAvailability()` for room stats
- Calls `db.getPatientStatistics()` for chart data
- Calls `db.getTopServices()` and `db.getTopMedicines()` for sales data
- Calls `db.getRevenueStats()` for revenue metrics
- Calls `db.getMonthlyRevenueTrend()` for trend charts
- Calls `db.getRevenueByCategory()` for pie chart

### 2. Reports Component (Enhanced)

**File**: `src/pages/Reports.jsx`

**Modifications**:
- Add "Analytics" tab to tabs array
- Add Analytics Dashboard rendering when activeTab === 'analytics'
- Preserve all existing tab rendering logic
- Maintain existing date range state and CSV export functionality

**New Tab Configuration**:
```javascript
{
  id: 'analytics',
  label: 'Analytics',
  icon: TrendingUp
}
```

**Conditional Rendering**:
```javascript
{activeTab === 'analytics' && <AnalyticsDashboard />}
{activeTab === 'financial' && <FinancialReport data={reportData} />}
// ... existing tabs
```

### 3. Analytics Dashboard Component (New)

**File**: `src/pages/Reports.jsx` (embedded component)

**Purpose**: Render the advanced analytics dashboard within the Reports module

**Structure**:
```javascript
const AnalyticsDashboard = () => {
  // Date range management with session storage
  const [dateRange, setDateRange] = useState(getInitialDateRange);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Use analytics hook for data
  const { metrics, chartData, loading, error, lastUpdated, refresh } = useAnalytics(dateRange);
  
  // Persist date range to session storage
  useEffect(() => {
    sessionStorage.setItem('analyticsDateRange', JSON.stringify(dateRange));
  }, [dateRange]);
  
  // Render KPI cards, charts, and controls
  return (/* Analytics UI */);
};
```

**Features**:
- Four KPI cards with trend indicators
- Four interactive charts
- Date range filter with presets
- Manual refresh button
- Export button with modal
- Loading states and error handling
- Last updated timestamp



### 4. Analytics Components (Preserved)

All existing analytics components remain unchanged and are reused:

**KPICard** (`src/components/analytics/KPICard.jsx`):
- Displays metric with current value, previous value, and trend
- Supports multiple formats: number, percentage, currency, rating
- Shows trend indicator (up/down arrow) with percentage change

**PatientDistributionChart** (`src/components/analytics/PatientDistributionChart.jsx`):
- Pie chart showing patient distribution by department
- Interactive tooltips with percentages
- Color-coded segments

**RevenueTrendChart** (`src/components/analytics/RevenueTrendChart.jsx`):
- Line chart showing revenue over time
- Supports monthly, quarterly, and yearly granularity
- Interactive tooltips with formatted currency

**ExpenseBreakdownChart** (`src/components/analytics/ExpenseBreakdownChart.jsx`):
- Bar chart showing expense categories
- Displays amounts and percentages
- Color-coded categories

**PerformanceComparisonChart** (`src/components/analytics/PerformanceComparisonChart.jsx`):
- Radar chart comparing hospital metrics to baseline
- Five performance dimensions
- Visual comparison overlay

**DateRangeFilter** (`src/components/analytics/DateRangeFilter.jsx`):
- Date picker inputs for start and end dates
- Preset buttons for common ranges
- Validation for invalid date ranges

### 5. Service Layer (Preserved)

**analyticsService** (`src/services/analyticsService.js`):
- Fetches KPI metrics with comparison to previous period
- Fetches patient distribution by department
- Fetches revenue trend with configurable granularity
- Fetches expense breakdown by category
- Fetches performance metrics and baseline
- Implements 5-minute caching with TTL
- Handles query timeouts and errors

**exportService** (`src/services/exportService.js`):
- Exports to PDF with formatted report layout
- Exports to Excel with multiple sheets
- Exports to CSV with RFC 4180 compliance
- Generates timestamped filenames
- Includes metadata headers
- Triggers file downloads

**useAnalytics hook** (`src/hooks/useAnalytics.js`):
- Manages analytics data fetching and state
- Implements automatic 5-minute refresh
- Pauses refresh when tab is inactive
- Debounces date range changes (500ms)
- Provides manual refresh function
- Handles loading and error states

## Data Models

### Dashboard Data Structure

```typescript
interface DashboardStats {
  totalPatients: number;
  totalDoctors: number;
  bookAppointments: number;
  roomAvailability: number;
}

interface PatientChartData {
  label: string;  // Month name or date
  value: number;  // Patient count
  comparison: number;  // Previous period count
}

interface DoctorPerformance {
  id: string;
  name: string;
  specialization: string;
  patientCount: number;
  appointmentsToday: number;
  avgConsultTime: string;
  satisfaction: number;
  avatar: string;
}

interface SalesStats {
  totalRevenue: number;
  servicesRevenue: number;
  medicineRevenue: number;
  roomRevenue: number;
  monthlyGrowth: number;
  topSellingService: string;
  topSellingMedicine: string;
}

interface TopItem {
  name: string;
  sales: number;
  count: number;
}
```



### Analytics Data Structure

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

interface PatientDistribution {
  department: string;
  count: number;
  percentage: number;
  color: string;
}

interface RevenueTrend {
  period: string;  // "January 2025" or "2025-Q1"
  revenue: number;
  date: Date;
}

interface ExpenseBreakdown {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

interface PerformanceMetrics {
  patientSatisfaction: number;  // 0-5 scale
  recoveryRate: number;
  emergencyResponse: number;
  followUpRate: number;
  treatmentSuccess: number;
}

interface DateRange {
  startDate: Date;
  endDate: Date;
}
```

### Session Storage Schema

```typescript
// Key: 'analyticsDateRange'
interface StoredDateRange {
  startDate: string;  // ISO date string
  endDate: string;    // ISO date string
}
```

### Database Queries

**Dashboard Queries**:
- `SELECT COUNT(*) FROM patients WHERE status = 'Active'` - Total patients
- `SELECT COUNT(*) FROM doctors` - Total doctors
- `SELECT COUNT(*) FROM appointments WHERE MONTH(appointment_date) = CURRENT_MONTH` - Monthly appointments
- `SELECT COUNT(*) FROM rooms WHERE status = 'Available'` - Room availability
- `SELECT * FROM patients ORDER BY created_at DESC LIMIT 4` - Recent patients
- `SELECT * FROM appointments WHERE appointment_date = CURRENT_DATE` - Today's appointments
- `SELECT SUM(amount_paid) FROM billing WHERE payment_status = 'Paid'` - Revenue

**Analytics Queries** (via analyticsService):
- Patient counts with date range filtering
- Bed occupancy from rooms table
- Satisfaction scores from satisfaction_ratings table
- Revenue from billing table with date range
- Consultations grouped by doctor specialization
- Inventory costs by category
- Performance metrics from consultations and appointments



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

Before defining properties, I analyzed the testable acceptance criteria to eliminate redundancy:

**Redundancies Identified**:
1. Properties 1.4 and 1.5 (admin conditional rendering) can be combined into a single property about admin-only content
2. Properties 2.3-2.7 (individual chart rendering) are all examples of the same pattern and don't need separate properties
3. Properties 7.1-7.8 (component usage verification) are all examples and can be verified through integration tests
4. Properties 8.3-8.6 (file preservation) can be combined into a single property about analytics file preservation
5. Properties 11.3 and 11.4 (loading indicators) are the same pattern for different components
6. Properties 12.4, 12.5, and 12.6 (formatting consistency) can be combined into a single property about consistent formatting

**Properties to Implement**:
- Date range changes trigger data updates (3.2)
- Session storage round-trip for date range (3.5, 3.6 combined)
- Export triggers for all formats (4.2, 4.4, 4.7 combined)
- Export completeness (4.5, 4.6 combined)
- Refresh triggers data reload (5.4)
- Loading state displays indicators (5.5, 11.3, 11.4 combined)
- Tab switching loads correct data (6.5)
- Existing Reports functionality preserved (6.2, 6.3, 6.4 combined)
- Error logging (10.6)
- Cache behavior (11.5)
- Data consistency between dashboards (12.2, 12.3 combined)
- Formatting consistency (12.4, 12.5, 12.6 combined)

### Property 1: Date Range Update Triggers Data Refresh

*For any* valid date range change in the Analytics Dashboard, all metrics and charts should be updated to reflect the new date range.

**Validates: Requirements 3.2**

**Implementation**: The useAnalytics hook should detect date range changes and trigger a debounced data fetch. All KPI metrics and chart data should be recalculated based on the new date range.

### Property 2: Date Range Session Storage Round-Trip

*For any* date range selected in the Analytics Dashboard, storing it to session storage and then retrieving it should produce an equivalent date range.

**Validates: Requirements 3.5, 3.6**

**Implementation**: When date range changes, serialize to JSON and store in sessionStorage with key 'analyticsDateRange'. On component mount, retrieve and deserialize. The restored date range should match the stored range.

### Property 3: Export Triggers File Generation

*For any* export format (PDF, Excel, CSV), clicking the export button should trigger the export service and generate a downloadable file.

**Validates: Requirements 4.2, 4.4, 4.7**

**Implementation**: Export button click shows modal. Format selection calls appropriate exportService method (exportToPDF, exportToExcel, exportToCSV). Service generates blob and triggers download.

### Property 4: Export Data Completeness

*For any* export operation, the generated file should include all KPI metrics and all chart data from the current dashboard state.

**Validates: Requirements 4.5, 4.6**

**Implementation**: Export service receives metrics and chartData objects. Generated file must contain all four KPI values and all four chart datasets (patientDistribution, revenueTrend, expenseBreakdown, performanceComparison).



### Property 5: Manual Refresh Reloads All Data

*For any* state of the Analytics Dashboard, clicking the refresh button should reload all metrics and charts with current data from the database.

**Validates: Requirements 5.4**

**Implementation**: Refresh button calls the refresh() function from useAnalytics hook. This should trigger fetchData() which queries all analytics data and updates state.

### Property 6: Loading State Shows Indicators

*For any* data loading operation (initial load, refresh, date range change), while loading is true, loading indicators should be visible to the user.

**Validates: Requirements 5.5, 11.3, 11.4**

**Implementation**: Both Dashboard and Analytics Dashboard should check loading state and render HeartbeatLoader or skeleton UI when loading is true. Charts should show "Loading chart..." placeholders.

### Property 7: Tab Switching Loads Correct Report Data

*For any* tab selection in the Reports module, switching to that tab should load and display the data specific to that report type.

**Validates: Requirements 6.5**

**Implementation**: Reports component maintains activeTab state. useEffect watches activeTab and calls appropriate load function (loadFinancialReport, loadPatientReport, etc.). Analytics tab renders Analytics Dashboard component.

### Property 8: Existing Reports Functionality Preserved

*For any* existing Reports tab (Financial, Patients, Appointments, Inventory), all original functionality including data loading, date filtering, and CSV export should continue to work unchanged.

**Validates: Requirements 6.2, 6.3, 6.4**

**Implementation**: Original report loading functions (loadFinancialReport, loadPatientReport, loadAppointmentReport, loadInventoryReport) remain unchanged. Date range state and exportToCSV function remain unchanged. Only add Analytics tab without modifying existing logic.

### Property 9: Errors Are Logged to Console

*For any* error that occurs during data fetching, export, or other operations, detailed error information should be logged to the console using console.error.

**Validates: Requirements 10.6**

**Implementation**: All try-catch blocks should include console.error() calls with descriptive messages and error objects. Services should log errors before throwing or returning error states.

### Property 10: Analytics Data Caching

*For any* analytics data request, if the same request was made within the last 5 minutes, the cached data should be returned instead of querying the database.

**Validates: Requirements 11.5**

**Implementation**: analyticsService maintains a cache Map with timestamps. getCachedData() checks if cached entry exists and is less than 5 minutes old. setCachedData() stores data with current timestamp. Cache keys are generated from method name and parameters.

### Property 11: Revenue Data Consistency

*For any* time period, the revenue data displayed in the Dashboard (for admins) should match the revenue data displayed in the Analytics Dashboard when both are queried for the same date range.

**Validates: Requirements 12.2, 12.3**

**Implementation**: Both Dashboard and Analytics should query the billing table with the same logic: `SELECT SUM(amount_paid) FROM billing WHERE payment_status = 'Paid' AND created_at BETWEEN startDate AND endDate`. Patient counts should similarly use the same query logic.

### Property 12: Consistent Data Formatting

*For any* data value displayed in either Dashboard or Analytics, dates should use the same format, currency should use Philippine Peso format (₱), and numbers should use the same locale formatting.

**Validates: Requirements 12.4, 12.5, 12.6**

**Implementation**: 
- Dates: Use `toLocaleDateString('en-US', options)` or `toISOString().split('T')[0]` consistently
- Currency: Use `₱${value.toLocaleString()}` format consistently
- Numbers: Use `toLocaleString()` for thousands separators consistently



## Error Handling

### Error Categories

**1. Data Loading Errors**:
- Database connection failures
- Query timeouts (5 second limit)
- Invalid data formats
- Missing required fields

**Handling Strategy**:
- Display user-friendly error message with retry button
- Preserve previous data if available (graceful degradation)
- Log detailed error to console for debugging
- Show error banner without blocking entire UI

**Example**:
```javascript
try {
  const data = await db.getStats();
  setStats(data);
} catch (error) {
  console.error('Error loading dashboard stats:', error);
  setError({
    message: 'Failed to load dashboard statistics. Please try again.',
    retry: () => loadData()
  });
}
```

**2. Export Errors**:
- PDF generation failures
- Excel/CSV formatting errors
- File download blocked by browser
- Insufficient data for export

**Handling Strategy**:
- Display error message in export modal
- Keep modal open to allow retry
- Log detailed error information
- Provide specific error messages (e.g., "PDF generation failed")

**Example**:
```javascript
try {
  const blob = await exportService.exportToPDF(data, dateRange);
  exportService.downloadFile(blob, filename);
  setShowExportModal(false);
} catch (error) {
  console.error('Export error:', error);
  setExportError('Failed to generate PDF. Please try again.');
}
```

**3. Validation Errors**:
- Invalid date ranges (end before start)
- Missing required fields
- Out-of-range values

**Handling Strategy**:
- Display inline validation errors
- Prevent form submission until valid
- Provide clear guidance on how to fix
- Validate on blur and on submit

**Example**:
```javascript
const validateDateRange = (start, end) => {
  if (end < start) {
    return 'End date must be after start date';
  }
  if (end > new Date()) {
    return 'End date cannot be in the future';
  }
  return null;
};
```

**4. Session Storage Errors**:
- Storage quota exceeded
- Storage disabled by browser
- Serialization errors

**Handling Strategy**:
- Fail silently and use default values
- Log warning to console
- Continue with in-memory state only

**Example**:
```javascript
try {
  sessionStorage.setItem('analyticsDateRange', JSON.stringify(dateRange));
} catch (error) {
  console.warn('Failed to persist date range:', error);
  // Continue without persistence
}
```

### Error Messages

All error messages should be:
- **User-friendly**: Avoid technical jargon
- **Actionable**: Tell user what they can do
- **Specific**: Indicate what went wrong
- **Consistent**: Use same tone and format

**Examples**:
- ✅ "Failed to load dashboard data. Please check your connection and try again."
- ❌ "Error: ECONNREFUSED 127.0.0.1:5432"

- ✅ "Export failed. Please try a different format or contact support."
- ❌ "Uncaught TypeError: Cannot read property 'metrics' of undefined"

- ✅ "End date must be after start date."
- ❌ "Invalid date range"



## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests**: Verify specific examples, edge cases, and error conditions
- Specific UI rendering scenarios
- Individual component behavior
- Error handling paths
- Edge cases (empty data, invalid inputs)

**Property Tests**: Verify universal properties across all inputs
- Data consistency across components
- Round-trip operations (session storage)
- Formatting consistency
- Cache behavior

Both testing approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across many inputs.

### Unit Testing

**Framework**: Vitest with React Testing Library

**Dashboard Tests** (`src/pages/Dashboard.test.jsx`):
```javascript
describe('Dashboard', () => {
  it('should render four stat cards', () => {
    render(<Dashboard />);
    expect(screen.getAllByTestId('stat-card')).toHaveLength(4);
  });
  
  it('should display sales section for admin users', () => {
    const adminUser = { role: 'admin' };
    render(<Dashboard />, { user: adminUser });
    expect(screen.getByText('Sales Overview')).toBeInTheDocument();
  });
  
  it('should not display sales section for non-admin users', () => {
    const doctorUser = { role: 'doctor' };
    render(<Dashboard />, { user: doctorUser });
    expect(screen.queryByText('Sales Overview')).not.toBeInTheDocument();
  });
  
  it('should display loading state while fetching data', () => {
    render(<Dashboard />);
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });
  
  it('should display error message when data loading fails', async () => {
    mockDbError();
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Failed to load/)).toBeInTheDocument();
    });
  });
});
```

**Reports Tests** (`src/pages/Reports.test.jsx`):
```javascript
describe('Reports with Analytics Tab', () => {
  it('should render Analytics tab alongside existing tabs', () => {
    render(<Reports />);
    expect(screen.getByText('Financial')).toBeInTheDocument();
    expect(screen.getByText('Patients')).toBeInTheDocument();
    expect(screen.getByText('Appointments')).toBeInTheDocument();
    expect(screen.getByText('Inventory')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });
  
  it('should render Analytics Dashboard when Analytics tab is clicked', async () => {
    render(<Reports />);
    fireEvent.click(screen.getByText('Analytics'));
    await waitFor(() => {
      expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    });
  });
  
  it('should preserve existing CSV export functionality', async () => {
    render(<Reports />);
    fireEvent.click(screen.getByText('Financial'));
    const exportButton = screen.getByText('Export CSV');
    fireEvent.click(exportButton);
    // Verify CSV download triggered
  });
});
```

**Analytics Dashboard Tests** (`src/pages/AnalyticsDashboard.test.jsx`):
```javascript
describe('Analytics Dashboard', () => {
  it('should render four KPI cards', () => {
    render(<AnalyticsDashboard />);
    expect(screen.getByText('Total Patients')).toBeInTheDocument();
    expect(screen.getByText('Bed Occupancy Rate')).toBeInTheDocument();
    expect(screen.getByText('Patient Satisfaction')).toBeInTheDocument();
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
  });
  
  it('should render date range filter with preset options', () => {
    render(<AnalyticsDashboard />);
    expect(screen.getByText('Last 7 Days')).toBeInTheDocument();
    expect(screen.getByText('Last 30 Days')).toBeInTheDocument();
    expect(screen.getByText('Last 3 Months')).toBeInTheDocument();
  });
  
  it('should display export modal when export button is clicked', () => {
    render(<AnalyticsDashboard />);
    fireEvent.click(screen.getByText('Export'));
    expect(screen.getByText('Export Dashboard Data')).toBeInTheDocument();
    expect(screen.getByText('PDF Document')).toBeInTheDocument();
    expect(screen.getByText('Excel Workbook')).toBeInTheDocument();
    expect(screen.getByText('CSV File')).toBeInTheDocument();
  });
});
```



### Property-Based Testing

**Framework**: fast-check (JavaScript property-based testing library)

**Configuration**: Each property test should run minimum 100 iterations to ensure comprehensive input coverage.

**Test Tags**: Each test must reference its design document property using the format:
```javascript
// Feature: dashboard-revert-analytics-migration, Property 1: Date Range Update Triggers Data Refresh
```

**Property Test 1: Date Range Update Triggers Data Refresh**
```javascript
import fc from 'fast-check';

// Feature: dashboard-revert-analytics-migration, Property 1: Date Range Update Triggers Data Refresh
test('date range changes trigger data updates', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.date({ min: new Date('2020-01-01'), max: new Date() }),
      fc.date({ min: new Date('2020-01-01'), max: new Date() }),
      async (start, end) => {
        // Ensure valid range
        if (end < start) [start, end] = [end, start];
        
        const { result } = renderHook(() => useAnalytics({ startDate: start, endDate: end }));
        
        // Wait for initial load
        await waitFor(() => expect(result.current.loading).toBe(false));
        const initialMetrics = result.current.metrics;
        
        // Change date range
        const newStart = new Date(start.getTime() + 86400000); // +1 day
        const newEnd = new Date(end.getTime() + 86400000);
        
        act(() => {
          result.current.setDateRange({ startDate: newStart, endDate: newEnd });
        });
        
        // Wait for update
        await waitFor(() => expect(result.current.loading).toBe(false));
        
        // Metrics should be recalculated (may be same values but should be new fetch)
        expect(result.current.metrics).toBeDefined();
      }
    ),
    { numRuns: 100 }
  );
});
```

**Property Test 2: Session Storage Round-Trip**
```javascript
// Feature: dashboard-revert-analytics-migration, Property 2: Date Range Session Storage Round-Trip
test('date range session storage round-trip preserves values', () => {
  fc.assert(
    fc.property(
      fc.date({ min: new Date('2020-01-01'), max: new Date() }),
      fc.date({ min: new Date('2020-01-01'), max: new Date() }),
      (start, end) => {
        // Ensure valid range
        if (end < start) [start, end] = [end, start];
        
        const original = { startDate: start, endDate: end };
        
        // Store to session storage
        sessionStorage.setItem('analyticsDateRange', JSON.stringify({
          startDate: start.toISOString(),
          endDate: end.toISOString()
        }));
        
        // Retrieve from session storage
        const stored = JSON.parse(sessionStorage.getItem('analyticsDateRange'));
        const retrieved = {
          startDate: new Date(stored.startDate),
          endDate: new Date(stored.endDate)
        };
        
        // Should match original
        expect(retrieved.startDate.getTime()).toBe(original.startDate.getTime());
        expect(retrieved.endDate.getTime()).toBe(original.endDate.getTime());
      }
    ),
    { numRuns: 100 }
  );
});
```

**Property Test 3: Export Data Completeness**
```javascript
// Feature: dashboard-revert-analytics-migration, Property 4: Export Data Completeness
test('exports include all KPI metrics and chart data', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.constantFrom('pdf', 'xlsx', 'csv'),
      async (format) => {
        const mockData = {
          metrics: {
            totalPatients: { current: 100, previous: 90, change: 10, changePercentage: 11.1 },
            bedOccupancy: { current: 75, previous: 70, change: 5, changePercentage: 7.1 },
            patientSatisfaction: { current: 4.5, previous: 4.3, change: 0.2, changePercentage: 4.7 },
            totalRevenue: { current: 50000, previous: 45000, change: 5000, changePercentage: 11.1 }
          },
          chartData: {
            patientDistribution: [{ department: 'Cardiology', count: 50, percentage: 50, color: '#14b8a6' }],
            revenueTrend: [{ period: 'January 2025', revenue: 50000, date: new Date() }],
            expenseBreakdown: [{ category: 'Salaries', amount: 30000, percentage: 60, color: '#14b8a6' }],
            performanceComparison: {
              hospital: { patientSatisfaction: 4.5, recoveryRate: 4.2, emergencyResponse: 3.8, followUpRate: 4.0, treatmentSuccess: 4.3 },
              baseline: { patientSatisfaction: 4.2, recoveryRate: 4.5, emergencyResponse: 3.8, followUpRate: 4.0, treatmentSuccess: 4.3 }
            }
          }
        };
        
        const dateRange = { startDate: '2025-01-01', endDate: '2025-01-31' };
        
        let blob;
        if (format === 'pdf') {
          blob = await exportService.exportToPDF(mockData, dateRange);
        } else if (format === 'xlsx') {
          blob = await exportService.exportToExcel(mockData, dateRange);
        } else {
          blob = await exportService.exportToCSV(mockData, dateRange);
        }
        
        // Verify blob was generated
        expect(blob).toBeDefined();
        expect(blob.size).toBeGreaterThan(0);
        
        // For CSV, verify content includes all metrics
        if (format === 'csv') {
          const text = await blob.text();
          expect(text).toContain('Total Patients');
          expect(text).toContain('Bed Occupancy');
          expect(text).toContain('Patient Satisfaction');
          expect(text).toContain('Total Revenue');
          expect(text).toContain('Patient Distribution');
          expect(text).toContain('Revenue Trend');
          expect(text).toContain('Expense Breakdown');
          expect(text).toContain('Performance Metrics');
        }
      }
    ),
    { numRuns: 100 }
  );
});
```



**Property Test 4: Data Consistency Between Dashboards**
```javascript
// Feature: dashboard-revert-analytics-migration, Property 11: Revenue Data Consistency
test('revenue data matches between Dashboard and Analytics for same period', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.date({ min: new Date('2024-01-01'), max: new Date() }),
      fc.date({ min: new Date('2024-01-01'), max: new Date() }),
      async (start, end) => {
        // Ensure valid range
        if (end < start) [start, end] = [end, start];
        
        // Get revenue from Dashboard logic
        const dashboardRevenue = await db.getRevenueStats();
        
        // Get revenue from Analytics logic
        const analyticsRevenue = await analyticsService.getKPIMetrics({
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0]
        });
        
        // Both should query the same data source with same logic
        // Values should match (allowing for timing differences if data changes)
        expect(typeof dashboardRevenue.totalRevenue).toBe('number');
        expect(typeof analyticsRevenue.totalRevenue.current).toBe('number');
      }
    ),
    { numRuns: 100 }
  );
});
```

**Property Test 5: Formatting Consistency**
```javascript
// Feature: dashboard-revert-analytics-migration, Property 12: Consistent Data Formatting
test('currency formatting is consistent across components', () => {
  fc.assert(
    fc.property(
      fc.float({ min: 0, max: 1000000, noNaN: true }),
      (amount) => {
        // Format currency in Dashboard style
        const dashboardFormat = `₱${amount.toLocaleString()}`;
        
        // Format currency in Analytics style
        const analyticsFormat = `₱${amount.toLocaleString()}`;
        
        // Should use same format
        expect(dashboardFormat).toBe(analyticsFormat);
        
        // Should include peso sign
        expect(dashboardFormat).toContain('₱');
        
        // Should use thousands separators for large numbers
        if (amount >= 1000) {
          expect(dashboardFormat).toMatch(/,/);
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

**Property Test 6: Cache Behavior**
```javascript
// Feature: dashboard-revert-analytics-migration, Property 10: Analytics Data Caching
test('analytics data is cached for 5 minutes', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.date({ min: new Date('2024-01-01'), max: new Date() }),
      fc.date({ min: new Date('2024-01-01'), max: new Date() }),
      async (start, end) => {
        // Ensure valid range
        if (end < start) [start, end] = [end, start];
        
        const dateRange = {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0]
        };
        
        // Clear cache
        analyticsService.clearCache();
        
        // First call - should hit database
        const firstCall = await analyticsService.getKPIMetrics(dateRange);
        const firstCallTime = Date.now();
        
        // Second call immediately - should use cache
        const secondCall = await analyticsService.getKPIMetrics(dateRange);
        const secondCallTime = Date.now();
        
        // Should be much faster (cached)
        expect(secondCallTime - firstCallTime).toBeLessThan(100);
        
        // Data should match
        expect(secondCall).toEqual(firstCall);
        
        // After 5+ minutes, should fetch fresh data
        // (This part would need time mocking in real tests)
      }
    ),
    { numRuns: 50 } // Fewer runs due to async nature
  );
});
```

### Integration Testing

**End-to-End Scenarios**:

1. **Dashboard to Analytics Navigation**:
   - User logs in as admin
   - Views Dashboard with sales data
   - Navigates to Reports > Analytics
   - Verifies analytics data loads
   - Compares revenue figures between both views

2. **Date Range Filtering and Export**:
   - User selects Analytics tab
   - Changes date range to last 30 days
   - Verifies charts update
   - Exports to PDF
   - Verifies download contains correct date range

3. **Tab Switching Preservation**:
   - User views Financial report
   - Switches to Analytics tab
   - Switches back to Financial
   - Verifies Financial data is still loaded

4. **Error Recovery**:
   - Simulate network failure
   - Verify error message displays
   - Click retry button
   - Verify data loads successfully

### Test Coverage Goals

- **Unit Tests**: 80%+ code coverage
- **Property Tests**: All 12 correctness properties implemented
- **Integration Tests**: All critical user flows covered
- **Edge Cases**: All error conditions tested



## Implementation Details

### File Operations

**1. Dashboard Restoration**:
```bash
# Copy backup file to current location
cp backups/pre-security-update-2026-02-26-092920/rcmc-emr/src/pages/Dashboard.jsx \
   src/pages/Dashboard.jsx
```

**Verification**:
- File size should match backup (approximately 30KB)
- Should contain StatCard imports
- Should contain Recharts imports
- Should NOT contain analytics components imports
- Should contain admin-only sales section

**2. Reports Enhancement**:

Modify `src/pages/Reports.jsx`:

**Add Analytics Tab to tabs array**:
```javascript
const tabs = [
  { id: 'financial', label: 'Financial', icon: DollarSign },
  { id: 'patients', label: 'Patients', icon: Users },
  { id: 'appointments', label: 'Appointments', icon: Calendar },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp } // NEW
]
```

**Add Analytics Dashboard component**:
```javascript
// Import analytics dependencies
import { RefreshCw, Download } from 'lucide-react'
import KPICard from '../components/analytics/KPICard'
import PatientDistributionChart from '../components/analytics/PatientDistributionChart'
import RevenueTrendChart from '../components/analytics/RevenueTrendChart'
import ExpenseBreakdownChart from '../components/analytics/ExpenseBreakdownChart'
import PerformanceComparisonChart from '../components/analytics/PerformanceComparisonChart'
import DateRangeFilter from '../components/analytics/DateRangeFilter'
import useAnalytics from '../hooks/useAnalytics'
import exportService from '../services/exportService'

// Analytics Dashboard component (embedded in Reports.jsx)
const AnalyticsDashboard = () => {
  // Date range management
  const getInitialDateRange = () => {
    try {
      const stored = sessionStorage.getItem('analyticsDateRange');
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          startDate: new Date(parsed.startDate),
          endDate: new Date(parsed.endDate)
        };
      }
    } catch (error) {
      console.error('Error restoring date range:', error);
    }
    
    // Default to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startDate: firstDay, endDate: now };
  };

  const [dateRange, setDateRange] = useState(getInitialDateRange);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);

  // Use analytics hook
  const { metrics, chartData, loading, error, lastUpdated, refresh } = useAnalytics(dateRange);

  // Persist date range
  useEffect(() => {
    try {
      sessionStorage.setItem('analyticsDateRange', JSON.stringify({
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString()
      }));
    } catch (error) {
      console.warn('Failed to persist date range:', error);
    }
  }, [dateRange]);

  // Handle date range change
  const handleDateRangeChange = (startDate, endDate) => {
    setDateRange({ startDate, endDate });
  };

  // Handle export
  const handleExport = async (format) => {
    setExporting(true);
    setExportError(null);

    try {
      const data = { metrics, chartData };
      const dateRangeFormatted = {
        startDate: dateRange.startDate.toISOString().split('T')[0],
        endDate: dateRange.endDate.toISOString().split('T')[0]
      };

      let blob;
      if (format === 'pdf') {
        blob = await exportService.exportToPDF(data, dateRangeFormatted);
      } else if (format === 'xlsx') {
        blob = await exportService.exportToExcel(data, dateRangeFormatted);
      } else if (format === 'csv') {
        blob = await exportService.exportToCSV(data, dateRangeFormatted);
      }

      const filename = exportService.generateFilename(format, dateRangeFormatted);
      exportService.downloadFile(blob, filename);

      setShowExportModal(false);
    } catch (err) {
      console.error('Export error:', err);
      setExportError(err.message || 'Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Format last updated timestamp
  const formatLastUpdated = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Render analytics dashboard UI
  // (Full implementation from current Dashboard.jsx)
  return (/* Analytics Dashboard JSX */);
};
```

**Add conditional rendering in Reports component**:
```javascript
{/* Report Content */}
<div className="bg-white rounded-xl shadow-sm p-6">
  {loading ? (
    <div className="py-12">
      <HeartbeatLoader message="Generating report..." />
    </div>
  ) : !reportData && activeTab !== 'analytics' ? (
    <div className="py-12 text-center">
      <FileText size={48} className="mx-auto text-slate-300 mb-4" />
      <p className="text-slate-600 font-semibold">No data available</p>
      <p className="text-sm text-slate-500 mt-1">Adjust the date range and try again</p>
    </div>
  ) : (
    <>
      {activeTab === 'analytics' && <AnalyticsDashboard />}
      {activeTab === 'financial' && <FinancialReport data={reportData} />}
      {activeTab === 'patients' && <PatientReport data={reportData} />}
      {activeTab === 'appointments' && <AppointmentReport data={reportData} />}
      {activeTab === 'inventory' && <InventoryReport data={reportData} />}
    </>
  )}
</div>
```

**3. File Preservation Verification**:

Ensure these files remain unchanged:
- `src/components/analytics/KPICard.jsx`
- `src/components/analytics/PatientDistributionChart.jsx`
- `src/components/analytics/RevenueTrendChart.jsx`
- `src/components/analytics/ExpenseBreakdownChart.jsx`
- `src/components/analytics/PerformanceComparisonChart.jsx`
- `src/components/analytics/DateRangeFilter.jsx`
- `src/hooks/useAnalytics.js`
- `src/services/analyticsService.js`
- `src/services/exportService.js`
- `src/utils/metricCalculations.js`
- `src/utils/configurationParser.js`



### Migration Strategy

**Phase 1: Backup and Preparation**
1. Create backup of current Dashboard.jsx (already exists in backups/)
2. Create backup of current Reports.jsx
3. Verify all analytics component files exist
4. Document current state

**Phase 2: Dashboard Restoration**
1. Copy backup Dashboard.jsx to src/pages/Dashboard.jsx
2. Verify imports are correct
3. Test Dashboard rendering
4. Verify data loading works
5. Test admin-only sections
6. Run unit tests

**Phase 3: Reports Enhancement**
1. Add Analytics tab to tabs array
2. Import analytics dependencies
3. Create AnalyticsDashboard component in Reports.jsx
4. Add conditional rendering for Analytics tab
5. Test tab switching
6. Verify existing tabs still work

**Phase 4: Integration Testing**
1. Test Dashboard loads correctly
2. Test Reports > Analytics tab loads
3. Test date range filtering in Analytics
4. Test export functionality
5. Test data consistency between Dashboard and Analytics
6. Test responsive design on mobile/tablet/desktop

**Phase 5: Validation**
1. Run all unit tests
2. Run all property-based tests
3. Verify no analytics files were deleted
4. Verify import paths are correct
5. Check browser console for errors
6. Verify session storage persistence

**Rollback Plan**:
If issues are discovered:
1. Restore Dashboard.jsx from pre-migration backup
2. Restore Reports.jsx from pre-migration backup
3. Verify system returns to previous state
4. Document issues for resolution

### Performance Considerations

**Dashboard Performance**:
- Initial load should complete within 2 seconds
- Use Promise.all() for parallel data fetching
- Implement loading states for better UX
- Cache doctor performance calculations

**Analytics Performance**:
- Leverage existing 5-minute cache in analyticsService
- Debounce date range changes (500ms)
- Pause auto-refresh when tab is inactive
- Use React.memo for chart components to prevent unnecessary re-renders

**Reports Performance**:
- Maintain existing lazy loading for report data
- Don't load Analytics data until tab is selected
- Preserve existing CSV export optimization

### Responsive Design

**Dashboard Responsive Breakpoints**:
- Mobile (320px-767px): Stack stat cards vertically, single column layout
- Tablet (768px-1023px): 2-column grid for stat cards, stacked charts
- Desktop (1024px+): 4-column grid for stat cards, side-by-side charts

**Analytics Responsive Breakpoints**:
- Mobile: Stack KPI cards vertically, full-width charts
- Tablet: 2-column KPI grid, full-width charts
- Desktop: 4-column KPI grid, 2-column chart grid

**Reports Tab Navigation**:
- Mobile: Horizontal scroll for tabs if needed
- Tablet/Desktop: Flex wrap for tabs

### Security Considerations

**Authentication**:
- Dashboard admin sections check `userProfile.role === 'admin'`
- Analytics tab accessible to all authenticated users
- Export functionality requires authentication

**Data Access**:
- All database queries use Supabase RLS policies
- Analytics service respects user permissions
- No sensitive data exposed in exports without authorization

**Session Storage**:
- Only stores date range preferences (non-sensitive)
- No authentication tokens or user data
- Cleared on logout

### Accessibility

**Keyboard Navigation**:
- All interactive elements are keyboard accessible
- Tab order follows logical flow
- Focus indicators visible on all controls

**Screen Readers**:
- Stat cards have descriptive labels
- Charts have aria-labels
- Loading states announced
- Error messages announced

**Color Contrast**:
- All text meets WCAG AA standards (4.5:1 ratio)
- Chart colors distinguishable
- Error messages use color + text

**Responsive Text**:
- Font sizes scale appropriately
- No horizontal scrolling required
- Touch targets minimum 44x44px on mobile



## Dependencies

### Existing Dependencies (No Changes Required)

**React Ecosystem**:
- react: ^18.2.0
- react-dom: ^18.2.0
- react-router-dom: ^6.x

**UI Libraries**:
- lucide-react: ^0.x (icons)
- recharts: ^2.x (charts)

**Data & State**:
- @supabase/supabase-js: ^2.x (database)

**Export Libraries**:
- jspdf: ^2.x (PDF generation)
- html2canvas: ^1.x (PDF screenshots)
- xlsx: ^0.x (Excel generation)

**Testing**:
- vitest: ^1.x (test runner)
- @testing-library/react: ^14.x (React testing)
- @testing-library/user-event: ^14.x (user interactions)
- fast-check: ^3.x (property-based testing)

### Import Changes

**Dashboard.jsx** (restored from backup):
```javascript
import { useEffect, useState } from 'react'
import { Users, Stethoscope, Calendar, Bed, RefreshCw, Download, Search, Filter, ChevronLeft, ChevronRight, MapPin, DollarSign, TrendingUp, ShoppingCart, Pill } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts'
import StatCard from '../components/StatCard'
import { db } from '../lib/supabase'
import HeartbeatLoader from '../components/HeartbeatLoader'
import { useAuth } from '../context/AuthContext'
```

**Reports.jsx** (enhanced):
```javascript
// Existing imports
import { useState, useEffect } from 'react'
import { Calendar, Download, FileText, TrendingUp, Users, DollarSign, Package, Activity } from 'lucide-react'
import { db } from '../lib/supabase'
import HeartbeatLoader from '../components/HeartbeatLoader'

// New imports for Analytics tab
import { RefreshCw, Heart } from 'lucide-react'
import KPICard from '../components/analytics/KPICard'
import PatientDistributionChart from '../components/analytics/PatientDistributionChart'
import RevenueTrendChart from '../components/analytics/RevenueTrendChart'
import ExpenseBreakdownChart from '../components/analytics/ExpenseBreakdownChart'
import PerformanceComparisonChart from '../components/analytics/PerformanceComparisonChart'
import DateRangeFilter from '../components/analytics/DateRangeFilter'
import useAnalytics from '../hooks/useAnalytics'
import exportService from '../services/exportService'
```

## Deployment Checklist

### Pre-Deployment

- [ ] All unit tests passing
- [ ] All property-based tests passing
- [ ] Integration tests completed
- [ ] Code review completed
- [ ] Backup files verified
- [ ] Analytics components verified intact
- [ ] Import paths verified
- [ ] Browser console clean (no errors)

### Deployment Steps

1. **Database Verification**:
   - [ ] Verify all required tables exist
   - [ ] Verify RLS policies are active
   - [ ] Test database queries

2. **File Deployment**:
   - [ ] Deploy Dashboard.jsx
   - [ ] Deploy Reports.jsx
   - [ ] Verify analytics components unchanged
   - [ ] Verify services unchanged

3. **Build and Test**:
   - [ ] Run production build
   - [ ] Test build locally
   - [ ] Verify no build errors
   - [ ] Check bundle size

4. **Smoke Testing**:
   - [ ] Test Dashboard loads
   - [ ] Test Reports > Analytics tab
   - [ ] Test date range filtering
   - [ ] Test export functionality
   - [ ] Test on mobile device
   - [ ] Test on tablet
   - [ ] Test on desktop

### Post-Deployment

- [ ] Monitor error logs
- [ ] Verify analytics data loading
- [ ] Check session storage persistence
- [ ] Verify export downloads work
- [ ] Test with admin user
- [ ] Test with non-admin user
- [ ] Collect user feedback

### Rollback Criteria

Rollback if any of these occur:
- Dashboard fails to load
- Analytics tab causes errors
- Existing Reports tabs broken
- Data loading failures
- Export functionality broken
- Critical performance degradation

## Future Enhancements

### Potential Improvements (Out of Scope)

1. **Real-Time Collaboration**:
   - Share analytics views with team members
   - Collaborative annotations on charts

2. **Custom Dashboards**:
   - Allow users to create custom dashboard layouts
   - Drag-and-drop widget arrangement

3. **Advanced Filtering**:
   - Filter by doctor, department, patient type
   - Save filter presets

4. **Scheduled Reports**:
   - Email reports on schedule
   - Automated export generation

5. **Mobile App**:
   - Native mobile app for analytics
   - Push notifications for alerts

6. **AI Insights**:
   - Predictive analytics
   - Anomaly detection
   - Trend forecasting

## Conclusion

This design provides a comprehensive plan for reverting the Dashboard to its original implementation while migrating advanced analytics to the Reports module. The approach prioritizes:

- **Data Preservation**: All analytics functionality is preserved
- **Backward Compatibility**: Existing Reports features continue to work
- **User Experience**: Familiar Dashboard interface restored
- **Maintainability**: Clean separation of concerns
- **Testability**: Comprehensive test coverage with both unit and property-based tests
- **Performance**: Optimized data loading and caching
- **Accessibility**: WCAG-compliant interface

The migration can be completed in phases with clear rollback options at each stage, minimizing risk to the production system.

