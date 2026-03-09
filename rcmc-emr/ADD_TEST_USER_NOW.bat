@echo off
color 0C
cls
echo.
echo ========================================
echo    FIX: Error 403 access_denied
echo ========================================
echo.
echo You need to add your email as a test user!
echo.
echo This takes 1 minute:
echo.
echo 1. Click the link that will open
echo 2. Scroll to "Test users" section
echo 3. Click "+ ADD USERS"
echo 4. Enter: rcmcrecords@gmail.com
echo 5. Click "SAVE"
echo.
echo ========================================
echo.
pause
echo.
echo Opening Google Cloud Console...
echo.
start https://console.cloud.google.com/apis/credentials/consent?project=rcmc-lab-results
echo.
echo ========================================
echo AFTER ADDING YOUR EMAIL:
echo ========================================
echo.
echo 1. Go back to http://localhost:3001
echo 2. Try uploading a lab result again
echo 3. Google will now let you in!
echo.
pause
