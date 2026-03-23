-- Migration: Create import_logs table for audit logging
-- Purpose: Track all import operations for compliance, troubleshooting, and security monitoring
-- Requirements: 7.7, 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7

-- Create import_logs table
CREATE TABLE IF NOT EXISTS import_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  username TEXT NOT NULL,
  module_type TEXT NOT NULL CHECK (module_type IN ('patient', 'inventory', 'lab_test')),
  filename TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_ms INTEGER,
  total_records INTEGER NOT NULL DEFAULT 0,
  successful_records INTEGER NOT NULL DEFAULT 0,
  failed_records INTEGER NOT NULL DEFAULT 0,
  skipped_records INTEGER NOT NULL DEFAULT 0,
  category_breakdown JSONB,
  error_details JSONB,
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_import_logs_user_id ON import_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_import_logs_module_type ON import_logs(module_type);
CREATE INDEX IF NOT EXISTS idx_import_logs_created_at ON import_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_import_logs_status ON import_logs(status);
CREATE INDEX IF NOT EXISTS idx_import_logs_start_time ON import_logs(start_time DESC);

-- Add comments for documentation
COMMENT ON TABLE import_logs IS 'Audit log for all CSV import operations';
COMMENT ON COLUMN import_logs.user_id IS 'User who performed the import (nullable if user is deleted)';
COMMENT ON COLUMN import_logs.username IS 'Username at time of import (preserved even if user is deleted)';
COMMENT ON COLUMN import_logs.module_type IS 'Type of import: patient, inventory, or lab_test';
COMMENT ON COLUMN import_logs.filename IS 'Original CSV filename';
COMMENT ON COLUMN import_logs.start_time IS 'When the import operation started';
COMMENT ON COLUMN import_logs.end_time IS 'When the import operation completed or failed';
COMMENT ON COLUMN import_logs.duration_ms IS 'Import duration in milliseconds';
COMMENT ON COLUMN import_logs.total_records IS 'Total number of records in the CSV';
COMMENT ON COLUMN import_logs.successful_records IS 'Number of successfully imported records';
COMMENT ON COLUMN import_logs.failed_records IS 'Number of records that failed to import';
COMMENT ON COLUMN import_logs.skipped_records IS 'Number of records skipped (e.g., duplicates)';
COMMENT ON COLUMN import_logs.category_breakdown IS 'JSON object with category counts (e.g., {"Services": 10, "Medicines": 20})';
COMMENT ON COLUMN import_logs.error_details IS 'JSON array of error objects with row numbers, data, and error messages';
COMMENT ON COLUMN import_logs.status IS 'Current status: in_progress, completed, or failed';

-- Enable Row Level Security
ALTER TABLE import_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Admin and staff can view all import logs
CREATE POLICY "Admin and staff can view all import logs"
  ON import_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'staff')
    )
  );

-- Admin and staff can insert import logs
CREATE POLICY "Admin and staff can insert import logs"
  ON import_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'staff')
    )
  );

-- Admin and staff can update their own import logs
CREATE POLICY "Admin and staff can update import logs"
  ON import_logs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'staff')
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON import_logs TO authenticated;
GRANT USAGE ON SEQUENCE import_logs_id_seq TO authenticated;
