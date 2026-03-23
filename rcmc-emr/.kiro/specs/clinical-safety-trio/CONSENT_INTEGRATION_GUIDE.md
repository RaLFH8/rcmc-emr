# Consent Validation Integration Guide

## Overview

This guide explains how to integrate consent validation into patient access workflows throughout the RCMC EMR system.

## Integration Points

### 1. Patient Record Access (Patients.jsx)

Add consent validation when viewing patient details:

```javascript
import { ConsentSummaryPanel } from '../components/consent/ConsentStatusBadge';
import { validatePatientAccess } from '../middleware/consentValidation';

// In the patient details modal/view:
const handleViewPatient = async (patient) => {
  // Validate consent before showing details
  const validation = await validatePatientAccess(patient.id, 'read', user.id);
  
  if (!validation.canProceed && !validation.emergencyOverride) {
    // Show consent required message
    alert('This patient has not provided consent. Please obtain consent before accessing records.');
    setShowConsentForm(true);
    return;
  }
  
  // Proceed with viewing patient
  setViewingPatient(patient);
};

// Add ConsentSummaryPanel to patient details view
<ConsentSummaryPanel 
  patientId={viewingPatient.id}
  onRequestConsent={(type) => handleRequestConsent(viewingPatient.id, type)}
/>
```

### 2. Consultation Creation (Appointments.jsx / Consultations)

Validate consent before creating consultations:

```javascript
const handleStartConsultation = async (appointmentId, patientId) => {
  const validation = await validatePatientAccess(patientId, 'write', user.id);
  
  if (!validation.canProceed) {
    alert('Cannot start consultation: Patient consent required');
    return;
  }
  
  // Proceed with consultation
  await db.createConsultation({ appointment_id: appointmentId, ... });
};
```

### 3. Prescription Creation (Prescriptions.jsx)

Check consent before creating prescriptions:

```javascript
const handleCreatePrescription = async (patientId, prescriptionData) => {
  const validation = await validatePatientAccess(patientId, 'write', user.id);
  
  if (!validation.canProceed) {
    alert('Cannot create prescription: Patient consent required');
    return;
  }
  
  await db.createPrescription(prescriptionData);
};
```

### 4. Lab Results Access (LabResults.jsx)

Validate before viewing/uploading lab results:

```javascript
const handleViewLabResults = async (patientId) => {
  const validation = await validatePatientAccess(patientId, 'read', user.id);
  
  if (!validation.canProceed) {
    alert('Cannot access lab results: Patient consent required');
    return;
  }
  
  // Load and display lab results
};
```

### 5. Billing Operations (Payments.jsx)

Check consent before processing payments:

```javascript
const handleProcessPayment = async (patientId, paymentData) => {
  const validation = await validatePatientAccess(patientId, 'write', user.id);
  
  if (!validation.canProceed) {
    alert('Cannot process payment: Patient consent required');
    return;
  }
  
  await db.createPayment(paymentData);
};
```

## UI Components to Add

### 1. Consent Status Badge in Patient List

Add to each patient row:

```javascript
import { ConsentStatusBadge } from '../components/consent/ConsentStatusBadge';

<ConsentStatusBadge patientId={patient.id} consentType="general_treatment" />
```

### 2. Consent Required Modal

Create a reusable modal component:

```javascript
function ConsentRequiredModal({ patientId, patientName, onConsentObtained, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md">
        <h3 className="text-lg font-semibold mb-4">Consent Required</h3>
        <p className="text-gray-700 mb-4">
          Patient {patientName} has not provided consent for accessing their medical records.
          Would you like to obtain consent now?
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-gray-700 border rounded">
            Cancel
          </button>
          <button onClick={() => setShowConsentForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded">
            Obtain Consent
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 3. Consent Form Integration

Add ConsentForm to patient registration and consent request flows:

```javascript
import ConsentForm from '../components/consent/ConsentForm';

{showConsentForm && (
  <ConsentForm
    patientId={selectedPatient.id}
    patientName={`${selectedPatient.first_name} ${selectedPatient.last_name}`}
    onSuccess={(consent) => {
      setShowConsentForm(false);
      loadPatients(); // Refresh to show updated consent status
    }}
    onCancel={() => setShowConsentForm(false)}
  />
)}
```

## Database Functions Required

Ensure these RPC functions exist in Supabase:

### check_patient_consent

```sql
CREATE OR REPLACE FUNCTION emr.check_patient_consent(
  p_patient_id UUID,
  p_consent_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  has_valid_consent BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM emr.consent_records
    WHERE patient_id = p_patient_id
    AND consent_type = p_consent_type
    AND consent_status = 'active'
    AND expiration_date >= CURRENT_DATE
  ) INTO has_valid_consent;
  
  RETURN has_valid_consent;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### get_expiring_consents

```sql
CREATE OR REPLACE FUNCTION emr.get_expiring_consents(
  days_until_expiration INTEGER DEFAULT 30
) RETURNS TABLE (
  id UUID,
  patient_id UUID,
  consent_type TEXT,
  expiration_date DATE,
  days_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cr.id,
    cr.patient_id,
    cr.consent_type,
    cr.expiration_date,
    (cr.expiration_date - CURRENT_DATE)::INTEGER as days_remaining
  FROM emr.consent_records cr
  WHERE cr.consent_status = 'active'
  AND cr.expiration_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + days_until_expiration)
  ORDER BY cr.expiration_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### get_consent_coverage

```sql
CREATE OR REPLACE FUNCTION emr.get_consent_coverage()
RETURNS TABLE (
  total_patients BIGINT,
  patients_with_consent BIGINT,
  coverage_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT p.id) as total_patients,
    COUNT(DISTINCT CASE 
      WHEN EXISTS (
        SELECT 1 FROM emr.consent_records cr
        WHERE cr.patient_id = p.id
        AND cr.consent_type = 'general_treatment'
        AND cr.consent_status = 'active'
        AND cr.expiration_date >= CURRENT_DATE
      ) THEN p.id 
    END) as patients_with_consent,
    ROUND(
      (COUNT(DISTINCT CASE 
        WHEN EXISTS (
          SELECT 1 FROM emr.consent_records cr
          WHERE cr.patient_id = p.id
          AND cr.consent_type = 'general_treatment'
          AND cr.consent_status = 'active'
          AND cr.expiration_date >= CURRENT_DATE
        ) THEN p.id 
      END)::NUMERIC / NULLIF(COUNT(DISTINCT p.id), 0)) * 100,
      2
    ) as coverage_percentage
  FROM emr.patients p
  WHERE p.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Testing Checklist

- [ ] Patient record access blocked without consent
- [ ] Consultation creation blocked without consent
- [ ] Prescription creation blocked without consent
- [ ] Lab results access blocked without consent
- [ ] Billing operations blocked without consent
- [ ] Emergency access override bypasses consent check
- [ ] Consent status badges display correctly
- [ ] Expiring consent warnings appear
- [ ] Consent form submission works
- [ ] PDF generation works
- [ ] Audit trail logs consent checks

## Implementation Priority

1. **High Priority** (Required for MVP):
   - Patient record access validation
   - Consultation creation validation
   - Consent form integration in patient registration

2. **Medium Priority**:
   - Prescription creation validation
   - Lab results access validation
   - Billing operations validation

3. **Low Priority** (Nice to have):
   - Consent status badges in all lists
   - Expiring consent notifications
   - Bulk consent reminder system

## Notes

- All consent validation should allow emergency access override
- Audit trail must log all consent checks
- UI should clearly indicate why access is blocked
- Provide easy path to obtain consent when missing
- Consider workflow impact - don't block critical emergency care
