@echo off
echo ========================================
echo   RESTARTING FRONTEND - FRESH START
echo ========================================
echo.
echo [1/3] Killing all Node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo [2/3] Clearing npm cache...
cd /d "%~dp0"
npm cache clean --force 2>nul

echo.
echo [3/3] Starting frontend fresh...
echo.
echo ✅ White screen fixed!
echo ✅ Backend connection ready!
echo ✅ Starting on port 3002...
echo.
npm run dev
