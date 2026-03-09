@echo off
echo ========================================
echo ADD GOOGLE CLIENT ID TO .ENV FILE
echo ========================================
echo.
echo This will add the Google OAuth Client ID to your .env file
echo.
echo First, you need to create OAuth credentials:
echo 1. Go to: https://console.cloud.google.com/apis/credentials?project=rcmc-lab-results
echo 2. Create OAuth Client ID (see OAUTH_SETUP_GUIDE.md for details)
echo 3. Copy the Client ID
echo.
set /p CLIENT_ID="Paste your Google Client ID here: "
echo.
echo Adding to .env file...
echo VITE_GOOGLE_CLIENT_ID=%CLIENT_ID% >> .env
echo.
echo ========================================
echo SUCCESS!
echo ========================================
echo.
echo Google Client ID has been added to .env file
echo.
echo Next steps:
echo 1. Restart your frontend server (npm run dev)
echo 2. Test uploading a lab result
echo.
pause
