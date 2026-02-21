# RCMC Healthcare EMR - Complete Step-by-Step Build Guide

Follow these steps exactly to build and run the RCMC Healthcare EMR Dashboard.

---

## 📋 Prerequisites Checklist

Before starting, make sure you have:

- [ ] Windows PC
- [ ] Node.js 18+ installed ([Download here](https://nodejs.org))
- [ ] Command Prompt access
- [ ] Supabase account ([Sign up free](https://supabase.com))
- [ ] Internet connection

---

## STEP 1: Install Node.js (If Not Installed)

### 1.1 Check if Node.js is Installed

Open Command Prompt and type:

```cmd
node --version
```

If you see a version number (like `v18.0.0` or higher), skip to STEP 2.

### 1.2 Install Node.js

1. Go to [nodejs.org](https://nodejs.org)
2. Download the LTS version (recommended)
3. Run the installer
4. Click "Next" through all steps
5. Restart Command Prompt
6. Verify installation: `node --version`

---

## STEP 2: Navigate to Project Folder

### 2.1 Open Command Prompt

Press `Windows Key + R`, type `cmd`, press Enter

### 2.2 Navigate to Project

```cmd
cd C:\Users\ralfh\Desktop\Kiro\rcmc-emr
```

### 2.3 Verify You're in the Right Place

```cmd
dir
```

You should see files like `package.json`, `vite.config.js`, etc.

---

## STEP 3: Install Project Dependencies

### 3.1 Run npm install

```cmd
npm install
```

This will take 2-3 minutes. You'll see a progress bar.

### 3.2 Wait for Completion

You should see:
```
added 234 packages in 2m
```

### 3.3 Verify Installation

```cmd
dir node_modules
```

You should see many folders (React, Vite, Tailwind, etc.)

---

## STEP 4: Set Up Supabase Database

### 4.1 Go to Supabase Dashboard

1. Open browser
2. Go to [supabase.com](https://supabase.com)
3. Click "Sign In"
4. Log in with your account

### 4.2 Select Your Project

1. You should see your existing project (same as payroll)
2. Click on the project name
3. You'll see the project dashboard

### 4.3 Open SQL Editor

1. Click "SQL Editor" in the left sidebar
2. Click "New Query" button (top right)

### 4.4 Copy Database Schema

1. Open the file `supabase-schema.sql` in your project folder
2. Select ALL the text (Ctrl+A)
3. Copy it (Ctrl+C)

### 4.5 Paste and Run Schema

1. Go back to Supabase SQL Editor
2. Paste the schema (Ctrl+V)
3. Click "Run" button (or press Ctrl+Enter)
4. Wait 5-10 seconds

### 4.6 Verify Success

You should see:
```
Success. No rows returned
```

### 4.7 Check Tables Created

1. Click "Table Editor" in left sidebar
2. You should see new tables:
   - emr.patients
   - emr.doctors
   - emr.appointments
   - emr.consultations
   - emr.billing
   - emr.audit_log

### 4.8 Verify Sample Data

1. Click on `emr.patients` table
2. You should see 4 patients:
   - Rodriguez Santos
   - Marcus Stanton
   - Madelyn Schleifer
   - Talan Schleifer

---

## STEP 5: Get Supabase Credentials

### 5.1 Go to Project Settings

1. In Supabase Dashboard, click "Settings" (gear icon, bottom left)
2. Click "API" in the settings menu

### 5.2 Copy Project URL

1. Find "Project URL" section
2. Copy the URL (looks like: `https://xxxxx.supabase.co`)
3. Save it in Notepad temporarily

### 5.3 Copy Anon Key

1. Find "Project API keys" section
2. Find "anon" / "public" key
3. Click "Copy" button
4. Save it in Notepad temporarily

---

## STEP 6: Create Environment File

### 6.1 Open Notepad

1. Press Windows Key
2. Type "Notepad"
3. Open Notepad

### 6.2 Create .env Content

Type exactly this (replace with YOUR credentials):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**IMPORTANT**: 
- Replace `https://your-project.supabase.co` with YOUR Project URL
- Replace `your-anon-key-here` with YOUR Anon Key
- No spaces around the `=` sign
- No quotes around the values

### 6.3 Save the File

1. Click "File" → "Save As"
2. Navigate to: `C:\Users\ralfh\Desktop\Kiro\rcmc-emr`
3. In "File name" box, type: `.env` (with the dot!)
4. In "Save as type", select "All Files (*.*)"
5. Click "Save"

### 6.4 Verify .env File

In Command Prompt:

```cmd
dir .env
```

You should see the `.env` file listed.

---

## STEP 7: Start Development Server

### 7.1 Run Development Server

In Command Prompt (make sure you're in `rcmc-emr` folder):

```cmd
npm run dev
```

### 7.2 Wait for Server to Start

You should see:

```
  VITE v5.1.0  ready in 1234 ms

  ➜  Local:   http://localhost:3001/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### 7.3 Open in Browser

1. Open your web browser (Chrome, Edge, Firefox)
2. Go to: `http://localhost:3001`

---

## STEP 8: Verify Everything Works

### 8.1 Check Dashboard Loads

You should see:
- ✅ MediLens logo and sidebar on the left
- ✅ Search bar at the top
- ✅ "Welcome back, Dr. Kierra Carder!" heading
- ✅ 4 stat cards (Total Patient, Total Doctor, etc.)
- ✅ Patient Statistics chart
- ✅ Calendar widget showing May 2025
- ✅ Schedule list with doctor names
- ✅ Recent Patients table with 4 patients

### 8.2 Test Stat Cards

Check the numbers:
- Total Patient: Should show a number (e.g., 432 or 4)
- Total Doctor: Should show a number (e.g., 536 or 4)
- Book Appointment: Should show a number
- Room Availability: Should show 120

### 8.3 Test Chart

- You should see a teal area chart
- Hover over the chart to see tooltips
- Chart should show months (Jan, Feb, Mar, etc.)

### 8.4 Test Calendar

- Click on different dates in the calendar
- The selected date should turn teal
- Current date (12) should be highlighted

### 8.5 Test Sidebar

- Click "Appointment" in sidebar
- Page should change to "Appointments" (placeholder)
- Click "Dashboard" to go back
- Click the collapse button (chevron icon)
- Sidebar should collapse to icons only

### 8.6 Test Recent Patients Table

You should see 4 patients:
1. Rodriguez Santos - Female - Jan 15, 1967
2. Marcus Stanton - Male - Feb 18, 1983
3. Madelyn Schleifer - Female - Mar 26, 1998
4. Talan Schleifer - Male - Feb 14, 1995

---

## STEP 9: Troubleshooting (If Something Doesn't Work)

### Problem: "npm: command not found"

**Solution**: Node.js not installed properly
1. Reinstall Node.js from [nodejs.org](https://nodejs.org)
2. Restart Command Prompt
3. Try again

### Problem: "Cannot find module"

**Solution**: Dependencies not installed
```cmd
npm install
```

### Problem: "Supabase connection error"

**Solution**: Check .env file
1. Open `.env` file
2. Verify URL and key are correct
3. No extra spaces or quotes
4. Restart dev server: `Ctrl+C`, then `npm run dev`

### Problem: "No data showing"

**Solution**: Database not set up
1. Go to Supabase Dashboard
2. Check if tables exist in Table Editor
3. Re-run `supabase-schema.sql` if needed

### Problem: "Port 3001 already in use"

**Solution**: Another app using the port
1. Press `Ctrl+C` to stop server
2. Close other apps using port 3001
3. Or change port in `vite.config.js`:
   ```js
   server: {
     port: 3002  // Change to 3002
   }
   ```

### Problem: "Chart not showing"

**Solution**: Recharts not installed
```cmd
npm install recharts
```

### Problem: "Blank white screen"

**Solution**: Check browser console
1. Press `F12` in browser
2. Click "Console" tab
3. Look for red error messages
4. Share the error for help

---

## STEP 10: Stop the Development Server

When you're done testing:

1. Go to Command Prompt window
2. Press `Ctrl + C`
3. Type `Y` and press Enter
4. Server will stop

To start again later:
```cmd
cd C:\Users\ralfh\Desktop\Kiro\rcmc-emr
npm run dev
```

---

## STEP 11: Build for Production (Optional)

### 11.1 Create Production Build

```cmd
npm run build
```

This creates optimized files in the `dist` folder.

### 11.2 Preview Production Build

```cmd
npm run preview
```

Open `http://localhost:4173` to test production build.

---

## STEP 12: Deploy to Cloudflare Pages (Optional)

### 12.1 Create GitHub Repository

1. Go to [github.com](https://github.com)
2. Click "New repository"
3. Name: `rcmc-emr`
4. Click "Create repository"

### 12.2 Push Code to GitHub

```cmd
git init
git add .
git commit -m "Initial commit: RCMC EMR Dashboard"
git branch -M main
git remote add origin https://github.com/yourusername/rcmc-emr.git
git push -u origin main
```

### 12.3 Deploy to Cloudflare

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Click "Pages"
3. Click "Create a project"
4. Connect to Git
5. Select `rcmc-emr` repository
6. Build settings:
   - Build command: `npm run build`
   - Build output: `dist`
7. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
8. Click "Save and Deploy"

Your site will be live at: `https://rcmc-emr.pages.dev`

---

## 📊 What You've Built

✅ Complete React application with Vite
✅ Tailwind CSS styling
✅ Supabase database with 6 tables
✅ Pixel-perfect dashboard matching MediLens design
✅ Interactive charts and calendar
✅ Responsive design (mobile, tablet, desktop)
✅ Real-time data from database
✅ Ready for production deployment

---

## 📁 Project Structure

```
rcmc-emr/
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx          ← Navigation sidebar
│   │   ├── TopBar.jsx            ← Top search bar
│   │   └── StatCard.jsx          ← Stat card component
│   ├── pages/
│   │   ├── Dashboard.jsx         ← Main dashboard (complete)
│   │   ├── Appointments.jsx      ← Placeholder
│   │   ├── Rooms.jsx             ← Placeholder
│   │   ├── Payments.jsx          ← Placeholder
│   │   ├── Doctors.jsx           ← Placeholder
│   │   ├── Patients.jsx          ← Placeholder
│   │   └── Inpatients.jsx        ← Placeholder
│   ├── lib/
│   │   └── supabase.js           ← Database functions
│   ├── App.jsx                   ← Main app component
│   ├── main.jsx                  ← Entry point
│   └── index.css                 ← Global styles
├── supabase-schema.sql           ← Database schema
├── package.json                  ← Dependencies
├── vite.config.js                ← Vite configuration
├── tailwind.config.js            ← Tailwind configuration
├── .env                          ← Environment variables (YOU CREATE THIS)
└── node_modules/                 ← Installed packages
```

---

## 🎯 Next Steps

Now that the dashboard is working, you can:

1. ✅ Test all features
2. 🔄 Build Patient Management module
3. 🔄 Build Appointment Scheduling
4. 🔄 Build Doctor Management
5. 🔄 Add Authentication
6. 🔄 Deploy to production

---

## 📞 Need Help?

If you get stuck:

1. Check the error message in Command Prompt
2. Check browser console (F12)
3. Review this guide step-by-step
4. Check `SETUP_GUIDE.md` for more details
5. Verify Supabase credentials in `.env`

---

## ✅ Success Checklist

Before moving on, verify:

- [ ] Node.js installed and working
- [ ] Project dependencies installed (`node_modules` folder exists)
- [ ] Supabase database created (6 tables in `emr` schema)
- [ ] Sample data loaded (4 patients, 4 doctors)
- [ ] `.env` file created with correct credentials
- [ ] Development server starts without errors
- [ ] Dashboard loads in browser
- [ ] All 4 stat cards show numbers
- [ ] Chart renders properly
- [ ] Calendar is interactive
- [ ] Recent patients table shows 4 patients
- [ ] Sidebar navigation works
- [ ] Sidebar collapse button works

If all checked ✅, you're ready to build more features!

---

**Congratulations! 🎉**

You've successfully built and deployed the RCMC Healthcare EMR Dashboard!

**Time to complete**: 15-20 minutes
**Status**: ✅ Dashboard Complete and Working
**Next**: Build Patient Management Module

---

**Built with ❤️ for RizalCare Medical Clinic**
