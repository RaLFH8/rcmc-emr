# Implementation Plan: Patient Satisfaction Survey

## Overview

This implementation plan breaks down the Patient Satisfaction Survey feature into discrete coding tasks. The feature enables patients to provide feedback via QR code-accessible surveys, calculates doctor satisfaction scores, and displays aggregated metrics on a dashboard. The implementation follows a bottom-up approach: database layer first, then backend services, then frontend components, with testing integrated throughout.

## Tasks

- [x] 1. Set up database schema and functions
  - [x] 1.1 Create satisfaction_ratings table with constraints and indexes
    - Create table with all columns (id, doctor_id, ratings, comments, sentiment fields, submitter info, timestamps)
    - Add foreign key constraint to doctors table
    - Add CHECK constraints for rating values (1-5)
    - Create indexes on doctor_id, submission_timestamp, and (submitter_fingerprint, submission_timestamp)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [x] 1.2 Add satisfaction metrics columns to doctors table
    - Add satisfaction_score column (DECIMAL(3,2), CHECK 1.00-5.00)
    - Add total_reviews column (INTEGER, DEFAULT 0)
    - Create index on satisfaction_score for sorting
    - _Requirements: 5.4, 5.5_
  
  - [x] 1.3 Create database trigger for satisfaction score calculation
    - Implement update_doctor_satisfaction_score() function
    - Calculate average of (professionalism + waiting_time + cleanliness) / 3 across all responses
    - Round to 2 decimal places
    - Update total_reviews count
    - Create AFTER INSERT trigger on satisfaction_ratings
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [x] 1.4 Create sentiment analysis database function
    - Implement analyze_sentiment(comment_text) function
    - Define positive and negative keyword arrays
    - Count keyword occurrences in comment text
    - Calculate sentiment_score as (positive_count - negative_count)
    - Classify as Positive (>0), Neutral (=0), or Negative (<0)
    - Return score and classification
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [x] 1.5 Set up Row Level Security policies
    - Create policy allowing anonymous inserts to satisfaction_ratings
    - Create policy preventing doctors from querying satisfaction_ratings directly
    - Create policy allowing admin/owner roles to query all satisfaction_ratings
    - Create policy allowing all authenticated users to read doctors table
    - _Requirements: 10.2, 10.3, 10.4, 10.5_

- [x] 2. Implement backend services and utilities
  - [x] 2.1 Extend Supabase database helpers
    - Add submitSurvey() method to insert survey response
    - Add analyzeSentiment() method to call sentiment function and update record
    - Add getDoctorFeedback() method to retrieve feedback for a doctor
    - Add exportSurveyResponses() method to retrieve responses for CSV export
    - Handle errors gracefully with try-catch
    - _Requirements: 3.1, 3.4, 8.5, 12.1_
  
  - [x] 2.2 Create rate limiter service
    - Install @fingerprintjs/fingerprintjs package
    - Implement checkRateLimit() function
    - Generate browser fingerprint using FingerprintJS
    - Fetch IP address from api.ipify.org (best effort)
    - Query satisfaction_ratings for submissions from same fingerprint in last 24 hours
    - Return allowed status, fingerprint, IP, and last submission timestamp
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [x] 2.3 Create QR code generator utility
    - Install qrcode package
    - Implement generateDoctorQR() function with doctor ID and optional room parameter
    - Generate URL with query parameters (?doc=ID&room=ROOM)
    - Create QR code as PNG data URL with 400x400 dimensions
    - Implement generateBatchQRCodes() for multiple doctors
    - Implement downloadQRCode() helper to trigger browser download
    - Handle errors gracefully
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 3. Build public survey page component
  - [x] 3.1 Create PublicSurvey page component structure
    - Create src/pages/PublicSurvey.jsx file
    - Set up component state (doctorId, ratings, comments, submission status, errors)
    - Parse URL parameters to extract doctor ID
    - Implement responsive layout with TailwindCSS (320px-768px)
    - Add clinic logo and header
    - _Requirements: 1.1, 1.2, 1.3, 1.5_
  
  - [x] 3.2 Implement survey form UI elements
    - Create doctor dropdown with normalized names from doctors table
    - Pre-fill doctor selection if URL parameter exists
    - Create three 5-star rating inputs (professionalism, waiting time, cleanliness)
    - Create comment textarea with 1000 character limit
    - Style for mobile-first design with proper touch targets (44x44px minimum)
    - Add character counter for comments
    - _Requirements: 1.4, 2.1, 2.2, 2.3_
  
  - [x] 3.3 Implement form validation logic
    - Validate that doctor selection is made
    - Validate that at least one rating is provided
    - Validate that ratings are integers 1-5
    - Validate that selected doctor exists in providers table
    - Enable submit button only when form is valid
    - Display inline validation errors
    - _Requirements: 2.4, 2.5, 2.6, 11.2, 11.4, 11.5_
  
  - [x] 3.4 Implement survey submission handler
    - Call checkRateLimit() before submission
    - Display rate limit error if submission within 24 hours
    - Sanitize comment text to prevent XSS
    - Trim whitespace from comments
    - Disable submit button on click to prevent duplicates
    - Call submitSurvey() with form data
    - Handle network errors and display error message
    - Retain form data on error
    - _Requirements: 3.1, 3.4, 3.5, 9.2, 9.3, 11.1, 11.3_
  
  - [x] 3.5 Implement submission confirmation UI
    - Display "Thank You" message with clinic logo on success
    - Clear form after successful submission
    - Reset component state to initial values
    - Provide option to submit another review (after 24 hours)
    - _Requirements: 3.2, 3.3_

- [ ] 4. Checkpoint - Test survey submission flow
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Extend Doctors dashboard with satisfaction metrics
  - [x] 5.1 Add satisfaction metrics display to Doctors page
    - Extend src/pages/Doctors.jsx component
    - Display satisfaction_score badge next to each doctor (2 decimal places)
    - Display total_reviews count
    - Show "No reviews yet" when total_reviews is 0
    - Sort doctors by satisfaction_score in descending order
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [x] 5.2 Create feedback modal component
    - Create modal to display individual survey responses
    - Show professionalism, waiting time, and cleanliness ratings
    - Show comments and sentiment classification
    - Show submission timestamp
    - Sort by most recent first
    - Limit to 50 most recent responses
    - Hide submitter IP and fingerprint from doctors
    - Show full details to admin/owner roles
    - _Requirements: 8.5, 10.2, 10.3, 10.4_
  
  - [x] 5.3 Add QR code generation UI
    - Add "Generate QR Code" button for each doctor
    - Call generateDoctorQR() on button click
    - Display QR code in modal with download button
    - Implement downloadQRCode() to save PNG file
    - Add batch generation button for all active doctors
    - Handle QR generation errors gracefully
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [x] 5.4 Implement CSV export functionality
    - Add "Export Feedback" button to dashboard
    - Call exportSurveyResponses() to retrieve data
    - Format data as CSV with headers (doctor_name, ratings, comments, submission_date)
    - Escape special characters (commas, quotes, newlines) in comments
    - Trigger browser download of CSV file
    - Support filtering by specific doctor
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 6. Add routing and navigation
  - [ ] 6.1 Add survey route to application
    - Add /survey route to src/App.jsx
    - Configure route to be publicly accessible (no auth required)
    - Add /survey to navigation if needed
    - Test route loads correctly with and without URL parameters
    - _Requirements: 1.1, 1.3_

- [ ] 7. Checkpoint - Test dashboard integration
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 8. Write unit tests for components and services
  - [ ]* 8.1 Write unit tests for PublicSurvey component
    - Test component renders all form elements
    - Test URL parameter parsing and pre-filling
    - Test form validation enables/disables submit button
    - Test successful submission displays confirmation
    - Test error handling displays error message
    - Test form clears after successful submission
    - Test form retains data on error
  
  - [ ]* 8.2 Write unit tests for rate limiter service
    - Test fingerprint generation succeeds
    - Test IP address fetching (with mock)
    - Test allows submission when no recent submissions
    - Test blocks submission when recent submission exists
    - Test allows submission after 24 hours
  
  - [ ]* 8.3 Write unit tests for QR generator utility
    - Test generates QR code with doctor ID
    - Test includes room parameter when provided
    - Test returns PNG data URL
    - Test handles generation errors gracefully
    - Test batch generates for multiple doctors
  
  - [ ]* 8.4 Write unit tests for database helpers
    - Test submitSurvey() inserts record correctly
    - Test analyzeSentiment() calls function and updates record
    - Test getDoctorFeedback() retrieves feedback
    - Test exportSurveyResponses() returns array
  
  - [ ]* 8.5 Write edge case tests
    - Test empty comment is allowed
    - Test maximum length comment (1000 chars)
    - Test special characters in comments
    - Test invalid doctor ID
    - Test missing required fields
    - Test zero reviews displays "No reviews yet"

- [ ]* 9. Write property-based tests
  - [ ]* 9.1 Write property test for rating value constraints
    - **Property 4: Rating Value Constraints**
    - **Validates: Requirements 4.4, 11.2**
    - Test that only integers 1-5 are accepted for all rating fields
  
  - [ ]* 9.2 Write property test for satisfaction score calculation
    - **Property 10: Satisfaction Score Calculation**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 13.3**
    - Test that satisfaction_score equals arithmetic mean of all ratings, rounded to 2 decimals
  
  - [ ]* 9.3 Write property test for review count accuracy
    - **Property 11: Review Count Accuracy**
    - **Validates: Requirements 5.5**
    - Test that total_reviews equals count of satisfaction_ratings records
  
  - [ ]* 9.4 Write property test for sentiment keyword detection
    - **Property 18: Sentiment Keyword Detection**
    - **Validates: Requirements 8.1, 8.2**
    - Test that positive and negative keywords are correctly counted
  
  - [ ]* 9.5 Write property test for sentiment score calculation
    - **Property 19: Sentiment Score Calculation**
    - **Validates: Requirements 8.3**
    - Test that sentiment_score equals (positive_count - negative_count)
  
  - [ ]* 9.6 Write property test for sentiment classification
    - **Property 20: Sentiment Classification**
    - **Validates: Requirements 8.4**
    - Test that classification is Positive (>0), Neutral (=0), or Negative (<0)
  
  - [ ]* 9.7 Write property test for whitespace trimming
    - **Property 30: Whitespace Trimming**
    - **Validates: Requirements 11.3**
    - Test that leading/trailing whitespace is trimmed from comments
  
  - [ ]* 9.8 Write property test for CSV special character escaping
    - **Property 33: CSV Special Character Escaping**
    - **Validates: Requirements 12.4**
    - Test that commas, quotes, and newlines are properly escaped in CSV export
  
  - [ ]* 9.9 Write property test for survey response round-trip
    - **Property 35: Survey Response Round-Trip**
    - **Validates: Requirements 13.1**
    - Test that survey data maintains integrity through store/retrieve cycle

- [ ]* 10. Write integration tests
  - [ ]* 10.1 Write end-to-end survey submission test
    - Test complete flow: load survey → fill form → submit → verify database record
    - Verify satisfaction score updated in doctors table
    - Verify review count incremented
  
  - [ ]* 10.2 Write rate limiting flow test
    - Test submit survey → immediate resubmission → verify rejection
    - Test submission after 24 hours → verify acceptance
  
  - [ ]* 10.3 Write dashboard display test
    - Test submit multiple surveys → verify dashboard shows correct scores
    - Verify sorting by satisfaction score
    - Verify sentiment display
  
  - [ ]* 10.4 Write privacy enforcement test
    - Test doctor role cannot view raw submission data
    - Test admin role can view raw submission data

- [ ]* 11. Write database tests
  - [ ]* 11.1 Write schema validation tests
    - Verify satisfaction_ratings table exists with correct columns
    - Verify foreign key constraints
    - Verify CHECK constraints on ratings
    - Verify indexes exist
  
  - [ ]* 11.2 Write trigger tests
    - Test insert survey → verify satisfaction_score updated
    - Test multiple inserts → verify score is correct average
    - Test total_reviews incremented correctly
  
  - [ ]* 11.3 Write sentiment analysis function tests
    - Test positive keywords → verify positive classification
    - Test negative keywords → verify negative classification
    - Test mixed keywords → verify correct score
  
  - [ ]* 11.4 Write RLS policy tests
    - Test doctor role cannot query satisfaction_ratings
    - Test admin role can query satisfaction_ratings
    - Test anonymous users can insert to satisfaction_ratings

- [ ] 12. Final integration and deployment preparation
  - [ ] 12.1 Create database migration script
    - Combine all SQL statements into single migration file
    - Add rollback statements
    - Test migration on development database
    - Document migration steps
    - _Requirements: All database requirements_
  
  - [ ] 12.2 Install required npm packages
    - Install qrcode package
    - Install @fingerprintjs/fingerprintjs package
    - Install fast-check for property tests (dev dependency)
    - Install @faker-js/faker for test data (dev dependency)
    - Update package.json and package-lock.json
  
  - [ ] 12.3 Add error logging and monitoring
    - Implement error logging utility
    - Add error logging to all try-catch blocks
    - Configure production error tracking (if available)
    - Add performance monitoring for survey page load time
    - _Requirements: Non-functional requirements_
  
  - [ ] 12.4 Perform accessibility audit
    - Verify keyboard navigation works for all form elements
    - Add ARIA labels to all inputs
    - Test with screen reader
    - Verify color contrast meets WCAG standards
    - Verify focus indicators are visible
  
  - [ ] 12.5 Perform mobile optimization testing
    - Test on devices with 320px, 375px, 414px, and 768px widths
    - Verify touch targets are minimum 44x44px
    - Test QR code scanning on physical devices
    - Verify page loads in under 2 seconds on 3G
    - Test form submission on mobile networks

- [ ] 13. Final checkpoint - Complete system verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Database setup must be completed before backend services
- Backend services must be completed before frontend components
- Testing tasks are optional but highly recommended for production quality
- Property tests require fast-check library (100+ iterations per property)
- Integration tests should use test database to avoid polluting production data
- QR codes should be tested by scanning with actual mobile devices
- Rate limiting should be tested with different fingerprints and IP addresses
- Privacy policies should be verified by attempting unauthorized access
