# Requirements Document

## Introduction

The Intelligent CSV Import System enables RCMC EMR users to import large datasets from Google Sheets CSV exports through three specialized import modules: Patient Data Import, Inventory & Services Import, and Laboratory Tests Import. Each module provides automatic parsing, intelligent categorization, validation, and batch processing through a consistent 3-step wizard interface.

## Glossary

- **Import_System**: The complete intelligent CSV import feature consisting of three independent modules
- **Patient_Import_Module**: Import module for patient consultation records from Google Sheets
- **Inventory_Import_Module**: Import module for medicines and medical supplies with automatic categorization
- **Lab_Import_Module**: Import module for laboratory tests with subcategory classification
- **CSV_Parser**: Component that reads and parses CSV/Excel files using papaparse library
- **Validator**: Component that validates imported data against business rules and data types
- **Categorizer**: Component that automatically classifies items into appropriate categories
- **Batch_Processor**: Component that handles bulk database inserts with transaction support
- **Wizard_UI**: 3-step user interface (Upload → Preview & Validate → Import Progress & Results)
- **Duplicate_Detector**: Component that identifies existing records to prevent duplicates
- **Transaction_Manager**: Component that ensures atomic imports with rollback capability
- **Progress_Tracker**: Component that displays real-time import progress and statistics
- **EMR_Database**: Supabase database containing patients, consultations, appointments, billing, inventory, and services tables
- **Google_Sheets_CSV**: CSV file exported from Google Sheets containing structured data
- **Service_Code**: Unique identifier generated for laboratory tests
- **Dosage_Extractor**: Component that parses medication dosage information from item names
- **Unit_Standardizer**: Component that normalizes measurement units (mg, ml, tablets, etc.)
- **Turnaround_Time**: Expected time for laboratory test completion
- **Package_Test**: Laboratory test that includes multiple sub-tests
- **Doctor_Consultation_Counter**: Component that tracks consultation counts per doctor
- **Billing_Record**: Database record linking consultations to payments and charges

## Requirements

### Requirement 1: CSV File Upload and Parsing

**User Story:** As a clinic administrator, I want to upload CSV files from Google Sheets, so that I can import large datasets without manual data entry.

#### Acceptance Criteria

1. THE Wizard_UI SHALL display an upload interface as the first step
2. WHEN a CSV or Excel file is selected, THE CSV_Parser SHALL parse the file using papaparse library
3. THE CSV_Parser SHALL detect column headers automatically from the first row
4. WHEN parsing fails, THE CSV_Parser SHALL return a descriptive error message indicating the line number and issue
5. THE CSV_Parser SHALL handle files with up to 200 rows without performance degradation
6. THE CSV_Parser SHALL support UTF-8 encoding for special characters
7. THE Wizard_UI SHALL display a preview of parsed data showing the first 10 rows
8. THE CSV_Parser SHALL trim whitespace from all cell values
9. WHEN the file format is invalid, THE Import_System SHALL display an error and prevent progression to the next step

### Requirement 2: Patient Data Import with Automatic Field Parsing

**User Story:** As a clinic administrator, I want to import patient consultation records with automatic field parsing, so that complex data like "Age/Sex" and doctor names are correctly interpreted.

#### Acceptance Criteria

1. THE Patient_Import_Module SHALL parse "Age/Sex" fields into separate age and sex values
2. WHEN an "Age/Sex" value matches the pattern "[number]/[M|F]", THE Patient_Import_Module SHALL extract age as integer and sex as character
3. THE Patient_Import_Module SHALL parse doctor names and match them to existing doctor records in EMR_Database
4. WHEN a doctor name does not exist, THE Patient_Import_Module SHALL flag the row as invalid with a descriptive error
5. THE Patient_Import_Module SHALL parse discount values as percentages or fixed amounts
6. THE Patient_Import_Module SHALL parse payment amounts as decimal numbers
7. THE Patient_Import_Module SHALL create patient records if they do not exist based on name matching
8. THE Patient_Import_Module SHALL create consultation records linked to patients and doctors
9. THE Patient_Import_Module SHALL create appointment records with consultation dates
10. THE Patient_Import_Module SHALL create billing records with payment and discount information
11. THE Doctor_Consultation_Counter SHALL increment consultation counts for each doctor
12. FOR ALL valid patient records, THE Patient_Import_Module SHALL create all related records (patient, consultation, appointment, billing) in a single transaction

### Requirement 3: Inventory and Services Import with 3-Way Categorization

**User Story:** As a clinic administrator, I want to import inventory items with automatic categorization into Services, Medicines, and Medical Supplies, so that items are organized correctly without manual classification.

#### Acceptance Criteria

1. THE Inventory_Import_Module SHALL categorize items into exactly one of three categories: Services, Medicines, or Medical_Supplies
2. THE Categorizer SHALL identify Services using keywords: "consultation", "procedure", "examination", "test", "screening", "therapy"
3. THE Categorizer SHALL identify Medicines using keywords: "tablet", "capsule", "syrup", "injection", "mg", "ml", "suspension", "ointment"
4. THE Categorizer SHALL identify Medical_Supplies as items not matching Services or Medicines patterns
5. THE Dosage_Extractor SHALL extract dosage information from item names using regex patterns
6. THE Unit_Standardizer SHALL normalize units to standard formats (mg, ml, tablets, pieces, boxes)
7. THE Inventory_Import_Module SHALL insert Services into the services table
8. THE Inventory_Import_Module SHALL insert Medicines and Medical_Supplies into the inventory table with appropriate category flags
9. THE Categorizer SHALL achieve greater than 95% accuracy on the provided 180-item dataset
10. WHEN an item name is ambiguous, THE Categorizer SHALL use additional context (price range, unit type) to determine category
11. THE Inventory_Import_Module SHALL preserve original item names and prices from the CSV

### Requirement 4: Laboratory Tests Import with Subcategory Classification

**User Story:** As a clinic administrator, I want to import laboratory tests with automatic subcategory classification, so that tests are organized into appropriate medical categories.

#### Acceptance Criteria

1. THE Lab_Import_Module SHALL categorize tests into 15 subcategories: Hematology, Clinical_Chemistry, Serology, Microbiology, Urinalysis, Fecalysis, Immunology, Toxicology, Molecular_Diagnostics, Histopathology, Cytology, Blood_Banking, Coagulation_Studies, Endocrinology, and Special_Tests
2. THE Categorizer SHALL use keyword matching to assign subcategories based on test names
3. THE Lab_Import_Module SHALL parse special notations: "(each)" for per-item pricing, "/" for alternative test names
4. THE Lab_Import_Module SHALL identify package tests that include multiple sub-tests
5. THE Lab_Import_Module SHALL extract turnaround time information when present in test descriptions
6. THE Lab_Import_Module SHALL generate unique service codes for each laboratory test
7. THE Service_Code SHALL follow the format "LAB-[CATEGORY]-[NUMBER]" (e.g., "LAB-HEMA-001")
8. THE Lab_Import_Module SHALL insert all tests into the services table with category metadata
9. THE Lab_Import_Module SHALL handle 162+ laboratory tests without performance issues
10. WHEN a test name does not match any subcategory keywords, THE Lab_Import_Module SHALL assign it to Special_Tests category

### Requirement 5: Data Validation and Error Handling

**User Story:** As a clinic administrator, I want comprehensive validation of imported data, so that invalid records are identified before database insertion.

#### Acceptance Criteria

1. THE Validator SHALL check that all required fields are present for each import type
2. THE Validator SHALL validate data types (integers for age, decimals for prices, dates for consultation dates)
3. THE Validator SHALL validate value ranges (age between 0-150, prices greater than 0)
4. THE Validator SHALL validate format patterns (phone numbers, email addresses if present)
5. WHEN a required field is missing, THE Validator SHALL mark the row as invalid with error message "Missing required field: [field_name]"
6. WHEN a data type is incorrect, THE Validator SHALL mark the row as invalid with error message "Invalid [field_name]: expected [type], got [value]"
7. WHEN a value is out of range, THE Validator SHALL mark the row as invalid with error message "[field_name] out of range: [value]"
8. THE Wizard_UI SHALL display all validation errors in the Preview step before import
9. THE Wizard_UI SHALL show error counts by type (missing fields, invalid types, out of range)
10. THE Import_System SHALL prevent progression to import step when validation errors exist
11. THE Wizard_UI SHALL allow users to download a CSV report of validation errors with row numbers

### Requirement 6: Duplicate Detection and Handling

**User Story:** As a clinic administrator, I want duplicate detection during import, so that I can avoid creating redundant records in the database.

#### Acceptance Criteria

1. THE Duplicate_Detector SHALL check for existing patient records by matching full name and date of birth
2. THE Duplicate_Detector SHALL check for existing inventory items by matching item name (case-insensitive)
3. THE Duplicate_Detector SHALL check for existing services by matching service name (case-insensitive)
4. THE Duplicate_Detector SHALL check for existing laboratory tests by matching test name (case-insensitive)
5. WHEN a duplicate is detected, THE Wizard_UI SHALL display the duplicate in the Preview step with a warning indicator
6. THE Wizard_UI SHALL provide options for each duplicate: "Skip", "Update Existing", or "Create New"
7. WHEN "Skip" is selected, THE Import_System SHALL exclude the duplicate from import
8. WHEN "Update Existing" is selected, THE Import_System SHALL update the existing record with new values
9. WHEN "Create New" is selected, THE Import_System SHALL create a new record despite the duplicate
10. THE Duplicate_Detector SHALL complete duplicate checking for 100+ records within 3 seconds

### Requirement 7: Transaction-Based Import with Rollback

**User Story:** As a clinic administrator, I want imports to be atomic with rollback capability, so that partial imports do not corrupt the database when errors occur.

#### Acceptance Criteria

1. THE Transaction_Manager SHALL begin a database transaction before starting any import
2. THE Batch_Processor SHALL insert all valid records within the transaction
3. WHEN any database error occurs during import, THE Transaction_Manager SHALL rollback all changes
4. WHEN rollback occurs, THE Import_System SHALL display an error message indicating the failure reason
5. WHEN rollback occurs, THE EMR_Database SHALL return to its pre-import state with no partial data
6. THE Transaction_Manager SHALL commit the transaction only after all records are successfully inserted
7. THE Import_System SHALL log all transaction operations for audit purposes
8. WHEN the transaction is committed, THE Import_System SHALL display a success message with import statistics

### Requirement 8: Batch Insert Optimization

**User Story:** As a clinic administrator, I want fast import processing for large datasets, so that I can import 100+ records without long wait times.

#### Acceptance Criteria

1. THE Batch_Processor SHALL insert records in batches of 50 to optimize database performance
2. THE Batch_Processor SHALL complete import of 100 records within 10 seconds
3. THE Batch_Processor SHALL complete import of 200 records within 20 seconds
4. THE Progress_Tracker SHALL update progress after each batch insertion
5. THE Batch_Processor SHALL use Supabase bulk insert methods when available
6. THE Batch_Processor SHALL handle database connection timeouts gracefully with retry logic
7. WHEN a batch fails, THE Transaction_Manager SHALL rollback the entire import, not just the failed batch

### Requirement 9: Progress Tracking and Result Summaries

**User Story:** As a clinic administrator, I want real-time progress tracking and detailed result summaries, so that I can monitor import status and review outcomes.

#### Acceptance Criteria

1. THE Progress_Tracker SHALL display a progress bar showing percentage completion during import
2. THE Progress_Tracker SHALL display current status text (e.g., "Importing patients: 45/100")
3. THE Progress_Tracker SHALL update progress in real-time as batches are processed
4. WHEN import completes successfully, THE Wizard_UI SHALL display a result summary showing:
   - Total records processed
   - Successfully imported records
   - Skipped duplicates
   - Failed records with error count
5. THE Wizard_UI SHALL display category breakdown for Inventory_Import_Module (Services: X, Medicines: Y, Supplies: Z)
6. THE Wizard_UI SHALL display subcategory breakdown for Lab_Import_Module (Hematology: X, Chemistry: Y, etc.)
7. THE Wizard_UI SHALL provide a "Download Results" button to export import summary as CSV
8. THE Wizard_UI SHALL provide a "Download Errors" button to export failed records with error messages as CSV
9. THE Result_Summary SHALL include import timestamp and user who performed the import

### Requirement 10: 3-Step Wizard User Interface

**User Story:** As a clinic administrator, I want a consistent 3-step wizard interface across all import modules, so that I have a familiar and intuitive import experience.

#### Acceptance Criteria

1. THE Wizard_UI SHALL display three steps: "Upload", "Preview & Validate", and "Import Progress & Results"
2. THE Wizard_UI SHALL show step indicators at the top showing current step and completed steps
3. THE Wizard_UI SHALL disable "Next" button in Upload step until a valid file is selected and parsed
4. THE Wizard_UI SHALL disable "Import" button in Preview step when validation errors exist
5. THE Wizard_UI SHALL allow navigation back to previous steps before import begins
6. THE Wizard_UI SHALL prevent navigation back after import begins
7. THE Wizard_UI SHALL match the existing EMR design system (colors, fonts, spacing, components)
8. THE Wizard_UI SHALL be responsive and functional on mobile devices (minimum width 375px)
9. THE Wizard_UI SHALL display loading spinners during file parsing and validation
10. THE Wizard_UI SHALL use the existing NotificationContext for success and error notifications

### Requirement 11: CSV Parsing with Papaparse Library

**User Story:** As a developer, I want to use the papaparse library for CSV parsing, so that I have robust and reliable CSV handling.

#### Acceptance Criteria

1. THE Import_System SHALL use papaparse library version 5.x or higher
2. THE CSV_Parser SHALL configure papaparse with header: true to auto-detect column names
3. THE CSV_Parser SHALL configure papaparse with skipEmptyLines: true to ignore blank rows
4. THE CSV_Parser SHALL configure papaparse with dynamicTyping: true to auto-convert numbers
5. THE CSV_Parser SHALL handle papaparse errors and display user-friendly error messages
6. THE CSV_Parser SHALL support both comma and semicolon delimiters
7. THE CSV_Parser SHALL handle quoted fields containing commas correctly

### Requirement 12: Integration with Existing EMR Components

**User Story:** As a developer, I want the import system to integrate with existing EMR components, so that it maintains consistency with the application architecture.

#### Acceptance Criteria

1. THE Import_System SHALL use the existing NotificationContext for displaying success and error messages
2. THE Import_System SHALL reference the exportService implementation as a pattern for CSV handling
3. THE Import_System SHALL use the existing Supabase client from lib/supabase.js
4. THE Import_System SHALL follow the existing React component structure and naming conventions
5. THE Import_System SHALL use existing EMR styling classes and Tailwind CSS utilities
6. THE Import_System SHALL integrate with existing database tables without schema modifications
7. THE Patient_Import_Module SHALL be accessible from the Patients page
8. THE Inventory_Import_Module SHALL be accessible from the Inventory page
9. THE Lab_Import_Module SHALL be accessible from the Services page

### Requirement 13: Mobile Responsive Design

**User Story:** As a clinic administrator using a mobile device, I want the import interface to be fully functional on small screens, so that I can perform imports from any device.

#### Acceptance Criteria

1. THE Wizard_UI SHALL display correctly on screens with minimum width of 375px (iPhone SE)
2. THE Wizard_UI SHALL stack form elements vertically on mobile devices
3. THE Wizard_UI SHALL use touch-friendly button sizes (minimum 44x44px)
4. THE Preview table SHALL scroll horizontally on mobile devices when columns exceed screen width
5. THE Wizard_UI SHALL maintain readability with appropriate font sizes on mobile (minimum 14px)
6. THE Progress_Tracker SHALL display clearly on mobile devices
7. THE Wizard_UI SHALL use responsive breakpoints consistent with existing EMR pages

### Requirement 14: Parser and Pretty Printer for CSV Format

**User Story:** As a developer, I want a parser and pretty printer for CSV format, so that I can reliably read and write CSV data.

#### Acceptance Criteria

1. WHEN a valid CSV file is provided, THE CSV_Parser SHALL parse it into structured data objects
2. WHEN an invalid CSV file is provided, THE CSV_Parser SHALL return a descriptive error with line number
3. THE CSV_Pretty_Printer SHALL format structured data objects back into valid CSV files
4. FOR ALL valid structured data objects, parsing then printing then parsing SHALL produce an equivalent object (round-trip property)
5. THE CSV_Pretty_Printer SHALL properly escape special characters (commas, quotes, newlines)
6. THE CSV_Pretty_Printer SHALL include column headers in the first row
7. THE CSV_Pretty_Printer SHALL use UTF-8 encoding for special characters

### Requirement 15: Import System Independence

**User Story:** As a developer, I want each import module to function independently, so that they can be developed, tested, and deployed separately.

#### Acceptance Criteria

1. THE Patient_Import_Module SHALL function without dependencies on Inventory_Import_Module or Lab_Import_Module
2. THE Inventory_Import_Module SHALL function without dependencies on Patient_Import_Module or Lab_Import_Module
3. THE Lab_Import_Module SHALL function without dependencies on Patient_Import_Module or Inventory_Import_Module
4. THE Import_System SHALL share common components (Wizard_UI, CSV_Parser, Validator) through reusable modules
5. WHEN one import module fails, THE Import_System SHALL allow other modules to continue functioning
6. THE Import_System SHALL allow enabling or disabling individual modules through configuration

### Requirement 16: Error Recovery and User Guidance

**User Story:** As a clinic administrator, I want clear error messages and guidance when imports fail, so that I can correct issues and retry successfully.

#### Acceptance Criteria

1. WHEN validation fails, THE Wizard_UI SHALL display specific error messages for each invalid row
2. WHEN database errors occur, THE Import_System SHALL display user-friendly error messages (not technical stack traces)
3. THE Wizard_UI SHALL provide actionable guidance for common errors (e.g., "Ensure doctor names match existing records")
4. THE Wizard_UI SHALL allow downloading error reports with row numbers and error descriptions
5. THE Wizard_UI SHALL allow users to fix errors in the CSV and re-upload without losing progress
6. WHEN network errors occur, THE Import_System SHALL display a retry button
7. THE Import_System SHALL log detailed error information for developer troubleshooting

### Requirement 17: Data Integrity and Consistency

**User Story:** As a clinic administrator, I want imports to maintain data integrity, so that the database remains consistent and accurate.

#### Acceptance Criteria

1. THE Import_System SHALL enforce foreign key relationships (patients to consultations, consultations to billing)
2. THE Import_System SHALL validate that referenced records exist before creating dependent records
3. THE Import_System SHALL prevent orphaned records (consultations without patients, billing without consultations)
4. THE Import_System SHALL maintain referential integrity during rollback operations
5. THE Import_System SHALL update related records atomically (e.g., doctor consultation counts with consultation creation)
6. THE Import_System SHALL prevent duplicate service codes for laboratory tests
7. THE Import_System SHALL ensure unique constraints are respected (patient names + DOB, item names)

### Requirement 18: Performance Requirements

**User Story:** As a clinic administrator, I want fast and responsive import operations, so that I can efficiently process large datasets.

#### Acceptance Criteria

1. THE CSV_Parser SHALL parse a 100-row CSV file within 1 second
2. THE Validator SHALL validate 100 rows within 2 seconds
3. THE Duplicate_Detector SHALL check 100 rows for duplicates within 3 seconds
4. THE Batch_Processor SHALL import 100 valid rows within 10 seconds
5. THE Wizard_UI SHALL remain responsive during import operations (no UI freezing)
6. THE Progress_Tracker SHALL update at least once per second during import
7. THE Import_System SHALL handle 200-row imports without memory issues or crashes

### Requirement 19: Audit Trail and Logging

**User Story:** As a clinic administrator, I want import operations to be logged, so that I can track who imported data and when.

#### Acceptance Criteria

1. THE Import_System SHALL log the start time, end time, and duration of each import operation
2. THE Import_System SHALL log the user who performed the import
3. THE Import_System SHALL log the number of records processed, succeeded, and failed
4. THE Import_System SHALL log the import module used (Patient, Inventory, or Lab)
5. THE Import_System SHALL log the source filename
6. THE Import_System SHALL store logs in a queryable format for reporting
7. WHEN errors occur, THE Import_System SHALL log detailed error information including stack traces

### Requirement 20: Security and Access Control

**User Story:** As a clinic administrator, I want import operations to respect user permissions, so that only authorized users can import data.

#### Acceptance Criteria

1. THE Import_System SHALL verify user authentication before allowing import operations
2. THE Import_System SHALL check user role permissions before displaying import interfaces
3. THE Import_System SHALL restrict import operations to users with "admin" or "staff" roles
4. THE Import_System SHALL prevent unauthorized access to import endpoints
5. THE Import_System SHALL sanitize all imported data to prevent SQL injection
6. THE Import_System SHALL validate file types to prevent malicious file uploads
7. THE Import_System SHALL limit file upload size to 5MB maximum
