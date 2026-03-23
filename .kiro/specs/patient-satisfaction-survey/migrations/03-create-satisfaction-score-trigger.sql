-- =====================================================
-- Patient Satisfaction Survey - Database Migration
-- File: 03-create-satisfaction-score-trigger.sql
-- Task 1.3: Create database trigger for satisfaction score calculation
-- =====================================================

-- Create function to update doctor satisfaction score
CREATE OR REPLACE FUNCTION update_doctor_satisfaction_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the doctor's satisfaction score and total reviews
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

-- Create trigger to automatically update satisfaction score after insert
DROP TRIGGER IF EXISTS trigger_update_satisfaction_score ON satisfaction_ratings;
CREATE TRIGGER trigger_update_satisfaction_score
AFTER INSERT ON satisfaction_ratings
FOR EACH ROW
EXECUTE FUNCTION update_doctor_satisfaction_score();

-- Add comment
COMMENT ON FUNCTION update_doctor_satisfaction_score() IS 'Automatically updates doctor satisfaction score and review count when new survey is submitted';
