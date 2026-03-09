@echo off
color 0A
title BRAVE BROWSER CACHE FIX

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║          🦁 BRAVE BROWSER - AUTOMATED CACHE FIX             ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo This script will:
echo   1. Clear Vite cache
echo   2. Clear dist folder  
echo   3. Restart dev server with no-cache headers
echo   4. Open Brave Private Window automatically
echo.
echo ════════════════════════════════════════════════════════════════
echo.

pause

echo.
echo [STEP 1/5] Stopping dev server...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo ✓ Dev server stopped
echo.

echo [STEP 2/5] Clearing Vite cache...
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo ✓ Vite cache cleared
) else (
    echo ✓ No Vite cache to clear
)
echo.

echo [STEP 3/5] Clearing dist folder...
if exist "dist" (
    rmdir /s /q "dist"
    echo ✓ Dist folder cleared
) else (
    echo ✓ No dist folder to clear
)
echo.

echo [STEP 4/5] Starting dev server with no-cache headers...
start "Vite Dev Server" cmd /k "npm run dev -- --force"
echo ✓ Dev server starting...
echo.
echo Waiting for server to start (15 seconds)...
timeout /t 15 /nobreak >nul
echo.

echo [STEP 5/5] Opening Brave Private Window...
echo.
echo Attempting to open Brave...

REM Try multiple Brave installation paths
set BRAVE_FOUND=0

if exist "%ProgramFiles%\BraveSoftware\Brave-Browser\Application\brave.exe" (
    start "" "%ProgramFiles%\BraveSoftware\Brave-Browser\Application\brave.exe" --incognito "http://localhost:3001/#/book"
    set BRAVE_FOUND=1
)

if exist "%ProgramFiles(x86)%\BraveSoftware\Brave-Browser\Application\brave.exe" (
    start "" "%ProgramFiles(x86)%\BraveSoftware\Brave-Browser\Application\brave.exe" --incognito "http://localhost:3001/#/book"
    set BRAVE_FOUND=1
)

if exist "%LocalAppData%\BraveSoftware\Brave-Browser\Application\brave.exe" (
    start "" "%LocalAppData%\BraveSoftware\Brave-Browser\Application\brave.exe" --incognito "http://localhost:3001/#/book"
    set BRAVE_FOUND=1
)

if %BRAVE_FOUND%==0 (
    echo.
    echo ⚠️  Could not find Brave Browser automatically
    echo.
    echo MANUAL STEPS:
    echo 1. Open Brave Browser
    echo 2. Press Ctrl+Shift+N (Private Window)
    echo 3. Go to: http://localhost:3001/#/book
    echo.
) else (
    echo ✓ Brave Private Window opened!
    echo.
)

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    ✅ FIX COMPLETE!                          ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo NEXT STEPS:
echo.
echo 1. In the Brave Private Window that just opened:
echo    - Fill out the booking form
echo    - Phone: 09171234567
echo    - Fill other fields normally
echo.
echo 2. Submit the form
echo.
echo 3. Check console (F12) for success logs:
echo    ✓ 📤 FINAL BOOKING DATA OBJECT
echo    ✓ patient_contact: "09171234567"
echo    ✓ 🎉 Booking created successfully!
echo.
echo ════════════════════════════════════════════════════════════════
echo.
echo Dev server is running in the other window.
echo Press any key to close this window...
pause >nul
