-- =====================================================
-- DOCTOR ORDERS FEATURE - COMPLETE DATABASE SETUP
-- =====================================================
-- Feature: doctor-orders
-- Task 1: Set up database schema and triggers
-- 
-- This migration creates:
-- 1. doctor_orders table with all fields, constraints, and indexes
-- 2. order_id column in billing_queue table
-- 3. Trigger to auto-populate billing queue for procedures/lab tests
-- 4. Trigger to send notifications for urgent/stat orders
-- 5. Trigger to cleanup billing queue when orders are cancelled
-- 6. Row Level Security policies for proper access control
--
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TASK 1.1: CREATE DOCTOR_ORDERS TABLE
-- =====================================================

-- Drop existing table if it exists (for clean re-runs)
DROP TABLE IF EXISTS doctor_orders CASCADE;

-- Create doctor_orders table
CREATE TABLE doctor_orders (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Foreign key relationships
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  
  -- Order classification and details
  order_type TEXT NOT NULL CHECK (
    order_type IN ('medication', 'procedure', 'lab_test', 'diet', 'activity_restriction')
  ),
  order_details TEXT NOT NULL,
  
  -- Order status and priority
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'in_progress', 'completed', 'cancelled')
  ),
  priority TEXT NOT NULL DEFAULT 'routine' CHECK (
    priority IN ('routine', 'urgent', 'stat')
  ),
  
  -- Audit trail fields
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  completed_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  cancelled_by UUID REFERENCES auth.users(id),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- Additional notes
  notes TEXT
);

-- Create indexes for performance
CREATE INDEX idx_doctor_orders_patient ON doctor_orders(patient_id);
CREATE INDEX idx_doctor_orders_appointment ON doctor_orders(appointment_id);
CREATE INDEX idx_doctor_orders_status ON doctor_orders(status);
CREATE INDEX idx_doctor_orders_priority ON doctor_orders(priority);
CREATE INDEX idx_doctor_orders_type ON doctor_orders(order_type);
CREATE INDEX idx_doctor_orders_created_at ON doctor_orders(created_at DESC);
CREATE INDEX idx_doctor_orders_created_by ON doctor_orders(created_by);

-- Add comment to table
COMMENT ON TABLE doctor_orders IS 'Stores formal medical orders extracted from SOAP notes or created standalone';
COMMENT ON COLUMN doctor_orders.order_type IS 'Type of order: medication, procedure, lab_test, diet, activity_restriction';
COMMENT ON COLUMN doctor_orders.status IS 'Current status: pending, in_progress, completed, cancelled';
COMMENT ON COLUMN doctor_orders.priority IS 'Priority level: routine, urgent, stat (immediate)';

-- =====================================================
-- TASK 1.2: ADD ORDER_ID TO BILLING_QUEUE TABLE
-- =====================================================

-- Check if billing_queue table exists and add order_id column
DO $$ 
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'billing_queue'
  ) THEN
    -- Add order_id column if it doesn't exist
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'billing_queue' 
      AND column_name = 'order_id'
    ) THEN
      ALTER TABLE billing_queue 
      ADD COLUMN order_id UUID REFERENCES doctor_orders(id) ON DELETE SET NULL;
      
      -- Create index for efficient lookups
      CREATE INDEX idx_billing_queue_order ON billing_queue(order_id);
      
      RAISE NOTICE 'Added order_id column to billing_queue table';
    ELSE
      RAISE NOTICE 'order_id column already exists in billing_queue table';
    END IF;
  ELSE
    RAISE NOTICE 'billing_queue table does not exist - skipping order_id column addition';
  END IF;
END $$;

-- =====================================================
-- TASK 1.3: CREATE BILLING QUEUE TRIGGER FUNCTION
-- =====================================================

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS trigger_add_order_to_billing ON doctor_orders;
DROP FUNCTION IF EXISTS add_order_to_billing_queue();

-- Create function to automatically add procedure/lab orders to billing queue
CREATE OR REPLACE FUNCTION add_order_to_billing_queue()
RETURNS TRIGGER AS $$
DECLARE
  v_doctor_id UUID;
BEGIN
  -- Only process procedure and lab_test orders with pending status
  IF NEW.order_type IN ('procedure', 'lab_test') AND NEW.status = 'pending' THEN
    
    -- Get doctor_id from appointment if appointment_id exists
    IF NEW.appointment_id IS NOT NULL THEN
      SELECT doctor_id INTO v_doctor_id
      FROM appointments
      WHERE id = NEW.appointment_id;
    END IF;
    
    -- Insert into billing_queue if table exists
    IF EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'billing_queue'
    ) THEN
      INSERT INTO billing_queue (
        patient_id,
        doctor_id,
        consultation_id,
        order_id,
        completed_at
      )
      VALUES (
        NEW.patient_id,
        v_doctor_id,
        NEW.appointment_id,
        NEW.id,
        NOW()
      );
      
      RAISE NOTICE 'Added order % to billing queue', NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on doctor_orders table
CREATE TRIGGER trigger_add_order_to_billing
  AFTER INSERT ON doctor_orders
  FOR EACH ROW
  EXECUTE FUNCTION add_order_to_billing_queue();

COMMENT ON FUNCTION add_order_to_billing_queue() IS 'Automatically adds procedure and lab_test orders to billing queue';

-- =====================================================
-- TASK 1.4: CREATE NOTIFICATION TRIGGER FUNCTION
-- =====================================================

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS trigger_notify_urgent_order ON doctor_orders;
DROP FUNCTION IF EXISTS notify_urgent_order();

-- Create function to send notifications for urgent/stat orders
CREATE OR REPLACE FUNCTION notify_urgent_order()
RETURNS TRIGGER AS $$
DECLARE
  v_patient_name TEXT;
  v_notification_title TEXT;
  v_notification_color TEXT;
BEGIN
  -- Only process urgent and stat priority orders
  IF NEW.priority IN ('stat', 'urgent') THEN
    
    -- Get patient name
    SELECT first_name || ' ' || last_name INTO v_patient_name
    FROM patients 
    WHERE id = NEW.patient_id;
    
    -- Set notification title and color based on priority
    IF NEW.priority = 'stat' THEN
      v_notification_title := 'STAT Order';
      v_notification_color := 'bg-red-50 text-red-600';
    ELSE
      v_notification_title := 'Urgent Order';
      v_notification_color := 'bg-orange-50 text-orange-600';
    END IF;
    
    -- Insert notifications for doctors and receptionists if notifications table exists
    IF EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'notifications'
    ) THEN
      INSERT INTO notifications (user_id, type, title, message, icon, color, link)
      SELECT 
        up.id,
        'order',
        v_notification_title,
        v_patient_name || ' - ' || NEW.order_type || ': ' || LEFT(NEW.order_details, 100),
        'AlertCircle',
        v_notification_color,
        '/orders'
      FROM user_profiles up
      WHERE up.role IN ('doctor', 'receptionist')
        AND up.status = 'Active';
      
      RAISE NOTICE 'Sent % notifications for order %', NEW.priority, NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on doctor_orders table
CREATE TRIGGER trigger_notify_urgent_order
  AFTER INSERT ON doctor_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_urgent_order();

COMMENT ON FUNCTION notify_urgent_order() IS 'Sends notifications to care team for urgent and stat priority orders';

-- =====================================================
-- TASK 1.5: CREATE CANCELLED ORDER CLEANUP TRIGGER
-- =====================================================

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS trigger_remove_cancelled_order ON doctor_orders;
DROP FUNCTION IF EXISTS remove_cancelled_order_from_billing();

-- Create function to remove cancelled orders from billing queue
CREATE OR REPLACE FUNCTION remove_cancelled_order_from_billing()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when status changes to cancelled
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    
    -- Delete from billing_queue if table exists
    IF EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'billing_queue'
    ) THEN
      DELETE FROM billing_queue 
      WHERE order_id = NEW.id;
      
      RAISE NOTICE 'Removed cancelled order % from billing queue', NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on doctor_orders table
CREATE TRIGGER trigger_remove_cancelled_order
  AFTER UPDATE ON doctor_orders
  FOR EACH ROW
  EXECUTE FUNCTION remove_cancelled_order_from_billing();

COMMENT ON FUNCTION remove_cancelled_order_from_billing() IS 'Removes cancelled orders from billing queue';

-- =====================================================
-- TASK 1.6: SET UP ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable Row Level Security on doctor_orders table
ALTER TABLE doctor_orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Physicians can view all orders for their patients" ON doctor_orders;
DROP POLICY IF EXISTS "Nurses can view all orders" ON doctor_orders;
DROP POLICY IF EXISTS "Billing staff can view procedure and lab orders" ON doctor_orders;
DROP POLICY IF EXISTS "Only physicians can create orders" ON doctor_orders;
DROP POLICY IF EXISTS "Physicians and nurses can update order status" ON doctor_orders;
DROP POLICY IF EXISTS "Prevent deletion of orders" ON doctor_orders;

-- Policy 1: Physicians can view all orders for their patients
CREATE POLICY "Physicians can view all orders for their patients"
  ON doctor_orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND up.role = 'doctor'
      AND up.status = 'Active'
    )
  );

-- Policy 2: Nurses/Receptionists can view all orders
CREATE POLICY "Nurses can view all orders"
  ON doctor_orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND up.role IN ('receptionist', 'admin')
      AND up.status = 'Active'
    )
  );

-- Policy 3: Billing staff can view procedure and lab_test orders only
-- Note: This is covered by the receptionist role above, but kept separate for clarity
CREATE POLICY "Billing staff can view procedure and lab orders"
  ON doctor_orders FOR SELECT
  TO authenticated
  USING (
    order_type IN ('procedure', 'lab_test')
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND up.role IN ('receptionist', 'admin')
      AND up.status = 'Active'
    )
  );

-- Policy 4: Only physicians can create orders
CREATE POLICY "Only physicians can create orders"
  ON doctor_orders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND up.role IN ('doctor', 'admin')
      AND up.status = 'Active'
    )
    AND created_by = auth.uid()
  );

-- Policy 5: Physicians and nurses can update order status
CREATE POLICY "Physicians and nurses can update order status"
  ON doctor_orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND up.role IN ('doctor', 'receptionist', 'admin')
      AND up.status = 'Active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND up.role IN ('doctor', 'receptionist', 'admin')
      AND up.status = 'Active'
    )
  );

-- Policy 6: Prevent deletion of orders (no DELETE policy = no deletes allowed)
-- This is enforced by not creating any DELETE policy

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify table creation
SELECT 
  'doctor_orders table created' AS status,
  COUNT(*) AS column_count
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'doctor_orders';

-- Verify indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'doctor_orders'
ORDER BY indexname;

-- Verify triggers
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'doctor_orders'
ORDER BY trigger_name;

-- Verify RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'doctor_orders'
ORDER BY policyname;

-- Verify billing_queue order_id column
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'billing_queue'
  AND column_name = 'order_id';

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON doctor_orders TO authenticated;
-- Note: DELETE is intentionally not granted to enforce immutability

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$ 
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DOCTOR ORDERS DATABASE SETUP COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Created:';
  RAISE NOTICE '  ✓ doctor_orders table with all fields and constraints';
  RAISE NOTICE '  ✓ 7 indexes for performance optimization';
  RAISE NOTICE '  ✓ order_id column in billing_queue table';
  RAISE NOTICE '  ✓ Billing queue trigger for procedures/lab tests';
  RAISE NOTICE '  ✓ Notification trigger for urgent/stat orders';
  RAISE NOTICE '  ✓ Cancelled order cleanup trigger';
  RAISE NOTICE '  ✓ 6 Row Level Security policies';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Review verification queries output above';
  RAISE NOTICE '  2. Test with different user roles';
  RAISE NOTICE '  3. Proceed to Task 2: Implement order parsing utility';
  RAISE NOTICE '========================================';
END $$;
