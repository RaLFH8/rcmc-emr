# Deploy RCMC EMR to Cloudflare Pages

## Prerequisites

- Cloudflare account (free)
- Git repository (GitHub, GitLab, or Bitbucket)
- Supabase project set up

## Method 1: Cloudflare Dashboard (Easiest)

### Step 1: Push to Git

```cmd
cd C:\Users\ralfh\Desktop\Kiro\rcmc-emr
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/rcmc-emr.git
git push -u origin main
```

### Step 2: Connect to Cloudflare

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Click "Pages" in the left sidebar
3. Click "Create a project"
4. Click "Connect to Git"
5. Authorize Cloudflare to access your Git provider
6. Select your `rcmc-emr` repository

### Step 3: Configure Build Settings

- **Project name**: `rcmc-emr`
- **Production branch**: `main`
- **Framework preset**: None (or Vite)
- **Build command**: `npm run build`
- **Build output directory**: `dist`

### Step 4: Add Environment Variables

Click "Environment variables" and add:

| Variable Name | Value |
|--------------|-------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |

### Step 5: Deploy

1. Click "Save and Deploy"
2. Wait 2-3 minutes for build to complete
3. Your site will be live at `https://rcmc-emr.pages.dev`

### Step 6: Custom Domain (Optional)

1. Go to your project settings
2. Click "Custom domains"
3. Click "Set up a custom domain"
4. Enter your domain (e.g., `emr.rcmc.com`)
5. Follow DNS configuration instructions

## Method 2: Wrangler CLI

### Step 1: Install Wrangler

```cmd
npm install -g wrangler
```

### Step 2: Login to Cloudflare

```cmd
wrangler login
```

This will open a browser window to authorize.

### Step 3: Build the Project

```cmd
npm run build
```

### Step 4: Deploy

```cmd
wrangler pages publish dist --project-name=rcmc-emr
```

### Step 5: Set Environment Variables

```cmd
wrangler pages secret put VITE_SUPABASE_URL
wrangler pages secret put VITE_SUPABASE_ANON_KEY
```

## Method 3: Direct Upload (No Git)

### Step 1: Build the Project

```cmd
npm run build
```

### Step 2: Upload to Cloudflare

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Click "Pages"
3. Click "Create a project"
4. Click "Upload assets"
5. Drag and drop the `dist` folder
6. Click "Deploy site"

### Step 3: Add Environment Variables

1. Go to project settings
2. Click "Environment variables"
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
4. Redeploy the site

## Automatic Deployments

Once connected to Git, Cloudflare will automatically deploy:
- **Production**: When you push to `main` branch
- **Preview**: When you create a pull request

## Update Deployment

### Via Git (Automatic)

```cmd
git add .
git commit -m "Update dashboard"
git push
```

Cloudflare will automatically rebuild and deploy.

### Via Wrangler CLI

```cmd
npm run build
wrangler pages publish dist --project-name=rcmc-emr
```

## Rollback to Previous Version

1. Go to Cloudflare Dashboard → Pages → Your Project
2. Click "Deployments"
3. Find the deployment you want to rollback to
4. Click "..." → "Rollback to this deployment"

## Custom Domain Setup

### Step 1: Add Domain to Cloudflare

1. Go to Cloudflare Dashboard
2. Click "Add a site"
3. Enter your domain (e.g., `rcmc.com`)
4. Follow nameserver setup instructions

### Step 2: Add Custom Domain to Pages

1. Go to your Pages project
2. Click "Custom domains"
3. Click "Set up a custom domain"
4. Enter subdomain (e.g., `emr.rcmc.com`)
5. Cloudflare will automatically configure DNS

### Step 3: Enable HTTPS

Cloudflare automatically provisions SSL certificates. Your site will be available at:
- `https://emr.rcmc.com`

## Performance Optimization

Cloudflare Pages includes:
- ✅ Global CDN (200+ locations)
- ✅ Automatic HTTPS
- ✅ HTTP/2 and HTTP/3
- ✅ Brotli compression
- ✅ DDoS protection
- ✅ Web Application Firewall (WAF)

## Monitoring

### View Analytics

1. Go to your Pages project
2. Click "Analytics"
3. View:
   - Page views
   - Unique visitors
   - Bandwidth usage
   - Top pages
   - Geographic distribution

### View Build Logs

1. Go to "Deployments"
2. Click on a deployment
3. View build logs and errors

## Troubleshooting

### Build Failed

**Check build logs**:
1. Go to Deployments
2. Click on failed deployment
3. View logs for errors

**Common issues**:
- Missing dependencies: Run `npm install` locally first
- Environment variables not set
- Build command incorrect

### Site Not Loading

**Check**:
1. Deployment status (should be "Success")
2. Environment variables are set
3. Supabase URL is correct
4. Browser console for errors

### Environment Variables Not Working

**Solution**:
1. Make sure variable names start with `VITE_`
2. Redeploy after adding variables
3. Clear browser cache

## Cost

Cloudflare Pages is **100% FREE** for:
- Unlimited sites
- Unlimited requests
- Unlimited bandwidth
- 500 builds per month
- 1 concurrent build

Perfect for RCMC EMR! 🎉

## Support

- Cloudflare Docs: [developers.cloudflare.com/pages](https://developers.cloudflare.com/pages)
- Community: [community.cloudflare.com](https://community.cloudflare.com)

---

**Your RCMC EMR will be live at**: `https://rcmc-emr.pages.dev`
