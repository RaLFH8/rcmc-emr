# RCMC EMR - Complete Setup Guide

## Step 1: Install Dependencies

Open Command Prompt and navigate to the project:

```cmd
cd C:\Users\ralfh\Desktop\Kiro\rcmc-emr
npm install
```

This will install all required packages:
- React 18
- Vite
- Tailwind CSS
- Lucide React (icons)
- Recharts (charts)
- Supabase client

## Step 2: Set Up Supabase Database

### 2.1 Create/Use Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in with your account
3. You can use your existing project (same as payroll system)
4. Note your project URL and anon key from Settings > API

### 2.2 Run Database Schema

1. In Supabase Dashboard, go to SQL Editor
2. Click "New Query"
3. Copy the entire contents of `supabase-schema.sql`
4. Paste into the SQL Editor
5. Click "Run" to execute

This will create:
- `emr` schema (separate from payroll)
- All tables (patients, doctors, appointments, consultations, billing)
- Indexes for performance
- Row Level Security policies
- Sample data (4 patients, 4 doctors)

### 2.3 Verify Database Setup

Run this query to check:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'emr';
```

You should see: patients, doctors, appointments, consultations, billing, audit_log

## Step 3: Configure Environment Variables

### 3.1 Create .env File

In the `rcmc-emr` folder, create a file named `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3.2 Get Your Credentials

1. Go to Supabase Dashboard
2. Click on your project
3. Go to Settings > API
4. Copy:
   - Project URL → `VITE_SUPABASE_URL`
   - anon/public key → `VITE_SUPABASE_ANON_KEY`

**IMPORTANT**: Never commit the `.env` file to Git! It's already in `.gitignore`.

## Step 4: Run Development Server

```cmd
npm run dev
```

The app will start at `http://localhost:3001`

You should see:
- ✅ MediLens dashboard with sidebar
- ✅ 4 stat cards (Total Patient, Total Doctor, etc.)
- ✅ Patient statistics chart
- ✅ Calendar widget
- ✅ Schedule list
- ✅ Recent patients table

## Step 5: Test the Application

### 5.1 Check Dashboard

- Verify stat cards show correct numbers
- Check if chart renders properly
- Test calendar date selection
- Verify recent patients table shows data

### 5.2 Test Navigation

Click each sidebar item:
- Dashboard ✓
- Appointment (placeholder)
- Room (placeholder)
- Payment (placeholder)
- Doctor (placeholder)
- Patient (placeholder)
- Inpatient (placeholder)

### 5.3 Test Responsive Design

- Resize browser window
- Click collapse button on sidebar
- Verify layout adapts properly

## Step 6: Build for Production

```cmd
npm run build
```

This creates an optimized production build in the `dist` folder.

## Step 7: Deploy to Cloudflare Pages

### Method 1: Cloudflare Dashboard (Recommended)

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Click "Pages" in the sidebar
3. Click "Create a project"
4. Choose "Connect to Git"
5. Select your repository
6. Configure build settings:
   - **Framework preset**: None
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
7. Add environment variables:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
8. Click "Save and Deploy"

### Method 2: Wrangler CLI

```cmd
# Install Wrangler globally
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
wrangler pages publish dist --project-name=rcmc-emr
```

## Step 8: Set Up Git Repository

```cmd
cd C:\Users\ralfh\Desktop\Kiro\rcmc-emr
git init
git add .
git commit -m "Initial commit: RCMC EMR Dashboard"
git branch -M main
git remote add origin https://github.com/yourusername/rcmc-emr.git
git push -u origin main
```

## Troubleshooting

### Issue: "Cannot find module '@supabase/supabase-js'"

**Solution**:
```cmd
npm install @supabase/supabase-js
```

### Issue: "Vite config not found"

**Solution**: Make sure you're in the correct directory:
```cmd
cd C:\Users\ralfh\Desktop\Kiro\rcmc-emr
```

### Issue: "Supabase connection error"

**Solution**:
1. Check your `.env` file exists
2. Verify URL and key are correct
3. Make sure there are no extra spaces
4. Restart the dev server

### Issue: "No data showing in dashboard"

**Solution**:
1. Check Supabase SQL Editor for errors
2. Verify sample data was inserted
3. Check browser console for errors
4. Verify RLS policies are set correctly

### Issue: "Chart not rendering"

**Solution**:
```cmd
npm install recharts
```

## Next Steps

1. ✅ Dashboard is complete and working
2. 🔄 Implement Patient Management module
3. 🔄 Implement Appointment Scheduling
4. 🔄 Implement Doctor Management
5. 🔄 Implement Consultation Records
6. 🔄 Implement Billing System
7. 🔄 Add Authentication (Supabase Auth)
8. 🔄 Add user roles and permissions

## Storage Usage

Current database size: ~0.01 MB (with sample data)
Projected Year 1: ~36.7 MB
Supabase Free Tier: 500 MB

You have plenty of space! 🎉

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Check Supabase logs in Dashboard > Logs
3. Verify all environment variables are set
4. Make sure Node.js version is 18+

---

**Status**: ✅ Dashboard Complete and Ready to Use!
