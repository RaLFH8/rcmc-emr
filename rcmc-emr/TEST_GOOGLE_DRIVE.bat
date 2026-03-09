@echo off
echo ========================================
echo TESTING GOOGLE DRIVE ACCESS
echo ========================================
echo.
echo This will test if the service account can access the folder.
echo.
echo Press any key to run the test...
pause > nul

cd server
node test-drive-access.js

echo.
echo ========================================
echo TEST COMPLETE
echo ========================================
echo.
echo Press any key to close...
pause > nul
