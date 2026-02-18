@echo off
echo Killing all Node.js processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo.
echo Starting server on port 54321...
echo.
cd /d "%~dp0"
npm start
