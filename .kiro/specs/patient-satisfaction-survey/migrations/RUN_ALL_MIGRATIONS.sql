-- =====================================================
-- Patient Satisfaction Survey - Complete Database Migration
-- Run this file in Supabase SQL Editor to set up all database changes
-- =====================================================

-- MIGRATION 01: Create satisfaction_ratings table
-- =====================================================
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

CREATE INDEX IF NOT EXISTS idx_satisfaction_doctor ON satisfaction_ratings(doctor_id);
CREATE INDEX IF NOT EXISTS idx_satisfaction_timestamp ON satisfaction_ratings(submission_timestamp);
CREATE INDEX IF NOT EXISTS idx_satisfaction_fingerprint ON satisfaction_ratings(submitter_fingerprint, submission_timestamp);

COMMENT ON TABLE satisfaction_ratings IS 'Stores patient satisfaction survey responses with ratings and comments';


-- MIGRATION 02: Add satisfaction metrics columns to doctors table
-- =====================================================
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS satisfaction_score DECIMAL(3,2) 
CHECK (satisfaction_score >= 1.00 AND satisfaction_score <= 5.00);

ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_doctors_satisfaction_score ON doctors(satisfaction_score DESC);

COMMENT ON COLUMN doctors.satisfaction_score IS 'Average satisfaction score (1.00-5.00) calculated from survey responses';
COMMENT ON COLUMN doctors.total_reviews IS 'Total number of satisfaction survey responses received';


-- MIGRATION 03: Create satisfaction score trigger
-- =====================================================
CREATE OR REPLACE FUNCTION update_doctor_satisfaction_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE doctors
  SET 
    satisfaction_score = (
      SELECT ROUND(
        AVG(
          (professionalism_rating + waiting_time_rating + cleanliness_rating)::DECIMAL / 3
        )::NUMERIC, 2
      )
      FROM satisfaction_ratings
      WHERE doctor_id = NEW.doctor_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM satisfaction_ratings
      WHERE doctor_id = NEW.doctor_id
    )
  WHERE id = NEW.doctor_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_satisfaction_score ON satisfaction_ratings;
CREATE TRIGGER trigger_update_satisfaction_score
AFTER INSERT ON satisfaction_ratings
FOR EACH ROW
EXECUTE FUNCTION update_doctor_satisfaction_score();

COMMENT ON FUNCTION update_doctor_satisfaction_score() IS 'Automatically updates doctor satisfaction score and review count when new survey is submitted';


-- MIGRATION 04: Create sentiment analysis function
-- =====================================================
CREATE OR REPLACE FUNCTION analyze_sentiment(comment_text TEXT)
RETURNS TABLE(sentiment_score INTEGER, sentiment_classification TEXT) AS $$
DECLARE
  positive_keywords TEXT[] := ARRAY[
    'excellent', 'great', 'good', 'wonderful', 'amazing', 'fantastic', 
    'professional', 'kind', 'helpful', 'caring', 'friendly', 'clean',
    'efficient', 'quick', 'thorough', 'knowledgeable', 'patient',
    'comfortable', 'satisfied', 'recommend', 'best', 'love', 'thank'
  ];
  negative_keywords TEXT[] := ARRAY[
    'bad', 'poor', 'terrible', 'awful', 'horrible', 'worst', 'rude',
    'unprofessional', 'slow', 'dirty', 'long wait', 'waiting', 'delay',
    'disappointed', 'unsatisfied', 'complaint', 'problem', 'issue',
    'never', 'not recommend', 'waste', 'incompetent', 'careless'
  ];
  positive_count INTEGER := 0;
  negative_count INTEGER := 0;
  keyword TEXT;
  lower_comment TEXT;
BEGIN
  lower_comment := LOWER(comment_text);
  
  FOREACH keyword IN ARRAY positive_keywords LOOP
    positive_count := positive_count + (
      LENGTH(lower_comment) - LENGTH(REPLACE(lower_comment, keyword, ''))
    ) / LENGTH(keyword);
  END LOOP;
  
  FOREACH keyword IN ARRAY negative_keywords LOOP
    negative_count := negative_count + (
      LENGTH(lower_comment) - LENGTH(REPLACE(lower_comment, keyword, ''))
    ) / LENGTH(keyword);
  END LOOP;
  
  sentiment_score := positive_count - negative_count;
  
  IF sentiment_score > 0 THEN
    sentiment_classification := 'Positive';
  ELSIF sentiment_score < 0 THEN
    sentiment_classification := 'Negative';
  ELSE
    sentiment_classification := 'Neutral';
  END IF;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION analyze_sentiment(TEXT) IS 'Analyzes comment text and returns sentiment score and classification based on keyword matching';


-- MIGRATION 05: Setup Row Level Security policies
-- =====================================================
ALTER TABLE satisfaction_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous survey submissions" ON satisfaction_ratings;
CREATE POLICY "Allow anonymous survey submissions"
ON satisfaction_ratings
FOR INSERT
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "Doctors cannot view raw survey data" ON satisfaction_ratings;
CREATE POLICY "Doctors cannot view raw survey data"
ON satisfaction_ratings
FOR SELECT
TO authenticated
USING (
  NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'doctor'
  )
);

DROP POLICY IF EXISTS "Admins and owners can view all survey data" ON satisfaction_ratings;
CREATE POLICY "Admins and owners can view all survey data"
ON satisfaction_ratings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role IN ('admin', 'owner')
  )
);

DROP POLICY IF EXISTS "All authenticated users can read doctors" ON doctors;
CREATE POLICY "All authenticated users can read doctors"
ON doctors
FOR SELECT
TO authenticated
USING (true);

COMMENT ON POLICY "Allow anonymous survey submissions" ON satisfaction_ratings IS 'Allows public survey submissions without authentication';
COMMENT ON POLICY "Doctors cannot view raw survey data" ON satisfaction_ratings IS 'Prevents doctors from viewing individual survey responses';
COMMENT ON POLICY "Admins and owners can view all survey data" ON satisfaction_ratings IS 'Allows admin and owner roles to view all survey responses';
COMMENT ON POLICY "All authenticated users can read doctors" ON doctors IS 'Allows all staff to view doctor information including satisfaction scores';


-- =====================================================
-- Migration Complete!
-- =====================================================
-- Next steps:
-- 1. The satisfaction_ratings table is ready to receive survey submissions
-- 2. The doctors table now has satisfaction_score and total_reviews columns
-- 3. Triggers will automatically update scores when surveys are submitted
-- 4. Sentiment analysis function is available for comment analysis
-- 5. RLS policies protect survey data appropriately
-- =====================================================
