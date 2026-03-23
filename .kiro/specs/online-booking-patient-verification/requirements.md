# Requirements Document: Online Booking Patient Verification & Security

## Introduction

This document captures the requirements for the Online Booking Patient Verification & Security feature implemented in the RCMC EMR system. This is a RETROSPECTIVE specification documenting an already-deployed feature that enables secure patient verification, prevents double-booking, and ensures proper patient record management for the public-facing online appointment booking system.

The feature addresses three critical areas:
1. **Patient Verification System** - Two-factor authentication using phone and date of birth
2. **Patient Name Recording** - Proper patient record creation and duplicate prevention
3. **Time Slot Locking** - Prevention of double-booking through real-time availability checking

## Glossary

- **Online_Booking_System**: The public-facing web interface at http://localhost:3003/book where patients can schedule appointments without authentication
- **Patient_Verification_Service**: The backend service that validates patient identity using phone number and date of birth
- **Time_Slot_Manager**: The component responsible for managing appointment slot availability and preventing double-booking
- **Patient_Record_Manager**: The service that handles patient record creation, retrieval, and duplicate detection
- **Existing_Patient**: A patient who already has a record in the Patients database table
- **New_Patient**: A patient who does not have an existing record in the system
- **Two_Factor_Verification**: Authentication method using phone number AND date of birth to verify patient identity
- **PHI**: Protected Health Information - sensitive patient data regulated by HIPAA
- **Double_Booking**: The scenario where two appointments are scheduled for the same doctor at the same time slot
- **Time_Slot**: A 20-minute appointment window between 10:00 AM and 5:00 PM
- **Booked_Slot**: A time slot that has an active appointment (not cancelled, rejected, or no-show)
- **Past_Slot**: A time slot that has already occurred (for today's date only)
- **Pre_Filled_Data**: Patient information automatically populated from existing records after successful verification
- **Read_Only_Field**: Form field that displays verified data but cannot be edited by the user
- **HIPAA**: Health Insurance Portability and Accountability Act - US healthcare privacy regulation
- **Data_Privacy_Act**: Republic Act 10173 - Philippines data privacy law
- **GDPR_Principles**: General Data Protection Regulation principles applied to patient data handling

## Requirements

### Requirement 1: Patient Type Selection

**User Story:** As a patient accessing the online booking system, I want to indicate whether I'm a new patient or have existing records, so that the system can provide the appropriate booking workflow.

#### Acceptance Criteria

1. WHEN the Online_Booking_System loads, THE System SHALL display two patient type options: "I'm a New Patient" and "I Have Records"
2. WHEN a patient selects "I'm a New Patient", THE System SHALL display the standard booking form with all fields editable
3. WHEN a patient selects "I Have Records", THE System SHALL display the Patient_Verification_Service interface before proceeding to the booking form
4. THE System SHALL maintain the selected patient type throughout the booking session
5. THE System SHALL allow patients to change their selection before submitting the booking

### Requirement 2: Two-Factor Patient Verification

**User Story:** As an existing patient, I want to verify my identity using my phone number and date of birth, so that my existing information can be retrieved securely without exposing sensitive data publicly.

#### Acceptance Criteria

1. WHEN an existing patient selects "I Have Records", THE Patient_Verification_Service SHALL prompt for phone number and date of birth
2. WHEN verification credentials are submitted, THE Patient_Verification_Service SHALL query the Patients table using both phone number AND date of birth as matching criteria
3. IF both credentials match an Active patient record, THEN THE Patient_Verification_Service SHALL return the patient's ID, name, contact information, and address
4. IF credentials do not match any Active patient record, THEN THE Patient_Verification_Service SHALL return null without exposing whether the phone or date of birth was incorrect
5. THE Patient_Verification_Service SHALL NOT expose patient names or other PHI in error messages
6. THE Patient_Verification_Service SHALL complete verification within 2 seconds under normal database load
7. WHEN verification succeeds, THE System SHALL store the patient_id for use in appointment creation
8. THE Patient_Verification_Service SHALL only match patients with status equal to "Active"

### Requirement 3: Pre-Filled Data for Verified Patients

**User Story:** As a verified existing patient, I want my information automatically filled in the booking form, so that I don't have to re-enter data that the clinic already has on file.

#### Acceptance Criteria

1. WHEN Patient_Verification_Service successfully verifies a patient, THE System SHALL pre-fill the booking form with first name, last name, date of birth, gender, phone number, email, and address from the patient record
2. THE System SHALL mark pre-filled fields as Read_Only_Fields to prevent modification
3. THE System SHALL display a visual indicator (such as a lock icon or disabled styling) on Read_Only_Fields
4. THE System SHALL allow verified patients to edit only the "Reason for Visit" field
5. WHEN creating an appointment for a verified patient, THE Patient_Record_Manager SHALL use the existing patient_id rather than creating a new patient record
6. THE System SHALL use the patient's name from the existing database record, not from form input

### Requirement 4: New Patient Record Creation

**User Story:** As a new patient, I want to provide my information through the online booking form, so that the clinic can create my patient record and schedule my appointment.

#### Acceptance Criteria

1. WHEN a new patient submits the booking form, THE Patient_Record_Manager SHALL generate a unique patient_number in format "P" followed by 6 zero-padded digits
2. WHEN creating a new patient record, THE Patient_Record_Manager SHALL use the first_name and last_name values from the booking form
3. THE Patient_Record_Manager SHALL create the patient record with status set to "Active"
4. THE Patient_Record_Manager SHALL store the patient's actual name as entered in the form fields
5. WHEN patient creation succeeds, THE Patient_Record_Manager SHALL return the new patient_id for use in appointment creation
6. IF patient creation fails, THEN THE System SHALL display an error message and SHALL NOT create an appointment

### Requirement 5: Duplicate Patient Prevention

**User Story:** As a clinic administrator, I want the system to prevent duplicate patient records, so that each patient has only one record in the database.

#### Acceptance Criteria

1. WHEN a new patient submits a booking, THE Patient_Record_Manager SHALL check for existing patients with matching contact_number OR email
2. IF an existing patient is found with matching contact information, THEN THE Patient_Record_Manager SHALL use the existing patient_id instead of creating a new record
3. THE Patient_Record_Manager SHALL perform the duplicate check before attempting to insert a new patient record
4. WHEN an existing patient is found during duplicate check, THE System SHALL log the match and use the existing patient's information
5. THE Patient_Record_Manager SHALL match on contact_number with exact equality
6. THE Patient_Record_Manager SHALL match on email with exact equality (case-insensitive)

### Requirement 6: Time Slot Availability Display

**User Story:** As a patient booking an appointment, I want to see only available time slots, so that I don't attempt to book a time that's already taken.

#### Acceptance Criteria

1. WHEN a patient selects a doctor and date, THE Time_Slot_Manager SHALL generate time slots from 10:00 AM to 5:00 PM in 20-minute intervals
2. THE Time_Slot_Manager SHALL query the Appointments table for existing appointments matching the selected doctor_id and appointment_date
3. THE Time_Slot_Manager SHALL mark a time slot as unavailable IF an appointment exists with status NOT equal to "Cancelled" AND status NOT equal to "No Show" AND booking_status NOT equal to "rejected"
4. WHEN the selected date is today, THE Time_Slot_Manager SHALL mark time slots as unavailable IF the slot time plus 20 minutes is less than or equal to the current time
5. THE Time_Slot_Manager SHALL display available slots with selectable styling and unavailable slots with disabled styling
6. THE Time_Slot_Manager SHALL format time slots in 12-hour format with AM/PM indicators
7. WHEN no available slots exist for a date, THE System SHALL display the message "No available slots for this date"

### Requirement 7: Double-Booking Prevention

**User Story:** As a clinic administrator, I want the system to prevent double-booking, so that only one patient can book each time slot with each doctor.

#### Acceptance Criteria

1. WHEN a patient submits a booking, THE Time_Slot_Manager SHALL verify slot availability immediately before creating the appointment
2. THE Time_Slot_Manager SHALL query for existing appointments with matching doctor_id, appointment_date, and appointment_time
3. IF an active appointment exists for the requested slot, THEN THE System SHALL reject the booking with error message "This time slot is no longer available"
4. THE Time_Slot_Manager SHALL consider an appointment "active" IF status is NOT "Cancelled" AND status is NOT "No Show" AND booking_status is NOT "rejected"
5. IF the slot is available, THEN THE System SHALL proceed with appointment creation
6. THE Time_Slot_Manager SHALL complete the availability check within 1 second
7. THE System SHALL use database-level consistency to prevent race conditions in concurrent booking attempts

### Requirement 8: Past Time Slot Filtering

**User Story:** As a patient booking an appointment for today, I want to see only future time slots, so that I cannot accidentally book an appointment in the past.

#### Acceptance Criteria

1. WHEN a patient selects today's date, THE Time_Slot_Manager SHALL calculate the current time in minutes (hours × 60 + minutes)
2. FOR EACH time slot, THE Time_Slot_Manager SHALL calculate the slot end time as slot_start_time + 20 minutes
3. IF the slot end time is less than or equal to current time, THEN THE Time_Slot_Manager SHALL mark the slot as unavailable
4. THE Time_Slot_Manager SHALL apply the 20-minute buffer to account for appointment duration
5. WHEN a patient selects a future date, THE Time_Slot_Manager SHALL NOT apply past time filtering
6. THE Time_Slot_Manager SHALL use the server's current time for comparison, not client-side time

### Requirement 9: Appointment Record Creation

**User Story:** As the system, I want to create appointment records with proper patient linkage, so that appointments are correctly associated with patient records.

#### Acceptance Criteria

1. WHEN creating an appointment for a new patient, THE System SHALL first create the patient record and obtain the patient_id
2. WHEN creating an appointment for a verified existing patient, THE System SHALL use the patient_id from the verification result
3. THE System SHALL create appointments with booking_source set to "online"
4. THE System SHALL create appointments with booking_status set to "pending"
5. THE System SHALL create appointments with status set to "Scheduled"
6. THE System SHALL store the reason for visit in the appointment record
7. IF appointment creation fails, THEN THE System SHALL display an error message to the patient
8. WHEN appointment creation succeeds, THE System SHALL display a confirmation screen with appointment details

### Requirement 10: HIPAA and Privacy Compliance

**User Story:** As a healthcare compliance officer, I want the online booking system to protect patient privacy, so that we comply with HIPAA, Data Privacy Act, and GDPR principles.

#### Acceptance Criteria

1. THE Online_Booking_System SHALL NOT display patient names in public-facing interfaces before authentication
2. WHEN verification fails, THE Patient_Verification_Service SHALL NOT indicate whether the phone number or date of birth was incorrect
3. THE System SHALL NOT expose patient lists or searchable patient directories in the public booking interface
4. THE System SHALL transmit all patient data over HTTPS encrypted connections
5. THE System SHALL log patient verification attempts without storing failed credentials
6. THE System SHALL NOT cache or store PHI in browser local storage
7. THE Patient_Verification_Service SHALL use parameterized queries to prevent SQL injection attacks
8. THE System SHALL validate and sanitize all user input before database operations

### Requirement 11: Error Handling and User Feedback

**User Story:** As a patient using the online booking system, I want clear error messages when something goes wrong, so that I understand what happened and what to do next.

#### Acceptance Criteria

1. WHEN verification fails, THE System SHALL display the message "We couldn't verify your information. Please check your phone number and date of birth and try again."
2. WHEN a time slot becomes unavailable during booking, THE System SHALL display the message "This time slot is no longer available" and SHALL refresh the available slots
3. WHEN patient record creation fails, THE System SHALL display the message "Failed to create booking. Please try again."
4. WHEN appointment creation fails, THE System SHALL display the message "Failed to create appointment" with the specific error reason
5. THE System SHALL log detailed error information to the console for debugging purposes
6. THE System SHALL NOT expose database error details or stack traces to end users
7. WHEN booking succeeds, THE System SHALL display a confirmation screen with appointment details including doctor name, date, and time

### Requirement 12: Booking Confirmation Display

**User Story:** As a patient who has completed a booking, I want to see confirmation of my appointment details, so that I know my booking was successful and can verify the information.

#### Acceptance Criteria

1. WHEN booking succeeds, THE System SHALL display a success screen with a green checkmark icon
2. THE System SHALL display the heading "Booking Submitted!"
3. THE System SHALL display the message "Your appointment request has been received. We will review it and send you a confirmation via email or phone shortly."
4. THE System SHALL display the doctor's full name in format "Dr. [first_name] [last_name]"
5. THE System SHALL display the appointment date in localized date format
6. THE System SHALL display the appointment time in 12-hour format with AM/PM
7. THE System SHALL provide a "Book Another Appointment" button that reloads the booking form
8. THE System SHALL maintain the confirmation screen until the user explicitly navigates away

### Requirement 13: Form Validation

**User Story:** As a patient filling out the booking form, I want the system to validate my input, so that I provide all required information in the correct format.

#### Acceptance Criteria

1. THE System SHALL mark first name, last name, date of birth, gender, phone number, email, address, and reason for visit as required fields
2. THE System SHALL prevent form submission IF any required field is empty
3. THE System SHALL validate email format using standard email validation patterns
4. THE System SHALL validate phone number format to ensure it contains only digits and valid separators
5. THE System SHALL validate date of birth to ensure it is a valid date in the past
6. THE System SHALL display field-level validation errors near the relevant input field
7. THE System SHALL disable the submit button until all required fields are valid

### Requirement 14: Multi-Step Booking Workflow

**User Story:** As a patient booking an appointment, I want a clear step-by-step process, so that I understand where I am in the booking flow and what information is needed next.

#### Acceptance Criteria

1. THE Online_Booking_System SHALL implement a 3-step booking process: (1) Select Doctor and Time, (2) Patient Information, (3) Review Booking
2. THE System SHALL display a progress indicator showing steps 1, 2, and 3 with the current step highlighted
3. WHEN a step is completed, THE System SHALL mark it as complete in the progress indicator
4. THE System SHALL provide "Back" buttons to allow navigation to previous steps
5. THE System SHALL provide "Continue" or "Next" buttons to advance to the next step
6. THE System SHALL disable the "Continue" button in Step 1 until doctor, date, and time are selected
7. THE System SHALL validate all patient information before allowing progression from Step 2 to Step 3
8. THE System SHALL display a summary of all booking details in Step 3 before final submission

### Requirement 15: Parser and Serializer Requirements

**User Story:** As a developer maintaining the system, I want proper parsing and serialization of patient data, so that data integrity is maintained throughout the booking process.

#### Acceptance Criteria

1. WHEN receiving booking data, THE Patient_Record_Manager SHALL parse first_name, last_name, date_of_birth, gender, phone, email, and address fields
2. THE Patient_Record_Manager SHALL accept field name variations including patient_first_name/firstName/first_name for compatibility
3. THE Patient_Record_Manager SHALL accept contact number variations including patient_contact/phone/contact_number/contact
4. THE Patient_Record_Manager SHALL trim whitespace from all string fields before database insertion
5. THE Patient_Record_Manager SHALL convert empty string values to null for optional fields
6. THE Patient_Record_Manager SHALL serialize patient records to JSON format for API responses
7. FOR ALL valid patient data objects, parsing then serializing then parsing SHALL produce an equivalent object (round-trip property)
8. THE System SHALL log the raw booking data structure for debugging cache-related issues

## Compliance and Security Notes

This feature implements security and privacy controls to comply with:

- **HIPAA (Health Insurance Portability and Accountability Act)**: No PHI exposed in public interfaces, secure verification process, encrypted data transmission
- **Data Privacy Act of 2012 (Philippines RA 10173)**: Consent-based data collection, purpose limitation, data minimization
- **GDPR Principles**: Right to access (via verification), data accuracy, security of processing

## System Context

- **Public URL**: http://localhost:3003/book
- **Authentication**: None required (public-facing)
- **Database Tables**: patients, appointments, doctors
- **Integration Points**: Patients module, Appointments module, Online Bookings management interface
- **Server Port**: 3003

## Implementation Files

- `rcmc-emr/src/pages/PublicBooking.jsx` - Patient type selection, verification UI, booking form
- `rcmc-emr/src/lib/supabase.js` - Database functions including `verifyPatientByPhoneAndDOB()`, `createOnlineBooking()`, `getAvailableTimeSlots()`, `checkSlotAvailability()`
