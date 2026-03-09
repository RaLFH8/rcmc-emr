@echo off
echo ========================================
echo BRAVE CACHE CLEAR + SERVER RESTART
echo ========================================
echo.

echo Step 1: Stopping any running dev servers...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Step 2: Clearing Vite cache...
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo Vite cache cleared!
) else (
    echo No Vite cache found.
)

echo.
echo Step 3: Starting dev server with fresh cache...
start cmd /k "npm run dev"

echo.
echo ========================================
echo SERVER RESTARTED!
echo ========================================
echo.
echo IMPORTANT: Now clear Brave browser cache:
echo.
echo 1. Open Brave
echo 2. Press Ctrl+Shift+Delete
echo 3. Select "Cached images and files"
echo 4. Time range: "All time"
echo 5. Click "Clear data"
echo 6. Close ALL Brave windows
echo 7. Reopen Brave and go to: http://localhost:3001/#/book
echo.
echo OR use Private Window (Ctrl+Shift+N) to bypass cache
echo.
pause
