# Backup Verifier Edge Function

## Overview

The Backup Verifier is a Supabase Edge Function that performs weekly verification of database backups by:
1. Selecting an unverified backup from the past week
2. Creating a temporary isolated test database
3. Downloading, decrypting, and decompressing the backup
4. Restoring the backup to the temporary database
5. Verifying data integrity (table counts, constraints, key tables)
6. Cleaning up the temporary database
7. Logging the verification result

This ensures that backups are valid and can be successfully restored in a disaster recovery scenario.

## Requirements

**Validates:** Requirement 1.5 - Weekly backup verification with test restore

## Configuration

The function uses the following environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for storage access)
- `BACKUP_ENCRYPTION_KEY` - Encryption key for backup files (must match backup-scheduler)

## Configuration Options

```typescript
const config = {
  maxBackupAge: 7,                    // Maximum age in days for backup selection
  tempDatabasePrefix: 'backup_verify_', // Prefix for temporary test databases
  verificationTimeout: 3600,          // Timeout in seconds (1 hour)
};
```

## Deployment

### Deploy to Supabase

```bash
# Deploy the function
supabase functions deploy backup-verifier

# Set environment variables
supabase secrets set DATABASE_URL="postgresql://..."
supabase secrets set BACKUP_ENCRYPTION_KEY="your-encryption-key"
```

### Schedule Weekly Execution

The function should be scheduled to run weekly using pg_cron or an external scheduler:

```sql
-- Using pg_cron (if available)
SELECT cron.schedule(
  'weekly-backup-verification',
  '0 3 * * 0', -- Every Sunday at 3:00 AM
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/backup-verifier',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

Alternatively, use an external cron service (e.g., GitHub Actions, cron-job.org) to trigger the function weekly.

## API

### Endpoint

```
POST https://your-project.supabase.co/functions/v1/backup-verifier
```

### Request

No request body required. The function automatically selects the most recent unverified backup.

### Response

**Success (200):**
```json
{
  "verificationId": "uuid",
  "backupId": "uuid",
  "backupFilename": "rcmc_emr_backup_2025-01-15_02-00-00.sql",
  "testDatabaseName": "backup_verify_1736899200_abc123",
  "restoreSuccessful": true,
  "dataIntegrityCheck": true,
  "verificationTime": "2025-01-15T03:00:00.000Z",
  "tablesVerified": 25,
  "constraintsVerified": 48
}
```

**Failure (500):**
```json
{
  "verificationId": "",
  "backupId": "uuid",
  "backupFilename": "rcmc_emr_backup_2025-01-15_02-00-00.sql",
  "testDatabaseName": "backup_verify_1736899200_abc123",
  "restoreSuccessful": false,
  "dataIntegrityCheck": false,
  "verificationTime": "2025-01-15T03:00:00.000Z",
  "errorDetails": "Failed to restore backup: ..."
}
```

## Verification Process

### 1. Backup Selection

The function selects backups using the following criteria:
- Status: `success`
- Verified: `false` (prioritizes unverified backups)
- Age: Within the past 7 days
- Order: Most recent first

If no unverified backups are found, it selects the most recent verified backup for re-verification.

### 2. Temporary Database Creation

Creates a uniquely named temporary database:
```
backup_verify_{timestamp}_{random_suffix}
```

Example: `backup_verify_1736899200_abc123`

### 3. Backup Restoration

- Downloads encrypted backup from Supabase Storage
- Decrypts using AES-256-CBC (same key as backup-scheduler)
- Decompresses using gunzip
- Restores to temporary database using `psql`

### 4. Data Integrity Checks

Verifies the following:
- **Table Count**: Ensures tables exist in the restored database
- **Constraint Count**: Verifies primary keys, foreign keys, unique constraints, and check constraints
- **Key Tables**: Confirms critical tables exist:
  - `patients`
  - `consultations`
  - `prescriptions`
  - `appointments`
  - `billing`

### 5. Cleanup

Drops the temporary database after verification (success or failure).

### 6. Logging

Updates the `backup_logs` table:
- Sets `verified` to `true` if verification passed
- Sets `verification_date` to the verification timestamp

Creates an audit log entry with:
- `operation_type`: `backup_verified` or `backup_verification_failed`
- `backup_log_id`: Reference to the verified backup
- `new_data`: Verification details (tables verified, constraints verified, errors)

## Error Handling

### Common Errors

**No suitable backup found:**
- Cause: No successful backups in the past 7 days
- Resolution: Ensure backup-scheduler is running daily

**Failed to create temporary database:**
- Cause: Insufficient database permissions or connection issues
- Resolution: Verify DATABASE_URL and PostgreSQL user permissions

**Failed to download backup:**
- Cause: Storage path incorrect or file deleted
- Resolution: Check Supabase Storage bucket and file existence

**Decryption failed:**
- Cause: Incorrect BACKUP_ENCRYPTION_KEY
- Resolution: Ensure encryption key matches backup-scheduler

**Restore failed:**
- Cause: Corrupted backup or incompatible SQL
- Resolution: Review backup file integrity, check backup-scheduler logs

**Data integrity check failed:**
- Cause: Missing tables or constraints in restored database
- Resolution: Investigate backup creation process, verify source database schema

### Error Recovery

- Temporary databases are always cleaned up, even on failure
- Failed verifications are logged to `backup_logs` and `audit_log`
- Errors include detailed messages for troubleshooting
- Function returns 500 status on failure (for monitoring/alerting)

## Monitoring

### Check Verification Status

```sql
-- View recent verification results
SELECT 
  backup_filename,
  verified,
  verification_date,
  status,
  created_at
FROM backup_logs
WHERE verification_date IS NOT NULL
ORDER BY verification_date DESC
LIMIT 10;
```

### Check Failed Verifications

```sql
-- View failed verifications
SELECT 
  backup_filename,
  verification_date,
  error_message
FROM backup_logs
WHERE verified = false
AND verification_date IS NOT NULL
ORDER BY verification_date DESC;
```

### Audit Trail

```sql
-- View verification audit trail
SELECT 
  operation_type,
  new_data,
  created_at
FROM audit_log
WHERE operation_type IN ('backup_verified', 'backup_verification_failed')
ORDER BY created_at DESC
LIMIT 10;
```

## Testing

### Manual Trigger

```bash
# Trigger verification manually
curl -X POST \
  https://your-project.supabase.co/functions/v1/backup-verifier \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

### Test Verification Process

1. Ensure at least one successful backup exists (run backup-scheduler)
2. Trigger backup-verifier manually
3. Check logs for verification progress
4. Verify `backup_logs` table updated with `verified = true`
5. Check `audit_log` for verification entry

## Dependencies

- PostgreSQL client tools (`psql`, `pg_dump`)
- Supabase Storage (for backup file storage)
- Supabase Database (for backup_logs and audit_log tables)

## Security Considerations

- Uses service role key for storage access (keep secure)
- Encryption key must match backup-scheduler (store securely)
- Temporary databases are isolated and cleaned up immediately
- All operations logged to audit trail
- No sensitive data exposed in logs or responses

## Performance

- Verification time depends on backup size (typically 5-15 minutes)
- Temporary database creation is fast (<1 second)
- Restoration time scales with backup size
- Cleanup is immediate (<1 second)
- Recommended to run during off-peak hours (e.g., Sunday 3 AM)

## Troubleshooting

### Verification takes too long

- Check backup file size (large backups take longer)
- Verify database server performance
- Consider increasing `verificationTimeout` config

### Temporary database not cleaned up

- Check PostgreSQL logs for errors
- Manually drop orphaned databases:
  ```sql
  DROP DATABASE IF EXISTS backup_verify_1736899200_abc123;
  ```

### Verification always fails

- Verify backup-scheduler is creating valid backups
- Check encryption key matches between functions
- Test manual restore to verify backup integrity
- Review PostgreSQL logs for restore errors

## Related Functions

- **backup-scheduler**: Creates daily backups (must run before verification)
- **backup-logs table**: Stores backup and verification metadata
- **audit_log table**: Records all verification events

## Support

For issues or questions:
1. Check function logs in Supabase Dashboard
2. Review PostgreSQL logs for database errors
3. Verify environment variables are set correctly
4. Test backup-scheduler first to ensure valid backups exist
