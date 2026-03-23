# Requirements Document

## Introduction

This feature adds a user-friendly informational message to the online booking system's patient information step (Step 2) to reassure returning patients that the system will automatically recognize them and link their existing medical records using their phone number or email address. This is a pure UX enhancement that requires no backend changes, as the duplicate patient detection functionality already exists.

## Glossary

- **Booking_System**: The RCMC EMR online appointment booking interface accessible to patients
- **Patient_Information_Step**: Step 2 of the booking flow where patients enter their personal details
- **Info_Message**: A styled informational notification component with blue background and info icon
- **Duplicate_Detection**: Existing system functionality that matches patients by phone number OR email address
- **Medical_Records**: Patient history, consultations, and health data stored in the system

## Requirements

### Requirement 1: Display Informational Message

**User Story:** As a returning patient, I want to see a reassuring message about automatic record linking, so that I understand the system will recognize me and I don't need to worry about duplicate records.

#### Acceptance Criteria

1. WHEN the Patient_Information_Step is displayed, THE Booking_System SHALL render the Info_Message above the form fields
2. THE Info_Message SHALL contain the text "Returning patient? We'll find your records automatically using your phone or email"
3. THE Info_Message SHALL be visible to all users accessing the Patient_Information_Step
4. THE Info_Message SHALL remain visible throughout the duration of the Patient_Information_Step

### Requirement 2: Style Informational Message

**User Story:** As a patient, I want the informational message to be visually distinct and easy to notice, so that I can quickly understand important system behavior.

#### Acceptance Criteria

1. THE Info_Message SHALL have a blue background color consistent with informational UI patterns
2. THE Info_Message SHALL display an information icon (i) on the left side of the text
3. THE Info_Message SHALL use readable typography with appropriate font size and contrast
4. THE Info_Message SHALL have appropriate padding and spacing to separate it from form fields
5. THE Info_Message SHALL be styled consistently with the existing Booking_System design language

### Requirement 3: Position Message Correctly

**User Story:** As a patient filling out the booking form, I want to see the informational message before I start entering my details, so that I understand how the system works before I provide my information.

#### Acceptance Criteria

1. THE Booking_System SHALL position the Info_Message above all patient information form fields
2. THE Booking_System SHALL position the Info_Message below the step title or header
3. THE Info_Message SHALL span the full width of the form container
4. THE Info_Message SHALL maintain its position when the page is scrolled

### Requirement 4: Maintain Existing Functionality

**User Story:** As a system administrator, I want the new message to be purely informational, so that no existing booking or patient detection functionality is affected.

#### Acceptance Criteria

1. THE Booking_System SHALL preserve all existing Duplicate_Detection functionality
2. THE Booking_System SHALL continue to match patients by phone number OR email address
3. THE Booking_System SHALL maintain all existing form validation rules
4. THE Booking_System SHALL complete the booking process with the same behavior as before the Info_Message was added
5. THE Info_Message SHALL NOT require any backend API changes or database modifications

### Requirement 5: Responsive Design

**User Story:** As a patient using a mobile device, I want the informational message to display properly on my screen, so that I can read it regardless of my device type.

#### Acceptance Criteria

1. WHEN the Patient_Information_Step is viewed on a mobile device, THE Info_Message SHALL display with appropriate text wrapping
2. WHEN the Patient_Information_Step is viewed on a tablet device, THE Info_Message SHALL maintain readability and proper spacing
3. WHEN the Patient_Information_Step is viewed on a desktop device, THE Info_Message SHALL display without horizontal scrolling
4. THE Info_Message SHALL maintain its icon and text alignment across all screen sizes
