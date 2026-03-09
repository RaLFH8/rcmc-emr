@echo off
echo ========================================
echo FORCING BROWSER CACHE CLEAR
echo ========================================
echo.
echo This will:
echo 1. Stop the dev server
echo 2. Clear Vite cache
echo 3. Restart with force refresh
echo.
pause

cd rcmc-emr

echo Stopping any running servers...
taskkill /F /IM node.exe 2>nul

echo Clearing Vite cache...
rmdir /s /q node_modules\.vite 2>nul
rmdir /s /q dist 2>nul

echo Starting dev server with force refresh...
start cmd /k "npm run dev -- --force"

echo.
echo ========================================
echo IMPORTANT: DO THIS NOW!
echo ========================================
echo.
echo 1. Close ALL Brave browser windows
echo 2. Wait 5 seconds
echo 3. Open Brave again
echo 4. Press Ctrl+Shift+Delete
echo 5. Select "Cached images and files"
echo 6. Click "Clear data"
echo 7. Go to: http://localhost:3001/#/book
echo 8. Press Ctrl+F5 (hard refresh)
echo.
pause
