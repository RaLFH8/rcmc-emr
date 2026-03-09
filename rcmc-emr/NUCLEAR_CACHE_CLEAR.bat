@echo off
cls
echo ========================================
echo   NUCLEAR CACHE CLEAR
echo ========================================
echo.
echo This will clear ALL caches:
echo 1. Vite build cache
echo 2. Browser cache (you'll need to do manually)
echo 3. Force rebuild
echo.
echo Step 1: Stop the dev server (Ctrl+C in terminal)
pause
echo.
echo Step 2: Clearing Vite cache...
cd rcmc-emr
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo ✓ Vite cache cleared
) else (
    echo ✓ No Vite cache found
)
echo.
echo Step 3: Starting dev server...
echo.
start cmd /k "npm run dev"
echo.
echo ✓ Dev server starting in new window...
echo.
echo Step 4: MANUAL - Clear browser cache:
echo   1. Open http://localhost:3001/#/book
echo   2. Press Ctrl + Shift + Delete
echo   3. Select "Cached images and files"
echo   4. Click "Clear data"
echo   5. Close and reopen the browser
echo   6. Go to http://localhost:3001/#/book again
echo.
pause
