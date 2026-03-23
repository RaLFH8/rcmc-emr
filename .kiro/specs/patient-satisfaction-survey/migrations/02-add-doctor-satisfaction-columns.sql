-- =====================================================
-- Patient Satisfaction Survey - Database Migration
-- File: 02-add-doctor-satisfaction-columns.sql
-- Task 1.2: Add satisfaction metrics columns to doctors table
-- =====================================================

-- Add satisfaction_score column to doctors table
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS satisfaction_score DECIMAL(3,2) 
CHECK (satisfaction_score >= 1.00 AND satisfaction_score <= 5.00);

-- Add total_reviews column to doctors table
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- Create index on satisfaction_score for sorting
CREATE INDEX IF NOT EXISTS idx_doctors_satisfaction_score ON doctors(satisfaction_score DESC);

-- Add comments
COMMENT ON COLUMN doctors.satisfaction_score IS 'Average satisfaction score (1.00-5.00) calculated from survey responses';
COMMENT ON COLUMN doctors.total_reviews IS 'Total number of satisfaction survey responses received';
