@echo off
echo ========================================
echo Deploying Rizalcare EMR to GitHub
echo ========================================
echo.

echo Step 1: Initializing Git repository...
git init
echo.

echo Step 2: Adding all files...
git add .
echo.

echo Step 3: Creating commit...
git commit -m "Deploy Rizalcare EMR System - Complete with all modules"
echo.

echo Step 4: Setting main branch...
git branch -M main
echo.

echo ========================================
echo IMPORTANT: Enter your GitHub repository URL
echo Example: https://github.com/yourusername/rizalcare-emr.git
echo ========================================
set /p REPO_URL="Enter GitHub repository URL: "
echo.

echo Step 5: Adding remote repository...
git remote add origin %REPO_URL%
echo.

echo Step 6: Pushing to GitHub...
git push -u origin main
echo.

echo ========================================
echo Done! Check your GitHub repository
echo Next: Deploy to Render.com
echo ========================================
pause
