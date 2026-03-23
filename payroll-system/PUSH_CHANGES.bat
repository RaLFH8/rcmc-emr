@echo off
echo ========================================
echo  Push Payroll System Changes to GitHub
echo ========================================
echo.

cd /d "%~dp0"

echo Adding all changes...
git add .

echo.
echo Committing changes...
git commit -m "Add SSS Salary field for separate SSS contribution calculation"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo ========================================
echo  Done! Changes pushed to GitHub
echo ========================================
echo.
pause
