# Bugfix Requirements Document

## Introduction

After a lab result PDF is uploaded via the Lab Results page, the stored Google Drive URL is not publicly accessible. When a user clicks "View", the file either shows a "You need access" error or prompts for Google sign-in, making the uploaded file effectively invisible to clinic staff. The upload itself succeeds and the record is saved in Supabase, but the file cannot be viewed because no public sharing permission is set on the Google Drive file after upload.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a lab result PDF is uploaded via the OAuth flow (googleDriveOAuth.js) THEN the system uploads the file to Google Drive without setting a public sharing permission, resulting in a private file

1.2 WHEN a user clicks the "View" button on an uploaded lab result THEN the system opens the google_drive_url in a new tab but the file is inaccessible (shows "You need access" or Google sign-in prompt) because no viewer permission was granted

1.3 WHEN a lab result is uploaded via the backend service account flow (server/services/googleDrive.js) THEN the system skips the `permissions.create` call (it is commented out), leaving the file private and unviewable

### Expected Behavior (Correct)

2.1 WHEN a lab result PDF is uploaded via the OAuth flow THEN the system SHALL set a "reader" permission for "anyone" on the uploaded Google Drive file so it is accessible via the stored URL

2.2 WHEN a user clicks the "View" button on an uploaded lab result THEN the system SHALL open the file in a new tab and the file SHALL be viewable without requiring additional Google authentication

2.3 WHEN a lab result is uploaded via the backend service account flow THEN the system SHALL call `permissions.create` with `role: 'reader'` and `type: 'anyone'` after a successful file upload so the file is publicly viewable

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a valid PDF file is selected and the upload form is submitted THEN the system SHALL CONTINUE TO upload the file to Google Drive and save the metadata (fileId, url, file_size, test_name, test_date, patient_id) to the Supabase lab_results table

3.2 WHEN a user deletes a lab result THEN the system SHALL CONTINUE TO delete the file from Google Drive and remove the record from the Supabase database

3.3 WHEN a non-PDF file or a file exceeding 10MB is selected THEN the system SHALL CONTINUE TO reject the file with an appropriate validation message before attempting upload

3.4 WHEN lab results are loaded on the Lab Results page THEN the system SHALL CONTINUE TO display all results with patient name, test name, test type, and test date
