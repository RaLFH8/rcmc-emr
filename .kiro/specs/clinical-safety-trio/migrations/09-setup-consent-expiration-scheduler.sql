-- Setup Consent Expiration Notification Scheduler
-- Requirements: 2.10
-- 
-- This migration sets up the pg_cron job to run the consent expiration notifier
-- Edge Function daily at 8:00 AM Philippine Time (00:00 UTC)

-- Schedule consent expiration check to run daily at 8:00 AM PHT (00:00 UTC)
SELECT cron.schedule(
  'consent-expiration-notifier',
  '0 0 * * *', -- Daily at 00:00 UTC (8:00 AM PHT)
  $$
  SELECT
    net.http_post(
      url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/consent-expiration-notifier',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);

-- Verify the scheduled job
SELECT * FROM cron.job WHERE jobname = 'consent-expiration-notifier';

-- To manually trigger the job for testing:
-- SELECT cron.unschedule('consent-expiration-notifier');
-- Then re-run the schedule command above

-- To view job run history:
-- SELECT * FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'consent-expiration-notifier') ORDER BY start_time DESC LIMIT 10;
