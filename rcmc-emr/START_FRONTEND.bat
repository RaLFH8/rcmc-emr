@echo off
cls
echo.
echo ========================================
echo    STARTING RCMC EMR FRONTEND
echo ========================================
echo.
echo Killing any existing Node processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo.
echo Starting server on http://localhost:3001
echo.
echo Press Ctrl+C to stop the server
echo.
echo ========================================
echo.

call npm run dev

pause
