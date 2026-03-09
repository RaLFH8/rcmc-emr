@echo off
echo ========================================
echo   Installing Backend Dependencies
echo ========================================
echo.
echo This will install all required packages for the backend API.
echo.
echo Location: rcmc-emr/server
echo.
pause

cd server
echo.
echo Installing packages...
echo.
npm install

echo.
echo ========================================
if %ERRORLEVEL% EQU 0 (
    echo   Installation Successful!
    echo ========================================
    echo.
    echo Next steps:
    echo 1. Create server/.env file with your Google Drive Folder ID
    echo 2. Add google-credentials.json to server folder
    echo 3. Run START_BACKEND.bat to start the server
) else (
    echo   Installation Failed!
    echo ========================================
    echo.
    echo Possible issues:
    echo - Node.js not installed
    echo - npm not in PATH
    echo - Internet connection issue
    echo.
    echo Please install Node.js from: https://nodejs.org
)
echo.
pause
