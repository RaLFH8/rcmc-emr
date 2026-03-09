@echo off
cd /d "%~dp0"
echo Creating PublicBooking.jsx...

(
echo import { useState, useEffect } from 'react';
echo import { Calendar, Clock, User, Phone, Mail, FileText, CheckCircle } from 'lucide-react';
echo import { getActiveDoctors, getAvailableTimeSlots, createOnlineBooking } from '../lib/supabase';
echo.
echo export default function PublicBooking^(^) {
echo   return ^<div^>Public Booking Page^</div^>;
echo }
) > src\pages\PublicBooking.jsx

echo Done! File created.
pause
