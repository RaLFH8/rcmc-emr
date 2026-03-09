@echo off
echo ========================================
echo STARTING RCMC EMR SYSTEM
echo ========================================
echo.
echo This will open TWO terminal windows:
echo 1. Frontend (Website) - Port 3001
echo 2. Backend (API) - Port 3003
echo.
echo KEEP BOTH WINDOWS OPEN!
echo ========================================
echo.

REM Kill any existing processes on these ports
echo Cleaning up old processes...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3003') do taskkill /F /PID %%a 2>nul

echo.
echo Starting Backend API Server (Port 3003)...
start "RCMC Backend API - Port 3003" cmd /k "cd server && npm start"

timeout /t 3 /nobreak >nul

echo Starting Frontend Website (Port 3001)...
start "RCMC Frontend - Port 3001" cmd /k "npm run dev"

echo.
echo ========================================
echo ✅ BOTH SERVERS STARTING!
echo ========================================
echo.
echo Wait 10 seconds, then open in browser:
echo http://localhost:3001
echo.
echo Login: admin@rcmc.com / Admin123!
echo.
echo DO NOT CLOSE THE TWO TERMINAL WINDOWS!
echo ========================================
pause
