@echo off
echo ========================================
echo TESTING FILE UPLOAD
echo ========================================
echo.
echo This will test if file upload works with the current code.
echo.
echo Press any key to run the test...
pause > nul

cd server
node test-upload.js

echo.
echo ========================================
echo TEST COMPLETE
echo ========================================
echo.
echo Press any key to close...
pause > nul
