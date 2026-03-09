@echo off
color 0A
cls
echo ========================================
echo   RCMC EMR - Online Booking Test
echo ========================================
echo.
echo Starting development server...
echo.
cd /d "%~dp0"
start "" "http://localhost:3001/#/book"
timeout /t 3 /nobreak >nul
npm run dev
