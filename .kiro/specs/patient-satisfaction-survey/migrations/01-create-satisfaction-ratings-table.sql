-- =====================================================
-- Patient Satisfaction Survey - Database Migration
-- File: 01-create-satisfaction-ratings-table.sql
-- =====================================================

-- Create satisfaction_ratings table
CREATE TABLE IF NOT EXISTS satisfaction_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  professionalism_rating INTEGER NOT NULL CHECK (professionalism_rating BETWEEN 1 AND 5),
  waiting_time_rating INTEGER NOT NULL CHECK (waiting_time_rating BETWEEN 1 AND 5),
  cleanliness_rating INTEGER NOT NULL CHECK (cleanliness_rating BETWEEN 1 AND 5),
  comments TEXT,
  sentiment_score INTEGER DEFAULT 0,
  sentiment_classification TEXT CHECK (sentiment_classification IN ('Positive', 'Neutral', 'Negative')),
  submitter_fingerprint TEXT NOT NULL,
  submitter_ip TEXT,
  submission_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_satisfaction_doctor ON satisfaction_ratings(doctor_id);
CREATE INDEX IF NOT EXISTS idx_satisfaction_timestamp ON satisfaction_ratings(submission_timestamp);
CREATE INDEX IF NOT EXISTS idx_satisfaction_fingerprint ON satisfaction_ratings(submitter_fingerprint, submission_timestamp);

-- Add comment to table
COMMENT ON TABLE satisfaction_ratings IS 'Stores patient satisfaction survey responses with ratings and comments';
