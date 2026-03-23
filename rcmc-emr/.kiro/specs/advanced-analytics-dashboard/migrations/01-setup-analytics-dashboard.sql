-- =====================================================
-- Advanced Analytics Dashboard - Database Migration
-- =====================================================
-- This script sets up the database schema and performance 
-- indexes for the advanced analytics dashboard feature.
--
-- Run this in Supabase SQL Editor before starting implementation.
-- =====================================================

-- =====================================================
-- 1. CREATE DASHBOARD_CONFIG TABLE
-- =====================================================
-- Stores dashboard configuration including baseline metrics 
-- and expense budget allocations

CREATE TABLE IF NOT EXISTS dashboard_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  schema_version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment to table
COMMENT ON TABLE dashboard_config IS 'Stores dashboard configuration including baseline comparison values and expense budgets';

-- =====================================================
-- 2. INSERT DEFAULT CONFIGURATION DATA
-- =====================================================

-- Insert default baseline metrics for performance comparison
INSERT INTO dashboard_config (config_key, config_value)
VALUES (
  'baseline_metrics',
  '{
    "patientSatisfaction": 4.2,
    "recoveryRate": 4.5,
    "emergencyResponse": 3.8,
    "followUpRate": 4.0,
    "treatmentSuccess": 4.3
  }'::jsonb
)
ON CONFLICT (config_key) DO NOTHING;

-- Insert default expense budgets
INSERT INTO dashboard_config (config_key, config_value)
VALUES (
  'expense_budgets',
  '{
    "staff_salaries": 500000,
    "operational_costs": 200000
  }'::jsonb
)
ON CONFLICT (config_key) DO NOTHING;

-- =====================================================
-- 3. CREATE PERFORMANCE INDEXES
-- =====================================================
-- These indexes optimize dashboard queries for faster loading

-- Billing table indexes
CREATE INDEX IF NOT EXISTS idx_billing_created_at 
  ON billing(created_at);

CREATE INDEX IF NOT EXISTS idx_billing_payment_status 
  ON billing(payment_status);

CREATE INDEX IF NOT EXISTS idx_billing_created_status 
  ON billing(created_at, payment_status);

-- Consultations table indexes
CREATE INDEX IF NOT EXISTS idx_consultations_date 
  ON consultations(consultation_date);

CREATE INDEX IF NOT EXISTS idx_consultations_doctor_id 
  ON consultations(doctor_id);

CREATE INDEX IF NOT EXISTS idx_consultations_date_doctor 
  ON consultations(consultation_date, doctor_id);

-- Appointments table indexes
CREATE INDEX IF NOT EXISTS idx_appointments_date 
  ON appointments(appointment_date);

CREATE INDEX IF NOT EXISTS idx_appointments_type 
  ON appointments(appointment_type);

CREATE INDEX IF NOT EXISTS idx_appointments_status 
  ON appointments(status);

-- Satisfaction ratings table indexes
CREATE INDEX IF NOT EXISTS idx_satisfaction_created_at 
  ON satisfaction_ratings(created_at);

-- Patients table indexes
CREATE INDEX IF NOT EXISTS idx_patients_created_at 
  ON patients(created_at);

CREATE INDEX IF NOT EXISTS idx_patients_status 
  ON patients(status);

-- Inventory table indexes (for expense calculations)
CREATE INDEX IF NOT EXISTS idx_inventory_created_at 
  ON inventory(created_at);

CREATE INDEX IF NOT EXISTS idx_inventory_category 
  ON inventory(category);

-- Doctors table indexes
CREATE INDEX IF NOT EXISTS idx_doctors_specialization 
  ON doctors(specialization);

-- =====================================================
-- 4. CREATE UPDATED_AT TRIGGER
-- =====================================================
-- Automatically update the updated_at timestamp

CREATE OR REPLACE FUNCTION update_dashboard_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_dashboard_config_updated_at
  BEFORE UPDATE ON dashboard_config
  FOR EACH ROW
  EXECUTE FUNCTION update_dashboard_config_updated_at();

-- =====================================================
-- 5. VERIFY INSTALLATION
-- =====================================================
-- Check that everything was created successfully

DO $$
DECLARE
  config_count INTEGER;
  index_count INTEGER;
BEGIN
  -- Check dashboard_config table
  SELECT COUNT(*) INTO config_count 
  FROM dashboard_config;
  
  RAISE NOTICE 'Dashboard config table created with % records', config_count;
  
  -- Check indexes
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE indexname LIKE 'idx_%'
    AND schemaname = 'public';
  
  RAISE NOTICE 'Created % performance indexes', index_count;
  
  IF config_count >= 2 THEN
    RAISE NOTICE '✓ Migration completed successfully!';
  ELSE
    RAISE WARNING '⚠ Configuration data may not have been inserted correctly';
  END IF;
END $$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- You can now proceed with the frontend implementation.
-- 
-- Next steps:
-- 1. Install dependencies: npm install recharts jspdf xlsx html2canvas
-- 2. Start implementing Task 2: Analytics Service Layer
-- =====================================================
