@echo off
cls
echo ========================================
echo   BROWSER CACHE FIX
echo ========================================
echo.
echo Your code is CORRECT!
echo The issue is browser cache.
echo.
echo Opening booking page in 3 seconds...
echo.
echo IMPORTANT: When the page opens, press:
echo   Ctrl + Shift + R (Windows/Linux)
echo   Cmd + Shift + R (Mac)
echo.
timeout /t 3 /nobreak >nul
start http://localhost:3001/#/book
echo.
echo Page opened! Now press Ctrl + Shift + R to hard refresh.
echo.
echo After hard refresh, check the console (F12).
echo You should see: patient_contact: "09171234567"
echo.
pause
