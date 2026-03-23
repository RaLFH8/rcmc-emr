# SOAP Note Persistence Bugfix Design

## Overview

This design addresses a critical bug where SOAP notes (Subjective, Objective, Assessment, Plan) entered during consultations are stored only in React component state and lost on re-render. The fix adds four new columns to the appointments table to persist in-progress SOAP notes, ensuring data survives component re-renders and page refreshes. When a consultation is completed, the SOAP data is transferred from the appointments table to the consultations table as part of the permanent medical record.

The approach leverages the existing appointments table workflow where status transitions from "Scheduled" → "In Progress" → "Completed". SOAP notes are temporary during "In Progress" status and become permanent in the consultations table upon completion.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when SOAP notes are entered and "Save & Continue" is clicked, but the component re-renders (via loadData() or navigation), causing state reset
- **Property (P)**: The desired behavior - SOAP notes must persist to the database and be retrievable after component re-renders
- **Preservation**: Existing consultation workflow, appointment status transitions, and modal behaviors that must remain unchanged
- **soapData**: React state variable (lines 40-45 of Appointments.jsx) that stores SOAP notes in memory
- **handleSaveSoap**: Function (lines 148-169) that currently only updates appointment status without persisting SOAP data
- **handleCompleteConsultation**: Function (lines 171-226) that reads from soapData state and creates consultation record
- **loadData**: Function (lines 56-70) that reloads appointments from database, triggering component re-render and state reset
- **In Progress Status**: Appointment status indicating active consultation with temporary SOAP notes stored in appointments table
- **Completed Status**: Appointment status indicating finished consultation with permanent SOAP notes stored in consultations table

## Bug Details

### Fault Condition

The bug manifests when a doctor enters SOAP notes in the "Start Consultation" modal, clicks "Save & Continue", and then the component re-renders (either from loadData() being called after status update, or from navigation/page refresh). The `handleSaveSoap` function updates only the appointment status to "In Progress" without persisting the SOAP data to the database. When `loadData()` executes, it reloads appointments from the database and the component re-renders, resetting the `soapData` state to its initial empty values.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { soapData: Object, action: String, componentState: String }
  OUTPUT: boolean
  
  RETURN input.soapData.subjective != '' OR 
         input.soapData.objective != '' OR 
         input.soapData.assessment != '' OR 
         input.soapData.plan != ''
         AND input.action == 'Save & Continue'
         AND componentState == 'will re-render after loadData()'
END FUNCTION
```

### Examples

- **Example 1**: Doctor enters SOAP notes (S: "Headache for 3 days", O: "BP: 120/80", A: "Tension headache", P: "Paracetamol 500mg"), clicks "Save & Continue", appointment moves to "In Progress" column, doctor clicks "Complete" button → Review modal shows "Not recorded" for all fields instead of the entered data

- **Example 2**: Doctor enters SOAP notes, clicks "Save & Continue", then navigates to Prescriptions page and returns → SOAP data is lost because component unmounted and remounted

- **Example 3**: Doctor enters SOAP notes, clicks "Save & Continue", then refreshes the browser → All SOAP data is lost because it was never persisted to database

- **Edge Case**: Doctor enters partial SOAP notes (only Subjective and Objective), clicks "Save & Continue", then later opens Review modal → Should display the partial data that was saved, not "Not recorded"

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Pre-population of Subjective field with appointment reason when "Start Consultation" modal opens
- Appointment status update to "In Progress" when "Save & Continue" is clicked
- Patient card movement to "In Progress" column in queue view
- Creation of consultation record in consultations table with SOAP data formatted in notes field
- Discard of entered data when SOAP modal is cancelled without saving
- Display of appointments grouped by status in queue view
- Navigation to Prescriptions page with patient ID in sessionStorage when "Prescribe" is clicked

**Scope:**
All inputs that do NOT involve the "Save & Continue" action with SOAP data should be completely unaffected by this fix. This includes:
- Appointment creation and scheduling workflow
- Status changes via dropdown in timeline view
- Direct status updates without SOAP data entry
- Consultation completion for appointments that never had SOAP notes entered

## Hypothesized Root Cause

Based on the bug description and code analysis, the root cause is:

1. **Missing Database Persistence**: The `handleSaveSoap` function (lines 148-169) calls `db.updateAppointment()` with only `{ status: 'In Progress' }`, never passing the SOAP data to be persisted

2. **State-Only Storage**: SOAP data is stored exclusively in the `soapData` React state variable (lines 40-45), which is reset to initial values when the component re-renders

3. **Forced Re-render**: After updating appointment status, `loadData()` is called (line 163), which fetches fresh data from the database and causes component re-render, resetting all state including `soapData`

4. **No Retrieval Mechanism**: When the Review modal opens (lines 453-459), it displays `soapData` from state, but there's no code to load SOAP data from the database for "In Progress" appointments

## Correctness Properties

Property 1: Fault Condition - SOAP Notes Persist Across Re-renders

_For any_ SOAP data entered in the "Start Consultation" modal where "Save & Continue" is clicked, the fixed handleSaveSoap function SHALL persist all four SOAP fields (subjective, objective, assessment, plan) to the appointments table, and the data SHALL be retrievable from the database after component re-renders, page refreshes, or navigation events.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Existing Workflow Unchanged

_For any_ appointment workflow action that does NOT involve SOAP data entry (appointment creation, status changes via dropdown, consultation completion without prior SOAP entry, modal cancellation), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing functionality for non-SOAP interactions.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `rcmc-emr/supabase-schema.sql`

**Database Schema Changes**:
1. **Add SOAP Columns to Appointments Table**: Add four new TEXT columns to store in-progress SOAP notes
   ```sql
   ALTER TABLE emr.appointments 
   ADD COLUMN soap_subjective TEXT,
   ADD COLUMN soap_objective TEXT,
   ADD COLUMN soap_assessment TEXT,
   ADD COLUMN soap_plan TEXT;
   ```

2. **Add Index for Performance**: Create index on status column for faster queries filtering "In Progress" appointments
   ```sql
   -- Index already exists: idx_appointments_status
   ```

**File**: `rcmc-emr/src/lib/supabase.js`

**Function**: `updateAppointment`

**Specific Changes**:
1. **No changes needed**: The function already accepts an `updates` object and passes all fields to Supabase. The fix is in how we call this function.

2. **Update getAppointments to include SOAP fields**: The function already uses `SELECT *` which will automatically include the new SOAP columns.

**File**: `rcmc-emr/src/pages/Appointments.jsx`

**Function**: `handleSaveSoap` (lines 148-169)

**Specific Changes**:
1. **Persist SOAP Data**: Update the `db.updateAppointment()` call to include SOAP fields
   ```javascript
   await db.updateAppointment(selectedAppointment.id, { 
     status: 'In Progress',
     soap_subjective: soapData.subjective,
     soap_objective: soapData.objective,
     soap_assessment: soapData.assessment,
     soap_plan: soapData.plan
   })
   ```

2. **Keep existing loadData() call**: This ensures the UI updates with the persisted data

**Function**: `handleStartConsultation` (lines 140-147)

**Specific Changes**:
1. **Load Existing SOAP Data**: Check if appointment has existing SOAP data and load it
   ```javascript
   setSoapData({
     subjective: apt.soap_subjective || apt.reason || '',
     objective: apt.soap_objective || '',
     assessment: apt.soap_assessment || '',
     plan: apt.soap_plan || ''
   })
   ```

**Function**: `handleCompleteConsultation` (lines 171-226)

**Specific Changes**:
1. **Load SOAP Data from Database**: For "In Progress" appointments, load SOAP data from the appointment record instead of relying on state
   ```javascript
   // Before creating consultation record, fetch latest appointment data
   const { data: latestAppointment } = await db.getAppointmentById(selectedAppointment.id)
   
   // Use database values if state is empty (handles re-render case)
   const finalSoapData = {
     subjective: soapData.subjective || latestAppointment.soap_subjective || '',
     objective: soapData.objective || latestAppointment.soap_objective || '',
     assessment: soapData.assessment || latestAppointment.soap_assessment || '',
     plan: soapData.plan || latestAppointment.soap_plan || ''
   }
   ```

2. **Clear SOAP Fields After Completion**: After creating consultation record, clear the SOAP fields from appointments table
   ```javascript
   await db.updateAppointment(selectedAppointment.id, { 
     status: 'Completed',
     soap_subjective: null,
     soap_objective: null,
     soap_assessment: null,
     soap_plan: null
   })
   ```

**New Function Needed**: `getAppointmentById` in supabase.js

**Specific Changes**:
1. **Add Helper Function**: Create function to fetch single appointment by ID
   ```javascript
   async getAppointmentById(id) {
     const { data, error } = await supabase
       .from('appointments')
       .select(`
         *,
         patient:patients(*),
         doctor:doctors(*)
       `)
       .eq('id', id)
       .single()
     
     if (error) throw error
     return data
   }
   ```

**Review Modal Data Display** (lines 953-959)

**Specific Changes**:
1. **Load SOAP Data on Modal Open**: When Review modal opens, fetch latest appointment data to ensure SOAP fields are current
   ```javascript
   onClick={async () => {
     // Fetch latest appointment data with SOAP fields
     const latestApt = await db.getAppointmentById(apt.id)
     setSelectedAppointment(latestApt)
     
     // Load SOAP data from database
     setSoapData({
       subjective: latestApt.soap_subjective || '',
       objective: latestApt.soap_objective || '',
       assessment: latestApt.soap_assessment || '',
       plan: latestApt.soap_plan || ''
     })
     
     setShowReviewModal(true)
   }}
   ```

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Fault Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate the SOAP note entry workflow, verify data is NOT persisted in unfixed code, then apply the fix and verify data IS persisted. Use browser DevTools to inspect database state and React component state.

**Test Cases**:
1. **Basic SOAP Entry Test**: Enter SOAP notes, click "Save & Continue", inspect appointments table in Supabase → SOAP columns should be NULL in unfixed code (will fail on unfixed code)
2. **Re-render Test**: Enter SOAP notes, click "Save & Continue", click "Complete" button → Review modal shows "Not recorded" in unfixed code (will fail on unfixed code)
3. **Navigation Test**: Enter SOAP notes, click "Save & Continue", navigate to Prescriptions and back → SOAP data lost in unfixed code (will fail on unfixed code)
4. **Partial Data Test**: Enter only Subjective and Objective, click "Save & Continue", click "Complete" → Should show partial data but shows "Not recorded" in unfixed code (will fail on unfixed code)

**Expected Counterexamples**:
- Appointments table SOAP columns remain NULL after "Save & Continue"
- Review modal displays "Not recorded" instead of entered SOAP data
- React DevTools shows soapData state resets to empty values after loadData()
- Possible causes: Missing database persistence in handleSaveSoap, no retrieval mechanism in Review modal

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := handleSaveSoap_fixed(input)
  ASSERT soapDataPersistedToDatabase(result)
  ASSERT soapDataRetrievableAfterRerender(result)
END FOR
```

**Test Plan**: After applying the fix, verify SOAP data persists to database and is retrievable in all scenarios.

**Test Cases**:
1. **Database Persistence Test**: Enter SOAP notes, click "Save & Continue", query appointments table → SOAP columns should contain entered data
2. **Re-render Retrieval Test**: Enter SOAP notes, click "Save & Continue", click "Complete" → Review modal displays correct SOAP data
3. **Page Refresh Test**: Enter SOAP notes, click "Save & Continue", refresh browser, click "Complete" → SOAP data still present
4. **Partial Data Persistence**: Enter only some SOAP fields, verify partial data is saved and retrieved correctly
5. **Multiple Save Test**: Enter SOAP notes, save, edit them, save again → Latest version is persisted
6. **Consultation Completion Test**: Complete consultation, verify SOAP data transferred to consultations table and cleared from appointments table

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT originalBehavior(input) = fixedBehavior(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for non-SOAP workflows, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Appointment Creation Preservation**: Observe that creating appointments works correctly on unfixed code, then verify this continues after fix
2. **Status Change Preservation**: Observe that changing status via dropdown works correctly on unfixed code, then verify this continues after fix
3. **Modal Cancellation Preservation**: Observe that cancelling SOAP modal discards data on unfixed code, then verify this continues after fix
4. **Queue View Preservation**: Observe that queue view displays appointments correctly on unfixed code, then verify this continues after fix
5. **Prescribe Navigation Preservation**: Observe that "Prescribe" button navigation works on unfixed code, then verify this continues after fix
6. **Consultation Without SOAP Preservation**: Observe that completing consultations without prior SOAP entry works on unfixed code, then verify this continues after fix

### Unit Tests

- Test handleSaveSoap persists all four SOAP fields to database
- Test handleStartConsultation loads existing SOAP data from appointment record
- Test handleCompleteConsultation retrieves SOAP data from database when state is empty
- Test handleCompleteConsultation clears SOAP fields from appointments table after completion
- Test Review modal loads latest SOAP data from database on open
- Test edge cases: empty SOAP fields, partial SOAP data, NULL values

### Property-Based Tests

- Generate random SOAP data entries and verify persistence across re-renders
- Generate random appointment workflows and verify SOAP data integrity throughout
- Test that all non-SOAP appointment operations continue to work across many scenarios
- Generate random sequences of save/edit/complete actions and verify data consistency

### Integration Tests

- Test full workflow: Create appointment → Start consultation → Enter SOAP → Save → Navigate away → Return → Complete consultation
- Test multiple doctors working on different patients simultaneously with SOAP notes
- Test SOAP data persistence across browser refresh and session restoration
- Test that completed consultations have SOAP data in consultations table and NOT in appointments table
- Test visual feedback: SOAP data displays correctly in Review modal after various user actions
