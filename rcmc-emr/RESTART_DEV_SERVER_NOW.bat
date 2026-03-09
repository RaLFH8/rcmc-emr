@echo off
cls
echo ========================================
echo   RESTART DEV SERVER (Nuclear Option)
echo ========================================
echo.
echo This will:
echo 1. Stop the current dev server
echo 2. Clear Vite cache
echo 3. Restart the dev server
echo.
echo Press Ctrl+C in the terminal running "npm run dev" to stop it.
echo Then run this command:
echo.
echo   cd rcmc-emr
echo   rmdir /s /q node_modules\.vite
echo   npm run dev
echo.
echo This forces Vite to rebuild everything from scratch.
echo.
pause
