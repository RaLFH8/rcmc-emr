@echo off
echo ========================================
echo  RCMC EMR - Push to GitHub
echo ========================================
echo.

cd /d "%~dp0"

echo Adding all changes...
git add .

echo.
set /p commit_message="Enter commit message: "

if "%commit_message%"=="" (
    set commit_message=Update RCMC EMR project
)

echo.
echo Committing with message: %commit_message%
git commit -m "%commit_message%"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo ========================================
echo  Push Complete!
echo ========================================
echo.
pause
