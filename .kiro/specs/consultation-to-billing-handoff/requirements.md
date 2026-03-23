# Requirements Document

## Introduction

This feature establishes a streamlined workflow that automatically transfers patient information from the consultation module to the billing module when a doctor completes a consultation. The receptionist will see the consulted patient appear in their billing queue and can immediately process payment without manual data entry or searching.

## Glossary

- **Consultation_Module**: The system component where doctors record patient consultations and medical notes
- **Billing_Module**: The system component where receptionists process patient payments
- **Consultation_Record**: A database record containing patient consultation details, status, and timestamps
- **Billing_Queue**: The list of patients awaiting payment processing displayed to receptionists
- **Complete_Consultation_Action**: The doctor's action that marks a consultation as finished and triggers billing handoff
- **Receptionist_Interface**: The billing page UI where receptionists view and process payments
- **Patient_Context**: The complete patient information transferred between modules (name, ID, consultation details)
- **Handoff_Status**: The state tracking whether a consultation has been transferred to billing (pending_billing, billed, cancelled)

## Requirements

### Requirement 1: Consultation Completion Trigger

**User Story:** As a doctor, I want to click "Complete Consultation" to finish a patient visit, so that the patient is automatically queued for billing.

#### Acceptance Criteria

1. WHEN a doctor clicks "Complete Consultation", THE Consultation_Module SHALL update the Consultation_Record status to "pending_billing"
2. WHEN a doctor clicks "Complete Consultation", THE Consultation_Module SHALL record the completion timestamp
3. WHEN the Consultation_Record status changes to "pending_billing", THE System SHALL persist this change to the database immediately
4. THE Consultation_Module SHALL prevent duplicate completion actions on the same Consultation_Record
5. IF a Consultation_Record is already marked "pending_billing" or "billed", THEN THE System SHALL disable the "Complete Consultation" button

### Requirement 2: Patient Information Transfer

**User Story:** As a receptionist, I want to see the patient's name and consultation details automatically appear in my billing queue, so that I can process payment without searching for the patient.

#### Acceptance Criteria

1. WHEN a Consultation_Record status becomes "pending_billing", THE System SHALL make the Patient_Context visible in the Billing_Queue
2. THE Billing_Queue SHALL display the patient's full name, consultation date, and consultation time
3. THE Billing_Queue SHALL order patients by consultation completion time (most recent first)
4. WHEN multiple consultations are completed, THE Billing_Queue SHALL display all pending patients without data loss
5. THE System SHALL transfer the patient_id, consultation_id, and doctor_id as part of the Patient_Context

### Requirement 3: Real-Time Billing Queue Updates

**User Story:** As a receptionist, I want the billing queue to update automatically when consultations are completed, so that I don't need to refresh the page manually.

#### Acceptance Criteria

1. WHEN a Consultation_Record status changes to "pending_billing", THE Billing_Module SHALL update the Receptionist_Interface within 2 seconds
2. THE Billing_Module SHALL subscribe to database changes on the consultations table
3. WHEN the Receptionist_Interface receives a new pending consultation, THE System SHALL display a visual notification
4. THE Billing_Module SHALL maintain the current billing queue order when new patients are added
5. IF the database connection is lost, THEN THE System SHALL display a connection status warning to the receptionist

### Requirement 4: Billing Process Completion

**User Story:** As a receptionist, I want to complete the billing process for a consulted patient, so that the patient is removed from my queue and marked as paid.

#### Acceptance Criteria

1. WHEN a receptionist completes payment for a patient, THE Billing_Module SHALL update the Handoff_Status to "billed"
2. WHEN the Handoff_Status becomes "billed", THE System SHALL remove the patient from the Billing_Queue
3. THE Billing_Module SHALL record the payment amount, payment method, and payment timestamp
4. THE System SHALL link the payment record to the original Consultation_Record via consultation_id
5. WHEN payment is completed, THE System SHALL update both the consultations table and payments table in a single transaction

### Requirement 5: Consultation-Billing Data Integrity

**User Story:** As a system administrator, I want consultation and billing records to remain synchronized, so that financial reports are accurate and auditable.

#### Acceptance Criteria

1. FOR ALL Consultation_Records with status "pending_billing", THE System SHALL ensure a corresponding entry exists in the Billing_Queue
2. FOR ALL completed payments, THE System SHALL ensure the referenced Consultation_Record exists and is valid
3. THE System SHALL prevent deletion of Consultation_Records that have associated payment records
4. WHEN a Consultation_Record is cancelled before billing, THE System SHALL update the Handoff_Status to "cancelled" and remove it from the Billing_Queue
5. THE System SHALL maintain referential integrity between consultations, patients, and payments tables

### Requirement 6: Billing Queue Filtering and Search

**User Story:** As a receptionist, I want to filter and search the billing queue, so that I can quickly find specific patients during busy periods.

#### Acceptance Criteria

1. THE Receptionist_Interface SHALL provide a search field that filters by patient name
2. WHEN a receptionist types in the search field, THE Billing_Queue SHALL filter results in real-time
3. THE Receptionist_Interface SHALL display the total count of pending billing patients
4. WHERE the receptionist has multiple patients with similar names, THE System SHALL display additional identifiers (patient ID, age, or contact number)
5. THE Billing_Queue SHALL preserve the original sort order when search filters are cleared

### Requirement 7: Consultation Details Visibility in Billing

**User Story:** As a receptionist, I want to view consultation details while processing billing, so that I can verify services rendered and answer patient questions.

#### Acceptance Criteria

1. WHEN a receptionist selects a patient from the Billing_Queue, THE Receptionist_Interface SHALL display the consultation summary
2. THE Receptionist_Interface SHALL display the consulting doctor's name
3. THE Receptionist_Interface SHALL display any prescribed medications or services from the consultation
4. THE Receptionist_Interface SHALL display the consultation notes (read-only)
5. WHERE consultation includes billable items, THE System SHALL pre-populate the billing amount based on services rendered

### Requirement 8: Error Handling and Recovery

**User Story:** As a receptionist, I want clear error messages when billing fails, so that I can take corrective action without losing patient data.

#### Acceptance Criteria

1. IF payment processing fails, THEN THE System SHALL display a specific error message to the receptionist
2. IF payment processing fails, THEN THE System SHALL keep the patient in the Billing_Queue with status "pending_billing"
3. WHEN a network error occurs during payment submission, THE System SHALL allow the receptionist to retry the operation
4. THE System SHALL log all failed payment attempts with timestamp and error details
5. IF a Consultation_Record is missing required data, THEN THE System SHALL display a validation error before allowing billing

### Requirement 9: Historical Billing Records

**User Story:** As a receptionist, I want to view recently billed patients, so that I can verify completed transactions and handle patient inquiries.

#### Acceptance Criteria

1. THE Receptionist_Interface SHALL provide a "Recently Billed" section showing the last 20 completed payments
2. THE Recently_Billed section SHALL display patient name, billing time, amount, and payment method
3. WHEN a receptionist clicks on a recently billed patient, THE System SHALL display the full payment receipt
4. THE Recently_Billed section SHALL update automatically when new payments are completed
5. THE System SHALL allow receptionists to search historical billing records by patient name or date range

### Requirement 10: Multi-Receptionist Support

**User Story:** As a clinic manager, I want multiple receptionists to process billing simultaneously, so that patient wait times are minimized during peak hours.

#### Acceptance Criteria

1. WHEN multiple receptionists access the Billing_Module, THE System SHALL display the same Billing_Queue to all users
2. WHEN one receptionist begins processing a patient's billing, THE System SHALL mark that patient as "in progress" for other receptionists
3. WHEN a patient is marked "in progress", THE System SHALL prevent other receptionists from processing the same patient simultaneously
4. WHEN a receptionist completes or cancels a billing session, THE System SHALL release the "in progress" lock within 1 second
5. IF a receptionist's session becomes inactive for 5 minutes while processing billing, THEN THE System SHALL automatically release the lock
