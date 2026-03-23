# Design Document: Doctor Revenue Sharing Report

## Overview

The Doctor Revenue Sharing Report feature provides comprehensive financial transparency for clinic administrators and doctors by displaying per-doctor consultation counts and revenue breakdowns across multiple service categories. The system automatically calculates a 60/40 revenue split (60% to doctor, 40% to clinic) and integrates seamlessly into the existing Reports & Analytics section.

### Key Design Principles

1. **Data Accuracy**: All calculations derive from actual billing and consultation records with no hardcoded values
2. **Performance**: Optimized database queries with indexing and caching for sub-3-second load times
3. **Security**: Role-based access control ensures doctors see only their own data while admins see all
4. **Consistency**: Reuses existing UI components (DateRangeFilter, export utilities) for familiar user experience
5. **Extensibility**: Modular architecture allows easy addition of new revenue categories or split ratios

### Technical Stack

- **Frontend**: React 18+ with functional components and hooks
- **Styling**: Tailwind CSS for consistent design language
- **Backend**: Supabase PostgreSQL with Row Level Security (RLS)
- **State Management**: React Context API for shared state
- **Export**: jsPDF, xlsx, and CSV generation utilities
- **Caching**: In-memory cache with 5-minute TTL

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Reports & Analytics UI                    │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐ │
│  │   Analytics    │  │   Financial    │  │  Doctor Rev   │ │
│  │   Dashboard    │  │    Reports     │  │    Sharing    │ │
│  └────────────────┘  └────────────────┘  └───────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              DoctorRevenueService (New)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  • getRevenueByDoctor(dateRange, doctorId?)          │  │
│  │  • calculateRevenueSplit(amount, splitRatio)         │  │
│  │  • aggregateRevenueByCategory(billingItems)          │  │
│  │  • getSummaryStatistics(dateRange)                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Database                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │ consultations│  │   billing    │  │  user_profiles   │ │
│  │              │  │              │  │                  │ │
│  │ • doctor_id  │  │ • items JSONB│  │ • role          │ │
│  │ • patient_id │  │ • total_amt  │  │ • doctor_id     │ │
│  │ • consult_dt │  │ • amount_paid│  │                  │ │
│  └──────────────┘  └──────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Interaction**: User selects date range and navigates to Doctor Revenue Sharing tab
2. **Authentication Check**: System verifies user role (admin or doctor)
3. **Data Fetching**: Service layer queries Supabase with appropriate filters
4. **Data Aggregation**: Revenue categorized and split calculations performed
5. **Rendering**: React components display formatted data with charts
6. **Export**: User can download report in CSV, PDF, or Excel format

### Integration Points

- **Reports.jsx**: Add new tab "Doctor Revenue Sharing" to existing tabs array
- **DateRangeFilter**: Reuse existing component for date selection
- **exportService.js**: Extend with new export methods for revenue report
- **analyticsService.js**: Add new service methods for revenue queries
- **Supabase RLS**: Leverage existing policies with doctor-specific filtering

## Components and Interfaces

### React Components

#### DoctorRevenueReport (New Component)

Primary component for displaying the revenue sharing report.

**Props:**
- `dateRange: { startDate: Date, endDate: Date }` - Selected date range
- `userRole: string` - Current user's role (admin/doctor)
- `doctorId?: string` - Doctor ID (for doctor role users)

**State:**
- `loading: boolean` - Loading indicator
- `reportData: RevenueReportData | null` - Fetched report data
- `error: string | null` - Error message if fetch fails
- `exportFormat: 'csv' | 'pdf' | 'xlsx' | null` - Selected export format

**Methods:**
- `loadReportData()` - Fetch report data from service layer
- `handleDateRangeChange(start, end)` - Update date range and reload
- `handleExport(format)` - Trigger export in selected format
- `calculateGrandTotals()` - Sum all doctor shares and clinic shares

#### RevenueSummaryCards (New Component)

Displays summary statistics at the top of the report.

**Props:**
- `totalConsultations: number`
- `totalRevenue: number`
- `totalDoctorShare: number`
- `totalClinicShare: number`

#### DoctorRevenueTable (New Component)

Table displaying per-doctor revenue breakdown.

**Props:**
- `doctors: DoctorRevenueData[]` - Array of doctor revenue data
- `sortBy: string` - Current sort column
- `sortOrder: 'asc' | 'desc'` - Sort direction
- `onSort: (column: string) => void` - Sort handler

### Data Models

#### RevenueReportData

```typescript
interface RevenueReportData {
  summary: {
    totalConsultations: number
    totalRevenue: number
    totalDoctorShare: number
    totalClinicShare: number
    dateRange: { startDate: string, endDate: string }
  }
  doctors: DoctorRevenueData[]
  dataQualityScore: number // Percentage of consultations with complete billing
}
```

#### DoctorRevenueData

```typescript
interface DoctorRevenueData {
  doctorId: string
  doctorName: string
  specialization: string
  consultationCount: number
  revenueByCategory: {
    consultationFees: CategoryRevenue
    procedures: CategoryRevenue
    services: CategoryRevenue
    medicine: CategoryRevenue
    labs: CategoryRevenue
    other: CategoryRevenue
  }
  totalRevenue: number
  doctorShare: number // 60% of totalRevenue
  clinicShare: number // 40% of totalRevenue
}
```

#### CategoryRevenue

```typescript
interface CategoryRevenue {
  total: number
  doctorShare: number // 60%
  clinicShare: number // 40%
}
```

### Service Layer API

#### DoctorRevenueService

**Location**: `src/services/doctorRevenueService.js`

**Methods**:

```javascript
/**
 * Get revenue report data for all doctors or specific doctor
 * @param {Object} dateRange - { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' }
 * @param {string} doctorId - Optional doctor ID for filtering
 * @returns {Promise<RevenueReportData>}
 */
async function getRevenueReport(dateRange, doctorId = null)

/**
 * Calculate 60/40 revenue split
 * @param {number} amount - Total revenue amount
 * @param {number} doctorPercentage - Doctor's percentage (default 60)
 * @returns {Object} { doctorShare, clinicShare }
 */
function calculateRevenueSplit(amount, doctorPercentage = 60)

/**
 * Categorize billing items into revenue categories
 * @param {Array} items - Billing items JSONB array
 * @returns {Object} Revenue by category
 */
function categorizeRevenue(items)

/**
 * Get consultation count for doctor in date range
 * @param {string} doctorId
 * @param {Object} dateRange
 * @returns {Promise<number>}
 */
async function getConsultationCount(doctorId, dateRange)

/**
 * Export revenue report to specified format
 * @param {RevenueReportData} data
 * @param {string} format - 'csv' | 'pdf' | 'xlsx'
 * @param {Object} dateRange
 * @returns {Promise<Blob>}
 */
async function exportReport(data, format, dateRange)
```

## Data Models

### Database Schema

The feature leverages existing tables with no schema changes required:

**consultations table**:
- `id` (UUID, PK)
- `doctor_id` (UUID, FK to doctors)
- `patient_id` (UUID, FK to patients)
- `consultation_date` (TIMESTAMP) - Used for date filtering
- `status` (TEXT) - Filter for 'Completed' status

**billing table**:
- `id` (UUID, PK)
- `consultation_id` (UUID, FK to consultations)
- `items` (JSONB) - Array of billing items with type and amount
- `total_amount` (NUMERIC)
- `amount_paid` (NUMERIC)
- `payment_status` (TEXT) - Filter for 'Paid' or 'Partial'
- `created_at` (TIMESTAMP)

**doctors table**:
- `id` (UUID, PK)
- `first_name` (TEXT)
- `last_name` (TEXT)
- `specialization` (TEXT)
- `status` (TEXT) - Filter for 'Active'

**user_profiles table**:
- `id` (UUID, PK, FK to auth.users)
- `role` (TEXT) - 'admin' or 'doctor'
- `doctor_id` (UUID, FK to doctors) - Links user to doctor record

### Billing Items JSONB Structure

```json
{
  "items": [
    {
      "name": "General Consultation",
      "type": "consultation",
      "price": 500.00,
      "quantity": 1,
      "total": 500.00
    },
    {
      "name": "Blood Test - CBC",
      "type": "lab",
      "price": 350.00,
      "quantity": 1,
      "total": 350.00
    },
    {
      "name": "Amoxicillin 500mg",
      "type": "medicine",
      "price": 5.00,
      "quantity": 21,
      "total": 105.00
    }
  ]
}
```

### Revenue Category Mapping

| Billing Item Type | Revenue Category |
|-------------------|------------------|
| `consultation`, `consult`, `checkup` | Consultation Fees |
| `procedure`, `surgery`, `operation` | Procedures |
| `service`, `therapy`, `treatment` | Services |
| `medicine`, `medication`, `drug`, `pharmaceutical` | Medicine |
| `lab`, `laboratory`, `test`, `xray`, `imaging` | Labs |
| All others | Other |

### Database Queries

#### Query 1: Get Doctor Revenue Data

```sql
SELECT 
  d.id as doctor_id,
  d.first_name || ' ' || d.last_name as doctor_name,
  d.specialization,
  COUNT(DISTINCT c.id) as consultation_count,
  COALESCE(SUM(b.amount_paid), 0) as total_revenue,
  b.items
FROM emr.doctors d
LEFT JOIN emr.consultations c ON d.id = c.doctor_id
  AND c.consultation_date >= $1
  AND c.consultation_date <= $2
LEFT JOIN emr.billing b ON c.id = b.consultation_id
  AND b.payment_status IN ('Paid', 'Partial')
WHERE d.status = 'Active'
  AND ($3::uuid IS NULL OR d.id = $3)
GROUP BY d.id, d.first_name, d.last_name, d.specialization, b.items
ORDER BY total_revenue DESC;
```

**Parameters**:
- `$1`: startDate (YYYY-MM-DD)
- `$2`: endDate (YYYY-MM-DD)
- `$3`: doctorId (optional, NULL for all doctors)

**Indexes Required**:
- `idx_consultations_doctor_date` on `(doctor_id, consultation_date)`
- `idx_billing_consultation` on `(consultation_id)`
- `idx_billing_status` on `(payment_status)`

#### Query 2: Get Consultation Count (for data quality)

```sql
SELECT 
  COUNT(*) as total_consultations,
  COUNT(b.id) as consultations_with_billing
FROM emr.consultations c
LEFT JOIN emr.billing b ON c.id = b.consultation_id
WHERE c.consultation_date >= $1
  AND c.consultation_date <= $2
  AND ($3::uuid IS NULL OR c.doctor_id = $3);
```

### Performance Optimization

1. **Database Indexes**: Create composite indexes on frequently queried columns
2. **Query Caching**: Cache report data for 5 minutes to reduce database load
3. **Pagination**: Implement pagination for reports with >50 doctors
4. **Lazy Loading**: Load detailed revenue breakdown on row expansion
5. **Connection Pooling**: Leverage Supabase's built-in connection pooling


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies and consolidations:

**Redundancy Analysis**:
- Properties 3.1 and 3.2 (Doctor Share 60%, Clinic Share 40%) can be combined into a single property about split calculation
- Properties 3.3 and 3.4 (displaying split amounts and applying consistently) are redundant - if we apply the split consistently, the display will show it
- Properties 6.5 and 6.6 (sum of doctor shares, sum of clinic shares) can be combined into a single aggregation property
- Properties 8.2 and 8.3 (doctor sees own data, admin sees all) can be combined into a single role-based filtering property
- Properties 2.1, 2.3 (aggregate revenue, calculate total) are testing the same aggregation behavior

**Consolidated Properties**:
After removing redundancies, we have 25 unique testable properties covering:
- Data filtering and display (5 properties)
- Revenue categorization and calculation (4 properties)
- Revenue split calculations (3 properties)
- Date range filtering (2 properties)
- Export functionality (4 properties)
- Summary statistics (2 properties)
- Access control (3 properties)
- Data quality handling (2 properties)

### Property 1: Active Doctors Display

*For any* set of doctors in the database, when the revenue report is loaded, only doctors with status "Active" should appear in the report, regardless of whether they have consultations in the date range.

**Validates: Requirements 1.1, 7.3**

### Property 2: Consultation Count Accuracy

*For any* doctor and date range, the displayed consultation count should equal the number of consultations where consultation_date falls within the range AND (status is "Completed" OR a linked billing record exists with payment_status "Paid" or "Partial").

**Validates: Requirements 1.2, 1.3**

### Property 3: Consultation Count Sorting

*For any* list of doctors in the report, when sorted by consultation count in descending order, for all adjacent pairs (doctor_i, doctor_i+1), doctor_i.consultationCount >= doctor_i+1.consultationCount.

**Validates: Requirements 1.5**

### Property 4: Revenue Categorization Completeness

*For any* billing item, the categorization function should assign it to exactly one of the following categories: "Consultation Fees", "Procedures", "Services", "Medicine", "Labs", or "Other", based on the item's type field.

**Validates: Requirements 2.2, 2.4**

### Property 5: Revenue Aggregation by Category

*For any* doctor and category, the total revenue for that category should equal the sum of all billing item totals where the item's type maps to that category and the billing record is linked to one of the doctor's consultations in the date range.

**Validates: Requirements 2.1, 2.3**

### Property 6: Revenue Split Calculation

*For any* revenue amount, the calculated doctor share should equal amount × 0.60 (rounded to 2 decimal places) and the clinic share should equal amount × 0.40 (rounded to 2 decimal places), and doctorShare + clinicShare should equal the original amount (within 0.01 due to rounding).

**Validates: Requirements 3.1, 3.2, 3.4, 3.5**

### Property 7: Split Display Completeness

*For any* revenue category in the report, the displayed data should include three values: total revenue, doctor share (60%), and clinic share (40%).

**Validates: Requirements 3.3**

### Property 8: Grand Total Aggregation

*For any* revenue report, the grand total doctor share should equal the sum of all individual doctor shares across all doctors and categories, and the grand total clinic share should equal the sum of all individual clinic shares, and grandTotalDoctorShare + grandTotalClinicShare should equal the sum of all revenue.

**Validates: Requirements 3.6, 6.5, 6.6**

### Property 9: Date Range Filtering

*For any* date range selection, the report should display only consultations where consultation_date >= startDate AND consultation_date <= endDate, and changing the date range should update all displayed data accordingly.

**Validates: Requirements 4.3, 6.3**

### Property 10: Date Range Validation

*For any* date range where endDate < startDate, the system should display a validation error and prevent report generation.

**Validates: Requirements 4.6** (Edge Case)

### Property 11: CSV Export Data Integrity

*For any* revenue report data, the generated CSV file should contain all doctors, all revenue categories, all split calculations, and all summary statistics that are displayed in the on-screen report, with proper column headers and RFC 4180 compliant formatting.

**Validates: Requirements 5.2, 5.7**

### Property 12: PDF Export Completeness

*For any* revenue report data, the generated PDF should include the clinic logo, report title, selected date range, all doctor revenue data, all category breakdowns, all split calculations, and summary statistics.

**Validates: Requirements 5.3**

### Property 13: Excel Export Structure

*For any* revenue report data, the generated XLSX file should contain properly formatted cells with all report data and formulas that calculate totals and percentages.

**Validates: Requirements 5.4**

### Property 14: Export Filename Format

*For any* date range and export format, the generated filename should follow the pattern "doctor-revenue-report-{startDate}-to-{endDate}.{extension}" where dates are in YYYY-MM-DD format.

**Validates: Requirements 5.5**

### Property 15: Summary Statistics Calculation

*For any* revenue report, the summary section's Total Consultations should equal the sum of all doctors' consultation counts, Total Revenue should equal the sum of all doctors' total revenue, Total Doctor Share should equal the sum of all doctors' doctor shares, and Total Clinic Share should equal the sum of all doctors' clinic shares.

**Validates: Requirements 6.2, 6.5, 6.6**

### Property 16: Data Quality Score Calculation

*For any* set of consultations in the date range, the data quality score should equal (count of consultations with linked billing records / total count of consultations) × 100, rounded to one decimal place.

**Validates: Requirements 7.5**

### Property 17: Role-Based Access Control

*For any* user, the report should be accessible if and only if the user's role is "admin" or "doctor", otherwise the user should be redirected to the dashboard.

**Validates: Requirements 8.1, 8.5**

### Property 18: Role-Based Data Filtering

*For any* user with role "doctor", the report should display only revenue data where doctor_id matches the user's linked doctor_id, whereas for users with role "admin", the report should display data for all doctors.

**Validates: Requirements 8.2, 8.3**

### Property 19: UI Visibility by Role

*For any* user with role "receptionist" or any role other than "admin" or "doctor", the Doctor Revenue Sharing tab should not be visible in the Analytics Dashboard navigation.

**Validates: Requirements 8.4**

### Property 20: Currency Formatting

*For any* revenue amount displayed in the report, the value should be formatted as "₱{amount}" where amount is displayed with exactly two decimal places and thousands separators.

**Validates: Requirements 2.6**

### Property 21: Consultation Without Billing Handling

*For any* consultation that has no linked billing record, the consultation should be included in the consultation count but should contribute ₱0.00 to all revenue calculations.

**Validates: Requirements 7.1** (Edge Case)

### Property 22: Zero Revenue Handling

*For any* billing record where total_amount is zero or null, the revenue contribution should be treated as ₱0.00 in all calculations.

**Validates: Requirements 7.2** (Edge Case)

### Property 23: Malformed JSONB Handling

*For any* billing record where the items JSONB field is empty, null, or malformed (cannot be parsed), the system should log a warning, skip that billing record in revenue calculations, and continue processing other records.

**Validates: Requirements 7.4** (Edge Case)

### Property 24: Date Range State Persistence

*For any* selected date range, when a user switches from the Doctor Revenue Sharing tab to another report tab and back, the date range selection should be preserved.

**Validates: Requirements 10.5**

### Property 25: Large Date Range Warning

*For any* date range where the difference between endDate and startDate exceeds 730 days (2 years), the system should display a warning message suggesting a shorter range for better performance.

**Validates: Requirements 9.5** (Edge Case)


## Error Handling

### Error Categories

#### 1. Authentication Errors

**Scenario**: User is not authenticated or session has expired

**Handling**:
- Redirect to login page
- Display message: "Your session has expired. Please log in again."
- Preserve intended destination for post-login redirect

**Implementation**:
```javascript
if (!user) {
  sessionStorage.setItem('redirectAfterLogin', '/reports?tab=doctor-revenue');
  navigate('/login');
  return;
}
```

#### 2. Authorization Errors

**Scenario**: User role is not "admin" or "doctor"

**Handling**:
- Redirect to dashboard
- Display toast notification: "You don't have permission to access this report."
- Log unauthorized access attempt for security audit

**Implementation**:
```javascript
if (!['admin', 'doctor'].includes(userRole)) {
  console.warn(`Unauthorized access attempt by user ${userId} with role ${userRole}`);
  showToast('You don\'t have permission to access this report.', 'error');
  navigate('/dashboard');
  return;
}
```

#### 3. Database Query Errors

**Scenario**: Supabase query fails due to network, timeout, or database error

**Handling**:
- Display user-friendly error message
- Log detailed error for debugging
- Provide retry button
- Fall back to cached data if available

**Implementation**:
```javascript
try {
  const { data, error } = await supabase.from('consultations').select('*');
  if (error) throw error;
  return data;
} catch (error) {
  console.error('Database query failed:', error);
  
  // Try to use cached data
  const cached = getCachedData(cacheKey);
  if (cached) {
    showToast('Using cached data due to connection issue', 'warning');
    return cached;
  }
  
  // No cache available
  throw new Error('Failed to load report data. Please check your connection and try again.');
}
```

#### 4. Data Validation Errors

**Scenario**: Invalid date range (end before start)

**Handling**:
- Display inline validation error
- Prevent report generation
- Highlight invalid fields

**Implementation**:
```javascript
if (new Date(endDate) < new Date(startDate)) {
  setError('End date cannot be before start date');
  return;
}
```

#### 5. Data Quality Errors

**Scenario**: Malformed JSONB in billing items

**Handling**:
- Log warning with billing record ID
- Skip malformed record
- Continue processing other records
- Display data quality indicator showing affected records

**Implementation**:
```javascript
function categorizeRevenue(items) {
  try {
    if (!items || !Array.isArray(items)) {
      console.warn('Malformed billing items:', items);
      return getEmptyCategoryRevenue();
    }
    // Process items...
  } catch (error) {
    console.error('Error categorizing revenue:', error);
    return getEmptyCategoryRevenue();
  }
}
```

#### 6. Export Errors

**Scenario**: Export generation fails (PDF, CSV, Excel)

**Handling**:
- Display error modal with specific message
- Offer alternative export formats
- Log error details for debugging

**Implementation**:
```javascript
try {
  const blob = await exportToPDF(reportData, dateRange);
  downloadFile(blob, filename);
} catch (error) {
  console.error('PDF export failed:', error);
  setExportError('Failed to generate PDF. Please try CSV or Excel format.');
}
```

#### 7. Performance Errors

**Scenario**: Query takes longer than 3 seconds

**Handling**:
- Display loading indicator with progress message
- Implement query timeout (5 seconds)
- Suggest shorter date range if timeout occurs

**Implementation**:
```javascript
const QUERY_TIMEOUT = 5000;

async function queryWithTimeout(queryPromise) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Query timeout')), QUERY_TIMEOUT);
  });
  
  try {
    return await Promise.race([queryPromise, timeoutPromise]);
  } catch (error) {
    if (error.message === 'Query timeout') {
      showToast('Query is taking longer than expected. Try a shorter date range.', 'warning');
    }
    throw error;
  }
}
```

### Error Recovery Strategies

1. **Graceful Degradation**: Show partial data with indicators for missing sections
2. **Retry Logic**: Automatic retry with exponential backoff for transient errors
3. **Cache Fallback**: Use cached data when fresh data unavailable
4. **User Guidance**: Provide actionable error messages with next steps
5. **Logging**: Comprehensive error logging for debugging and monitoring

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

- **Unit Tests**: Verify specific examples, edge cases, and error conditions
- **Property Tests**: Verify universal properties across all inputs through randomization

Together, these approaches ensure both concrete correctness (unit tests) and general correctness (property tests).

### Property-Based Testing Configuration

**Library**: `fast-check` (JavaScript property-based testing library)

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with reference to design document property
- Tag format: `Feature: doctor-revenue-sharing-report, Property {number}: {property_text}`

**Installation**:
```bash
npm install --save-dev fast-check
```

### Property Test Examples

#### Property 1: Active Doctors Display

```javascript
import fc from 'fast-check';

/**
 * Feature: doctor-revenue-sharing-report
 * Property 1: For any set of doctors in the database, when the revenue report 
 * is loaded, only doctors with status "Active" should appear in the report
 */
test('Property 1: Only active doctors appear in report', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.array(doctorArbitrary(), { minLength: 1, maxLength: 20 }),
      async (doctors) => {
        // Setup: Insert doctors into test database
        await insertTestDoctors(doctors);
        
        // Execute: Load report
        const report = await getRevenueReport(testDateRange);
        
        // Verify: Only active doctors in result
        const activeDoctors = doctors.filter(d => d.status === 'Active');
        expect(report.doctors.length).toBe(activeDoctors.length);
        
        report.doctors.forEach(reportDoctor => {
          const originalDoctor = doctors.find(d => d.id === reportDoctor.doctorId);
          expect(originalDoctor.status).toBe('Active');
        });
        
        // Cleanup
        await cleanupTestDoctors();
      }
    ),
    { numRuns: 100 }
  );
});

// Arbitrary generator for doctors
function doctorArbitrary() {
  return fc.record({
    id: fc.uuid(),
    firstName: fc.string({ minLength: 1, maxLength: 50 }),
    lastName: fc.string({ minLength: 1, maxLength: 50 }),
    specialization: fc.constantFrom('General Practitioner', 'Pediatrician', 'Cardiologist'),
    status: fc.constantFrom('Active', 'Inactive'),
    licenseNumber: fc.string({ minLength: 6, maxLength: 10 })
  });
}
```

#### Property 6: Revenue Split Calculation

```javascript
/**
 * Feature: doctor-revenue-sharing-report
 * Property 6: For any revenue amount, the calculated doctor share should equal 
 * amount × 0.60 and clinic share should equal amount × 0.40, and they should sum 
 * to the original amount (within 0.01 due to rounding)
 */
test('Property 6: Revenue split calculation is correct', () => {
  fc.assert(
    fc.property(
      fc.float({ min: 0, max: 1000000, noNaN: true }),
      (amount) => {
        const { doctorShare, clinicShare } = calculateRevenueSplit(amount);
        
        // Verify split percentages
        expect(doctorShare).toBeCloseTo(amount * 0.60, 2);
        expect(clinicShare).toBeCloseTo(amount * 0.40, 2);
        
        // Verify sum equals original (within rounding tolerance)
        expect(doctorShare + clinicShare).toBeCloseTo(amount, 2);
        
        // Verify rounding to 2 decimal places
        expect(doctorShare).toBe(Math.round(doctorShare * 100) / 100);
        expect(clinicShare).toBe(Math.round(clinicShare * 100) / 100);
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 9: Date Range Filtering

```javascript
/**
 * Feature: doctor-revenue-sharing-report
 * Property 9: For any date range selection, the report should display only 
 * consultations where consultation_date >= startDate AND consultation_date <= endDate
 */
test('Property 9: Date range filtering is correct', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
      fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
      fc.array(consultationArbitrary(), { minLength: 10, maxLength: 50 }),
      async (date1, date2, consultations) => {
        // Ensure startDate <= endDate
        const startDate = date1 < date2 ? date1 : date2;
        const endDate = date1 < date2 ? date2 : date1;
        
        // Setup: Insert consultations
        await insertTestConsultations(consultations);
        
        // Execute: Load report with date range
        const report = await getRevenueReport({ startDate, endDate });
        
        // Verify: All consultations in report are within date range
        const expectedConsultations = consultations.filter(c => {
          const consultDate = new Date(c.consultation_date);
          return consultDate >= startDate && consultDate <= endDate;
        });
        
        expect(report.summary.totalConsultations).toBe(expectedConsultations.length);
        
        // Cleanup
        await cleanupTestConsultations();
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Test Examples

#### Edge Case: Consultation Without Billing

```javascript
/**
 * Feature: doctor-revenue-sharing-report
 * Edge Case: Consultation without billing should count but contribute ₱0.00
 */
test('Consultation without billing is counted with zero revenue', async () => {
  // Setup: Create doctor and consultation without billing
  const doctor = await createTestDoctor();
  const consultation = await createTestConsultation({
    doctorId: doctor.id,
    consultationDate: '2024-01-15'
  });
  // Intentionally do not create billing record
  
  // Execute
  const report = await getRevenueReport({
    startDate: '2024-01-01',
    endDate: '2024-01-31'
  });
  
  // Verify
  const doctorData = report.doctors.find(d => d.doctorId === doctor.id);
  expect(doctorData.consultationCount).toBe(1);
  expect(doctorData.totalRevenue).toBe(0);
  expect(doctorData.doctorShare).toBe(0);
  expect(doctorData.clinicShare).toBe(0);
  
  // Cleanup
  await cleanupTestData();
});
```

#### Example: Default Date Range

```javascript
/**
 * Feature: doctor-revenue-sharing-report
 * Example: Report should default to current month on load
 */
test('Report defaults to current month date range', () => {
  // Execute: Render component
  render(<DoctorRevenueReport />);
  
  // Verify: Date inputs show current month
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  const startDateInput = screen.getByLabelText('Start date');
  const endDateInput = screen.getByLabelText('End date');
  
  expect(startDateInput.value).toBe(formatDate(firstDay));
  expect(endDateInput.value).toBe(formatDate(lastDay));
});
```

### Integration Tests

Integration tests verify the complete flow from UI interaction to database query to display:

```javascript
/**
 * Integration test: Complete report generation flow
 */
test('Complete report generation flow', async () => {
  // Setup: Create test data
  const doctors = await createTestDoctors(3);
  const consultations = await createTestConsultations(doctors, 10);
  const billing = await createTestBilling(consultations);
  
  // Execute: Render component and interact
  const { user } = renderWithAuth(<DoctorRevenueReport />, { role: 'admin' });
  
  // Wait for data to load
  await waitFor(() => {
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });
  
  // Verify: Summary statistics displayed
  expect(screen.getByText(/Total Consultations/)).toBeInTheDocument();
  expect(screen.getByText(/Total Revenue/)).toBeInTheDocument();
  
  // Verify: Doctor rows displayed
  doctors.forEach(doctor => {
    expect(screen.getByText(`${doctor.firstName} ${doctor.lastName}`)).toBeInTheDocument();
  });
  
  // Interact: Export to CSV
  await user.click(screen.getByText('Export CSV'));
  
  // Verify: Download triggered
  expect(mockDownloadFile).toHaveBeenCalled();
  
  // Cleanup
  await cleanupTestData();
});
```

### Test Coverage Goals

- **Unit Tests**: 80% code coverage minimum
- **Property Tests**: All 25 correctness properties implemented
- **Integration Tests**: All major user flows covered
- **Edge Cases**: All identified edge cases tested

### Continuous Integration

Tests should run automatically on:
- Every commit to feature branch
- Pull request creation
- Merge to main branch

**CI Configuration** (GitHub Actions):
```yaml
name: Test Doctor Revenue Report

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test -- --coverage --testPathPattern=doctor-revenue
```

### Performance Testing

In addition to functional tests, performance tests verify:

1. **Query Performance**: Report loads in <3 seconds for 1-year date range
2. **Export Performance**: CSV/PDF/Excel generation completes in <5 seconds
3. **Memory Usage**: No memory leaks during repeated report generation
4. **Concurrent Users**: System handles 10 simultaneous report requests

**Performance Test Example**:
```javascript
test('Report loads within 3 seconds for 1-year range', async () => {
  const startTime = Date.now();
  
  const report = await getRevenueReport({
    startDate: '2023-01-01',
    endDate: '2023-12-31'
  });
  
  const duration = Date.now() - startTime;
  expect(duration).toBeLessThan(3000);
});
```

## Implementation Notes

### Database Migrations

No schema changes required. However, create these indexes for optimal performance:

```sql
-- Index for consultation date filtering
CREATE INDEX IF NOT EXISTS idx_consultations_doctor_date 
ON emr.consultations(doctor_id, consultation_date);

-- Index for billing consultation lookup
CREATE INDEX IF NOT EXISTS idx_billing_consultation_status 
ON emr.billing(consultation_id, payment_status);

-- Index for doctor status filtering
CREATE INDEX IF NOT EXISTS idx_doctors_status 
ON emr.doctors(status) WHERE status = 'Active';
```

### Caching Strategy

Implement in-memory caching with 5-minute TTL:

```javascript
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map();

function getCachedData(key) {
  const cached = cache.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
}

function setCachedData(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}
```

### Security Considerations

1. **SQL Injection**: Use parameterized queries (Supabase handles this)
2. **XSS Prevention**: Sanitize all user inputs before display
3. **CSRF Protection**: Leverage Supabase's built-in CSRF protection
4. **Rate Limiting**: Implement rate limiting on export endpoints
5. **Audit Logging**: Log all report access for compliance

### Accessibility

Ensure WCAG 2.1 AA compliance:

- Keyboard navigation for all interactive elements
- ARIA labels for screen readers
- Sufficient color contrast (4.5:1 minimum)
- Focus indicators on all focusable elements
- Semantic HTML structure

### Internationalization

While initially supporting English and Philippine Peso (₱), design for future i18n:

- Use i18n library for all text strings
- Support multiple currency formats
- Date formatting based on locale
- Number formatting with locale-specific separators

## Deployment Checklist

- [ ] Database indexes created
- [ ] All unit tests passing
- [ ] All property tests passing
- [ ] Integration tests passing
- [ ] Performance tests passing
- [ ] Code review completed
- [ ] Security review completed
- [ ] Accessibility audit completed
- [ ] Documentation updated
- [ ] User acceptance testing completed
- [ ] Rollback plan documented
- [ ] Monitoring and alerts configured

