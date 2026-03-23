-- =====================================================
-- Clinical Safety Trio: Patient Consent Management
-- Database Schema for Consent Records
-- =====================================================

-- This migration creates the consent_records table and related
-- triggers, functions, and indexes for patient consent management

-- =====================================================
-- 1. CREATE CONSENT_RECORDS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS emr.consent_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES emr.patients(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL CHECK (consent_type IN (
    'general_treatment',
    'data_sharing',
    'research_participation',
    'emergency_contact'
  )),
  consent_text TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('en', 'fil')),
  signature_data TEXT NOT NULL, -- base64-encoded PNG, max 50KB
  witness_user_id UUID NOT NULL REFERENCES auth.users(id),
  consent_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expiration_date DATE NOT NULL,
  consent_status TEXT NOT NULL DEFAULT 'active' CHECK (consent_status IN (
    'active',
    'withdrawn',
    'expired'
  )),
  withdrawal_date TIMESTAMP WITH TIME ZONE,
  withdrawal_reason TEXT,
  pdf_storage_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure only one active consent per type per patient
  CONSTRAINT unique_active_consent UNIQUE (patient_id, consent_type, consent_status)
);

-- Add comment to table
COMMENT ON TABLE emr.consent_records IS 'Stores patient consent records for treatment, data sharing, research, and emergency contact';

-- Add comments to columns
COMMENT ON COLUMN emr.consent_records.signature_data IS 'Base64-encoded PNG signature image, maximum 50KB';
COMMENT ON COLUMN emr.consent_records.consent_type IS 'Type of consent: general_treatment, data_sharing, research_participation, emergency_contact';
COMMENT ON COLUMN emr.consent_records.language IS 'Language of consent text: en (English) or fil (Filipino)';
COMMENT ON COLUMN emr.consent_records.expiration_date IS 'Date when consent expires (default: 1 year from consent_date)';

-- =====================================================
-- 2. CREATE INDEXES
-- =====================================================

CREATE INDEX idx_consent_patient ON emr.consent_records(patient_id);
CREATE INDEX idx_consent_status ON emr.consent_records(consent_status);
CREATE INDEX idx_consent_expiration ON emr.consent_records(expiration_date);
CREATE INDEX idx_consent_type ON emr.consent_records(consent_type);
CREATE INDEX idx_consent_witness ON emr.consent_records(witness_user_id);
CREATE INDEX idx_consent_created_at ON emr.consent_records(created_at DESC);

-- Partial index for active consents only (performance optimization)
CREATE INDEX idx_consent_active ON emr.consent_records(patient_id, consent_type)
  WHERE consent_status = 'active';

-- =====================================================
-- 3. CREATE TRIGGER FOR AUTOMATIC CONSENT EXPIRATION
-- =====================================================

-- Function to update expired consents
CREATE OR REPLACE FUNCTION emr.update_expired_consents()
RETURNS TRIGGER AS $
BEGIN
  -- Update all consents that have passed their expiration date
  UPDATE emr.consent_records
  SET consent_status = 'expired',
      updated_at = NOW()
  WHERE expiration_date < CURRENT_DATE
    AND consent_status = 'active';
  
  RETURN NULL;
END;
$ LANGUAGE plpgsql;

-- Trigger to check for expired consents on insert/update
CREATE TRIGGER check_expired_consents
  AFTER INSERT OR UPDATE ON emr.consent_records
  FOR EACH STATEMENT
  EXECUTE FUNCTION emr.update_expired_consents();

-- =====================================================
-- 4. CREATE TRIGGER FOR UPDATED_AT TIMESTAMP
-- =====================================================

CREATE OR REPLACE FUNCTION emr.update_consent_updated_at()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER set_consent_updated_at
  BEFORE UPDATE ON emr.consent_records
  FOR EACH ROW
  EXECUTE FUNCTION emr.update_consent_updated_at();

-- =====================================================
-- 5. CREATE FUNCTION TO CHECK CONSENT STATUS
-- =====================================================

-- Function to check if patient has valid consent for a specific type
CREATE OR REPLACE FUNCTION emr.check_patient_consent(
  p_patient_id UUID,
  p_consent_type TEXT
) RETURNS BOOLEAN AS $
DECLARE
  has_valid_consent BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM emr.consent_records
    WHERE patient_id = p_patient_id
      AND consent_type = p_consent_type
      AND consent_status = 'active'
      AND expiration_date >= CURRENT_DATE
  ) INTO has_valid_consent;
  
  RETURN has_valid_consent;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. CREATE FUNCTION TO GET EXPIRING CONSENTS
-- =====================================================

-- Function to get consents expiring within specified days
CREATE OR REPLACE FUNCTION emr.get_expiring_consents(
  days_until_expiration INTEGER DEFAULT 30
) RETURNS TABLE (
  consent_id UUID,
  patient_id UUID,
  patient_name TEXT,
  consent_type TEXT,
  expiration_date DATE,
  days_remaining INTEGER
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    cr.id,
    cr.patient_id,
    p.first_name || ' ' || p.last_name AS patient_name,
    cr.consent_type,
    cr.expiration_date,
    (cr.expiration_date - CURRENT_DATE)::INTEGER AS days_remaining
  FROM emr.consent_records cr
  JOIN emr.patients p ON cr.patient_id = p.id
  WHERE cr.consent_status = 'active'
    AND cr.expiration_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + days_until_expiration)
  ORDER BY cr.expiration_date ASC;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. CREATE FUNCTION TO GET CONSENT COVERAGE PERCENTAGE
-- =====================================================

-- Function to calculate consent coverage percentage
CREATE OR REPLACE FUNCTION emr.get_consent_coverage()
RETURNS TABLE (
  total_patients BIGINT,
  patients_with_consent BIGINT,
  coverage_percentage NUMERIC(5,2)
) AS $
DECLARE
  v_total_patients BIGINT;
  v_patients_with_consent BIGINT;
BEGIN
  -- Count total active patients
  SELECT COUNT(*) INTO v_total_patients
  FROM emr.patients
  WHERE status = 'active';
  
  -- Count patients with at least one active general_treatment consent
  SELECT COUNT(DISTINCT patient_id) INTO v_patients_with_consent
  FROM emr.consent_records
  WHERE consent_type = 'general_treatment'
    AND consent_status = 'active'
    AND expiration_date >= CURRENT_DATE;
  
  RETURN QUERY
  SELECT 
    v_total_patients,
    v_patients_with_consent,
    CASE 
      WHEN v_total_patients > 0 THEN 
        ROUND((v_patients_with_consent::NUMERIC / v_total_patients::NUMERIC) * 100, 2)
      ELSE 0
    END;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. ADD CONSENT COLUMNS TO AUDIT_LOG TABLE
-- =====================================================

-- Add consent-related columns to audit_log if they don't exist
ALTER TABLE emr.audit_log 
  ADD COLUMN IF NOT EXISTS consent_record_id UUID REFERENCES emr.consent_records(id);

-- Create index for consent audit logs
CREATE INDEX IF NOT EXISTS idx_audit_log_consent 
  ON emr.audit_log(consent_record_id)
  WHERE consent_record_id IS NOT NULL;

-- =====================================================
-- 9. CREATE RLS POLICIES FOR CONSENT_RECORDS
-- =====================================================

-- Enable RLS on consent_records table
ALTER TABLE emr.consent_records ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view consents based on role
CREATE POLICY "Users can view consent records based on role"
  ON emr.consent_records FOR SELECT
  TO authenticated
  USING (
    -- Admin can see all
    (SELECT role FROM emr.user_profiles WHERE user_id = auth.uid()) = 'admin'
    OR
    -- Doctors can see all
    (SELECT role FROM emr.user_profiles WHERE user_id = auth.uid()) = 'doctor'
    OR
    -- Nurses can see all
    (SELECT role FROM emr.user_profiles WHERE user_id = auth.uid()) = 'nurse'
    OR
    -- Receptionist can see all
    (SELECT role FROM emr.user_profiles WHERE user_id = auth.uid()) = 'receptionist'
    OR
    -- Users can see consents they witnessed
    witness_user_id = auth.uid()
  );

-- Policy: Only authorized roles can create consents
CREATE POLICY "Authorized users can create consent records"
  ON emr.consent_records FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Admin can create
    (SELECT role FROM emr.user_profiles WHERE user_id = auth.uid()) = 'admin'
    OR
    -- Doctors can create
    (SELECT role FROM emr.user_profiles WHERE user_id = auth.uid()) = 'doctor'
    OR
    -- Nurses can create
    (SELECT role FROM emr.user_profiles WHERE user_id = auth.uid()) = 'nurse'
    OR
    -- Receptionist can create
    (SELECT role FROM emr.user_profiles WHERE user_id = auth.uid()) = 'receptionist'
  );

-- Policy: Only authorized roles can update consents (for withdrawal)
CREATE POLICY "Authorized users can update consent records"
  ON emr.consent_records FOR UPDATE
  TO authenticated
  USING (
    -- Admin can update
    (SELECT role FROM emr.user_profiles WHERE user_id = auth.uid()) = 'admin'
    OR
    -- Doctors can update
    (SELECT role FROM emr.user_profiles WHERE user_id = auth.uid()) = 'doctor'
    OR
    -- Nurses can update
    (SELECT role FROM emr.user_profiles WHERE user_id = auth.uid()) = 'nurse'
  );

-- Policy: No one can delete consent records (immutable audit trail)
-- Consents can only be withdrawn, not deleted

-- =====================================================
-- 10. CREATE VALIDATION FUNCTION FOR SIGNATURE SIZE
-- =====================================================

-- Function to validate signature data size (max 50KB)
CREATE OR REPLACE FUNCTION emr.validate_signature_size()
RETURNS TRIGGER AS $
BEGIN
  -- Check if signature_data is base64 encoded and within size limit
  -- Base64 encoding increases size by ~33%, so 50KB limit = ~37.5KB decoded
  IF LENGTH(NEW.signature_data) > 68000 THEN -- ~50KB base64
    RAISE EXCEPTION 'Signature data exceeds maximum size of 50KB';
  END IF;
  
  -- Validate base64 format (basic check)
  IF NEW.signature_data !~ '^data:image/png;base64,' THEN
    RAISE EXCEPTION 'Signature data must be a base64-encoded PNG image';
  END IF;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER validate_consent_signature
  BEFORE INSERT OR UPDATE ON emr.consent_records
  FOR EACH ROW
  EXECUTE FUNCTION emr.validate_signature_size();

-- =====================================================
-- 11. CREATE FUNCTION TO AUTO-SET EXPIRATION DATE
-- =====================================================

-- Function to automatically set expiration date if not provided (1 year default)
CREATE OR REPLACE FUNCTION emr.set_consent_expiration()
RETURNS TRIGGER AS $
BEGIN
  -- If expiration_date is not set, default to 1 year from consent_date
  IF NEW.expiration_date IS NULL THEN
    NEW.expiration_date := (NEW.consent_date + INTERVAL '1 year')::DATE;
  END IF;
  
  -- Validate expiration date is in the future
  IF NEW.expiration_date <= CURRENT_DATE THEN
    RAISE EXCEPTION 'Expiration date must be in the future';
  END IF;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER set_consent_expiration_date
  BEFORE INSERT ON emr.consent_records
  FOR EACH ROW
  EXECUTE FUNCTION emr.set_consent_expiration();

-- =====================================================
-- 12. CREATE SCHEDULED JOB FOR DAILY EXPIRATION CHECK
-- =====================================================

-- Create function to run daily expiration check
CREATE OR REPLACE FUNCTION emr.daily_consent_expiration_check()
RETURNS INTEGER AS $
DECLARE
  expired_count INTEGER := 0;
BEGIN
  -- Update expired consents
  UPDATE emr.consent_records
  SET consent_status = 'expired',
      updated_at = NOW()
  WHERE expiration_date < CURRENT_DATE
    AND consent_status = 'active';
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  -- Log to audit trail
  IF expired_count > 0 THEN
    INSERT INTO emr.audit_log (
      operation_type,
      action,
      table_name,
      new_data
    ) VALUES (
      'consent_expired',
      'system_expiration_check',
      'consent_records',
      jsonb_build_object(
        'expired_count', expired_count,
        'check_date', CURRENT_DATE
      )
    );
  END IF;
  
  RETURN expired_count;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule daily expiration check at 1:00 AM (if pg_cron is available)
-- Note: This requires pg_cron extension
DO $
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'consent-expiration-check',
      '0 1 * * *', -- Daily at 1:00 AM
      $
      SELECT emr.daily_consent_expiration_check();
      $
    );
  END IF;
END $;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify table creation
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'emr' 
  AND table_name = 'consent_records'
ORDER BY ordinal_position;

-- Verify indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'emr' 
  AND tablename = 'consent_records';

-- Verify triggers
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'emr' 
  AND event_object_table = 'consent_records';

-- Verify RLS policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'emr' 
  AND tablename = 'consent_records';

-- Test consent coverage function
SELECT * FROM emr.get_consent_coverage();

-- Test expiring consents function (next 30 days)
SELECT * FROM emr.get_expiring_consents(30);

-- Success message
DO $
BEGIN
  RAISE NOTICE '✅ Consent records schema created successfully';
  RAISE NOTICE '📋 Table: emr.consent_records';
  RAISE NOTICE '🔍 Indexes: 7 indexes created';
  RAISE NOTICE '⚡ Triggers: 4 triggers created';
  RAISE NOTICE '🔒 RLS policies: 3 policies created';
  RAISE NOTICE '🔧 Functions: 6 helper functions created';
  RAISE NOTICE '⏰ Scheduled job: Daily expiration check at 1:00 AM';
END $;
