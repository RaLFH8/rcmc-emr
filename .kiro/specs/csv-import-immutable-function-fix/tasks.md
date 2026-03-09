# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Fault Condition** - Migration Immutable Function Error
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Test the concrete failing case - executing ADD_INVENTORY_BATCH_TRACKING.sql in Supabase
  - Test that executing the UNFIXED ADD_INVENTORY_BATCH_TRACKING.sql script in a test Supabase database fails with "ERROR: 42P17: functions in index expression must be marked IMMUTABLE"
  - Test variations to confirm root cause:
    - Execute script without Step 9 (UPDATE statement) - should succeed
    - Execute script without Step 2 (unique indexes) - should succeed
    - Execute on empty inventory table - should still fail (confirms query planning issue)
  - The test assertions should match the Expected Behavior Properties from design:
    - Migration completes successfully without immutable function errors
    - All steps (columns, indexes, views, triggers, batch number updates) are applied correctly
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found:
    - Error message: "ERROR: 42P17: functions in index expression must be marked IMMUTABLE"
    - Failing step: Step 9 UPDATE statement with ROW_NUMBER() window function
    - Root cause: PostgreSQL query planner incorrectly interprets window function as related to unique indexes
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Existing Functionality Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs (normal database operations NOT involving migration execution)
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements:
    - All existing inventory records and their data are preserved
    - Direct queries on the inventory table continue to work
    - NULL values for batch_number, lot_number, expiration_date, manufacture_date are allowed
    - Status updates based on stock levels continue for items without expiration dates
    - Multiple inventory items with the same name but different batches are allowed
  - Property-based testing generates many test cases for stronger guarantees
  - Test cases to implement:
    - Data preservation: Verify all existing inventory records have identical data after migration
    - Query functionality: Verify SELECT queries return same results as before
    - Insert operations: Verify new inventory items can be inserted with/without batch numbers
    - Update operations: Verify inventory updates work correctly
    - View queries: Verify inventory_summary, expiring_inventory, expired_inventory views return correct data
    - Trigger behavior: Verify status updates trigger correctly on stock/expiry changes
  - Run tests on UNFIXED code (or on a database with the original migration if it had succeeded)
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 3. Fix for Migration Immutable Function Error

  - [x] 3.1 Implement the fix in ADD_INVENTORY_BATCH_TRACKING.sql
    - Open file: rcmc-emr/ADD_INVENTORY_BATCH_TRACKING.sql
    - Locate Step 9: "Update existing records to set batch numbers if missing"
    - Replace the current UPDATE statement with CTE-based approach:
      ```sql
      -- Step 9: Update existing records to set batch numbers if missing
      WITH numbered_inventory AS (
        SELECT 
          id,
          'BATCH-' || LPAD(ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at)::TEXT, 4, '0') as new_batch_number
        FROM inventory
        WHERE batch_number IS NULL
      )
      UPDATE inventory
      SET batch_number = numbered_inventory.new_batch_number
      FROM numbered_inventory
      WHERE inventory.id = numbered_inventory.id;
      ```
    - This separates the window function calculation into a CTE
    - Uses UPDATE FROM syntax to join the results
    - Avoids triggering PostgreSQL's immutability checks
    - Maintains the exact same logic and results as the original
    - _Bug_Condition: isBugCondition(input) where input.containsUniqueIndexes = TRUE AND input.containsUpdateWithWindowFunction = TRUE AND input.windowFunction = 'ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...)' AND executionContext = 'PostgreSQL/Supabase'_
    - _Expected_Behavior: Migration completes successfully without immutable function errors, with all steps (columns, indexes, views, triggers, batch number updates) applied correctly_
    - _Preservation: All existing inventory data, table structure, and query functionality remain unchanged. All functionality NOT related to the Step 9 UPDATE statement is completely unaffected._
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Migration Completes Successfully
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - Execute the FIXED ADD_INVENTORY_BATCH_TRACKING.sql script in test Supabase database
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Verify all test cases pass:
      - Full script execution completes successfully
      - All columns are added to inventory table
      - All unique indexes are created
      - All views (inventory_summary, expiring_inventory, expired_inventory) are created
      - Trigger is installed and functional
      - Existing records are updated with batch numbers
    - Test with various scenarios:
      - Empty inventory table
      - Existing records without batches (10 items)
      - Mixed records (some with batch numbers, some NULL)
      - Large dataset (1000+ items)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - No Regressions
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix:
      - Data preservation: All existing inventory records have identical data
      - Query functionality: SELECT queries return same results
      - Insert operations: New inventory items can be inserted with/without batch numbers
      - Update operations: Inventory updates work correctly
      - View queries: All views return correct data
      - Trigger behavior: Status updates trigger correctly
    - Verify no unexpected side effects on non-migration operations
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - Verify the fixed migration script can be executed successfully in Supabase
  - Confirm batch tracking feature is ready for deployment
  - Document any findings or edge cases discovered during testing
