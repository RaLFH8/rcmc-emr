@echo off
echo ========================================
echo   Opening SMS Setup Documentation
echo ========================================
echo.

echo Opening Visual Setup Guide...
start "" "SMS_VISUAL_SETUP.html"
timeout /t 2 /nobreak >nul

echo Opening Quick Start Guide...
start "" "SMS_QUICK_START.txt"
timeout /t 2 /nobreak >nul

echo Opening Complete Setup Guide...
start "" "HTTP_SMS_SETUP_GUIDE.md"
timeout /t 2 /nobreak >nul

echo Opening Summary...
start "" "SMS_SETUP_COMPLETE.md"
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo   All guides opened!
echo ========================================
echo.
echo RECOMMENDED: Start with the Visual Guide (HTML)
echo.
echo NEXT STEPS:
echo 1. Read SMS_QUICK_START.txt first
echo 2. Install HTTP SMS app on your phone
echo 3. Update .env file with your phone's IP
echo 4. Restart dev server: npm run dev
echo.
echo If you have issues, read:
echo - SMS_TROUBLESHOOTING.md
echo.
echo For other SMS options, read:
echo - SMS_GATEWAY_ALTERNATIVES.md
echo.
pause
