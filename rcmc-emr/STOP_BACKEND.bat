@echo off
echo ========================================
echo STOPPING BACKEND SERVER
echo ========================================
echo.
echo Killing all Node.js processes on port 3003...
echo.

REM Kill process on port 3003
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3003') do taskkill /F /PID %%a 2>nul

echo.
echo ✅ Backend server stopped!
echo.
echo Now double-click: RESTART_BACKEND_NOW.bat
echo.
pause
