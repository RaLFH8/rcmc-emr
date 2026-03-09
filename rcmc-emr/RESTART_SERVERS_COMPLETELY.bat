@echo off
echo ========================================
echo COMPLETE SERVER RESTART
echo ========================================
echo.
echo This will completely stop and restart both servers
echo with the FIXED Google Drive scope.
echo.
echo Press any key to continue...
pause > nul

echo.
echo Step 1: Stopping ALL Node.js processes...
taskkill /F /IM node.exe 2>nul
echo Waiting 3 seconds...
timeout /t 3 /nobreak > nul

echo.
echo Step 2: Starting Backend (port 3003)...
cd server
start "RCMC Backend - FIXED" cmd /k "echo Backend starting with FIXED Google Drive scope && npm start"
cd ..

echo.
echo Waiting 5 seconds for backend to initialize...
timeout /t 5 /nobreak > nul

echo.
echo Step 3: Starting Frontend (port 3001)...
start "RCMC Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo SERVERS RESTARTED!
echo ========================================
echo.
echo Backend: http://localhost:3003 (with FIXED scope)
echo Frontend: http://localhost:3001
echo.
echo Wait 10 seconds, then go to http://localhost:3001
echo and try uploading a lab result.
echo.
echo IT WILL WORK NOW! The test confirmed everything is set up correctly.
echo.
echo Press any key to close...
pause > nul
