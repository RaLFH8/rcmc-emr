-- =====================================================
-- CREATE TEST USER PROFILES
-- =====================================================
-- Run this AFTER creating users in Supabase Authentication
-- Replace the UUIDs with actual user IDs from Auth → Users

-- STEP 1: Get the doctor ID for linking
-- Run this first to see available doctors:
SELECT id, first_name, last_name, email FROM emr.doctors;

-- STEP 2: Create user profiles
-- Replace 'YOUR_ADMIN_UUID', 'YOUR_DOCTOR_UUID', 'YOUR_RECEPTIONIST_UUID' 
-- with actual UUIDs from Authentication → Users page

-- Admin Profile
INSERT INTO emr.user_profiles (id, email, full_name, role, status)
VALUES (
  'YOUR_ADMIN_UUID',  -- Replace with actual UUID
  'admin@rcmc.com',
  'Admin User',
  'admin',
  'Active'
);

-- Doctor Profile (linked to Dr. Ashlynn Kenter)
INSERT INTO emr.user_profiles (id, email, full_name, role, doctor_id, status)
VALUES (
  'YOUR_DOCTOR_UUID',  -- Replace with actual UUID
  'doctor@rcmc.com',
  'Dr. Ashlynn Kenter',
  'doctor',
  (SELECT id FROM emr.doctors WHERE email = 'dr.kenter@rcmc.com' LIMIT 1),
  'Active'
);

-- Receptionist Profile
INSERT INTO emr.user_profiles (id, email, full_name, role, status)
VALUES (
  'YOUR_RECEPTIONIST_UUID',  -- Replace with actual UUID
  'receptionist@rcmc.com',
  'Maria Santos',
  'receptionist',
  'Active'
);

-- STEP 3: Verify the profiles were created
SELECT 
  up.id,
  up.email,
  up.full_name,
  up.role,
  up.status,
  CASE 
    WHEN d.id IS NOT NULL THEN d.first_name || ' ' || d.last_name
    ELSE 'N/A'
  END as linked_doctor
FROM emr.user_profiles up
LEFT JOIN emr.doctors d ON up.doctor_id = d.id
ORDER BY up.role;

-- Expected result: 3 rows showing admin, doctor, and receptionist
