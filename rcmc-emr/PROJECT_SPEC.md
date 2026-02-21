# RCMC EMR Dashboard - Project Specification

## Project Overview
**Goal**: Build a modern, scalable Electronic Medical Records (EMR) Dashboard for RizalCare Medical Clinic with cloud-based data persistence and real-time patient management.

**Company**: RIZALCARE MEDICAL CLINIC  
**Address**: GF IPDL8 Bldg., 25 G. Dikit St., Brgy. Bagumbayan, Pililla, Rizal  
**Contact**: 0938-775-1504 / 0976-273-9445  
**Email**: rizalcaremedicalclinic@gmail.com

---

## Tech Stack

### Frontend
- **Framework**: React 18+ with Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide-React
- **Charts**: Recharts
- **Font**: Inter (Google Fonts)

### Backend & Database
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth (Email/Password)
- **Storage**: Supabase Storage (for medical documents/images)
- **Real-time**: Supabase Realtime subscriptions

### Deployment
- **Hosting**: Vercel (Frontend)
- **Database**: Supabase Cloud (Free tier)
- **Cost**: 100% Free

---

## Core Requirements

### 1. Data Scalability
- Must handle **1,000+ new patient records per month** without lag
- Use **database-side filtering** and pagination
- Implement efficient indexing on frequently queried fields
- Lazy loading for large datasets
- Optimized queries with proper WHERE clauses

### 2. Dashboard UI Components

#### Sidebar Navigation
- Overview (Dashboard)
- Patient List
- Appointments/Schedules
- Consultations
- Billing
- Reports
- Settings

#### Main Dashboard Metrics
- **Monthly Patients**: Display count (e.g., "720 Monthly Patients")
- **Revenue Charts**: Monthly revenue trends using Recharts
- **Appointment Status**: Today's appointments, pending, completed
- **Quick Stats**: Total patients, active consultations, pending bills

### 3. Security Requirements
- **Authentication**: Supabase Auth with Email/Password login
- **Row Level Security (RLS)**: Enabled on all tables
- **Role-Based Access**: Admin, Doctor, Nurse, Receptionist roles
- **Session Management**: Secure token-based sessions
- **Data Encryption**: All sensitive data encrypted at rest

### 4. Data Persistence
- **Cloud Storage**: All patient data saved to Supabase 24/7
- **Auto-save**: Forms auto-save drafts every 30 seconds
- **Backup**: Automatic daily backups via Supabase
- **Sync**: Real-time data synchronization across devices

---

## Design System

### Color Palette
- **Primary Teal**: `#0D9488` (Tailwind: `teal-600`)
- **Light Teal**: `#14B8A6` (Tailwind: `teal-500`)
- **Dark Teal**: `#0F766E` (Tailwind: `teal-700`)
- **Background**: `#F8FAFC` (Tailwind: `slate-50`)
- **Card Background**: `#FFFFFF`
- **Text Primary**: `#0F172A` (Tailwind: `slate-900`)
- **Text Secondary**: `#64748B` (Tailwind: `slate-500`)
- **Border**: `#E2E8F0` (Tailwind: `slate-200`)
- **Success**: `#10B981` (Tailwind: `emerald-500`)
- **Warning**: `#F59E0B` (Tailwind: `amber-500`)
- **Error**: `#EF4444` (Tailwind: `red-500`)

### Typography
- **Font Family**: Inter (weights: 400, 500, 600, 700)
- **Headings**: Font-bold, tracking-tight
- **Body**: Font-normal, leading-relaxed
- **Labels**: Font-semibold, text-sm

### Shadows & Effects
- **Cards**: `shadow-sm` (soft shadows)
- **Hover**: `shadow-md` (medium shadows)
- **Focus**: `ring-2 ring-teal-500` (teal focus rings)
- **Rounded Corners**: `rounded-xl` (12px) for cards, `rounded-lg` (8px) for inputs

### Spacing
- **Container Padding**: `p-6` (24px)
- **Card Spacing**: `space-y-6` (24px vertical)
- **Form Fields**: `gap-4` (16px)

---

## Database Schema

### Tables

#### 1. patients
```sql
- id (uuid, primary key)
- patient_number (text, unique, auto-generated)
- first_name (text)
- middle_name (text, nullable)
- last_name (text)
- date_of_birth (date)
- gender (text: Male/Female/Other)
- contact_number (text)
- email (text, nullable)
- address (text)
- emergency_contact_name (text)
- emergency_contact_number (text)
- blood_type (text, nullable)
- allergies (text[], nullable)
- medical_history (text, nullable)
- created_at (timestamp)
- updated_at (timestamp)
- created_by (uuid, foreign key to auth.users)
```

#### 2. appointments
```sql
- id (uuid, primary key)
- patient_id (uuid, foreign key to patients)
- doctor_id (uuid, foreign key to doctors)
- appointment_date (date)
- appointment_time (time)
- status (text: Scheduled/Completed/Cancelled/No-Show)
- reason (text)
- notes (text, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

#### 3. consultations
```sql
- id (uuid, primary key)
- patient_id (uuid, foreign key to patients)
- doctor_id (uuid, foreign key to doctors)
- appointment_id (uuid, foreign key to appointments, nullable)
- consultation_date (timestamp)
- chief_complaint (text)
- vital_signs (jsonb: BP, temp, pulse, weight, height)
- diagnosis (text)
- prescription (text)
- lab_orders (text[], nullable)
- follow_up_date (date, nullable)
- notes (text, nullable)
- created_at (timestamp)
- created_by (uuid, foreign key to auth.users)
```

#### 4. doctors
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key to auth.users)
- first_name (text)
- last_name (text)
- specialization (text)
- license_number (text, unique)
- contact_number (text)
- email (text)
- status (text: Active/Inactive)
- created_at (timestamp)
```

#### 5. billing
```sql
- id (uuid, primary key)
- patient_id (uuid, foreign key to patients)
- consultation_id (uuid, foreign key to consultations, nullable)
- bill_date (date)
- items (jsonb[]: {name, quantity, price})
- subtotal (numeric)
- discount (numeric, default 0)
- total_amount (numeric)
- amount_paid (numeric, default 0)
- balance (numeric)
- payment_status (text: Unpaid/Partial/Paid)
- payment_method (text, nullable)
- notes (text, nullable)
- created_at (timestamp)
- created_by (uuid, foreign key to auth.users)
```

---

## Features & Modules

### 1. Authentication Module
- Login page with email/password
- Session persistence
- Logout functionality
- Password reset (future)

### 2. Dashboard (Overview)
- Monthly patient count card
- Revenue chart (last 6 months)
- Today's appointments list
- Quick stats: Total patients, consultations, pending bills
- Recent activity feed

### 3. Patient Management
- Patient list with search and filters
- Add new patient form
- Edit patient details
- View patient profile with medical history
- Patient timeline (appointments, consultations, billing)

### 4. Appointment Scheduling
- Calendar view of appointments
- Add/Edit/Cancel appointments
- Filter by doctor, status, date
- Appointment reminders (future)

### 5. Consultation Module
- Create consultation record
- Record vital signs
- Add diagnosis and prescription
- Link to patient and appointment
- Print consultation summary

### 6. Billing Module
- Create bills with line items
- Record payments
- Track payment status
- Generate receipts
- Payment history

### 7. Reports Module
- Patient statistics
- Revenue reports
- Appointment analytics
- Export to CSV/PDF

### 8. Settings Module
- User profile management
- Clinic information
- System preferences

---

## Performance Requirements

### Load Times
- Initial page load: < 2 seconds
- Navigation between pages: < 500ms
- Search results: < 1 second
- Form submissions: < 2 seconds

### Optimization Strategies
- Code splitting with React.lazy()
- Image optimization
- Database indexing on search fields
- Pagination (20-50 records per page)
- Debounced search inputs
- Memoization for expensive computations

---

## Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1023px
- **Desktop**: ≥ 1024px

### Mobile Features
- Hamburger menu for sidebar
- Stacked cards on mobile
- Touch-friendly buttons (min 44px)
- Simplified tables (card view)

---

## Development Phases

### Phase 1: Foundation (Week 1)
- [ ] Project setup (Vite + React + Tailwind)
- [ ] Supabase project creation
- [ ] Database schema implementation
- [ ] Authentication setup
- [ ] Basic routing structure

### Phase 2: Core Features (Week 2)
- [ ] Dashboard with charts
- [ ] Patient list and CRUD
- [ ] Appointment scheduling
- [ ] Consultation module

### Phase 3: Advanced Features (Week 3)
- [ ] Billing module
- [ ] Reports and analytics
- [ ] Settings page
- [ ] Responsive optimization

### Phase 4: Polish & Deploy (Week 4)
- [ ] UI/UX refinements
- [ ] Performance optimization
- [ ] Testing
- [ ] Vercel deployment
- [ ] Documentation

---

## Success Criteria

✅ All CRUD operations work without errors  
✅ Dashboard loads in < 2 seconds  
✅ Can handle 1,000+ patient records smoothly  
✅ Responsive on mobile, tablet, and desktop  
✅ Authentication is secure with RLS enabled  
✅ Data persists to Supabase 24/7  
✅ Charts display accurate data  
✅ Forms validate user input properly  
✅ Deployed to Vercel successfully  

---

## Next Steps

1. Initialize Vite + React project
2. Set up Tailwind CSS and Lucide-React
3. Create Supabase project and database
4. Implement authentication
5. Build dashboard layout with sidebar
6. Create patient management module
7. Add appointment scheduling
8. Implement consultation and billing
9. Deploy to Vercel

---

**Project Start Date**: February 21, 2026  
**Target Completion**: March 21, 2026 (4 weeks)  
**Status**: Planning Phase
