# Fix Survey Submission - RLS Policy Issue

## The Problem
The survey form is getting a 403 Forbidden error because the Row Level Security (RLS) policy is blocking anonymous submissions.

## The Solution
Run the SQL fix to allow anonymous users to submit surveys.

## Steps to Fix

### 1. Open Supabase SQL Editor
- Go to your Supabase dashboard
- Click on "SQL Editor" in the left sidebar

### 2. Run the Fix SQL
- Open the file: `rcmc-emr/.kiro/specs/patient-satisfaction-survey/FIX_RLS_POLICY_NOW.sql`
- Copy all the SQL code
- Paste it into the Supabase SQL Editor
- Click "Run" or press Ctrl+Enter

### 3. Test the Survey
- Go to your survey page: `http://localhost:5173/survey/1` (replace 1 with actual doctor ID)
- Fill out the survey form
- Click "Submit Survey"
- You should see "Survey submitted successfully!"

### 4. Verify the Score Updated
- Go to the Doctors page in your EMR system
- Check if the satisfaction score appears for the doctor
- If not, run the score update SQL: `CHECK_AND_UPDATE_SCORES.sql`

## What Changed
The fix changes the RLS policy from `TO public` to `TO anon, authenticated`, which properly allows both anonymous and authenticated users to submit surveys.

## If It Still Doesn't Work
1. Check the browser console for errors
2. Verify the `satisfaction_ratings` table exists in Supabase
3. Make sure RLS is enabled on the table
4. Check that the policy was created by running the verification query at the end of the SQL file
