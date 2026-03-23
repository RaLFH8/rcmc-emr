# Test Appointment Notifications - Quick Guide

**Status:** Ready to Test ✅  
**Date:** February 28, 2026

---

## Prerequisites

Before testing, ensure:
1. ✅ Development server is running (`npm run dev` in rcmc-emr folder)
2. ✅ Environment variables are set in `.env`:
   - `VITE_RESEND_API_KEY=re_56oZYCZY_8MSHyMAjFV4T5qGRryJfNFGP`
   - `VITE_SMS_GATEWAY_API_KEY=<your_key>` (if you have one)
   - `VITE_SMS_GATEWAY_DEVICE_ID=<your_device_id>` (if you have one)

---

## Test 1: Online Booking with Email + SMS

**What to test:** Online bookings should send both email and SMS notifications

**Steps:**
1. Open the public booking page (usually at `/public-booking` or similar URL)
2. Fill out the booking form with:
   - Valid email address (use your real email to verify)
   - Valid phone number (use your real phone to verify)
   - Select a doctor, date, and time
   - Fill in patient information
3. Submit the booking
4. **Expected Results:**
   - ✅ Booking confirmation page appears
   - ✅ Success message shows: "Confirmation sent to your email and phone."
   - ✅ Check browser console (F12) for logs:
     - `✅ Both email and SMS notifications sent successfully`
   - ✅ Check your email inbox for appointment confirmation
   - ✅ Check your phone for SMS confirmation

**If notifications fail:**
- Success message will show: "We will contact you shortly to confirm."
- Console will show warnings about which notification failed
- Booking is still created successfully ✅

---

## Test 2: Online Booking with Missing Email

**What to test:** System handles missing email gracefully

**Steps:**
1. Open the public booking page
2. Fill out the form but leave email blank (if possible) or use invalid format
3. Submit the booking
4. **Expected Results:**
   - ✅ Booking created successfully
   - ✅ Success message shows: "Confirmation sent to your phone. Email notification could not be delivered."
   - ✅ Console shows warning about missing/invalid email
   - ✅ SMS still sent to phone

---

## Test 3: Walk-in Appointment (Staff Portal)

**What to test:** Walk-in appointments send SMS only

**Steps:**
1. Login to the staff portal
2. Go to Appointments page
3. Click "New Appointment"
4. Select an existing patient with a phone number
5. Fill in appointment details
6. Submit the appointment
7. **Expected Results:**
   - ✅ Appointment created successfully
   - ✅ Alert shows: "Appointment scheduled successfully!"
   - ✅ Console shows: `✅ Walk-in appointment SMS notification sent`
   - ✅ Patient receives SMS (if SMS gateway is configured)
   - ✅ NO email sent (walk-in = SMS only)

---

## Test 4: Check Console Logs

**What to look for in browser console (F12):**

**Successful notifications:**
```
✅ Email notification sent successfully
✅ SMS notification sent successfully
✅ Both email and SMS notifications sent successfully
```

**Warnings (non-blocking):**
```
[Appointment Notification Warning] {
  timestamp: "2026-02-28T...",
  patientName: "John Doe",
  message: "Skipping email notification: No valid email address",
  providedEmail: "not provided"
}
```

**Errors (non-blocking):**
```
[Appointment Notification Error] {
  timestamp: "2026-02-28T...",
  appointmentId: 123,
  patientName: "John Doe",
  notificationType: "email",
  error: "API key not configured",
  contactInfo: { email: "...", phone: "..." }
}
```

---

## Test 5: Verify Non-Blocking Behavior

**What to test:** Appointments are created even if notifications fail

**Steps:**
1. Temporarily remove API keys from `.env` file (or use invalid keys)
2. Create an online booking
3. **Expected Results:**
   - ✅ Booking is created successfully
   - ✅ Success page appears
   - ✅ Message shows: "We will contact you shortly to confirm."
   - ✅ Console shows errors but appointment is in database
   - ✅ No crash or error page

---

## Quick Console Test Commands

Open browser console (F12) and run these to check the integration:

```javascript
// Check if notification function is imported
console.log(typeof sendAppointmentNotifications)
// Should show: "function"

// Check PublicBooking.jsx has the import
// View source and search for: "sendAppointmentNotifications"
```

---

## Expected Notification Content

**Email should include:**
- Patient name
- Doctor name
- Appointment date (DD/MM/YYYY format)
- Appointment time (12-hour format with AM/PM)
- Clinic address
- Professional formatting

**SMS should include:**
- Patient name
- Doctor name
- Appointment date (DD/MM/YYYY format)
- Appointment time (12-hour format with AM/PM)
- Message under 160 characters

---

## Troubleshooting

### No notifications received?
1. Check console for errors
2. Verify API keys in `.env` file
3. Check email spam folder
4. Verify phone number format is correct

### Email fails but SMS works?
- Check `VITE_RESEND_API_KEY` is correct
- Verify email format is valid
- Check Resend dashboard for delivery status

### SMS fails but email works?
- Check `VITE_SMS_GATEWAY_API_KEY` and `VITE_SMS_GATEWAY_DEVICE_ID`
- Verify phone number format
- Check SMS gateway dashboard

### Both fail?
- Appointment is still created ✅
- Check console for specific error messages
- Verify network connectivity
- Check API service status

---

## Success Criteria

The feature is working correctly if:
- ✅ Online bookings attempt to send both email and SMS
- ✅ Walk-in appointments send SMS only
- ✅ Appointments are created regardless of notification status
- ✅ Dynamic success messages reflect notification delivery
- ✅ Console logs show structured error/warning messages
- ✅ No crashes or white screens

---

## Next Steps After Testing

1. **If everything works:** Feature is production-ready! 🎉
2. **If notifications fail:** Check API configuration and credentials
3. **If appointments don't save:** Check database connection (unrelated to notifications)
4. **If you see errors:** Share console logs for debugging

---

**Ready to test?** Start with Test 1 (Online Booking) and check your email/phone!

**Need help?** Check the console logs first - they'll tell you exactly what's happening.
