@echo off
echo ========================================
echo  Pushing Rizalcare EMR to GitHub
echo ========================================
echo.

cd /d "%~dp0"

echo Step 1: Adding all files...
git add .

echo.
echo Step 2: Committing changes...
git commit -m "Deploy Rizalcare EMR - All files"

echo.
echo Step 3: Pushing to GitHub...
git push origin main

echo.
echo ========================================
echo  Done! Check GitHub to verify files
echo ========================================
echo.
pause
