@echo off
echo ========================================
echo STARTING BACKEND SERVER (FIXED VERSION)
echo ========================================
echo.
echo Stopping any running backend...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak > nul

echo.
echo Starting backend from correct directory...
cd server
start cmd /k "npm start"

echo.
echo ========================================
echo BACKEND STARTED!
echo ========================================
echo.
echo Backend is running on http://localhost:3003
echo.
echo The Google Drive scope has been fixed to allow access to shared folders.
echo.
echo NEXT STEP:
echo Go to http://localhost:3001 and try uploading a lab result!
echo.
echo Press any key to close this window...
pause > nul
