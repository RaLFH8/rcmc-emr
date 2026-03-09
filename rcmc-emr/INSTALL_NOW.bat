@echo off
echo ========================================
echo Installing Required Packages
echo ========================================
echo.
echo This will install:
echo - xlsx (for CSV/Excel export)
echo - recharts (for charts)
echo.
echo Please wait...
echo.

npm install xlsx recharts

echo.
echo ========================================
if %ERRORLEVEL% EQU 0 (
    echo SUCCESS! Packages installed.
    echo.
    echo You can now run: npm run dev
) else (
    echo ERROR! Installation failed.
    echo.
    echo Please try manually:
    echo 1. Open Command Prompt or PowerShell
    echo 2. Navigate to rcmc-emr folder
    echo 3. Run: npm install xlsx recharts
)
echo ========================================
echo.
pause
