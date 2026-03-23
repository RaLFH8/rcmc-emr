-- =====================================================
-- Patient Satisfaction Survey - Database Migration
-- File: 04-create-sentiment-analysis-function.sql
-- Task 1.4: Create sentiment analysis database function
-- =====================================================

-- Create sentiment analysis function
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
  -- Convert comment to lowercase for case-insensitive matching
  lower_comment := LOWER(comment_text);
  
  -- Count positive keywords
  FOREACH keyword IN ARRAY positive_keywords LOOP
    positive_count := positive_count + (
      LENGTH(lower_comment) - LENGTH(REPLACE(lower_comment, keyword, ''))
    ) / LENGTH(keyword);
  END LOOP;
  
  -- Count negative keywords
  FOREACH keyword IN ARRAY negative_keywords LOOP
    negative_count := negative_count + (
      LENGTH(lower_comment) - LENGTH(REPLACE(lower_comment, keyword, ''))
    ) / LENGTH(keyword);
  END LOOP;
  
  -- Calculate sentiment score
  sentiment_score := positive_count - negative_count;
  
  -- Classify sentiment
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

-- Add comment
COMMENT ON FUNCTION analyze_sentiment(TEXT) IS 'Analyzes comment text and returns sentiment score and classification based on keyword matching';
