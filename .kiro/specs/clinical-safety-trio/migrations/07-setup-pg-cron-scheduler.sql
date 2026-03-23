-- ============================================================================
-- Clinical Safety Trio: pg_cron Scheduler Setup for Daily Backups
-- ============================================================================
-- 
-- This script configures pg_cron to schedule automated daily backups
-- at 2:00 AM Philippine Time (UTC+8)
--
-- Requirements: 1.1 (Automated daily backups at 2:00 AM PHT)
--
-- IMPORTANT NOTES:
-- 1. pg_cron extension may NOT be available in Supabase free tier
-- 2. Check if pg_cron is available before running this script
-- 3. Alternative scheduling options are provided in the documentation
-- 4. This script requires SUPERUSER privileges or pg_cron permissions
--
-- ============================================================================

-- ============================================================================
-- STEP 1: Check if pg_cron is available
-- ============================================================================

-- Run this query first to check if pg_cron is available:
SELECT * FROM pg_available_extensions WHERE name = 'pg_cron';

-- If the query returns no rows, pg_cron is NOT available on your Supabase instance
-- In that case, skip to the "Alternative Scheduling Options" section below

-- ============================================================================
-- STEP 2: Enable pg_cron extension (if available)
-- ============================================================================

-- Enable the pg_cron extension
-- Note: This requires SUPERUSER privileges
-- On Supabase, you may need to request this from support
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Verify extension is enabled
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- ============================================================================
-- STEP 3: Configure service role key for cron jobs
-- ============================================================================

-- Store the service role key in a secure configuration
-- This is needed for the cron job to authenticate with the Edge Function
-- 
-- SECURITY WARNING: Never expose the service role key in client-side code!
-- 
-- You'll need to set this using Supabase Dashboard:
-- Settings → Database → Custom Postgres Configuration
-- Add: app.settings.service_role_key = 'your-service-role-key'

-- ============================================================================
-- STEP 4: Schedule daily backup at 2:00 AM Philippine Time
-- ============================================================================

-- Philippine Time is UTC+8
-- 2:00 AM PHT = 18:00 UTC (6:00 PM UTC previous day)
-- Cron format: minute hour day month weekday

-- Schedule daily backup
SELECT cron.schedule(
  'rcmc-emr-daily-backup',           -- Job name
  '0 18 * * *',                       -- Schedule: 18:00 UTC = 2:00 AM PHT
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/backup-scheduler',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object('backupType', 'daily')
    );
  $$
);

-- ============================================================================
-- STEP 5: Schedule weekly backup (Optional - Sundays at 3:00 AM PHT)
-- ============================================================================

-- 3:00 AM PHT Sunday = 19:00 UTC Saturday
SELECT cron.schedule(
  'rcmc-emr-weekly-backup',
  '0 19 * * 6',                       -- Schedule: 19:00 UTC Saturday = 3:00 AM PHT Sunday
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/backup-scheduler',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object('backupType', 'weekly')
    );
  $$
);

-- ============================================================================
-- STEP 6: Schedule monthly backup (Optional - 1st of month at 4:00 AM PHT)
-- ============================================================================

-- 4:00 AM PHT 1st of month = 20:00 UTC last day of previous month
SELECT cron.schedule(
  'rcmc-emr-monthly-backup',
  '0 20 L * *',                       -- Schedule: 20:00 UTC last day of month = 4:00 AM PHT 1st
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/backup-scheduler',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object('backupType', 'monthly')
    );
  $$
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- View all scheduled cron jobs
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job
WHERE jobname LIKE 'rcmc-emr%'
ORDER BY jobname;

-- View recent cron job executions
SELECT 
  j.jobname,
  r.runid,
  r.job_pid,
  r.status,
  r.return_message,
  r.start_time,
  r.end_time,
  EXTRACT(EPOCH FROM (r.end_time - r.start_time)) as duration_seconds
FROM cron.job_run_details r
JOIN cron.job j ON j.jobid = r.jobid
WHERE j.jobname LIKE 'rcmc-emr%'
ORDER BY r.start_time DESC
LIMIT 20;

-- Check next scheduled run time
SELECT 
  jobname,
  schedule,
  -- Calculate next run time (approximate)
  CASE 
    WHEN schedule = '0 18 * * *' THEN 
      (CURRENT_DATE + INTERVAL '1 day' + TIME '18:00:00')::timestamp
    WHEN schedule = '0 19 * * 6' THEN
      (CURRENT_DATE + ((6 - EXTRACT(DOW FROM CURRENT_DATE))::int % 7) * INTERVAL '1 day' + TIME '19:00:00')::timestamp
    ELSE NULL
  END as next_run_utc,
  CASE 
    WHEN schedule = '0 18 * * *' THEN 
      (CURRENT_DATE + INTERVAL '1 day' + TIME '18:00:00' + INTERVAL '8 hours')::timestamp
    WHEN schedule = '0 19 * * 6' THEN
      (CURRENT_DATE + ((6 - EXTRACT(DOW FROM CURRENT_DATE))::int % 7) * INTERVAL '1 day' + TIME '19:00:00' + INTERVAL '8 hours')::timestamp
    ELSE NULL
  END as next_run_pht
FROM cron.job
WHERE jobname LIKE 'rcmc-emr%';

-- ============================================================================
-- MANAGEMENT COMMANDS
-- ============================================================================

-- Disable a scheduled job (without deleting it)
-- SELECT cron.alter_job(
--   job_id := (SELECT jobid FROM cron.job WHERE jobname = 'rcmc-emr-daily-backup'),
--   schedule := NULL
-- );

-- Re-enable a disabled job
-- SELECT cron.alter_job(
--   job_id := (SELECT jobid FROM cron.job WHERE jobname = 'rcmc-emr-daily-backup'),
--   schedule := '0 18 * * *'
-- );

-- Change schedule time
-- SELECT cron.alter_job(
--   job_id := (SELECT jobid FROM cron.job WHERE jobname = 'rcmc-emr-daily-backup'),
--   schedule := '0 20 * * *'  -- New time: 20:00 UTC = 4:00 AM PHT
-- );

-- Delete a scheduled job
-- SELECT cron.unschedule('rcmc-emr-daily-backup');

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================

-- Check if pg_cron extension is enabled
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- Check if cron schema exists
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'cron';

-- View all cron jobs (not just RCMC EMR)
SELECT * FROM cron.job ORDER BY jobname;

-- View failed job executions
SELECT 
  j.jobname,
  r.status,
  r.return_message,
  r.start_time
FROM cron.job_run_details r
JOIN cron.job j ON j.jobid = r.jobid
WHERE r.status = 'failed'
  AND j.jobname LIKE 'rcmc-emr%'
ORDER BY r.start_time DESC
LIMIT 10;

-- Test the backup Edge Function manually
-- (Run this in a separate SQL client or use curl)
-- SELECT
--   net.http_post(
--     url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/backup-scheduler',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
--     ),
--     body := jsonb_build_object('backupType', 'manual')
--   );

-- ============================================================================
-- ALTERNATIVE SCHEDULING OPTIONS (if pg_cron is not available)
-- ============================================================================

-- If pg_cron is NOT available in your Supabase tier, consider these alternatives:
--
-- OPTION 1: Supabase Built-in Backups
-- - Navigate to: Supabase Dashboard → Database → Backups
-- - Enable automatic daily backups
-- - Configure retention period
-- - Limitation: Less control over backup format and encryption
--
-- OPTION 2: External Cron Job (Recommended for production)
-- - Set up a cron job on a server you control
-- - Use curl to call the backup-scheduler Edge Function
-- - Example crontab entry:
--   0 18 * * * curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/backup-scheduler \
--     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
--     -H "Content-Type: application/json" \
--     -d '{"backupType": "daily"}' >> /var/log/rcmc-backup.log 2>&1
--
-- OPTION 3: GitHub Actions (Free for public repos)
-- - Create a GitHub Actions workflow that runs on schedule
-- - Use the workflow to call the backup-scheduler Edge Function
-- - See: .github/workflows/backup-scheduler.yml (to be created)
--
-- OPTION 4: Cloud Scheduler Services
-- - AWS EventBridge
-- - Google Cloud Scheduler
-- - Azure Logic Apps
-- - These services can trigger HTTP endpoints on schedule
--
-- OPTION 5: Supabase Database Webhooks (if available)
-- - Configure a webhook to trigger at specific times
-- - Call the backup-scheduler Edge Function
--
-- See the accompanying documentation for detailed setup instructions for each option.

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. Replace 'YOUR_PROJECT_REF' with your actual Supabase project reference
-- 2. Ensure the service role key is securely stored and never exposed
-- 3. Monitor the backup_logs table to verify backups are running successfully
-- 4. Test the scheduled jobs after setup to ensure they work correctly
-- 5. Set up monitoring/alerting for backup failures
-- 6. Document the backup schedule and retention policy for your team
-- 7. Regularly test disaster recovery procedures

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
