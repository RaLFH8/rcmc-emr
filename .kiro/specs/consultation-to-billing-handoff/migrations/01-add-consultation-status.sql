-- Migration: Add status tracking to consultations table
-- Feature: consultation-to-billing-handoff
-- Task: 1.1 - Add status column with CHECK constraint, completed_at, completed_by, and indexes

-- Add status column with CHECK constraint
ALTER TABLE consultations 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'in_progress' 
  CHECK (status IN ('in_progress', 'pending_billing', 'billed', 'cancelled'));

-- Add completion tracking columns
ALTER TABLE consultations 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE consultations 
ADD COLUMN IF NOT EXISTS completed_by UUID REFERENCES auth.users(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_consultations_status 
  ON consultations(status);

CREATE INDEX IF NOT EXISTS idx_consultations_completed_at 
  ON consultations(completed_at);

-- Verify the changes
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'consultations'
  AND column_name IN ('status', 'completed_at', 'completed_by');
