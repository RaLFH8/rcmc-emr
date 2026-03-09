@echo off
echo ========================================
echo   Restarting Frontend Server
echo ========================================
echo.
echo Stopping any running servers on port 3002...
echo.

REM Kill any process using port 3002
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3002" ^| find "LISTENING"') do taskkill /F /PID %%a 2>nul

timeout /t 2 >nul

echo.
echo Starting frontend server...
echo.
npm run dev
