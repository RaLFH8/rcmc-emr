# Implementation Plan: Consultation to Billing Handoff

## Overview

This implementation plan breaks down the consultation-to-billing-handoff feature into discrete, manageable coding tasks. The feature automates the transfer of patient information from consultations to billing using Supabase real-time subscriptions, database triggers, and React Context API. Each task builds incrementally on previous work, with property-based tests using fast-check to validate correctness properties.

## Tasks

- [x] 1. Database schema setup and migrations
  - [x] 1.1 Create database migration script for consultations table
    - Add status column with CHECK constraint ('in_progress', 'pending_billing', 'billed', 'cancelled')
    - Add completed_at timestamp column
    - Add completed_by UUID column with foreign key to auth.users
    - Create indexes on status and completed_at columns
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 1.2 Create billing_queue table with RLS policies
    - Create table with all required columns (id, consultation_id, patient_id, doctor_id, consultation_date, completed_at, processing_by, processing_started_at, created_at)
    - Add foreign key constraints and UNIQUE constraint on consultation_id
    - Create indexes on patient_id, completed_at, and processing_by
    - Enable Row Level Security
    - Create RLS policies for SELECT, INSERT, UPDATE, DELETE operations
    - _Requirements: 2.1, 2.2, 2.5, 10.1_

  - [x] 1.3 Modify billing table to add consultation reference
    - Add consultation_id column with foreign key to consultations table
    - Add billed_at timestamp column
    - Add billed_by UUID column with foreign key to auth.users
    - Create index on consultation_id
    - _Requirements: 4.3, 4.4, 5.2_

  - [x] 1.4 Create database trigger for automatic billing queue entry
    - Write create_billing_queue_entry() function that inserts into billing_queue when consultation status becomes 'pending_billing'
    - Handle ON CONFLICT to prevent duplicate entries
    - Create trigger on consultations table (AFTER INSERT OR UPDATE)
    - _Requirements: 2.1, 5.1_

  - [x] 1.5 Create function to release stale billing locks
    - Write release_stale_billing_locks() function that clears processing_by and processing_started_at for locks older than 5 minutes
    - Return count of released locks
    - _Requirements: 10.5_

- [x] 2. Checkpoint - Verify database migrations
  - Run all migration scripts in Supabase SQL Editor
  - Verify tables created with correct schema
  - Test trigger by manually updating a consultation status
  - Ensure all tests pass, ask the user if questions arise

- [x] 3. Create BillingQueueContext with real-time subscriptions
  - [x] 3.1 Implement BillingQueueContext provider
    - Create context with state for queue, loading, and connectionStatus
    - Implement fetchQueue function with Supabase query joining patients, doctors, and consultations
    - Order results by completed_at descending
    - _Requirements: 2.2, 2.3, 3.1_

  - [x] 3.2 Implement real-time subscription to billing_queue changes
    - Subscribe to postgres_changes on emr.billing_queue table
    - Handle INSERT, UPDATE, DELETE events
    - Update connectionStatus based on subscription status
    - Call fetchQueue on INSERT/UPDATE events
    - Show browser notification on new patient arrival
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 3.3 Implement stale lock release mechanism
    - Create useEffect with setInterval to call release_stale_billing_locks RPC every 60 seconds
    - Refresh queue after releasing locks
    - _Requirements: 10.5_

  - [x] 3.4 Implement patient locking functions
    - Create lockPatient function that updates processing_by and processing_started_at
    - Use optimistic locking (only update if processing_by IS NULL)
    - Create unlockPatient function that clears lock fields (only if locked by current user)
    - Create removeFromQueue function to delete billing_queue entry
    - _Requirements: 10.2, 10.3, 10.4_

  - [ ]* 3.5 Write property test for billing queue entry creation
    - **Property 4: Billing Queue Entry Creation**
    - **Validates: Requirements 2.1, 2.5, 5.1**
    - Generate random consultations with status 'in_progress'
    - Update status to 'pending_billing'
    - Assert billing_queue entry exists with matching consultation_id, patient_id, doctor_id

  - [ ]* 3.6 Write property test for billing queue data completeness
    - **Property 5: Billing Queue Data Completeness**
    - **Validates: Requirements 2.2, 2.5**
    - Generate random billing queue entries
    - Assert all required fields are present (patient name, consultation date/time, IDs)

  - [ ]* 3.7 Write property test for billing queue ordering
    - **Property 6: Billing Queue Ordering**
    - **Validates: Requirements 2.3**
    - Generate multiple consultations with different completed_at timestamps
    - Fetch billing queue
    - Assert entries are ordered by completed_at descending

- [x] 4. Create BillingQueue component
  - [x] 4.1 Implement BillingQueue component UI
    - Display connection status warning when disconnected
    - Show queue count in header
    - Implement search input with real-time filtering
    - Display queue list with patient info, doctor name, and completion time
    - Show "In Progress" badge for locked patients
    - Disable click for patients being processed by others
    - _Requirements: 3.5, 6.1, 6.2, 6.3, 6.4, 10.2_

  - [x] 4.2 Implement search filtering logic
    - Filter queue by patient first name, last name, or patient number
    - Case-insensitive search
    - Preserve original sort order when filter is cleared
    - _Requirements: 6.1, 6.2, 6.5_

  - [ ]* 4.3 Write property test for search filtering
    - **Property 14: Billing Queue Search Filtering**
    - **Validates: Requirements 6.1, 6.2**
    - Generate random billing queue with patient data
    - Apply various search terms
    - Assert filtered results only include matching patients (case-insensitive)

  - [ ]* 4.4 Write property test for queue count accuracy
    - **Property 15: Billing Queue Count Accuracy**
    - **Validates: Requirements 6.3**
    - Generate random billing queue
    - Assert displayed count equals actual number of entries

  - [ ]* 4.5 Write unit tests for BillingQueue component
    - Test rendering with empty queue
    - Test rendering with multiple patients
    - Test search filtering behavior
    - Test click handling for available vs locked patients

- [x] 5. Enhance Consultations page with completion functionality
  - [x] 5.1 Add completeConsultation function to Consultations page
    - Update consultation status to 'pending_billing'
    - Set completed_at to current timestamp
    - Set completed_by to current user ID
    - Show success notification
    - Refresh consultations list
    - Handle errors gracefully
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 5.2 Add "Complete Consultation" button to consultation cards
    - Show button only for consultations with status 'in_progress'
    - Disable button for consultations with status 'pending_billing' or 'billed'
    - Display appropriate button text based on status
    - _Requirements: 1.4, 1.5_

  - [ ]* 5.3 Write property test for consultation completion state transition
    - **Property 1: Consultation Completion State Transition**
    - **Validates: Requirements 1.1, 1.2, 1.3**
    - Generate random consultations with status 'in_progress'
    - Complete consultation
    - Assert status becomes 'pending_billing' and completed_at is set
    - Verify persistence in database

  - [ ]* 5.4 Write property test for consultation completion idempotence
    - **Property 2: Consultation Completion Idempotence**
    - **Validates: Requirements 1.4**
    - Generate random consultation
    - Complete it multiple times
    - Assert status remains 'pending_billing' and completed_at doesn't change

  - [ ]* 5.5 Write property test for completed consultation button state
    - **Property 3: Completed Consultation Button State**
    - **Validates: Requirements 1.5**
    - Generate consultations with various statuses
    - Assert button is disabled for 'pending_billing' and 'billed' statuses

  - [ ]* 5.6 Write unit tests for consultation completion
    - Test successful completion
    - Test completion of already billed consultation (should fail)
    - Test error handling

- [ ] 6. Checkpoint - Test consultation to billing queue flow
  - Manually complete a consultation in the UI
  - Verify billing queue entry appears in real-time
  - Verify consultation status updated correctly
  - Ensure all tests pass, ask the user if questions arise

- [x] 7. Enhance Billing page with queue integration
  - [x] 7.1 Integrate BillingQueue component into Billing page
    - Import and render BillingQueue component
    - Implement handleSelectPatient callback
    - Attempt to lock patient when selected
    - Show alert if patient is already locked
    - Display selected patient info and consultation details
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 10.2, 10.3_

  - [x] 7.2 Implement billing form pre-population
    - Parse consultation prescription/services for billable items
    - Calculate subtotal based on items
    - Pre-populate billing form when patient is selected
    - _Requirements: 7.5_

  - [x] 7.3 Implement handleCompleteBilling function
    - Insert billing record with consultation_id, payment details, and timestamps
    - Update consultation status to 'billed'
    - Remove entry from billing_queue
    - Use transaction to ensure atomicity
    - Show success message and reset form
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 7.4 Implement handleCancelBilling function
    - Unlock patient (clear processing_by)
    - Reset selected patient state
    - Reset billing form
    - _Requirements: 10.4_

  - [x] 7.5 Add error handling for payment processing
    - Catch and log payment errors
    - Keep patient in queue if payment fails
    - Display user-friendly error messages
    - Enable retry button
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ]* 7.6 Write property test for payment completion state transition
    - **Property 9: Payment Completion State Transition**
    - **Validates: Requirements 4.1, 4.2**
    - Generate random consultations with status 'pending_billing'
    - Complete payment
    - Assert consultation status becomes 'billed' and billing_queue entry is removed

  - [ ]* 7.7 Write property test for billing record completeness
    - **Property 10: Billing Record Completeness**
    - **Validates: Requirements 4.3, 4.4**
    - Generate random billing records
    - Assert all required fields present (amount, method, timestamp, consultation_id)

  - [ ]* 7.8 Write property test for payment failure preserves queue state
    - **Property 20: Payment Failure Preserves Queue State**
    - **Validates: Requirements 8.2**
    - Generate random consultation in billing queue
    - Simulate payment failure (invalid amount)
    - Assert consultation status remains 'pending_billing' and patient stays in queue

  - [ ]* 7.9 Write unit tests for billing completion
    - Test successful payment processing
    - Test payment failure handling
    - Test transaction rollback on error
    - Test unlock on cancel

- [ ] 8. Implement patient locking mechanism
  - [ ]* 8.1 Write property test for patient locking mutual exclusion
    - **Property 27: Patient Locking Mutual Exclusion**
    - **Validates: Requirements 10.2, 10.3**
    - Generate random billing queue entry
    - Attempt to lock by two different users simultaneously
    - Assert only one lock succeeds

  - [ ]* 8.2 Write property test for stale lock automatic release
    - **Property 28: Stale Lock Automatic Release**
    - **Validates: Requirements 10.5**
    - Generate billing queue entry with lock older than 5 minutes
    - Call release_stale_billing_locks function
    - Assert processing_by is set to null

  - [ ]* 8.3 Write unit tests for locking mechanism
    - Test successful lock acquisition
    - Test double lock prevention
    - Test lock release
    - Test stale lock cleanup

- [ ] 9. Implement consultation-billing data integrity
  - [ ]* 9.1 Write property test for consultation-payment referential integrity
    - **Property 11: Consultation-Payment Referential Integrity**
    - **Validates: Requirements 5.2**
    - Generate random billing records
    - Assert referenced consultation_id points to existing consultation

  - [ ]* 9.2 Write property test for consultation deletion protection
    - **Property 12: Consultation Deletion Protection**
    - **Validates: Requirements 5.3**
    - Generate consultation with associated payment
    - Attempt to delete consultation
    - Assert deletion fails or is prevented

  - [ ]* 9.3 Write property test for consultation cancellation workflow
    - **Property 13: Consultation Cancellation Workflow**
    - **Validates: Requirements 5.4**
    - Generate consultation with status 'pending_billing'
    - Cancel consultation
    - Assert status becomes 'cancelled' and billing_queue entry is removed

  - [ ]* 9.4 Write unit tests for data integrity
    - Test foreign key constraints
    - Test cascade deletes
    - Test cancellation workflow

- [ ] 10. Add Recently Billed section
  - [ ] 10.1 Create Recently Billed component
    - Query last 20 billing records ordered by billed_at descending
    - Display patient name, billing time, amount, payment method
    - Subscribe to real-time updates on billing table
    - Update list automatically when new payments complete
    - _Requirements: 9.1, 9.2, 9.4_

  - [ ] 10.2 Implement click to view receipt
    - Handle click on recently billed patient
    - Display full payment receipt in modal or separate view
    - _Requirements: 9.3_

  - [ ]* 10.3 Write property test for recently billed data completeness
    - **Property 23: Recently Billed Data Completeness**
    - **Validates: Requirements 9.2**
    - Generate random recently billed entries
    - Assert all required fields displayed (name, time, amount, method)

  - [ ]* 10.4 Write property test for recently billed list updates
    - **Property 24: Recently Billed List Updates**
    - **Validates: Requirements 9.4**
    - Generate new payment completion
    - Assert recently billed list includes new entry and maintains last 20 entries

  - [ ]* 10.5 Write unit tests for Recently Billed component
    - Test rendering with empty list
    - Test rendering with multiple entries
    - Test click to view receipt

- [ ] 11. Implement historical billing search
  - [ ] 11.1 Add search functionality for historical billing records
    - Create search form with patient name and date range inputs
    - Query billing table with filters
    - Display search results
    - _Requirements: 9.5_

  - [ ]* 11.2 Write property test for historical billing search
    - **Property 25: Historical Billing Search**
    - **Validates: Requirements 9.5**
    - Generate random billing records with various dates and patient names
    - Apply search filters (name and date range)
    - Assert results only include matching records

  - [ ]* 11.3 Write unit tests for historical search
    - Test search by patient name
    - Test search by date range
    - Test combined filters
    - Test empty results

- [ ] 12. Implement validation and error handling
  - [ ] 12.1 Add consultation validation before billing
    - Validate required fields (patient_id, doctor_id, diagnosis)
    - Display validation errors to user
    - Prevent billing if validation fails
    - _Requirements: 8.5_

  - [ ] 12.2 Implement error logging
    - Create error_log table or use existing logging mechanism
    - Log all failed payment attempts with timestamp and error details
    - _Requirements: 8.4_

  - [ ] 12.3 Add retry mechanism for failed operations
    - Enable retry button after payment failure
    - Implement exponential backoff for automatic retries
    - _Requirements: 8.3_

  - [ ]* 12.4 Write property test for consultation validation before billing
    - **Property 22: Consultation Validation Before Billing**
    - **Validates: Requirements 8.5**
    - Generate consultations with missing required fields
    - Attempt to process billing
    - Assert validation error is displayed

  - [ ]* 12.5 Write property test for failed payment logging
    - **Property 21: Failed Payment Logging**
    - **Validates: Requirements 8.4**
    - Simulate payment failure
    - Assert log entry created with timestamp, error details, consultation_id

  - [ ]* 12.6 Write unit tests for validation and error handling
    - Test validation with missing patient_id
    - Test validation with missing doctor_id
    - Test validation with missing diagnosis
    - Test error logging
    - Test retry mechanism

- [ ] 13. Implement additional correctness properties
  - [ ]* 13.1 Write property test for billing queue completeness
    - **Property 7: Billing Queue Completeness**
    - **Validates: Requirements 2.4**
    - Generate multiple completed consultations
    - Assert all appear in billing queue without data loss

  - [ ]* 13.2 Write property test for billing queue sort stability
    - **Property 8: Billing Queue Sort Stability**
    - **Validates: Requirements 3.4**
    - Generate billing queue with existing entries
    - Add new entry
    - Assert relative order of existing entries is preserved

  - [ ]* 13.3 Write property test for billing queue patient identifiers
    - **Property 16: Billing Queue Patient Identifiers**
    - **Validates: Requirements 6.4**
    - Generate billing queue entries
    - Assert patient ID, patient number, or contact number displayed in addition to name

  - [ ]* 13.4 Write property test for search filter clearing preserves order
    - **Property 17: Search Filter Clearing Preserves Order**
    - **Validates: Requirements 6.5**
    - Generate billing queue
    - Apply search filter then clear it
    - Assert original sort order is restored

  - [ ]* 13.5 Write property test for consultation details visibility
    - **Property 18: Consultation Details Visibility**
    - **Validates: Requirements 7.2, 7.3, 7.4**
    - Generate consultation with all details
    - Select patient from billing queue
    - Assert doctor name, chief complaint, diagnosis, prescription, notes are displayed

  - [ ]* 13.6 Write property test for billing amount pre-population
    - **Property 19: Billing Amount Pre-population**
    - **Validates: Requirements 7.5**
    - Generate consultation with billable items
    - Select for billing
    - Assert billing form pre-populated with calculated amount

  - [ ]* 13.7 Write property test for billing queue consistency across users
    - **Property 26: Billing Queue Consistency Across Users**
    - **Validates: Requirements 10.1**
    - Simulate two receptionists viewing billing queue
    - Assert both see same set of pending patients (excluding processing status)

- [ ] 14. Integration testing
  - [ ]* 14.1 Write integration test for complete workflow
    - Create consultation
    - Complete consultation
    - Verify billing queue entry
    - Lock patient
    - Complete payment
    - Verify consultation status updated to 'billed'
    - Verify queue entry removed
    - Verify billing record created
    - _Requirements: All requirements_

  - [ ]* 14.2 Write integration test for concurrent receptionist access
    - Simulate two receptionists accessing billing queue
    - First receptionist locks patient
    - Second receptionist attempts to lock same patient (should fail)
    - First receptionist completes payment
    - Verify lock released and patient removed from queue
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ]* 14.3 Write integration test for real-time updates
    - Set up real-time subscription
    - Complete consultation in separate session
    - Verify billing queue updates within 2 seconds
    - Verify notification displayed
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 15. Final checkpoint and testing
  - Run all property-based tests (28 properties, 100 iterations each)
  - Run all unit tests
  - Run all integration tests
  - Verify test coverage meets 80% minimum
  - Test complete workflow manually in UI
  - Test concurrent access with multiple browser sessions
  - Verify real-time updates work correctly
  - Test error scenarios and recovery
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property-based tests use fast-check with minimum 100 iterations
- All property tests are tagged with feature name and property number
- Database migrations should be run in Supabase SQL Editor before implementation
- Real-time subscriptions require Supabase Realtime to be enabled
- Locking mechanism uses optimistic locking to prevent race conditions
- All state changes are persisted to database before UI updates
- Error handling includes automatic retry with exponential backoff
