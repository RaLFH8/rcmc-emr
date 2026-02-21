# RCMC Healthcare EMR Dashboard

A modern, pixel-perfect Electronic Medical Records (EMR) dashboard for RizalCare Medical Clinic built with React, Tailwind CSS, and Supabase.

## 🎯 Features

- **Dashboard Overview** - Real-time statistics, patient charts, and appointment calendar
- **Patient Management** - Complete patient records with search and filtering
- **Appointment Scheduling** - Calendar-based appointment system
- **Doctor Management** - Doctor profiles and schedules
- **Consultation Records** - Medical consultation history and notes
- **Billing System** - Invoice generation and payment tracking
- **Responsive Design** - Works on desktop, tablet, and mobile devices

## 🚀 Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Cloudflare Pages

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier)
- Cloudflare account (free tier)

## 🛠️ Installation

### 1. Clone and Install Dependencies

```cmd
cd C:\Users\ralfh\Desktop\Kiro\rcmc-emr
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project (or use existing)
2. Go to SQL Editor and run the schema from `supabase-schema.sql`
3. Get your project URL and anon key from Settings > API

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run Development Server

```cmd
npm run dev
```

The app will be available at `http://localhost:3001`

## 📦 Build for Production

```cmd
npm run build
```

The production build will be in the `dist` folder.

## 🌐 Deploy to Cloudflare Pages

### Option 1: Via Cloudflare Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to Pages
3. Click "Create a project"
4. Connect your Git repository
5. Set build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
6. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
7. Click "Save and Deploy"

### Option 2: Via Wrangler CLI

```cmd
npm install -g wrangler
wrangler login
wrangler pages publish dist --project-name=rcmc-emr
```

## 📊 Database Schema

The EMR system uses the following main tables:

- `emr.patients` - Patient records
- `emr.doctors` - Doctor profiles
- `emr.appointments` - Appointment scheduling
- `emr.consultations` - Medical consultations
- `emr.billing` - Billing and payments
- `emr.audit_log` - Audit trail

All tables are in the `emr` schema to keep them separate from other projects.

## 🎨 Design System

- **Primary Color**: Teal (#14B8A6)
- **Font**: Inter
- **Shadows**: Soft shadows (shadow-sm)
- **Border Radius**: 12px (rounded-xl)
- **Spacing**: 24px gaps between cards

## 📱 Responsive Breakpoints

- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- Supabase Auth for authentication
- Environment variables for sensitive data
- HTTPS only in production

## 📈 Performance

- Code splitting with React.lazy()
- Database-side filtering and pagination
- Optimized queries with proper indexing
- Lazy loading for images

## 🤝 Contributing

This is a private project for RizalCare Medical Clinic.

## 📄 License

Proprietary - RizalCare Medical Clinic

## 📞 Support

For support, contact:
- Email: rizalcaremedicalclinic@gmail.com
- Phone: 0938-775-1504 / 0976-273-9445

---

**Built with ❤️ for RizalCare Medical Clinic**
