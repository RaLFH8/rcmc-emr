@echo off
echo ========================================
echo   RESTARTING RCMC EMR SYSTEM
echo ========================================
echo.

cd rcmc-emr

echo [1/3] Stopping any running processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo [2/3] Starting development server...
echo.
start cmd /k "npm run dev"

echo.
echo [3/3] Waiting for server to start...
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo   SERVER RESTARTED!
echo ========================================
echo.
echo Your EMR is now running at:
echo http://localhost:5173
echo.
echo IMPORTANT: Clear browser cache before testing!
echo - Press Ctrl+Shift+N (Incognito mode)
echo - OR Press Ctrl+Shift+Delete (Clear cache)
echo.
echo Test the SOAP Note workflow:
echo 1. Go to Appointments page
echo 2. Switch to "Patient Queue" view
echo 3. Click "Start Consultation"
echo 4. Fill SOAP note (S.O.A.P)
echo 5. Click "Complete" to review
echo.
pause
