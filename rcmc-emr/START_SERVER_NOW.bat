@echo off
color 0A
cls
echo.
echo ========================================
echo    STARTING RCMC EMR FRONTEND
echo ========================================
echo.
echo Server will start on: http://localhost:3001
echo.
echo After OAuth setup, the Lab Results feature
echo will upload directly to Google Drive!
echo.
echo Press Ctrl+C to stop the server
echo.
echo ========================================
echo.

npm run dev
