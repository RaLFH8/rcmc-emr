# Requirements Document

## Introduction

The Patient Satisfaction Survey system enables patients to provide feedback about their clinic experience via QR code-accessible surveys. The system collects ratings and comments, generates doctor satisfaction scores, and displays aggregated metrics on a doctor dashboard. This feature integrates with the existing RCMC EMR system (React + Vite frontend with Supabase backend).

## Glossary

- **Survey_System**: The patient-facing web interface for collecting satisfaction feedback
- **Rating_Engine**: The backend component that calculates and stores satisfaction scores
- **Doctor_Dashboard**: The administrative interface displaying aggregated satisfaction metrics
- **QR_Generator**: The utility that creates QR codes linking to doctor-specific surveys
- **Rate_Limiter**: The security component preventing duplicate submissions
- **Sentiment_Analyzer**: The component that performs keyword-based sentiment analysis on comments
- **Survey_Response**: A single patient submission containing ratings and comments
- **Satisfaction_Score**: The calculated average of all star ratings for a specific doctor
- **Provider**: A doctor in the system (from the existing providers table)
- **Unique_Survey_URL**: A URL containing doctor identification parameters for pre-filling survey forms

## Requirements

### Requirement 1: Survey Page Accessibility

**User Story:** As a patient, I want to access a satisfaction survey via QR code on my mobile device, so that I can provide feedback about my clinic visit.

#### Acceptance Criteria

1. THE Survey_System SHALL render a mobile-optimized survey page accessible via a unique URL
2. WHEN a QR code is scanned, THE Survey_System SHALL load the survey page within 2 seconds
3. THE Survey_System SHALL support URL parameters for doctor identification (e.g., ?doc=sybil)
4. WHERE a doctor parameter is provided in the URL, THE Survey_System SHALL pre-fill the doctor selection field
5. THE Survey_System SHALL display the survey form with responsive design for screen widths from 320px to 768px

### Requirement 2: Survey Data Collection

**User Story:** As a patient, I want to rate my experience and provide comments, so that the clinic can understand my satisfaction level.

#### Acceptance Criteria

1. THE Survey_System SHALL provide a dropdown field for doctor selection using normalized names (e.g., "Dr. Sybil Paz de Leon-Gadon")
2. THE Survey_System SHALL provide three 1-5 star rating scales for "Doctor Professionalism," "Waiting Time," and "Facility Cleanliness"
3. THE Survey_System SHALL provide a text area field labeled "How can we improve?" with a maximum length of 1000 characters
4. WHEN all required fields are completed, THE Survey_System SHALL enable the submit button
5. THE Survey_System SHALL validate that at least one rating is provided before submission
6. THE Survey_System SHALL validate that the selected doctor exists in the providers table

### Requirement 3: Survey Submission and Confirmation

**User Story:** As a patient, I want to see confirmation after submitting my feedback, so that I know my response was recorded.

#### Acceptance Criteria

1. WHEN a patient submits a valid survey, THE Survey_System SHALL store the response in the satisfaction_ratings table within 1 second
2. WHEN a survey is successfully submitted, THE Survey_System SHALL display a "Thank You" message with the clinic logo
3. THE Survey_System SHALL clear the form after successful submission
4. IF submission fails due to network error, THEN THE Survey_System SHALL display an error message and retain the form data
5. THE Survey_System SHALL prevent multiple submissions by disabling the submit button after the first click

### Requirement 4: Database Schema for Satisfaction Ratings

**User Story:** As a system administrator, I want survey responses stored in a structured database table, so that ratings can be analyzed and reported.

#### Acceptance Criteria

1. THE Rating_Engine SHALL create a satisfaction_ratings table with foreign key relationship to the providers table
2. THE satisfaction_ratings table SHALL store doctor_id, professionalism_rating, waiting_time_rating, cleanliness_rating, comments, submission_timestamp, and submitter_identifier
3. THE Rating_Engine SHALL enforce NOT NULL constraints on doctor_id and submission_timestamp
4. THE Rating_Engine SHALL enforce CHECK constraints ensuring ratings are integers between 1 and 5
5. THE Rating_Engine SHALL automatically set submission_timestamp to the current UTC time on insert

### Requirement 5: Doctor Satisfaction Score Calculation

**User Story:** As a clinic administrator, I want to see each doctor's average satisfaction score, so that I can identify performance trends.

#### Acceptance Criteria

1. WHEN a new Survey_Response is submitted, THE Rating_Engine SHALL recalculate the Satisfaction_Score for the associated Provider
2. THE Rating_Engine SHALL calculate Satisfaction_Score as the arithmetic mean of professionalism_rating, waiting_time_rating, and cleanliness_rating across all responses for a Provider
3. THE Rating_Engine SHALL round Satisfaction_Score to two decimal places
4. THE Rating_Engine SHALL store the calculated Satisfaction_Score in the providers table
5. THE Rating_Engine SHALL update the total_reviews count for the Provider

### Requirement 6: QR Code Generation

**User Story:** As a clinic administrator, I want to generate QR codes for each doctor, so that patients can easily access doctor-specific surveys.

#### Acceptance Criteria

1. THE QR_Generator SHALL create a QR code containing a Unique_Survey_URL for each Provider
2. THE QR_Generator SHALL encode the doctor identifier as a URL parameter (e.g., ?doc=sybil)
3. THE QR_Generator SHALL generate QR codes in PNG format with minimum dimensions of 200x200 pixels
4. THE QR_Generator SHALL support batch generation for all active providers
5. WHERE a room parameter is provided, THE QR_Generator SHALL include it in the URL (e.g., ?doc=sybil&room=3)

### Requirement 7: Doctor Dashboard Metrics Display

**User Story:** As a clinic administrator, I want to view satisfaction metrics on each doctor's profile, so that I can monitor patient feedback.

#### Acceptance Criteria

1. THE Doctor_Dashboard SHALL display the Satisfaction_Score for each Provider with precision to two decimal places
2. THE Doctor_Dashboard SHALL display the total_reviews count for each Provider
3. THE Doctor_Dashboard SHALL sort providers by Satisfaction_Score in descending order
4. WHEN a Provider has zero reviews, THE Doctor_Dashboard SHALL display "No reviews yet" instead of a score
5. THE Doctor_Dashboard SHALL refresh metrics automatically when new Survey_Response records are added

### Requirement 8: Sentiment Analysis of Comments

**User Story:** As a clinic owner, I want to see the general sentiment of patient feedback, so that I can quickly identify positive or negative trends.

#### Acceptance Criteria

1. THE Sentiment_Analyzer SHALL scan comments for positive keywords ("fast", "kind", "excellent", "professional", "clean")
2. THE Sentiment_Analyzer SHALL scan comments for negative keywords ("rude", "slow", "dirty", "unprofessional", "long wait")
3. THE Sentiment_Analyzer SHALL calculate a sentiment score as (positive_keyword_count - negative_keyword_count)
4. THE Sentiment_Analyzer SHALL classify sentiment as "Positive" (score > 0), "Neutral" (score = 0), or "Negative" (score < 0)
5. THE Doctor_Dashboard SHALL display the sentiment classification alongside each Provider's metrics

### Requirement 9: Rate Limiting for Review Integrity

**User Story:** As a system administrator, I want to prevent review bombing, so that satisfaction scores remain authentic and trustworthy.

#### Acceptance Criteria

1. THE Rate_Limiter SHALL record the submitter IP address or device identifier with each Survey_Response
2. WHEN a submission is attempted, THE Rate_Limiter SHALL check for existing submissions from the same identifier within the past 24 hours
3. IF a duplicate submission is detected within 24 hours, THEN THE Survey_System SHALL reject the submission with message "You have already submitted feedback today"
4. THE Rate_Limiter SHALL allow submissions from the same identifier after 24 hours have elapsed
5. THE Rate_Limiter SHALL use a combination of IP address and browser fingerprint for identifier uniqueness

### Requirement 10: Patient Privacy and Anonymity

**User Story:** As a patient, I want my feedback to remain anonymous to the doctor, so that I can provide honest opinions without concern.

#### Acceptance Criteria

1. THE Survey_System SHALL NOT collect patient names, email addresses, or phone numbers
2. THE Doctor_Dashboard SHALL NOT display submitter IP addresses or device identifiers to doctors
3. THE Doctor_Dashboard SHALL display only aggregated metrics and anonymous comments to doctors
4. WHERE a user has admin or owner role, THE Doctor_Dashboard SHALL allow viewing of individual Survey_Response records with timestamps
5. THE Rating_Engine SHALL enforce row-level security policies preventing doctors from accessing raw submission data

### Requirement 11: Survey Response Parsing and Validation

**User Story:** As a developer, I want survey inputs validated and sanitized, so that the system remains secure and data remains clean.

#### Acceptance Criteria

1. THE Survey_System SHALL sanitize all text inputs to prevent XSS attacks
2. THE Survey_System SHALL validate that rating values are integers between 1 and 5
3. THE Survey_System SHALL trim whitespace from comment text before storage
4. IF invalid data is submitted, THEN THE Survey_System SHALL return a descriptive error message
5. THE Survey_System SHALL validate that doctor_id corresponds to an active Provider before accepting submission

### Requirement 12: Survey Response Pretty Printing

**User Story:** As a clinic administrator, I want to export survey responses in a readable format, so that I can share feedback with staff.

#### Acceptance Criteria

1. THE Doctor_Dashboard SHALL provide an export function for Survey_Response records
2. THE Pretty_Printer SHALL format Survey_Response data into CSV format with headers
3. THE Pretty_Printer SHALL include columns for doctor_name, professionalism_rating, waiting_time_rating, cleanliness_rating, comments, and submission_date
4. THE Pretty_Printer SHALL escape special characters in comments to maintain CSV integrity
5. WHEN export is requested, THE Doctor_Dashboard SHALL generate and download the CSV file within 3 seconds

### Requirement 13: Round-Trip Data Integrity

**User Story:** As a system administrator, I want to ensure survey data maintains integrity through all transformations, so that reports remain accurate.

#### Acceptance Criteria

1. FOR ALL valid Survey_Response objects, parsing then formatting then parsing SHALL produce an equivalent object
2. THE Rating_Engine SHALL verify that stored ratings match submitted ratings after database insertion
3. THE Rating_Engine SHALL verify that calculated Satisfaction_Score matches the arithmetic mean of stored ratings
4. IF data integrity check fails, THEN THE Rating_Engine SHALL log an error and alert administrators
5. THE Rating_Engine SHALL perform integrity checks on all Survey_Response records during nightly maintenance

## Technical Constraints

- The system must integrate with existing Supabase database schema
- The survey page must be accessible without authentication
- QR codes must be printable at 300 DPI resolution
- The system must support concurrent submissions from multiple patients
- All timestamps must be stored in UTC timezone

## Non-Functional Requirements

- Survey page load time: < 2 seconds on 3G mobile connection
- Database query response time: < 500ms for satisfaction score calculation
- System availability: 99.5% uptime during clinic operating hours
- Data retention: Survey responses retained for minimum 2 years
