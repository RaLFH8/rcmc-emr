-- =====================================================
-- ANALYTICS DASHBOARD DATABASE SETUP
-- =====================================================
-- This migration creates the dashboard_config table and inserts
-- baseline metrics for performance comparison and expense budgets.
-- Run this in your Supabase SQL Editor.

-- =====================================================
-- CREATE DASHBOARD_CONFIG TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS emr.dashboard_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  config_key TEXT UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups by config_key
CREATE INDEX IF NOT EXISTS idx_dashboard_config_key ON emr.dashboard_config(config_key);

-- Enable RLS on dashboard_config table
ALTER TABLE emr.dashboard_config ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read dashboard config
CREATE POLICY "All authenticated users can read dashboard config"
  ON emr.dashboard_config FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only admins can insert/update dashboard config
CREATE POLICY "Admins can manage dashboard config"
  ON emr.dashboard_config FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM emr.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- INSERT BASELINE METRICS FOR PERFORMANCE COMPARISON
-- =====================================================

-- Insert baseline performance metrics (average hospital benchmarks)
-- These values are used in the Performance Comparison radar chart
INSERT INTO emr.dashboard_config (config_key, config_value, description) VALUES
('baseline_metrics', '{
  "patientSatisfaction": 4.2,
  "recoveryRate": 4.5,
  "emergencyResponse": 3.8,
  "followUpRate": 4.0,
  "treatmentSuccess": 4.3
}'::jsonb, 'Baseline performance metrics for comparison (0-5 scale)')
ON CONFLICT (config_key) DO UPDATE
SET config_value = EXCLUDED.config_value,
    updated_at = NOW();

-- =====================================================
-- INSERT EXPENSE BUDGET CONFIGURATION
-- =====================================================

-- Insert expense budget values for categories not tracked in inventory
-- These are used in the Expense Breakdown chart
INSERT INTO emr.dashboard_config (config_key, config_value, description) VALUES
('expense_budgets', '{
  "staff_salaries": 500000,
  "operational_costs": 200000
}'::jsonb, 'Monthly expense budgets for non-inventory categories (in PHP)')
ON CONFLICT (config_key) DO UPDATE
SET config_value = EXCLUDED.config_value,
    updated_at = NOW();

-- =====================================================
-- VERIFY AND CREATE INDEXES ON DATE COLUMNS
-- =====================================================

-- These indexes are critical for analytics query performance
-- Most should already exist from the base schema, but we verify them here

-- Patients table - created_at index
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON emr.patients(created_at);

-- Billing table - created_at and bill_date indexes
CREATE INDEX IF NOT EXISTS idx_billing_created_at ON emr.billing(created_at);
CREATE INDEX IF NOT EXISTS idx_billing_date ON emr.billing(bill_date);

-- Consultations table - consultation_date index
CREATE INDEX IF NOT EXISTS idx_consultations_date ON emr.consultations(consultation_date);

-- Appointments table - appointment_date index
CREATE INDEX IF NOT EXISTS idx_appointments_date ON emr.appointments(appointment_date);

-- Satisfaction ratings table - created_at index (if table exists)
-- Note: This table may be created by another spec
CREATE INDEX IF NOT EXISTS idx_satisfaction_created_at ON emr.satisfaction_ratings(created_at);

-- Inventory table - created_at and updated_at indexes
CREATE INDEX IF NOT EXISTS idx_inventory_created_at ON emr.inventory(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_updated_at ON emr.inventory(updated_at);

-- =====================================================
-- CREATE TRIGGER FOR UPDATED_AT
-- =====================================================

-- Trigger to automatically update updated_at timestamp
CREATE TRIGGER update_dashboard_config_updated_at
  BEFORE UPDATE ON emr.dashboard_config
  FOR EACH ROW
  EXECUTE FUNCTION emr.update_updated_at_column();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify dashboard_config table was created
SELECT 
  'dashboard_config table created' AS status,
  COUNT(*) AS config_count
FROM emr.dashboard_config;

-- Verify baseline metrics were inserted
SELECT 
  'baseline_metrics' AS config_key,
  config_value
FROM emr.dashboard_config
WHERE config_key = 'baseline_metrics';

-- Verify expense budgets were inserted
SELECT 
  'expense_budgets' AS config_key,
  config_value
FROM emr.dashboard_config
WHERE config_key = 'expense_budgets';

-- Verify indexes exist on date columns
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'emr'
  AND (
    indexname LIKE '%_date%' OR
    indexname LIKE '%created_at%' OR
    indexname LIKE '%updated_at%'
  )
ORDER BY tablename, indexname;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Display success message
DO $$
BEGIN
  RAISE NOTICE '✓ Dashboard configuration table created successfully';
  RAISE NOTICE '✓ Baseline metrics inserted';
  RAISE NOTICE '✓ Expense budgets configured';
  RAISE NOTICE '✓ Date column indexes verified';
  RAISE NOTICE '';
  RAISE NOTICE 'Analytics dashboard database setup complete!';
END $$;
