# Survey Submission Error - Quick Fix Guide

## Problem
Survey submission is failing with "Failed to submit survey. Please try again."

## Root Cause
The database migration hasn't been run yet. The `satisfaction_ratings` table and RLS policies need to be created.

## Solution

### Step 1: Run the Database Migration

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Open the file: `rcmc-emr/.kiro/specs/patient-satisfaction-survey/migrations/RUN_ALL_MIGRATIONS.sql`
4. Copy ALL the SQL code from that file
5. Paste it into the Supabase SQL Editor
6. Click **Run** button

### Step 2: Verify the Migration

After running the migration, verify it worked by running this query in SQL Editor:

```sql
-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'satisfaction_ratings'
);

-- Check if columns were added to doctors table
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'doctors' 
AND column_name IN ('satisfaction_score', 'total_reviews');
```

### Step 3: Test the Survey

1. Go to the public survey page: `http://localhost:3005/survey?doc=<doctor-id>`
2. Fill out the survey form
3. Submit

## What the Migration Does

1. **Creates `satisfaction_ratings` table** - Stores all survey responses
2. **Adds columns to `doctors` table** - `satisfaction_score` and `total_reviews`
3. **Creates trigger** - Automatically updates doctor scores when surveys are submitted
4. **Creates sentiment analysis function** - Analyzes comment sentiment
5. **Sets up RLS policies** - Allows anonymous survey submissions

## Troubleshooting

### If you still get errors after running migration:

1. **Check browser console** (F12) for detailed error messages
2. **Verify RLS is enabled** on satisfaction_ratings table
3. **Check if anon key is correct** in your `.env` file

### Common Issues:

**Error: "relation satisfaction_ratings does not exist"**
- Solution: Run the migration SQL

**Error: "new row violates row-level security policy"**
- Solution: Make sure the RLS policy for anonymous inserts exists

**Error: "column doctors.satisfaction_score does not exist"**
- Solution: Run migration 02 to add columns to doctors table

## Next Steps

After the migration is successful:
- Test survey submission from mobile device using QR code
- Check that doctor satisfaction scores update automatically
- Verify sentiment analysis is working on comments
