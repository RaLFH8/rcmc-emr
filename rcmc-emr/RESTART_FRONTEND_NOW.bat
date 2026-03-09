@echo off
color 0A
cls
echo.
echo ========================================
echo    RESTARTING RCMC EMR FRONTEND
echo ========================================
echo.
echo Stopping any running servers...
echo.

REM Kill any Node processes on port 3001 and 5173
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo Starting frontend server...
echo ========================================
echo.
echo Server will start on: http://localhost:3001
echo.
echo Press Ctrl+C to stop the server
echo.
echo ========================================
echo.

cd /d "%~dp0"
npm run dev

pause
