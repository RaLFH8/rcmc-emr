@echo off
echo ========================================
echo  WHITE SCREEN FIX - CACHE CLEAR
echo ========================================
echo.
echo This script will:
echo 1. Stop the dev server
echo 2. Clear Vite cache
echo 3. Restart the dev server
echo.
echo Press Ctrl+C to cancel, or
pause

echo.
echo [1/3] Stopping any running dev servers...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/3] Clearing Vite cache...
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo Vite cache cleared!
) else (
    echo No Vite cache found (already clean)
)

echo [3/3] Starting dev server...
echo.
echo ========================================
echo  Server starting on http://localhost:3002
echo ========================================
echo.
echo IMPORTANT: After server starts:
echo 1. Close ALL browser tabs with localhost:3002
echo 2. Open a NEW incognito/private window
echo 3. Go to: http://localhost:3002/#/book
echo.
echo Or in your current browser:
echo 1. Press F12 (DevTools)
echo 2. Right-click the refresh button
echo 3. Select "Empty Cache and Hard Reload"
echo.

start cmd /k "npm run dev"

echo.
echo Dev server started in new window!
echo You can close this window now.
echo.
pause
