@echo off
echo Stopping all servers...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Starting backend server...
cd server
start "Backend Server" cmd /c "node index.js"
cd ..

timeout /t 3 /nobreak >nul

echo Starting frontend...
start "Frontend Dev Server" cmd /c "npm run dev"

timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo Servers are starting!
echo ========================================
echo Frontend will be at: http://localhost:5173
echo Backend is at: http://localhost:3003
echo.
echo Wait 10 seconds, then open: http://localhost:5173
echo ========================================
pause
