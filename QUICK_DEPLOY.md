# Quick Deploy to Online - 5 Steps

## Step 1: Install Git (5 minutes)
1. Download: https://git-scm.com/download/win
2. Install with default settings
3. Restart computer

## Step 2: Create GitHub Account (2 minutes)
1. Go to: https://github.com
2. Sign up for free account
3. Verify your email

## Step 3: Create Repository (1 minute)
1. Click "New Repository" button
2. Name: `rizalcare-emr`
3. Select "Public"
4. Click "Create repository"
5. Copy the repository URL (e.g., https://github.com/yourusername/rizalcare-emr.git)

## Step 4: Push Code to GitHub (2 minutes)
1. Double-click `DEPLOY_TO_GITHUB.bat` in your project folder
2. When prompted, paste your GitHub repository URL
3. Wait for upload to complete

## Step 5: Deploy to Render.com (5 minutes)
1. Go to: https://render.com
2. Sign up using your GitHub account
3. Click "New +" → "Web Service"
4. Select your `rizalcare-emr` repository
5. Configure:
   - **Name**: rizalcare-emr
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free
6. Click "Create Web Service"
7. Wait 5-10 minutes for deployment

## Done! 🎉

Your EMR system will be live at:
```
https://rizalcare-emr.onrender.com
```

### Important Notes:
- Free tier sleeps after 15 minutes of inactivity
- First load after sleep takes 30-60 seconds
- Change default passwords after deployment
- SSL/HTTPS is automatic

### Troubleshooting:
- If Git is not recognized, restart your computer after installation
- If GitHub push fails, make sure you're logged into GitHub
- If Render deployment fails, check the build logs in Render dashboard

Need help? Check `ONLINE_DEPLOYMENT_GUIDE.md` for detailed instructions.
