# Deploy Rizalcare EMR Online - Complete Guide

## Option 1: Deploy to Render.com (Recommended - FREE)

### Step 1: Install Git (Required)
1. Download Git from: https://git-scm.com/download/win
2. Run the installer with default settings
3. Restart your computer
4. Open Command Prompt and verify: `git --version`

### Step 2: Create GitHub Account & Repository
1. Go to https://github.com and create a free account
2. Click "New Repository" (green button)
3. Repository name: `rizalcare-emr`
4. Description: "Rizalcare Medical Clinic EMR System"
5. Select "Public"
6. Click "Create repository"

### Step 3: Push Code to GitHub
Open Command Prompt in your project folder (C:\Users\ralfh\Desktop\Kiro) and run:

```cmd
git init
git add .
git commit -m "Initial commit - Rizalcare EMR System"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/rizalcare-emr.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

### Step 4: Deploy to Render.com
1. Go to https://render.com and sign up (use your GitHub account)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository: `rizalcare-emr`
4. Configure:
   - **Name**: rizalcare-emr
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free
5. Click "Create Web Service"
6. Wait 5-10 minutes for deployment
7. Your app will be live at: `https://rizalcare-emr.onrender.com`

### Step 5: Important Notes
- Free tier sleeps after 15 minutes of inactivity
- First load after sleep takes 30-60 seconds
- Database file (rizalcare.db) persists on Render
- SSL/HTTPS is automatic

---

## Option 2: Deploy to Railway.app (Alternative - FREE)

### Steps:
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your `rizalcare-emr` repository
5. Railway auto-detects Node.js and deploys
6. Your app will be live at: `https://rizalcare-emr.up.railway.app`

---

## Option 3: Deploy to Vercel (Alternative)

### Steps:
1. Go to https://vercel.com
2. Sign up with GitHub
3. Click "Add New" → "Project"
4. Import your `rizalcare-emr` repository
5. Configure:
   - Framework Preset: Other
   - Build Command: `npm install`
   - Output Directory: (leave empty)
6. Click "Deploy"

---

## Option 4: Use Ngrok (Quick Test - Temporary URL)

If you just want to test online access quickly:

### Steps:
1. Download ngrok: https://ngrok.com/download
2. Extract ngrok.exe to your project folder
3. Run in Command Prompt:
   ```cmd
   ngrok http 54323
   ```
4. Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
5. Share this URL with your staff
6. **Note**: URL changes every time you restart ngrok

---

## Troubleshooting

### Git Not Installed
- Download from: https://git-scm.com/download/win
- Install with default settings
- Restart computer

### GitHub Push Failed
- Make sure you're logged into GitHub
- Use Personal Access Token instead of password
- Generate token at: https://github.com/settings/tokens

### Render Deployment Failed
- Check build logs in Render dashboard
- Ensure package.json is in root folder
- Verify Node.js version compatibility

### Database Issues
- SQLite database persists on Render
- To reset database, delete rizalcare.db and redeploy
- Backup database regularly

---

## Security Recommendations for Production

1. **Change Default Passwords**
   - Update admin/admin123 to strong password
   - Update all default user passwords

2. **Add Environment Variables**
   - Store sensitive data in Render environment variables
   - Never commit passwords to GitHub

3. **Enable HTTPS Only**
   - Render provides free SSL automatically
   - Force HTTPS in production

4. **Regular Backups**
   - Download rizalcare.db regularly
   - Store backups securely

5. **Access Control**
   - Limit who can access the admin panel
   - Monitor user activity logs

---

## Next Steps After Deployment

1. Test all features online
2. Change default passwords
3. Register real doctors and staff
4. Import patient data (if migrating)
5. Train staff on the system
6. Set up regular database backups

---

## Support

If you encounter issues:
1. Check Render deployment logs
2. Verify all files are pushed to GitHub
3. Ensure package.json has all dependencies
4. Check Node.js version compatibility

Your Rizalcare EMR System is ready to go online! 🚀
