@echo off
echo Running Preservation Property Tests...
echo.
cd /d "%~dp0"
call npm test
pause
