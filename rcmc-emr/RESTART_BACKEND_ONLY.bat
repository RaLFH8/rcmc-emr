@echo off
echo ========================================
echo RESTARTING BACKEND ONLY
echo ========================================
echo.
echo Stopping backend on port 3003...

REM Kill process on port 3003
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3003') do taskkill /F /PID %%a 2>nul

echo ✅ Backend stopped!
echo.
echo Starting backend with correct environment variables...
echo.
echo Configuration:
echo - Port: 3003
echo - Google Drive Folder: 1JBKtpUdImoQc1LPzyrmVpOsUCYeTky64
echo - Frontend URL: http://localhost:3001
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

cd server
npm start
