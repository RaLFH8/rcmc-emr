# Fix Database Error - Run This SQL Now

## Problem
The application is showing this error:
```
column doctors.satisfaction_score does not exist
```

## Solution
The database migration for Task 1 (database schema setup) needs to be run in Supabase.

## Steps to Fix

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your RCMC EMR project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Migration**
   - Open the file: `rcmc-emr/.kiro/specs/patient-satisfaction-survey/migrations/RUN_ALL_MIGRATIONS.sql`
   - Copy ALL the SQL code from that file
   - Paste it into the Supabase SQL Editor
   - Click "Run" button

4. **Verify Success**
   - You should see "Success. No rows returned" message
   - Refresh your application at http://localhost:3005/
   - The errors should be gone

## What This Migration Does

1. Creates `satisfaction_ratings` table for storing survey responses
2. Adds `satisfaction_score` and `total_reviews` columns to `doctors` table
3. Creates automatic trigger to calculate satisfaction scores
4. Creates sentiment analysis function for comment analysis
5. Sets up Row Level Security policies for data protection

## After Running the Migration

The server is already running on http://localhost:3005/

You can now:
- View the Doctors page without errors
- The satisfaction score columns will be available (showing NULL until surveys are submitted)
- Continue with Task 6 (Add routing and navigation)
