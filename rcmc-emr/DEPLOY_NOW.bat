@echo off
echo ========================================
echo RCMC-EMR Cloudflare Deployment Script
echo ========================================
echo.

echo Step 1: Building production version...
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed! Fix errors and try again.
    pause
    exit /b 1
)
echo ✓ Build successful!
echo.

echo Step 2: Initializing Git repository...
git init
if errorlevel 1 (
    echo Git already initialized
)
echo ✓ Git ready!
echo.

echo Step 3: Adding files to Git...
git add .
echo ✓ Files added!
echo.

echo Step 4: Creating commit...
git commit -m "Deploy RCMC-EMR to Cloudflare Pages"
echo ✓ Commit created!
echo.

echo ========================================
echo NEXT STEPS:
echo ========================================
echo.
echo 1. Create a GitHub repository:
echo    - Go to: https://github.com/new
echo    - Name: rcmc-emr
echo    - Make it PRIVATE (recommended)
echo.
echo 2. Copy this command and run it (replace YOUR_USERNAME):
echo    git remote add origin https://github.com/YOUR_USERNAME/rcmc-emr.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo 3. Deploy to Cloudflare:
echo    - Go to: https://dash.cloudflare.com/
echo    - Click "Pages" → "Create a project"
echo    - Connect your GitHub repository
echo    - Use these settings:
echo      * Build command: npm run build
echo      * Build output: dist
echo      * Add environment variables from .env file
echo.
echo 4. Your site will be live at:
echo    https://rcmc-emr.pages.dev
echo.
echo ========================================
echo Read DEPLOY_TO_CLOUDFLARE.md for detailed instructions
echo ========================================
echo.
pause
