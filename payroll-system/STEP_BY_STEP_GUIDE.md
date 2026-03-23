# 📖 Complete Step-by-Step Guide
## Spectro Payroll Management System

**Total Time**: 20-30 minutes  
**Difficulty**: Beginner-friendly  
**Cost**: $0 (100% Free)

---

## 📋 Table of Contents

1. [Prerequisites](#step-0-prerequisites)
2. [Install Dependencies](#step-1-install-dependencies)
3. [Create Supabase Account & Project](#step-2-create-supabase-account--project)
4. [Setup Database](#step-3-setup-database)
5. [Get API Credentials](#step-4-get-api-credentials)
6. [Configure Environment Variables](#step-5-configure-environment-variables)
7. [Test Locally](#step-6-test-locally)
8. [Create GitHub Repository](#step-7-create-github-repository)
9. [Push Code to GitHub](#step-8-push-code-to-github)
10. [Deploy to Vercel](#step-9-deploy-to-vercel)
11. [Test Live Site](#step-10-test-live-site)
12. [Next Steps](#step-11-next-steps)

---

## Step 0: Prerequisites

### What You Need:

#### 1. Node.js Installed
**Check if you have it:**
```bash
node --version
npm --version
```

**Should show**: v16.0.0 or higher

**Don't have it?** Download from: https://nodejs.org/
- Click "Download LTS" (recommended)
- Run installer
- Restart your terminal/command prompt

#### 2. Code Editor
**Recommended**: Visual Studio Code
- Download: https://code.visualstudio.com/
- Free and easy to use

#### 3. Accounts (All Free)
- ✅ GitHub account: https://github.com/signup
- ✅ Supabase account: https://supabase.com (sign up with GitHub)
- ✅ Vercel account: https://vercel.com (sign up with GitHub)

#### 4. Terminal/Command Prompt
- **Windows**: PowerShell or Command Prompt
- **Mac**: Terminal
- **Linux**: Terminal

---

## Step 1: Install Dependencies

**Time**: 2-3 minutes

### 1.1 Open Terminal

**Windows**:
- Press `Win + R`
- Type `cmd` or `powershell`
- Press Enter

**Mac/Linux**:
- Press `Cmd + Space`
- Type `terminal`
- Press Enter

### 1.2 Navigate to Project

```bash
cd Desktop/Kiro/payroll-system
```

**Adjust path** based on where your project is located.

### 1.3 Install Packages

```bash
npm install
```

**What you'll see**:
```
npm WARN deprecated ...
added 234 packages in 45s
```

**This installs**:
- React & React DOM
- Vite (build tool)
- Tailwind CSS
- Lucide React (icons)
- Chart.js (charts)
- Supabase client
- All other dependencies

**Troubleshooting**:
- ❌ "npm not found" → Install Node.js (Step 0)
- ❌ "Permission denied" → Run as administrator
- ❌ "Network error" → Check internet connection

---

## Step 2: Create Supabase Account & Project

**Time**: 5 minutes

### 2.1 Go to Supabase

1. Open browser
2. Go to: **https://supabase.com**
3. Click **"Start your project"**

### 2.2 Sign Up

1. Click **"Sign in with GitHub"**
2. Authorize Supabase to access your GitHub
3. You'll be redirected to Supabase dashboard

**Why GitHub?** Makes deployment easier later!

### 2.3 Create New Project

1. Click **"New Project"** (green button)

2. **Select Organization**:
   - If first time: Click "Create a new organization"
   - Name it: "My Projects" or your name
   - Click "Create organization"

3. **Fill Project Details**:

   **Name**: `spectro-payroll`
   
   **Database Password**: 
   - Click "Generate a password"
   - **IMPORTANT**: Copy and save this password!
   - Paste it in a text file (you'll need it later)
   
   **Region**: 
   - Choose closest to you:
     - Philippines: Southeast Asia (Singapore)
     - USA: West US (Oregon) or East US (N. Virginia)
     - Europe: West EU (Ireland)
   
   **Pricing Plan**: Free (default)

4. Click **"Create new project"**

5. **Wait 2 minutes** for setup
   - You'll see: "Setting up project..."
   - Don't close the tab!

**What's happening?**
- Creating PostgreSQL database
- Setting up API endpoints
- Configuring security

---

## Step 3: Setup Database

**Time**: 3 minutes

### 3.1 Open SQL Editor

1. In Supabase dashboard (left sidebar)
2. Click **"SQL Editor"** icon (looks like `</>`)
3. Click **"+ New query"** button

### 3.2 Copy Database Schema

1. Open your project folder
2. Find file: `supabase-schema.sql`
3. Open it with text editor
4. **Select ALL** (Ctrl+A or Cmd+A)
5. **Copy** (Ctrl+C or Cmd+C)

### 3.3 Paste and Run

1. Go back to Supabase SQL Editor
2. **Paste** the SQL code (Ctrl+V or Cmd+V)
3. Click **"Run"** button (or press Ctrl+Enter)

**Success looks like**:
```
✅ Success. No rows returned
```

**What this creates**:
- `employees` table (stores employee data)
- `payroll_records` table (stores payroll history)
- Indexes (makes queries faster)
- Security policies (Row Level Security)
- Triggers (auto-update timestamps)

**Troubleshooting**:
- ❌ "Syntax error" → Make sure you copied ALL the SQL
- ❌ "Permission denied" → Refresh page and try again
- ❌ "Table already exists" → That's okay, it worked!

### 3.4 Verify Tables Created

1. Click **"Table Editor"** (left sidebar)
2. You should see:
   - ✅ `employees` table
   - ✅ `payroll_records` table

---

## Step 4: Get API Credentials

**Time**: 2 minutes

### 4.1 Open Project Settings

1. Click **⚙️ Settings** icon (bottom left)
2. Click **"API"** in the left menu

### 4.2 Copy Project URL

1. Find section: **"Project URL"**
2. You'll see something like:
   ```
   https://abcdefghijklmnop.supabase.co
   ```
3. Click the **copy icon** 📋
4. Paste it in a text file (you'll need it soon)

### 4.3 Copy API Key

1. Scroll down to: **"Project API keys"**
2. Find: **"anon public"** key
3. You'll see a long string starting with `eyJ...`
4. Click the **copy icon** 📋
5. Paste it in a text file

**IMPORTANT**: 
- ✅ Copy the **anon public** key (not service_role)
- ✅ This key is safe to use in frontend
- ✅ Keep your text file open - you'll need these values next!

**Your text file should now have**:
```
Project URL: https://xxxxx.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Step 5: Configure Environment Variables

**Time**: 2 minutes

### 5.1 Create .env File

1. Open your project folder: `payroll-system`
2. Create a new file named: `.env` (exactly, with the dot)

**How to create**:
- **VS Code**: Right-click → New File → name it `.env`
- **Windows**: Right-click → New → Text Document → rename to `.env`
- **Mac**: Terminal → `touch .env`

### 5.2 Add Your Credentials

Open `.env` file and paste:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5.3 Replace with Your Values

**Replace**:
- `https://your-project-id.supabase.co` → Your Project URL from Step 4.2
- `your-anon-key-here` → Your Anon Key from Step 4.3

**Example** (yours will be different):
```bash
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzMjE1MjQwMCwiZXhwIjoxOTQ3NzI4NDAwfQ.abc123xyz
```

### 5.4 Save File

- Press **Ctrl+S** (Windows) or **Cmd+S** (Mac)
- Close the file

**IMPORTANT**:
- ✅ File must be named exactly `.env`
- ✅ Must be in `payroll-system` folder (not in `src`)
- ✅ No quotes around values
- ✅ No spaces around `=`
- ✅ Keep `VITE_` prefix

---

## Step 6: Test Locally

**Time**: 3 minutes

### 6.1 Start Development Server

In your terminal (still in `payroll-system` folder):

```bash
npm run dev
```

**You'll see**:
```
  VITE v5.0.0  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

### 6.2 Open in Browser

1. Open your browser (Chrome, Firefox, Edge, Safari)
2. Go to: **http://localhost:5173**

**What you should see**:
- ✅ Dashboard page loads
- ✅ Purple/blue gradient sidebar
- ✅ 4 stat cards at top
- ✅ Charts appear
- ✅ Table with 4 sample employees

**Loading indicator**: You might see a spinner for 1-2 seconds while data loads.

### 6.3 Test Adding Employee

1. Click **"Employees"** in sidebar
2. Click **"+ Add Employee"** button (top right)
3. Fill in the form:
   - **Full Name**: John Doe
   - **Email**: john@test.com
   - **Position**: Software Engineer
   - **Department**: Engineering
   - **Basic Salary**: 50000
   - **Join Date**: Today's date
   - **SSS**: 2000
   - **PhilHealth**: 1200
   - **Pag-IBIG**: 200
4. Click **"Add Employee"**

**Success**:
- ✅ Modal closes
- ✅ New employee appears in table
- ✅ No error messages

### 6.4 Verify in Supabase

1. Go back to Supabase dashboard
2. Click **"Table Editor"**
3. Click **"employees"** table
4. You should see **John Doe** in the table!

**This confirms**:
- ✅ Frontend connects to Supabase
- ✅ Data saves correctly
- ✅ Everything works!

### 6.5 Stop Development Server

In terminal, press: **Ctrl+C**

---

## Step 7: Create GitHub Repository

**Time**: 2 minutes

### 7.1 Go to GitHub

1. Open browser
2. Go to: **https://github.com/new**
3. Log in if needed

### 7.2 Create Repository

**Repository name**: `spectro-payroll`

**Description**: `Modern payroll management system with React, Supabase, and Vercel`

**Visibility**: 
- ✅ **Public** (recommended - free hosting)
- or **Private** (if you prefer)

**Initialize repository**:
- ❌ **Don't** check "Add a README file"
- ❌ **Don't** add .gitignore
- ❌ **Don't** choose a license

(We already have these files!)

Click **"Create repository"**

### 7.3 Copy Repository URL

You'll see a page with setup instructions.

Find the URL that looks like:
```
https://github.com/YOUR_USERNAME/spectro-payroll.git
```

**Copy this URL** - you'll need it in the next step!

---

## Step 8: Push Code to GitHub

**Time**: 3 minutes

### 8.1 Initialize Git (if not already)

In terminal (in `payroll-system` folder):

```bash
git init
```

**You'll see**:
```
Initialized empty Git repository in ...
```

**Already initialized?** You might see:
```
Reinitialized existing Git repository
```
That's fine!

### 8.2 Add All Files

```bash
git add .
```

**This stages all files** for commit.

**No output** is normal - it worked!

### 8.3 Commit Files

```bash
git commit -m "Initial commit - Spectro Payroll System"
```

**You'll see**:
```
[main abc1234] Initial commit - Spectro Payroll System
 50 files changed, 5000 insertions(+)
 create mode 100644 package.json
 ...
```

### 8.4 Add Remote Repository

Replace `YOUR_USERNAME` with your GitHub username:

```bash
git remote add origin https://github.com/YOUR_USERNAME/spectro-payroll.git
```

**Example**:
```bash
git remote add origin https://github.com/johnsmith/spectro-payroll.git
```

### 8.5 Push to GitHub

```bash
git branch -M main
git push -u origin main
```

**You'll see**:
```
Enumerating objects: 100, done.
Counting objects: 100% (100/100), done.
Writing objects: 100% (100/100), 50 KiB | 5 MiB/s, done.
Total 100 (delta 0), reused 0 (delta 0)
To https://github.com/YOUR_USERNAME/spectro-payroll.git
 * [new branch]      main -> main
```

### 8.6 Verify on GitHub

1. Go to: `https://github.com/YOUR_USERNAME/spectro-payroll`
2. You should see all your files!
3. ✅ README.md
4. ✅ package.json
5. ✅ src/ folder
6. ✅ All documentation files

**Troubleshooting**:
- ❌ "Permission denied" → Check GitHub login
- ❌ "Repository not found" → Check URL is correct
- ❌ "Failed to push" → Make sure repository exists

---

## Step 9: Deploy to Vercel

**Time**: 5 minutes

### 9.1 Go to Vercel

1. Open browser
2. Go to: **https://vercel.com**
3. Click **"Sign Up"** or **"Log In"**

### 9.2 Sign Up with GitHub

1. Click **"Continue with GitHub"**
2. Authorize Vercel to access your GitHub
3. You'll be redirected to Vercel dashboard

### 9.3 Import Project

1. Click **"Add New..."** button (top right)
2. Select **"Project"**
3. You'll see "Import Git Repository"

### 9.4 Find Your Repository

1. Look for **"spectro-payroll"** in the list
2. Click **"Import"** button next to it

**Don't see it?**
- Click "Adjust GitHub App Permissions"
- Grant access to your repository
- Refresh the page

### 9.5 Configure Project

**Framework Preset**: 
- Should auto-detect: **Vite** ✅
- If not, select "Vite" from dropdown

**Root Directory**: 
- Leave as: `./` (default)

**Build and Output Settings**:
- **Build Command**: `npm run build` (auto-filled)
- **Output Directory**: `dist` (auto-filled)
- **Install Command**: `npm install` (auto-filled)

**Don't change these** - they're correct!

### 9.6 Add Environment Variables

**IMPORTANT STEP!**

1. Click **"Environment Variables"** section (expand it)

2. Add **First Variable**:
   - **Name**: `VITE_SUPABASE_URL`
   - **Value**: (paste your Supabase URL from Step 4.2)
   - **Environment**: Check all three boxes:
     - ✅ Production
     - ✅ Preview
     - ✅ Development

3. Click **"Add"**

4. Add **Second Variable**:
   - **Name**: `VITE_SUPABASE_ANON_KEY`
   - **Value**: (paste your Supabase Anon Key from Step 4.3)
   - **Environment**: Check all three boxes:
     - ✅ Production
     - ✅ Preview
     - ✅ Development

5. Click **"Add"**

**You should now see 2 environment variables listed.**

### 9.7 Deploy!

1. Click **"Deploy"** button (bottom)
2. Wait 1-2 minutes

**You'll see**:
- Building... (30 seconds)
- Deploying... (30 seconds)
- 🎉 Congratulations! (success screen)

### 9.8 Get Your Live URL

1. You'll see: **"Visit"** button
2. Your URL will be something like:
   ```
   https://spectro-payroll.vercel.app
   ```
   or
   ```
   https://spectro-payroll-abc123.vercel.app
   ```

3. Click **"Visit"** to see your live site!

---

## Step 10: Test Live Site

**Time**: 3 minutes

### 10.1 Open Your Live Site

Click the **"Visit"** button or go to your Vercel URL.

### 10.2 Verify Dashboard

**You should see**:
- ✅ Dashboard loads
- ✅ Purple/blue gradient design
- ✅ 4 stat cards
- ✅ Charts display
- ✅ Sample employees in table

**Loading**: May take 2-3 seconds on first load.

### 10.3 Test Employee Management

1. Click **"Employees"** in sidebar
2. Click **"+ Add Employee"**
3. Fill in form:
   - **Name**: Jane Smith
   - **Email**: jane@company.com
   - **Position**: Product Manager
   - **Department**: Operations
   - **Salary**: 60000
   - **Join Date**: Today
   - **SSS**: 2200
   - **PhilHealth**: 1300
   - **Pag-IBIG**: 200
4. Click **"Add Employee"**

**Success**:
- ✅ Modal closes
- ✅ Jane Smith appears in table
- ✅ No errors

### 10.4 Test Payroll Page

1. Click **"Payroll"** in sidebar
2. You should see:
   - ✅ All employees listed
   - ✅ Salary breakdown
   - ✅ Deductions (SSS, PhilHealth, Pag-IBIG)
   - ✅ Net pay calculated

### 10.5 Verify in Supabase

1. Go to Supabase dashboard
2. Click **"Table Editor"**
3. Click **"employees"** table
4. You should see **Jane Smith** there!

**This confirms**:
- ✅ Live site works
- ✅ Database connection works
- ✅ Data persists
- ✅ Everything is production-ready!

---

## Step 11: Next Steps

### 🎉 Congratulations! Your System is Live!

**What you've accomplished**:
- ✅ Built a modern payroll system
- ✅ Connected to real database (Supabase)
- ✅ Deployed to the cloud (Vercel)
- ✅ System is accessible 24/7
- ✅ Automatic HTTPS security
- ✅ Global CDN for fast loading

### 📱 Share Your Success

**Your URLs**:
- **Live Site**: https://your-project.vercel.app
- **GitHub**: https://github.com/YOUR_USERNAME/spectro-payroll
- **Supabase**: https://app.supabase.com/project/your-project-id

### 🔄 Making Updates

After initial deployment, updates are automatic:

```bash
# 1. Make changes to your code
# 2. Commit and push
git add .
git commit -m "Add new feature"
git push

# 3. Vercel automatically deploys! ✨
```

### 🎯 What to Do Next

#### Immediate Actions:
1. ✅ Add your real employees
2. ✅ Process your first payroll
3. ✅ Bookmark your live URL
4. ✅ Share with your team

#### Optional Enhancements:
1. **Custom Domain**:
   - Go to Vercel → Settings → Domains
   - Add your domain (e.g., payroll.yourcompany.com)

2. **Enable Analytics**:
   - Go to Vercel → Analytics
   - Enable Web Analytics (free)

3. **Add Authentication**:
   - Use Supabase Auth
   - Protect your data
   - User management

4. **Customize Branding**:
   - Change colors in `tailwind.config.js`
   - Update logo in `Sidebar.jsx`
   - Modify company name

5. **Add More Features**:
   - PDF export for payslips
   - Email notifications
   - Advanced reports
   - Attendance tracking

### 📚 Documentation

**Reference Guides**:
- `README.md` - Project overview
- `PROJECT_SUMMARY.md` - Technical details
- `SUPABASE_SETUP.md` - Database help
- `VERCEL_DEPLOY.md` - Deployment help

**External Resources**:
- Supabase Docs: https://supabase.com/docs
- Vercel Docs: https://vercel.com/docs
- React Docs: https://react.dev
- Tailwind Docs: https://tailwindcss.com

### 💰 Cost Tracking

**Current Cost**: $0/month

**Free Tier Limits**:
- Vercel: 100GB bandwidth/month
- Supabase: 500MB database, 50K users/month

**When to Upgrade**:
- Vercel Pro ($20/mo): If you exceed 100GB bandwidth
- Supabase Pro ($25/mo): If you need >500MB database

**For most small businesses, free tier is enough!**

### 🆘 Need Help?

**Common Issues**:
1. **Build Failed**: Check environment variables in Vercel
2. **Data Not Loading**: Verify Supabase credentials
3. **404 Error**: Check `vercel.json` exists
4. **Slow Loading**: Normal on first visit (cold start)

**Get Support**:
- Check documentation files
- Review browser console (F12)
- Check Supabase logs
- Check Vercel deployment logs
- Create GitHub issue

### 🎊 You Did It!

You've successfully:
- ✅ Built a production-ready system
- ✅ Learned React, Supabase, and Vercel
- ✅ Deployed to the cloud
- ✅ Created something valuable

**Your payroll system is now**:
- 🌍 Live on the internet
- 🔒 Secure (HTTPS)
- ⚡ Fast (Global CDN)
- 💾 Persistent (Real database)
- 💰 Free (No monthly costs)

---

## 📊 Quick Reference

### Important URLs
```
Live Site:    https://your-project.vercel.app
GitHub:       https://github.com/YOUR_USERNAME/spectro-payroll
Supabase:     https://app.supabase.com
Vercel:       https://vercel.com/dashboard
```

### Important Commands
```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Build for production
npm run build

# Push to GitHub
git add .
git commit -m "message"
git push
```

### Important Files
```
.env                    - Your credentials (never commit!)
package.json            - Dependencies
supabase-schema.sql     - Database structure
src/lib/supabase.js     - Database connection
vercel.json             - Deployment config
```

---

**🎉 Congratulations on completing the setup!**

**Built with ❤️ using React, Supabase, and Vercel**

Questions? Check the documentation files or create a GitHub issue.

Happy payroll processing! 💰
