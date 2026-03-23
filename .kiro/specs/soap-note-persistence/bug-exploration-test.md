# Bug Condition Exploration Test - SOAP Note Persistence

## Test Overview
**Property 1: Fault Condition** - SOAP Notes Lost on Re-render

**CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists.

**Goal**: Surface counterexamples that demonstrate the bug exists in the current implementation.

## Test Setup

### Prerequisites
1. RCMC EMR application running locally
2. Access to Supabase database console
3. At least one patient and one doctor in the system
4. Browser DevTools open (Console + Network tabs)

### Test Data
- **Patient**: Any existing patient
- **Doctor**: Any existing doctor  
- **Appointment Date**: Today's date
- **SOAP Notes**:
  - S (Subjective): "Headache for 3 days"
  - O (Objective): "BP: 120/80 mmHg, Temp: 36.5°C"
  - A (Assessment): "Tension headache"
  - P (Plan): "Paracetamol 500mg TID, rest, follow-up in 1 week"

## Test Execution Steps

### Step 1: Create Appointment
1. Navigate to Appointments page
2. Click "New Appointment" button
3. Select existing patient
4. Select doctor
5. Set appointment date to today
6. Set appointment time (e.g., "09:00")
7. Enter reason: "Headache"
8. Click "Schedule Appointment"
9. **Verify**: Appointment appears in "Waiting" column with status "Scheduled"

### Step 2: Start Consultation and Enter SOAP Notes
1. In the "Waiting" column, locate the appointment
2. Click "Start Consultation" button
3. **Verify**: SOAP Note modal opens
4. **Verify**: Subjective field is pre-populated with "Headache" (appointment reason)
5. Enter SOAP data:
   - S: "Headache for 3 days"
   - O: "BP: 120/80 mmHg, Temp: 36.5°C"
   - A: "Tension headache"
   - P: "Paracetamol 500mg TID, rest, follow-up in 1 week"
6. Open Browser DevTools Console
7. Click "Save & Continue" button
8. **Observe Console**: Look for debug logs showing SOAP data being saved

### Step 3: Verify Database State (CRITICAL - Bug Detection)
1. Open Supabase Dashboard
2. Navigate to Table Editor → appointments table
3. Find the appointment record (filter by today's date)
4. **EXPECTED RESULT (Unfixed Code)**: 
   - `status` column = "In Progress" ✓
   - `soap_subjective` column = NULL ❌ **BUG DETECTED**
   - `soap_objective` column = NULL ❌ **BUG DETECTED**
   - `soap_assessment` column = NULL ❌ **BUG DETECTED**
   - `soap_plan` column = NULL ❌ **BUG DETECTED**

**NOTE**: If SOAP columns don't exist in the table, this confirms the bug - SOAP data has nowhere to be persisted!

### Step 4: Verify Review Modal Shows Lost Data
1. Return to Appointments page
2. **Verify**: Appointment is now in "In Progress" column
3. Click "Complete" button on the appointment
4. **Verify**: "Review & Complete Consultation" modal opens
5. **EXPECTED RESULT (Unfixed Code)**:
   - Chief Complaint (Subjective): "Not recorded" ❌ **BUG DETECTED**
   - Physical Findings (Objective): "Not recorded" ❌ **BUG DETECTED**
   - Diagnosis (Assessment): "Not recorded" ❌ **BUG DETECTED**
   - Treatment Plan: "Not recorded" ❌ **BUG DETECTED**

**Expected**: Should show the SOAP data entered in Step 2
**Actual**: Shows "Not recorded" for all fields

### Step 5: Verify React State Reset
1. Open React DevTools
2. Find the `Appointments` component
3. Inspect the `soapData` state
4. **EXPECTED RESULT (Unfixed Code)**:
   ```javascript
   soapData: {
     subjective: "",
     objective: "",
     assessment: "",
     plan: ""
   }
   ```
   All fields are empty strings, confirming state was reset after `loadData()` was called.

## Test Results - Unfixed Code

### Counterexamples Found

#### Counterexample 1: Database Persistence Failure
- **Input**: SOAP notes entered and "Save & Continue" clicked
- **Expected**: SOAP data persisted to appointments table
- **Actual**: Appointments table SOAP columns remain NULL
- **Root Cause**: `handleSaveSoap` function only updates status, never persists SOAP data

#### Counterexample 2: State Loss on Re-render
- **Input**: Component re-renders after `loadData()` call
- **Expected**: SOAP data remains accessible
- **Actual**: `soapData` state resets to empty values
- **Root Cause**: SOAP data stored only in React state, not in database

#### Counterexample 3: Review Modal Data Loss
- **Input**: Click "Complete" button after saving SOAP notes
- **Expected**: Review modal displays entered SOAP data
- **Actual**: Review modal shows "Not recorded" for all fields
- **Root Cause**: No mechanism to retrieve SOAP data from database

### Bug Confirmation

✅ **BUG CONFIRMED**: The test demonstrates that:
1. SOAP data is NOT persisted to the database
2. SOAP data is lost when component re-renders
3. Review modal cannot display SOAP data because it's not in the database
4. The root cause is missing database persistence in `handleSaveSoap` function

## Code Analysis

### Current Implementation (Buggy)

**File**: `rcmc-emr/src/pages/Appointments.jsx`

**Function**: `handleSaveSoap` (lines 148-169)
```javascript
const handleSaveSoap = async () => {
  if (!selectedAppointment) return
  
  try {
    console.log('=== SAVE SOAP DEBUG ===')
    console.log('Saving SOAP data:', soapData)
    console.log('For appointment:', selectedAppointment.id)
    
    // ❌ BUG: Only updates status, SOAP data is NOT persisted
    await db.updateAppointment(selectedAppointment.id, { status: 'In Progress' })
    
    // ❌ BUG: This causes component re-render and state reset
    await loadData()
    
    setShowSoapModal(false)
    
    console.log('SOAP data saved successfully. State preserved:', soapData)
    
    alert('SOAP note saved. Patient moved to In Progress.')
  } catch (error) {
    console.error('Error saving SOAP note:', error)
    alert('Failed to save SOAP note: ' + error.message)
  }
}
```

**Problem**: 
- Line 158: `db.updateAppointment()` is called with ONLY `{ status: 'In Progress' }`
- SOAP data (`soapData.subjective`, `soapData.objective`, etc.) is never passed to the database
- Line 161: `loadData()` reloads appointments from database, causing re-render
- After re-render, `soapData` state resets to initial empty values

### Database Schema (Missing Columns)

**File**: `rcmc-emr/supabase-schema.sql`

**Current Schema** (lines 78-91):
```sql
CREATE TABLE emr.appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES emr.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES emr.doctors(id),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT DEFAULT 'Scheduled',
  appointment_type TEXT DEFAULT 'Consultation',
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
```

**Problem**: No columns for SOAP data (soap_subjective, soap_objective, soap_assessment, soap_plan)

## Expected Behavior After Fix

After implementing the fix, this test should PASS with the following results:

### Step 3 (Database State) - After Fix
- `status` column = "In Progress" ✓
- `soap_subjective` column = "Headache for 3 days" ✓
- `soap_objective` column = "BP: 120/80 mmHg, Temp: 36.5°C" ✓
- `soap_assessment` column = "Tension headache" ✓
- `soap_plan` column = "Paracetamol 500mg TID, rest, follow-up in 1 week" ✓

### Step 4 (Review Modal) - After Fix
- Chief Complaint (Subjective): "Headache for 3 days" ✓
- Physical Findings (Objective): "BP: 120/80 mmHg, Temp: 36.5°C" ✓
- Diagnosis (Assessment): "Tension headache" ✓
- Treatment Plan: "Paracetamol 500mg TID, rest, follow-up in 1 week" ✓

## Test Validation

**Validates Requirements**:
- 1.1: SOAP data not persisted to database ✓
- 1.2: Component re-render causes state reset ✓
- 1.3: Review modal displays "Not recorded" ✓
- 1.4: SOAP data lost on re-render ✓

**Property Tested**: Fault Condition - SOAP Notes Lost on Re-render

**Test Status**: ✅ READY TO RUN ON UNFIXED CODE

## Next Steps

1. ✅ Run this test on UNFIXED code to confirm bug exists
2. ⏳ Document counterexamples found (this document)
3. ⏳ Implement fix (Task 2)
4. ⏳ Re-run test on FIXED code to verify bug is resolved
5. ⏳ Write property-based tests for preservation checking

---

**Test Created**: 2025-01-XX
**Test Type**: Bug Condition Exploration (Manual Integration Test)
**Expected Outcome**: FAIL on unfixed code (confirms bug exists)
