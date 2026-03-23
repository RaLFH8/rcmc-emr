# Spectro Payroll Management System

A modern, full-stack payroll management dashboard inspired by the Spectro design on Dribbble.

## ✨ Features

- 🎨 Clean, modern SaaS interface with Spectro-inspired design
- 📊 Interactive data visualizations (Bar & Doughnut charts)
- 👥 Complete employee management (Add, Edit, Delete)
- 💰 Payroll processing with SSS, PhilHealth, and Pag-IBIG deductions
- 💾 Real-time data persistence with Supabase
- 🚀 Deployed on Vercel with automatic deployments
- 📱 Fully responsive design
- 🎨 Built with React, Tailwind CSS, and Lucide icons

## 🛠 Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Chart.js + React-Chartjs-2
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel
- **Authentication**: Ready for Supabase Auth (optional)

## 🚀 Quick Start

### 1. Clone & Install

```bash
cd payroll-system
npm install
```

### 2. Setup Supabase

Follow the detailed guide in **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**

Quick version:
1. Create project at [supabase.com](https://supabase.com)
2. Run the SQL in `supabase-schema.sql`
3. Copy your project URL and anon key

### 3. Configure Environment

Create `.env` file:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## 🌐 Deploy to Vercel

Follow the detailed guide in **[VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md)**

Quick version:
1. Push code to GitHub
2. Import project in [vercel.com](https://vercel.com)
3. Add environment variables
4. Deploy! 🎉

Your app will be live at: `https://your-project.vercel.app`

## 📋 Features Overview

### Dashboard
- Total Payroll, Employees, Active Tax, and Net Pay stats
- Monthly payroll trend chart (6 months)
- Department distribution chart
- Recent employees table with real-time data

### Employees
- Add new employees with complete details
- Edit existing employee information
- Delete employees (with confirmation)
- Search by name, email, or position
- Government deductions (SSS, PhilHealth, Pag-IBIG)
- Real-time sync with Supabase

### Payroll
- View complete payroll breakdown
- Automatic net pay calculation
- Monthly payroll filtering
- Summary statistics
- Export-ready data

### Data Persistence

✅ All data stored in Supabase PostgreSQL
✅ Real-time updates across all users
✅ Automatic backups
✅ Scalable to thousands of employees
✅ Sample data included on first load

## 📊 Database Schema

### Employees Table
- id (UUID, primary key)
- name, email, position, department
- salary, status, join_date
- sss, philhealth, pagibig (deductions)
- created_at, updated_at

### Payroll Records Table
- id (UUID, primary key)
- employee_id (foreign key)
- period, basic_salary
- deductions (sss, philhealth, pagibig, tax)
- net_salary, status, payment_date
- created_at

## 🎨 Design

Inspired by the Spectro Payroll Management Dashboard:
- Light/white background with subtle grays
- Purple/blue gradient accents (#667eea to #764ba2)
- Rounded corners (12px-20px)
- Modern card layouts with shadows
- Clean typography (Inter/System fonts)
- Professional color scheme

## 🔒 Security

- Row Level Security (RLS) enabled
- Environment variables for sensitive data
- Supabase handles authentication
- HTTPS by default on Vercel
- No sensitive data in frontend code

## 📱 Browser Support

- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers

## 🆓 Free Tier Limits

### Vercel
- Unlimited deployments
- 100GB bandwidth/month
- Automatic HTTPS
- Custom domains

### Supabase
- 500MB database
- 1GB file storage
- 50,000 monthly active users
- 2GB bandwidth

Perfect for small to medium businesses!

## 📚 Documentation

- [Supabase Setup Guide](./SUPABASE_SETUP.md)
- [Vercel Deployment Guide](./VERCEL_DEPLOY.md)
- [Quick Start Guide](./QUICK_START.md)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT

## 🙏 Credits

- Design inspiration: [Spectro on Dribbble](https://dribbble.com/shots/24300752-Spectro-Payroll-Management-Dashboard)
- Built with React, Tailwind CSS, Supabase, and Vercel

---

Made with ❤️ for modern payroll management


## 🎯 Recent Updates

- ✅ Payslip history tracking feature
- ✅ Light mode text visibility improvements
- ✅ Monthly/Weekly payroll toggle
- ✅ Enhanced dark theme support
