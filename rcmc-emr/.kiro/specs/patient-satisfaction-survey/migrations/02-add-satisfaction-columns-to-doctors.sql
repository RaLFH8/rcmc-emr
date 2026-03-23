-- =====================================================
-- Patient Satisfaction Survey - Database Migration
-- File: 02-add-satisfaction-columns-to-doctors.sql
-- =====================================================

-- Add satisfaction metrics columns to doctors table
ALTER TABLE doctors
ADD COLUMN IF NOT EXISTS satisfaction_score DECIMAL(3,2) CHECK (satisfaction_score >= 1.00 AND satisfaction_score <= 5.00),
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- Create index for sorting by satisfaction score
CREATE INDEX IF NOT EXISTS idx_doctors_satisfaction ON doctors(satisfaction_score DESC) WHERE satisfaction_score IS NOT NULL;

-- Add comments
COMMENT ON COLUMN doctors.satisfaction_score IS 'Average satisfaction score (1.00-5.00) calculated from all patient ratings';
COMMENT ON COLUMN doctors.total_reviews IS 'Total number of satisfaction survey responses received';
