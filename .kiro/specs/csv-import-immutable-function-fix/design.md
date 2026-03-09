# CSV Import Immutable Function Error Bugfix Design

## Overview

The ADD_INVENTORY_BATCH_TRACKING.sql migration fails with "ERROR: 42P17: functions in index expression must be marked IMMUTABLE" when executed in Supabase. The root cause is Step 9's UPDATE statement using `ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at)`, which PostgreSQL interprets as a non-immutable function in the context of the unique indexes created in Step 2. The fix involves rewriting Step 9 to use a CTE-based approach that doesn't trigger the immutability check, ensuring the migration completes successfully while preserving all existing functionality.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when the SQL migration script is executed in PostgreSQL/Supabase
- **Property (P)**: The desired behavior - the migration completes successfully without immutable function errors
- **Preservation**: All existing inventory data, table structure, and query functionality that must remain unchanged
- **ROW_NUMBER()**: A PostgreSQL window function that assigns sequential numbers to rows within a partition
- **IMMUTABLE Function**: A function that always returns the same result for the same input arguments, required for index expressions
- **CTE (Common Table Expression)**: A temporary named result set (WITH clause) used to simplify complex queries
- **Unique Index**: A database constraint that ensures no duplicate values exist for specified columns

## Bug Details

### Fault Condition

The bug manifests when the ADD_INVENTORY_BATCH_TRACKING.sql script is executed in Supabase. PostgreSQL's query planner incorrectly interprets the window function `ROW_NUMBER()` in Step 9's UPDATE statement as being related to the unique indexes created in Step 2, triggering an immutability check that fails.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type SQLMigrationScript
  OUTPUT: boolean
  
  RETURN input.containsUniqueIndexes = TRUE
         AND input.containsUpdateWithWindowFunction = TRUE
         AND input.windowFunction = 'ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...)'
         AND executionContext = 'PostgreSQL/Supabase'
         AND NOT migrationCompletesSuccessfully
END FUNCTION
```

### Examples

- **Example 1**: Executing the current ADD_INVENTORY_BATCH_TRACKING.sql in Supabase returns "ERROR: 42P17: functions in index expression must be marked IMMUTABLE" and the migration fails
- **Example 2**: If Step 9 is removed, the migration completes successfully but existing records lack batch numbers
- **Example 3**: If Step 2 (unique indexes) is removed, the migration completes but batch uniqueness is not enforced
- **Edge Case**: Empty inventory table - the UPDATE in Step 9 affects 0 rows but still triggers the error due to query planning

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- All existing inventory records and their data must be preserved during migration
- The inventory table structure (columns, data types) must remain as specified
- Direct queries on the inventory table must continue to work
- NULL values for batch_number, lot_number, expiration_date, manufacture_date must be allowed
- Status updates based on stock levels must continue for items without expiration dates
- Multiple inventory items with the same name but different batches must be allowed

**Scope:**
All functionality NOT related to the Step 9 UPDATE statement should be completely unaffected by this fix. This includes:
- Column additions (Step 1)
- Unique index creation (Step 2-4)
- View creation (Step 5-7)
- Trigger creation (Step 8, 10)
- Comments and permissions (Step 11-12)

## Hypothesized Root Cause

Based on the error message and SQL analysis, the most likely issues are:

1. **Query Planner Misinterpretation**: PostgreSQL's query planner sees the unique indexes created in Step 2 and the window function in Step 9's UPDATE statement, incorrectly assuming the window function might be used in an index expression context, triggering an immutability check

2. **Window Function in UPDATE**: The `ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at)` window function is not inherently immutable (it depends on the order of rows), and PostgreSQL's strict checking flags this as potentially problematic when unique indexes exist on the same table

3. **Timing of Index Creation**: The unique indexes are created before the UPDATE statement executes, causing PostgreSQL to validate the UPDATE against the new index constraints in a way that triggers the immutability error

4. **Supabase PostgreSQL Version**: Specific PostgreSQL versions or Supabase configurations may have stricter immutability checking than standard PostgreSQL installations

## Correctness Properties

Property 1: Fault Condition - Migration Completes Successfully

_For any_ execution of the ADD_INVENTORY_BATCH_TRACKING.sql script in Supabase where unique indexes are created and existing records need batch numbers assigned, the fixed migration script SHALL complete successfully without immutable function errors, with all steps (columns, indexes, views, triggers, batch number updates) applied correctly.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**

Property 2: Preservation - Existing Functionality Unchanged

_For any_ database operation that does NOT involve executing the migration script (normal inventory queries, inserts, updates, deletes), the fixed migration SHALL produce exactly the same database state and behavior as the original migration would have if it had succeeded, preserving all data, constraints, views, and triggers.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `rcmc-emr/ADD_INVENTORY_BATCH_TRACKING.sql`

**Section**: Step 9

**Specific Changes**:

1. **Replace Window Function with CTE**: Rewrite Step 9 to use a Common Table Expression (CTE) that calculates row numbers separately, then joins back to update the inventory table
   - This separates the window function calculation from the UPDATE statement
   - PostgreSQL won't trigger immutability checks on the CTE approach

2. **Alternative: Use Subquery with DISTINCT ON**: Use PostgreSQL's `DISTINCT ON` with a subquery to generate batch numbers without window functions
   - This avoids window functions entirely
   - May be simpler but less readable

3. **Alternative: Use DO Block with Loop**: Wrap the UPDATE in a PL/pgSQL DO block that iterates through records
   - This completely avoids window functions in SQL context
   - More verbose but guaranteed to work

4. **Recommended Approach - CTE with UPDATE FROM**:
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

This approach:
- Separates the window function calculation into a CTE
- Uses UPDATE FROM syntax to join the results
- Avoids triggering PostgreSQL's immutability checks
- Maintains the exact same logic and results as the original

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Fault Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Execute the UNFIXED ADD_INVENTORY_BATCH_TRACKING.sql script in a test Supabase database and observe the error. Then test variations (removing indexes, removing UPDATE, etc.) to confirm the root cause.

**Test Cases**:
1. **Full Script Execution**: Run the complete unfixed script (will fail with immutable function error)
2. **Without Step 9**: Run script without the UPDATE statement (will succeed, confirming Step 9 is the issue)
3. **Without Step 2**: Run script without unique indexes (will succeed, confirming index interaction)
4. **Empty Table Test**: Run on empty inventory table (will still fail, confirming it's a query planning issue not data issue)

**Expected Counterexamples**:
- Error: "ERROR: 42P17: functions in index expression must be marked IMMUTABLE"
- Possible causes: window function in UPDATE, unique index interaction, query planner behavior

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed migration script produces the expected behavior.

**Pseudocode:**
```
FOR ALL database_state WHERE isBugCondition(migration_script) DO
  result := execute_fixed_migration(database_state)
  ASSERT result.success = TRUE
  ASSERT result.error_message IS NULL
  ASSERT result.batch_numbers_assigned = TRUE
  ASSERT result.indexes_created = TRUE
  ASSERT result.views_created = TRUE
  ASSERT result.triggers_created = TRUE
END FOR
```

**Test Cases**:
1. **Empty Inventory Table**: Execute fixed script on empty table, verify all steps complete
2. **Existing Records Without Batches**: Execute on table with 10 items, verify batch numbers assigned
3. **Mixed Records**: Execute on table with some items having batch numbers, some NULL, verify only NULLs updated
4. **Large Dataset**: Execute on table with 1000+ items, verify performance and correctness

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed migration produces the same result as the original migration would have.

**Pseudocode:**
```
FOR ALL database_operation WHERE NOT isBugCondition(operation) DO
  ASSERT fixed_migration_result(operation) = original_migration_result(operation)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-migration operations

**Test Plan**: Create a test database with the fixed migration applied, then verify all normal operations work identically to expected behavior.

**Test Cases**:
1. **Data Preservation**: Verify all existing inventory records have identical data after migration
2. **Query Functionality**: Verify SELECT queries return same results as before
3. **Insert Operations**: Verify new inventory items can be inserted with/without batch numbers
4. **Update Operations**: Verify inventory updates work correctly
5. **View Queries**: Verify inventory_summary, expiring_inventory, expired_inventory views return correct data
6. **Trigger Behavior**: Verify status updates trigger correctly on stock/expiry changes

### Unit Tests

- Test the fixed Step 9 UPDATE statement in isolation with various data scenarios
- Test unique index constraints with duplicate name + batch + expiry combinations
- Test view queries return expected aggregated data
- Test trigger fires correctly on INSERT/UPDATE operations

### Property-Based Tests

- Generate random inventory datasets and verify migration completes successfully
- Generate random batch number patterns and verify uniqueness constraints work
- Test that all views return consistent data across many random scenarios
- Verify trigger behavior across many random stock/expiry date combinations

### Integration Tests

- Test full migration on production-like database with realistic data volume
- Test that the inventory UI can query and display batch-tracked items correctly
- Test that CSV import functionality works with the new batch tracking columns
- Test that expiring/expired item alerts work correctly with the new views
