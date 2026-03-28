# Requirements Document

## Introduction

This feature covers eight targeted improvements to the existing medicine inventory module in the RCMC-EMR system. The improvements address code quality (shared status logic), usability gaps (stock adjustment UI, export, expiry action buttons), a silent filter bug, a performance issue (CSV import batching), and two dashboard/display enhancements (better status column, additional stats cards). Together they make the inventory module more reliable, faster, and more actionable for pharmacy and clinical staff.

## Glossary

- **Inventory_Module**: The React page and context that manages medicine batch records (`rcmc-emr/src/pages/Inventory.jsx`, `InventoryContext.jsx`).
- **Status_Utility**: A shared pure function `computeStatus(stock, reorderLevel, expirationDate)` that returns one of: `In Stock`, `Low Stock`, `Critical`, `Out of Stock`, `Expired`.
- **Stock_Adjustment_Modal**: A lightweight modal that allows a user to increment or decrement the stock quantity of a single batch without opening the full BatchForm.
- **Summary_List**: The `InventorySummaryList` component that renders the per-medicine aggregated table.
- **Status_Filter**: The dropdown in `Inventory.jsx` that filters the Summary_List by stock/expiry status.
- **CSV_Importer**: The `CSVImportModal` component that reads a CSV file and inserts rows into Supabase.
- **Batch**: A single inventory row in the `inventory` Supabase table, identified by `batch_number`.
- **Expiry_Monitor**: The `ExpiryMonitor` component that lists batches expiring within 90 days and expired batches with remaining stock.
- **Worst_Case_Status**: The most severe status among all batches belonging to a medicine, evaluated in priority order: `Expired` > `Critical` > `Low Stock` > `Out of Stock` > `In Stock`.
- **Dispose_Action**: A user-initiated operation that sets a batch's `stock` to `0` and `status` to `Out of Stock`, recording the write-off.

---

## Requirements

### Requirement 1: Shared Status Computation Utility

**User Story:** As a developer, I want a single authoritative function that computes batch status, so that status logic is not duplicated between the CSV importer and the database layer and future changes only need to be made in one place.

#### Acceptance Criteria

1. THE `Status_Utility` SHALL accept `stock` (integer), `reorderLevel` (integer), and `expirationDate` (ISO date string or null) as parameters and return exactly one of: `Out of Stock`, `Expired`, `Critical`, `Low Stock`, or `In Stock`.
2. WHEN `stock` equals `0`, THE `Status_Utility` SHALL return `Out of Stock` regardless of `expirationDate`.
3. WHEN `expirationDate` is not null and the date is before the current date, THE `Status_Utility` SHALL return `Expired`.
4. WHEN `stock` is greater than `0` and `stock` is less than or equal to `reorderLevel` multiplied by `0.3`, THE `Status_Utility` SHALL return `Critical`.
5. WHEN `stock` is greater than `0` and `stock` is less than or equal to `reorderLevel`, THE `Status_Utility` SHALL return `Low Stock`.
6. WHEN none of the above conditions apply, THE `Status_Utility` SHALL return `In Stock`.
7. THE `CSV_Importer` SHALL call `Status_Utility` to compute status for each imported row instead of containing inline status logic.
8. THE `Inventory_Module` database layer SHALL call `Status_Utility` when persisting a new or updated `Batch` instead of containing inline status logic.
9. FOR ALL valid combinations of `stock`, `reorderLevel`, and `expirationDate`, calling `Status_Utility` twice with the same inputs SHALL return the same result (idempotence).

---

### Requirement 2: Stock Adjustment Modal

**User Story:** As a pharmacy staff member, I want a quick +/- stock adjustment control on each batch, so that I can correct stock counts without navigating through the full batch edit form.

#### Acceptance Criteria

1. WHEN a user clicks the stock adjustment button on a `Batch` row in `BatchDetailPanel`, THE `Stock_Adjustment_Modal` SHALL open pre-populated with the batch's current stock quantity and name.
2. THE `Stock_Adjustment_Modal` SHALL allow the user to enter a positive integer as an adjustment amount and select either "Add" or "Deduct" as the adjustment direction.
3. WHEN the user confirms a "Deduct" adjustment where the adjustment amount exceeds the current stock, THE `Stock_Adjustment_Modal` SHALL display a validation error and SHALL NOT submit the adjustment.
4. WHEN the user confirms a valid adjustment, THE `Inventory_Module` SHALL update the batch's `stock` field in Supabase and recompute the batch's `status` using `Status_Utility`.
5. WHEN the adjustment is saved successfully, THE `Stock_Adjustment_Modal` SHALL close and the `BatchDetailPanel` SHALL reflect the updated stock value without a full page reload.
6. IF the Supabase update fails, THEN THE `Stock_Adjustment_Modal` SHALL display an error message and SHALL remain open so the user can retry.
7. THE `Stock_Adjustment_Modal` SHALL accept only positive integer values greater than zero as the adjustment amount; non-numeric or zero input SHALL be rejected with a validation error.

---

### Requirement 3: Status Filter Bug Fix

**User Story:** As a pharmacy staff member, I want the status filter in the inventory list to return correct results, so that I can reliably find medicines by their stock status.

#### Acceptance Criteria

1. WHEN a user selects a status value from the Status_Filter dropdown, THE `Summary_List` SHALL display only medicines that have at least one `Batch` whose computed status matches the selected value.
2. THE `Summary_List` status filter SHALL derive each medicine's filterable statuses from the `inventory` flat array (individual batch records) rather than from a `batches` sub-array on the summary object.
3. WHEN the Status_Filter is set to `All`, THE `Summary_List` SHALL display all medicines regardless of status.
4. WHEN the Status_Filter is set to `Expired`, THE `Summary_List` SHALL display only medicines that have at least one batch with `status` equal to `Expired`.
5. WHEN the Status_Filter is set to `Low Stock`, THE `Summary_List` SHALL display only medicines that have at least one batch with `status` equal to `Low Stock`.
6. IF no medicines match the selected status filter, THEN THE `Summary_List` SHALL display the "No medicines found" empty state.

---

### Requirement 4: CSV Import Batching

**User Story:** As a pharmacy administrator, I want large CSV files to import quickly, so that importing hundreds of medicine batches does not time out or take an unreasonable amount of time.

#### Acceptance Criteria

1. THE `CSV_Importer` SHALL group parsed CSV rows into chunks of at most 50 rows and issue one `supabase.insert()` call per chunk instead of one call per row.
2. WHEN a chunk insert returns a unique-constraint violation (`error.code === '23505'`), THE `CSV_Importer` SHALL fall back to inserting the rows in that chunk individually and SHALL classify each row as either inserted or skipped accordingly.
3. WHEN a chunk insert returns any error other than a unique-constraint violation, THE `CSV_Importer` SHALL increment the failed count by the number of rows in that chunk.
4. THE `CSV_Importer` SHALL display the same result summary (inserted, skipped, failed, total) after batched import as it does today.
5. WHEN importing a CSV file with 200 or fewer rows, THE `CSV_Importer` SHALL complete the import in at most 4 network round-trips to Supabase (excluding fallback retries for constraint violations).

---

### Requirement 5: Inventory Export to CSV

**User Story:** As a pharmacy administrator, I want to export the current inventory to a CSV file, so that I can use the data for audits, reporting, and offline review.

#### Acceptance Criteria

1. THE `Inventory_Module` SHALL provide an "Export CSV" button in the page header alongside the existing "Import CSV" button.
2. WHEN the user clicks "Export CSV", THE `Inventory_Module` SHALL generate a CSV file containing all current `Batch` records from the `inventory` table.
3. THE exported CSV SHALL include the following columns in order: `item_name`, `price`, `stock`, `unit`, `category`, `supplier`, `reorder_level`, `batch_number`, `lot_number`, `expiration_date`, `manufacture_date`, `status`.
4. THE exported CSV SHALL use the same column names as the import template so that an exported file can be re-imported without modification.
5. WHEN the user clicks "Export CSV", THE `Inventory_Module` SHALL trigger a browser file download with the filename `inventory_export_YYYY-MM-DD.csv` where `YYYY-MM-DD` is the current date.
6. IF the inventory is empty, THEN THE `Inventory_Module` SHALL still export a CSV containing only the header row.
7. THE exported CSV SHALL correctly escape any field values that contain commas or double-quote characters.

---

### Requirement 6: Expiry Monitor Dispose Action

**User Story:** As a pharmacy staff member, I want to mark an expired batch as disposed directly from the Expiry Monitor view, so that I do not have to navigate back to the inventory list to write off expired stock.

#### Acceptance Criteria

1. THE `Expiry_Monitor` expired-batches table SHALL include a "Dispose" action button for each row that has `stock` greater than `0`.
2. WHEN a user clicks "Dispose" on an expired batch, THE `Expiry_Monitor` SHALL display a confirmation prompt showing the batch name, batch number, and current stock quantity before proceeding.
3. WHEN the user confirms the dispose action, THE `Inventory_Module` SHALL set the batch's `stock` to `0` and `status` to `Out of Stock` in Supabase.
4. WHEN the dispose action completes successfully, THE `Expiry_Monitor` SHALL remove the batch from the expired-batches list and THE `Inventory_Module` SHALL reload inventory data to reflect the updated counts.
5. IF the Supabase update fails during a dispose action, THEN THE `Expiry_Monitor` SHALL display an error message and the batch SHALL remain in the expired list with its original stock value.
6. THE `Expiry_Monitor` SHALL NOT display a "Dispose" button for expired batches that already have `stock` equal to `0`.

---

### Requirement 7: Worst-Case Status Column in Summary List

**User Story:** As a pharmacy staff member, I want the status column in the inventory summary list to show the actual worst-case status of each medicine, so that I can quickly triage which medicines need attention without opening each one.

#### Acceptance Criteria

1. THE `Summary_List` status column SHALL display the `Worst_Case_Status` for each medicine, computed from all batches belonging to that medicine.
2. THE `Worst_Case_Status` SHALL be determined by the following priority order (highest to lowest): `Expired`, `Critical`, `Low Stock`, `Out of Stock`, `In Stock`.
3. WHEN a medicine has at least one batch with status `Expired`, THE `Summary_List` SHALL display `Expired` in the status column for that medicine with a red badge.
4. WHEN a medicine has no expired batches but has at least one batch with status `Critical`, THE `Summary_List` SHALL display `Critical` in the status column with an orange badge.
5. WHEN a medicine has no expired or critical batches but has at least one batch with status `Low Stock`, THE `Summary_List` SHALL display `Low Stock` in the status column with a yellow badge.
6. WHEN all batches for a medicine are `In Stock`, THE `Summary_List` SHALL display `In Stock` in the status column with a green badge.
7. THE `Summary_List` SHALL no longer display only "Warning" or "OK" as status values.

---

### Requirement 8: Low Stock and Critical Stats Cards

**User Story:** As a pharmacy administrator, I want the inventory header stats to include Low Stock and Critical counts, so that I can immediately see how many medicines need restocking without filtering the list.

#### Acceptance Criteria

1. THE `Inventory_Module` header stats section SHALL display a "Low Stock" card showing the count of distinct medicine names that have at least one batch with status `Low Stock` and no batch with a higher-severity status (`Critical` or `Expired`).
2. THE `Inventory_Module` header stats section SHALL display a "Critical" card showing the count of distinct medicine names that have at least one batch with status `Critical` and no batch with status `Expired`.
3. WHEN the Low Stock count is greater than zero, THE `Inventory_Module` SHALL render the Low Stock card value in amber/yellow text.
4. WHEN the Critical count is greater than zero, THE `Inventory_Module` SHALL render the Critical card value in orange text.
5. THE `Inventory_Module` stats section SHALL continue to display the existing Total Medicines, In Stock, Expiring Soon, and Expired cards alongside the two new cards.
6. THE Low Stock and Critical counts SHALL be derived from the `summaries` data already loaded by `InventoryContext` and SHALL NOT require additional Supabase queries.
