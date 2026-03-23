-- =====================================================
-- Patient Satisfaction Survey - Database Migration
-- File: 05-setup-rls-policies.sql
-- Task 1.5: Set up Row Level Security policies
-- =====================================================

-- Enable RLS on satisfaction_ratings table
ALTER TABLE satisfaction_ratings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous inserts (for public survey submissions)
DROP POLICY IF EXISTS "Allow anonymous survey submissions" ON satisfaction_ratings;
CREATE POLICY "Allow anonymous survey submissions"
ON satisfaction_ratings
FOR INSERT
TO public
WITH CHECK (true);

-- Policy: Prevent doctors from querying satisfaction_ratings directly
-- (They can only see aggregated data through the doctors table)
DROP POLICY IF EXISTS "Doctors cannot view raw survey data" ON satisfaction_ratings;
CREATE POLICY "Doctors cannot view raw survey data"
ON satisfaction_ratings
FOR SELECT
TO authenticated
USING (
  NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'doctor'
  )
);

-- Policy: Allow admin/owner roles to query all satisfaction_ratings
DROP POLICY IF EXISTS "Admins and owners can view all survey data" ON satisfaction_ratings;
CREATE POLICY "Admins and owners can view all survey data"
ON satisfaction_ratings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role IN ('admin', 'owner')
  )
);

-- Policy: Allow all authenticated users to read doctors table
-- (This ensures satisfaction scores are visible to all staff)
DROP POLICY IF EXISTS "All authenticated users can read doctors" ON doctors;
CREATE POLICY "All authenticated users can read doctors"
ON doctors
FOR SELECT
TO authenticated
USING (true);

-- Add comments
COMMENT ON POLICY "Allow anonymous survey submissions" ON satisfaction_ratings IS 'Allows public survey submissions without authentication';
COMMENT ON POLICY "Doctors cannot view raw survey data" ON satisfaction_ratings IS 'Prevents doctors from viewing individual survey responses';
COMMENT ON POLICY "Admins and owners can view all survey data" ON satisfaction_ratings IS 'Allows admin and owner roles to view all survey responses';
COMMENT ON POLICY "All authenticated users can read doctors" ON doctors IS 'Allows all staff to view doctor information including satisfaction scores';
