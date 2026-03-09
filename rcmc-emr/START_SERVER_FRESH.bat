@echo off
echo ========================================
echo   RCMC EMR - Starting Development Server
echo ========================================
echo.
echo Port: 3001
echo URL: http://localhost:3001
echo Test booking at: http://localhost:3001/book
echo.
cd /d "%~dp0"
call npm run dev
