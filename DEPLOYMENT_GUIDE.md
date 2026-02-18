# 🚀 Deploy Rizalcare EMR to Render.com (FREE)

## Step 1: Create GitHub Account (if you don't have one)

1. Go to https://github.com
2. Click "Sign up"
3. Follow the registration process
4. Verify your email

---

## Step 2: Upload Your Code to GitHub

### Option A: Using GitHub Desktop (Easiest)

1. **Download GitHub Desktop:**
   - Go to https://desktop.github.com/
   - Download and install

2. **Create Repository:**
   - Open GitHub Desktop
   - Click "File" → "New Repository"
   - Name: `rizalcare-emr`
   - Local Path: Choose your project folder `C:\Users\ralfh\Desktop\Kiro`
   - Click "Create Repository"

3. **Commit Files:**
   - You'll see all your files listed
   - Add commit message: "Initial commit - Rizalcare EMR"
   - Click "Commit to main"

4. **Publish to GitHub:**
   - Click "Publish repository"
   - Uncheck "Keep this code private" (or keep it private, your choice)
   - Click "Publish repository"

### Option B: Using Git Command Line

```bash
cd C:\Users\ralfh\Desktop\Kiro
git init
git add .
git commit -m "Initial commit - Rizalcare EMR"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/rizalcare-emr.git
git push -u origin main
```

---

## Step 3: Deploy to Render.com

1. **Create Render Account:**
   - Go to https://render.com
   - Click "Get Started"
   - Sign up with GitHub (easiest)
   - Authorize Render to access your GitHub

2. **Create New Web Service:**
   - Click "New +" button
   - Select "Web Service"
   - Connect your GitHub repository: `rizalcare-emr`
   - Click "Connect"

3. **Configure Service:**
   - **Name:** `rizalcare-emr` (or your clinic name)
   - **Region:** Singapore (closest to Philippines)
   - **Branch:** main
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free

4. **Deploy:**
   - Click "Create Web Service"
   - Wait 3-5 minutes for deployment
   - You'll get a URL like: `https://rizalcare-emr.onrender.com`

---

## Step 4: Test Your Deployed System

1. **Open the URL** Render gives you
2. **Login:** admin / admin123
3. **Test:**
   - Register a patient
   - Add a doctor
   - Add an item
4. **Share URL with staff!**

---

## 🎯 Your System is Now Online!

### What You Get (FREE):
- ✅ Public URL accessible from anywhere
- ✅ Automatic HTTPS (secure)
- ✅ 750 hours/month free (enough for small clinic)
- ✅ Automatic restarts if it crashes
- ✅ Easy updates (just push to GitHub)

### Important Notes:

**Free Tier Limitations:**
- Sleeps after 15 minutes of inactivity
- Takes ~30 seconds to wake up on first access
- Database resets if you don't use persistent storage

**To Keep Database Persistent:**
After deployment, I'll help you add persistent storage (also free).

---

## 🔄 How to Update Your System

When I add new features (consultation module, enhanced dashboard):

1. **I'll update the files**
2. **You commit to GitHub:**
   ```bash
   git add .
   git commit -m "Added consultation module"
   git push
   ```
3. **Render auto-deploys** (takes 2-3 minutes)
4. **Your staff sees the updates!**

---

## 💾 Add Persistent Database (After Deployment)

The free tier database resets on restart. To keep data:

1. **In Render Dashboard:**
   - Go to your web service
   - Click "Environment"
   - Add environment variable:
     - Key: `DATABASE_URL`
     - Value: (I'll provide after we set up storage)

2. **Or upgrade to paid:**
   - $7/month for always-on service
   - Includes persistent disk storage

---

## 📱 Share with Your Staff

Once deployed, share:
- **URL:** https://your-app-name.onrender.com
- **Login Credentials:**
  - Admin: admin / admin123
  - Doctor: doctor1 / doc123
  - Reception: reception / rec123

**Tell them:**
- First access might take 30 seconds (waking up)
- Bookmark the URL
- Works on phone, tablet, computer

---

## ⚠️ Troubleshooting

### Deployment Failed?
- Check build logs in Render dashboard
- Make sure all files are committed to GitHub
- Verify package.json is correct

### Can't Access URL?
- Wait 5 minutes after deployment
- Try incognito mode
- Check Render dashboard for errors

### Database Not Saving?
- This is normal on free tier
- Data persists during active use
- Resets after long inactivity
- Upgrade to paid for persistence

---

## 🎉 Next Steps

After deployment:
1. ✅ Test with your staff
2. ✅ I'll add consultation module
3. ✅ I'll enhance dashboard
4. ✅ I'll add reports

All updates will auto-deploy when pushed to GitHub!

---

## Need Help?

If you get stuck at any step, let me know and I'll guide you through it!

**Ready to deploy? Follow Step 1!**
