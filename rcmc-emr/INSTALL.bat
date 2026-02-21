@echo off
echo ========================================
echo RCMC Healthcare EMR - Installation
echo ========================================
echo.

echo [1/3] Installing dependencies...
call npm install

echo.
echo [2/3] Checking environment variables...
if not exist .env (
    echo WARNING: .env file not found!
    echo Please create .env file with your Supabase credentials.
    echo See .env.example for template.
    echo.
    pause
) else (
    echo .env file found!
)

echo.
echo [3/3] Installation complete!
echo.
echo ========================================
echo Next Steps:
echo ========================================
echo 1. Make sure .env file has your Supabase credentials
echo 2. Run the database schema in Supabase SQL Editor
echo 3. Start development server: npm run dev
echo.
echo For detailed instructions, see SETUP_GUIDE.md
echo ========================================
echo.
pause
