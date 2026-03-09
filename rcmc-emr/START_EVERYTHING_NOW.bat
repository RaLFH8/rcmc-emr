@echo off
echo ========================================
echo STARTING RCMC EMR SYSTEM
echo ========================================
echo.
echo This will start:
echo 1. Backend API (port 3003) - with FIXED Google Drive scope
echo 2. Frontend App (port 3001)
echo.
echo Press any key to start...
pause > nul

echo.
echo Stopping any running servers...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak > nul

echo.
echo Starting Backend API on port 3003...
cd server
start "RCMC Backend API" cmd /k "npm start"
cd ..

echo.
echo Waiting 3 seconds for backend to initialize...
timeout /t 3 /nobreak > nul

echo.
echo Starting Frontend on port 3001...
start "RCMC Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo BOTH SERVERS STARTED!
echo ========================================
echo.
echo Backend API: http://localhost:3003
echo Frontend App: http://localhost:3001
echo.
echo Wait 10 seconds for both servers to fully start,
echo then open: http://localhost:3001
echo.
echo The Google Drive scope has been fixed!
echo You can now upload lab results successfully.
echo.
echo Press any key to close this window...
pause > nul
