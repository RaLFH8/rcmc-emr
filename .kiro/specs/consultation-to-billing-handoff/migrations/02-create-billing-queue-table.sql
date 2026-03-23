-- Migration: Create billing_queue table with RLS policies
-- Feature: consultation-to-billing-handoff
-- Task: 1.2 - Create billing_queue table with all columns, constraints, indexes, and RLS policies

-- Create billing_queue table
CREATE TABLE IF NOT EXISTS billing_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  consultation_date TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  processing_by UUID REFERENCES auth.users(id),
  processing_started_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(consultation_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_billing_queue_patient 
  ON billing_queue(patient_id);

CREATE INDEX IF NOT EXISTS idx_billing_queue_completed_at 
  ON billing_queue(completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_billing_queue_processing 
  ON billing_queue(processing_by);

-- Enable Row Level Security
ALTER TABLE billing_queue ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "All authenticated users can read billing queue" ON billing_queue;
DROP POLICY IF EXISTS "Receptionists and admins can update billing queue" ON billing_queue;
DROP POLICY IF EXISTS "System can insert into billing queue" ON billing_queue;
DROP POLICY IF EXISTS "System can delete from billing queue" ON billing_queue;

-- Policy: All authenticated users can read billing queue
CREATE POLICY "All authenticated users can read billing queue"
  ON billing_queue FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Receptionists and admins can update billing queue (for locking)
CREATE POLICY "Receptionists and admins can update billing queue"
  ON billing_queue FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'receptionist')
    )
  );

-- Policy: System can insert into billing queue (via trigger)
CREATE POLICY "System can insert into billing queue"
  ON billing_queue FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Receptionists and admins can delete from billing queue
CREATE POLICY "System can delete from billing queue"
  ON billing_queue FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'receptionist')
    )
  );

-- Verify the table was created
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'billing_queue'
ORDER BY ordinal_position;
