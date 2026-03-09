@echo off
echo ========================================
echo RESTARTING SERVER WITH FRESH CACHE
echo ========================================
echo.

echo Step 1: Stopping all Node processes...
taskkill /F /IM node.exe 2>nul
if %errorlevel% equ 0 (
    echo Node processes stopped!
    timeout /t 2 >nul
) else (
    echo No Node processes running.
)

echo.
echo Step 2: Clearing Vite cache...
cd rcmc-emr
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo Vite cache cleared!
) else (
    echo No Vite cache found.
)

echo.
echo Step 3: Clearing dist folder...
if exist "dist" (
    rmdir /s /q "dist"
    echo Dist folder cleared!
) else (
    echo No dist folder found.
)

echo.
echo ========================================
echo STARTING DEV SERVER...
echo ========================================
echo.
echo Server will start in a new window...
echo.

start cmd /k "cd /d %~dp0rcmc-emr && npm run dev"

echo.
echo ========================================
echo SERVER STARTING!
echo ========================================
echo.
echo IMPORTANT: After server starts, you MUST:
echo.
echo 1. Close ALL Brave browser windows
echo 2. Press Ctrl+Shift+Delete in Brave
echo 3. Select "All time"
echo 4. Check "Cached images and files"
echo 5. Click "Clear data"
echo 6. Open booking page
echo 7. Press Ctrl+F5 (hard refresh)
echo.
echo The dev server is starting in a new window...
echo You can close this window now.
echo.
pause
