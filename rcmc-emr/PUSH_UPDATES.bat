@echo off
echo ========================================
echo Push Updates to Cloudflare
echo ========================================
echo.

echo Adding all changes...
git add .
echo.

echo Creating commit...
set /p message="Enter commit message (or press Enter for default): "
if "%message%"=="" set message=Update RCMC-EMR with latest changes

git commit -m "%message%"
echo.

echo Pushing to GitHub...
git push
echo.

echo ========================================
echo Done!
echo ========================================
echo.
echo Your changes are being deployed to Cloudflare.
echo This will take 2-3 minutes.
echo.
echo Check deployment status at:
echo https://dash.cloudflare.com/
echo.
echo After deployment completes:
echo 1. Go to your Cloudflare URL
echo 2. Hard refresh: Ctrl + Shift + R
echo 3. Check that changes are live
echo.
pause
