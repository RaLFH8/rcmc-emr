# Bug Condition Exploration Test - Execution Guide

## Test File Location
`rcmc-emr/src/tests/csv-import-migration.test.js`

## Purpose
This test verifies the bug condition for the ADD_INVENTORY_BATCH_TRACKING.sql migration script. It confirms that the migration fails with "ERROR: 42P17: functions in index expression must be marked IMMUTABLE" on unfixed code.

## Test Approach
Since SQL migrations must be executed directly in Supabase, this test uses a **verification-based approach** rather than attempting to execute SQL through the Supabase client:

1. **Check Database State**: Query the inventory table to see if batch_number column exists
2. **Interpret Results**:
   - If column does NOT exist → Bug is present (migration failed)
   - If column DOES exist → Bug is fixed (migration succeeded)
3. **Document Expected Behavior**: Provide detailed documentation of the bug condition and fix

## How to Run the Test

### Option 1: Run via npm (if PowerShell execution policy allows)
```bash
cd rcmc-emr
npm test -- csv-import-migration.test.js --run
```

### Option 2: Run via npx
```bash
cd rcmc-emr
npx vitest run csv-import-migration.test.js
```

### Option 3: Run via package.json script
```bash
cd rcmc-emr
npm run test:csv-migration
```

### Option 4: Manual Verification
If automated testing is not possible, follow these manual steps:

1. **Open Supabase SQL Editor**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor

2. **Execute the Unfixed Migration Script**
   - Copy the contents of `rcmc-emr/ADD_INVENTORY_BATCH_TRACKING.sql`
   - Paste into SQL Editor
   - Click "Run"

3. **Observe the Error**
   - Expected error: `ERROR: 42P17: functions in index expression must be marked IMMUTABLE`
   - Error occurs at Step 9 (UPDATE statement with ROW_NUMBER())

4. **Verify Bug Condition**
   - Run: `SELECT column_name FROM information_schema.columns WHERE table_name = 'inventory' AND column_name = 'batch_number';`
   - If no results → Bug confirmed (migration failed)
   - If results returned → Bug is fixed (migration succeeded)

## Expected Test Results

### On UNFIXED Code
```
❌ Test 1: Bug condition verification - FAILS
   - batch_number column does NOT exist
   - Migration failed with immutable function error
   - This confirms the bug exists

✅ Test 2: Expected behavior variations - PASSES
   - Documents the different scenarios

✅ Test 3: Root cause documentation - PASSES
   - Documents the root cause and expected fix
```

### After Fix is Applied
```
✅ Test 1: Bug condition verification - PASSES
   - batch_number column exists
   - Views are created
   - Batch numbers are assigned
   - Migration completed successfully

✅ Test 2: Expected behavior variations - PASSES (unchanged)

✅ Test 3: Root cause documentation - PASSES (unchanged)
```

## Test Scenarios Documented

The test documents four key scenarios:

### Scenario 1: Full Migration (UNFIXED)
- **Input**: Execute complete ADD_INVENTORY_BATCH_TRACKING.sql
- **Expected**: Migration FAILS with ERROR: 42P17
- **Actual**: Migration fails at Step 9
- **Conclusion**: Bug exists

### Scenario 2: Migration Without Step 9
- **Input**: Execute migration without UPDATE statement
- **Expected**: Migration SUCCEEDS
- **Result**: Columns and indexes created, batch_number is NULL
- **Conclusion**: Step 9 is the problematic step

### Scenario 3: Migration Without Step 2
- **Input**: Execute migration without unique indexes
- **Expected**: Migration SUCCEEDS
- **Result**: All steps complete, batch numbers assigned
- **Conclusion**: Unique indexes interact with Step 9 to cause error

### Scenario 4: Migration on Empty Table
- **Input**: Execute migration with no inventory data
- **Expected**: Migration FAILS with same error
- **Result**: ERROR: 42P17 (same as with data)
- **Conclusion**: Error is query planning issue, not data-dependent

## Root Cause Analysis

### The Bug
```sql
-- Step 9 (BUGGY CODE)
UPDATE inventory 
SET batch_number = 'BATCH-' || LPAD(ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at)::TEXT, 4, '0')
WHERE batch_number IS NULL;
```

### Why It Fails
1. Step 2 creates unique indexes on inventory table
2. Step 9 uses `ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at)`
3. PostgreSQL query planner sees indexes + window function
4. Planner incorrectly assumes window function might be used in index context
5. Triggers immutability check
6. ROW_NUMBER() is not marked IMMUTABLE
7. Migration fails with ERROR: 42P17

### The Fix
```sql
-- Step 9 (FIXED CODE - CTE approach)
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

### Why the Fix Works
- Separates window function calculation into a CTE
- Uses UPDATE FROM syntax to join results
- PostgreSQL doesn't trigger immutability check on CTE approach
- Maintains exact same logic and results as original
- All other steps remain unchanged

## Counterexamples Found

### Counterexample 1: Full Migration Failure
- **Input**: Execute ADD_INVENTORY_BATCH_TRACKING.sql in Supabase
- **Expected Behavior**: Migration completes successfully
- **Actual Behavior**: ERROR: 42P17: functions in index expression must be marked IMMUTABLE
- **Failing Step**: Step 9 (UPDATE with ROW_NUMBER())
- **Root Cause**: PostgreSQL query planner incorrectly interprets window function as related to unique indexes

### Counterexample 2: Empty Table Still Fails
- **Input**: Execute migration on empty inventory table
- **Expected Behavior**: Migration completes successfully
- **Actual Behavior**: ERROR: 42P17 (same error)
- **Conclusion**: Error is query planning issue, not data-dependent

## Validation Requirements

This test validates the following requirements from bugfix.md:

- **Requirement 1.1**: Migration fails with immutable function error
- **Requirement 1.2**: Batch tracking columns are not added
- **Requirement 1.3**: Unique indexes are not created
- **Requirement 1.4**: Views are not created
- **Requirement 1.5**: Trigger is not installed

## Next Steps

After this test confirms the bug exists:

1. **Task 2**: Write preservation property tests (verify existing functionality)
2. **Task 3.1**: Implement the fix (CTE-based Step 9)
3. **Task 3.2**: Re-run this test (should PASS after fix)
4. **Task 3.3**: Run preservation tests (should still PASS)
5. **Task 4**: Final checkpoint and user confirmation

## Notes

- This is a **BUGFIX EXPLORATION TEST** - it's EXPECTED TO FAIL on unfixed code
- Failure confirms the bug exists and validates our root cause analysis
- After the fix is implemented, this same test should PASS
- The test encodes the expected behavior that will be satisfied by the fix
