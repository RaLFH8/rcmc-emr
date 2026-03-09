@echo off
echo Starting RCMC EMR Development Server...
echo.
cd /d "%~dp0"
call npm run dev
pause
