# Consultation Module - Testing Guide

## Server Status
✅ Server is running on: **http://localhost:54323**

## How to Test the Consultation Module

### Step 1: Login
1. Open your browser and go to: **http://localhost:54323**
2. Login with:
   - Username: `admin`
   - Password: `admin123`

### Step 2: Navigate to Consultations
1. Click on "🩺 Consultations" in the left sidebar
2. You should see the Consultation Management page

### Step 3: Create a New Consultation
1. Click the "+ New Consultation" button
2. A modal will open with the SOAP note form

### Step 4: Fill Out the Form

**Patient & Doctor Selection:**
- Select a patient from the dropdown (you should see patients if any were registered)
- Select a doctor from the dropdown (default doctors: Dr. Juan dela Cruz, Dr. Maria Santos)
- Patient history will automatically load when you select a patient

**S - Subjective (Chief Complaint):**
- Enter the patient's complaint, e.g., "Fever for 3 days, headache, body aches"

**O - Objective (Vital Signs):**
- Fill in vital signs:
  - BP: 120/80
  - Temp: 38.5
  - HR: 85
  - RR: 18
  - Weight: 65
  - Height: 165
  - O2 Sat: 98
- BMI will auto-calculate when you enter weight and height

**A - Assessment (Diagnosis):**
- Enter diagnosis, e.g., "Acute viral infection, possible influenza"

**P - Plan (Treatment):**
- Treatment Plan: "Rest, hydration, symptomatic treatment"
- Prescription (Rx): 
  ```
  Paracetamol 500mg, 1 tab every 6 hours PRN for fever
  Vitamin C 500mg, 1 tab OD x 7 days
  ```
- Follow-up Date: Select a date (optional)
- Additional Notes: "Return if fever persists beyond 3 days"

### Step 5: Save and Verify
1. Click "Save Consultation"
2. You should see a success message with the consultation ID
3. The modal will close automatically
4. The consultation should appear in the "Recent Consultations" table

### Features to Test

✅ **Patient History Loading:**
- When you select a patient, their allergies, medical history, and previous consultation count should appear

✅ **BMI Auto-Calculation:**
- Enter weight and height, BMI should calculate automatically

✅ **Form Validation:**
- Try submitting without required fields (Patient, Doctor, Chief Complaint, Diagnosis, Treatment Plan)
- You should see validation errors

✅ **View Consultation:**
- Click "View" button on any consultation in the list
- Currently shows an alert (full view modal coming in next update)

## Troubleshooting

**If you don't see any patients in the dropdown:**
1. Go to "👥 Patients" page
2. Register a test patient first
3. Then return to Consultations

**If the form doesn't submit:**
1. Check browser console (F12) for errors
2. Make sure all required fields are filled
3. Verify the server is running on port 54323

**If patient history doesn't load:**
- This is normal if the patient has no previous consultations
- The system will show "Previous Consultations: 0"

## Next Steps

After testing, we can add:
- View consultation details modal
- Edit consultation functionality
- Print consultation report
- Search/filter consultations
- Export to PDF

## Current System Status

**Working Modules:**
- ✅ Login/Authentication
- ✅ Dashboard (basic)
- ✅ Patients (register, search, list)
- ✅ Doctors (add, edit, list)
- ✅ Items & Pricing (add, edit, filter)
- ✅ Consultations (SOAP notes, vital signs, Rx, patient history) - **READY TO TEST**

**Not Yet Created:**
- ⏳ Appointments
- ⏳ Billing
- ⏳ Enhanced Dashboard with metrics/charts
- ⏳ Reports module
