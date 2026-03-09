@echo off
echo ========================================
echo   RCMC EMR - Restarting Development Server
echo ========================================
echo.
echo Stopping any existing servers on port 3001...
echo.

REM Kill any process using port 3001
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001" ^| find "LISTENING"') do taskkill /F /PID %%a 2>nul

echo.
echo Starting development server...
echo.
echo Server will be available at: http://localhost:3001
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

npm run dev

pause
