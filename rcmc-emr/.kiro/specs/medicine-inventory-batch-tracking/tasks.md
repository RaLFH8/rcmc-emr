# Implementation Tasks

## Overview

Extends `Inventory.jsx` and `InventoryContext.jsx` to support batch/lot tracking of medicines. Adds per-batch records with expiration dates, FIFO dispensing guidance, expiry monitoring, and batch-aware CSV import. Pure utility functions are extracted and covered by 16 property-based tests using fast-check/vitest.

## Prerequisites

- [ ] 0. Run database migration
  - Note: Execute `ADD_INVENTORY_BATCH_TRACKING.sql` in the Supabase SQL editor before starting implementation. This creates the `batch_number`, `lot_number`, `expiration_date`, `manufacture_date` columns, the status auto-management trigger, and the `inventory_summary`, `expiring_inventory`, and `expired_inventory` views required by all tasks below.

## Tasks

- [x] 1. Update db methods in supabase.js
  - Add three new query methods to the `db` object in `rcmc-emr/src/lib/supabase.js` to support the batch tracking views created by the migration.
  - [x] 1.1 Add `getInventorySummary()` method
    - Query the `inventory_summary` view: `SELECT * FROM inventory_summary ORDER BY name`
    - Return the result array (each row has: `name`, `category`, `unit`, `price`, `total_stock`, `batch_count`, `earliest_expiry`, `latest_expiry`, `batches`)
  - [x] 1.2 Add `getExpiringInventory()` method
    - Query the `expiring_inventory` view: `SELECT * FROM expiring_inventory ORDER BY days_until_expiry`
    - Return the result array (each row has: `id`, `name`, `batch_number`, `lot_number`, `stock`, `expiration_date`, `days_until_expiry`, `status`)
  - [x] 1.3 Add `getExpiredInventory()` method
    - Query the `expired_inventory` view: `SELECT * FROM expired_inventory ORDER BY expiration_date`
    - Return the result array (each row has: `id`, `name`, `batch_number`, `lot_number`, `stock`, `expiration_date`, `days_expired`, `status`)

- [x] 2. Update InventoryContext
  - Extend `rcmc-emr/src/context/InventoryContext.jsx` to fetch and expose batch-tracking data alongside the existing `inventory[]` state.
  - [x] 2.1 Add `summaries`, `expiringBatches`, `expiredBatches` state
    - Add three new `useState` declarations: `summaries` (default `[]`), `expiringBatches` (default `[]`), `expiredBatches` (default `[]`)
  - [x] 2.2 Update `loadInventory()` to fetch all three data sets in parallel
    - Replace the single `db.getInventory()` call with `Promise.all([db.getInventory(), db.getInventorySummary(), db.getExpiringInventory(), db.getExpiredInventory()])`
    - Set all four state values from the resolved results
    - Keep the existing error fallback (set all to `[]` on failure)
  - [x] 2.3 Expose new state in context value
    - Add `summaries`, `expiringBatches`, and `expiredBatches` to the `value` object passed to `InventoryContext.Provider`

- [x] 3. Extract pure utility functions
  - Create `rcmc-emr/src/utils/inventoryBatchUtils.js` containing all pure functions used by the batch tracking UI. These functions must have no side effects and no imports from React or Supabase.
  - [x] 3.1 Create `rcmc-emr/src/utils/inventoryBatchUtils.js` with the following six exported functions:
    - `generateBatchNumber()` — returns `BATCH-${Date.now()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`
    - `getFifoBatches(batches)` — filters to batches with `stock > 0` and `status !== 'Expired'`, then returns all with the minimum `expiration_date` (including ties); returns `[]` if no active batches
    - `buildExistingKeySet(inventory)` — returns a `Set` of strings in the format `name.toLowerCase()|batch_number??''|expiration_date??''`
    - `isDuplicate(row, keySet)` — returns `true` if the key `row.item_name.toLowerCase()|row.batch_number??''|row.expiration_date??''` exists in `keySet`
    - `groupBySummary(batches)` — groups an array of batch records by `name`, computing `total_stock` (sum), `batch_count` (count), and `earliest_expiry` (min `expiration_date`) per group; returns an array of summary objects
    - `getStatusWarning(batches)` — returns `true` if any batch in the array has `status === 'Expired'` or `status === 'Expiring Soon'`, otherwise `false`

- [x] 4. Build InventorySummaryList component
  - Create the summary table that shows one row per unique medicine name with aggregated batch data.
  - [x] 4.1 Create `rcmc-emr/src/components/inventory/InventorySummaryList.jsx`
    - Accept props: `{ summaries, selectedMedicine, onSelect, searchTerm, categoryFilter, statusFilter }`
    - Render a table with columns: Medicine Name, Category, Total Stock, Batches, Earliest Expiry, Status, Actions
  - [x] 4.2 Implement row rendering with total stock, batch count, earliest expiry, warning badge
    - Each row displays `total_stock`, `batch_count`, `earliest_expiry` from the summary object
    - Apply an amber warning border/highlight when `getStatusWarning(summary.batches)` returns `true`
    - Clicking a row calls `onSelect(summary.name)`; the selected row is visually highlighted
  - [x] 4.3 Implement client-side filtering (search, category, status)
    - Search: filter rows where `name` or `supplier` contains `searchTerm` (case-insensitive)
    - Category: filter rows where `category === categoryFilter` (skip if `categoryFilter === 'All'`)
    - Status: filter rows where at least one batch in `summary.batches` has `status === statusFilter` (skip if `statusFilter === 'All'`)

- [x] 5. Build BatchDetailPanel component
  - Create the side panel that shows all individual batches for the selected medicine.
  - [x] 5.1 Create `rcmc-emr/src/components/inventory/BatchDetailPanel.jsx`
    - Accept props: `{ medicine, batches, onAddBatch, onEditBatch, onDeleteBatch, onClose }`
    - Render as a panel with a header showing the medicine name and a close button
  - [x] 5.2 Render batch rows sorted by expiration_date ASC
    - Sort `batches` by `expiration_date` ascending before rendering
    - Each row shows: batch number, lot number, stock, expiration date, manufacture date, status badge
  - [x] 5.3 Apply FIFO "Dispense First" badge using getFifoBatches
    - Call `getFifoBatches(batches)` to get the FIFO set
    - Render a green "Dispense First" badge on each batch row whose `id` is in the FIFO set
  - [x] 5.4 Add/Edit/Delete batch actions with confirmation on delete
    - Each row has Edit and Delete icon buttons
    - Delete shows `confirm('This batch still has {N} units. Are you sure?')` when `stock > 0`
    - An "Add Batch" button at the top calls `onAddBatch(medicine)` to open BatchForm in add mode

- [x] 6. Build BatchForm modal
  - Create the add/edit form for a single batch record.
  - [x] 6.1 Create `rcmc-emr/src/components/inventory/BatchForm.jsx`
    - Accept props: `{ initialData, medicineName, onSave, onClose }`
    - Render as a modal overlay with a scrollable form body
  - [x] 6.2 Implement all fields: name, category, unit, price, supplier, stock, reorder_level, batch_number, lot_number, expiration_date, manufacture_date
    - Required fields (show validation error if empty on submit): `name`, `stock`, `reorder_level`, `unit`, `price`, `expiration_date`
    - Optional fields: `batch_number`, `lot_number`, `manufacture_date`, `supplier`
  - [x] 6.3 Pre-fill medicine name when adding from detail panel
    - When `medicineName` prop is provided, set the `name` field to `medicineName` and make it read-only
  - [x] 6.4 Auto-generate batch_number on submit if blank
    - In the submit handler, if `formData.batch_number` is empty, call `generateBatchNumber()` and assign the result before calling `onSave`
  - [x] 6.5 Client-side validation for required fields
    - Before calling `onSave`, validate all required fields are non-empty; display inline error messages for any missing fields

- [x] 7. Build ExpiryMonitor component
  - Create the expiry monitoring tab content showing batches expiring soon and already expired.
  - [x] 7.1 Create `rcmc-emr/src/components/inventory/ExpiryMonitor.jsx`
    - Accept props: `{ expiringBatches, expiredBatches }`
    - Render two sections separated by a heading
  - [x] 7.2 "Expiring Within 90 Days" section with days_until_expiry display
    - List all rows from `expiringBatches`, showing: medicine name, batch number, stock, expiration date, and `days_until_expiry` as a colored badge (red if ≤ 30 days, amber if ≤ 60, yellow otherwise)
  - [x] 7.3 "Expired (with remaining stock)" section
    - List all rows from `expiredBatches`, showing: medicine name, batch number, stock, expiration date, and `days_expired`
    - Show an empty state message if `expiredBatches` is empty

- [x] 8. Update Inventory.jsx page
  - Rewrite `rcmc-emr/src/pages/Inventory.jsx` to use the new component hierarchy and batch-aware data.
  - [x] 8.1 Replace flat table with InventorySummaryList + BatchDetailPanel layout
    - Import and render `InventorySummaryList` in place of the existing `<table>`
    - Render `BatchDetailPanel` alongside (or below) the summary list when `selectedMedicine` is set
    - Pass `inventory.filter(b => b.name === selectedMedicine)` as `batches` to `BatchDetailPanel`
  - [x] 8.2 Update StatsCards to show: total medicines, in-stock count, expiring-soon count, expired count
    - Total medicines: count of unique names in `summaries`
    - In-stock: count of summaries where `total_stock > 0`
    - Expiring soon: `expiringBatches.length`
    - Expired: `expiredBatches.length`
  - [x] 8.3 Add tab bar: "Inventory" | "Expiry Monitor"
    - Render a tab bar below the stats cards
    - "Inventory" tab shows `InventorySummaryList` + `BatchDetailPanel`
    - "Expiry Monitor" tab shows `ExpiryMonitor`
  - [x] 8.4 Add status filter options: "Expiring Soon", "Expired"
    - Update the status filter `<select>` to include `'Expiring Soon'` and `'Expired'` options in addition to the existing stock-level statuses
  - [x] 8.5 Wire up CSVImportModal with batch-aware import logic
    - Add an "Import CSV" button to the header
    - Render `CSVImportModal` when the button is clicked
    - On `onImportComplete`, call `loadInventory()` to refresh all context state

- [x] 9. Update CSVImportModal for batch support
  - Extend the existing CSV import modal (or create it if absent) to handle batch columns and deduplication.
  - [x] 9.1 Add batch_number, lot_number, expiration_date, manufacture_date column support
    - Map CSV columns `batch_number`, `lot_number`, `expiration_date`, `manufacture_date` to the corresponding `db.addInventoryItem` fields
    - Treat `lot_number` and `manufacture_date` as optional (no error if missing from CSV)
  - [x] 9.2 Implement deduplication using buildExistingKeySet / isDuplicate
    - Before the import loop, call `buildExistingKeySet(inventory)` to build the key set
    - For each parsed row, call `isDuplicate(row, keySet)` and skip + count as `skipped` if true
  - [x] 9.3 Auto-generate batch_number for rows missing it
    - If a CSV row has no `batch_number` value, call `generateBatchNumber()` and assign it before inserting
  - [x] 9.4 Display import summary: inserted / skipped / failed counts
    - After all rows are processed, display a results panel showing `inserted`, `skipped`, and `failed` counts
    - Show the total row count and confirm that `inserted + skipped + failed === total`

- [x] 10. Write property-based tests
  - Create the test file and implement all 16 properties using fast-check and vitest.
  - [x] 10.1 Create `rcmc-emr/src/tests/inventory/batch-tracking.test.js`
    - Import `fc` from `fast-check` and the utility functions from `inventoryBatchUtils.js`
    - Add a file-level comment: `// Feature: medicine-inventory-batch-tracking`
    - Configure vitest with a reasonable number of runs (minimum 100 per property)
  - [x] 10.2 Implement P1–P8 (pure function properties)
    - **P1** `// Property 1: Batch uniqueness constraint` — generate two identical `{name, batch_number, expiration_date}` objects, assert `buildExistingKeySet` + `isDuplicate` correctly identifies the second as a duplicate
    - **P2** `// Property 2: Batch round-trip field preservation` — generate a random batch object with all required fields, pass through `groupBySummary`, assert all fields survive
    - **P3** `// Property 3: Auto-generated batch number format` — call `generateBatchNumber()` many times, assert each result matches `/^BATCH-\d+-[A-Z0-9]+$/`
    - **P4** `// Property 4: Status auto-classification` — generate random `(expiration_date, stock, reorder_level)`, compute expected status using the classification rules, assert `getStatusWarning` and `getFifoBatches` behave consistently
    - **P5** `// Property 5: Summary aggregation correctness` — generate random arrays of batch objects, call `groupBySummary`, assert `total_stock`, `batch_count`, and `earliest_expiry` match manual aggregation
    - **P6** `// Property 6: Summary warning indicator` — generate batches with random statuses, call `getStatusWarning`, assert result is `true` iff any batch has status `'Expired'` or `'Expiring Soon'`
    - **P7** `// Property 7: Batch detail completeness and ordering` — generate random batches for a medicine, sort them, assert the sorted array is ordered by `expiration_date` ascending
    - **P8** `// Property 8: FIFO selection` — generate random batches with stock > 0 and non-expired status, call `getFifoBatches`, assert all returned batches have the minimum `expiration_date` and no batch with a lower date was excluded
  - [x] 10.3 Implement P9–P16 (filter and CSV properties)
    - **P9** `// Property 9: Expiring inventory filter` — generate batches with random dates, apply the expiring filter logic (today ≤ expiry ≤ today+90, stock > 0), assert the result matches the expected subset
    - **P10** `// Property 10: Expired inventory filter` — generate batches with random dates, apply the expired filter logic (expiry < today AND stock > 0), assert the result matches the expected subset
    - **P11** `// Property 11: Search filter correctness` — generate random medicine names/suppliers and search terms, apply the search filter, assert result contains exactly those where name or supplier contains the term (case-insensitive)
    - **P12** `// Property 12: Category filter correctness` — generate random categories and summaries, apply the category filter, assert all returned summaries have the selected category
    - **P13** `// Property 13: Status filter correctness` — generate random batch statuses and summaries, apply the status filter, assert all returned summaries have at least one batch matching the selected status
    - **P14** `// Property 14: CSV deduplication` — generate an existing inventory and CSV rows with overlapping keys, call `buildExistingKeySet` + `isDuplicate`, assert duplicate rows are identified and non-duplicate rows are not
    - **P15** `// Property 15: CSV import accounting` — generate a random set of CSV rows and an existing inventory, simulate the import loop, assert `inserted + skipped + failed === total rows`
    - **P16** `// Property 16: CSV parsing round-trip` — generate random valid CSV strings with required columns, parse them, assert all required fields (`item_name`, `price`, `stock`, `unit`, `batch_number`, `expiration_date`) are accessible on the parsed row objects
