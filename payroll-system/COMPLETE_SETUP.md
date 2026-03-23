# Complete Setup & Deployment Guide

This guide will take you from zero to a fully deployed Spectro Payroll System in about 15 minutes!

## 📋 What You'll Need

- Node.js installed (v16 or higher)
- GitHub account (free)
- Supabase account (free)
- Vercel account (free)

## 🎯 Overview

1. ✅ Install dependencies
2. ✅ Setup Supabase database
3. ✅ Configure environment variables
4. ✅ Test locally
5. ✅ Deploy to Vercel
6. ✅ Go live!

---

## Step 1: Install Dependencies (2 minutes)

```bash
cd payroll-system
npm install
```

This installs:
- React & React DOM
- Vite (build tool)
- Tailwind CSS (styling)
- Lucide React (icons)
- Chart.js (charts)
- Supabase client

---

## Step 2: Setup Supabase (5 minutes)

### 2.1 Create Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub (easiest)
4. Click "New Project"
5. Fill in:
   - **Organization**: Create new or select existing
   - **Name**: `spectro-payroll`
   - **Database Password**: Generate strong password (save it!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free
6. Click "Create new project"
7. Wait ~2 minutes for setup

### 2.2 Create Database Tables

1. In Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click "+ New query"
3. Open `supabase-schema.sql` from your project
4. Copy ALL the SQL code
5. Paste into Supabase SQL Editor
6. Click "Run" (or Ctrl+Enter)
7. Should see: ✅ "Success. No rows returned"

This creates:
- `employees` table
- `payroll_records` table
- Indexes for performance
- Security policies
- Auto-update triggers

### 2.3 Get API Credentials

1. Click **Project Settings** (gear icon, bottom left)
2. Click **API** in left menu
3. Find these two values:

   **Project URL**:
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```

   **anon public key** (under "Project API keys"):
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...
   ```

4. Keep this tab open - you'll need these values!

---

## Step 3: Configure Environment (1 minute)

### 3.1 Create .env file

In the `payroll-system` folder, create a file named `.env`:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3.2 Replace with your values

Copy your actual values from Step 2.3:
- Replace `https://your-project-id.supabase.co` with your Project URL
- Replace `your-anon-key-here` with your anon public key

**Important**: 
- ✅ Keep the `VITE_` prefix
- ✅ No quotes needed
- ✅ No spaces around `=`

---

## Step 4: Test Locally (2 minutes)

### 4.1 Start dev server

```bash
npm run dev
```

You should see:
```
  VITE v5.0.0  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 4.2 Open in browser

1. Go to http://localhost:5173
2. You should see the dashboard loading
3. After a moment, 4 sample employees appear
4. Click "Employees" in sidebar
5. Click "Add Employee"
6. Fill in the form and submit
7. New employee should appear in the table!

### 4.3 Verify in Supabase

1. Go back to Supabase dashboard
2. Click **Table Editor** (left sidebar)
3. Click `employees` table
4. You should see your new employee! 🎉

**If this works, you're ready to deploy!**

---

## Step 5: Push to GitHub (3 minutes)

### 5.1 Create GitHub repository

1. Go to [https://github.com/new](https://github.com/new)
2. Repository name: `spectro-payroll`
3. Description: "Modern payroll management system"
4. Public or Private (your choice)
5. Don't initialize with README (we have one)
6. Click "Create repository"

### 5.2 Push your code

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Spectro Payroll System"

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/spectro-payroll.git

# Push
git branch -M main
git push -u origin main
```

---

## Step 6: Deploy to Vercel (5 minutes)

### 6.1 Import project

1. Go to [https://vercel.com](https://vercel.com)
2. Click "Sign Up" or "Log In"
3. Choose "Continue with GitHub"
4. Authorize Vercel
5. Click "Add New..." → "Project"
6. Find your `spectro-payroll` repository
7. Click "Import"

### 6.2 Configure project

**Framework Preset**: Vite (should auto-detect)

**Root Directory**: `./` (leave as is)

**Build Settings**:
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### 6.3 Add Environment Variables

Click "Environment Variables" section:

Add Variable 1:
- **Name**: `VITE_SUPABASE_URL`
- **Value**: (paste your Supabase URL)
- **Environment**: Production, Preview, Development (all checked)

Add Variable 2:
- **Name**: `VITE_SUPABASE_ANON_KEY`
- **Value**: (paste your Supabase anon key)
- **Environment**: Production, Preview, Development (all checked)

### 6.4 Deploy!

1. Click "Deploy"
2. Wait 1-2 minutes
3. You'll see: 🎉 "Congratulations!"
4. Click "Visit" to see your live site!

Your URL will be: `https://spectro-payroll.vercel.app` (or similar)

---

## Step 7: Test Live Site (1 minute)

1. Visit your Vercel URL
2. Dashboard should load with sample employees
3. Click "Employees"
4. Add a new employee
5. Check Supabase Table Editor - data should be there!

**If this works, you're DONE! 🚀**

---

## 🎉 Success Checklist

- ✅ Local development works
- ✅ Can add/edit/delete employees locally
- ✅ Data saves to Supabase
- ✅ Code pushed to GitHub
- ✅ Deployed to Vercel
- ✅ Live site works
- ✅ Live site saves data to Supabase

---

## 🔄 Making Updates

After initial deployment, updates are automatic:

```bash
# Make your changes
# Then:
git add .
git commit -m "Add new feature"
git push

# Vercel automatically deploys! ✨
```

---

## 🆓 What's Free Forever

### Vercel Free Tier
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ Custom domains
- ✅ Preview deployments

### Supabase Free Tier
- ✅ 500MB database (thousands of employees)
- ✅ 1GB file storage
- ✅ 50,000 monthly active users
- ✅ 2GB bandwidth
- ✅ Automatic backups

**Perfect for small to medium businesses!**

---

## 🐛 Troubleshooting

### "Failed to load employees"
- Check `.env` file has correct values
- Verify Supabase URL and key
- Check browser console for errors
- Make sure SQL schema was run

### Build failed on Vercel
- Check environment variables are set
- Verify they start with `VITE_`
- Try redeploying

### Data not saving
- Check Supabase Table Editor for errors
- Verify RLS policies are enabled (they're in schema)
- Check browser console

### Port 5173 already in use
- Vite will automatically use next port (5174, 5175, etc.)
- Or kill the process using that port

---

## 📚 Next Steps

1. **Add Authentication**: Use Supabase Auth
2. **Custom Domain**: Add in Vercel settings
3. **Email Reports**: Use Supabase Edge Functions
4. **PDF Export**: Add jsPDF library
5. **Advanced Analytics**: More charts and insights

---

## 🆘 Need Help?

- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **React Docs**: https://react.dev
- **Tailwind Docs**: https://tailwindcss.com

---

## 🎊 Congratulations!

You now have a fully functional, cloud-hosted payroll management system!

**Share your live URL**: `https://your-project.vercel.app`

Built with ❤️ using React, Supabase, and Vercel
