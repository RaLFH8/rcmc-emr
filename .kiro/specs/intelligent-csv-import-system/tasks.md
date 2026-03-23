# Implementation Plan: Intelligent CSV Import System

## Overview

This implementation plan breaks down the Intelligent CSV Import System into discrete, manageable tasks. The system consists of three independent import modules (Patient Import, Inventory & Services Import, Lab Tests Import) with shared component libraries for CSV parsing, validation, duplicate detection, and batch processing. Each task builds incrementally, with property-based tests integrated throughout to validate correctness properties early.

## Tasks

- [x] 1. Install dependencies and set up project structure
  - Install papaparse library for CSV parsing
  - Install fast-check library for property-based testing
  - Create directory structure: `src/components/import/`, `src/utils/import/`, `src/services/import/`
  - Set up test directory structure matching implementation
  - _Requirements: 11.1, 12.3_

- [x] 2. Implement shared CSV Parser component
  - [x] 2.1 Create CSV Parser with papaparse integration
    - Implement file upload handling and papaparse configuration
    - Configure header detection, empty line skipping, dynamic typing
    - Handle UTF-8 encoding and whitespace trimming
    - Return parsed data with headers and row count
    - _Requirements: 1.2, 1.3, 1.6, 1.8, 11.2, 11.3, 11.4_
  
  - [ ]* 2.2 Write property test for CSV Parser
    - **Property 1: CSV Round-Trip Preservation**
    - **Property 2: CSV Parser Header Detection**
    - **Property 3: CSV Parser Whitespace Trimming**
    - **Property 4: CSV Parser UTF-8 Support**
    - **Validates: Requirements 1.3, 1.6, 1.8, 14.4**
  
  - [x] 2.3 Implement CSV Parser error handling
    - Catch papaparse errors with line numbers
    - Return descriptive error messages
    - Handle invalid file formats and malformed CSV
    - _Requirements: 1.4, 1.9, 11.5_
  
  - [ ]* 2.4 Write property test for CSV Parser error handling
    - **Property 5: CSV Parser Error Reporting**
    - **Validates: Requirements 1.4, 14.2**
  
  - [x] 2.5 Create CSV Pretty Printer utility
    - Implement structured data to CSV conversion
    - Handle special character escaping (commas, quotes, newlines)
    - Include headers in first row
    - Support UTF-8 encoding
    - _Requirements: 14.3, 14.5, 14.6, 14.7_
  
  - [ ]* 2.6 Write property tests for CSV Pretty Printer
    - **Property 6: CSV Pretty Printer Special Character Escaping**
    - **Property 7: CSV Pretty Printer Header Inclusion**
    - **Validates: Requirements 14.5, 14.6**

- [x] 3. Implement shared Validation Engine
  - [x] 3.1 Create validation rule system
    - Define ValidationRule interface and types
    - Implement required field validation
    - Implement data type validation (string, number, date)
    - Implement range validation (min/max values)
    - Implement format pattern validation (regex)
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [ ]* 3.2 Write property tests for validation rules
    - **Property 32: Required Field Validation**
    - **Property 33: Data Type Validation**
    - **Property 34: Value Range Validation**
    - **Property 35: Format Pattern Validation**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
  
  - [x] 3.3 Implement validation error collection and reporting
    - Collect all validation errors per row
    - Group errors by type (missing, invalid_type, out_of_range, invalid_format)
    - Generate error messages with row numbers and field names
    - _Requirements: 5.5, 5.6, 5.7, 5.8, 5.9_
  
  - [x] 3.4 Create validation error CSV export
    - Export validation errors to CSV format
    - Include row number, field, value, error type, error message
    - _Requirements: 5.11_
  
  - [ ]* 3.5 Write property test for validation error export
    - **Property 36: Validation Error CSV Export Round-Trip**
    - **Validates: Requirements 5.11**

- [x] 4. Implement shared Duplicate Detector component
  - [x] 4.1 Create duplicate detection system
    - Implement database query for existing records
    - Support case-insensitive name matching
    - Support fuzzy matching for patient names
    - Return duplicate matches with existing records
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [ ]* 4.2 Write property test for duplicate detection
    - **Property 37: Duplicate Detection Matching**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
  
  - [x] 4.3 Implement duplicate resolution handling
    - Support "Skip", "Update Existing", "Create New" options
    - Filter data based on resolution choices
    - Track user resolution decisions
    - _Requirements: 6.6, 6.7, 6.8, 6.9_
  
  - [ ]* 4.4 Write property tests for duplicate resolution
    - **Property 38: Duplicate Resolution - Skip**
    - **Property 39: Duplicate Resolution - Update**
    - **Property 40: Duplicate Resolution - Create New**
    - **Validates: Requirements 6.7, 6.8, 6.9**
  
  - [x] 4.5 Optimize duplicate detection performance
    - Implement batch database queries (max 50 at a time)
    - Use database indexes for matching fields
    - Cache query results during session
    - _Requirements: 6.10, 18.3_

- [x] 5. Implement shared Batch Processor component
  - [x] 5.1 Create batch processing system
    - Split data into batches of 50 records
    - Execute batch inserts sequentially
    - Use Supabase bulk insert methods
    - Measure import duration
    - _Requirements: 8.1, 8.2, 8.3, 8.5_
  
  - [x] 5.2 Implement progress tracking
    - Calculate and emit progress updates after each batch
    - Include current batch, total batches, processed records, percentage
    - Update at least once per second
    - _Requirements: 8.4, 9.1, 9.2, 9.3, 18.6_
  
  - [x] 5.3 Implement batch error handling
    - Catch batch-level errors
    - Collect error details (row number, data, error message)
    - Trigger transaction rollback on any error
    - _Requirements: 8.6, 8.7_

- [x] 6. Implement shared Transaction Manager component
  - [x] 6.1 Create transaction management system
    - Implement transaction begin/commit/rollback
    - Use Supabase RPC for server-side transactions
    - Track all operations within transaction
    - Log transaction operations for audit
    - _Requirements: 7.1, 7.2, 7.6, 7.7_
  
  - [x] 6.2 Implement transaction rollback handling
    - Rollback on any database error
    - Ensure database returns to pre-import state
    - Display error message with failure reason
    - _Requirements: 7.3, 7.4, 7.5_
  
  - [ ]* 6.3 Write property test for transaction rollback
    - **Property 41: Transaction Rollback on Error**
    - **Validates: Requirements 7.3, 7.5, 8.7**

- [x] 7. Implement shared Progress Tracker component
  - [x] 7.1 Create progress tracking UI component
    - Display progress bar (0-100%)
    - Show status text with current operation
    - Display real-time percentage
    - Show estimated time remaining
    - _Requirements: 9.1, 9.2, 9.3_
  
  - [x] 7.2 Implement results summary display
    - Show total records, successful, skipped, failed counts
    - Display category breakdown for inventory/lab imports
    - Include import timestamp and user ID
    - _Requirements: 9.4, 9.5, 9.6, 9.9_
  
  - [ ]* 7.3 Write property tests for import results
    - **Property 43: Import Results CSV Export**
    - **Property 44: Import Errors CSV Export**
    - **Property 45: Import Result Metadata**
    - **Validates: Requirements 9.7, 9.8, 9.9**
  
  - [x] 7.4 Implement result and error CSV export
    - Export import summary to CSV
    - Export failed records with errors to CSV
    - Provide download buttons in UI
    - _Requirements: 9.7, 9.8_

- [x] 8. Checkpoint - Ensure shared components are complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement Patient Field Parser
  - [x] 9.1 Create Age/Sex parser
    - Parse pattern "[number]/[M|F]" with optional whitespace
    - Extract age as integer and sex as character
    - Return null for invalid formats
    - _Requirements: 2.1, 2.2_
  
  - [ ]* 9.2 Write property test for Age/Sex parser
    - **Property 8: Age/Sex Parser Extraction**
    - **Validates: Requirements 2.1, 2.2**
  
  - [x] 9.3 Create doctor name matcher
    - Query all active doctors from database
    - Match by full name (case-insensitive)
    - Fallback to last name match
    - Use fuzzy matching (Levenshtein distance)
    - _Requirements: 2.3, 2.4_
  
  - [ ]* 9.4 Write property tests for doctor name matching
    - **Property 9: Doctor Name Matching**
    - **Property 10: Non-Existent Doctor Validation**
    - **Validates: Requirements 2.3, 2.4**
  
  - [x] 9.5 Create discount and payment parsers
    - Parse percentage discounts ("10%")
    - Parse fixed amount discounts ("50")
    - Parse payment amounts with currency symbols and commas
    - _Requirements: 2.5, 2.6_
  
  - [ ]* 9.6 Write property tests for discount and payment parsers
    - **Property 11: Discount Parser Flexibility**
    - **Property 12: Payment Parser Numeric Extraction**
    - **Validates: Requirements 2.5, 2.6**

- [x] 10. Implement Patient Import Module
  - [x] 10.1 Create patient import service
    - Implement multi-table insert strategy
    - Create or find patient by name and DOB
    - Create appointment record
    - Create consultation record
    - Create billing record
    - Link all records with foreign keys
    - _Requirements: 2.7, 2.8, 2.9, 2.10, 2.12_
  
  - [ ]* 10.2 Write property tests for patient import
    - **Property 13: Patient Import Multi-Table Creation**
    - **Property 46: Referential Integrity Enforcement**
    - **Validates: Requirements 2.7, 2.8, 2.9, 2.10, 2.12, 17.1, 17.2, 17.3**
  
  - [x] 10.3 Implement doctor consultation count increment
    - Update doctor consultation count after each import
    - Ensure atomic update with consultation creation
    - _Requirements: 2.11_
  
  - [ ]* 10.4 Write property tests for doctor consultation count
    - **Property 14: Doctor Consultation Count Increment**
    - **Property 47: Atomic Related Record Updates**
    - **Validates: Requirements 2.11, 17.5**
  
  - [x] 10.5 Create Patient Import UI modal
    - Integrate with 3-step wizard
    - Configure validation rules for patient data
    - Configure duplicate detection for patients
    - Display parsed Age/Sex, doctor names, discounts, payments
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 12.7_

- [x] 11. Implement Inventory Categorizer Engine
  - [x] 11.1 Create keyword-based categorization
    - Implement service keyword matching
    - Implement medicine keyword matching
    - Default to medical supplies for unmatched items
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [ ]* 11.2 Write property tests for categorization
    - **Property 15: Inventory Item Single Category Assignment**
    - **Property 16: Service Keyword Categorization**
    - **Property 17: Medicine Keyword Categorization**
    - **Property 18: Medical Supplies Default Categorization**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
  
  - [x] 11.3 Implement price and unit heuristics
    - Use price range for ambiguous items
    - Use unit type for classification hints
    - _Requirements: 3.10_
  
  - [x] 11.4 Create dosage extractor
    - Extract dosage patterns (number + unit)
    - Detect medication forms (tablet, capsule, syrup)
    - Return amount, unit, form, clean name
    - _Requirements: 3.5_
  
  - [ ]* 11.5 Write property test for dosage extraction
    - **Property 19: Dosage Extraction Pattern Matching**
    - **Validates: Requirements 3.5**
  
  - [x] 11.6 Create unit standardizer
    - Normalize unit variants to canonical forms
    - Support weight, volume, count units
    - _Requirements: 3.6_
  
  - [ ]* 11.7 Write property test for unit standardization
    - **Property 20: Unit Standardization Normalization**
    - **Validates: Requirements 3.6**

- [x] 12. Implement Inventory Import Module
  - [x] 12.1 Create inventory import service
    - Route Services to services table
    - Route Medicines and Supplies to inventory table
    - Set appropriate category flags
    - Generate item codes for inventory items
    - Preserve original names and prices
    - _Requirements: 3.7, 3.8, 3.11_
  
  - [ ]* 12.2 Write property tests for inventory import
    - **Property 21: Inventory Category-Based Table Routing**
    - **Property 22: Inventory Import Data Preservation**
    - **Validates: Requirements 3.7, 3.8, 3.11**
  
  - [x] 12.3 Create Inventory Import UI modal
    - Integrate with 3-step wizard
    - Configure validation rules for inventory data
    - Configure duplicate detection for items
    - Display category breakdown in results
    - _Requirements: 3.1, 9.5, 12.8_

- [x] 13. Implement Lab Test Categorizer Engine
  - [x] 13.1 Create 15-category classification system
    - Define category keywords for all 15 categories
    - Implement keyword matching algorithm
    - Default to Special_Tests for unmatched tests
    - _Requirements: 4.1, 4.2, 4.10_
  
  - [ ]* 13.2 Write property tests for lab test categorization
    - **Property 23: Lab Test 15-Category Assignment**
    - **Property 24: Lab Test Keyword-Based Categorization**
    - **Property 31: Lab Test Default Category Assignment**
    - **Validates: Requirements 4.1, 4.2, 4.10**
  
  - [x] 13.3 Create special notation parser
    - Parse "(each)" for per-item pricing
    - Parse "/" for alternative test names
    - Detect package tests by keywords
    - Extract turnaround time information
    - _Requirements: 4.3, 4.4, 4.5_
  
  - [ ]* 13.4 Write property tests for special notation parsing
    - **Property 25: Lab Test Special Notation Parsing**
    - **Property 26: Lab Test Package Detection**
    - **Property 27: Lab Test Turnaround Time Extraction**
    - **Validates: Requirements 4.3, 4.4, 4.5**
  
  - [x] 13.5 Create service code generator
    - Generate format "LAB-[PREFIX]-[NUMBER]"
    - Query existing codes to ensure uniqueness
    - Increment numbers per category
    - _Requirements: 4.6, 4.7_
  
  - [ ]* 13.6 Write property tests for service code generation
    - **Property 28: Lab Test Service Code Uniqueness**
    - **Property 29: Lab Test Service Code Format**
    - **Property 48: Unique Constraint Enforcement**
    - **Validates: Requirements 4.6, 4.7, 17.6, 17.7**

- [x] 14. Implement Lab Tests Import Module
  - [x] 14.1 Create lab test import service
    - Insert tests into services table
    - Include category metadata
    - Store alternative names in description
    - Store turnaround time in description
    - Flag per-item pricing and packages
    - _Requirements: 4.8_
  
  - [ ]* 14.2 Write property test for lab test import
    - **Property 30: Lab Test Database Insertion**
    - **Validates: Requirements 4.8**
  
  - [x] 14.3 Create Lab Tests Import UI modal
    - Integrate with 3-step wizard
    - Configure validation rules for lab test data
    - Configure duplicate detection for tests
    - Display subcategory breakdown in results
    - _Requirements: 4.1, 9.6, 12.9_

- [x] 15. Checkpoint - Ensure all module-specific components are complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Implement 3-Step Wizard UI component
  - [x] 16.1 Create wizard shell component
    - Implement step indicators and navigation
    - Manage step progression logic
    - Disable navigation based on validation state
    - Prevent back navigation after import starts
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_
  
  - [x] 16.2 Create Step 1: Upload interface
    - File upload input with drag-and-drop
    - File type validation (CSV, Excel)
    - File size validation (max 5MB)
    - Display file preview (first 10 rows)
    - Show loading spinner during parsing
    - _Requirements: 1.1, 1.7, 1.9, 10.9, 20.6, 20.7_
  
  - [x] 16.3 Create Step 2: Preview & Validate interface
    - Display parsed data in table format
    - Show validation errors with row numbers
    - Display error counts by type
    - Show duplicate warnings with resolution options
    - Enable horizontal scroll on mobile
    - _Requirements: 5.8, 5.9, 5.10, 6.5, 6.6, 13.4_
  
  - [x] 16.4 Create Step 3: Import Progress & Results interface
    - Display progress bar and status text
    - Show real-time progress updates
    - Display results summary with counts
    - Show category/subcategory breakdown
    - Provide download buttons for results and errors
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_
  
  - [x] 16.5 Implement mobile responsive design
    - Stack form elements vertically on mobile
    - Use touch-friendly button sizes (44x44px)
    - Ensure minimum font size 14px
    - Test on 375px minimum width
    - _Requirements: 13.1, 13.2, 13.3, 13.5, 13.6_
  
  - [x] 16.6 Integrate with NotificationContext
    - Show success notifications on import completion
    - Show error notifications on failures
    - Display user-friendly error messages
    - _Requirements: 10.10, 12.1, 16.2_

- [x] 17. Integrate import modals with existing pages
  - [x] 17.1 Add Patient Import button to Patients page
    - Create "Import Patients" button in page header
    - Open Patient Import modal on click
    - Refresh patient list after successful import
    - _Requirements: 12.7_
  
  - [x] 17.2 Add Inventory Import button to Inventory page
    - Create "Import Inventory" button in page header
    - Open Inventory Import modal on click
    - Refresh inventory list after successful import
    - _Requirements: 12.8_
  
  - [x] 17.3 Add Lab Tests Import button to Services page
    - Create "Import Lab Tests" button in page header
    - Open Lab Tests Import modal on click
    - Refresh services list after successful import
    - _Requirements: 12.9_

- [x] 18. Implement security and access control
  - [x] 18.1 Add authentication checks
    - Verify user authentication before showing import buttons
    - Check user role permissions (admin or staff)
    - Prevent unauthorized access to import endpoints
    - _Requirements: 20.1, 20.2, 20.3, 20.4_
  
  - [x] 18.2 Implement input sanitization
    - Sanitize all imported data to prevent SQL injection
    - Validate file types to prevent malicious uploads
    - Enforce file size limits
    - _Requirements: 20.5, 20.6, 20.7_

- [x] 19. Implement audit logging
  - [x] 19.1 Create import audit log system
    - Log start time, end time, duration
    - Log user ID and username
    - Log record counts (processed, succeeded, failed)
    - Log import module type
    - Log source filename
    - _Requirements: 7.7, 19.1, 19.2, 19.3, 19.4, 19.5_
  
  - [ ]* 19.2 Write property test for audit logging
    - **Property 42: Import Audit Logging**
    - **Validates: Requirements 7.7**
  
  - [x] 19.3 Implement error logging
    - Log detailed error information with stack traces
    - Store logs in queryable format
    - _Requirements: 16.7, 19.6, 19.7_

- [x] 20. Implement error recovery and user guidance
  - [x] 20.1 Create error message system
    - Display specific error messages for each invalid row
    - Show user-friendly messages (not technical stack traces)
    - Provide actionable guidance for common errors
    - _Requirements: 16.1, 16.2, 16.3_
  
  - [x] 20.2 Implement error report download
    - Generate CSV with row numbers and error descriptions
    - Allow users to fix errors and re-upload
    - _Requirements: 16.4, 16.5_
  
  - [x] 20.3 Add retry functionality
    - Display retry button on network errors
    - Implement exponential backoff for retries
    - _Requirements: 16.6_

- [x] 21. Performance optimization and testing
  - [x] 21.1 Optimize CSV parsing performance
    - Ensure 100-row parsing completes within 1 second
    - Test with various file sizes and formats
    - _Requirements: 1.5, 18.1_
  
  - [x] 21.2 Optimize validation performance
    - Ensure 100-row validation completes within 2 seconds
    - Optimize validation rule execution
    - _Requirements: 18.2_
  
  - [x] 21.3 Optimize batch import performance
    - Ensure 100-row import completes within 10 seconds
    - Ensure 200-row import completes within 20 seconds
    - Test memory usage and prevent leaks
    - _Requirements: 8.2, 8.3, 18.4, 18.7_
  
  - [x] 21.4 Ensure UI responsiveness
    - Verify no UI freezing during operations
    - Test progress updates frequency
    - _Requirements: 18.5, 18.6_

- [x] 22. Final integration testing and verification
  - [x] 22.1 Test Patient Import end-to-end
    - Upload valid patient CSV
    - Verify parsing, validation, duplicate detection
    - Verify multi-table record creation
    - Verify doctor consultation count updates
    - Test error scenarios and rollback
  
  - [x] 22.2 Test Inventory Import end-to-end
    - Upload valid inventory CSV
    - Verify categorization accuracy (≥95%)
    - Verify correct table routing (services vs inventory)
    - Verify category breakdown display
    - Test error scenarios and rollback
  
  - [x] 22.3 Test Lab Tests Import end-to-end
    - Upload valid lab tests CSV
    - Verify 15-category classification
    - Verify service code generation and uniqueness
    - Verify special notation parsing
    - Verify subcategory breakdown display
    - Test error scenarios and rollback
  
  - [x] 22.4 Test module independence
    - Verify each module functions independently
    - Test that one module failure doesn't affect others
    - _Requirements: 15.1, 15.2, 15.3, 15.5_
  
  - [x] 22.5 Test mobile responsiveness
    - Test on 375px width (iPhone SE)
    - Verify touch-friendly interactions
    - Test horizontal scrolling on tables
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_

- [x] 23. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at major milestones
- Property tests validate universal correctness properties using fast-check library
- Unit tests validate specific examples and edge cases
- The implementation follows a bottom-up approach: shared components first, then module-specific components, then UI integration
- All imports use transactions to ensure atomicity and data integrity
- Performance targets: 100 rows in ≤10 seconds, 200 rows in ≤20 seconds
- Mobile responsive design with minimum width 375px
- Integration with existing EMR components (NotificationContext, Supabase client, exportService pattern)
