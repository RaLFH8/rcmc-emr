-- Fix Supabase Foreign Key Relationship for Doctor Performance Query
-- This fixes the "column doctors_2.name does not exist" error

-- Step 1: Check current foreign key relationships
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('billing', 'consultations')
ORDER BY tc.table_name, kcu.column_name;

-- Step 2: Check if there are multiple foreign keys pointing to doctors table
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    a.attname AS column_name,
    confrelid::regclass AS foreign_table,
    af.attname AS foreign_column
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE c.contype = 'f'
  AND conrelid::regclass::text IN ('billing', 'consultations')
  AND confrelid::regclass::text = 'doctors';

-- Step 3: If the issue persists, you may need to use a different query approach
-- The fix is to explicitly specify the relationship name in the query
-- Update your analyticsService.js getDoctorPerformance function to use:
-- 
-- .select(`
--   amount_paid,
--   consultations!billing_consultation_id_fkey!inner(
--     doctor_id,
--     doctors!consultations_doctor_id_fkey!inner(id, name)
--   )
-- `)
--
-- Replace the constraint names with your actual foreign key constraint names from Step 1
