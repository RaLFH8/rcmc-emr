@echo off
echo Fixing PublicBooking.jsx imports...
echo.

cd /d "%~dp0"

powershell -Command "(Get-Content 'src/pages/PublicBooking.jsx') -replace 'import \{ getActiveDoctors, getAvailableTimeSlots, createOnlineBooking \} from ''../lib/supabase'';', 'import { db } from ''../lib/supabase'';' | Set-Content 'src/pages/PublicBooking.jsx'"

powershell -Command "(Get-Content 'src/pages/PublicBooking.jsx') -replace 'await getActiveDoctors\(\)', 'await db.getActiveDoctors()' | Set-Content 'src/pages/PublicBooking.jsx'"

powershell -Command "(Get-Content 'src/pages/PublicBooking.jsx') -replace 'await getAvailableTimeSlots\(', 'await db.getAvailableTimeSlots(' | Set-Content 'src/pages/PublicBooking.jsx'"

powershell -Command "(Get-Content 'src/pages/PublicBooking.jsx') -replace 'await createOnlineBooking\(', 'await db.createOnlineBooking(' | Set-Content 'src/pages/PublicBooking.jsx'"

echo.
echo ✅ Fixed! Now restart the dev server.
echo.
pause
