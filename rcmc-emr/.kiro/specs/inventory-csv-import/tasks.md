# Implementation Plan: Inventory CSV Import

## Overview

Implement a 3-step wizard-driven CSV import flow for the RCMC inventory module. The work extends existing infrastructure (`InventoryImportModal`, `inventoryImportService`, `duplicateDetector`, `batchProcessor`, `auditLogger`) and adds a new `inventoryValidationRules.js` module. The `CSVImportModal` is replaced by `InventoryImportModal` as the single entry point in `Inventory.jsx`.

## Tasks

- [x] 1. Create `inventoryValidationRules.js` module
  - Create `src/utils/import/inventoryValidationRules.js`
  - Export `VALID_CATEGORIES` array with all 8 accepted category strings
  - Export `getInventoryValidationRules()` returning rules for: required non-empty `name`, required positive `price` (PHP), non-negative integer `stock`, non-negative integer `reorder_level`, valid `category` enum, parseable `expiry_date`
  - Use `createValidationRule`, `requiredField`, `typeValidation`, `rangeValidation`, `customValidation` from `validationEngine.js`
  - Error messages must match requirements exactly (e.g. "Item name is required", "Price must be a positive number (PHP)", "Stock must be a non-negative integer", "Reorder level must be a non-negative integer", "Expiry date is not a valid date")
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ]* 1.1 Write unit tests for `inventoryValidationRules`
    - Create `src/tests/inventory/inventoryValidationRules.test.js`
    - Test each rule with valid and invalid examples: empty name, whitespace-only name, zero price, negative price, non-numeric price, negative stock, float stock, invalid category string, unparseable date string
    - _Requirements: 4.1–4.7_

- [x] 2. Extend `inventoryImportService.js` with `validateInventoryRows` and `buildInsertPayload`
  - Add `validateInventoryRows(rows)` that calls `getInventoryValidationRules()` and `validationEngine.validateData()`, returning a flat `RowError[]`
  - Add `buildInsertPayload(row)` that maps CSV fields to DB columns, applies all defaults (`stock=0`, `reorder_level=10`, `unit=''`, `supplier=''`, `expiry_date=null`, `category='Others'`), handles `expiration_date` alias for `expiry_date`, auto-generates `batch_number` if absent, and explicitly omits the `status` key
  - Column name resolution must be case-insensitive (normalize headers before lookup)
  - _Requirements: 3.1, 3.2, 3.3, 3.5, 4.1–4.7, 7.2_

  - [ ]* 2.1 Write unit tests for `buildInsertPayload`
    - Create `src/tests/inventory/inventoryImportService.test.js`
    - Test: `status` key is absent from payload, `expiration_date` alias maps to `expiry_date`, all defaults applied when optional columns absent, `item_name` / `Item Name` / `name` all resolve correctly
    - _Requirements: 3.3, 3.5, 7.2_

- [x] 3. Update `duplicateDetector.detectDuplicateInventory` to key on `(name, expiry_date)`
  - Modify `detectDuplicateInventory` in `src/utils/import/duplicateDetector.js` to query `inventory` table matching `name ilike :name AND expiry_date = :expiry_date` only when `expiry_date` is non-null
  - When `expiry_date` is null, do not match against any existing row (treat as distinct batch)
  - Add intra-file duplicate detection: before querying the DB, scan the current import batch for repeated `(name, expiry_date)` pairs and flag all but the first occurrence
  - _Requirements: 5.1, 5.2, 5.4, 9.3_

  - [ ]* 3.1 Write property test for duplicate detection (Property 13)
    - File: `src/tests/inventory/inventory-csv-import.property.test.js` (create file)
    - **Property 13: Duplicate batch detection** — for any row whose `(name, expiry_date)` pair exists in the inventory table, it should be flagged as a duplicate and excluded from the insert set
    - **Validates: Requirements 5.1**

  - [ ]* 3.2 Write property test for intra-file duplicate detection (Property 14)
    - File: `src/tests/inventory/inventory-csv-import.property.test.js`
    - **Property 14: Intra-file duplicate detection** — for any CSV with repeated `(name, expiry_date)` pairs, only the first occurrence is kept
    - **Validates: Requirements 5.4, 9.3**

  - [ ]* 3.3 Write property test for multi-batch same name different expiry (Property 19)
    - File: `src/tests/inventory/inventory-csv-import.property.test.js`
    - **Property 19: Same name, different expiry → both in insert set**
    - **Validates: Requirements 9.1, 9.2**

- [x] 4. Extend `batchImportInventory` to use new validation and payload builder
  - Update `batchImportInventory` in `inventoryImportService.js` to:
    1. Call `validateInventoryRows(rows)` and surface errors before any DB write
    2. Filter out invalid rows and duplicate rows from the insert set
    3. Call `buildInsertPayload(row)` for each valid row before passing to `batchProcessor.processBatches`
    4. Pass `batchSize: 50` to `processBatches`
    5. On batch failure, record `RowError` for each row in the failed batch and continue remaining batches (do not abort)
    6. Write audit log entry via `auditLogger` (`startImportLog` / `completeImportLog` / `failImportLog`)
  - The `status` column must never appear in any Supabase insert call
  - _Requirements: 4.8, 7.1, 7.2, 7.3, 7.4, 11.1, 11.2_

  - [ ]* 4.1 Write property test for INSERT payload excludes status (Property 16)
    - File: `src/tests/inventory/inventory-csv-import.property.test.js`
    - **Property 16: INSERT payload never contains `status` key**
    - **Validates: Requirements 7.2**

  - [ ]* 4.2 Write property test for batch size invariant (Property 17)
    - File: `src/tests/inventory/inventory-csv-import.property.test.js`
    - **Property 17: `ceil(N/50)` batches, each ≤ 50 rows, last batch = N mod 50 (or 50)**
    - **Validates: Requirements 7.3**

  - [ ]* 4.3 Write property test for failed batch continues processing (Property 18)
    - File: `src/tests/inventory/inventory-csv-import.property.test.js`
    - **Property 18: Failed batch → RowErrors recorded, remaining batches continue**
    - **Validates: Requirements 7.4**

  - [ ]* 4.4 Write property test for audit log completeness (Property 21)
    - File: `src/tests/inventory/inventory-csv-import.property.test.js`
    - **Property 21: Completed session → audit log row has all required fields non-null**
    - **Validates: Requirements 11.1**

- [x] 5. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Update `InventoryImportModal` Step 1 — file upload and template download
  - In `src/components/import/InventoryImportModal.jsx`, update `Step1Upload`:
    - Accept `.csv` only (remove `.xlsx`/`.xls` from `accept` attribute and `validateFile` options)
    - Enforce 10 MB size limit (update `maxSizeBytes` to `10 * 1024 * 1024`)
    - Display filename and total data row count after successful parse
    - Add a "Download Sample Template" link/button that triggers download of a sample CSV with headers: `item_name,price,category,unit,stock,reorder_level,supplier,expiry_date,batch_number`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 6.1 Write property test for file type rejection (Property 1)
    - File: `src/tests/inventory/inventory-csv-import.property.test.js`
    - **Property 1: Any file with non-.csv extension → validator returns invalid, no parsed rows**
    - **Validates: Requirements 1.1, 1.3**

- [x] 7. Update `InventoryImportModal` Step 2 — preview and validation display
  - Update `Step2Preview` to:
    - Show summary counts: total rows, validation errors, duplicate batches, rows ready to import
    - Display first 5 data rows in a table with mapped column values
    - List each `RowError` with row number, field name, and error message (show first 10, indicate overflow)
    - Show duplicate batch list with item name and expiry date
    - Disable "Start Import" button when all rows have errors; show "No valid rows to import" message
    - Provide "Download Error Report" button (calls `exportErrorsToCSV`)
    - Show loading indicator while validation runs
  - Wire `validateAndCheckDuplicates` to call `validateInventoryRows` (new function) instead of the old `validateInventoryData`
  - _Requirements: 4.8, 4.9, 5.3, 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 7.1 Write property test for error object completeness (Property 15)
    - File: `src/tests/inventory/inventory-csv-import.property.test.js`
    - **Property 15: Every RowError has non-null `row` (1-indexed int), non-empty `field`, non-empty `message`**
    - **Validates: Requirements 6.3, 8.1**

- [x] 8. Update `InventoryImportModal` Step 3 — progress and results display
  - Update `Step3ImportResults` to:
    - Show progress bar with rows processed / total rows during insert
    - Disable Close button while import is in progress; show `beforeunload` warning on navigation attempt
    - Display final summary: total rows in file, successfully inserted, skipped (duplicates), failed (errors)
    - Show "Download Results" and "Download Error Report" buttons after completion
    - On completion, enable Close button and call `onSuccess` to refresh inventory list
    - Show success message with zero errors when no errors occurred; hide error download button in that case
  - _Requirements: 7.5, 7.6, 8.2, 8.3, 8.5, 12.4, 12.5_

  - [ ]* 8.1 Write property test for error report includes original row data (Property 22)
    - File: `src/tests/inventory/inventory-csv-import.property.test.js`
    - **Property 22: Error report entries contain both error message and original CSV row data**
    - **Validates: Requirements 8.4**

- [x] 9. Wire `InventoryImportModal` into `Inventory.jsx` and remove `CSVImportModal`
  - In `src/pages/Inventory.jsx`:
    - Replace `import CSVImportModal from '../components/inventory/CSVImportModal'` with `import { InventoryImportModal } from '../components/import/InventoryImportModal'`
    - Replace `<CSVImportModal ... />` usage with `<InventoryImportModal isOpen={showImport} onClose={() => setShowImport(false)} onSuccess={() => { loadInventory(); setShowImport(false) }} />`
  - _Requirements: 12.1, 12.5_

- [x] 10. Add role-based access control guard to import entry point
  - In `InventoryImportModal`, read `userProfile` from `useAuth()` and check role before allowing progression past Step 1
  - If role is not `admin` or `staff`, display an authorization error and prevent Step 2 from loading
  - Ensure `batchImportInventory` still enforces `checkAuthentication` server-side as a second layer
  - _Requirements: 10.1, 10.2, 10.3_

  - [ ]* 10.1 Write property test for role-based access control (Property 20)
    - File: `src/tests/inventory/inventory-csv-import.property.test.js`
    - **Property 20: Non-admin/staff role → auth error thrown, zero DB inserts performed**
    - **Validates: Requirements 10.2**

- [ ] 11. Add CSV parsing property tests
  - Add remaining property tests to `src/tests/inventory/inventory-csv-import.property.test.js` using fast-check arbitraries defined in the design

  - [ ]* 11.1 Write property test for CSV parsing correctness (Property 2)
    - **Property 2: N-row CSV → parser returns exactly N row objects with keys matching header**
    - **Validates: Requirements 2.1**

  - [ ]* 11.2 Write property test for whitespace trimming (Property 3)
    - **Property 3: Whitespace-padded CSV ≡ trimmed CSV after parsing**
    - **Validates: Requirements 2.2**

  - [ ]* 11.3 Write property test for quoted field parsing (Property 4)
    - **Property 4: Quoted fields containing commas → parsed as single field value**
    - **Validates: Requirements 2.3**

  - [ ]* 11.4 Write property test for round-trip parsing (Property 5)
    - **Property 5: serialize rows → CSV → parse → equivalent rows**
    - **Validates: Requirements 2.5**

  - [ ]* 11.5 Write property test for case-insensitive column mapping (Property 6)
    - **Property 6: Case variations of column names → same field mapping as canonical lowercase**
    - **Validates: Requirements 3.1, 3.2**

  - [ ]* 11.6 Write property test for missing required columns (Property 7)
    - **Property 7: CSV missing `item_name` or `price` → error listing missing required columns**
    - **Validates: Requirements 3.4**

  - [ ]* 11.7 Write property test for optional column defaults (Property 8)
    - **Property 8: Rows missing optional columns → `buildInsertPayload` applies all defined defaults**
    - **Validates: Requirements 3.5**

  - [ ]* 11.8 Write property test for required field validation (Property 9)
    - **Property 9: Empty/whitespace name or empty price → RowError produced**
    - **Validates: Requirements 4.1, 4.2**

  - [ ]* 11.9 Write property test for numeric field validation (Property 10)
    - **Property 10: Non-positive price, negative/float stock or reorder_level → RowError**
    - **Validates: Requirements 4.3, 4.4, 4.5**

  - [ ]* 11.10 Write property test for category enum validation (Property 11)
    - **Property 11: Invalid category string → RowError listing invalid value and accepted categories**
    - **Validates: Requirements 4.6**

  - [ ]* 11.11 Write property test for date field validation (Property 12)
    - **Property 12: Unparseable date string → RowError for expiry_date field**
    - **Validates: Requirements 4.7**

- [x] 12. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Property tests use fast-check (already a dev dependency); run with `vitest --run`
- The `status` column must never appear in any INSERT payload — enforced in `buildInsertPayload` and verified by Property 16
- `inventory_import_logs` SQL migration is in `design.md` and must be run in Supabase before testing audit logging
- Each property test file should include the tag comment: `// Feature: inventory-csv-import, Property N: <property text>`
