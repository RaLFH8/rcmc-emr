-- ============================================================================
-- CONSULTATION TO BILLING HANDOFF - ALL MIGRATIONS
-- ============================================================================
-- This file contains all database migrations for the consultation-to-billing
-- handoff feature. Run this in your Supabase SQL Editor.
--
-- Feature: Automate patient transfer from consultation to billing
-- Spec Location: rcmc-emr/.kiro/specs/consultation-to-billing-handoff/
-- ============================================================================

-- MIGRATION 1: Add status tracking to consultations table
-- ----------------------------------------------------------------------------
ALTER TABLE consultations 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'in_progress' 
  CHECK (status IN ('in_progress', 'pending_billing', 'billed', 'cancelled'));

ALTER TABLE consultations 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE consultations 
ADD COLUMN IF NOT EXISTS completed_by UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_consultations_status 
  ON consultations(status);

CREATE INDEX IF NOT EXISTS idx_consultations_completed_at 
  ON consultations(completed_at);

-- MIGRATION 2: Create billing_queue table with RLS policies
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS billing_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  consultation_date TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  processing_by UUID REFERENCES auth.users(id),
  processing_started_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(consultation_id)
);

CREATE INDEX IF NOT EXISTS idx_billing_queue_patient 
  ON billing_queue(patient_id);

CREATE INDEX IF NOT EXISTS idx_billing_queue_completed_at 
  ON billing_queue(completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_billing_queue_processing 
  ON billing_queue(processing_by);

ALTER TABLE billing_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All authenticated users can read billing queue" ON billing_queue;
DROP POLICY IF EXISTS "Receptionists and admins can update billing queue" ON billing_queue;
DROP POLICY IF EXISTS "System can insert into billing queue" ON billing_queue;
DROP POLICY IF EXISTS "System can delete from billing queue" ON billing_queue;

CREATE POLICY "All authenticated users can read billing queue"
  ON billing_queue FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Receptionists and admins can update billing queue"
  ON billing_queue FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'receptionist')
    )
  );

CREATE POLICY "System can insert into billing queue"
  ON billing_queue FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can delete from billing queue"
  ON billing_queue FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'receptionist')
    )
  );

-- MIGRATION 3: Add consultation reference to billing table
-- ----------------------------------------------------------------------------
ALTER TABLE billing 
ADD COLUMN IF NOT EXISTS consultation_id UUID REFERENCES consultations(id);

ALTER TABLE billing 
ADD COLUMN IF NOT EXISTS billed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE billing 
ADD COLUMN IF NOT EXISTS billed_by UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_billing_consultation 
  ON billing(consultation_id);

-- MIGRATION 4: Create trigger for automatic billing queue entry
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_create_billing_queue ON consultations;
DROP FUNCTION IF EXISTS create_billing_queue_entry();

CREATE OR REPLACE FUNCTION create_billing_queue_entry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending_billing' AND (OLD.status IS NULL OR OLD.status != 'pending_billing') THEN
    INSERT INTO billing_queue (
      consultation_id,
      patient_id,
      doctor_id,
      consultation_date,
      completed_at
    ) VALUES (
      NEW.id,
      NEW.patient_id,
      NEW.doctor_id,
      NEW.consultation_date,
      NEW.completed_at
    )
    ON CONFLICT (consultation_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_billing_queue
  AFTER INSERT OR UPDATE ON consultations
  FOR EACH ROW
  EXECUTE FUNCTION create_billing_queue_entry();

-- MIGRATION 5: Create function to release stale billing locks
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS release_stale_billing_locks();

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

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify consultations table columns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'consultations'
  AND column_name IN ('status', 'completed_at', 'completed_by');

-- Verify billing_queue table was created
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'billing_queue'
ORDER BY ordinal_position;

-- Verify billing table columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'billing'
  AND column_name IN ('consultation_id', 'billed_at', 'billed_by');

-- Verify trigger was created
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public' 
  AND trigger_name = 'trigger_create_billing_queue';

-- Test stale lock release function
SELECT release_stale_billing_locks() AS released_locks_count;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- All database migrations have been applied successfully.
-- Next steps:
-- 1. Verify all tables and columns were created
-- 2. Test the trigger by updating a consultation status
-- 3. Proceed with frontend implementation (Task 3)
-- ============================================================================
