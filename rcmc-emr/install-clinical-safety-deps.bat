@echo off
echo Installing Clinical Safety Trio dependencies...
cd /d "%~dp0"
call npm install react-signature-canvas fast-check date-fns vitest @vitest/ui @vitest/coverage-v8 jsdom
echo.
echo Installation complete!
pause
