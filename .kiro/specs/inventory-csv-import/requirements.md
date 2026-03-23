# Requirements Document

## Introduction

This feature enables clinic staff at RCMC to bulk-import inventory items from a CSV file into the Supabase `inventory` table. The clinic maintains multiple batches of the same medicine with different expiry dates, so the same item name appearing more than once in a CSV is not a conflict — each unique combination of `name + expiry_date` is treated as a distinct batch row. The import must validate data, map CSV columns to database fields, handle batch inserts, and report per-row errors clearly. Prices are in Philippine Peso (PHP). The `status` column is auto-computed by a database trigger and must never be set manually during inserts.

---

## Glossary

- **CSV_Importer**: The front-end component and service layer responsible for reading, parsing, validating, and submitting CSV data to Supabase.
- **Inventory_Table**: The Supabase `public.inventory` table with columns: `id`, `name`, `category`, `stock`, `reorder_level`, `unit`, `price`, `supplier`, `expiry_date`, `status` (trigger-managed), `created_at`, `updated_at`.
- **Batch**: A distinct inventory row representing a specific quantity of a medicine with a particular `expiry_date`. The same medicine name may have multiple batches.
- **Batch_Key**: The composite identifier `(name, expiry_date)` used to distinguish batches. Two rows sharing the same `name` and `expiry_date` are considered the same batch.
- **Duplicate_Batch**: A CSV row whose `(name, expiry_date)` pair already exists in the Inventory_Table.
- **Valid_Category**: One of the accepted category values: `Anti-Infectives`, `Cardiovascular & Hypertension`, `Gastrointestinal & Metabolism`, `Pain & Fever`, `Respiratory & Allergy`, `Vaccines & Biologicals`, `Medical Supplies`, `Others`.
- **Import_Session**: A single end-to-end execution of the CSV import workflow from file selection through final result display.
- **Row_Error**: A validation or database error associated with a specific row number in the uploaded CSV.
- **PHP**: Philippine Peso — the currency unit for all price values in the system.

---

## Requirements

### Requirement 1: CSV File Upload

**User Story:** As a clinic staff member, I want to upload a CSV file from my computer, so that I can begin the bulk import process without manually entering each item.

#### Acceptance Criteria

1. THE CSV_Importer SHALL accept files with the `.csv` extension only.
2. WHEN a file larger than 10 MB is selected, THE CSV_Importer SHALL reject the file and display an error message stating the size limit.
3. WHEN a non-CSV file is selected, THE CSV_Importer SHALL reject the file and display an error message identifying the unsupported file type.
4. WHEN a valid CSV file is selected, THE CSV_Importer SHALL display the filename and the total number of data rows detected.
5. THE CSV_Importer SHALL provide a downloadable sample CSV template that matches the expected column format.

---

### Requirement 2: CSV Parsing

**User Story:** As a clinic staff member, I want the system to correctly parse my CSV file, so that the data is accurately read regardless of minor formatting variations.

#### Acceptance Criteria

1. WHEN a CSV file is uploaded, THE CSV_Importer SHALL parse all rows using comma as the delimiter and treat the first row as the header.
2. THE CSV_Importer SHALL trim leading and trailing whitespace from all header names and cell values before processing.
3. WHEN a CSV file contains quoted fields (values enclosed in double quotes), THE CSV_Importer SHALL parse the quoted content as a single field value.
4. WHEN a CSV file contains an empty row, THE CSV_Importer SHALL skip that row without producing a Row_Error.
5. FOR ALL valid CSV files, parsing then re-serializing then parsing again SHALL produce an equivalent set of rows (round-trip property).
6. IF a CSV file contains zero data rows after the header, THEN THE CSV_Importer SHALL display an error message stating the file is empty.

---

### Requirement 3: Column Mapping

**User Story:** As a clinic staff member, I want the system to map CSV columns to the correct inventory fields, so that I do not need to rename my columns to an exact format.

#### Acceptance Criteria

1. THE CSV_Importer SHALL recognize the following required columns (case-insensitive): `item_name` (maps to `name`), `price` (maps to `price`).
2. THE CSV_Importer SHALL recognize the following optional columns (case-insensitive): `category`, `unit`, `stock`, `reorder_level`, `supplier`, `batch_number`, `lot_number`, `expiry_date`, `expiration_date`, `manufacture_date`.
3. WHEN the column `expiration_date` is present and `expiry_date` is absent, THE CSV_Importer SHALL treat `expiration_date` as the expiry date value.
4. WHEN a required column is absent from the CSV header, THE CSV_Importer SHALL halt parsing and display an error listing all missing required columns.
5. WHEN an optional column is absent, THE CSV_Importer SHALL use the defined default value for that field: `stock` defaults to `0`, `reorder_level` defaults to `10`, `unit` defaults to empty string, `supplier` defaults to empty string, `expiry_date` defaults to `null`.

---

### Requirement 4: Data Validation

**User Story:** As a clinic staff member, I want the system to validate each row before importing, so that invalid data does not corrupt the inventory database.

#### Acceptance Criteria

1. WHEN a row has an empty or whitespace-only `item_name`, THE CSV_Importer SHALL record a Row_Error for that row with the message "Item name is required".
2. WHEN a row has an empty `price` field, THE CSV_Importer SHALL record a Row_Error for that row with the message "Price is required".
3. WHEN a row has a `price` value that is not a valid positive number, THE CSV_Importer SHALL record a Row_Error for that row with the message "Price must be a positive number (PHP)".
4. WHEN a row has a `stock` value that is not a non-negative integer, THE CSV_Importer SHALL record a Row_Error for that row with the message "Stock must be a non-negative integer".
5. WHEN a row has a `reorder_level` value that is not a non-negative integer, THE CSV_Importer SHALL record a Row_Error for that row with the message "Reorder level must be a non-negative integer".
6. WHEN a row has a `category` value that is not one of the Valid_Category values, THE CSV_Importer SHALL record a Row_Error for that row listing the invalid value and the accepted categories.
7. WHEN a row has an `expiry_date` value that cannot be parsed as a valid date, THE CSV_Importer SHALL record a Row_Error for that row with the message "Expiry date is not a valid date".
8. THE CSV_Importer SHALL complete validation of all rows before beginning any database inserts.
9. WHILE validation is running, THE CSV_Importer SHALL display a loading indicator to the user.

---

### Requirement 5: Duplicate Batch Detection

**User Story:** As a clinic staff member, I want the system to detect when a CSV row matches an existing batch in the database, so that I do not accidentally create duplicate records.

#### Acceptance Criteria

1. THE CSV_Importer SHALL identify a CSV row as a Duplicate_Batch WHEN the combination of `name` (case-insensitive) and `expiry_date` already exists in the Inventory_Table.
2. WHEN a CSV row has a `null` or empty `expiry_date`, THE CSV_Importer SHALL treat it as a distinct batch and SHALL NOT flag it as a duplicate based on name alone.
3. WHEN duplicate batches are detected, THE CSV_Importer SHALL display the count of duplicates and list the affected item names and expiry dates in the preview step.
4. WHEN a CSV contains multiple rows with the same `(name, expiry_date)` pair within the file itself, THE CSV_Importer SHALL flag all but the first occurrence as intra-file duplicates and SHALL NOT insert them.
5. THE CSV_Importer SHALL allow the user to proceed with import while skipping all detected duplicates.

---

### Requirement 6: Import Preview

**User Story:** As a clinic staff member, I want to review a summary of what will be imported before committing, so that I can catch problems before they affect the live inventory.

#### Acceptance Criteria

1. WHEN CSV parsing and validation are complete, THE CSV_Importer SHALL display a preview showing: total rows, rows with validation errors, duplicate batches detected, and rows ready to import.
2. THE CSV_Importer SHALL display the first 5 data rows in a table preview with their mapped column values.
3. WHEN validation errors exist, THE CSV_Importer SHALL list each Row_Error with its row number, field name, and error message.
4. THE CSV_Importer SHALL allow the user to download a CSV error report containing all Row_Errors before proceeding.
5. WHEN all rows have validation errors, THE CSV_Importer SHALL disable the import action button and display a message stating no valid rows are available to import.

---

### Requirement 7: Batch Insert to Supabase

**User Story:** As a clinic staff member, I want valid rows to be inserted into the inventory table efficiently, so that large imports complete in a reasonable time.

#### Acceptance Criteria

1. THE CSV_Importer SHALL insert only rows that passed validation and are not Duplicate_Batches.
2. THE CSV_Importer SHALL NOT include the `status` column in any INSERT statement, allowing the database trigger to compute it automatically.
3. THE CSV_Importer SHALL insert rows in batches of up to 50 rows per Supabase request.
4. WHEN a batch insert fails due to a database error, THE CSV_Importer SHALL record a Row_Error for each row in that batch and continue processing remaining batches.
5. THE CSV_Importer SHALL display a progress indicator showing the number of rows processed and the total rows to import during the insert phase.
6. WHEN all batches have been processed, THE CSV_Importer SHALL display a final summary showing: total rows in file, successfully inserted, skipped (duplicates), and failed (errors).

---

### Requirement 8: Per-Row Error Reporting

**User Story:** As a clinic staff member, I want to see exactly which rows failed and why, so that I can correct my CSV and re-import without guessing.

#### Acceptance Criteria

1. THE CSV_Importer SHALL display each Row_Error with its row number (1-indexed, excluding the header row), the field that caused the error, and a human-readable error message.
2. WHEN more than 10 Row_Errors exist, THE CSV_Importer SHALL display the first 10 errors and indicate how many additional errors are not shown.
3. THE CSV_Importer SHALL provide a button to download a CSV file containing all Row_Errors after import completes.
4. THE CSV_Importer SHALL include the original row data alongside the error message in the downloadable error report.
5. WHEN zero errors occurred, THE CSV_Importer SHALL display a success message and SHALL NOT show an error download button.

---

### Requirement 9: Multi-Batch Support

**User Story:** As a clinic staff member, I want to import multiple batches of the same medicine with different expiry dates in a single CSV, so that I can load the full pharmacy stock in one operation.

#### Acceptance Criteria

1. THE CSV_Importer SHALL treat each row as an independent inventory record regardless of whether the `name` appears in other rows.
2. WHEN two rows share the same `name` but have different `expiry_date` values, THE CSV_Importer SHALL insert both as separate rows in the Inventory_Table.
3. WHEN two rows share the same `name` and the same `expiry_date`, THE CSV_Importer SHALL insert only the first occurrence and record a Row_Error for the second occurrence indicating it is an intra-file duplicate.
4. THE CSV_Importer SHALL correctly import a CSV file containing the same medicine name across 10 or more rows with distinct expiry dates.

---

### Requirement 10: Access Control

**User Story:** As a clinic administrator, I want only authorized staff to perform CSV imports, so that inventory data is not modified by unauthorized users.

#### Acceptance Criteria

1. WHEN an unauthenticated user attempts to access the import feature, THE CSV_Importer SHALL redirect the user to the login page.
2. WHEN a user with a role other than `admin` or `staff` attempts to initiate an import, THE CSV_Importer SHALL display an authorization error and SHALL NOT proceed with any database operations.
3. THE CSV_Importer SHALL pass the authenticated user's session token with every Supabase insert request.

---

### Requirement 11: Import Audit Logging

**User Story:** As a clinic administrator, I want a record of every import session, so that I can trace data changes back to a specific user and file.

#### Acceptance Criteria

1. WHEN an Import_Session completes, THE CSV_Importer SHALL record: the authenticated user's ID, the original filename, the timestamp, total rows, successfully inserted count, skipped count, and failed count.
2. WHEN an Import_Session fails entirely due to a system error, THE CSV_Importer SHALL record the failure with the error message and the user's ID.
3. THE CSV_Importer SHALL store audit log entries in a dedicated Supabase table accessible only to admin users.

---

### Requirement 12: User Interface — Import Wizard

**User Story:** As a clinic staff member, I want a clear step-by-step interface for the import process, so that I know exactly where I am and what to do next.

#### Acceptance Criteria

1. THE CSV_Importer SHALL present the import workflow as a 3-step wizard: Step 1 — Upload, Step 2 — Preview & Validate, Step 3 — Import & Results.
2. THE CSV_Importer SHALL display the current step number and label at all times during the Import_Session.
3. WHEN the user is on Step 2, THE CSV_Importer SHALL provide a Back button that returns to Step 1 without losing the parsed data.
4. WHEN an import is in progress on Step 3, THE CSV_Importer SHALL disable the Close button and display a warning if the user attempts to navigate away.
5. WHEN the Import_Session completes on Step 3, THE CSV_Importer SHALL display a Close button that dismisses the modal and triggers a refresh of the inventory list.
