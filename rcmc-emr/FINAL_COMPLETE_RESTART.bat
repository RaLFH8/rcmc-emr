@echo off
echo ========================================
echo COMPLETE SYSTEM RESTART
echo ========================================
echo.
echo This will:
echo 1. Kill ALL Node.js processes
echo 2. Clear any cached modules
echo 3. Start backend fresh
echo 4. Start frontend fresh
echo.
pause
echo.

echo Step 1: Killing all Node.js processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Step 2: Clearing Node.js cache...
cd server
if exist node_modules\.cache rmdir /s /q node_modules\.cache 2>nul
cd ..
if exist node_modules\.cache rmdir /s /q node_modules\.cache 2>nul

echo Step 3: Starting Backend (Port 3003)...
start "RCMC Backend - Port 3003" cmd /k "cd server && npm start"

timeout /t 5 /nobreak >nul

echo Step 4: Starting Frontend (Port 3001)...
start "RCMC Frontend - Port 3001" cmd /k "npm run dev"

echo.
echo ========================================
echo ✅ BOTH SERVERS STARTING!
echo ========================================
echo.
echo Wait 10 seconds, then open: http://localhost:3001
echo.
echo Backend should show:
echo   📁 Google Drive Folder ID: 1JBKtpUdImoQc1LPzyrmVpOsUCYeTky64
echo.
echo If you still get the error, check the backend terminal
echo for the exact error message.
echo.
pause
