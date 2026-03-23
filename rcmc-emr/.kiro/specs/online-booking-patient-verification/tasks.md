# Implementation Plan: Online Booking Patient Verification (Retrospective)

## Overview

This is a RETROSPECTIVE task list for an already-implemented and deployed feature. The online booking system is live and functional. These tasks focus on validation, testing, and documentation rather than new implementation.

**Feature Status:** ✅ Fully Implemented and Deployed

**What's Already Working:**
- Simple 3-step booking workflow (doctor/time → patient info → review)
- Time slot generation with 20-minute intervals (10:00 AM - 5:00 PM)
- Past time slot filtering for today's date
- Booked slot filtering (prevents double-booking)
- Duplicate patient detection by phone OR email
- Automatic patient record creation for new patients
- Automatic patient linking for existing patients
- Appointment creation with booking_source='online', booking_status='pending'
- Confirmation screen with appointment details

**What's NOT Implemented (documented in HANDOVER_2.0.md but not built):**
- Patient type selection UI ("New Patient" vs "Existing Patient")
- Patient verification UI (phone + DOB form)
- Pre-filled data for verified patients
- Read-only fields for verified information

**Task Focus:** Testing, validation, and documentation of the actual implementation.

## Tasks

- [ ] 1. Set up property-based testing framework
  - Install fast-check library for JavaScript property-based testing
  - Create test configuration file with minimum 100 iterations per property
  - Set up test file structure in appropriate test directory
  - _Requirements: All properties (testing infrastructure)_

- [ ] 2. Implement property-based tests for time slot management
  - [ ]* 2.1 Write property test for active appointment slot blocking
    - **Property 1: Active Appointment Slot Blocking**
    - **Validates: Requirements 6.3, 7.4**
    - Generate random appointment statuses and booking_statuses
    - Verify slots are unavailable only when status NOT IN ('Cancelled', 'No Show') AND booking_status != 'rejected'
  
  - [ ]* 2.2 Write property test for past time slot filtering
    - **Property 2: Past Time Slot Filtering for Today**
    - **Validates: Requirements 6.4, 8.3**
    - Generate random time slots for today's date
    - Verify slots are unavailable when slot_end_time <= current_time
  
  - [ ]* 2.3 Write property test for future date handling
    - **Property 3: Future Date No Past Filtering**
    - **Validates: Requirements 8.5**
    - Generate random future dates and time slots
    - Verify no time-based filtering is applied (only appointment-based)
  
  - [ ]* 2.4 Write property test for time format conversion
    - **Property 4: Time Format Conversion**
    - **Validates: Requirements 6.6**
    - Generate random 24-hour times (00:00 to 23:59)
    - Verify conversion to 12-hour format is correct (H:MM AM/PM)

- [ ] 3. Implement property-based tests for booking creation
  - [ ]* 3.1 Write property test for online booking field values
    - **Property 5: Online Booking Field Values**
    - **Validates: Requirements 9.3, 9.4, 9.5, 9.6**
    - Generate random booking data
    - Verify all created appointments have booking_source='online', booking_status='pending', status='Scheduled'
  
  - [ ]* 3.2 Write property test for duplicate patient detection
    - **Property 6: Duplicate Patient Detection**
    - **Validates: Requirements 5.1, 5.2**
    - Generate bookings with matching phone OR email
    - Verify existing patient_id is reused instead of creating new record
  
  - [ ]* 3.3 Write property test for exact phone number matching
    - **Property 7: Exact Phone Number Matching**
    - **Validates: Requirements 5.5**
    - Generate pairs of phone numbers with slight variations
    - Verify only exact matches are detected (no fuzzy matching)
  
  - [ ]* 3.4 Write property test for case-insensitive email matching
    - **Property 8: Case-Insensitive Email Matching**
    - **Validates: Requirements 5.6**
    - Generate email addresses with random casing
    - Verify matching is case-insensitive

- [ ] 4. Implement property-based tests for patient record management
  - [ ]* 4.1 Write property test for patient number format
    - **Property 9: Patient Number Format**
    - **Validates: Requirements 4.1**
    - Create multiple new patient records
    - Verify all patient_numbers match pattern "P\d{6}"
  
  - [ ]* 4.2 Write property test for patient name storage
    - **Property 10: Patient Name Storage**
    - **Validates: Requirements 4.2, 4.4**
    - Generate random first_name and last_name values
    - Verify stored values exactly match submitted values
  
  - [ ]* 4.3 Write property test for new patient active status
    - **Property 11: New Patient Active Status**
    - **Validates: Requirements 4.3**
    - Create new patient records through online booking
    - Verify all have status='Active'

- [ ] 5. Implement property-based tests for data parsing and serialization
  - [ ]* 5.1 Write property test for field name variation acceptance
    - **Property 12: Field Name Variation Acceptance**
    - **Validates: Requirements 15.2, 15.3**
    - Generate booking data with different field name variations
    - Verify system correctly extracts patient information regardless of naming
  
  - [ ]* 5.2 Write property test for whitespace trimming
    - **Property 13: Whitespace Trimming**
    - **Validates: Requirements 15.4**
    - Generate strings with random leading/trailing whitespace
    - Verify all whitespace is removed before database insertion
  
  - [ ]* 5.3 Write property test for empty string to null conversion
    - **Property 14: Empty String to Null Conversion**
    - **Validates: Requirements 15.5**
    - Generate patient data with empty strings in optional fields
    - Verify empty strings are converted to null
  
  - [ ]* 5.4 Write property test for data serialization round-trip
    - **Property 15: Data Serialization Round-Trip**
    - **Validates: Requirements 15.7**
    - Generate random patient data objects
    - Verify serialize → deserialize → serialize produces equivalent result

- [ ] 6. Checkpoint - Ensure all property tests pass
  - Ensure all property-based tests pass, ask the user if questions arise.

- [ ] 7. Implement unit tests for specific scenarios
  - [ ]* 7.1 Write unit test for time slot generation
    - Test that 27 slots are generated (10:00 AM to 4:40 PM, 20-min intervals)
    - Verify first slot is "10:00 AM" and last is "4:40 PM"
    - _Requirements: 6.1_
  
  - [ ]* 7.2 Write unit test for double-booking prevention
    - Create first booking for specific doctor/date/time
    - Attempt second booking for same slot
    - Verify second booking is rejected with appropriate error
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [ ]* 7.3 Write unit test for duplicate patient detection by phone
    - Create existing patient with specific phone number
    - Submit booking with same phone number
    - Verify existing patient_id is used, no new patient created
    - _Requirements: 5.1, 5.2, 5.5_
  
  - [ ]* 7.4 Write unit test for duplicate patient detection by email
    - Create existing patient with specific email
    - Submit booking with same email (different casing)
    - Verify existing patient_id is used, no new patient created
    - _Requirements: 5.1, 5.2, 5.6_
  
  - [ ]* 7.5 Write unit test for new patient creation
    - Submit booking with unique phone and email
    - Verify new patient record is created with correct fields
    - Verify patient_number format is correct
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [ ]* 7.6 Write unit test for past time slot filtering on today
    - Set current time to 2:00 PM
    - Load time slots for today
    - Verify slots before 2:20 PM are marked unavailable
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [ ]* 7.7 Write unit test for no past filtering on future dates
    - Load time slots for tomorrow
    - Verify all slots are evaluated only based on appointments
    - Verify no time-based filtering is applied
    - _Requirements: 8.5_
  
  - [ ]* 7.8 Write unit test for slot availability check
    - Create appointment for specific slot
    - Check availability for same slot
    - Verify slot is marked as unavailable
    - _Requirements: 7.1, 7.2, 7.6_
  
  - [ ]* 7.9 Write unit test for cancelled appointment slot availability
    - Create appointment with status='Cancelled'
    - Check availability for same slot
    - Verify slot is marked as available
    - _Requirements: 6.3, 7.4_
  
  - [ ]* 7.10 Write unit test for rejected booking slot availability
    - Create appointment with booking_status='rejected'
    - Check availability for same slot
    - Verify slot is marked as available
    - _Requirements: 6.3, 7.4_

- [ ] 8. Implement integration tests for end-to-end flows
  - [ ]* 8.1 Write integration test for complete new patient booking flow
    - Load doctors list
    - Select doctor and date
    - Load available time slots
    - Select time slot
    - Submit booking with new patient data
    - Verify appointment created with correct fields
    - Verify new patient record created
    - Verify confirmation data is correct
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 12.1-12.8_
  
  - [ ]* 8.2 Write integration test for existing patient booking flow
    - Create existing patient record
    - Submit booking with matching phone number
    - Verify appointment created with existing patient_id
    - Verify no new patient record created
    - _Requirements: 5.1, 5.2, 9.2, 9.8_
  
  - [ ]* 8.3 Write integration test for concurrent booking attempts
    - Simulate two users attempting to book same slot simultaneously
    - Verify only one booking succeeds
    - Verify other receives "slot no longer available" error
    - _Requirements: 7.1, 7.2, 7.3, 7.7, 11.2_
  
  - [ ]* 8.4 Write integration test for booking with missing required fields
    - Attempt booking without doctor_id
    - Attempt booking without appointment_date
    - Attempt booking without appointment_time
    - Attempt booking without phone
    - Verify appropriate error messages for each
    - _Requirements: 13.1, 13.2, 11.4_
  
  - [ ]* 8.5 Write integration test for slot becoming unavailable during booking
    - Load available slots
    - Create appointment for a slot (simulating another user)
    - Attempt to book the same slot
    - Verify error message and slot refresh
    - _Requirements: 7.1, 7.2, 11.2_

- [ ] 9. Checkpoint - Ensure all unit and integration tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Validate documentation accuracy
  - [ ] 10.1 Review requirements document against actual implementation
    - Verify all 15 requirements accurately describe implemented behavior
    - Identify any discrepancies between requirements and implementation
    - Document any requirements that are not fully implemented
    - _Requirements: All (documentation validation)_
  
  - [ ] 10.2 Review design document against actual code
    - Verify component structure matches PublicBooking.jsx
    - Verify database functions match supabase.js implementation
    - Verify data models match actual database schema
    - Confirm correctness properties are testable
    - _Requirements: All (documentation validation)_
  
  - [ ] 10.3 Verify HANDOVER_2.0.md discrepancies are documented
    - Confirm design document clearly states what was NOT implemented
    - Verify "Critical Discrepancy Note" section is accurate
    - Ensure future enhancement section lists unimplemented features
    - _Requirements: 1.1-1.5, 2.1-2.8, 3.1-3.5 (verification features)_
  
  - [ ] 10.4 Validate error handling documentation
    - Review error handling section against actual error messages in code
    - Verify all error scenarios are documented
    - Check that error messages match implementation
    - _Requirements: 11.1-11.7_

- [ ] 11. Validate security and compliance implementation
  - [ ] 11.1 Review RLS policies in Supabase
    - Verify anonymous users can INSERT appointments with booking_source='online'
    - Verify anonymous users can SELECT from doctors (Active only)
    - Verify anonymous users can SELECT from appointments (for availability)
    - Verify no other permissions are granted to anonymous users
    - _Requirements: 10.1, 10.2, 10.3, 10.7_
  
  - [ ] 11.2 Verify no PHI exposure in public interface
    - Review PublicBooking.jsx for any patient name displays
    - Verify error messages don't expose patient information
    - Check that verification failures don't indicate which field was wrong
    - _Requirements: 10.1, 10.2, 10.6_
  
  - [ ] 11.3 Validate input sanitization and SQL injection prevention
    - Review all database queries use parameterized queries
    - Verify user input is validated before database operations
    - Check for any string concatenation in SQL queries
    - _Requirements: 10.7, 10.8_
  
  - [ ] 11.4 Verify HTTPS and data transmission security
    - Confirm all API calls use HTTPS
    - Verify no PHI is stored in browser local storage
    - Check that sensitive data is not logged to console in production
    - _Requirements: 10.4, 10.5, 10.6_

- [ ] 12. Performance validation and optimization
  - [ ] 12.1 Measure time slot generation performance
    - Test with various appointment counts (0, 10, 50, 100 appointments)
    - Verify generation completes within 200ms
    - Document actual performance metrics
    - _Requirements: 6.1, 6.2_
  
  - [ ] 12.2 Measure duplicate patient detection performance
    - Test with various patient counts (100, 1000, 10000 patients)
    - Verify query completes within 50ms
    - Check that indexes exist on contact_number and email
    - _Requirements: 5.1, 5.2_
  
  - [ ] 12.3 Measure slot availability check performance
    - Test with various appointment counts
    - Verify check completes within 1 second (requirement) or 50ms (target)
    - Verify composite index exists on (doctor_id, appointment_date, appointment_time)
    - _Requirements: 7.6_
  
  - [ ] 12.4 Measure patient verification performance (unused function)
    - Test verifyPatientByPhoneAndDOB function
    - Verify completes within 2 seconds
    - Document performance for potential future use
    - _Requirements: 2.6_

- [ ] 13. Create test data generators for property-based testing
  - [ ] 13.1 Create patient data generator
    - Generate valid first_name, last_name (1-50 chars)
    - Generate valid date_of_birth (past dates only)
    - Generate valid gender values
    - Generate valid phone numbers (10-15 digits)
    - Generate valid email addresses
    - Generate valid addresses (5-200 chars)
    - Generate valid reason text (1-500 chars)
    - _Requirements: 15.1-15.7_
  
  - [ ] 13.2 Create time slot generator
    - Generate valid hours (10-16)
    - Generate valid minutes (0, 20, 40)
    - Format as 24-hour time strings
    - _Requirements: 6.1, 6.6_
  
  - [ ] 13.3 Create appointment status generator
    - Generate valid status values
    - Generate valid booking_status values
    - Create combinations for testing availability logic
    - _Requirements: 6.3, 7.4, 9.3, 9.4, 9.5_
  
  - [ ] 13.4 Create booking data generator with field name variations
    - Generate data with patient_first_name, firstName, first_name variations
    - Generate data with patient_contact, phone, contact_number variations
    - Generate data with patient_email, email variations
    - _Requirements: 15.2, 15.3_

- [ ] 14. Document test coverage and results
  - [ ] 14.1 Generate test coverage report
    - Run all tests with coverage enabled
    - Generate HTML coverage report
    - Document coverage percentage for each file
    - Identify untested code paths
  
  - [ ] 14.2 Create test results summary document
    - List all property-based tests with pass/fail status
    - List all unit tests with pass/fail status
    - List all integration tests with pass/fail status
    - Document any failing tests with reproduction steps
  
  - [ ] 14.3 Document known limitations and edge cases
    - List scenarios where patient creation succeeds but appointment fails
    - Document race condition handling in concurrent bookings
    - Note any browser compatibility issues
    - Document any performance bottlenecks found

- [ ] 15. Final checkpoint - Complete retrospective validation
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all documentation is accurate and up-to-date.
  - Confirm security and compliance requirements are met.
  - Review performance metrics and optimization opportunities.

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster validation
- This is a RETROSPECTIVE spec - the feature is already implemented and deployed
- Focus is on validation, testing, and documentation accuracy
- No new implementation work is required unless tests reveal bugs
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end workflows
- All tests reference specific requirements for traceability

## Testing Strategy

**Property-Based Testing:**
- Use fast-check library with minimum 100 iterations per property
- Each test must reference its design document property number
- Tag format: `// Feature: online-booking-patient-verification, Property {number}: {property_text}`

**Unit Testing:**
- Focus on specific examples and edge cases
- Test error conditions and boundary values
- Verify integration points between components

**Integration Testing:**
- Test complete end-to-end booking flows
- Simulate concurrent user scenarios
- Verify data consistency across database operations

**Performance Testing:**
- Measure actual performance against requirements
- Document metrics for future optimization
- Verify database indexes are in place
