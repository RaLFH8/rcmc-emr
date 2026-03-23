# Quick Start Guide

## Installation & Setup

### Step 1: Install Dependencies

Open PowerShell or Command Prompt in the `payroll-system` folder and run:

```bash
npm install
```

If you get a PowerShell execution policy error, run this first:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### Step 2: Start Development Server

```bash
npm run dev
```

The app will open at: **http://localhost:5173**

## What You'll See

### Dashboard (Default Page)
- 4 stat cards showing Total Payroll, Employees, Active Tax, and Net Pay
- Monthly payroll trend chart (bar chart)
- Department distribution chart (doughnut chart)
- Recent employees table

### Employees Page
- Click "Add Employee" to create new employee records
- Fill in: Name, Email, Position, Department, Salary, Join Date
- Add government deductions: SSS, PhilHealth, Pag-IBIG
- Edit or delete existing employees
- Search employees by name, email, or position

### Payroll Page
- View complete payroll breakdown for all employees
- See individual deductions (SSS, PhilHealth, Pag-IBIG)
- Calculate net pay automatically
- Filter by month

### Sample Data
The system includes 4 sample employees on first load:
- Darlene Steffy - Software Engineer (₱85,000)
- Darrell Steward - Business Analyst (₱65,000)
- Nessa Cooper - Product Designer (₱75,000)
- Marvin McKinney - Marketing Manager (₱70,000)

## Data Persistence

✅ All data is saved automatically to your browser's localStorage
✅ Data persists across page refreshes
✅ No backend or database setup required

## Troubleshooting

### Port Already in Use
If port 5173 is busy, Vite will automatically use the next available port (5174, 5175, etc.)

### Dependencies Not Installing
Make sure you have Node.js installed (v16 or higher):
```bash
node --version
npm --version
```

Download from: https://nodejs.org/

### Clear Data
To reset and clear all data:
1. Open browser DevTools (F12)
2. Go to Application → Local Storage
3. Delete `employees` and `payroll` keys
4. Refresh the page

## Build for Production

```bash
npm run build
```

Output will be in the `dist` folder. Deploy to any static hosting service (Vercel, Netlify, GitHub Pages, etc.)

## Features

✨ Modern Spectro-inspired design
📊 Interactive charts (Chart.js)
💾 LocalStorage persistence
🎨 Tailwind CSS styling
🔍 Search functionality
📱 Fully responsive
⚡ Fast (Vite build tool)

Enjoy your Spectro Payroll Management System! 🚀
