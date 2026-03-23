# Features NOT Implemented (Documented vs Actual)

## Overview

This document lists features that were documented in HANDOVER_2.0.md as "implemented" but are **NOT actually present** in the codebase. This is a critical discrepancy between documentation and reality.

---

## ❌ NOT IMPLEMENTED: Patient Type Selection UI

**Documented in HANDOVER_2.0.md as:** Implemented
**Actual Status:** NOT IMPLEMENTED

### What Was Claimed:
- Two buttons: "I'm a New Patient" and "I Have Records"
- Patient type selection at the start of booking flow
- Different workflows based on patient type

### What Actually Exists:
- Simple 3-step booking form (doctor/time → patient info → review)
- No patient type selection buttons
- All patients use the same workflow

### Requirements Affected:
- Requirement 1: Patient Type Selection (1.1-1.5)

### Code Evidence:
- `PublicBooking.jsx` has no patient type selection UI
- No state variable for tracking patient type
- No conditional rendering based on patient type

---

## ❌ NOT IMPLEMENTED: Patient Verification UI

**Documented in HANDOVER_2.0.md as:** Implemented
**Actual Status:** NOT IMPLEMENTED

### What Was Claimed:
- Phone + Date of Birth verification form
- Verification step between doctor selection and patient info
- Success/error messages for verification attempts
- Verification state management

### What Actually Exists:
- Backend function `verifyPatientByPhoneAndDOB()` exists in `supabase.js`
- NO UI component for verification
- NO verification form fields
- NO verification step in the booking flow

### Requirements Affected:
- Requirement 2: Two-Factor Patient Verification (2.1-2.8)

### Code Evidence:
```javascript
// Function EXISTS in supabase.js but is NEVER CALLED
async verifyPatientByPhoneAndDOB(phone, dateOfBirth) {
  // Implementation exists but unused
}
```

- `PublicBooking.jsx` never imports or calls this function
- No verification form in the component
- No verification state variables

---

## ❌ NOT IMPLEMENTED: Pre-Filled Data for Verified Patients

**Documented in HANDOVER_2.0.md as:** Implemented
**Actual Status:** NOT IMPLEMENTED

### What Was Claimed:
- Automatic form population after successful verification
- Pre-filled fields: first name, last name, DOB, gender, phone, email, address
- Data retrieved from existing patient records

### What Actually Exists:
- All form fields are empty by default
- No pre-filling mechanism
- No data retrieval from patient records during booking

### Requirements Affected:
- Requirement 3: Pre-Filled Data for Verified Patients (3.1-3.6)

### Code Evidence:
- `PublicBooking.jsx` initializes all patient data fields as empty strings
- No logic to populate fields from verification results
- No API call to fetch patient data before form display

---

## ❌ NOT IMPLEMENTED: Read-Only Fields for Verified Information

**Documented in HANDOVER_2.0.md as:** Implemented
**Actual Status:** NOT IMPLEMENTED

### What Was Claimed:
- Read-only fields for verified patient information
- Visual indicators (lock icons, disabled styling)
- Only "Reason for Visit" field editable for verified patients

### What Actually Exists:
- ALL fields are editable for ALL patients
- No read-only field logic
- No visual indicators for locked fields
- No distinction between verified and new patients

### Requirements Affected:
- Requirement 3: Pre-Filled Data for Verified Patients (3.2, 3.3, 3.4)

### Code Evidence:
- All input fields in `PublicBooking.jsx` have no `disabled` or `readOnly` attributes
- No conditional rendering based on verification status
- No lock icons or disabled styling

---

## ❌ NOT IMPLEMENTED: Verification State Management

**Documented in HANDOVER_2.0.md as:** Implemented
**Actual Status:** NOT IMPLEMENTED

### What Was Claimed:
- State tracking for verification status
- Conditional rendering based on verification
- Error handling for failed verification
- Success messages for successful verification

### What Actually Exists:
- No verification state variables
- No verification status tracking
- No verification-related error handling
- No verification success/failure messages

### Requirements Affected:
- Requirement 2: Two-Factor Patient Verification (2.4, 2.5)
- Requirement 11: Error Handling and User Feedback (11.1)

### Code Evidence:
```javascript
// PublicBooking.jsx state - NO verification-related state
const [step, setStep] = useState(1);
const [doctors, setDoctors] = useState([]);
const [selectedDoctor, setSelectedDoctor] = useState(null);
// ... NO verificationStatus, isVerified, verifiedPatientId, etc.
```

---

## ✅ WHAT IS ACTUALLY IMPLEMENTED

For comparison, here's what IS working in the system:

### 1. Simple 3-Step Booking Workflow
- Step 1: Select doctor, date, and time
- Step 2: Enter patient information (all fields editable)
- Step 3: Review and confirm booking

### 2. Time Slot Management
- ✅ Time slot generation (10:00 AM - 5:00 PM, 20-minute intervals)
- ✅ Past time slot filtering for today's date
- ✅ Booked slot filtering (prevents double-booking)
- ✅ Real-time availability checking

### 3. Patient Record Management
- ✅ Duplicate patient detection by phone OR email
- ✅ Automatic patient record creation for new patients
- ✅ Automatic patient linking for existing patients
- ✅ Patient number generation (P000001 format)

### 4. Appointment Creation
- ✅ Appointment creation with booking_source='online'
- ✅ Appointment creation with booking_status='pending'
- ✅ Appointment creation with status='Scheduled'
- ✅ Confirmation screen with appointment details

### 5. Security & Compliance
- ✅ RLS policies for public access
- ✅ No PHI exposure in public interface
- ✅ Parameterized queries (SQL injection prevention)
- ✅ Input validation and sanitization

---

## Impact Analysis

### User Experience Impact:
- **Existing patients** must re-enter all their information every time they book
- **No verification** means potential for data inconsistencies if patient enters different information
- **No pre-filled data** increases booking friction and time

### System Impact:
- Backend verification function exists but is unused (dead code)
- Requirements 1, 2, and 3 are documented but not fulfilled
- HANDOVER_2.0.md is misleading and inaccurate

### Documentation Impact:
- Major discrepancy between documentation and implementation
- Future developers may be confused by the mismatch
- Maintenance and enhancement planning affected

---

## Decision Made: Keep Simple Workflow

**Date:** February 27, 2026

After analysis, the decision was made to **keep the simple 3-step booking workflow** and NOT implement the verification features. This decision was based on:

1. Current system is functional and deployed
2. Verification adds complexity without significant value
3. Duplicate detection already prevents data issues
4. Better UX with simpler workflow
5. Time better spent on higher-value features (SMS reminders, patient portal, email confirmations)

## Cleanup Completed

### ✅ Dead Code Removed
- Deleted unused `verifyPatientByPhoneAndDOB()` function from `supabase.js` (was at lines 1367-1384)
- Function existed but was never called anywhere in the codebase
- No other verification-related code found

### Status: CLEANUP COMPLETE

The codebase is now clean with no unused verification code. The system continues to work with its simple, effective 3-step booking workflow.

---

## Conclusion

The online booking system is **functional and production-ready** with its current simple workflow. However, there is a significant gap between what was documented in HANDOVER_2.0.md and what was actually built.

The retrospective spec (requirements.md, design.md, tasks.md) now accurately documents the ACTUAL implementation, not the claimed implementation.

**Current Status:** ✅ Working system with accurate documentation
**Missing Features:** Patient verification UI, pre-filled data, read-only fields
**Recommendation:** Update HANDOVER_2.0.md to match reality OR implement missing features
