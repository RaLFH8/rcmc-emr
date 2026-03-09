@echo off
color 0C
cls
echo ========================================
echo   FORCE RESTART - Clear All Cache
echo ========================================
echo.
echo This will:
echo 1. Stop the dev server
echo 2. Delete Vite cache
echo 3. Restart the server
echo 4. Open browser
echo.
pause

cd /d "%~dp0"

echo.
echo [1/4] Stopping any running dev servers...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/4] Deleting Vite cache...
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo Cache deleted successfully!
) else (
    echo No cache found.
)

echo [3/4] Starting dev server...
start "RCMC EMR Dev Server" cmd /k "npm run dev"

echo [4/4] Waiting for server to start...
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo   Server Started!
echo ========================================
echo.
echo IMPORTANT: In your browser:
echo 1. Press Ctrl+Shift+Delete
echo 2. Clear "Cached images and files"
echo 3. Close ALL tabs with localhost:3001
echo 4. Then open: http://localhost:3001/#/book
echo.
echo Opening browser now...
timeout /t 2 /nobreak >nul
start "" "http://localhost:3001/#/book"

echo.
echo Done! Remember to clear browser cache!
pause
