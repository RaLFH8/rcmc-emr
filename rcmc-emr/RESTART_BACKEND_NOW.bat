@echo off
echo ========================================
echo RESTARTING BACKEND SERVER
echo ========================================
echo.
echo This will:
echo 1. Stop the current backend server
echo 2. Start it again with the updated Google Drive scope
echo.
echo Press any key to restart...
pause > nul

echo.
echo Stopping backend...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak > nul

echo.
echo Starting backend with updated configuration...
cd server
start cmd /k "npm start"

echo.
echo ========================================
echo BACKEND RESTARTED!
echo ========================================
echo.
echo The backend is now running with the correct Google Drive permissions.
echo.
echo NEXT STEP:
echo Go to http://localhost:3001 and try uploading a lab result again!
echo.
echo Press any key to close this window...
pause > nul
