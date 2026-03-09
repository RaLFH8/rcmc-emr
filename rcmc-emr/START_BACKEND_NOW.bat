@echo off
echo ========================================
echo   STARTING BACKEND API SERVER
echo ========================================
echo.
echo Starting backend on port 3003...
echo.
cd /d "%~dp0\server"
npm start
