@echo off
echo ========================================
echo OPENING PRESCRIPTION PAGE
echo ========================================
echo.
echo Server is running on: http://localhost:3002
echo.
echo Opening browser now...
echo.
echo IMPORTANT: After browser opens:
echo 1. Press Ctrl + Shift + R (hard refresh)
echo 2. Or press Ctrl + F5
echo.
timeout /t 2 >nul
start http://localhost:3002/?nocache=%random%
echo.
echo Browser opened!
echo.
echo If you still see the old format:
echo 1. Close ALL browser tabs
echo 2. Open incognito window (Ctrl + Shift + N)
echo 3. Go to http://localhost:3002
echo.
pause
