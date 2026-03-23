-- Migration: Create emergency_access_logs table for Clinical Safety Trio
-- Feature: Emergency Access Override
-- Requirements: 3.4, 3.12, 4.3
-- Description: Creates emergency_access_logs table with indexes, triggers, functions, and audit_log enhancements

-- ============================================================================
-- 1. Create emergency_access_logs table
-- ============================================================================

CREATE TABLE IF NOT EXISTS emr.emergency_access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  patient_id UUID NOT NULL REFERENCES emr.patients(id) ON DELETE CASCADE,
  justification TEXT NOT NULL CHECK (LENGTH(justification) >= 30),
  emergency_type TEXT NOT NULL CHECK (emergency_type IN (
    'life_threatening',
    'urgent_care',
    'critical_condition'
  )),
  access_granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  access_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  access_revoked_at TIMESTAMP WITH TIME ZONE,
  revocation_reason TEXT,
  access_duration_seconds INTEGER,
  data_accessed JSONB DEFAULT '[]', -- Array of table names accessed
  actions_performed JSONB DEFAULT '[]', -- Array of operations performed
  primary_physician_notified BOOLEAN DEFAULT false,
  admin_notified BOOLEAN DEFAULT false,
  compliance_reviewed BOOLEAN DEFAULT false,
  compliance_review_date TIMESTAMP WITH TIME ZONE,
  compliance_reviewer_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. Create indexes for emergency_access_logs table
-- ============================================================================

-- Index for filtering by user (who accessed)
CREATE INDEX IF NOT EXISTS idx_emergency_access_user 
  ON emr.emergency_access_logs(user_id);

-- Index for filtering by patient (whose records were accessed)
CREATE INDEX IF NOT EXISTS idx_emergency_access_patient 
  ON emr.emergency_access_logs(patient_id);

-- Index for sorting by access time (most recent first)
CREATE INDEX IF NOT EXISTS idx_emergency_access_granted 
  ON emr.emergency_access_logs(access_granted_at DESC);

-- Index for finding active emergency access sessions
-- This is critical for check_emergency_access() function performance
CREATE INDEX IF NOT EXISTS idx_emergency_access_active 
  ON emr.emergency_access_logs(user_id, patient_id, access_expires_at)
  WHERE access_revoked_at IS NULL AND access_expires_at > NOW();

-- Index for compliance review filtering
CREATE INDEX IF NOT EXISTS idx_emergency_access_compliance 
  ON emr.emergency_access_logs(compliance_reviewed);

-- ============================================================================
-- 3. Create trigger for access duration calculation
-- ============================================================================

-- Function to calculate access_duration_seconds when access is revoked
CREATE OR REPLACE FUNCTION emr.calculate_access_duration()
RETURNS TRIGGER AS $
BEGIN
  -- Only calculate duration when access is revoked (transition from NULL to non-NULL)
  IF NEW.access_revoked_at IS NOT NULL AND OLD.access_revoked_at IS NULL THEN
    NEW.access_duration_seconds := EXTRACT(EPOCH FROM (NEW.access_revoked_at - NEW.access_granted_at))::INTEGER;
  END IF;
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Trigger to automatically calculate duration on revocation
CREATE TRIGGER update_access_duration
  BEFORE UPDATE ON emr.emergency_access_logs
  FOR EACH ROW
  EXECUTE FUNCTION emr.calculate_access_duration();

-- ============================================================================
-- 4. Create trigger for concurrent session limit enforcement
-- ============================================================================

-- Function to enforce maximum 5 concurrent emergency access sessions per user
CREATE OR REPLACE FUNCTION emr.check_concurrent_emergency_access()
RETURNS TRIGGER AS $
DECLARE
  active_count INTEGER;
BEGIN
  -- Count active sessions for this user
  SELECT COUNT(*) INTO active_count
  FROM emr.emergency_access_logs
  WHERE user_id = NEW.user_id
  AND access_expires_at > NOW()
  AND access_revoked_at IS NULL;
  
  -- Enforce limit of 5 concurrent sessions
  IF active_count >= 5 THEN
    RAISE EXCEPTION 'Maximum concurrent emergency access sessions (5) reached for user';
  END IF;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Trigger to enforce concurrent session limit on insert
CREATE TRIGGER enforce_concurrent_access_limit
  BEFORE INSERT ON emr.emergency_access_logs
  FOR EACH ROW
  EXECUTE FUNCTION emr.check_concurrent_emergency_access();

-- ============================================================================
-- 5. Create function check_emergency_access() for RLS bypass
-- ============================================================================

-- Function to check if a user has active emergency access to a patient
-- This function is used by RLS policies to bypass normal access restrictions
CREATE OR REPLACE FUNCTION emr.check_emergency_access(
  p_user_id UUID,
  p_patient_id UUID
) RETURNS BOOLEAN AS $
DECLARE
  has_active_access BOOLEAN;
BEGIN
  -- Check if user has an active emergency access session for this patient
  SELECT EXISTS (
    SELECT 1 FROM emr.emergency_access_logs
    WHERE user_id = p_user_id
    AND patient_id = p_patient_id
    AND access_granted_at <= NOW()
    AND access_expires_at > NOW()
    AND access_revoked_at IS NULL
  ) INTO has_active_access;
  
  RETURN has_active_access;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION emr.check_emergency_access(UUID, UUID) TO authenticated;

-- ============================================================================
-- 6. Add emergency access columns to audit_log table
-- ============================================================================

-- Add emergency_access_log_id foreign key column if it doesn't exist
DO $ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'emr' 
    AND table_name = 'audit_log' 
    AND column_name = 'emergency_access_log_id'
  ) THEN
    ALTER TABLE emr.audit_log ADD COLUMN emergency_access_log_id UUID 
      REFERENCES emr.emergency_access_logs(id);
  END IF;
END $;

-- Create index for audit_log emergency_access_log_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_audit_log_emergency_access 
  ON emr.audit_log(emergency_access_log_id);

-- Update operation_type check constraint to include emergency access operations
-- First, drop the existing constraint if it exists
DO $
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_schema = 'emr'
    AND table_name = 'audit_log'
    AND constraint_name LIKE '%operation_type%'
  ) THEN
    ALTER TABLE emr.audit_log DROP CONSTRAINT IF EXISTS audit_log_operation_type_check;
  END IF;
END $;

-- Add updated constraint with emergency access operations
ALTER TABLE emr.audit_log ADD CONSTRAINT audit_log_operation_type_check
  CHECK (operation_type IN (
    'backup_created',
    'backup_failed',
    'backup_verified',
    'consent_granted',
    'consent_withdrawn',
    'consent_expired',
    'emergency_access_granted',
    'emergency_access_revoked',
    'emergency_access_expired',
    'data_access',
    'data_modification'
  ));

-- ============================================================================
-- 7. Create RLS policies for emergency_access_logs table
-- ============================================================================

-- Enable RLS on emergency_access_logs table
ALTER TABLE emr.emergency_access_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own emergency access logs
CREATE POLICY "Users can view their own emergency access logs"
  ON emr.emergency_access_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Admins can view all emergency access logs
CREATE POLICY "Admins can view all emergency access logs"
  ON emr.emergency_access_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM emr.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Policy: Doctors and nurses can view emergency access logs for their patients
CREATE POLICY "Healthcare providers can view emergency access for their patients"
  ON emr.emergency_access_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM emr.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('doctor', 'nurse')
    )
    AND
    patient_id IN (
      SELECT id FROM emr.patients
      WHERE primary_physician_id = auth.uid()
    )
  );

-- Policy: Authorized users can create emergency access logs
CREATE POLICY "Authorized users can create emergency access logs"
  ON emr.emergency_access_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND
    EXISTS (
      SELECT 1 FROM emr.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('doctor', 'nurse', 'emergency_staff')
    )
  );

-- Policy: Users can revoke their own emergency access
CREATE POLICY "Users can revoke their own emergency access"
  ON emr.emergency_access_logs FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND access_revoked_at IS NOT NULL
  );

-- Policy: Admins can update emergency access logs (for compliance review)
CREATE POLICY "Admins can update emergency access logs"
  ON emr.emergency_access_logs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM emr.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- ============================================================================
-- 8. Add helpful comments
-- ============================================================================

COMMENT ON TABLE emr.emergency_access_logs IS 'Tracks all emergency "break glass" access events for audit trail and compliance';
COMMENT ON COLUMN emr.emergency_access_logs.justification IS 'Required justification for emergency access (minimum 30 characters)';
COMMENT ON COLUMN emr.emergency_access_logs.emergency_type IS 'Type of emergency: life_threatening, urgent_care, or critical_condition';
COMMENT ON COLUMN emr.emergency_access_logs.access_granted_at IS 'Timestamp when emergency access was granted';
COMMENT ON COLUMN emr.emergency_access_logs.access_expires_at IS 'Timestamp when emergency access expires (24 hours from grant)';
COMMENT ON COLUMN emr.emergency_access_logs.access_revoked_at IS 'Timestamp when emergency access was manually revoked (NULL if still active)';
COMMENT ON COLUMN emr.emergency_access_logs.access_duration_seconds IS 'Automatically calculated duration from grant to revocation';
COMMENT ON COLUMN emr.emergency_access_logs.data_accessed IS 'JSONB array of table names accessed during emergency session';
COMMENT ON COLUMN emr.emergency_access_logs.actions_performed IS 'JSONB array of operations performed during emergency session';
COMMENT ON COLUMN emr.emergency_access_logs.primary_physician_notified IS 'Whether the patient''s primary physician was notified';
COMMENT ON COLUMN emr.emergency_access_logs.admin_notified IS 'Whether system administrators were notified';
COMMENT ON COLUMN emr.emergency_access_logs.compliance_reviewed IS 'Whether this emergency access has been reviewed for compliance';
COMMENT ON COLUMN emr.emergency_access_logs.compliance_reviewer_id IS 'User ID of compliance officer who reviewed this access';

COMMENT ON FUNCTION emr.check_emergency_access(UUID, UUID) IS 'Checks if a user has active emergency access to a patient. Used by RLS policies to bypass normal access restrictions.';

-- ============================================================================
-- 9. Create helper function for automatic access expiration
-- ============================================================================

-- Function to set access_expires_at to 24 hours from access_granted_at
CREATE OR REPLACE FUNCTION emr.set_emergency_access_expiration()
RETURNS TRIGGER AS $
BEGIN
  -- Automatically set expiration to 24 hours from grant time if not explicitly set
  IF NEW.access_expires_at IS NULL THEN
    NEW.access_expires_at := NEW.access_granted_at + INTERVAL '24 hours';
  END IF;
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Trigger to automatically set expiration time on insert
CREATE TRIGGER set_access_expiration
  BEFORE INSERT ON emr.emergency_access_logs
  FOR EACH ROW
  EXECUTE FUNCTION emr.set_emergency_access_expiration();

-- ============================================================================
-- Migration complete
-- ============================================================================

-- Verify table was created
DO $
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'emr' 
    AND table_name = 'emergency_access_logs'
  ) THEN
    RAISE NOTICE 'SUCCESS: emergency_access_logs table created successfully';
  ELSE
    RAISE EXCEPTION 'FAILED: emergency_access_logs table was not created';
  END IF;
  
  -- Verify check_emergency_access function was created
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'check_emergency_access'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'emr')
  ) THEN
    RAISE NOTICE 'SUCCESS: check_emergency_access() function created successfully';
  ELSE
    RAISE EXCEPTION 'FAILED: check_emergency_access() function was not created';
  END IF;
  
  -- Verify triggers were created
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_access_duration'
  ) THEN
    RAISE NOTICE 'SUCCESS: update_access_duration trigger created successfully';
  ELSE
    RAISE EXCEPTION 'FAILED: update_access_duration trigger was not created';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'enforce_concurrent_access_limit'
  ) THEN
    RAISE NOTICE 'SUCCESS: enforce_concurrent_access_limit trigger created successfully';
  ELSE
    RAISE EXCEPTION 'FAILED: enforce_concurrent_access_limit trigger was not created';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'set_access_expiration'
  ) THEN
    RAISE NOTICE 'SUCCESS: set_access_expiration trigger created successfully';
  ELSE
    RAISE EXCEPTION 'FAILED: set_access_expiration trigger was not created';
  END IF;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Emergency Access Logs Migration Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Created:';
  RAISE NOTICE '  - emergency_access_logs table';
  RAISE NOTICE '  - 5 indexes for performance';
  RAISE NOTICE '  - 3 triggers (duration, concurrent limit, expiration)';
  RAISE NOTICE '  - check_emergency_access() function for RLS bypass';
  RAISE NOTICE '  - 6 RLS policies for access control';
  RAISE NOTICE '  - audit_log enhancements';
  RAISE NOTICE '========================================';
END $;
