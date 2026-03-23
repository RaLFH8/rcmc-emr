-- Migration: Create backup_logs table for Clinical Safety Trio
-- Feature: Automated Backup System
-- Requirements: 1.10, 4.1
-- Description: Creates backup_logs table with indexes, triggers, and audit_log enhancements

-- ============================================================================
-- 1. Create backup_logs table
-- ============================================================================

CREATE TABLE IF NOT EXISTS emr.backup_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  backup_filename TEXT NOT NULL,
  backup_type TEXT NOT NULL CHECK (backup_type IN ('daily', 'weekly', 'monthly', 'manual')),
  file_size_bytes BIGINT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'success', 'failed')),
  error_message TEXT,
  storage_path TEXT NOT NULL,
  compression_ratio NUMERIC(5,2),
  encrypted BOOLEAN DEFAULT true,
  verified BOOLEAN DEFAULT false,
  verification_date TIMESTAMP WITH TIME ZONE,
  retention_until DATE NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. Create indexes for backup_logs table
-- ============================================================================

-- Index for filtering by status (success, failed, in_progress)
CREATE INDEX IF NOT EXISTS idx_backup_logs_status 
  ON emr.backup_logs(status);

-- Index for sorting by creation date (most recent first)
CREATE INDEX IF NOT EXISTS idx_backup_logs_created_at 
  ON emr.backup_logs(created_at DESC);

-- Index for filtering by backup type (daily, weekly, monthly, manual)
CREATE INDEX IF NOT EXISTS idx_backup_logs_backup_type 
  ON emr.backup_logs(backup_type);

-- Index for retention policy enforcement (finding backups to delete)
CREATE INDEX IF NOT EXISTS idx_backup_logs_retention 
  ON emr.backup_logs(retention_until);

-- ============================================================================
-- 3. Create trigger for automatic duration calculation
-- ============================================================================

-- Function to calculate duration_seconds when end_time is set
CREATE OR REPLACE FUNCTION emr.calculate_backup_duration()
RETURNS TRIGGER AS $$
BEGIN
  -- Only calculate duration if end_time is set and duration is not already set
  IF NEW.end_time IS NOT NULL AND (OLD.end_time IS NULL OR NEW.end_time != OLD.end_time) THEN
    NEW.duration_seconds := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time))::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically calculate duration on insert or update
CREATE TRIGGER calculate_backup_duration_trigger
  BEFORE INSERT OR UPDATE ON emr.backup_logs
  FOR EACH ROW
  EXECUTE FUNCTION emr.calculate_backup_duration();

-- ============================================================================
-- 4. Add backup-related columns to audit_log table
-- ============================================================================

-- Add operation_type column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'emr' 
    AND table_name = 'audit_log' 
    AND column_name = 'operation_type'
  ) THEN
    ALTER TABLE emr.audit_log ADD COLUMN operation_type TEXT 
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
  END IF;
END $$;

-- Add backup_log_id foreign key column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'emr' 
    AND table_name = 'audit_log' 
    AND column_name = 'backup_log_id'
  ) THEN
    ALTER TABLE emr.audit_log ADD COLUMN backup_log_id UUID 
      REFERENCES emr.backup_logs(id);
  END IF;
END $$;

-- Create index for audit_log operation_type if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_audit_log_operation_type 
  ON emr.audit_log(operation_type);

-- Create index for audit_log backup_log_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_audit_log_backup_log_id 
  ON emr.audit_log(backup_log_id);

-- ============================================================================
-- 5. Create RLS policies for backup_logs table
-- ============================================================================

-- Enable RLS on backup_logs table
ALTER TABLE emr.backup_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all backup logs
CREATE POLICY "Admins can view all backup logs"
  ON emr.backup_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM emr.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Policy: Admins can insert backup logs (for manual backups)
CREATE POLICY "Admins can create backup logs"
  ON emr.backup_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM emr.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Policy: Admins can update backup logs (for verification status)
CREATE POLICY "Admins can update backup logs"
  ON emr.backup_logs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM emr.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- ============================================================================
-- 6. Add helpful comments
-- ============================================================================

COMMENT ON TABLE emr.backup_logs IS 'Tracks all database backup operations for disaster recovery and compliance';
COMMENT ON COLUMN emr.backup_logs.backup_filename IS 'Filename in format: rcmc_emr_backup_YYYY-MM-DD_HH-MM-SS.sql';
COMMENT ON COLUMN emr.backup_logs.backup_type IS 'Type of backup: daily (30 day retention), weekly (90 day retention), monthly (365 day retention), manual (custom retention)';
COMMENT ON COLUMN emr.backup_logs.file_size_bytes IS 'Size of compressed backup file in bytes';
COMMENT ON COLUMN emr.backup_logs.duration_seconds IS 'Automatically calculated from end_time - start_time';
COMMENT ON COLUMN emr.backup_logs.status IS 'Current status: in_progress, success, failed';
COMMENT ON COLUMN emr.backup_logs.compression_ratio IS 'Ratio of compression: (original_size - compressed_size) / original_size';
COMMENT ON COLUMN emr.backup_logs.encrypted IS 'Whether backup file is encrypted with AES-256';
COMMENT ON COLUMN emr.backup_logs.verified IS 'Whether backup has been verified through test restore';
COMMENT ON COLUMN emr.backup_logs.retention_until IS 'Date when backup should be deleted based on retention policy';

-- ============================================================================
-- Migration complete
-- ============================================================================

-- Verify table was created
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'emr' 
    AND table_name = 'backup_logs'
  ) THEN
    RAISE NOTICE 'SUCCESS: backup_logs table created successfully';
  ELSE
    RAISE EXCEPTION 'FAILED: backup_logs table was not created';
  END IF;
END $$;
