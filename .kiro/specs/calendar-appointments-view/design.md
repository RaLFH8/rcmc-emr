# Design Document: Calendar Appointments View

## Overview

This design transforms the Appointments page from a simple list/timeline view into a sophisticated calendar-based weekly view while preserving all existing functionality. The solution introduces a dual-view system: a Calendar View displaying appointments in a weekly grid (Monday-Friday, 9 AM - 6 PM) and the existing Patient Queue view for doctors' workflow.

### Key Design Principles

1. **Preservation First**: All existing functionality (SOAP notes, patient queue, medical history, notifications) must remain unchanged
2. **Progressive Enhancement**: Add calendar view as an alternative visualization, not a replacement
3. **Role-Based Defaults**: Doctors see Patient Queue by default; staff see Calendar View
4. **Performance**: Fetch only necessary data for the displayed week
5. **Responsive Design**: Calendar adapts to different screen sizes

### Design Goals

- Provide visual weekly schedule overview for clinic staff
- Maintain doctor workflow with Patient Queue view
- Enable efficient appointment management across multiple days
- Support filtering by doctor and status across both views
- Export calendar data for reporting purposes

## Architecture

### Component Hierarchy

```
Appointments (Main Component)
├── ViewModeToggle
├── FilterBar
│   ├── DateNavigator (Calendar View only)
│   ├── DoctorFilter
│   └── StatusFilter
├── CalendarView (conditional)
│   ├── CalendarHeader
│   ├── CalendarGrid
│   │   ├── DayColumn (x5 for Mon-Fri)
│   │   │   ├── DayHeader
│   │   │   └── TimeSlotCell (x10 for 9AM-6PM)
│   │   │       └── AppointmentCard (x N)
│   │   └── TimeLabels
│   └── EmptyState
├── PatientQueue (conditional)
│   ├── QueueColumn (Waiting)
│   ├── QueueColumn (In Progress)
│   └── QueueColumn (Completed)
├── NewAppointmentModal
├── SOAPNoteModal
├── ReviewCompleteModal
└── MedicalHistoryModal
```

### State Management Strategy

The component uses React hooks for local state management:

**Core State Variables:**
- `viewMode`: 'calendar' | 'queue' - Controls which view is displayed
- `selectedWeek`: Date object - Tracks the start of the currently displayed week
- `selectedDoctor`: string - Doctor filter (applies to both views)
- `statusFilter`: string - Status filter (applies to both views)
- `appointments`: Array - All appointments data
- `filteredAppointments`: Array - Computed from appointments + filters

**Derived State:**
- Week range (start/end dates) computed from `selectedWeek`
- Grouped appointments for calendar grid
- Queue appointments grouped by status

### Data Flow

```
User Action → State Update → Data Fetch (if needed) → Re-render
                                    ↓
                            Supabase Database
                                    ↓
                        Filter & Transform Data
                                    ↓
                            Render Appropriate View
```

## Components and Interfaces

### 1. CalendarView Component

**Purpose**: Display appointments in a weekly grid format

**Props**:
```typescript
interface CalendarViewProps {
  appointments: Appointment[]
  selectedWeek: Date
  onAppointmentClick: (appointment: Appointment) => void
  currentTime: Date
}
```

**Responsibilities**:
- Render 5-day grid (Monday-Friday)
- Display 10 time slots (9 AM - 6 PM)
- Position appointment cards in correct cells
- Highlight current time slot
- Handle empty states

**Key Methods**:
- `getWeekDays(startDate)`: Returns array of 5 dates for the week
- `getTimeSlots()`: Returns array of time strings ['09:00', '10:00', ...]
- `getAppointmentsForSlot(day, time)`: Filters appointments for specific cell
- `isCurrentTimeSlot(day, time)`: Determines if slot should be highlighted

### 2. DateNavigator Component

**Purpose**: Control week navigation and month selection

**Props**:
```typescript
interface DateNavigatorProps {
  selectedWeek: Date
  onWeekChange: (newWeek: Date) => void
  onTodayClick: () => void
}
```

**UI Elements**:
- Week range display (e.g., "Jan 6 - Jan 10, 2025")
- Previous week button (←)
- Next week button (→)
- Month selector dropdown
- Today button

**Behavior**:
- Previous/Next buttons shift week by 7 days
- Month selector jumps to first week of selected month
- Today button returns to current week

### 3. AppointmentCard Component

**Purpose**: Display appointment information in both calendar and queue views

**Props**:
```typescript
interface AppointmentCardProps {
  appointment: Appointment
  viewMode: 'calendar' | 'queue'
  onStartConsultation?: () => void
  onComplete?: () => void
  onPrescribe?: () => void
}
```

**Display Elements**:
- Patient name
- Appointment time (calendar view only)
- Status badge with color coding
- Booking source badge (Online/Walk-in)
- Reason for visit
- Action buttons (context-dependent)

**Status Colors**:
- Scheduled: Blue (bg-blue-100 text-blue-700)
- Confirmed: Green (bg-green-100 text-green-700)
- In Progress: Yellow (bg-yellow-100 text-yellow-700)
- Completed: Teal (bg-teal-100 text-teal-700)
- Cancelled: Red (bg-red-100 text-red-700)
- No Show: Gray (bg-gray-100 text-gray-700)

### 4. FilterBar Component

**Purpose**: Provide filtering and navigation controls

**Props**:
```typescript
interface FilterBarProps {
  viewMode: 'calendar' | 'queue'
  selectedWeek: Date
  selectedDoctor: string
  statusFilter: string
  doctors: Doctor[]
  appointmentCount: number
  onViewModeChange: (mode: string) => void
  onWeekChange: (week: Date) => void
  onDoctorChange: (doctorId: string) => void
  onStatusChange: (status: string) => void
  onExport: () => void
}
```

**Layout**:
- View mode toggle (Calendar View / Patient Queue)
- Date navigator (calendar view only)
- Doctor filter dropdown
- Status filter dropdown
- Export button (calendar view only)
- Appointment count display

### 5. ExportService

**Purpose**: Generate CSV files from calendar data

**Interface**:
```typescript
interface ExportService {
  exportToCSV(
    appointments: Appointment[],
    startDate: Date,
    endDate: Date
  ): void
}
```

**CSV Format**:
```
Date,Time,Patient Name,Doctor Name,Reason,Status,Booking Source
2025-01-06,09:00,John Doe,Dr. Smith,Checkup,Confirmed,Walk-in
2025-01-06,10:00,Jane Smith,Dr. Jones,Follow-up,Scheduled,Online
```

**Filename Pattern**: `appointments_YYYY-MM-DD_to_YYYY-MM-DD.csv`

## Data Models

### Appointment Model (Existing)

```typescript
interface Appointment {
  id: string
  patient_id: string
  doctor_id: string
  appointment_date: string // ISO date format
  appointment_time: string // HH:MM format
  status: 'Scheduled' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled' | 'No Show'
  reason: string
  notes?: string
  booking_source: 'online' | 'walk-in'
  
  // SOAP fields (temporary storage during consultation)
  soap_subjective?: string
  soap_objective?: string
  soap_assessment?: string
  soap_plan?: string
  
  // Relations (populated by join)
  patient?: Patient
  doctor?: Doctor
  
  created_at: string
  updated_at: string
}
```

### Week Range Model (New)

```typescript
interface WeekRange {
  startDate: Date  // Monday of the week
  endDate: Date    // Friday of the week
  weekDays: Date[] // Array of 5 dates [Mon, Tue, Wed, Thu, Fri]
}
```

### Calendar Cell Model (New)

```typescript
interface CalendarCell {
  date: Date
  time: string // HH:MM format
  appointments: Appointment[]
  isCurrentTime: boolean
}
```

### Filter State Model (New)

```typescript
interface FilterState {
  doctorId: string // 'all' or specific doctor ID
  status: string   // 'all' or specific status
  viewMode: 'calendar' | 'queue'
}
```

## Database Schema

No database schema changes are required. The feature uses existing tables:

- `appointments` table (existing)
- `patients` table (existing)
- `doctors` table (existing)
- `consultations` table (existing)

### Query Patterns

**Fetch Appointments for Week**:
```sql
SELECT a.*, p.*, d.*
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN doctors d ON a.doctor_id = d.id
WHERE a.appointment_date >= '2025-01-06'
  AND a.appointment_date <= '2025-01-10'
ORDER BY a.appointment_date, a.appointment_time
```

**Filter by Doctor**:
```sql
WHERE a.doctor_id = 'doctor-uuid'
```

**Filter by Status**:
```sql
WHERE a.status = 'Confirmed'
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Calendar Grid Structure

*For any* calendar view render, the grid SHALL contain exactly 5 day columns (Monday through Friday) and exactly 10 time slot rows (09:00 through 18:00 in 1-hour increments).

**Validates: Requirements 1.1, 1.2**

### Property 2: Appointment Positioning

*For any* appointment with a specific date and time, when that date falls within the displayed week, the appointment card SHALL appear in the grid cell corresponding to that day and time slot.

**Validates: Requirements 1.3**

### Property 3: Appointment Card Content

*For any* rendered appointment card, it SHALL display patient name, appointment type, status badge, and booking source badge.

**Validates: Requirements 1.4, 1.5, 12.1**

### Property 4: Multiple Appointments Stacking

*For any* time slot containing multiple appointments, those appointments SHALL be rendered in a vertical stack within the same grid cell.

**Validates: Requirements 1.6**

### Property 5: Status Color Consistency

*For any* appointment status, the status badge SHALL use the color coding defined in the existing system (Scheduled=blue, Confirmed=green, In Progress=yellow, Completed=teal, Cancelled=red, No Show=gray).

**Validates: Requirements 1.7**

### Property 6: View Mode Toggle Behavior

*For any* view mode selection (Calendar or Queue), the system SHALL render the corresponding view and hide the other view.

**Validates: Requirements 2.2, 2.3**

### Property 7: View Mode State Persistence

*For any* view mode change during a session, the selected view mode SHALL remain active until explicitly changed by the user.

**Validates: Requirements 2.4**

### Property 8: Week Navigation

*For any* week navigation action (previous/next), the displayed week SHALL shift by exactly 7 days in the corresponding direction, and appointments for the new week SHALL be fetched and displayed.

**Validates: Requirements 3.4, 3.5**

### Property 9: Month Selection Navigation

*For any* month selection, the calendar SHALL navigate to the first Monday of that month (or the Monday of the week containing the first day of that month).

**Validates: Requirements 3.7**

### Property 10: Today Button Navigation

*For any* click of the Today button, the calendar SHALL navigate to the week containing the current date.

**Validates: Requirements 3.8**

### Property 11: Status Filter Application

*For any* status filter selection (other than "All Status"), only appointments matching that status SHALL be displayed in both calendar and queue views.

**Validates: Requirements 4.3, 4.4**

### Property 12: Doctor Filter Application

*For any* doctor filter selection (other than "All Doctors"), only appointments for that doctor SHALL be displayed in both calendar and queue views.

**Validates: Requirements 5.3, 5.5**

### Property 13: Filter Persistence Across Views

*For any* active filter (doctor or status), when switching between calendar and queue views, the filter SHALL remain applied to the new view.

**Validates: Requirements 4.5, 5.6**

### Property 14: CSV Export Data Accuracy

*For any* export action, the generated CSV file SHALL contain exactly the appointments displayed in the current filtered calendar view, with columns: Date, Time, Patient Name, Doctor Name, Reason, Status, Booking Source.

**Validates: Requirements 6.2, 6.4**

### Property 15: CSV Export Filename Format

*For any* export action, the generated CSV filename SHALL match the pattern `appointments_YYYY-MM-DD_to_YYYY-MM-DD.csv` where the dates represent the start and end of the displayed week.

**Validates: Requirements 6.5**

### Property 16: Appointment Card Click Interaction

*For any* appointment card click, a modal SHALL open displaying the full appointment details including patient information, doctor information, reason, notes, and current status.

**Validates: Requirements 7.1, 7.2**

### Property 17: Status Change Persistence

*For any* status change made through the appointment details modal, the appointment record in the database SHALL be updated with the new status.

**Validates: Requirements 7.4**

### Property 18: Status-Based Action Buttons

*For any* appointment in the details modal, the available action buttons SHALL match the appointment's current status (Scheduled/Confirmed show "Start Consultation"; In Progress shows "Prescribe" and "Complete").

**Validates: Requirements 7.5, 7.6, 7.7**

### Property 19: Queue Column Filtering

*For any* appointment displayed in the Patient Queue, it SHALL appear in exactly one column based on its status: Waiting column for Scheduled/Confirmed, In Progress column for In Progress, Completed column for Completed.

**Validates: Requirements 8.2, 8.3, 8.4**

### Property 20: Queue Action Buttons

*For any* appointment in the Patient Queue, the available action buttons SHALL match its status: Waiting appointments show "Start Consultation"; In Progress appointments show "Prescribe" and "Complete".

**Validates: Requirements 8.6, 8.7**

### Property 21: Booking Source Badge Visibility

*For any* appointment card in either calendar or queue view, the booking source badge SHALL be visible and correctly display "Online" (with globe icon, blue) for online bookings or "Walk-in" (with user-plus icon, green) for walk-in bookings.

**Validates: Requirements 12.2, 12.3, 12.4**

### Property 22: Week-Scoped Data Fetching

*For any* calendar view load or week navigation, the system SHALL fetch only appointments where appointment_date is within the displayed week's date range (Monday through Friday).

**Validates: Requirements 13.1, 13.2, 20.1**

### Property 23: Client-Side Filter Application

*For any* filter change (doctor or status), the system SHALL apply the filter to already-loaded appointment data without triggering a new database fetch.

**Validates: Requirements 13.3**

### Property 24: Parallel Data Loading

*For any* initial page load, the system SHALL fetch appointments, patients, and doctors data in parallel using Promise.all or equivalent concurrent fetching.

**Validates: Requirements 13.4**

### Property 25: Loading State Display

*For any* data fetch operation, while the fetch is in progress, a loading indicator SHALL be visible to the user.

**Validates: Requirements 13.5**

### Property 26: Error State Display

*For any* data fetch failure, an error message SHALL be displayed to the user.

**Validates: Requirements 13.6**

### Property 27: Current Time Slot Highlighting

*For any* calendar view render where the displayed week includes the current date and the current time is between 09:00 and 18:00, the time slot corresponding to the current hour SHALL be visually highlighted.

**Validates: Requirements 15.1, 15.2**

### Property 28: Time Slot Highlight Updates

*For any* calendar view displaying the current week, the highlighted time slot SHALL update automatically as time progresses to reflect the current hour.

**Validates: Requirements 15.3**

### Property 29: Outside Business Hours Highlighting

*For any* calendar view render where the current time is before 09:00 or after 18:00, no time slot SHALL be highlighted.

**Validates: Requirements 15.4**

### Property 30: Appointment Count Accuracy

*For any* calendar or queue view render, the displayed appointment count SHALL equal the number of appointments matching the current filters (or all appointments if no filters are active).

**Validates: Requirements 17.1, 17.2, 17.3**

### Property 31: Data Caching Optimization

*For any* component re-render that doesn't change the selected week, the system SHALL not refetch patient and doctor data from the database.

**Validates: Requirements 20.2**

### Property 32: View Switch Without Refetch

*For any* view mode toggle between calendar and queue, the system SHALL not trigger a new data fetch, instead using already-loaded appointment data.

**Validates: Requirements 20.5**

### Property 33: Component Memoization

*For any* component render where props have not changed, React memoization SHALL prevent unnecessary re-renders of child components.

**Validates: Requirements 20.4**

## Error Handling

### Data Loading Errors

**Scenario**: Database fetch fails
- **Detection**: Catch errors from Supabase queries
- **Response**: Display error message to user, log error to console
- **Recovery**: Provide "Retry" button to attempt fetch again
- **User Impact**: Graceful degradation - show error state instead of broken UI

**Implementation**:
```javascript
try {
  const data = await db.getAppointments(startDate, endDate)
  setAppointments(data)
} catch (error) {
  console.error('Failed to load appointments:', error)
  setError('Failed to load appointments. Please try again.')
  // Show error UI with retry button
}
```

### Invalid Date Navigation

**Scenario**: User navigates to invalid date range
- **Detection**: Validate date calculations before fetching
- **Response**: Clamp to valid date range or show warning
- **Recovery**: Reset to current week
- **User Impact**: Prevent navigation to nonsensical dates

**Implementation**:
```javascript
const navigateToWeek = (newDate) => {
  if (!isValidDate(newDate)) {
    console.warn('Invalid date navigation attempted')
    return navigateToCurrentWeek()
  }
  setSelectedWeek(newDate)
}
```

### Empty Filter Results

**Scenario**: Filters result in zero appointments
- **Detection**: Check filtered array length
- **Response**: Display "No appointments match the selected filters" message
- **Recovery**: Provide "Clear Filters" button
- **User Impact**: Clear feedback about why calendar is empty

**Implementation**:
```javascript
if (filteredAppointments.length === 0) {
  return (
    <EmptyState 
      message="No appointments match the selected filters"
      action={<button onClick={clearFilters}>Clear Filters</button>}
    />
  )
}
```

### Export Failures

**Scenario**: CSV export fails (e.g., browser blocks download)
- **Detection**: Catch errors during CSV generation or download
- **Response**: Show error notification
- **Recovery**: Retry export or copy data to clipboard as fallback
- **User Impact**: Provide alternative export method

**Implementation**:
```javascript
try {
  exportToCSV(appointments, startDate, endDate)
} catch (error) {
  console.error('Export failed:', error)
  alert('Export failed. Try copying the data instead.')
  // Offer clipboard copy as fallback
}
```

### Concurrent Status Updates

**Scenario**: Multiple users update same appointment simultaneously
- **Detection**: Optimistic UI update followed by database confirmation
- **Response**: If database update fails, revert UI and show error
- **Recovery**: Reload appointment data to get latest state
- **User Impact**: Prevent data inconsistency

**Implementation**:
```javascript
const handleStatusChange = async (id, newStatus) => {
  const oldStatus = appointments.find(a => a.id === id).status
  
  // Optimistic update
  setAppointments(prev => prev.map(a => 
    a.id === id ? {...a, status: newStatus} : a
  ))
  
  try {
    await db.updateAppointment(id, { status: newStatus })
  } catch (error) {
    // Revert on failure
    setAppointments(prev => prev.map(a => 
      a.id === id ? {...a, status: oldStatus} : a
    ))
    alert('Failed to update status. Please try again.')
  }
}
```

### Missing Related Data

**Scenario**: Appointment has patient_id or doctor_id that doesn't exist in loaded data
- **Detection**: Check for null/undefined when accessing appointment.patient or appointment.doctor
- **Response**: Display placeholder text (e.g., "Unknown Patient")
- **Recovery**: Log warning and continue rendering
- **User Impact**: Graceful degradation - show appointment with missing info rather than crash

**Implementation**:
```javascript
const patientName = appointment.patient 
  ? `${appointment.patient.first_name} ${appointment.patient.last_name}`
  : 'Unknown Patient'
```

### Time Zone Issues

**Scenario**: Server and client in different time zones
- **Detection**: Use ISO date strings consistently
- **Response**: Always work with date strings in YYYY-MM-DD format for dates, HH:MM for times
- **Recovery**: N/A - prevent issue through consistent date handling
- **User Impact**: Appointments appear at correct times regardless of time zone

**Implementation**:
```javascript
// Always use date strings, not Date objects for storage
const appointmentDate = '2025-01-06' // Not new Date()
const appointmentTime = '09:00' // Not Date.getHours()
```

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests**: Focus on specific examples, edge cases, and integration points
- Test specific date calculations (e.g., first Monday of month)
- Test empty states (no appointments, no filter matches)
- Test responsive breakpoints (1024px, 768px)
- Test role-based defaults (doctor vs staff)
- Test specific booking source badge rendering

**Property-Based Tests**: Verify universal properties across all inputs
- Test appointment positioning for any date/time combination
- Test filter application for any doctor/status selection
- Test week navigation for any starting week
- Test CSV export for any appointment set
- Test count accuracy for any filter combination

### Property-Based Testing Configuration

**Library**: Use `fast-check` for JavaScript property-based testing

**Configuration**:
```javascript
import fc from 'fast-check'

// Minimum 100 iterations per property test
fc.assert(
  fc.property(/* generators */, /* test function */),
  { numRuns: 100 }
)
```

**Test Tagging**: Each property test must reference its design document property

```javascript
// Feature: calendar-appointments-view, Property 2: Appointment Positioning
test('appointments appear in correct grid cells', () => {
  fc.assert(
    fc.property(
      appointmentGenerator(),
      weekGenerator(),
      (appointment, week) => {
        // Test that appointment appears in correct cell
      }
    ),
    { numRuns: 100 }
  )
})
```

### Unit Test Examples

**Test: Role-Based Default View**
```javascript
test('doctor users default to queue view', () => {
  const { getByText } = render(
    <Appointments userProfile={{ role: 'doctor', id: '123' }} />
  )
  expect(getByText('Waiting')).toBeInTheDocument()
  expect(getByText('In Progress')).toBeInTheDocument()
})

test('staff users default to calendar view', () => {
  const { getByText } = render(
    <Appointments userProfile={{ role: 'staff', id: '456' }} />
  )
  expect(getByText('Monday')).toBeInTheDocument()
  expect(getByText('09:00')).toBeInTheDocument()
})
```

**Test: Empty States**
```javascript
test('shows empty state when no appointments exist', () => {
  const { getByText } = render(
    <CalendarView appointments={[]} selectedWeek={new Date()} />
  )
  expect(getByText('No appointments scheduled for this week')).toBeInTheDocument()
})

test('shows filtered empty state when filters match nothing', () => {
  const appointments = [{ status: 'Scheduled' }]
  const { getByText } = render(
    <CalendarView 
      appointments={appointments} 
      statusFilter="Completed"
      selectedWeek={new Date()} 
    />
  )
  expect(getByText('No appointments match the selected filters')).toBeInTheDocument()
})
```

**Test: Booking Source Badges**
```javascript
test('online bookings show blue badge with globe icon', () => {
  const appointment = { booking_source: 'online' }
  const { getByText, getByTitle } = render(
    <AppointmentCard appointment={appointment} />
  )
  expect(getByText('Online')).toHaveClass('bg-blue-100')
  expect(getByTitle('Online Booking')).toBeInTheDocument()
})

test('walk-in bookings show green badge with user-plus icon', () => {
  const appointment = { booking_source: 'walk-in' }
  const { getByText, getByTitle } = render(
    <AppointmentCard appointment={appointment} />
  )
  expect(getByText('Walk-in')).toHaveClass('bg-green-100')
  expect(getByTitle('Walk-in')).toBeInTheDocument()
})
```

### Property-Based Test Examples

**Property Test: Appointment Positioning**
```javascript
// Feature: calendar-appointments-view, Property 2: Appointment Positioning
test('appointments appear in correct grid cells for any date/time', () => {
  fc.assert(
    fc.property(
      fc.record({
        id: fc.uuid(),
        appointment_date: fc.date({ min: new Date('2025-01-06'), max: new Date('2025-01-10') }),
        appointment_time: fc.constantFrom('09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'),
        patient: fc.record({ first_name: fc.string(), last_name: fc.string() }),
        doctor: fc.record({ first_name: fc.string(), last_name: fc.string() }),
        status: fc.constantFrom('Scheduled', 'Confirmed', 'In Progress', 'Completed'),
        reason: fc.string()
      }),
      (appointment) => {
        const { container } = render(
          <CalendarView 
            appointments={[appointment]} 
            selectedWeek={new Date('2025-01-06')} 
          />
        )
        
        // Find the cell for this day and time
        const dayIndex = new Date(appointment.appointment_date).getDay() - 1 // Mon=0
        const timeIndex = parseInt(appointment.appointment_time.split(':')[0]) - 9 // 09:00=0
        
        const cell = container.querySelector(
          `[data-day="${dayIndex}"][data-time="${timeIndex}"]`
        )
        
        // Verify appointment card is in this cell
        expect(cell).toContainElement(
          screen.getByText(`${appointment.patient.first_name} ${appointment.patient.last_name}`)
        )
      }
    ),
    { numRuns: 100 }
  )
})
```

**Property Test: Filter Application**
```javascript
// Feature: calendar-appointments-view, Property 11: Status Filter Application
test('status filter shows only matching appointments for any status', () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({
        id: fc.uuid(),
        status: fc.constantFrom('Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'),
        appointment_date: fc.constant('2025-01-06'),
        appointment_time: fc.constant('09:00')
      })),
      fc.constantFrom('Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'),
      (appointments, filterStatus) => {
        const { container } = render(
          <CalendarView 
            appointments={appointments}
            statusFilter={filterStatus}
            selectedWeek={new Date('2025-01-06')} 
          />
        )
        
        // Count rendered appointment cards
        const cards = container.querySelectorAll('[data-testid="appointment-card"]')
        const expectedCount = appointments.filter(a => a.status === filterStatus).length
        
        expect(cards.length).toBe(expectedCount)
        
        // Verify all rendered cards have the correct status
        cards.forEach(card => {
          expect(card).toHaveAttribute('data-status', filterStatus)
        })
      }
    ),
    { numRuns: 100 }
  )
})
```

**Property Test: Week Navigation**
```javascript
// Feature: calendar-appointments-view, Property 8: Week Navigation
test('week navigation shifts by exactly 7 days for any starting week', () => {
  fc.assert(
    fc.property(
      fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') }),
      fc.constantFrom('previous', 'next'),
      (startDate, direction) => {
        const { getByText, rerender } = render(
          <DateNavigator 
            selectedWeek={startDate}
            onWeekChange={jest.fn()}
          />
        )
        
        const button = direction === 'previous' 
          ? getByText('Previous Week')
          : getByText('Next Week')
        
        fireEvent.click(button)
        
        // Verify the callback was called with date shifted by 7 days
        const expectedDate = new Date(startDate)
        expectedDate.setDate(expectedDate.getDate() + (direction === 'next' ? 7 : -7))
        
        expect(onWeekChange).toHaveBeenCalledWith(
          expect.objectContaining({
            getTime: () => expectedDate.getTime()
          })
        )
      }
    ),
    { numRuns: 100 }
  )
})
```

**Property Test: CSV Export Accuracy**
```javascript
// Feature: calendar-appointments-view, Property 14: CSV Export Data Accuracy
test('exported CSV contains exactly the filtered appointments', () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({
        appointment_date: fc.date({ min: new Date('2025-01-06'), max: new Date('2025-01-10') }),
        appointment_time: fc.constantFrom('09:00', '10:00', '11:00'),
        patient: fc.record({ first_name: fc.string(), last_name: fc.string() }),
        doctor: fc.record({ first_name: fc.string(), last_name: fc.string() }),
        reason: fc.string(),
        status: fc.constantFrom('Scheduled', 'Confirmed'),
        booking_source: fc.constantFrom('online', 'walk-in')
      })),
      fc.constantFrom('Scheduled', 'Confirmed', 'all'),
      (appointments, statusFilter) => {
        const filteredAppointments = statusFilter === 'all'
          ? appointments
          : appointments.filter(a => a.status === statusFilter)
        
        const csv = exportToCSV(filteredAppointments, new Date('2025-01-06'), new Date('2025-01-10'))
        const lines = csv.split('\n')
        
        // First line is header
        expect(lines[0]).toBe('Date,Time,Patient Name,Doctor Name,Reason,Status,Booking Source')
        
        // Remaining lines should match filtered appointments
        expect(lines.length - 1).toBe(filteredAppointments.length)
        
        // Verify each line contains correct data
        filteredAppointments.forEach((apt, index) => {
          const line = lines[index + 1]
          expect(line).toContain(apt.patient.first_name)
          expect(line).toContain(apt.doctor.first_name)
          expect(line).toContain(apt.status)
        })
      }
    ),
    { numRuns: 100 }
  )
})
```

**Property Test: Appointment Count Accuracy**
```javascript
// Feature: calendar-appointments-view, Property 30: Appointment Count Accuracy
test('appointment count equals filtered appointments for any filter combination', () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({
        id: fc.uuid(),
        doctor_id: fc.constantFrom('doc1', 'doc2', 'doc3'),
        status: fc.constantFrom('Scheduled', 'Confirmed', 'In Progress'),
        appointment_date: fc.constant('2025-01-06')
      })),
      fc.constantFrom('all', 'doc1', 'doc2', 'doc3'),
      fc.constantFrom('all', 'Scheduled', 'Confirmed', 'In Progress'),
      (appointments, doctorFilter, statusFilter) => {
        let filtered = appointments
        
        if (doctorFilter !== 'all') {
          filtered = filtered.filter(a => a.doctor_id === doctorFilter)
        }
        
        if (statusFilter !== 'all') {
          filtered = filtered.filter(a => a.status === statusFilter)
        }
        
        const { getByText } = render(
          <CalendarView 
            appointments={appointments}
            selectedDoctor={doctorFilter}
            statusFilter={statusFilter}
            selectedWeek={new Date('2025-01-06')} 
          />
        )
        
        expect(getByText(`${filtered.length} appointments`)).toBeInTheDocument()
      }
    ),
    { numRuns: 100 }
  )
})
```

### Integration Tests

**Test: Complete Workflow - Create Appointment and View in Calendar**
```javascript
test('newly created appointment appears in calendar view', async () => {
  const { getByText, getByLabelText } = render(<Appointments />)
  
  // Open new appointment modal
  fireEvent.click(getByText('New Appointment'))
  
  // Fill form
  fireEvent.change(getByLabelText('Select Patient'), { target: { value: 'patient-123' } })
  fireEvent.change(getByLabelText('Doctor'), { target: { value: 'doctor-456' } })
  fireEvent.change(getByLabelText('Date'), { target: { value: '2025-01-06' } })
  fireEvent.change(getByLabelText('Time'), { target: { value: '10:00' } })
  fireEvent.change(getByLabelText('Reason for Visit'), { target: { value: 'Checkup' } })
  
  // Submit
  fireEvent.click(getByText('Schedule Appointment'))
  
  // Wait for modal to close and data to reload
  await waitFor(() => {
    expect(screen.queryByText('New Appointment')).not.toBeInTheDocument()
  })
  
  // Switch to calendar view
  fireEvent.click(getByText('Calendar View'))
  
  // Verify appointment appears in calendar
  expect(getByText('Checkup')).toBeInTheDocument()
  expect(getByText('10:00')).toBeInTheDocument()
})
```

**Test: Filter Persistence Across View Switch**
```javascript
test('filters persist when switching between calendar and queue views', () => {
  const appointments = [
    { id: '1', doctor_id: 'doc1', status: 'Scheduled', appointment_date: '2025-01-06' },
    { id: '2', doctor_id: 'doc2', status: 'Confirmed', appointment_date: '2025-01-06' },
    { id: '3', doctor_id: 'doc1', status: 'In Progress', appointment_date: '2025-01-06' }
  ]
  
  const { getByText, getAllByTestId } = render(
    <Appointments appointments={appointments} />
  )
  
  // Apply doctor filter
  fireEvent.change(getByLabelText('Doctor Filter'), { target: { value: 'doc1' } })
  
  // Verify only 2 appointments shown
  expect(getAllByTestId('appointment-card')).toHaveLength(2)
  
  // Switch to queue view
  fireEvent.click(getByText('Patient Queue'))
  
  // Verify filter still applied (only doc1 appointments)
  expect(getAllByTestId('appointment-card')).toHaveLength(2)
  
  // Switch back to calendar
  fireEvent.click(getByText('Calendar View'))
  
  // Verify filter still applied
  expect(getAllByTestId('appointment-card')).toHaveLength(2)
})
```

### Performance Tests

**Test: No Refetch on View Switch**
```javascript
test('switching views does not trigger data refetch', async () => {
  const mockFetch = jest.spyOn(db, 'getAppointments')
  
  const { getByText } = render(<Appointments />)
  
  // Wait for initial load
  await waitFor(() => {
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
  
  // Switch to queue view
  fireEvent.click(getByText('Patient Queue'))
  
  // Switch back to calendar
  fireEvent.click(getByText('Calendar View'))
  
  // Verify no additional fetches
  expect(mockFetch).toHaveBeenCalledTimes(1)
})
```

**Test: Week-Scoped Fetching**
```javascript
test('fetches only appointments for displayed week', async () => {
  const mockFetch = jest.spyOn(db, 'getAppointments')
  
  render(<Appointments />)
  
  await waitFor(() => {
    expect(mockFetch).toHaveBeenCalled()
  })
  
  const callArgs = mockFetch.mock.calls[0]
  const startDate = new Date(callArgs[0])
  const endDate = new Date(callArgs[1])
  
  // Verify date range is exactly 5 days (Mon-Fri)
  const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24)
  expect(daysDiff).toBe(4) // Mon to Fri is 4 days difference
})
```

### Test Coverage Goals

- **Unit Tests**: 80% code coverage minimum
- **Property Tests**: All 33 correctness properties must have corresponding tests
- **Integration Tests**: Cover all major user workflows
- **Performance Tests**: Verify optimization requirements (no refetch, caching, etc.)

### Continuous Integration

All tests must pass before merging:
```bash
npm test -- --coverage --watchAll=false
```

Property-based tests run with 100 iterations in CI:
```bash
npm test -- --testMatch="**/*.property.test.js"
```
