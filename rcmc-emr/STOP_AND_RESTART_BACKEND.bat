@echo off
echo ========================================
echo STOP AND RESTART BACKEND (CORS FIX)
echo ========================================
echo.
echo Step 1: Stopping old backend server...
echo.

REM Kill process on port 3003
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3003') do taskkill /F /PID %%a 2>nul

echo ✅ Old server stopped!
echo.
echo Step 2: Starting backend with CORRECT CORS settings...
echo.
echo Frontend URL: http://localhost:3001
echo Backend URL: http://localhost:3003
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

cd server
npm start
