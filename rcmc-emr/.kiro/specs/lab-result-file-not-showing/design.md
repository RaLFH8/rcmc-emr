# Lab Result File Not Showing Bugfix Design

## Overview

After a lab result PDF is uploaded, the file is stored in Google Drive but remains private. Clicking "View" shows a "You need access" error because neither upload path sets a public sharing permission on the file. The fix is minimal: add a `permissions.create` call (role: `reader`, type: `anyone`) after each successful upload in both the OAuth client path and the service account backend path.

## Glossary

- **Bug_Condition (C)**: A file was uploaded to Google Drive without a public `reader` permission being set, making the stored URL inaccessible
- **Property (P)**: After upload, the file SHALL be viewable by anyone with the link (no Google sign-in required)
- **Preservation**: All existing upload, delete, validation, and display behaviors must remain unchanged
- **uploadToGoogleDrive (OAuth)**: The function in `src/lib/googleDriveOAuth.js` that uploads via the user's OAuth token using the Drive REST API
- **uploadToGoogleDrive (service account)**: The function in `server/services/googleDrive.js` that uploads via a service account using the googleapis SDK
- **permissions.create**: The Google Drive API call that sets sharing permissions on a file

## Bug Details

### Bug Condition

The bug manifests when a lab result PDF is uploaded via either the OAuth flow or the backend service account flow. In both cases, the file is uploaded successfully but no sharing permission is set, leaving the file private.

**Formal Specification:**
```
FUNCTION isBugCondition(uploadResult)
  INPUT: uploadResult — the result of a Google Drive file upload
  OUTPUT: boolean

  RETURN uploadResult.fileId IS NOT NULL
         AND noPublicPermissionSet(uploadResult.fileId)
END FUNCTION

FUNCTION noPublicPermissionSet(fileId)
  // True when permissions.create with role='reader', type='anyone'
  // was NOT called after the upload
  RETURN permissionsNotCreated(fileId)
END FUNCTION
```

### Examples

- Upload via OAuth flow → file saved to Drive → no `permissions.create` called → "View" opens "You need access" page (bug)
- Upload via service account → file saved to Drive → `permissions.create` is commented out → "View" opens "You need access" page (bug)
- After fix: upload via OAuth → `permissions.create` called → "View" opens the PDF directly (correct)
- After fix: upload via service account → `permissions.create` called → "View" opens the PDF directly (correct)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Valid PDF upload must continue to save `fileId`, `url`, `file_size`, `test_name`, `test_date`, `patient_id` to Supabase `lab_results` table
- Delete must continue to remove the file from Google Drive and the record from Supabase
- File validation (PDF-only, 10MB max) must continue to reject invalid files before upload
- Lab Results page must continue to display all results with patient name, test name, test type, and test date

**Scope:**
All inputs that do NOT involve the post-upload permission step are completely unaffected. This includes:
- File selection and validation logic
- Supabase insert/delete operations
- UI rendering and filtering
- The delete flow (no permission changes needed there)

## Hypothesized Root Cause

1. **Missing permissions.create in OAuth path**: `src/lib/googleDriveOAuth.js` — `uploadToGoogleDrive` calls the Drive REST API to upload the file but never makes a follow-up `PATCH /drive/v3/files/{fileId}/permissions` call to set public access

2. **Commented-out permissions.create in service account path**: `server/services/googleDrive.js` — the `permissions.create` call exists in the code but is wrapped in a comment block (`/* ... */`) with a note saying "optional - depends on your security requirements", so it never executes

## Correctness Properties

Property 1: Bug Condition - Uploaded File Is Publicly Viewable

_For any_ lab result PDF upload where the upload succeeds (isBugCondition returns true — i.e., a fileId is returned but no public permission was set), the fixed `uploadToGoogleDrive` function SHALL call `permissions.create` with `role: 'reader'` and `type: 'anyone'` so the file is accessible via its stored URL without requiring Google authentication.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Existing Upload and Delete Behavior Unchanged

_For any_ input that does NOT involve the post-upload permission step (file validation, Supabase operations, delete flow, UI rendering), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing functionality.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Fix Implementation

### Changes Required

**File 1**: `rcmc-emr/src/lib/googleDriveOAuth.js`

**Function**: `uploadToGoogleDrive`

**Specific Changes**:
1. After the successful `fetch` to `googleapis.com/upload/drive/v3/files`, add a second `fetch` call to `googleapis.com/drive/v3/files/{fileId}/permissions`
2. The permissions request body: `{ role: 'reader', type: 'anyone' }`
3. Use the same `Authorization: Bearer {token}` header
4. The permission call should happen before `resolve(...)` is called
5. If the permission call fails, log a warning but do not fail the entire upload (the file is uploaded; permission failure is non-fatal)

```javascript
// After successful upload, set public read permission
await fetch(
  `https://www.googleapis.com/drive/v3/files/${result.id}/permissions`,
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ role: 'reader', type: 'anyone' })
  }
)
```

---

**File 2**: `rcmc-emr/server/services/googleDrive.js`

**Function**: `uploadToGoogleDrive`

**Specific Changes**:
1. Uncomment the existing `permissions.create` block (remove `/*` and `*/`)
2. No other changes needed — the call is already correctly structured with `role: 'reader'` and `type: 'anyone'`

```javascript
// Uncomment this block:
await driveClient.permissions.create({
  fileId: response.data.id,
  requestBody: {
    role: 'reader',
    type: 'anyone'
  }
})
```

## Testing Strategy

### Validation Approach

Two-phase approach: first run exploratory tests on unfixed code to confirm the bug, then verify the fix works and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Confirm that uploaded files are inaccessible before the fix.

**Test Plan**: Mock the Google Drive API calls and assert that after `uploadToGoogleDrive` resolves, no `permissions.create` / permissions endpoint call was made. Run on UNFIXED code to observe the failure.

**Test Cases**:
1. **OAuth upload — no permission call**: Call `uploadToGoogleDrive` in `googleDriveOAuth.js`, assert that a permissions POST was made to the Drive API (will fail on unfixed code)
2. **Service account upload — no permission call**: Call `uploadToGoogleDrive` in `server/services/googleDrive.js`, assert that `driveClient.permissions.create` was called (will fail on unfixed code — it's commented out)

**Expected Counterexamples**:
- No permissions endpoint is called after upload in either path
- The `webViewLink` URL returned requires Google sign-in to access

### Fix Checking

**Goal**: Verify that after the fix, every successful upload results in a public permission being set.

**Pseudocode:**
```
FOR ALL upload WHERE isBugCondition(uploadResult) DO
  result := uploadToGoogleDrive_fixed(file, metadata)
  ASSERT permissionsCreateCalledWith(result.fileId, { role: 'reader', type: 'anyone' })
END FOR
```

### Preservation Checking

**Goal**: Verify that file validation, Supabase operations, and delete behavior are unchanged.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT uploadToGoogleDrive_original(input) = uploadToGoogleDrive_fixed(input)
END FOR
```

**Testing Approach**: Unit tests for validation paths; the permission call is additive and does not alter the return value or any other behavior.

**Test Cases**:
1. **PDF validation preserved**: Non-PDF file still rejected before upload attempt
2. **Size validation preserved**: File > 10MB still rejected before upload attempt
3. **Return value preserved**: `uploadToGoogleDrive` still resolves with `{ fileId, url, size }` after fix
4. **Delete preserved**: `deleteFromGoogleDrive` behavior is completely unchanged

### Unit Tests

- Test that `uploadToGoogleDrive` (OAuth) calls the permissions endpoint after a successful upload
- Test that `uploadToGoogleDrive` (service account) calls `permissions.create` after a successful upload
- Test that a failed permission call does not cause the overall upload to fail
- Test that file validation (type, size) still rejects invalid inputs

### Property-Based Tests

- Generate random valid PDF metadata and verify that every successful upload results in a permissions call
- Generate random non-PDF / oversized file inputs and verify they are always rejected before any Drive API call

### Integration Tests

- Upload a real PDF via the OAuth flow and verify the returned URL is accessible without authentication
- Upload a real PDF via the service account flow and verify the returned URL is accessible without authentication
- Verify the "View" button on the Lab Results page opens the file directly
