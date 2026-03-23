-- =====================================================
-- Clinical Safety Trio: Emergency Access Expiration Scheduler
-- Setup pg_cron job to run hourly
-- =====================================================

-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage on cron schema to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;

-- =====================================================
-- Schedule Emergency Access Expiration Check
-- Runs every hour to revoke expired sessions
-- =====================================================

-- Remove existing job if it exists
SELECT cron.unschedule('emergency-access-expiration-check');

-- Schedule new job to run every hour
SELECT cron.schedule(
  'emergency-access-expiration-check',
  '0 * * * *', -- Every hour at minute 0
  $
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/emergency-access-expiration',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
    ) as request_id;
  $
);

-- =====================================================
-- Alternative: Direct SQL-based expiration (no Edge Function)
-- Use this if Edge Functions are not available
-- =====================================================

-- Create function to revoke expired access
CREATE OR REPLACE FUNCTION emr.revoke_expired_emergency_access()
RETURNS TABLE(revoked_count INTEGER) AS $
DECLARE
  v_revoked_count INTEGER := 0;
  v_session RECORD;
BEGIN
  -- Find and revoke expired sessions
  FOR v_session IN
    SELECT id, user_id, patient_id, access_granted_at, access_expires_at
    FROM emr.emergency_access_logs
    WHERE access_revoked_at IS NULL
    AND access_expires_at < NOW()
  LOOP
    -- Update session to mark as revoked
    UPDATE emr.emergency_access_logs
    SET 
      access_revoked_at = NOW(),
      revocation_reason = 'Automatic expiration after 24 hours'
    WHERE id = v_session.id;
    
    -- Log to audit trail
    INSERT INTO emr.audit_log (
      user_id,
      action,
      table_name,
      record_id,
      operation_type,
      emergency_access_log_id,
      new_data
    ) VALUES (
      v_session.user_id,
      'emergency_access_expired',
      'emergency_access_logs',
      v_session.id,
      'emergency_access_expired',
      v_session.id,
      jsonb_build_object(
        'patient_id', v_session.patient_id,
        'access_granted_at', v_session.access_granted_at,
        'access_expires_at', v_session.access_expires_at,
        'access_revoked_at', NOW(),
        'revocation_reason', 'Automatic expiration after 24 hours'
      )
    );
    
    v_revoked_count := v_revoked_count + 1;
  END LOOP;
  
  RETURN QUERY SELECT v_revoked_count;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule SQL-based expiration check (alternative to Edge Function)
SELECT cron.schedule(
  'emergency-access-expiration-sql',
  '0 * * * *', -- Every hour at minute 0
  $
  SELECT emr.revoke_expired_emergency_access();
  $
);

-- =====================================================
-- Verification and Monitoring
-- =====================================================

-- View scheduled jobs
SELECT * FROM cron.job WHERE jobname LIKE '%emergency%';

-- View job run history
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid IN (
  SELECT jobid FROM cron.job WHERE jobname LIKE '%emergency%'
)
ORDER BY start_time DESC
LIMIT 10;

-- Manual test: Revoke expired sessions now
SELECT emr.revoke_expired_emergency_access();

-- =====================================================
-- SETUP INSTRUCTIONS
-- =====================================================

-- 1. If using Edge Function approach:
--    - Deploy the emergency-access-expiration Edge Function
--    - Update the URL in the cron job above with your project ref
--    - Set the service_role_key in app.settings
--    - Enable the 'emergency-access-expiration-check' job

-- 2. If using SQL-based approach:
--    - Enable the 'emergency-access-expiration-sql' job
--    - Monitor via cron.job_run_details

-- 3. To disable a job:
--    SELECT cron.unschedule('job-name');

-- 4. To manually trigger expiration check:
--    SELECT emr.revoke_expired_emergency_access();

-- Success message
DO $
BEGIN
  RAISE NOTICE '✅ Emergency access expiration scheduler configured';
  RAISE NOTICE '⏰ Runs every hour to revoke expired sessions';
  RAISE NOTICE '📋 Two options available: Edge Function or SQL-based';
  RAISE NOTICE '🔍 Monitor via: SELECT * FROM cron.job_run_details';
END $;
