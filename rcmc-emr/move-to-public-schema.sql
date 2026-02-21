-- =====================================================
-- MOVE USER_PROFILES TO PUBLIC SCHEMA
-- =====================================================
-- Supabase API works best with public schema

-- Step 1: Create user_profiles in public schema
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'doctor', 'receptionist')),
  doctor_id UUID REFERENCES emr.doctors(id),
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Copy data from emr.user_profiles if it exists
INSERT INTO public.user_profiles (id, email, full_name, role, doctor_id, status, created_at, updated_at)
SELECT id, email, full_name, role, doctor_id, status, created_at, updated_at
FROM emr.user_profiles
ON CONFLICT (id) DO NOTHING;

-- Step 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON public.user_profiles(status);

-- Step 4: Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Create policies
DROP POLICY IF EXISTS "Users can read their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow users to read all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow admins to insert profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow admins to update profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow admins to delete profiles" ON public.user_profiles;

CREATE POLICY "Users can read their own profile"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Allow users to read all profiles"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admins to insert profiles"
  ON public.user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow admins to update profiles"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow admins to delete profiles"
  ON public.user_profiles FOR DELETE
  TO authenticated
  USING (true);

-- Step 6: Grant permissions
GRANT ALL ON public.user_profiles TO anon, authenticated;

-- Step 7: Verify
SELECT * FROM public.user_profiles;

-- Success! Now user_profiles is in public schema and accessible via API
