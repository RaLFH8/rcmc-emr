-- =====================================================
-- ADD USER_PROFILES FOREIGN KEY TO DOCTOR_ORDERS
-- =====================================================
-- This migration adds a foreign key relationship between
-- doctor_orders and user_profiles table to enable proper
-- joins in the application code.
--
-- Run this in Supabase SQL Editor AFTER running the main migration
-- =====================================================

-- Add foreign key constraint from doctor_orders.created_by to user_profiles.id
-- This assumes user_profiles.id references auth.users.id
DO $$
BEGIN
  -- Check if the constraint doesn't already exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'doctor_orders_created_by_user_profiles_fkey'
    AND table_name = 'doctor_orders'
  ) THEN
    -- Add the foreign key constraint
    ALTER TABLE doctor_orders
    ADD CONSTRAINT doctor_orders_created_by_user_profiles_fkey
    FOREIGN KEY (created_by) REFERENCES user_profiles(id);
    
    RAISE NOTICE 'Added foreign key constraint: doctor_orders_created_by_user_profiles_fkey';
  ELSE
    RAISE NOTICE 'Foreign key constraint already exists: doctor_orders_created_by_user_profiles_fkey';
  END IF;
  
  -- Add similar constraints for completed_by and cancelled_by
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'doctor_orders_completed_by_user_profiles_fkey'
    AND table_name = 'doctor_orders'
  ) THEN
    ALTER TABLE doctor_orders
    ADD CONSTRAINT doctor_orders_completed_by_user_profiles_fkey
    FOREIGN KEY (completed_by) REFERENCES user_profiles(id);
    
    RAISE NOTICE 'Added foreign key constraint: doctor_orders_completed_by_user_profiles_fkey';
  ELSE
    RAISE NOTICE 'Foreign key constraint already exists: doctor_orders_completed_by_user_profiles_fkey';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'doctor_orders_cancelled_by_user_profiles_fkey'
    AND table_name = 'doctor_orders'
  ) THEN
    ALTER TABLE doctor_orders
    ADD CONSTRAINT doctor_orders_cancelled_by_user_profiles_fkey
    FOREIGN KEY (cancelled_by) REFERENCES user_profiles(id);
    
    RAISE NOTICE 'Added foreign key constraint: doctor_orders_cancelled_by_user_profiles_fkey';
  ELSE
    RAISE NOTICE 'Foreign key constraint already exists: doctor_orders_cancelled_by_user_profiles_fkey';
  END IF;
END $$;

-- Verify the constraints were added
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'doctor_orders'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'user_profiles';

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$ 
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'USER_PROFILES FOREIGN KEY SETUP COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Added foreign key constraints:';
  RAISE NOTICE '  ✓ doctor_orders.created_by → user_profiles.id';
  RAISE NOTICE '  ✓ doctor_orders.completed_by → user_profiles.id';
  RAISE NOTICE '  ✓ doctor_orders.cancelled_by → user_profiles.id';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'The application can now join doctor_orders with user_profiles';
  RAISE NOTICE '========================================';
END $$;
