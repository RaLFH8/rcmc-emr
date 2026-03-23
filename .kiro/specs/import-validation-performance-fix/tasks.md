# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Fault Condition** - Large Dataset Validation Performance Bug
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the performance bug exists
  - **Scoped PBT Approach**: For deterministic performance bugs, scope the property to concrete failing cases (1600+ rows) to ensure reproducibility
  - Test that import validation for datasets with 1000+ rows completes within 3 minutes maximum (from Fault Condition in design)
  - Test implementation details: validateData function with isBugCondition(input) where input.rowCount >= 1000
  - The test assertions should match the Expected Behavior Properties from design (linear O(n) performance scaling)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause (likely synchronous processing, inefficient doctor lookups, redundant validation rules)
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 2.1, 2.2_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Small Dataset and Accuracy Preservation
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs (datasets under 1000 rows)
  - Observe: Small dataset validation (under 100 rows) performance and accuracy on unfixed code
  - Observe: Validation rule accuracy and error detection on unfixed code
  - Observe: Error reporting format and detail level on unfixed code
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Property-based testing generates many test cases for stronger guarantees
  - Test that for datasets under 1000 rows (where isBugCondition returns false), validation results and performance remain identical
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3. Fix for import validation performance degradation

  - [x] 3.1 Implement batch validation optimization
    - Replace sequential processing with chunked batch validation in `src/utils/import/validationEngine.js`
    - Process rows in batches of 100-200 records using Promise.all() for parallel processing
    - Maintain progress tracking between batches
    - Implement streaming validation for large datasets to reduce memory pressure
    - _Bug_Condition: isBugCondition(input) where input.rowCount >= 1000 AND input.validationRules.length > 5_
    - _Expected_Behavior: Linear O(n) performance scaling, completion within 3 minutes for 1600 rows_
    - _Preservation: Small dataset performance and validation accuracy from design_
    - _Requirements: 2.1, 2.2_

  - [x] 3.2 Implement doctor lookup optimization
    - Replace linear search with hash map lookup in `src/services/import/patientImportService.js`
    - Pre-build doctor name index: Map<string, Doctor> for O(1) lookups
    - Support fuzzy matching with pre-computed similarity scores
    - Cache lookup results within validation session
    - _Bug_Condition: Doctor lookup inefficiency for large datasets_
    - _Expected_Behavior: O(1) doctor lookups instead of O(n) linear search_
    - _Preservation: Doctor matching accuracy and fuzzy matching behavior_
    - _Requirements: 2.1, 2.2_

  - [x] 3.3 Implement validation rule compilation and caching
    - Pre-compile validation rules for efficiency in `src/utils/import/validationEngine.js`
    - Create compiled rule objects with optimized validators
    - Cache regex patterns and type checkers
    - Implement rule memoization for repeated validations
    - _Bug_Condition: Redundant validation rule execution for each row_
    - _Expected_Behavior: Compiled rules with memoization for performance_
    - _Preservation: Validation rule accuracy and error detection_
    - _Requirements: 2.1, 2.2_

  - [x] 3.4 Implement memory usage optimization
    - Use generators for lazy evaluation in batch processing
    - Implement garbage collection hints between batches
    - Process data in chunks to reduce memory pressure
    - Add memory monitoring and optimization
    - _Bug_Condition: Memory inefficiency with large datasets_
    - _Expected_Behavior: Optimized memory usage with streaming processing_
    - _Preservation: Data integrity and processing accuracy_
    - _Requirements: 2.1, 2.2_

  - [x] 3.5 Implement async validation processing
    - Convert synchronous validation to async with batching in `src/services/import/patientImportService.js`
    - Use async/await for non-blocking validation
    - Implement worker-like processing for CPU-intensive validation
    - Add progress callbacks for UI responsiveness
    - _Bug_Condition: Synchronous sequential processing blocking UI_
    - _Expected_Behavior: Non-blocking async validation with progress tracking_
    - _Preservation: Progress tracking and cancellation functionality_
    - _Requirements: 2.1, 2.2, 3.4_

  - [x] 3.6 Integrate validation batching with processing
    - Combine validation and processing batches in `src/utils/import/batchProcessor.js`
    - Validate and process in same batch cycle
    - Reduce memory allocation/deallocation overhead
    - Implement validation result caching
    - _Bug_Condition: Separate validation and processing causing overhead_
    - _Expected_Behavior: Integrated batching for optimal performance_
    - _Preservation: Processing accuracy and error handling_
    - _Requirements: 2.1, 2.2_

  - [x] 3.7 Add performance monitoring and metrics
    - Track validation time per batch
    - Monitor memory usage during validation
    - Provide performance metrics for optimization
    - Add logging for performance analysis
    - _Bug_Condition: Lack of performance visibility_
    - _Expected_Behavior: Comprehensive performance monitoring_
    - _Preservation: Existing logging and monitoring functionality_
    - _Requirements: 2.1, 2.2_

  - [x] 3.8 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Large Dataset Validation Performance
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Verify that 1600+ row datasets now validate within 3 minutes maximum
    - _Requirements: Expected Behavior Properties from design (2.1, 2.2)_

  - [x] 3.9 Verify preservation tests still pass
    - **Property 2: Preservation** - Small Dataset and Accuracy Preservation
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)
    - Verify small dataset performance and validation accuracy preserved
    - _Requirements: Preservation Requirements from design (3.1, 3.2, 3.3, 3.4)_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise
  - Verify performance targets are met (1600 rows in 2-3 minutes)
  - Confirm no regressions in small dataset validation
  - Validate that all preservation requirements are maintained
  - Document performance improvements and metrics