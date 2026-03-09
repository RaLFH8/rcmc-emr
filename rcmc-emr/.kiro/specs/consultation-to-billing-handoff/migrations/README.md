# Database Migrations - Consultation to Billing Handoff

## Overview

This directory contains all database migrations for the consultation-to-billing-handoff feature. These migrations set up the necessary database schema, triggers, and functions to automate the transfer of patients from consultations to billing.

## Quick Start

**Run this single file in your Supabase SQL Editor:**

```
RUN_ALL_MIGRATIONS.sql
```

This file contains all 5 migrations in the correct order.

## Individual Migration Files

If you prefer to run migrations individually:

1. `01-add-consultation-status.sql` - Adds status tracking to consultations table
2. `02-create-billing-queue-table.sql` - Creates billing_queue table with RLS policies
3. `03-add-billing-consultation-reference.sql` - Adds consultation reference to billing table
4. `04-create-billing-queue-trigger.sql` - Creates automatic billing queue entry trigger
5. `05-create-release-stale-locks-function.sql` - Creates stale lock release function

## What Gets Created

### Tables Modified
- `emr.consultations` - Adds status, completed_at, completed_by columns
- `emr.billing` - Adds consultation_id, billed_at, billed_by columns

### Tables Created
- `emr.billing_queue` - New table to track patients awaiting billing

### Functions Created
- `emr.create_billing_queue_entry()` - Trigger function to auto-populate billing queue
- `emr.release_stale_billing_locks()` - Function to clear locks older than 5 minutes

### Triggers Created
- `trigger_create_billing_queue` - Fires when consultation status changes to 'pending_billing'

### Indexes Created
- `idx_consultations_status` - Index on consultations.status
- `idx_consultations_completed_at` - Index on consultations.completed_at
- `idx_billing_queue_patient` - Index on billing_queue.patient_id
- `idx_billing_queue_completed_at` - Index on billing_queue.completed_at
- `idx_billing_queue_processing` - Index on billing_queue.processing_by
- `idx_billing_consultation` - Index on billing.consultation_id

## How to Run

1. Open your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `RUN_ALL_MIGRATIONS.sql`
4. Click "Run" to execute all migrations
5. Verify the output shows successful creation of all objects

## Verification

After running the migrations, the verification queries at the end of `RUN_ALL_MIGRATIONS.sql` will show:

- Consultations table has new columns (status, completed_at, completed_by)
- Billing_queue table exists with all required columns
- Billing table has new columns (consultation_id, billed_at, billed_by)
- Trigger `trigger_create_billing_queue` exists
- Function `release_stale_billing_locks` returns 0 (no stale locks initially)

## Testing the Trigger

To test that the trigger works correctly:

```sql
-- Create a test consultation (if you don't have one)
INSERT INTO emr.consultations (
  patient_id, 
  doctor_id, 
  consultation_date, 
  chief_complaint, 
  diagnosis
) VALUES (
  'your-patient-id',
  'your-doctor-id',
  NOW(),
  'Test complaint',
  'Test diagnosis'
) RETURNING id;

-- Update the consultation status to trigger billing queue entry
UPDATE emr.consultations
SET status = 'pending_billing',
    completed_at = NOW(),
    completed_by = auth.uid()
WHERE id = 'your-consultation-id';

-- Verify billing queue entry was created
SELECT * FROM emr.billing_queue 
WHERE consultation_id = 'your-consultation-id';
```

## Rollback

If you need to rollback these migrations:

```sql
-- Drop trigger and functions
DROP TRIGGER IF EXISTS trigger_create_billing_queue ON emr.consultations;
DROP FUNCTION IF EXISTS emr.create_billing_queue_entry();
DROP FUNCTION IF EXISTS emr.release_stale_billing_locks();

-- Drop billing_queue table
DROP TABLE IF EXISTS emr.billing_queue;

-- Remove columns from billing table
ALTER TABLE emr.billing DROP COLUMN IF EXISTS consultation_id;
ALTER TABLE emr.billing DROP COLUMN IF EXISTS billed_at;
ALTER TABLE emr.billing DROP COLUMN IF EXISTS billed_by;

-- Remove columns from consultations table
ALTER TABLE emr.consultations DROP COLUMN IF EXISTS status;
ALTER TABLE emr.consultations DROP COLUMN IF EXISTS completed_at;
ALTER TABLE emr.consultations DROP COLUMN IF EXISTS completed_by;
```

## Next Steps

After successfully running these migrations:

1. ✅ Task 1 (Database migrations) - COMPLETE
2. ⏭️ Task 2 (Checkpoint) - Verify migrations worked
3. ⏭️ Task 3 (BillingQueueContext) - Create React context with real-time subscriptions
4. ⏭️ Task 4 (BillingQueue component) - Create UI component
5. ⏭️ Task 5 (Consultations page) - Add "Complete Consultation" button
6. ⏭️ Task 7 (Billing page) - Integrate billing queue

## Support

If you encounter any issues:

1. Check that the `emr` schema exists
2. Verify that `consultations`, `patients`, `doctors`, and `billing` tables exist
3. Ensure you have proper permissions to create tables and functions
4. Check Supabase logs for detailed error messages
