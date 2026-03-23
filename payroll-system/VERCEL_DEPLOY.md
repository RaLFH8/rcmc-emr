# Vercel Deployment Guide

Deploy your Spectro Payroll System to Vercel for free hosting!

## Prerequisites

- ✅ Supabase project set up (see SUPABASE_SETUP.md)
- ✅ GitHub account
- ✅ Code pushed to GitHub repository

## Step 1: Push to GitHub

If you haven't already:

```bash
cd payroll-system
git init
git add .
git commit -m "Initial commit - Spectro Payroll System"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/payroll-system.git
git push -u origin main
```

## Step 2: Deploy to Vercel

### Option A: Using Vercel Dashboard (Recommended)

1. Go to [https://vercel.com](https://vercel.com)
2. Sign up or log in (use GitHub account)
3. Click "Add New..." → "Project"
4. Import your GitHub repository
5. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (or `payroll-system` if it's in a subfolder)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

6. Add Environment Variables:
   - Click "Environment Variables"
   - Add these two variables:
     ```
     VITE_SUPABASE_URL = https://your-project.supabase.co
     VITE_SUPABASE_ANON_KEY = your-anon-key-here
     ```
   - Get these from your Supabase dashboard (Project Settings → API)

7. Click "Deploy"
8. Wait 1-2 minutes for deployment to complete
9. Your app will be live at: `https://your-project.vercel.app`

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts and add environment variables when asked
```

## Step 3: Configure Environment Variables (if not done in Step 2)

1. Go to your project in Vercel dashboard
2. Click "Settings" → "Environment Variables"
3. Add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Click "Save"
5. Redeploy: Go to "Deployments" → Click "..." → "Redeploy"

## Step 4: Test Your Deployment

1. Visit your Vercel URL
2. Dashboard should load with sample employees
3. Try adding a new employee
4. Check Supabase Table Editor to verify data was saved

## Custom Domain (Optional)

1. In Vercel dashboard, go to "Settings" → "Domains"
2. Add your custom domain
3. Follow DNS configuration instructions
4. Wait for DNS propagation (5-30 minutes)

## Automatic Deployments

Vercel automatically deploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push

# Vercel automatically deploys!
```

## Troubleshooting

### Build Failed
- Check that `package.json` has all dependencies
- Verify build command is `npm run build`
- Check build logs in Vercel dashboard

### Environment Variables Not Working
- Make sure variable names start with `VITE_`
- Redeploy after adding variables
- Check they're set for "Production" environment

### 404 on Refresh
- Vercel should handle this automatically with Vite
- If issues persist, add `vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Data Not Loading
- Check browser console for errors
- Verify Supabase URL and key are correct
- Test Supabase connection directly

## Performance Tips

1. **Enable Caching**: Vercel does this automatically
2. **Use Edge Functions**: For future API routes
3. **Monitor Analytics**: Check Vercel Analytics tab
4. **Optimize Images**: Use Vercel Image Optimization

## Costs

- **Vercel Free Tier**:
  - Unlimited deployments
  - 100GB bandwidth/month
  - Automatic HTTPS
  - Perfect for this project!

- **Supabase Free Tier**:
  - 500MB database
  - 1GB file storage
  - 50,000 monthly active users
  - More than enough!

## Your Live URLs

After deployment, you'll have:
- **Production**: `https://your-project.vercel.app`
- **Preview**: Automatic preview URLs for each commit
- **Custom Domain**: (if configured)

## Next Steps

1. Share your live URL! 🎉
2. Monitor usage in Vercel Analytics
3. Check Supabase database growth
4. Add more features (authentication, reports, etc.)

## Support

- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- GitHub Issues: Create issues in your repo

Congratulations! Your Spectro Payroll System is now live! 🚀
