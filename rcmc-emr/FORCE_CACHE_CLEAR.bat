@echo off
echo ========================================
echo FORCING COMPLETE CACHE CLEAR
echo ========================================
echo.
echo This will:
echo 1. Stop the dev server
echo 2. Clear Vite cache
echo 3. Restart the dev server
echo 4. Open browser with cache-busting URL
echo.
pause

echo.
echo [1/4] Stopping dev server...
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul

echo [2/4] Clearing Vite cache...
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo Vite cache cleared!
) else (
    echo No Vite cache found.
)

echo [3/4] Starting dev server...
start /B cmd /c "npm run dev > dev-server.log 2>&1"
echo Waiting for server to start...
timeout /t 5 >nul

echo [4/4] Opening browser with cache-busting...
echo.
echo ========================================
echo IMPORTANT: When browser opens, press:
echo Ctrl + Shift + R (hard refresh)
echo OR
echo Ctrl + F5
echo ========================================
timeout /t 3 >nul
start http://localhost:3002/?nocache=%random%

echo.
echo Done! Server is running.
echo If you still see old format, try:
echo 1. Close ALL browser tabs
echo 2. Reopen browser
echo 3. Go to http://localhost:5173
pause
