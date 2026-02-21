-- =====================================================
-- CREATE MULTIPLE DOCTOR ACCOUNTS
-- =====================================================
-- This script creates login credentials for all 4 doctors in the system
-- Run this AFTER creating users in Supabase Authentication

-- STEP 1: Create users in Supabase Authentication UI
-- Go to Authentication → Users → Add User for each doctor:
--
-- Doctor 1: Dr. Ashlynn Kenter
--   Email: dr.kenter@rcmc.com
--   Password: doctor123
--   ✓ Auto Confirm User
--
-- Doctor 2: Dr. Charlie Gouse
--   Email: dr.gouse@rcmc.com
--   Password: doctor123
--   ✓ Auto Confirm User
--
-- Doctor 3: Dr. Justin Bergson
--   Email: dr.bergson@rcmc.com
--   Password: doctor123
--   ✓ Auto Confirm User
--
-- Doctor 4: Dr. Madelyn Geldt
--   Email: dr.geldt@rcmc.com
--   Password: doctor123
--   ✓ Auto Confirm User

-- STEP 2: Get all doctor IDs from the doctors table
SELECT 
  id,
  first_name,
  last_name,
  email,
  specialization
FROM emr.doctors
ORDER BY last_name;

-- STEP 3: Create user profiles for each doctor
-- Replace the UUIDs with actual user IDs from Authentication → Users

-- Dr. Ashlynn Kenter (General Practitioner)
INSERT INTO emr.user_profiles (id, email, full_name, role, doctor_id, status)
VALUES (
  'PASTE_KENTER_AUTH_UUID_HERE',
  'dr.kenter@rcmc.com',
  'Dr. Ashlynn Kenter',
  'doctor',
  (SELECT id FROM emr.doctors WHERE email = 'dr.kenter@rcmc.com'),
  'Active'
);

-- Dr. Charlie Gouse (Pediatrician)
INSERT INTO emr.user_profiles (id, email, full_name, role, doctor_id, status)
VALUES (
  'PASTE_GOUSE_AUTH_UUID_HERE',
  'dr.gouse@rcmc.com',
  'Dr. Charlie Gouse',
  'doctor',
  (SELECT id FROM emr.doctors WHERE email = 'dr.gouse@rcmc.com'),
  'Active'
);

-- Dr. Justin Bergson (Cardiologist)
INSERT INTO emr.user_profiles (id, email, full_name, role, doctor_id, status)
VALUES (
  'PASTE_BERGSON_AUTH_UUID_HERE',
  'dr.bergson@rcmc.com',
  'Dr. Justin Bergson',
  'doctor',
  (SELECT id FROM emr.doctors WHERE email = 'dr.bergson@rcmc.com'),
  'Active'
);

-- Dr. Madelyn Geldt (Dermatologist)
INSERT INTO emr.user_profiles (id, email, full_name, role, doctor_id, status)
VALUES (
  'PASTE_GELDT_AUTH_UUID_HERE',
  'dr.geldt@rcmc.com',
  'Dr. Madelyn Geldt',
  'doctor',
  (SELECT id FROM emr.doctors WHERE email = 'dr.geldt@rcmc.com'),
  'Active'
);

-- STEP 4: Verify all doctor accounts
SELECT 
  up.email,
  up.full_name,
  up.role,
  up.status,
  d.first_name || ' ' || d.last_name as doctor_name,
  d.specialization
FROM emr.user_profiles up
INNER JOIN emr.doctors d ON up.doctor_id = d.id
WHERE up.role = 'doctor'
ORDER BY d.last_name;

-- Expected result: 4 rows showing all doctors with their credentials

-- STEP 5: Test login credentials
-- Try logging in with each doctor account:
-- - dr.kenter@rcmc.com / doctor123
-- - dr.gouse@rcmc.com / doctor123
-- - dr.bergson@rcmc.com / doctor123
-- - dr.geldt@rcmc.com / doctor123
