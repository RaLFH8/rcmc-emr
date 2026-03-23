-- =====================================================
-- Patient Satisfaction Survey - Database Migration
-- File: 05-create-rls-policies.sql
-- =====================================================

-- Enable Row Level Security on satisfaction_ratings table
ALTER TABLE satisfaction_ratings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous users to insert survey responses
CREATE POLICY "Allow anonymous survey submissions"
ON satisfaction_ratings
FOR INSERT
TO anon
WITH CHECK (true);

-- Policy: Allow authenticated users to insert survey responses
CREATE POLICY "Allow authenticated survey submissions"
ON satisfaction_ratings
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Prevent doctors from viewing raw submission data
CREATE POLICY "Doctors cannot view raw ratings"
ON satisfaction_ratings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('admin', 'owner')
  )
);

-- Policy: Allow admin and owner roles to view all ratings
CREATE POLICY "Admins and owners can view all ratings"
ON satisfaction_ratings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('admin', 'owner')
  )
);

-- Add comments
COMMENT ON POLICY "Allow anonymous survey submissions" ON satisfaction_ratings IS 'Allows public survey submissions without authentication';
COMMENT ON POLICY "Doctors cannot view raw ratings" ON satisfaction_ratings IS 'Prevents doctors from accessing individual survey responses to maintain patient anonymity';
COMMENT ON POLICY "Admins and owners can view all ratings" ON satisfaction_ratings IS 'Allows administrators to view all survey responses for analysis';
