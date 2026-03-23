-- Migration: Create function to release stale billing locks
-- Feature: consultation-to-billing-handoff
-- Task: 1.5 - Create function to clear locks older than 5 minutes

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS release_stale_billing_locks();

-- Function to release locks older than 5 minutes
CREATE OR REPLACE FUNCTION release_stale_billing_locks()
RETURNS INTEGER AS $$
DECLARE
  released_count INTEGER;
BEGIN
  UPDATE billing_queue
  SET processing_by = NULL,
      processing_started_at = NULL
  WHERE processing_by IS NOT NULL
    AND processing_started_at < NOW() - INTERVAL '5 minutes';
  
  GET DIAGNOSTICS released_count = ROW_COUNT;
  RETURN released_count;
END;
$$ LANGUAGE plpgsql;

-- Test the function (should return 0 if no stale locks exist)
SELECT release_stale_billing_locks() AS released_locks_count;
