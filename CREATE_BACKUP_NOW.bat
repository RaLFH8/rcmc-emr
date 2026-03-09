@echo off
echo ============================================
echo CREATING SYSTEM BACKUP
echo ============================================
echo.

REM Create backup directory
set BACKUP_DIR=backups\pre-security-update-%date:~-4,4%-%date:~-10,2%-%date:~-7,2%
echo Creating backup directory: %BACKUP_DIR%
mkdir "%BACKUP_DIR%" 2>nul
mkdir "%BACKUP_DIR%\rcmc-emr" 2>nul
mkdir "%BACKUP_DIR%\rcmc-emr\server" 2>nul
mkdir "%BACKUP_DIR%\rcmc-emr\src" 2>nul

echo.
echo Backing up environment files...
copy "rcmc-emr\.env" "%BACKUP_DIR%\rcmc-emr\" >nul 2>&1
copy "rcmc-emr\server\.env" "%BACKUP_DIR%\rcmc-emr\server\" >nul 2>&1

echo Backing up database files...
copy "database.js" "%BACKUP_DIR%\" >nul 2>&1
copy "server.js" "%BACKUP_DIR%\" >nul 2>&1

echo Backing up source code...
xcopy "rcmc-emr\src" "%BACKUP_DIR%\rcmc-emr\src" /E /I /Q >nul 2>&1
xcopy "rcmc-emr\server" "%BACKUP_DIR%\rcmc-emr\server" /E /I /Q >nul 2>&1

echo Backing up configuration files...
copy "rcmc-emr\package.json" "%BACKUP_DIR%\rcmc-emr\" >nul 2>&1
copy "rcmc-emr\vite.config.js" "%BACKUP_DIR%\rcmc-emr\" >nul 2>&1
copy "rcmc-emr\tailwind.config.js" "%BACKUP_DIR%\rcmc-emr\" >nul 2>&1

echo.
echo ============================================
echo BACKUP COMPLETE!
echo ============================================
echo.
echo Backup location: %BACKUP_DIR%
echo.
echo NEXT STEPS:
echo 1. Go to Supabase Dashboard
echo 2. Navigate to Database -^> Backups
echo 3. Create a manual backup named: pre-security-update
echo 4. Run BACKUP_DATABASE_NOW.sql in SQL Editor
echo.
echo Press any key to open backup folder...
pause >nul
explorer "%BACKUP_DIR%"
