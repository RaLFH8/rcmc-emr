@echo off
echo.
echo ========================================
echo   OPENING PUBLIC BOOKING PAGE
echo ========================================
echo.
echo Opening browser to public booking page...
echo URL: http://localhost:5173/#/book
echo.
start http://localhost:5173/#/book
echo.
echo Done! The public booking page should open in your browser.
echo.
echo NOTE: Make sure your development server is running!
echo If not, run START_FRONTEND.bat first.
echo.
pause
