@echo off
echo ========================================
echo Building RCMC-EMR for Cloudflare
echo ========================================
echo.

echo Building production version...
echo This will take 30-60 seconds...
echo.

call npm run build

if errorlevel 1 (
    echo.
    echo ========================================
    echo ERROR: Build failed!
    echo ========================================
    echo.
    echo Please check the error messages above.
    echo Common fixes:
    echo 1. Make sure you're in the rcmc-emr folder
    echo 2. Try running: npm install
    echo 3. Then try this script again
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo BUILD SUCCESSFUL!
echo ========================================
echo.
echo The 'dist' folder has been created with your updated code.
echo.
echo NEXT STEPS:
echo ========================================
echo.
echo 1. Go to: https://dash.cloudflare.com/
echo 2. Click: Pages (left sidebar)
echo 3. Click: Your rcmc-emr project
echo 4. Click: "Create deployment" button
echo 5. Drag the 'dist' folder from this directory
echo 6. Drop it in the upload area
echo 7. Click: "Deploy"
echo 8. Wait 30-60 seconds
echo.
echo Your site will be updated with:
echo - Real-time revenue data
echo - Monthly revenue trend chart
echo - Revenue distribution by category
echo.
echo ========================================
echo The 'dist' folder is located at:
echo %CD%\dist
echo ========================================
echo.
echo You can now drag this folder to Cloudflare!
echo.
pause
