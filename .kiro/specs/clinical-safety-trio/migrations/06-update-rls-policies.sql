-- =====================================================
-- Clinical Safety Trio: RLS Policy Updates
-- Emergency Access Bypass Integration
-- =====================================================

-- This migration updates RLS policies across all patient-related tables
-- to support emergency access bypass via the check_emergency_access() function

-- =====================================================
-- 1. PATIENTS TABLE
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow emergency access to patients" ON emr.patients;
DROP POLICY IF EXISTS "Users can view patients based on role" ON emr.patients;

-- Recreate with emergency access support
CREATE POLICY "Users can view patients based on role"
  ON emr.patients FOR SELECT
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
    -- Emergency access bypass
    emr.check_emergency_access(auth.uid(), id)
  );

-- =====================================================
-- 2. CONSULTATIONS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Allow emergency access to consultations" ON emr.consultations;
DROP POLICY IF EXISTS "Users can view consultations based on role" ON emr.consultations;

CREATE POLICY "Users can view consultations based on role"
  ON emr.consultations FOR SELECT
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
    -- Emergency access bypass
    emr.check_emergency_access(auth.uid(), patient_id)
  );

CREATE POLICY "Users can insert consultations based on role"
  ON emr.consultations FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Doctors can create
    (SELECT role FROM emr.user_profiles WHERE user_id = auth.uid()) = 'doctor'
    OR
    -- Emergency access bypass
    emr.check_emergency_access(auth.uid(), patient_id)
  );

CREATE POLICY "Users can update consultations based on role"
  ON emr.consultations FOR UPDATE
  TO authenticated
  USING (
    -- Doctors can update
    (SELECT role FROM emr.user_profiles WHERE user_id = auth.uid()) = 'doctor'
    OR
    -- Emergency access bypass
    emr.check_emergency_access(auth.uid(), patient_id)
  );

-- =====================================================
-- 3. PRESCRIPTIONS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Allow emergency access to prescriptions" ON emr.prescriptions;
DROP POLICY IF EXISTS "Users can view prescriptions based on role" ON emr.prescriptions;

CREATE POLICY "Users can view prescriptions based on role"
  ON emr.prescriptions FOR SELECT
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
    -- Pharmacist can see all
    (SELECT role FROM emr.user_profiles WHERE user_id = auth.uid()) = 'pharmacist'
    OR
    -- Emergency access bypass
    emr.check_emergency_access(auth.uid(), patient_id)
  );

CREATE POLICY "Users can insert prescriptions based on role"
  ON emr.prescriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Doctors can create
    (SELECT role FROM emr.user_profiles WHERE user_id = auth.uid()) = 'doctor'
    OR
    -- Emergency access bypass
    emr.check_emergency_access(auth.uid(), patient_id)
  );

CREATE POLICY "Users can update prescriptions based on role"
  ON emr.prescriptions FOR UPDATE
  TO authenticated
  USING (
    -- Doctors can update
    (SELECT role FROM emr.user_profiles WHERE user_id = auth.uid()) = 'doctor'
    OR
    -- Emergency access bypass
    emr.check_emergency_access(auth.uid(), patient_id)
  );

-- =====================================================
-- 4. LAB RESULTS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Allow emergency access to lab_results" ON emr.lab_results;
DROP POLICY IF EXISTS "Users can view lab results based on role" ON emr.lab_results;

CREATE POLICY "Users can view lab results based on role"
  ON emr.lab_results FOR SELECT
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
    -- Lab technician can see all
    (SELECT role FROM emr.user_profiles WHERE user_id = auth.uid()) = 'lab_technician'
    OR
    -- Emergency access bypass
    emr.check_emergency_access(auth.uid(), patient_id)
  );

CREATE POLICY "Users can insert lab results based on role"
  ON emr.lab_results FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Doctors can create
    (SELECT role FROM emr.user_profiles WHERE user_id = auth.uid()) = 'doctor'
    OR
    -- Lab technician can create
    (SELECT role FROM emr.user_profiles WHERE user_id = auth.uid()) = 'lab_technician'
    OR
    -- Emergency access bypass
    emr.check_emergency_access(auth.uid(), patient_id)
  );

-- =====================================================
-- 5. BILLING TABLE
-- =====================================================

DROP POLICY IF EXISTS "Allow emergency access to billing" ON emr.billing;
DROP POLICY IF EXISTS "Users can view billing based on role" ON emr.billing;

CREATE POLICY "Users can view billing based on role"
  ON emr.billing FOR SELECT
  TO authenticated
  USING (
    -- Admin can see all
    (SELECT role FROM emr.user_profiles WHERE user_id = auth.uid()) = 'admin'
    OR
    -- Doctors can see all
    (SELECT role FROM emr.user_profiles WHERE user_id = auth.uid()) = 'doctor'
    OR
    -- Cashier can see all
    (SELECT role FROM emr.user_profiles WHERE user_id = auth.uid()) = 'cashier'
    OR
    -- Receptionist can see all
    (SELECT role FROM emr.user_profiles WHERE user_id = auth.uid()) = 'receptionist'
    OR
    -- Emergency access bypass
    emr.check_emergency_access(auth.uid(), patient_id)
  );

CREATE POLICY "Users can insert billing based on role"
  ON emr.billing FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Cashier can create
    (SELECT role FROM emr.user_profiles WHERE user_id = auth.uid()) = 'cashier'
    OR
    -- Receptionist can create
    (SELECT role FROM emr.user_profiles WHERE user_id = auth.uid()) = 'receptionist'
    OR
    -- Emergency access bypass
    emr.check_emergency_access(auth.uid(), patient_id)
  );

CREATE POLICY "Users can update billing based on role"
  ON emr.billing FOR UPDATE
  TO authenticated
  USING (
    -- Cashier can update
    (SELECT role FROM emr.user_profiles WHERE user_id = auth.uid()) = 'cashier'
    OR
    -- Receptionist can update
    (SELECT role FROM emr.user_profiles WHERE user_id = auth.uid()) = 'receptionist'
    OR
    -- Emergency access bypass
    emr.check_emergency_access(auth.uid(), patient_id)
  );

-- =====================================================
-- 6. MEDICAL HISTORY TABLE (if exists)
-- =====================================================

-- Check if medical_history table exists and update policies
DO $
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'emr' AND table_name = 'medical_history') THEN
    
    EXECUTE 'DROP POLICY IF EXISTS "Allow emergency access to medical_history" ON emr.medical_history';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view medical history based on role" ON emr.medical_history';
    
    EXECUTE '
    CREATE POLICY "Users can view medical history based on role"
      ON emr.medical_history FOR SELECT
      TO authenticated
      USING (
        (SELECT role FROM emr.user_profiles WHERE user_id = auth.uid()) = ''admin''
        OR
        (SELECT role FROM emr.user_profiles WHERE user_id = auth.uid()) = ''doctor''
        OR
        (SELECT role FROM emr.user_profiles WHERE user_id = auth.uid()) = ''nurse''
        OR
        emr.check_emergency_access(auth.uid(), patient_id)
      )';
    
    EXECUTE '
    CREATE POLICY "Users can insert medical history based on role"
      ON emr.medical_history FOR INSERT
      TO authenticated
      WITH CHECK (
        (SELECT role FROM emr.user_profiles WHERE user_id = auth.uid()) = ''doctor''
        OR
        (SELECT role FROM emr.user_profiles WHERE user_id = auth.uid()) = ''nurse''
        OR
        emr.check_emergency_access(auth.uid(), patient_id)
      )';
    
    EXECUTE '
    CREATE POLICY "Users can update medical history based on role"
      ON emr.medical_history FOR UPDATE
      TO authenticated
      USING (
        (SELECT role FROM emr.user_profiles WHERE user_id = auth.uid()) = ''doctor''
        OR
        (SELECT role FROM emr.user_profiles WHERE user_id = auth.uid()) = ''nurse''
        OR
        emr.check_emergency_access(auth.uid(), patient_id)
      )';
  END IF;
END $;

-- =====================================================
-- 7. APPOINTMENTS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Allow emergency access to appointments" ON emr.appointments;
DROP POLICY IF EXISTS "Users can view appointments based on role" ON emr.appointments;

CREATE POLICY "Users can view appointments based on role"
  ON emr.appointments FOR SELECT
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
    -- Emergency access bypass
    emr.check_emergency_access(auth.uid(), patient_id)
  );

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify all policies are created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'emr'
  AND policyname LIKE '%emergency%'
ORDER BY tablename, policyname;

-- Success message
DO $
BEGIN
  RAISE NOTICE '✅ RLS policies updated successfully with emergency access bypass support';
  RAISE NOTICE '📋 Affected tables: patients, consultations, prescriptions, lab_results, billing, medical_history, appointments';
  RAISE NOTICE '🔒 Emergency access requires active session in emergency_access_logs table';
END $;
