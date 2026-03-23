# Implementation Plan: Inventory Module Improvements

## Overview

Implement eight targeted improvements to the inventory module: a shared status utility, a stock adjustment modal, a status filter bug fix, CSV import batching, CSV export, an expiry dispose action, a worst-case status column, and Low Stock/Critical stats cards.

## Tasks

- [x] 1. Add shared status utilities to inventoryBatchUtils.js
  - [x] 1.1 Implement `computeStatus(stock, reorderLevel, expirationDate)` in `src/utils/inventoryBatchUtils.js`
    - Priority order: Out of Stock → Expired → Critical (≤ reorderLevel × 0.3) → Low Stock (≤ reorderLevel) → In Stock
    - Compare expirationDate against midnight of current local date (not Date.now()) to avoid timezone edge cases
    - Handle null expirationDate safely (skip expiry check)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ]* 1.2 Write property tests for `computeStatus`
    - **Property 1: computeStatus is pure and idempotent** — same inputs always return same output
    - **Property 2: computeStatus is total** — always returns one of the five defined status strings, never throws
    - **Validates: Requirements 1.9, 1.1**

  - [ ]* 1.3 Write unit tests for `computeStatus`
    - Test all five status branches
    - Test boundary values: stock === reorderLevel, stock === floor(reorderLevel × 0.3)
    - Test null expirationDate, past date, future date
    - _Requirements: 1.1–1.6_

  - [x] 1.4 Implement `getWorstCaseStatus(batches)` in `src/utils/inventoryBatchUtils.js`
    - Priority: Expired > Critical > Low Stock > Out of Stock > In Stock
    - Return `'In Stock'` for empty array
    - _Requirements: 7.1, 7.2_

  - [ ]* 1.5 Write property tests for `getWorstCaseStatus`
    - **Property 7: Worst-case status monotonicity** — result severity ≥ severity of any individual batch in the array
    - **Validates: Requirements 7.2**

  - [ ]* 1.6 Write unit tests for `getWorstCaseStatus`
    - Test empty array, single-status array, mixed statuses, all priority combinations
    - _Requirements: 7.1, 7.2_

  - [x] 1.7 Implement `exportInventoryCSV(inventory)` in `src/utils/inventoryBatchUtils.js`
    - Columns in order: `item_name`, `price`, `stock`, `unit`, `category`, `supplier`, `reorder_level`, `batch_number`, `lot_number`, `expiration_date`, `manufacture_date`, `status`
    - RFC 4180 escaping: wrap fields with commas or double-quotes in double-quotes; escape embedded double-quotes as `""`
    - Trigger browser download with filename `inventory_export_YYYY-MM-DD.csv`
    - Export header-only CSV when inventory is empty
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ]* 1.8 Write unit tests for `exportInventoryCSV`
    - Test header row presence and correct column order
    - Test RFC 4180 escaping for commas and embedded double-quotes
    - Test empty inventory produces header-only output
    - _Requirements: 5.3, 5.7, 5.6_

- [x] 2. Wire `computeStatus` into supabase.js
  - [x] 2.1 Import `computeStatus` in `src/lib/supabase.js` and replace inline status logic in `db.deductStock` and `db.addStock`
    - Remove duplicated if/else status blocks; call `computeStatus(newStock, item.reorder_level, item.expiration_date)` instead
    - _Requirements: 1.8_

- [x] 3. Checkpoint — Ensure utility functions and supabase wiring are correct
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Wire `computeStatus` into CSVImportModal and implement batch inserts
  - [x] 4.1 Replace inline status logic in `src/components/inventory/CSVImportModal.jsx` with `computeStatus`
    - Import `computeStatus` from `inventoryBatchUtils`
    - _Requirements: 1.7_

  - [x] 4.2 Implement chunked batch inserts (chunks of 50) in `CSVImportModal.jsx`
    - Add local `chunk(arr, size)` helper
    - Collect deduped rows into `toInsert[]`, then loop over `chunk(toInsert, 50)`
    - On `error.code === '23505'`: fall back to row-by-row for that chunk, classify each as inserted or skipped
    - On other errors: `failed += chunk.length`
    - Preserve existing result summary display (inserted, skipped, failed, total)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 4.3 Write property test for CSV import accounting
    - **Property 8: CSV batch chunking accounting** — `inserted + skipped + failed === total` for any CSV input
    - **Validates: Requirements 4.4**

- [x] 5. Fix status filter bug in InventorySummaryList
  - [x] 5.1 Add `inventory` prop to `src/components/inventory/InventorySummaryList.jsx`
    - Accept flat `inventory` array from parent
    - Replace broken `(s.batches ?? []).some(...)` filter with a pre-computed Set derived from the flat `inventory` array:
      ```js
      const matchingNames = statusFilter && statusFilter !== 'All'
        ? new Set(inventory.filter(b => b.status === statusFilter).map(b => b.name))
        : null
      ```
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ]* 5.2 Write property test for status filter correctness
    - **Property 3: Status filter correctness** — every medicine in filtered results has at least one batch in `inventory` with the selected status
    - **Validates: Requirements 3.1, 3.2**

- [ ] 6. Add worst-case status column to InventorySummaryList
  - [x] 6.1 Compute and display worst-case status per medicine row in `InventorySummaryList.jsx`
    - For each summary row: `getWorstCaseStatus(inventory.filter(b => b.name === summary.name))`
    - Replace binary "Warning"/"OK" badge with color-coded badge: Expired/Out of Stock → red, Critical → orange, Low Stock → yellow, In Stock → green
    - Update row highlight logic to use `worstStatus !== 'In Stock'` instead of `getStatusWarning()`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [x] 7. Create StockAdjustmentModal component
  - [x] 7.1 Create `src/components/inventory/StockAdjustmentModal.jsx`
    - Props: `batch` (object with id, name, stock, reorder_level, expiration_date), `onClose`, `onSave(id, newStock, newStatus)`
    - Internal state: `amount` (string), `direction` ('Add' | 'Deduct'), `error`, `saving`
    - Validation: amount must be a positive integer > 0; Deduct amount must not exceed current stock
    - On confirm: compute `newStock`, call `computeStatus`, call `onSave`, close on success or show error on failure
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [ ]* 7.2 Write property test for stock adjustment status invariant
    - **Property 5: Stock adjustment status invariant** — stored status always equals `computeStatus(newStock, reorderLevel, expirationDate)` after any adjustment
    - **Validates: Requirements 2.4_

- [x] 8. Wire StockAdjustmentModal into BatchDetailPanel and Inventory.jsx
  - [x] 8.1 Add `onAdjustBatch` prop and "Adjust Stock" button to `src/components/inventory/BatchDetailPanel.jsx`
    - Import `ArrowUpDown` (or `Scales`) icon from lucide-react
    - Add button in actions column between Edit and Delete; calls `onAdjustBatch(batch)` on click
    - _Requirements: 2.1_

  - [x] 8.2 Wire `StockAdjustmentModal` in `src/pages/Inventory.jsx`
    - Add `adjustingBatch` state
    - Pass `onAdjustBatch={batch => setAdjustingBatch(batch)}` to `BatchDetailPanel`
    - Render `<StockAdjustmentModal>` when `adjustingBatch` is set
    - `onSave` calls `db.updateInventoryItem(id, { stock: newStock, status: newStatus })` then `loadInventory()`
    - _Requirements: 2.4, 2.5, 2.6_

- [x] 9. Add Dispose action to ExpiryMonitor
  - [x] 9.1 Add `onDispose` prop and "Dispose" button to `src/components/inventory/ExpiryMonitor.jsx`
    - Add "Actions" column to expired-batches table
    - For rows where `b.stock > 0`: render "Dispose" button; on click show `window.confirm` with batch name, batch number, and stock count; on confirm call `onDispose(batch)`
    - Do not render button for rows where `b.stock === 0`
    - Show inline error if `onDispose` rejects
    - _Requirements: 6.1, 6.2, 6.5, 6.6_

  - [ ]* 9.2 Write property test for dispose invariant
    - **Property 6: Dispose invariant** — after successful dispose, `batch.stock === 0` and `batch.status === 'Out of Stock'`
    - **Validates: Requirements 6.3_

  - [x] 9.3 Wire `onDispose` handler in `src/pages/Inventory.jsx`
    - Pass `onDispose` to `<ExpiryMonitor>`
    - Handler calls `db.updateInventoryItem(batch.id, { stock: 0, status: 'Out of Stock' })` then `loadInventory()`
    - _Requirements: 6.3, 6.4, 6.5_

- [x] 10. Add Export CSV button to Inventory.jsx
  - [x] 10.1 Add "Export CSV" button in `src/pages/Inventory.jsx` header alongside "Import CSV"
    - Import `exportInventoryCSV` from `inventoryBatchUtils`
    - Button calls `exportInventoryCSV(inventory)` on click
    - _Requirements: 5.1, 5.5_

- [x] 11. Add Low Stock and Critical stats cards to Inventory.jsx
  - [x] 11.1 Derive `lowStockCount` and `criticalCount` from existing `summaries` and `inventory` context data in `src/pages/Inventory.jsx`
    - `lowStockCount`: count of summaries where `getWorstCaseStatus(...)` === `'Low Stock'`
    - `criticalCount`: count of summaries where `getWorstCaseStatus(...)` === `'Critical'`
    - No additional Supabase queries
    - _Requirements: 8.1, 8.2, 8.6_

  - [x] 11.2 Render Low Stock and Critical stat cards with appropriate colors
    - Low Stock card value in amber/yellow text when count > 0
    - Critical card value in orange text when count > 0
    - Update stats grid layout from `grid-cols-2 md:grid-cols-4` to `grid-cols-2 md:grid-cols-3 lg:grid-cols-6`
    - Keep existing Total Medicines, In Stock, Expiring Soon, and Expired cards
    - Pass `inventory={inventory}` prop to `InventorySummaryList`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 12. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Property tests use `fast-check` (already available or add as dev dependency)
- All status logic flows through `computeStatus` — no inline status if/else blocks should remain after task 2
- `InventorySummaryList` requires the new `inventory` prop; pass it from `Inventory.jsx` in task 11
