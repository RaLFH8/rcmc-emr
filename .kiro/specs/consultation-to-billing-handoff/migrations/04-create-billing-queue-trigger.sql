-- Migration: Create trigger for automatic billing queue entry
-- Feature: consultation-to-billing-handoff
-- Task: 1.4 - Create function and trigger to auto-populate billing_queue

-- Drop existing function and trigger if they exist
DROP TRIGGER IF EXISTS trigger_create_billing_queue ON consultations;
DROP FUNCTION IF EXISTS create_billing_queue_entry();

-- Function to automatically create billing queue entry
CREATE OR REPLACE FUNCTION create_billing_queue_entry()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create queue entry when status changes to pending_billing
  IF NEW.status = 'pending_billing' AND (OLD.status IS NULL OR OLD.status != 'pending_billing') THEN
    INSERT INTO billing_queue (
      consultation_id,
      patient_id,
      doctor_id,
      consultation_date,
      completed_at
    ) VALUES (
      NEW.id,
      NEW.patient_id,
      NEW.doctor_id,
      NEW.consultation_date,
      NEW.completed_at
    )
    ON CONFLICT (consultation_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on consultations table
CREATE TRIGGER trigger_create_billing_queue
  AFTER INSERT OR UPDATE ON consultations
  FOR EACH ROW
  EXECUTE FUNCTION create_billing_queue_entry();

-- Verify the trigger was created
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public' 
  AND trigger_name = 'trigger_create_billing_queue';
