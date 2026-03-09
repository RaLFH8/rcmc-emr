@echo off
echo ========================================
echo Installing html2canvas...
echo ========================================
cd /d "%~dp0"
call npm install html2canvas

echo.
echo ========================================
echo Installation complete!
echo ========================================
echo.
echo Press any key to start the server...
pause > nul

echo.
echo ========================================
echo Starting development server...
echo ========================================
npm run dev
