@echo off
echo ========================================
echo TESTING ENVIRONMENT VARIABLES
echo ========================================
echo.
echo This will show if .env file is loading correctly
echo.

cd server
node test-env.js

echo.
echo ========================================
echo.
pause
