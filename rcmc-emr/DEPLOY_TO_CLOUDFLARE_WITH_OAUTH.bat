@echo off
color 0A
cls
echo.
echo ========================================
echo    DEPLOY TO CLOUDFLARE WITH OAUTH
echo ========================================
echo.
echo This will build your project for deployment
echo.
echo After building, you need to:
echo   1. Deploy to Cloudflare Pages
echo   2. Add VITE_GOOGLE_CLIENT_ID to Cloudflare
echo   3. Update OAuth settings with production URL
echo.
echo ========================================
echo.
pause
echo.
echo Building project...
echo.
call npm run build
echo.
echo ========================================
echo BUILD COMPLETE!
echo ========================================
echo.
echo Next steps:
echo.
echo 1. Deploy the 'dist' folder to Cloudflare Pages
echo.
echo 2. Add environment variable in Cloudflare:
echo    VITE_GOOGLE_CLIENT_ID=your-client-id
echo.
echo 3. Update OAuth settings:
echo    https://console.cloud.google.com/apis/credentials?project=rcmc-lab-results
echo.
echo    Add your Cloudflare URL to:
echo    - Authorized JavaScript origins
echo    - Authorized redirect URIs
echo.
echo 4. Test lab results upload on production!
echo.
echo Full guide: DEPLOY_WITH_OAUTH.md
echo.
pause
