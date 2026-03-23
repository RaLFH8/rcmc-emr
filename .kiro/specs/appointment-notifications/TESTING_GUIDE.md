# Appointment Notifications - Testing Guide

## Quick Start Testing

This guide helps you verify that the appointment notifications feature is working correctly.

## Prerequisites

1. **Email Service (Resend)** - Already configured with API key
2. **SMS Service** - Configure if you want to test SMS (optional for initial testing)
3. **Development Server** - Running on localhost

## Checkpoint 3: Online Booking Notifications

### Test 1: Complete Online Booking with Email and Phone

**Steps:**
1. Navigate to the public booking page: `http://localhost:5173/booking` (or your public booking URL)
2. Select a doctor
3. Select a date and time slot
4. Fill in patient information:
   - First Name: Test
   - Last Name: Patient
   - Email: your-email@example.com (use a real email you can check)
   - Phone: +639123456789 (use a real Philippine number if testing SMS)
   - Fill other required fields
5. Submit the booking

**Expected Results:**
- ✅ Appointment is created successfully
- ✅ Success message shows: "Confirmation sent to your email and phone." (if both services configured)
- ✅ Check your email inbox for appointment confirmation
- ✅ Check your phone for SMS (if SMS service configured)
- ✅ Check browser console for success logs: "✅ Email notification sent successfully" and "✅ SMS notification sent successfully"

### Test 2: Online Booking with Missing Email

**Steps:**
1. Navigate to public booking page
2. Fill in all fields EXCEPT email (leave it empty or use invalid format)
3. Submit the booking

**Expected Results:**
- ✅ Appointment is created successfully
- ✅ Success message shows: "Confirmation sent to your phone. Email notification could not be delivered." (if SMS configured)
- ✅ Check browser console for warning: "Skipping email notification: No valid email address"
- ✅ SMS should still be sent (if configured)

### Test 3: Online Booking with Missing Phone

**Steps:**
1. Navigate to public booking page
2. Fill in all fields EXCEPT phone number
3. Submit the booking

**Expected Results:**
- ✅ Appointment is created successfully
- ✅ Success message shows: "Confirmation sent to your email. SMS notification could not be delivered."
- ✅ Check browser console for warning: "Skipping SMS notification: No phone number"
- ✅ Email should still be sent

### Test 4: Online Booking with Both Missing

**Steps:**
1. Navigate to public booking page
2. Fill in all fields EXCEPT email and phone
3. Submit the booking

**Expected Results:**
- ✅ Appointment is created successfully
- ✅ Success message shows: "We will contact you shortly to confirm."
- ✅ Check browser console for warnings about both notifications being skipped

## Checkpoint 8: Walk-in Appointment Notifications

### Test 5: Walk-in Appointment with Phone Number

**Steps:**
1. Log in to the EMR system as staff/doctor
2. Navigate to Appointments page
3. Click "New Appointment"
4. Select an existing patient with a phone number OR create a new patient with phone
5. Fill in appointment details
6. Submit

**Expected Results:**
- ✅ Appointment is created successfully
- ✅ Alert shows: "Appointment scheduled successfully!"
- ✅ Check browser console for: "✅ Walk-in appointment SMS notification sent"
- ✅ Check patient's phone for SMS (if SMS service configured)
- ✅ NO email should be sent (verify in console logs)

### Test 6: Walk-in Appointment with Missing Phone

**Steps:**
1. Navigate to Appointments page
2. Create appointment for patient without phone number
3. Submit

**Expected Results:**
- ✅ Appointment is created successfully
- ✅ Alert shows: "Appointment scheduled successfully!"
- ✅ Check browser console for warning: "Skipping SMS notification: No phone number"
- ✅ No errors thrown

### Test 7: Walk-in Appointment for New Patient

**Steps:**
1. Navigate to Appointments page
2. Click "New Appointment"
3. Click "+ Add New Patient"
4. Fill in new patient details including phone number
5. Fill in appointment details
6. Submit

**Expected Results:**
- ✅ Patient is created
- ✅ Appointment is created
- ✅ SMS notification sent to new patient's phone
- ✅ Check browser console for success logs

## Error Scenario Testing

### Test 8: Disabled Email Service

**Steps:**
1. Temporarily remove or invalidate `VITE_RESEND_API_KEY` in .env file
2. Restart dev server
3. Create an online booking with email

**Expected Results:**
- ✅ Appointment is created successfully
- ✅ Check browser console for: "⚠️ Resend not configured. Set VITE_RESEND_API_KEY in .env"
- ✅ Success message shows notification failure
- ✅ SMS still sent (if configured)

### Test 9: Disabled SMS Service

**Steps:**
1. Temporarily remove SMS API keys from .env file
2. Restart dev server
3. Create an appointment

**Expected Results:**
- ✅ Appointment is created successfully
- ✅ Check browser console for: "⚠️ SMS Gateway not configured"
- ✅ Email still sent (if configured)

### Test 10: Invalid Email Format

**Steps:**
1. Create online booking with invalid email: "notanemail"
2. Submit

**Expected Results:**
- ✅ Appointment is created successfully
- ✅ Email notification skipped with warning
- ✅ SMS still sent (if configured)

## Console Log Verification

### Success Logs
Look for these in browser console:
```
✅ Email notification sent successfully
✅ SMS notification sent successfully
✅ Walk-in appointment SMS notification sent
```

### Warning Logs
Look for these in browser console:
```
[Appointment Notification Warning] {
  timestamp: "2025-01-XX...",
  patientName: "Test Patient",
  message: "Skipping email notification: No valid email address",
  providedEmail: "not provided"
}
```

### Error Logs
Look for these in browser console:
```
[Appointment Notification Error] {
  timestamp: "2025-01-XX...",
  appointmentId: 123,
  patientName: "Test Patient",
  notificationType: "email",
  error: "Failed to send email",
  contactInfo: {
    email: "test@example.com",
    phone: "+639123456789"
  }
}
```

## Email Content Verification

When you receive an email, verify it contains:
- ✅ Patient name
- ✅ Appointment date (readable format)
- ✅ Appointment time (12-hour format with AM/PM)
- ✅ Doctor name
- ✅ Clinic address
- ✅ Professional formatting with clinic branding
- ✅ Important reminders (arrive 15 minutes early, bring ID, etc.)

## SMS Content Verification

When you receive an SMS, verify it contains:
- ✅ Clinic name (RCMC Clinic)
- ✅ Patient name (implied by "Your appointment")
- ✅ Appointment date
- ✅ Appointment time
- ✅ Doctor name
- ✅ Message length ≤ 160 characters
- ✅ Clear and concise format

Example SMS:
```
RCMC Clinic: Your appointment is confirmed for 01/15/2025 at 10:00 AM with Dr. Smith. Please arrive 15 mins early.
```

## Troubleshooting

### No Email Received
1. Check spam/junk folder
2. Verify VITE_RESEND_API_KEY is set correctly
3. Check browser console for error logs
4. Verify email address is valid

### No SMS Received
1. Verify SMS Gateway API keys are configured
2. Check phone number format (+639XXXXXXXXX)
3. Check browser console for error logs
4. Verify SMS Gateway service is active

### Appointment Not Created
1. Check browser console for database errors
2. Verify Supabase connection
3. Check network tab for failed requests
4. This should NEVER happen due to notification failures

### Console Errors
1. Read the structured error log
2. Check the `error` field for specific issue
3. Verify `contactInfo` has correct values
4. Check API key configuration

## Success Criteria

All tests should pass with these results:
- ✅ Appointments always created successfully
- ✅ Notifications sent when contact info is valid
- ✅ Graceful handling of missing contact info
- ✅ Proper error logging in console
- ✅ User-friendly success messages
- ✅ No unhandled exceptions
- ✅ Email and SMS content is correct and complete

## Next Steps After Testing

Once all tests pass:
1. Mark Checkpoint 3 as complete
2. Mark Checkpoint 8 as complete
3. Document any issues found
4. Configure production API keys
5. Test in production environment
6. Monitor logs for any issues

## Support

If you encounter issues:
1. Check the IMPLEMENTATION_COMPLETE.md file
2. Review the design.md for specifications
3. Check browser console for detailed error logs
4. Verify API key configuration
5. Test with different email/phone combinations

## Testing Completion Checklist

- [ ] Test 1: Complete online booking - PASSED
- [ ] Test 2: Online booking missing email - PASSED
- [ ] Test 3: Online booking missing phone - PASSED
- [ ] Test 4: Online booking both missing - PASSED
- [ ] Test 5: Walk-in with phone - PASSED
- [ ] Test 6: Walk-in missing phone - PASSED
- [ ] Test 7: Walk-in new patient - PASSED
- [ ] Test 8: Disabled email service - PASSED
- [ ] Test 9: Disabled SMS service - PASSED
- [ ] Test 10: Invalid email format - PASSED
- [ ] Email content verified - PASSED
- [ ] SMS content verified - PASSED
- [ ] Console logs verified - PASSED
- [ ] Error handling verified - PASSED

Once all items are checked, the feature is ready for production!
