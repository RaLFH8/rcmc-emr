@echo off
echo ========================================
echo   RCMC EMR - Push Update to Cloudflare
echo ========================================
echo.

cd /d "%~dp0"

echo Enter a short description of your changes:
set /p MSG="Commit message: "

if "%MSG%"=="" (
    echo No message entered. Using default message.
    set MSG=Update deployment
)

echo.
echo Adding all changes...
git add .

echo Committing: %MSG%
git commit -m "%MSG%"

echo Pushing to GitHub...
git push

echo.
echo ========================================
echo   Done! Cloudflare is now building...
echo   Check progress at:
echo   https://dash.cloudflare.com
echo ========================================
echo.
pause
