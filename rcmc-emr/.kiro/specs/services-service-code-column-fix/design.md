# Services Service Code Column Fix - Bugfix Design

## Overview

The `services` table schema defines the code column as `code`, but four locations in the application reference it as `service_code`. This causes a `42703: column "service_code" does not exist` error whenever a service is inserted, queried by code prefix, or queried by exact code. The CSV import template also uses `service_code` as a header, causing imported rows to silently fail or error.

The fix is a pure rename: replace every `service_code` reference in application code with `code`. No database migration is needed — the schema is already correct.

## Glossary

- **Bug_Condition (C)**: Any operation that references the column name `service_code` against the `services` table
- **Property (P)**: The desired behavior — operations against the `services` table use the correct column name `code` and succeed without a 42703 error
- **Preservation**: All existing service CRUD operations (load, edit, delete, search/filter) that do not reference `service_code` must remain unchanged
- **`getServicesByCodePrefix`**: Function in `src/lib/supabase.js` that queries services by code prefix using `.select()` and `.like()`
- **`getServiceByCode`**: Function in `src/lib/supabase.js` that queries a single service by exact code using `.eq()`
- **`handleSubmit`**: Form submission handler in `src/pages/Services.jsx` that builds the INSERT payload for a new service
- **`TEMPLATE_ROWS`**: CSV template string constant in `src/components/services/ServicesCSVImportModal.jsx` that defines the downloadable template header

## Bug Details

### Bug Condition

The bug manifests whenever application code constructs a Supabase query or data payload that references the column name `service_code` on the `services` table. The database rejects the operation with error code `42703` because the actual column is named `code`.

**Formal Specification:**
```
FUNCTION isBugCondition(operation)
  INPUT: operation — a Supabase query or INSERT payload targeting the services table
  OUTPUT: boolean

  RETURN operation references column name "service_code"
         AND target table is "services"
         AND "service_code" column does NOT exist in services schema
END FUNCTION
```

### Examples

- **Add Service form submit**: `serviceData` object contains key `service_code` → INSERT fails with 42703
- **CSV import row**: template header `service_code` is parsed and mapped to `service_code` key → INSERT payload contains `service_code` → fails with 42703
- **`getServicesByCodePrefix('LAB')`**: `.select('service_code').like('service_code', 'LAB%')` → SELECT fails with 42703
- **`getServiceByCode('LAB-001')`**: `.eq('service_code', 'LAB-001')` → SELECT fails with 42703

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- `db.getServices()` — full SELECT with no column filter — must continue to load all services correctly
- `db.updateService(id, updates)` — UPDATE by id — must continue to work (it does not reference `service_code`)
- `db.deleteService(id)` — soft-delete by id — must continue to work
- Search and filter logic in `Services.jsx` operates on in-memory data and must remain unaffected
- The CSV import modal's parse logic, validation, and UI flow must remain unchanged except for the template header and the column name used in the INSERT payload

**Scope:**
All operations that do NOT reference `service_code` are completely unaffected by this fix. This includes:
- Loading the services list
- Editing an existing service
- Deactivating (deleting) a service
- Searching and filtering the displayed list
- Any other table's queries

## Hypothesized Root Cause

The column was likely named `service_code` during early development and later renamed to `code` in the schema (or the schema was always `code` and the application was written with the wrong assumption). The rename was applied to the database but not propagated to all application references.

1. **Stale column name in `supabase.js`**: `getServicesByCodePrefix` and `getServiceByCode` were written or copied with `service_code` and never updated after the schema was finalized
2. **Stale column name in `Services.jsx` form handler**: The `handleSubmit` function builds `serviceData` using `formData.code` correctly for the value, but the INSERT payload key was not verified against the schema
3. **Stale CSV template header**: `TEMPLATE_ROWS` in `ServicesCSVImportModal.jsx` uses `service_code` as the column header, and the import logic maps CSV headers directly to INSERT keys
4. **No runtime schema validation**: There is no compile-time or startup check that verifies column names match the schema, so the mismatch went undetected until runtime

## Correctness Properties

Property 1: Bug Condition - Service Operations Use Correct Column Name

_For any_ operation where the bug condition holds (the operation references `service_code` on the `services` table), the fixed code SHALL use `code` instead, causing the operation to succeed without a 42703 error and return the expected data.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Preservation - Existing Service CRUD Behavior Unchanged

_For any_ operation where the bug condition does NOT hold (operations that do not reference `service_code` — load, edit, delete, search), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing service management functionality.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Fix Implementation

### Changes Required

Assuming the root cause is confirmed (wrong column name in application code), the fix is four targeted string replacements:

**File 1**: `rcmc-emr/src/lib/supabase.js`

**Function**: `getServicesByCodePrefix`

**Change**: Replace `.select('service_code').like('service_code', ...)` with `.select('code').like('code', ...)`

---

**File 2**: `rcmc-emr/src/lib/supabase.js`

**Function**: `getServiceByCode`

**Change**: Replace `.eq('service_code', code)` with `.eq('code', code)`

---

**File 3**: `rcmc-emr/src/components/services/ServicesCSVImportModal.jsx`

**Constant**: `TEMPLATE_ROWS`

**Change**: Replace `service_code` header in the template CSV string with `code`

**Also**: In the `handleImport` function, the line `const code = row.service_code?.trim() || ...` reads from the parsed CSV row using the header key. After the template header is renamed to `code`, this must read `row.code?.trim()` instead.

---

**File 4**: `rcmc-emr/src/pages/Services.jsx`

**Constant**: `SERVICES_TEMPLATE_ROWS`

**Change**: Replace `service_code` header in the template CSV string with `code`

**Note**: The `handleSubmit` function in `Services.jsx` already builds the payload with key `code` (via `formData.code`), so no change is needed there.

## Testing Strategy

### Validation Approach

Two-phase approach: first run exploratory tests on the unfixed code to confirm the root cause, then verify the fix works and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm the root cause is the wrong column name.

**Test Plan**: Write unit tests that call each buggy function/operation with valid inputs and assert the operation succeeds. Run on unfixed code to observe the 42703 error.

**Test Cases**:
1. **Add Service test**: Call `db.addService({ name: 'Test', code: 'TST-001', category: 'Other', price: 100, status: 'Active' })` — will fail on unfixed code if INSERT payload contains `service_code`
2. **getServicesByCodePrefix test**: Call `db.getServicesByCodePrefix('LAB')` — will fail on unfixed code with 42703
3. **getServiceByCode test**: Call `db.getServiceByCode('LAB-001')` — will fail on unfixed code with 42703
4. **CSV import test**: Parse a CSV row with header `service_code` and attempt insert — will fail on unfixed code

**Expected Counterexamples**:
- Supabase returns `{ error: { code: '42703', message: 'column "service_code" of relation "services" does not exist' } }`
- Confirms root cause: application uses wrong column name

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed functions succeed.

**Pseudocode:**
```
FOR ALL operation WHERE isBugCondition(operation) DO
  result := fixedOperation(operation)
  ASSERT result.error IS NULL
  ASSERT result.data IS NOT NULL (for SELECT operations)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed code produces the same result as the original.

**Pseudocode:**
```
FOR ALL operation WHERE NOT isBugCondition(operation) DO
  ASSERT original_operation(operation) = fixed_operation(operation)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many service record shapes automatically
- It catches edge cases (empty descriptions, special characters in names, zero prices)
- It provides strong guarantees that non-buggy paths are unaffected

**Test Plan**: Observe behavior of load/edit/delete on unfixed code first, then write tests to verify the same behavior after the fix.

**Test Cases**:
1. **Load services preservation**: `db.getServices()` returns the same records before and after fix
2. **Update service preservation**: `db.updateService(id, updates)` succeeds and returns updated record
3. **Delete service preservation**: `db.deleteService(id)` sets status to Inactive
4. **Search/filter preservation**: Filtering in-memory service list by name and category returns correct results

### Unit Tests

- Test `getServicesByCodePrefix` returns services matching the prefix after fix
- Test `getServiceByCode` returns the correct service after fix
- Test `addService` inserts successfully with `code` field after fix
- Test CSV import with `code` header maps correctly to the INSERT payload

### Property-Based Tests

- Generate random service objects with valid `code` values and verify `addService` succeeds for all
- Generate random code prefixes and verify `getServicesByCodePrefix` returns only matching services
- Generate random service updates and verify `updateService` preserves all non-updated fields

### Integration Tests

- Full flow: open Add Service form → submit → verify service appears in the list
- Full flow: download CSV template → fill in data → import → verify services appear in the list
- Full flow: edit an existing service → verify changes persist
- Full flow: delete a service → verify it no longer appears in the active list
