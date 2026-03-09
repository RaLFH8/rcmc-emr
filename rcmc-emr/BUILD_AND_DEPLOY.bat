@echo off
echo ========================================
echo RCMC-EMR - BUILD FOR CLOUDFLARE
echo ========================================
echo.

echo Step 1: Building project...
echo.
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Build failed!
    echo.
    echo Possible solutions:
    echo 1. Make sure Node.js is installed
    echo 2. Run: npm install
    echo 3. Try again
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ BUILD SUCCESSFUL!
echo ========================================
echo.
echo The 'dist' folder has been created!
echo.
echo NEXT STEPS:
echo ========================================
echo.
echo 1. Go to: https://dash.cloudflare.com/
echo 2. Click: Pages (left sidebar)
echo 3. Find your RCMC-EMR project
echo 4. Click: Create deployment
echo 5. Drag the 'dist' folder to upload
echo 6. Click: Save and Deploy
echo 7. Wait 1-2 minutes
echo 8. Click: Visit site
echo.
echo ========================================
echo 📁 Location of dist folder:
echo %CD%\dist
echo ========================================
echo.
echo Press any key to open the dist folder...
pause > nul
explorer dist
