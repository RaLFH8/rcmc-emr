@echo off
echo ========================================
echo   RCMC EMR - Starting All Servers
echo ========================================
echo.
echo This will open TWO windows:
echo   1. Frontend (port 3002)
echo   2. Backend API (port 3003)
echo.
echo Press any key to continue...
pause >nul

echo.
echo Starting Backend API Server...
start "RCMC Backend API" cmd /k "cd server && npm start"

timeout /t 3 >nul

echo Starting Frontend Server...
start "RCMC Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo   Both servers are starting!
echo ========================================
echo.
echo Frontend: http://localhost:3002
echo Backend:  http://localhost:3003
echo.
echo Close this window when done.
pause
