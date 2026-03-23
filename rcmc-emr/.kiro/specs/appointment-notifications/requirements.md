# Requirements Document: Appointment Notifications

## Introduction

This feature integrates existing email and SMS notification infrastructure into appointment workflows to automatically notify patients when appointments are created. The system will send different notification types based on appointment source: online bookings receive both email and SMS notifications, while walk-in appointments receive SMS-only notifications.

## Glossary

- **Notification_System**: The combined email and SMS notification infrastructure including emailService.js, notificationService.js, and smsGateway.js
- **Online_Appointment**: An appointment created through the PublicBooking.jsx page by a patient via the online booking interface
- **Walk_In_Appointment**: An appointment created through the Appointments.jsx page by clinic staff for patients physically present at the clinic
- **Email_Service**: The Resend API-based email notification service configured with API key re_56oZYCZY_8MSHyMAjFV4T5qGRryJfNFGP
- **SMS_Service**: The SMS notification service implemented in smsGateway.js
- **Appointment_Creation_Event**: The successful creation and database persistence of a new appointment record
- **Notification_Delivery**: The successful transmission of a notification message to the patient's email address or mobile number

## Requirements

### Requirement 1: Online Appointment Dual Notification

**User Story:** As a patient booking online, I want to receive both email and SMS confirmations, so that I have multiple ways to access my appointment details.

#### Acceptance Criteria

1. WHEN an Online_Appointment is successfully created, THE Notification_System SHALL send an email notification to the patient's email address
2. WHEN an Online_Appointment is successfully created, THE Notification_System SHALL send an SMS notification to the patient's mobile number
3. THE Notification_System SHALL complete both email and SMS delivery within 30 seconds of Appointment_Creation_Event
4. WHEN either email or SMS delivery fails, THE Notification_System SHALL log the failure and continue with successful delivery of the other notification type
5. THE Notification_System SHALL include appointment date, time, doctor name, and clinic location in both email and SMS notifications

### Requirement 2: Walk-In Appointment SMS Notification

**User Story:** As a walk-in patient, I want to receive an SMS confirmation, so that I have a record of my appointment on my mobile device.

#### Acceptance Criteria

1. WHEN a Walk_In_Appointment is successfully created, THE Notification_System SHALL send an SMS notification to the patient's mobile number
2. THE Notification_System SHALL NOT send email notifications for Walk_In_Appointments
3. THE Notification_System SHALL complete SMS delivery within 30 seconds of Appointment_Creation_Event
4. THE Notification_System SHALL include appointment date, time, doctor name, and clinic location in the SMS notification

### Requirement 3: PublicBooking.jsx Integration

**User Story:** As a developer, I want the online booking page to trigger notifications automatically, so that patients receive confirmations without manual intervention.

#### Acceptance Criteria

1. THE PublicBooking_Page SHALL import notification functions from emailService.js and smsGateway.js
2. WHEN an appointment is successfully saved to the database, THE PublicBooking_Page SHALL invoke the Email_Service with patient email and appointment details
3. WHEN an appointment is successfully saved to the database, THE PublicBooking_Page SHALL invoke the SMS_Service with patient mobile number and appointment details
4. IF notification delivery fails, THE PublicBooking_Page SHALL display a warning message to the patient while confirming the appointment was created
5. THE PublicBooking_Page SHALL handle notification errors without blocking the appointment creation workflow

### Requirement 4: Appointments.jsx Integration

**User Story:** As clinic staff, I want walk-in appointments to trigger SMS notifications automatically, so that patients receive confirmations without additional steps.

#### Acceptance Criteria

1. THE Appointments_Page SHALL import notification functions from smsGateway.js
2. WHEN a Walk_In_Appointment is successfully saved to the database, THE Appointments_Page SHALL invoke the SMS_Service with patient mobile number and appointment details
3. THE Appointments_Page SHALL NOT invoke email notification functions for Walk_In_Appointments
4. IF SMS delivery fails, THE Appointments_Page SHALL display a warning message to staff while confirming the appointment was created
5. THE Appointments_Page SHALL handle notification errors without blocking the appointment creation workflow

### Requirement 5: Notification Exclusions

**User Story:** As a system architect, I want to ensure notifications are only sent for appointments, so that the system maintains clear boundaries and avoids scope creep.

#### Acceptance Criteria

1. THE Notification_System SHALL NOT send notifications for payment events
2. THE Notification_System SHALL NOT send notifications for prescription events
3. THE Notification_System SHALL NOT send notifications for lab result events
4. THE Notification_System SHALL only trigger notifications from PublicBooking.jsx and Appointments.jsx pages

### Requirement 6: Notification Content Format

**User Story:** As a patient, I want clear and complete appointment information in notifications, so that I know when and where to attend my appointment.

#### Acceptance Criteria

1. THE Email_Service SHALL format email notifications with patient name, appointment date, appointment time, doctor name, and clinic address
2. THE SMS_Service SHALL format SMS notifications with patient name, appointment date, appointment time, and doctor name
3. THE Email_Service SHALL include a professional email template with clinic branding
4. THE SMS_Service SHALL limit message length to 160 characters while including all essential appointment details
5. THE Notification_System SHALL format dates in DD/MM/YYYY format and times in 12-hour format with AM/PM

### Requirement 7: Error Handling and Logging

**User Story:** As a system administrator, I want notification failures to be logged and handled gracefully, so that I can monitor system health and troubleshoot issues.

#### Acceptance Criteria

1. WHEN email delivery fails, THE Notification_System SHALL log the error with timestamp, patient identifier, and error message
2. WHEN SMS delivery fails, THE Notification_System SHALL log the error with timestamp, patient identifier, and error message
3. IF notification delivery fails, THE Notification_System SHALL NOT prevent appointment creation from completing
4. THE Notification_System SHALL return success status to the calling page even if notifications fail
5. THE Notification_System SHALL include error details in console logs for developer debugging

### Requirement 8: Existing Infrastructure Utilization

**User Story:** As a developer, I want to use existing notification services without modification, so that implementation is fast and maintains consistency with existing code.

#### Acceptance Criteria

1. THE PublicBooking_Page SHALL use functions from emailService.js without modifying the service implementation
2. THE PublicBooking_Page SHALL use functions from smsGateway.js without modifying the service implementation
3. THE Appointments_Page SHALL use functions from smsGateway.js without modifying the service implementation
4. THE Notification_System SHALL use the configured Resend API key for all email deliveries
5. THE integration SHALL not require changes to notificationService.js, emailService.js, or smsGateway.js

### Requirement 9: Notification Timing and Sequencing

**User Story:** As a patient, I want to receive notifications immediately after booking, so that I have instant confirmation of my appointment.

#### Acceptance Criteria

1. WHEN an appointment is created, THE Notification_System SHALL trigger notification delivery before displaying success confirmation to the user
2. THE Notification_System SHALL execute email and SMS delivery in parallel for Online_Appointments
3. IF both notifications are pending, THE Notification_System SHALL not wait for one to complete before starting the other
4. THE calling page SHALL display appointment confirmation to the user regardless of notification delivery status
5. THE Notification_System SHALL complete all notification attempts within 30 seconds or timeout gracefully

### Requirement 10: Patient Data Validation

**User Story:** As a system, I want to validate patient contact information before sending notifications, so that delivery attempts are only made to valid addresses and numbers.

#### Acceptance Criteria

1. WHEN preparing to send email, THE Notification_System SHALL verify the patient email address is not null or empty
2. WHEN preparing to send SMS, THE Notification_System SHALL verify the patient mobile number is not null or empty
3. IF patient email is invalid or missing, THE Notification_System SHALL skip email delivery and log a warning
4. IF patient mobile number is invalid or missing, THE Notification_System SHALL skip SMS delivery and log a warning
5. THE Notification_System SHALL validate email format matches standard email pattern before attempting delivery
