@echo off
echo ========================================
echo RCMC EMR - Installing Required Packages
echo ========================================
echo.
echo Installing xlsx and recharts...
echo.

cd /d "%~dp0"
call npm install xlsx recharts

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Packages installed:
echo - xlsx (Excel export)
echo - recharts (Charts for reports)
echo.
echo You can now run the system with:
echo npm run dev
echo.
pause
