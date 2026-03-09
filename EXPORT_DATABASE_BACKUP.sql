-- ============================================
-- EXPORT DATABASE BACKUP (FREE TIER METHOD)
-- Copy this output and save it as a file
-- ============================================

-- This script exports your data as INSERT statements
-- Run this in Supabase SQL Editor and save the output

-- ============================================
-- EXPORT ALL TABLE DATA
-- ============================================

-- Export patients
SELECT 'INSERT INTO patients (id, patient_number, first_name, last_name, date_of_birth, gender, contact_number, email, address, emergency_contact_name, emergency_contact_number, blood_type, allergies, medical_history, status, created_at, updated_at) VALUES ' ||
  string_agg(
    '(''' || id || ''', ''' || patient_number || ''', ''' || first_name || ''', ''' || last_name || ''', ''' || date_of_birth || ''', ''' || gender || ''', ''' || contact_number || ''', ' ||
    COALESCE('''' || email || '''', 'NULL') || ', ''' || address || ''', ''' || emergency_contact_name || ''', ''' || emergency_contact_number || ''', ' ||
    COALESCE('''' || blood_type || '''', 'NULL') || ', ' ||
    COALESCE('ARRAY[' || array_to_string(allergies, ',') || ']', 'NULL') || ', ' ||
    COALESCE('''' || medical_history || '''', 'NULL') || ', ''' || status || ''', ''' || created_at || ''', ''' || updated_at || ''')',
    ', '
  ) || ';'
FROM patients;

-- Export doctors
SELECT 'INSERT INTO doctors (id, first_name, last_name, specialization, license_number, ptr_number, s2_number, contact_number, email, consultation_fee, schedule, status, created_at) VALUES ' ||
  string_agg(
    '(''' || id || ''', ''' || first_name || ''', ''' || last_name || ''', ''' || specialization || ''', ''' || license_number || ''', ' ||
    COALESCE('''' || ptr_number || '''', 'NULL') || ', ' ||
    COALESCE('''' || s2_number || '''', 'NULL') || ', ''' || contact_number || ''', ''' || email || ''', ' ||
    COALESCE(consultation_fee::text, 'NULL') || ', ' ||
    COALESCE('''' || schedule || '''', 'NULL') || ', ''' || status || ''', ''' || created_at || ''')',
    ', '
  ) || ';'
FROM doctors;

-- Export appointments
SELECT 'INSERT INTO appointments (id, patient_id, doctor_id, appointment_date, appointment_time, status, appointment_type, reason, notes, created_at, updated_at) VALUES ' ||
  string_agg(
    '(''' || id || ''', ''' || patient_id || ''', ''' || doctor_id || ''', ''' || appointment_date || ''', ''' || appointment_time || ''', ''' || status || ''', ' ||
    COALESCE('''' || appointment_type || '''', 'NULL') || ', ' ||
    COALESCE('''' || reason || '''', 'NULL') || ', ' ||
    COALESCE('''' || notes || '''', 'NULL') || ', ''' || created_at || ''', ''' || updated_at || ''')',
    ', '
  ) || ';'
FROM appointments;

-- Export user_profiles
SELECT 'INSERT INTO user_profiles (id, email, full_name, role, status, created_at, updated_at) VALUES ' ||
  string_agg(
    '(''' || id || ''', ''' || email || ''', ''' || full_name || ''', ''' || role || ''', ''' || status || ''', ''' || created_at || ''', ''' || updated_at || ''')',
    ', '
  ) || ';'
FROM user_profiles;

-- ============================================
-- SAVE THIS OUTPUT TO A FILE
-- ============================================
-- 1. Run this script in Supabase SQL Editor
-- 2. Copy all the INSERT statements from the output
-- 3. Save to: backups/database-backup-feb-26-2026.sql
-- 4. Keep this file safe!
-- ============================================
