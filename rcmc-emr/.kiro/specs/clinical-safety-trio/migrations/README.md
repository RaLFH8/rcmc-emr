# Clinical Safety Trio - Database Migrations

This directory contains SQL migration scripts for the Clinical Safety Trio feature, which implements three critical clinical safety features:

1. **Automated Backup System** - Database backup logging and tracking
2. **Patient Consent Management** - Digital consent tracking with electronic signatures
3. **Emergency Access Override** - Break-glass emergency access with audit trails

## Migration Files

### 01-create-backup-logs.sql
Creates the `backup_logs` table for tracking all database backup operations.

**Includes:**
- `backup_logs` table with all required fields
- Indexes for status, created_at, backup_type, retention_until
- Trigger for automatic duration calculation
- Backup-related columns added to `audit_log` table
- RLS policies for admin-only access

**Requirements:** 1.10, 4.1

### Future Migrations
- `02-create-consent-records.sql` - Patient consent management schema
- `03-create-emergency-access-logs.sql` - Emergency access override schema
- `04-enhance-audit-log.sql` - Additional audit trail enhancements
- `05-create-triggers-and-functions.sql` - Supporting database functions
- `06-update-rls-policies.sql` - RLS policy updates for emergency access

## How to Run Migrations

### Option 1: Run Individual Migration (Recommended for Development)

1. Open Supabase Dashboard
2. Navigate to SQL Editor
3. Copy the contents of `01-create-backup-logs.sql`
4. Paste into SQL Editor
5. Click "Run" to execute

### Option 2: Run All Migrations (For Production)

Once all migration files are created, use the master script:

```bash
# This file will be created later
psql -f RUN_ALL_MIGRATIONS.sql
```

## Migration Order

**IMPORTANT:** Migrations must be run in numerical order:

1. `01-create-backup-logs.sql` ✓ (Ready to run)
2. `02-create-consent-records.sql` (Coming soon)
3. `03-create-emergency-access-logs.sql` (Coming soon)
4. `04-enhance-audit-log.sql` (Coming soon)
5. `05-create-triggers-and-functions.sql` (Coming soon)
6. `06-update-rls-policies.sql` (Coming soon)

## Prerequisites

Before running migrations, ensure:

1. ✓ `emr` schema exists in your database
2. ✓ `auth.users` table exists (Supabase Auth)
3. ✓ `emr.user_profiles` table exists with `role` column
4. ✓ `emr.audit_log` table exists
5. ✓ `uuid-ossp` extension is enabled (for uuid_generate_v4())

## Verification

After running each migration, verify success:

```sql
-- Check if backup_logs table exists
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'emr' 
  AND table_name = 'backup_logs'
);

-- Check indexes were created
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'emr' 
AND tablename = 'backup_logs';

-- Check trigger was created
SELECT trigger_name FROM information_schema.triggers
WHERE event_object_schema = 'emr'
AND event_object_table = 'backup_logs';

-- Check RLS policies
SELECT policyname FROM pg_policies
WHERE schemaname = 'emr'
AND tablename = 'backup_logs';
```

## Rollback

If you need to rollback the backup_logs migration:

```sql
-- Drop RLS policies
DROP POLICY IF EXISTS "Admins can view all backup logs" ON emr.backup_logs;
DROP POLICY IF EXISTS "Admins can create backup logs" ON emr.backup_logs;
DROP POLICY IF EXISTS "Admins can update backup logs" ON emr.backup_logs;

-- Drop trigger
DROP TRIGGER IF EXISTS calculate_backup_duration_trigger ON emr.backup_logs;

-- Drop function
DROP FUNCTION IF EXISTS emr.calculate_backup_duration();

-- Drop indexes (will be dropped automatically with table)
-- Drop table
DROP TABLE IF EXISTS emr.backup_logs CASCADE;

-- Remove audit_log columns (optional - may be used by other features)
-- ALTER TABLE emr.audit_log DROP COLUMN IF EXISTS backup_log_id;
-- ALTER TABLE emr.audit_log DROP COLUMN IF EXISTS operation_type;
```

## Testing

After running migrations, test the schema:

```sql
-- Test insert with automatic duration calculation
INSERT INTO emr.backup_logs (
  backup_filename,
  backup_type,
  file_size_bytes,
  start_time,
  end_time,
  status,
  storage_path,
  retention_until
) VALUES (
  'rcmc_emr_backup_2024-01-15_02-00-00.sql',
  'daily',
  50000000,
  NOW() - INTERVAL '10 minutes',
  NOW(),
  'success',
  'backups/2024-01-15/rcmc_emr_backup_2024-01-15_02-00-00.sql.gz',
  CURRENT_DATE + INTERVAL '30 days'
);

-- Verify duration was calculated automatically
SELECT 
  backup_filename,
  duration_seconds,
  EXTRACT(EPOCH FROM (end_time - start_time))::INTEGER as expected_duration
FROM emr.backup_logs
WHERE backup_filename = 'rcmc_emr_backup_2024-01-15_02-00-00.sql';

-- Clean up test data
DELETE FROM emr.backup_logs 
WHERE backup_filename = 'rcmc_emr_backup_2024-01-15_02-00-00.sql';
```

## Support

For issues or questions:
1. Check the design document: `../design.md`
2. Check the requirements document: `../requirements.md`
3. Check the task list: `../tasks.md`

## Database Schema Reference

### backup_logs Table Structure

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| backup_filename | TEXT | NOT NULL | Format: rcmc_emr_backup_YYYY-MM-DD_HH-MM-SS.sql |
| backup_type | TEXT | NOT NULL, CHECK | daily, weekly, monthly, manual |
| file_size_bytes | BIGINT | NOT NULL | Compressed file size |
| start_time | TIMESTAMPTZ | NOT NULL | Backup start timestamp |
| end_time | TIMESTAMPTZ | | Backup completion timestamp |
| duration_seconds | INTEGER | | Auto-calculated from end_time - start_time |
| status | TEXT | NOT NULL, CHECK | in_progress, success, failed |
| error_message | TEXT | | Error details if status = failed |
| storage_path | TEXT | NOT NULL | Path in Supabase Storage |
| compression_ratio | NUMERIC(5,2) | | Compression efficiency ratio |
| encrypted | BOOLEAN | DEFAULT true | AES-256 encryption flag |
| verified | BOOLEAN | DEFAULT false | Test restore verification flag |
| verification_date | TIMESTAMPTZ | | Date of last verification |
| retention_until | DATE | NOT NULL | Deletion date per retention policy |
| created_by | UUID | FK to auth.users | User who created backup |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |

### Indexes

- `idx_backup_logs_status` - Filter by status
- `idx_backup_logs_created_at` - Sort by date (DESC)
- `idx_backup_logs_backup_type` - Filter by type
- `idx_backup_logs_retention` - Retention policy queries

### Triggers

- `calculate_backup_duration_trigger` - Auto-calculates duration_seconds

### RLS Policies

- Admins can view all backup logs (SELECT)
- Admins can create backup logs (INSERT)
- Admins can update backup logs (UPDATE)
