# Lab Result File Not Showing — Implementation Tasks

## Tasks

- [x] 1. Write exploratory tests to confirm the bug on unfixed code
  - [x] 1.1 Write a unit test for `uploadToGoogleDrive` in `src/lib/googleDriveOAuth.js` that mocks the Drive REST API and asserts a permissions POST is made after upload — expect this to FAIL on unfixed code
  - [x] 1.2 Write a unit test for `uploadToGoogleDrive` in `server/services/googleDrive.js` that mocks `driveClient.permissions.create` and asserts it is called after upload — expect this to FAIL on unfixed code
  - [x] 1.3 Run the exploratory tests and document the counterexamples (no permissions call observed)

- [x] 2. Fix the OAuth upload path
  - [x] 2.1 In `src/lib/googleDriveOAuth.js`, inside `uploadToGoogleDrive`, after the successful upload `fetch` resolves and `result.id` is available, add a `fetch` POST to `https://www.googleapis.com/drive/v3/files/${result.id}/permissions` with body `{ role: 'reader', type: 'anyone' }` and the same Bearer token header
  - [x] 2.2 Wrap the permissions call in a try/catch so a permission failure logs a warning but does not reject the upload promise

- [x] 3. Fix the service account upload path
  - [x] 3.1 In `server/services/googleDrive.js`, inside `uploadToGoogleDrive`, uncomment the existing `driveClient.permissions.create` block (remove the `/*` and `*/` delimiters)

- [x] 4. Verify the fix with tests
  - [x] 4.1 Re-run the exploratory tests from task 1 — they should now PASS
  - [x] 4.2 Write a preservation test confirming `uploadToGoogleDrive` (OAuth) still resolves with `{ fileId, url, size }` after the fix
  - [x] 4.3 Write a preservation test confirming file validation (non-PDF rejection, >10MB rejection) is unchanged
  - [x] 4.4 Write a preservation test confirming `deleteFromGoogleDrive` behavior is unchanged
