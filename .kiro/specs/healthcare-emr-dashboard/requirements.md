# RCMC Healthcare EMR Dashboard - Requirements

## Project Overview
Build a modern, scalable Electronic Medical Records (EMR) dashboard for RizalCare Medical Clinic that handles patient management, appointments, and healthcare analytics with enterprise-grade performance and security.

## Business Context
- **Organization**: RizalCare Medical Clinic (RCMC)
- **Location**: GF IPDL8 Bldg., 25 G. Dikit St., Brgy. Bagumbayan, Pililla, Rizal
- **Contact**: 0938-775-1504 / 0976-273-9445
- **Email**: rizalcaremedicalclinic@gmail.com
- **Scale**: Must handle 1,000+ new patient records per month
- **Deployment**: 100% free tier (Supabase + Vercel)

## Tech Stack Requirements
- **Frontend**: React 18+ with Vite
- **Styling**: Tailwind CSS with custom RCMC theme
- **Icons**: Lucide-React
- **Charts**: Recharts for data visualization
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Email/Password)
- **Hosting**: Vercel (Frontend) + Supabase (Backend)
- **Font**: Inter font family

## Design System (Pixel-Perfect Replica)

### Reference Design
**Source**: MediLens Healthcare Dashboard (provided screenshot)
**Goal**: 100% pixel-perfect replica of the reference design

### Color Palette
- **Primary Teal**: `#14B8A6` (teal-500) - Used for active states, buttons, highlights
- **Light Teal**: `#5EEAD4` (teal-300) - Used for chart fills, hover states
- **Background**: `#F8FAFC` (slate-50) - Main background
- **Card Background**: `#FFFFFF` - White cards with subtle shadows
- **Text Primary**: `#0F172A` (slate-900) - Headings and primary text
- **Text Secondary**: `#64748B` (slate-500) - Secondary text, labels
- **Border**: `#E2E8F0` (slate-200) - Card borders, dividers
- **Success Green**: `#10B981` (emerald-500) - Positive indicators
- **Danger Red**: `#EF4444` (red-500) - Negative indicators
- **Calendar Active**: `#14B8A6` (teal-500) - Selected date background

### Typography
- **Font Family**: Inter (weights: 400, 500, 600, 700)
- **Headings**: 
  - Welcome text: text-2xl font-bold text-slate-900
  - Section titles: text-lg font-semibold text-slate-900
  - Card titles: text-sm font-medium text-slate-600
- **Body Text**: text-sm text-slate-600
- **Numbers/Stats**: text-3xl font-bold text-slate-900
- **Labels**: text-xs text-slate-500 uppercase tracking-wide

### Layout Structure
1. **Sidebar (Left)**
   - Width: 240px fixed
   - Background: White
   - Logo at top with "MediLens" text
   - Navigation items with icons (Lucide-React)
   - User profile at bottom with avatar and role
   - Collapse button (chevron icon)

2. **Top Bar**
   - Height: 64px
   - Search bar (left) with keyboard shortcut indicator (⌘K)
   - User profile icon (right)
   - Settings icon
   - Notifications icon

3. **Main Content Area**
   - Padding: 32px
   - Background: slate-50
   - Full width minus sidebar

### Component Specifications

#### 1. Welcome Header
- "Welcome back, Dr. Kierra Carder!" - text-2xl font-bold
- Subtitle: "Here's what's happening at your clinic today" - text-sm text-slate-600
- Last updated timestamp with refresh icon (top right)
- Export CSV button (teal background, white text)

#### 2. Stat Cards (4 cards in a row)
- Layout: Grid with 4 equal columns
- Card style: White background, rounded-xl, shadow-sm, padding-6
- Icon: Circular background (light teal/blue/purple), white icon
- Label: text-sm text-slate-600
- Number: text-3xl font-bold text-slate-900
- Trend indicator: Small badge with arrow and percentage
  - Green badge for positive trends
  - Red badge for negative trends
- Cards:
  1. Total Patient (user icon) - 432 patients, +11.4%
  2. Total Doctor (stethoscope icon) - 536 doctors, +10.5%
  3. Book Appointment (calendar icon) - 149 appointments, +14.6%
  4. Room Availability (bed icon) - 120 rooms, +18.8%

#### 3. Patient Statistics Chart
- Card: White background, rounded-xl, shadow-sm
- Header: "Patient Statistics" with Monthly dropdown
- Main stat: "73" with "↑ 0.10% since last week"
- Chart type: Area chart with gradient fill
- Chart colors: 
  - Line: Teal (#14B8A6)
  - Fill: Gradient from teal to transparent
  - Dotted line: Light teal (comparison line)
- Data points with tooltips showing date and value
- X-axis: Months (Jan, Feb, Mar, Apr, May, Jun, Jul)
- Y-axis: Values (0, 20, 40, 60, 100)
- Legend: "Total Patient" with icon

#### 4. Recent Patients Table
- Card: White background, rounded-xl, shadow-sm
- Header: "Recent Patients" with subtitle "Real-time inventory status across all locations"
- Search bar and Filter button (top right)
- Table columns:
  - No (row number)
  - Item (patient name)
  - Gender
  - Date of Birth
  - Location (with pin icon)
  - Contact (phone number)
- Row styling: Hover effect with light gray background
- Alternating row colors for better readability
- Data:
  1. Dr. Rodriguez, Female, Jan 15,1967, 321 Birch..., 021 87891234
  2. Marcus Stanton, Male, Feb 18,1983, 854 Ced..., 021 45678901
  3. Madelyn Schleifer, Female, Mar 26,1998, 987 Willo..., 021 98765432
  4. Talan Schleifer, Male, Feb 14,1995, 765 Pine..., 021 78745412

#### 5. Appointment List (Right Sidebar)
- Card: White background, rounded-xl, shadow-sm
- Header: "Appointment List" with refresh icon
- Calendar widget:
  - Month/Year: "May, 2025" with prev/next arrows
  - Day headers: Mon, Tue, Wed, Thu, Fri, Sat, Sun
  - Current date highlighted: 12 (teal background, white text)
  - Other dates: Gray text
  - Grid layout: 7 columns

#### 6. Schedule List
- Header: "Schedule" with "View All" link (teal text)
- List items:
  - Doctor avatar (circular)
  - Doctor name: text-sm font-semibold
  - Date and time: text-xs text-slate-500
- Doctors shown:
  1. Dr. Ashlynn Kenter - May 12, 2025 • 09:10 pm
  2. Dr. Charlie Gouse - May 22, 2025 • 08:10 pm
  3. Dr. Justin Bergson - May 12, 2025 • 10:00 pm
  4. Dr. Madelyn Geldt - May 12, 2025 • 09:00 pm

### Spacing & Sizing
- Card padding: 24px (p-6)
- Card gap: 24px (gap-6)
- Border radius: 12px (rounded-xl)
- Shadow: shadow-sm (subtle)
- Icon size: 20px (w-5 h-5)
- Avatar size: 40px (w-10 h-10)
- Button height: 40px (h-10)

### Responsive Breakpoints
- Mobile: < 768px (stack cards vertically, hide sidebar)
- Tablet: 768px - 1024px (2 columns for stat cards)
- Desktop: > 1024px (full layout as shown)

### Animations & Interactions
- Hover effects on cards (slight shadow increase)
- Smooth transitions (transition-all duration-200)
- Button hover states (opacity-90)
- Chart tooltips on hover
- Calendar date hover (light teal background)
- Table row hover (slate-50 background)

## User Stories & Acceptance Criteria

### 1. User Authentication & Authorization

#### 1.1 User Login
**As a** healthcare staff member  
**I want to** securely log in to the EMR system  
**So that** I can access patient records and manage appointments

**Acceptance Criteria:**
- Login form with email and password fields
- Secure authentication via Supabase Auth
- Session persistence across browser refreshes
- Error handling for invalid credentials
- Password reset functionality
- Automatic redirect to dashboard after successful login
- Loading states during authentication

#### 1.2 User Registration
**As a** clinic administrator  
**I want to** create new staff accounts  
**So that** authorized personnel can access the system

**Acceptance Criteria:**
- Registration form with email, password, and role selection
- Email verification required
- Role-based access control (Admin, Doctor, Nurse, Receptionist)
- Password strength validation
- Duplicate email prevention

#### 1.3 Session Management
**As a** logged-in user  
**I want** my session to remain active  
**So that** I don't have to re-login frequently

**Acceptance Criteria:**
- Session persists for 7 days
- Automatic logout after 30 minutes of inactivity
- Secure token refresh mechanism
- Logout functionality clears all session data

### 2. Dashboard Overview

#### 2.1 Dashboard Statistics
**As a** healthcare staff member  
**I want to** see key metrics at a glance  
**So that** I can monitor clinic performance

**Acceptance Criteria:**
- Display total monthly patients (e.g., "720 Monthly Patients")
- Show monthly revenue with trend indicator
- Display active appointments count
- Show pending consultations
- Real-time data updates
- Responsive stat cards with icons
- Color-coded trend indicators (up/down)

#### 2.2 Patient Analytics Charts
**As a** clinic administrator  
**I want to** visualize patient data trends  
**So that** I can make informed business decisions

**Acceptance Criteria:**
- Area chart showing monthly patient visits (6-month view)
- Pie chart showing patient distribution by department
- Bar chart showing revenue breakdown
- Interactive tooltips on hover
- Responsive chart sizing
- Data export functionality (CSV)
- Date range selector

#### 2.3 Recent Activity Feed
**As a** healthcare staff member  
**I want to** see recent patient activities  
**So that** I can stay updated on clinic operations

**Acceptance Criteria:**
- Display last 10 patient registrations
- Show recent appointments
- Display recent consultations
- Real-time updates
- Click to view full details
- Timestamp for each activity

### 3. Patient Management

#### 3.1 Patient List View
**As a** healthcare staff member  
**I want to** view all registered patients  
**So that** I can access patient information quickly

**Acceptance Criteria:**
- Paginated table with 20 patients per page
- Search functionality (name, ID, phone, email)
- Filter by status (Active, Inactive)
- Sort by name, registration date, last visit
- Display: Name, ID, Age, Gender, Phone, Last Visit, Status
- Click row to view full patient details
- Database-side filtering for performance (1,000+ records)

#### 3.2 Add New Patient
**As a** receptionist  
**I want to** register new patients  
**So that** their information is stored in the system

**Acceptance Criteria:**
- Modal form with required fields:
  - Full Name (required)
  - Date of Birth (required)
  - Gender (required)
  - Phone Number (required)
  - Email (optional)
  - Address (required)
  - Emergency Contact (required)
  - Blood Type (optional)
  - Allergies (optional)
  - Medical History (optional)
- Auto-generate unique Patient ID
- Form validation
- Save to Supabase database
- Success/error notifications
- Form reset after successful submission

#### 3.3 Edit Patient Information
**As a** healthcare staff member  
**I want to** update patient information  
**So that** records remain accurate and current

**Acceptance Criteria:**
- Pre-filled form with existing patient data
- All fields editable except Patient ID
- Validation on save
- Audit trail (who updated, when)
- Confirmation before saving changes
- Success/error notifications

#### 3.4 View Patient Details
**As a** healthcare staff member  
**I want to** view complete patient information  
**So that** I can provide informed care

**Acceptance Criteria:**
- Display all patient information
- Show consultation history
- Display appointment history
- Show billing history
- Print patient summary
- Export patient data (PDF)

#### 3.5 Delete Patient Record
**As a** clinic administrator  
**I want to** remove patient records  
**So that** I can maintain data accuracy

**Acceptance Criteria:**
- Confirmation dialog before deletion
- Soft delete (mark as inactive, not permanent deletion)
- Only administrators can delete
- Audit trail of deletion
- Cannot delete patients with active appointments

### 4. Appointment Scheduling

#### 4.1 View Appointments Calendar
**As a** receptionist  
**I want to** view scheduled appointments  
**So that** I can manage the clinic schedule

**Acceptance Criteria:**
- Calendar view (day, week, month)
- Color-coded by appointment type
- Display: Patient name, time, doctor, status
- Click to view appointment details
- Filter by doctor, department, status
- Real-time updates

#### 4.2 Create New Appointment
**As a** receptionist  
**I want to** schedule patient appointments  
**So that** patients can receive timely care

**Acceptance Criteria:**
- Select patient from dropdown (searchable)
- Select doctor from available list
- Select date and time
- Select appointment type (Consultation, Follow-up, Emergency)
- Add notes (optional)
- Check doctor availability
- Prevent double-booking
- Send confirmation (future enhancement)
- Save to database

#### 4.3 Update Appointment
**As a** receptionist  
**I want to** modify appointment details  
**So that** I can accommodate schedule changes

**Acceptance Criteria:**
- Edit date, time, doctor, type, notes
- Check new time slot availability
- Update status (Scheduled, Confirmed, Completed, Cancelled)
- Audit trail of changes
- Notifications for changes (future enhancement)

#### 4.4 Cancel Appointment
**As a** receptionist  
**I want to** cancel appointments  
**So that** I can manage no-shows and cancellations

**Acceptance Criteria:**
- Confirmation dialog
- Reason for cancellation (required)
- Update status to "Cancelled"
- Free up time slot
- Audit trail

### 5. Consultation Management

#### 5.1 Start Consultation
**As a** doctor  
**I want to** begin a patient consultation  
**So that** I can document the visit

**Acceptance Criteria:**
- Select patient from appointment list
- Display patient information and history
- Record vital signs (BP, temp, pulse, weight, height)
- Record chief complaint
- Record diagnosis
- Record treatment plan
- Prescribe medications
- Order lab tests (optional)
- Save consultation notes
- Mark appointment as "Completed"

#### 5.2 View Consultation History
**As a** healthcare staff member  
**I want to** view past consultations  
**So that** I can review patient medical history

**Acceptance Criteria:**
- List all consultations for a patient
- Display: Date, doctor, diagnosis, treatment
- Click to view full consultation details
- Filter by date range
- Search by diagnosis or treatment
- Export consultation history (PDF)

### 6. Performance & Scalability

#### 6.1 Database Performance
**As a** system user  
**I want** fast data loading  
**So that** I can work efficiently

**Acceptance Criteria:**
- Patient list loads in < 2 seconds (1,000+ records)
- Search results return in < 1 second
- Database-side filtering and pagination
- Indexed columns (patient_id, name, phone, email)
- Optimized queries with proper joins
- Connection pooling

#### 6.2 Data Persistence
**As a** clinic administrator  
**I want** all data saved to the cloud  
**So that** data is never lost

**Acceptance Criteria:**
- All data stored in Supabase PostgreSQL
- Automatic backups (Supabase feature)
- 99.9% uptime
- Data accessible 24/7
- No local storage dependencies

### 7. Security & Privacy

#### 7.1 Data Security
**As a** clinic administrator  
**I want** patient data to be secure  
**So that** we comply with healthcare privacy regulations

**Acceptance Criteria:**
- All API calls use HTTPS
- Row-level security (RLS) in Supabase
- Users can only access authorized data
- Passwords hashed with bcrypt
- Session tokens encrypted
- SQL injection prevention
- XSS protection

#### 7.2 Audit Trail
**As a** clinic administrator  
**I want** to track all data changes  
**So that** I can maintain accountability

**Acceptance Criteria:**
- Log all create, update, delete operations
- Record: user, action, timestamp, changes
- Audit logs stored in separate table
- Audit logs cannot be deleted by regular users
- View audit logs in admin panel

### 8. User Interface & Experience

#### 8.1 Responsive Design
**As a** user on any device  
**I want** the interface to work well  
**So that** I can access the system anywhere

**Acceptance Criteria:**
- Mobile-first design (320px minimum)
- Tablet optimization (768px - 1024px)
- Desktop optimization (1024px+)
- Touch-friendly buttons (min 44px)
- Readable text on all screen sizes
- Collapsible sidebar on mobile

#### 8.2 Navigation
**As a** user  
**I want** intuitive navigation  
**So that** I can find features quickly

**Acceptance Criteria:**
- Sidebar with main sections:
  - Dashboard (Overview)
  - Patients (Patient List)
  - Appointments (Schedules)
  - Consultations
  - Reports
  - Settings
- Active page highlighted
- Breadcrumb navigation
- Quick search in header
- User profile dropdown

#### 8.3 Loading States
**As a** user  
**I want** visual feedback during loading  
**So that** I know the system is working

**Acceptance Criteria:**
- Skeleton loaders for tables
- Spinner for buttons during submission
- Progress indicators for long operations
- Disable buttons during processing
- Error boundaries for crashes

#### 8.4 Error Handling
**As a** user  
**I want** clear error messages  
**So that** I can resolve issues

**Acceptance Criteria:**
- User-friendly error messages
- Toast notifications for success/error
- Form validation errors inline
- Network error handling
- Retry mechanism for failed requests
- Fallback UI for crashes

### 9. Reporting & Analytics

#### 9.1 Generate Reports
**As a** clinic administrator  
**I want** to generate reports  
**So that** I can analyze clinic performance

**Acceptance Criteria:**
- Patient registration report (daily, weekly, monthly)
- Appointment report (by doctor, department, status)
- Revenue report (by service, doctor, period)
- Consultation report (by diagnosis, treatment)
- Export to CSV/PDF
- Date range selector
- Filter options

### 10. Settings & Configuration

#### 10.1 User Profile
**As a** user  
**I want** to manage my profile  
**So that** my information is current

**Acceptance Criteria:**
- View/edit name, email, phone
- Change password
- Upload profile photo
- Set notification preferences
- Save changes to database

#### 10.2 System Settings
**As a** administrator  
**I want** to configure system settings  
**So that** the system meets clinic needs

**Acceptance Criteria:**
- Clinic information (name, address, contact)
- Business hours
- Appointment duration settings
- User role management
- Department management
- Service/treatment catalog

## Non-Functional Requirements

### Performance
- Page load time < 3 seconds
- API response time < 1 second
- Support 50 concurrent users
- Handle 1,000+ patient records without lag

### Scalability
- Database-side filtering and pagination
- Lazy loading for images
- Code splitting for faster initial load
- CDN for static assets

### Accessibility
- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader compatible
- High contrast mode
- Focus indicators

### Browser Support
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

### Deployment
- Vercel for frontend hosting
- Supabase for backend/database
- Environment variables for configuration
- Automatic deployments from Git
- Zero-cost deployment (free tiers)

## Out of Scope (Future Enhancements)
- SMS/Email notifications
- Telemedicine integration
- Billing and invoicing
- Inventory management
- Lab results integration
- Prescription printing
- Insurance claims processing
- Multi-language support

## Success Metrics
- System uptime > 99%
- Average page load time < 3 seconds
- User satisfaction score > 4.5/5
- Zero data loss incidents
- < 5 support tickets per week

## Timeline
- Phase 1: Authentication & Dashboard (Week 1)
- Phase 2: Patient Management (Week 2)
- Phase 3: Appointments & Consultations (Week 3)
- Phase 4: Reports & Settings (Week 4)
- Phase 5: Testing & Deployment (Week 5)
