@echo off
cls
echo ========================================
echo   STOP DEV SERVER AND REBUILD
echo ========================================
echo.
echo Step 1: Go to the terminal running "npm run dev"
echo Step 2: Press Ctrl+C to stop it
echo Step 3: Wait for it to stop completely
echo.
pause
echo.
echo Step 4: Clearing Vite cache...
cd rcmc-emr
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo ✓ Vite cache cleared
)
echo.
echo Step 5: Run this command in the terminal:
echo.
echo   cd rcmc-emr
echo   npm run dev
echo.
echo Step 6: After server starts, CLOSE YOUR BROWSER COMPLETELY
echo Step 7: Reopen browser and go to: http://localhost:3001/#/book
echo.
pause
