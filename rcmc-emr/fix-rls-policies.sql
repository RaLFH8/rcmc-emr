-- =====================================================
-- FIX RLS POLICIES FOR USER PROFILES
-- =====================================================
-- Run this if you can't login

-- Step 1: Drop existing policies
DROP POLICY IF EXISTS "Users can read their own profile" ON emr.user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON emr.user_profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON emr.user_profiles;

-- Step 2: Create simpler policies that work
CREATE POLICY "Allow users to read their own profile"
  ON emr.user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Allow users to read all profiles"
  ON emr.user_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admins to insert profiles"
  ON emr.user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow admins to update profiles"
  ON emr.user_profiles FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow admins to delete profiles"
  ON emr.user_profiles FOR DELETE
  TO authenticated
  USING (true);

-- Step 3: Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'user_profiles';

-- Step 4: Test query (should return your profile)
SELECT * FROM emr.user_profiles WHERE email = 'admin@rcmc.com';
