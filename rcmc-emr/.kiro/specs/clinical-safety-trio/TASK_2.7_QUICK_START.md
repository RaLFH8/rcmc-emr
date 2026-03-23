# Task 2.7: Backup Scheduler Quick Start

## What Was Created

This task provides **multiple options** for scheduling automated daily backups at 2:00 AM Philippine Time (UTC+8).

### Files Created

1. **`migrations/07-setup-pg-cron-scheduler.sql`**
   - SQL script for pg_cron setup (if available in your Supabase tier)
   - Includes verification queries and troubleshooting commands
   - Provides alternative scheduling options

2. **`BACKUP_SCHEDULER_SETUP_GUIDE.md`**
   - Comprehensive guide covering 5 different scheduling options
   - Comparison table to help choose the best option
   - Detailed setup instructions for each option
   - Testing and monitoring procedures

3. **`.github/workflows/backup-scheduler.yml`**
   - GitHub Actions workflow for automated backups
   - Runs daily, weekly, and monthly backups
   - Includes manual trigger option
   - Free for public repos, 2000 minutes/month for private repos

## Quick Decision Guide

### Are you on Supabase Free Tier? (Current)

**YES** → Use **GitHub Actions** (Option 3) or **External Cron** (Option 2)

**Reason:** pg_cron is NOT available in free tier

### Are you on Supabase Pro Tier or higher?

**YES** → Use **pg_cron** (Option 1)

**Reason:** Native PostgreSQL scheduling, most reliable

## Recommended Setup (Free Tier)

### Option A: GitHub Actions (Easiest)

**Time to setup:** 5 minutes

1. **Add secrets to GitHub repository:**
   - Go to: Repository → Settings → Secrets and variables → Actions
   - Add `SUPABASE_URL`: `https://YOUR_PROJECT_REF.supabase.co`
   - Add `SUPABASE_SERVICE_ROLE_KEY`: Your service role key

2. **Commit the workflow file:**
   ```bash
   git add .github/workflows/backup-scheduler.yml
   git commit -m "Add automated backup scheduler"
   git push
   ```

3. **Test the workflow:**
   - Go to: Actions tab in GitHub
   - Click "RCMC EMR Daily Backup"
   - Click "Run workflow" → Select "manual" → Run
   - Wait for completion (should take 1-2 minutes)

4. **Verify backup was created:**
   ```sql
   -- Run in Supabase SQL Editor
   SELECT backup_filename, status, file_size_bytes / 1024 / 1024 as size_mb, created_at
   FROM backup_logs
   ORDER BY created_at DESC
   LIMIT 1;
   ```

**Done!** Backups will now run automatically every day at 2:00 AM PHT.

### Option B: External Cron Job (More Control)

**Time to setup:** 15 minutes

**Requirements:** A server with cron (Linux/macOS) or Task Scheduler (Windows)

1. **Follow the detailed instructions in:**
   - `BACKUP_SCHEDULER_SETUP_GUIDE.md` → Option 2: External Cron Job

2. **Key steps:**
   - Create backup script with your Supabase credentials
   - Add to crontab: `0 18 * * * /path/to/backup-script.sh`
   - Test manually: `/path/to/backup-script.sh`
   - Verify in database

## Testing Your Setup

### 1. Manual Backup Test

```bash
curl -X POST \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/backup-scheduler \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"backupType": "manual"}'
```

**Expected response:**
```json
{
  "backupId": "uuid-here",
  "filename": "rcmc_emr_backup_2024-01-15_14-30-00.sql",
  "fileSize": 1234567,
  "startTime": "2024-01-15T14:30:00.000Z",
  "endTime": "2024-01-15T14:30:45.000Z",
  "status": "success"
}
```

### 2. Verify in Database

```sql
-- Check recent backups
SELECT 
  backup_filename,
  backup_type,
  file_size_bytes / 1024 / 1024 as size_mb,
  duration_seconds,
  status,
  compression_ratio,
  encrypted,
  created_at
FROM backup_logs
ORDER BY created_at DESC
LIMIT 5;
```

### 3. Verify in Storage

```sql
-- Check storage objects
SELECT 
  name,
  (metadata->>'size')::bigint / 1024 / 1024 as size_mb,
  created_at
FROM storage.objects
WHERE bucket_id = 'database-backups'
ORDER BY created_at DESC
LIMIT 5;
```

## Monitoring

### Check Backup Health

```sql
-- Success rate (last 7 days)
SELECT 
  COUNT(*) FILTER (WHERE status = 'success') * 100.0 / COUNT(*) as success_rate,
  COUNT(*) FILTER (WHERE status = 'success') as successful,
  COUNT(*) FILTER (WHERE status = 'failed') as failed
FROM backup_logs
WHERE created_at >= NOW() - INTERVAL '7 days';
```

**Target:** 99%+ success rate

### Check Last Backup

```sql
-- Hours since last successful backup
SELECT 
  backup_filename,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 as hours_ago
FROM backup_logs
WHERE status = 'success'
ORDER BY created_at DESC
LIMIT 1;
```

**Alert if:** > 25 hours (missed daily backup)

## Troubleshooting

### Backup Not Running

1. **GitHub Actions:**
   - Check Actions tab for workflow runs
   - Verify secrets are set correctly
   - Check workflow file syntax

2. **External Cron:**
   - Check crontab: `crontab -l`
   - Check log file for errors
   - Test script manually

3. **All Options:**
   - Test manual backup with curl
   - Check Edge Function logs in Supabase Dashboard
   - Verify environment variables are set

### Backup Failing

1. **Check Edge Function logs:**
   - Supabase Dashboard → Edge Functions → backup-scheduler → Logs

2. **Check error in database:**
   ```sql
   SELECT backup_filename, error_message, created_at
   FROM backup_logs
   WHERE status = 'failed'
   ORDER BY created_at DESC
   LIMIT 5;
   ```

3. **Common issues:**
   - Missing environment variables
   - Storage bucket doesn't exist
   - Service role key incorrect
   - Database connection failed

## Important Notes

### pg_cron Limitation

⚠️ **pg_cron is NOT available in Supabase free tier**

The SQL script `07-setup-pg-cron-scheduler.sql` is provided for completeness, but it will **not work** on free tier. Use GitHub Actions or External Cron instead.

### Storage Limits

- **Free tier:** 500 MB total storage
- **Current usage:** ~37 MB database
- **Available:** ~463 MB for backups
- **Estimated capacity:** 15-20 daily backups (depending on compression)

**Recommendation:** Monitor storage usage and adjust retention policy if needed.

### Backup Encryption

All backups are encrypted with AES-256-CBC using the `BACKUP_ENCRYPTION_KEY` environment variable.

⚠️ **Keep this key secure!** If lost, backups cannot be decrypted.

## Next Steps

1. ✅ Choose your scheduling option (GitHub Actions recommended for free tier)
2. ✅ Follow setup instructions
3. ✅ Test with manual backup
4. ✅ Verify backup was created successfully
5. ✅ Monitor backup health daily
6. ⏭️ Continue to Task 2.8: Create disaster recovery documentation

## Support

For detailed information, see:
- **`BACKUP_SCHEDULER_SETUP_GUIDE.md`** - Complete setup guide for all options
- **`supabase/functions/backup-scheduler/README.md`** - Edge Function documentation
- **`migrations/07-setup-pg-cron-scheduler.sql`** - pg_cron setup script

## Requirements Validation

✅ **Requirement 1.1:** Automated daily backups at 2:00 AM Philippine Time

Multiple scheduling options provided to ensure compatibility with all Supabase tiers:
- pg_cron (Pro tier+)
- External Cron (Free tier)
- GitHub Actions (Free tier)
- Cloud Schedulers (AWS, Google, Azure)
- Supabase Built-in Backups (All tiers)
