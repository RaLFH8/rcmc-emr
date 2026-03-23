# Schema Issue Fixed - Ready to Run

## What Was Wrong

All migration SQL files were using `emr.` schema prefix (e.g., `emr.consultations`, `emr.billing_queue`), but your database uses the **public schema** (no prefix).

## What Was Fixed

Updated all 6 migration files to remove `emr.` prefix and use public schema:

1. `01-add-consultation-status.sql` - Fixed consultations table references
2. `02-create-billing-queue-table.sql` - Fixed all table references and RLS policies
3. `03-add-billing-consultation-reference.sql` - Fixed billing table references
4. `04-create-billing-queue-trigger.sql` - Fixed trigger and function references
5. `05-create-release-stale-locks-function.sql` - Fixed function references
6. `RUN_ALL_MIGRATIONS.sql` - Fixed consolidated migration file

## Changes Made

### Before (WRONG):
```sql
ALTER TABLE emr.consultations ADD COLUMN status TEXT;
CREATE TABLE emr.billing_queue (...);
CREATE FUNCTION emr.create_billing_queue_entry() ...
```

### After (CORRECT):
```sql
ALTER TABLE consultations ADD COLUMN status TEXT;
CREATE TABLE billing_queue (...);
CREATE FUNCTION create_billing_queue_entry() ...
```

## Next Steps

1. **Open Supabase SQL Editor**
2. **Copy and paste** the contents of `RUN_ALL_MIGRATIONS.sql`
3. **Click "Run"**
4. **Verify** the migrations completed successfully

The migrations will:
- Add status tracking to consultations table (status, completed_at, completed_by)
- Create billing_queue table with RLS policies
- Add consultation reference to billing table
- Create trigger to auto-populate billing queue
- Create function to release stale locks

After successful migration, we'll proceed with Task 3 (BillingQueueContext implementation).
