-- Enhance Audit Log Table for Clinical Safety Trio
-- Requirements: 4.1, 4.2, 4.3, 4.4
--
-- This migration enhances the existing audit_log table to support
-- comprehensive audit trail for backup, consent, and emergency access operations

-- Add new columns to audit_log table if they don't exist
ALTER TABLE emr.audit_log 
ADD COLUMN IF NOT EXISTS operation_type TEXT CHECK (operation_type IN (
  'backup_created',
  'backup_failed',
  'backup_verified',
  'consent_granted',
  'consent_withdrawn',
  'consent_expired',
  'consent_renewed',
  'consent_check',
  'emergency_access_granted',
  'emergency_access_revoked',
  'emergency_access_expired',
  'emergency_access_check',
  'data_access',
  'data_modification'
));

ALTER TABLE emr.audit_log 
ADD COLUMN IF NOT EXISTS emergency_access_log_id UUID REFERENCES emr.emergency_access_logs(id);

ALTER TABLE emr.audit_log 
ADD COLUMN IF NOT EXISTS consent_record_id UUID REFERENCES emr.consent_records(id);

ALTER TABLE emr.audit_log 
ADD COLUMN IF NOT EXISTS backup_log_id UUID REFERENCES emr.backup_logs(id);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_log_operation_type 
ON emr.audit_log(operation_type);

CREATE INDEX IF NOT EXISTS idx_audit_log_emergency_access 
ON emr.audit_log(emergency_access_log_id) 
WHERE emergency_access_log_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_log_consent 
ON emr.audit_log(consent_record_id) 
WHERE consent_record_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_log_backup 
ON emr.audit_log(backup_log_id) 
WHERE backup_log_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at_desc 
ON emr.audit_log(created_at DESC);

-- Add immutability constraint (prevent updates and deletes)
-- This ensures audit trail integrity per requirement 4.4

-- Revoke UPDATE and DELETE permissions from all roles
REVOKE UPDATE, DELETE ON emr.audit_log FROM authenticated;
REVOKE UPDATE, DELETE ON emr.audit_log FROM anon;
REVOKE UPDATE, DELETE ON emr.audit_log FROM service_role;

-- Create trigger to prevent updates
CREATE OR REPLACE FUNCTION emr.prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit log records are immutable and cannot be modified or deleted';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_audit_log_update ON emr.audit_log;
CREATE TRIGGER prevent_audit_log_update
  BEFORE UPDATE ON emr.audit_log
  FOR EACH ROW
  EXECUTE FUNCTION emr.prevent_audit_log_modification();

DROP TRIGGER IF EXISTS prevent_audit_log_delete ON emr.audit_log;
CREATE TRIGGER prevent_audit_log_delete
  BEFORE DELETE ON emr.audit_log
  FOR EACH ROW
  EXECUTE FUNCTION emr.prevent_audit_log_modification();

-- Create helper function to log backup operations
CREATE OR REPLACE FUNCTION emr.log_backup_operation(
  p_backup_log_id UUID,
  p_operation_type TEXT,
  p_user_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO emr.audit_log (
    operation_type,
    backup_log_id,
    user_id,
    table_name,
    action,
    new_data,
    created_at
  ) VALUES (
    p_operation_type,
    p_backup_log_id,
    p_user_id,
    'backup_logs',
    'insert',
    p_details,
    NOW()
  ) RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to log consent operations
CREATE OR REPLACE FUNCTION emr.log_consent_operation(
  p_consent_record_id UUID,
  p_operation_type TEXT,
  p_user_id UUID,
  p_details JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO emr.audit_log (
    operation_type,
    consent_record_id,
    user_id,
    table_name,
    record_id,
    action,
    new_data,
    created_at
  ) VALUES (
    p_operation_type,
    p_consent_record_id,
    p_user_id,
    'consent_records',
    p_consent_record_id,
    CASE 
      WHEN p_operation_type = 'consent_granted' THEN 'insert'
      WHEN p_operation_type IN ('consent_withdrawn', 'consent_expired') THEN 'update'
      ELSE 'select'
    END,
    p_details,
    NOW()
  ) RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to log emergency access operations
CREATE OR REPLACE FUNCTION emr.log_emergency_access_operation(
  p_emergency_access_log_id UUID,
  p_operation_type TEXT,
  p_user_id UUID,
  p_patient_id UUID,
  p_details JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO emr.audit_log (
    operation_type,
    emergency_access_log_id,
    user_id,
    table_name,
    record_id,
    action,
    new_data,
    created_at
  ) VALUES (
    p_operation_type,
    p_emergency_access_log_id,
    p_user_id,
    'emergency_access_logs',
    p_emergency_access_log_id,
    CASE 
      WHEN p_operation_type = 'emergency_access_granted' THEN 'insert'
      WHEN p_operation_type IN ('emergency_access_revoked', 'emergency_access_expired') THEN 'update'
      ELSE 'select'
    END,
    jsonb_build_object('patient_id', p_patient_id) || p_details,
    NOW()
  ) RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for audit trail summary
CREATE OR REPLACE VIEW emr.audit_trail_summary AS
SELECT 
  operation_type,
  COUNT(*) as operation_count,
  COUNT(DISTINCT user_id) as unique_users,
  MIN(created_at) as first_occurrence,
  MAX(created_at) as last_occurrence
FROM emr.audit_log
WHERE operation_type IS NOT NULL
GROUP BY operation_type
ORDER BY operation_count DESC;

-- Grant SELECT permission on the view
GRANT SELECT ON emr.audit_trail_summary TO authenticated;

-- Create function to get audit trail for a specific entity
CREATE OR REPLACE FUNCTION emr.get_entity_audit_trail(
  p_entity_type TEXT, -- 'backup', 'consent', 'emergency_access'
  p_entity_id UUID,
  p_limit INTEGER DEFAULT 100
) RETURNS TABLE (
  id UUID,
  operation_type TEXT,
  user_id UUID,
  user_name TEXT,
  action TEXT,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.id,
    al.operation_type,
    al.user_id,
    COALESCE(up.first_name || ' ' || up.last_name, 'System') as user_name,
    al.action,
    al.old_data,
    al.new_data,
    al.created_at
  FROM emr.audit_log al
  LEFT JOIN emr.user_profiles up ON al.user_id = up.id
  WHERE 
    CASE p_entity_type
      WHEN 'backup' THEN al.backup_log_id = p_entity_id
      WHEN 'consent' THEN al.consent_record_id = p_entity_id
      WHEN 'emergency_access' THEN al.emergency_access_log_id = p_entity_id
      ELSE FALSE
    END
  ORDER BY al.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant EXECUTE permission on helper functions
GRANT EXECUTE ON FUNCTION emr.log_backup_operation TO service_role;
GRANT EXECUTE ON FUNCTION emr.log_consent_operation TO authenticated;
GRANT EXECUTE ON FUNCTION emr.log_emergency_access_operation TO authenticated;
GRANT EXECUTE ON FUNCTION emr.get_entity_audit_trail TO authenticated;

-- Verify audit log enhancements
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'emr' 
  AND table_name = 'audit_log'
  AND column_name IN ('operation_type', 'emergency_access_log_id', 'consent_record_id', 'backup_log_id')
ORDER BY column_name;

-- Verify indexes
SELECT 
  indexname, 
  indexdef
FROM pg_indexes
WHERE schemaname = 'emr' 
  AND tablename = 'audit_log'
  AND indexname LIKE 'idx_audit_log_%'
ORDER BY indexname;
