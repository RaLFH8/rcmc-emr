# Design Document: Dashboard Pixel-Perfect Redesign

## Overview

This design document specifies the technical implementation for redesigning the RCMC EMR Dashboard to match a reference design pixel-by-pixel. The redesign transforms the current dashboard into a clean, modern interface with proper layout structure, visual hierarchy, and real-time data loading from the Supabase database.

### Goals

- Create a pixel-perfect match to the reference design
- Implement a responsive layout that works on desktop, tablet, and mobile devices
- Ensure all data is dynamically loaded from the database with zero hardcoded values
- Maintain performance with efficient data loading and rendering
- Provide clear loading states and error handling

### Non-Goals

- Adding new dashboard features beyond the reference design
- Modifying the database schema
- Implementing real-time data updates (websockets)
- Creating a dashboard customization system

## Architecture

### Component Structure

The dashboard follows a hierarchical component structure:

```
Dashboard (Container)
├── Header Section
│   ├── Welcome Message
│   ├── Last Updated Timestamp
│   └── Export CSV Button
├── Stat Cards Grid
│   ├── Total Patient Card
│   ├── Total Doctor Card
│   ├── Book Appointment Card
│   └── Room Availability Card
├── Two-Column Layout
│   ├── Patient Statistics Chart (Left, 2/3 width)
│   └── Appointment List (Right, 1/3 width)
│       ├── Calendar Widget
│       └── Schedule List
└── Recent Patients Table
    ├── Search and Filter Bar
    └── Data Table
```


### Data Flow

```
User Loads Dashboard
    ↓
Dashboard Component Mounts
    ↓
Set loading = true
    ↓
Parallel Data Fetching (Promise.all)
    ├── db.getStats() → Stat card values
    ├── db.getPatients(4, 0) → Recent patients
    ├── db.getDoctors() → Doctor data
    ├── db.getAppointments() → All appointments
    ├── db.getTodayAppointments() → Today's schedule
    ├── db.getRoomAvailability() → Room stats
    ├── db.getPatientStatistics() → Chart data
    └── db.getPatientGrowthData(6) → Monthly growth
    ↓
Process and Transform Data
    ├── Calculate trends
    ├── Format dates
    ├── Generate chart data
    └── Slice appointment lists
    ↓
Update State with Processed Data
    ↓
Set loading = false
    ↓
Render Dashboard with Data
```

### State Management

The dashboard uses React useState hooks for local state management:

- `loading`: Boolean indicating data fetch status
- `stats`: Object containing stat card values
- `patients`: Array of recent patient records
- `todayAppointments`: Array of today's appointments (max 4)
- `selectedDate`: Number representing selected calendar date
- `currentMonth`: Date object for calendar navigation
- `chartView`: String ('daily', 'weekly', 'monthly') for chart period
- `patientChartData`: Array of chart data points
- `patientsLastMonth`: Number for trend calculation


## Components and Interfaces

### 1. Header Section

**Purpose**: Display welcome message, timestamp, and export functionality

**Props**: None (uses AuthContext for user data)

**Structure**:
```jsx
<div className="flex items-start justify-between">
  <div>
    <h1>Welcome back, {userName}!</h1>
    <p>Here's what's happening at your clinic today</p>
  </div>
  <div className="flex items-center gap-3">
    <div className="flex items-center gap-2">
      <span>Last updated: {currentDate}</span>
      <button onClick={handleRefresh}>
        <RefreshCw />
      </button>
    </div>
    <button onClick={handleExport}>
      <Download />
      Export CSV
    </button>
  </div>
</div>
```

**Styling**:
- Title: `text-2xl font-bold text-slate-900`
- Subtitle: `text-sm text-slate-600`
- Timestamp: `text-sm text-slate-600`
- Export button: `bg-teal-500 text-white rounded-lg hover:bg-teal-600`

### 2. StatCard Component

**Purpose**: Display a single metric with icon, value, and trend

**Props**:
```typescript
interface StatCardProps {
  title: string
  value: number
  trend: string
  icon: LucideIcon
  iconBg: string // Tailwind gradient classes
}
```

**Structure**:
```jsx
<div className="bg-white rounded-xl shadow-sm p-6">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm text-slate-600">{title}</p>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
    </div>
    <div className={`p-4 rounded-xl ${iconBg}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
  </div>
  <div className="mt-4 flex items-center gap-1">
    <span className="text-sm text-emerald-600">{trend}</span>
    <span className="text-sm text-slate-500">Since last month</span>
  </div>
</div>
```

**Gradient Backgrounds**:
- Total Patient: `bg-gradient-to-br from-teal-400 to-teal-600`
- Total Doctor: `bg-gradient-to-br from-purple-400 to-purple-600`
- Book Appointment: `bg-gradient-to-br from-teal-400 to-teal-600`
- Room Availability: `bg-gradient-to-br from-pink-400 to-pink-600`


### 3. Patient Statistics Chart

**Purpose**: Display patient growth over time with comparison data

**Dependencies**: Recharts library (AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip)

**Structure**:
```jsx
<div className="col-span-2 bg-white rounded-xl shadow-sm p-6">
  <div className="flex items-center justify-between mb-6">
    <h2>Patient Statistics</h2>
    <select value={chartView} onChange={handleViewChange}>
      <option value="daily">Daily</option>
      <option value="weekly">Weekly</option>
      <option value="monthly">Monthly</option>
    </select>
  </div>
  
  <div className="mb-4">
    <span className="text-3xl font-bold">{totalPatients}</span>
    <span className="text-sm text-emerald-600">↑ Since last month</span>
  </div>
  
  <ResponsiveContainer width="100%" height={280}>
    <AreaChart data={chartData}>
      {/* Gradient definition */}
      {/* Grid, axes, tooltip */}
      {/* Comparison line (dashed) */}
      {/* Main line (solid with gradient fill) */}
    </AreaChart>
  </ResponsiveContainer>
</div>
```

**Chart Configuration**:
- Main line color: `#14b8a6` (teal-500)
- Main line width: `3px`
- Comparison line: Dashed (`strokeDasharray="5 5"`)
- Comparison color: `#94a3b8` (slate-400)
- Gradient fill: `#5eead4` (teal-300) with opacity fade
- Grid: `#f1f5f9` (slate-100), horizontal only
- Axis labels: `#94a3b8` (slate-400), 13px font

**Data Format**:
```typescript
interface ChartDataPoint {
  label: string // Month abbreviation (e.g., "Jan")
  value: number // Current period patient count
  comparison: number // Previous period patient count
}
```


### 4. Appointment List with Calendar

**Purpose**: Display calendar and today's appointments

**State**:
- `selectedDate`: Currently selected day number
- `currentMonth`: Date object for month navigation

**Calendar Logic**:
```javascript
const getDaysInMonth = (date) => {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  
  const days = []
  // Add empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }
  // Add days of month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }
  return days
}
```

**Structure**:
```jsx
<div className="bg-white rounded-xl shadow-sm p-6">
  <div className="flex items-center justify-between mb-4">
    <h2>Appointment List</h2>
    <button onClick={handleRefresh}>
      <RefreshCw />
    </button>
  </div>
  
  {/* Calendar */}
  <div className="mb-6">
    <div className="flex items-center justify-between mb-4">
      <h3>{monthName}, {year}</h3>
      <div className="flex gap-1">
        <button onClick={handlePrevMonth}>
          <ChevronLeft />
        </button>
        <button onClick={handleNextMonth}>
          <ChevronRight />
        </button>
      </div>
    </div>
    
    {/* Day names */}
    <div className="grid grid-cols-7 gap-1 mb-2">
      {dayNames.map(day => (
        <div className="text-center text-xs">{day}</div>
      ))}
    </div>
    
    {/* Calendar grid */}
    <div className="grid grid-cols-7 gap-1">
      {days.map((day, index) => (
        <button
          key={index}
          onClick={() => day && setSelectedDate(day)}
          className={`aspect-square ${
            day === selectedDate
              ? 'bg-teal-500 text-white'
              : 'hover:bg-slate-100'
          }`}
        >
          {day}
        </button>
      ))}
    </div>
  </div>
  
  {/* Schedule */}
  <div>
    <div className="flex items-center justify-between mb-3">
      <h3>Schedule</h3>
      <button>View All</button>
    </div>
    
    {appointments.length === 0 ? (
      <EmptyState />
    ) : (
      appointments.slice(0, 4).map(apt => (
        <AppointmentItem key={apt.id} appointment={apt} />
      ))
    )}
  </div>
</div>
```

**Appointment Item Structure**:
```jsx
<div className="flex items-center gap-3">
  <img src={doctorAvatar} className="w-10 h-10 rounded-full" />
  <div className="flex-1">
    <p className="text-sm font-semibold">{doctorName}</p>
    <p className="text-xs text-slate-500">{patientName} • {time}</p>
  </div>
  <span className={`px-2 py-1 rounded-full text-xs ${statusColor}`}>
    {status}
  </span>
</div>
```

**Status Colors**:
- Completed: `bg-green-100 text-green-700`
- In Progress: `bg-blue-100 text-blue-700`
- Scheduled: `bg-yellow-100 text-yellow-700`


### 5. Recent Patients Table

**Purpose**: Display recent patient records with search and filter

**Structure**:
```jsx
<div className="bg-white rounded-xl shadow-sm">
  <div className="p-6 border-b border-slate-200">
    <div className="flex items-center justify-between mb-2">
      <div>
        <h2>Recent Patients</h2>
        <p className="text-sm text-slate-500">
          Real-time inventory status across all locations
        </p>
      </div>
      <div className="flex gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search"
            className="pl-9 pr-4 py-2 border rounded-lg"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border rounded-lg">
          <Filter />
          Filter
        </button>
      </div>
    </div>
  </div>
  
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="border-b">
          <th>No</th>
          <th>Item</th>
          <th>Gender</th>
          <th>Date of Birth</th>
          <th>Location</th>
          <th>Contact</th>
        </tr>
      </thead>
      <tbody>
        {patients.map((patient, index) => (
          <tr key={patient.id} className="border-b hover:bg-slate-50">
            <td>{index + 1}</td>
            <td className="font-medium">
              {patient.first_name} {patient.last_name}
            </td>
            <td>{patient.gender}</td>
            <td>{formatDate(patient.date_of_birth)}</td>
            <td>
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span className="truncate max-w-[150px]">
                  {patient.address.substring(0, 20)}...
                </span>
              </div>
            </td>
            <td>{patient.contact_number}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

**Date Formatting**:
```javascript
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}
// Output: "Jan 15, 2025"
```


## Data Models

### Dashboard Stats

```typescript
interface DashboardStats {
  totalPatients: number
  totalDoctors: number
  bookAppointments: number // Monthly appointments
  roomAvailability: number
}
```

**Source**: `db.getStats()` - Aggregates counts from patients, doctors, appointments, and rooms tables

### Patient Record

```typescript
interface Patient {
  id: string
  patient_number: string
  first_name: string
  last_name: string
  gender: string
  date_of_birth: string // ISO date string
  address: string
  contact_number: string
  email?: string
  status: 'Active' | 'Inactive'
  created_at: string
}
```

**Source**: `db.getPatients(4, 0)` - Fetches 4 most recent active patients

### Appointment Record

```typescript
interface Appointment {
  id: string
  patient_id: string
  doctor_id: string
  appointment_date: string // ISO date string
  appointment_time: string // HH:MM format
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled'
  reason?: string
  notes?: string
  patient?: Patient // Joined data
  doctor?: Doctor // Joined data
}
```

**Source**: `db.getTodayAppointments()` - Fetches today's appointments with patient and doctor joins

### Doctor Record

```typescript
interface Doctor {
  id: string
  first_name: string
  last_name: string
  specialization: string
  license_number: string
  contact_number: string
  email: string
  status: 'Active' | 'Inactive'
  satisfaction_score?: number
  total_reviews?: number
}
```

**Source**: `db.getDoctors()` - Fetches all active doctors

### Chart Data Point

```typescript
interface ChartDataPoint {
  label: string // Month abbreviation
  value: number // Current period count
  comparison: number // Previous period count
}
```

**Source**: `db.getPatientGrowthData(6)` - Fetches patient counts grouped by month for last 6 months


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following consolidations to eliminate redundancy:

**Consolidated Properties**:
- Properties 2.8-2.11 (individual card gradient colors) → Combined into Property 2: Stat card styling consistency
- Properties 3.2-3.5 (individual column specifications) → Combined into Property 3: Two-column layout structure
- Properties 7.1-7.8 (no hardcoded data for each type) → Combined into Property 7: Database-driven data loading
- Properties 8.1-8.3 (responsive breakpoints) → Combined into Property 8: Responsive layout behavior
- Properties 4.6-4.7 (solid and dashed lines) → Combined into Property 4: Chart line rendering

**Eliminated Redundant Properties**:
- Property 2.1 (exactly 4 cards) is validated by Property 2.2 (card order), which implicitly requires 4 cards
- Property 5.8 (max 4 appointments) is validated by the data slicing in Property 5.9 (load from database)
- Property 6.7 (at least 4 patients) is validated by Property 6.6 (load from database with limit parameter)

### Property 1: Header Section Content

*For any* authenticated user, the dashboard header should display a welcome message containing the user's name and role, a subtitle, a timestamp with the current date, a refresh button, and an export CSV button with download icon.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

### Property 2: Stat Cards Grid Structure and Styling

*For any* dashboard render, exactly four stat cards should be displayed in the order (Total Patient, Total Doctor, Book Appointment, Room Availability), each containing an icon with the correct gradient background (teal for Patient/Appointment, purple for Doctor, pink for Room), a numeric value from the database, and a percentage trend indicator.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.8, 2.9, 2.10, 2.11**

### Property 3: Two-Column Layout Structure

*For any* desktop viewport, the dashboard should display a two-column grid below the stat cards where the left column (containing Patient Statistics Chart) occupies two-thirds width (col-span-2) and the right column (containing Appointment List) occupies one-third width (col-span-1).

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**


### Property 4: Patient Statistics Chart Configuration

*For any* chart render, the Patient Statistics Chart should display a title, a dropdown selector with options (Daily, Weekly, Monthly), the total patient count, a trend indicator, an area chart with gradient fill using teal color (#14b8a6), a solid line for current period data, a dashed line for comparison period data, proper axis labels, and grid lines.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.9, 4.10**

### Property 5: Chart Data Round Trip

*For any* valid patient growth data from the database, transforming it into chart data points and then rendering it should preserve the patient counts and month labels accurately.

**Validates: Requirements 4.8**

### Property 6: Calendar Date Selection

*For any* calendar render, when a user clicks on a valid date, the selected date state should update to that date and the date should be visually highlighted with the teal background color.

**Validates: Requirements 5.5, 5.6**

### Property 7: Appointment List Structure and Data

*For any* appointment list render, it should display a title, refresh button, calendar showing the current month with navigation buttons, and a schedule section that loads appointment data from the database, displays up to 4 appointments with doctor avatar/name, patient name, time, and color-coded status badges (green for Completed, blue for In Progress, yellow for Scheduled), or shows an empty state message when no appointments exist.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.7, 5.8, 5.9, 5.10, 5.11, 5.12**

### Property 8: Recent Patients Table Structure

*For any* patients table render, it should display a title, subtitle, search input with icon, filter button, table headers (No, Item, Gender, Date of Birth, Location, Contact), and patient rows loaded from the database with dates formatted as "MMM DD, YYYY", location addresses truncated with ellipsis and MapPin icon, and hover effects on rows.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.8, 6.9, 6.10, 6.11**

### Property 9: Database-Driven Data Loading

*For any* dashboard render, all displayed data (stat card values, chart data, appointment data, patient data) must come from database queries with no hardcoded arrays or objects used for display, and when the database is empty, appropriate empty state messages should be displayed.

**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9**

### Property 10: Error Handling

*For any* database query failure, the dashboard should catch the error and display an appropriate error message without crashing the application.

**Validates: Requirements 7.10**


### Property 11: Responsive Layout Behavior

*For any* viewport size, the dashboard should apply appropriate responsive classes such that stat cards stack vertically on mobile (< 768px), the two-column layout stacks vertically on mobile and tablet (< 1024px), and the recent patients table becomes horizontally scrollable on mobile devices.

**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6**

### Property 12: Loading State Display

*For any* dashboard mount, when the loading state is true, a HeartbeatLoader component with the message "Loading dashboard..." should be displayed, and when loading becomes false, the loader should be hidden and all loaded data should be immediately rendered.

**Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**

## Error Handling

### Data Loading Errors

**Strategy**: Try-catch blocks with graceful degradation

```javascript
const loadData = async () => {
  try {
    setLoading(true)
    const [statsData, patientsData, ...] = await Promise.all([
      db.getStats(),
      db.getPatients(4, 0),
      // ... other queries
    ])
    
    // Process and set data
    setStats(statsData)
    setPatients(patientsData)
    // ...
  } catch (error) {
    console.error('Error loading dashboard data:', error)
    // Set error state or show toast notification
    // Optionally set default/empty values to prevent UI crashes
  } finally {
    setLoading(false)
  }
}
```

**Error Display**:
- Console logging for debugging
- Optional toast notification for user feedback
- Graceful fallback to empty states

### Empty State Handling

**Appointments Empty State**:
```jsx
{todayAppointments.length === 0 ? (
  <div className="text-center py-8">
    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
    <p className="text-sm text-slate-500">
      No appointments scheduled for today
    </p>
  </div>
) : (
  // Render appointments
)}
```

**Chart Empty State**:
```javascript
if (chartData.length === 0) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  setPatientChartData(months.map(month => ({
    label: month,
    value: 0,
    comparison: 0
  })))
}
```

### Network Timeout

**Strategy**: Rely on Supabase client's built-in timeout handling

The Supabase client automatically handles network timeouts and connection errors. Additional timeout logic can be added if needed:

```javascript
const fetchWithTimeout = (promise, timeout = 10000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ])
}
```


## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests**: Focus on specific examples, edge cases, and integration points
- Test specific date formatting outputs
- Test empty state rendering
- Test calendar navigation logic
- Test error boundary behavior
- Test component integration with AuthContext

**Property-Based Tests**: Verify universal properties across all inputs
- Test that all data comes from database (no hardcoded values)
- Test responsive layout classes across viewport sizes
- Test chart data transformation preserves accuracy
- Test appointment filtering and limiting logic
- Test date selection state updates

### Property-Based Testing Configuration

**Library**: Use `fast-check` for JavaScript/React property-based testing

**Installation**:
```bash
npm install --save-dev fast-check @testing-library/react @testing-library/jest-dom
```

**Test Configuration**:
- Minimum 100 iterations per property test
- Each test must reference its design document property
- Tag format: `Feature: dashboard-pixel-perfect-redesign, Property {number}: {property_text}`

**Example Property Test Structure**:
```javascript
import fc from 'fast-check'
import { render, screen } from '@testing-library/react'
import Dashboard from './Dashboard'

describe('Feature: dashboard-pixel-perfect-redesign', () => {
  test('Property 2: Stat Cards Grid Structure and Styling', () => {
    fc.assert(
      fc.property(
        fc.record({
          totalPatients: fc.nat(),
          totalDoctors: fc.nat(),
          bookAppointments: fc.nat(),
          roomAvailability: fc.nat()
        }),
        (stats) => {
          // Mock database to return generated stats
          // Render dashboard
          // Assert 4 cards exist in correct order
          // Assert each has correct gradient
          // Assert values match database
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

### Unit Test Examples

**Test: Date Formatting**
```javascript
test('formats dates as MMM DD, YYYY', () => {
  const date = '2025-01-15'
  const formatted = formatDate(date)
  expect(formatted).toBe('Jan 15, 2025')
})
```

**Test: Empty State Rendering**
```javascript
test('displays empty state when no appointments', () => {
  render(<Dashboard />)
  // Mock empty appointments array
  expect(screen.getByText(/no appointments scheduled/i)).toBeInTheDocument()
})
```

**Test: Calendar Navigation**
```javascript
test('navigates to next month when next button clicked', () => {
  render(<Dashboard />)
  const nextButton = screen.getByLabelText('Next month')
  fireEvent.click(nextButton)
  // Assert month changed
})
```

### Integration Testing

**Test Database Integration**:
```javascript
test('loads real data from Supabase', async () => {
  const { container } = render(<Dashboard />)
  
  // Wait for loading to complete
  await waitFor(() => {
    expect(screen.queryByText(/loading dashboard/i)).not.toBeInTheDocument()
  })
  
  // Verify data is displayed
  expect(container.querySelector('.stat-card')).toBeInTheDocument()
})
```

### Visual Regression Testing

**Strategy**: Use Chromatic or Percy for pixel-perfect validation

Since the requirement is "pixel-perfect" match to reference design, visual regression testing is recommended:

1. Capture baseline screenshots of reference design
2. Capture screenshots of implemented dashboard
3. Compare pixel-by-pixel differences
4. Flag any deviations for manual review

**Tools**:
- Chromatic (Storybook integration)
- Percy (CI/CD integration)
- Playwright visual comparisons


## Implementation Details

### Responsive Breakpoints

The dashboard uses Tailwind CSS responsive prefixes:

```css
/* Mobile: < 768px (default, no prefix) */
.grid-cols-1

/* Tablet: 768px - 1024px */
md:grid-cols-2

/* Desktop: > 1024px */
lg:grid-cols-4
```

**Stat Cards Grid**:
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Stat cards */}
</div>
```

**Two-Column Layout**:
```jsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">
    {/* Patient Statistics Chart */}
  </div>
  <div className="lg:col-span-1">
    {/* Appointment List */}
  </div>
</div>
```

**Recent Patients Table**:
```jsx
<div className="overflow-x-auto">
  <table className="w-full min-w-[640px]">
    {/* Table content */}
  </table>
</div>
```

### Performance Optimizations

**Parallel Data Loading**:
```javascript
// Load all data in parallel using Promise.all
const [statsData, patientsData, doctorsData, ...] = await Promise.all([
  db.getStats(),
  db.getPatients(4, 0),
  db.getDoctors(),
  // ... other queries
])
```

**Memoization**:
```javascript
// Memoize expensive calculations
const chartData = useMemo(() => {
  return generateChartData(patientGrowthData)
}, [patientGrowthData])

// Memoize calendar days
const calendarDays = useMemo(() => {
  return getDaysInMonth(currentMonth)
}, [currentMonth])
```

**Lazy Loading**:
```javascript
// Only load chart library when needed
const AreaChart = lazy(() => import('recharts').then(m => ({ default: m.AreaChart })))
```

### Database Query Optimization

**Limit Results**:
```javascript
// Only fetch what's needed
db.getPatients(4, 0) // Limit to 4 patients
todayAppointments.slice(0, 4) // Display max 4 appointments
```

**Select Specific Fields**:
```javascript
// In db.getDoctors(), only select needed fields
.select('id, first_name, last_name, specialization, ...')
```

**Index Usage**:
Ensure database has indexes on:
- `patients.created_at` (for recent patients query)
- `appointments.appointment_date` (for today's appointments)
- `patients.status` (for active patients filter)
- `doctors.status` (for active doctors filter)


### Styling Specifications

**Color Palette**:
```css
/* Primary Colors */
--teal-400: #2dd4bf
--teal-500: #14b8a6
--teal-600: #0d9488

/* Secondary Colors */
--purple-400: #c084fc
--purple-500: #a855f7
--purple-600: #9333ea

--pink-400: #f472b6
--pink-500: #ec4899
--pink-600: #db2777

/* Neutral Colors */
--slate-50: #f8fafc
--slate-100: #f1f5f9
--slate-200: #e2e8f0
--slate-300: #cbd5e1
--slate-400: #94a3b8
--slate-500: #64748b
--slate-600: #475569
--slate-700: #334155
--slate-900: #0f172a

/* Status Colors */
--green-100: #dcfce7
--green-700: #15803d
--blue-100: #dbeafe
--blue-700: #1d4ed8
--yellow-100: #fef9c3
--yellow-700: #a16207
--emerald-600: #059669
```

**Typography**:
```css
/* Headings */
h1: text-2xl font-bold text-slate-900 (24px, 700 weight)
h2: text-lg font-semibold text-slate-900 (18px, 600 weight)
h3: font-semibold text-slate-900 (16px, 600 weight)

/* Body Text */
p: text-sm text-slate-600 (14px)
small: text-xs text-slate-500 (12px)

/* Stat Values */
stat-value: text-3xl font-bold text-slate-900 (30px, 700 weight)

/* Table Headers */
th: text-xs font-semibold text-slate-600 uppercase tracking-wider (12px, 600 weight)
```

**Spacing**:
```css
/* Gaps */
gap-1: 0.25rem (4px)
gap-2: 0.5rem (8px)
gap-3: 0.75rem (12px)
gap-4: 1rem (16px)
gap-6: 1.5rem (24px)

/* Padding */
p-1: 0.25rem (4px)
p-2: 0.5rem (8px)
p-4: 1rem (16px)
p-6: 1.5rem (24px)

/* Margins */
mb-1: 0.25rem (4px)
mb-2: 0.5rem (8px)
mb-3: 0.75rem (12px)
mb-4: 1rem (16px)
mb-6: 1.5rem (24px)
```

**Border Radius**:
```css
rounded: 0.25rem (4px)
rounded-lg: 0.5rem (8px)
rounded-xl: 0.75rem (12px)
rounded-full: 9999px (circular)
```

**Shadows**:
```css
shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)
shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)
shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)
```

### Accessibility Considerations

**Keyboard Navigation**:
- All interactive elements (buttons, calendar dates, dropdowns) must be keyboard accessible
- Tab order should follow visual flow: header → stat cards → chart/appointments → table
- Calendar dates should be navigable with arrow keys

**Screen Reader Support**:
```jsx
<button aria-label="Refresh dashboard data">
  <RefreshCw />
</button>

<button aria-label="Export data as CSV">
  <Download />
  Export CSV
</button>

<button aria-label="Previous month">
  <ChevronLeft />
</button>
```

**Color Contrast**:
- All text must meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
- Status badges use sufficient contrast ratios
- Chart colors are distinguishable for colorblind users

**Focus Indicators**:
```css
focus:outline-none focus:ring-2 focus:ring-teal-500
```

### Browser Compatibility

**Target Browsers**:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Polyfills Required**:
- None (modern browsers only)

**CSS Features Used**:
- CSS Grid (supported in all target browsers)
- Flexbox (supported in all target browsers)
- CSS Custom Properties (supported in all target browsers)
- Gradient backgrounds (supported in all target browsers)


## Deployment Considerations

### Build Configuration

**Vite Configuration**:
```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'recharts': ['recharts'], // Separate chunk for chart library
          'vendor': ['react', 'react-dom']
        }
      }
    }
  }
}
```

**Environment Variables**:
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Performance Monitoring

**Metrics to Track**:
- Initial page load time (target: < 2 seconds)
- Time to interactive (target: < 3 seconds)
- Database query response time (target: < 500ms)
- Chart render time (target: < 100ms)

**Monitoring Tools**:
- Lighthouse for performance audits
- React DevTools Profiler for component render times
- Supabase dashboard for query performance

### Rollback Strategy

**Version Control**:
- Tag current dashboard version before deployment
- Keep previous version accessible via git tag
- Document breaking changes in CHANGELOG.md

**Rollback Steps**:
1. Identify issue with new dashboard
2. Revert to previous git commit/tag
3. Rebuild and redeploy
4. Verify functionality
5. Investigate and fix issue in development

### Migration Path

**From Current Dashboard to Redesigned Dashboard**:

1. **Phase 1: Parallel Development**
   - Develop new dashboard in separate branch
   - Keep current dashboard functional
   - No database schema changes required

2. **Phase 2: Testing**
   - Deploy to staging environment
   - Run automated tests
   - Perform manual QA
   - Conduct visual regression testing

3. **Phase 3: Gradual Rollout**
   - Deploy to production
   - Monitor error rates and performance
   - Collect user feedback
   - Fix any issues discovered

4. **Phase 4: Cleanup**
   - Remove old dashboard code
   - Update documentation
   - Archive old design assets

**No Data Migration Required**: The redesign uses the same database schema and queries, so no data migration is needed.

## Appendix

### Reference Design Checklist

Use this checklist to verify pixel-perfect implementation:

**Header Section**:
- [ ] Welcome message displays user name and role
- [ ] Subtitle text matches reference
- [ ] Last updated timestamp is right-aligned
- [ ] Refresh button is next to timestamp
- [ ] Export CSV button has download icon
- [ ] Spacing between elements matches reference

**Stat Cards**:
- [ ] Exactly 4 cards displayed
- [ ] Cards in correct order
- [ ] Icon sizes match reference (w-6 h-6)
- [ ] Gradient backgrounds match reference colors
- [ ] Value font size is 3xl (30px)
- [ ] Trend indicators have correct color (emerald-600)
- [ ] Card spacing (gap-6) matches reference

**Patient Statistics Chart**:
- [ ] Title and dropdown aligned correctly
- [ ] Total patient count displayed above chart
- [ ] Chart height is 280px
- [ ] Main line color is #14b8a6
- [ ] Main line width is 3px
- [ ] Comparison line is dashed
- [ ] Gradient fill matches reference
- [ ] Grid lines are horizontal only
- [ ] Axis labels are slate-400 color

**Appointment List**:
- [ ] Calendar grid is 7 columns
- [ ] Selected date has teal-500 background
- [ ] Month navigation buttons work
- [ ] Schedule section below calendar
- [ ] Max 4 appointments displayed
- [ ] Doctor avatars are 10x10 rounded-full
- [ ] Status badges have correct colors
- [ ] Empty state displays when no appointments

**Recent Patients Table**:
- [ ] Search input has left-aligned icon
- [ ] Filter button has icon and text
- [ ] Table headers are uppercase
- [ ] Date format is "MMM DD, YYYY"
- [ ] Location has MapPin icon
- [ ] Addresses are truncated with ellipsis
- [ ] Hover effect on table rows

**Responsive Design**:
- [ ] Stat cards stack on mobile (< 768px)
- [ ] Two-column layout stacks on tablet (< 1024px)
- [ ] Table scrolls horizontally on mobile
- [ ] All spacing maintained on all screen sizes

### Database Query Reference

**All queries used by the dashboard**:

```javascript
// Stat cards
db.getStats() // Returns: { totalPatients, totalDoctors, monthlyAppointments, todayAppointments }

// Recent patients
db.getPatients(4, 0) // Returns: Patient[] (max 4)

// Doctors (for performance calculations)
db.getDoctors() // Returns: Doctor[]

// All appointments (for filtering)
db.getAppointments() // Returns: Appointment[]

// Today's appointments
db.getTodayAppointments() // Returns: Appointment[] (today only)

// Room availability
db.getRoomAvailability() // Returns: { available, total }

// Patient statistics (for trend)
db.getPatientStatistics() // Returns: number (last month count)

// Patient growth data (for chart)
db.getPatientGrowthData(6) // Returns: { [month: string]: number }
```

### Component File Structure

```
src/
├── pages/
│   └── Dashboard.jsx (main container)
├── components/
│   ├── StatCard.jsx (reusable stat card)
│   ├── HeartbeatLoader.jsx (loading indicator)
│   ├── TopBar.jsx (app header)
│   └── Sidebar.jsx (app navigation)
├── lib/
│   └── supabase.js (database client and helpers)
├── context/
│   └── AuthContext.jsx (user authentication)
└── utils/
    └── dateFormatters.js (date formatting utilities)
```

### Dependencies

**Required npm packages**:
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@supabase/supabase-js": "^2.38.0",
    "recharts": "^2.10.0",
    "lucide-react": "^0.294.0"
  },
  "devDependencies": {
    "fast-check": "^3.15.0",
    "@testing-library/react": "^14.1.0",
    "@testing-library/jest-dom": "^6.1.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.3.0"
  }
}
```

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-16  
**Author**: Kiro AI Assistant  
**Status**: Ready for Implementation
