-- Migration: Add consultation reference to billing table
-- Feature: consultation-to-billing-handoff
-- Task: 1.3 - Add consultation_id, billed_at, billed_by columns and index

-- Add consultation_id column with foreign key
ALTER TABLE billing 
ADD COLUMN IF NOT EXISTS consultation_id UUID REFERENCES consultations(id);

-- Add billed_at timestamp column
ALTER TABLE billing 
ADD COLUMN IF NOT EXISTS billed_at TIMESTAMP WITH TIME ZONE;

-- Add billed_by column with foreign key to auth.users
ALTER TABLE billing 
ADD COLUMN IF NOT EXISTS billed_by UUID REFERENCES auth.users(id);

-- Create index on consultation_id for performance
CREATE INDEX IF NOT EXISTS idx_billing_consultation 
  ON billing(consultation_id);

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'billing'
  AND column_name IN ('consultation_id', 'billed_at', 'billed_by');
