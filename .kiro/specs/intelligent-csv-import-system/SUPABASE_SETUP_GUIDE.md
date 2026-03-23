# Supabase Setup Guide - Intelligent CSV Import System

## Quick Start

The intelligent CSV import system needs one database table to track import operations. Follow these steps:

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run the Setup Script

1. Open the file: `rcmc-emr/.kiro/specs/intelligent-csv-import-system/RUN_IN_SUPABASE.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)

### Step 3: Verify Setup

After running the script, you should see:

✅ Table `import_logs` created  
✅ 5 indexes created  
✅ Row Level Security enabled  
✅ 3 RLS policies created  
✅ Permissions granted

The script includes verification queries at the bottom that will show you the table structure and policies.

## What Gets Created

### import_logs Table

This table tracks every CSV import operation with:

- **User information**: Who performed the import
- **Import details**: Module type (patient/inventory/lab_test), filename
- **Timing**: Start time, end time, duration
- **Statistics**: Total records, successful, failed, skipped
- **Results**: Category breakdown, error details
- **Status**: in_progress, completed, or failed

### Security

- Only **admin** and **staff** users can:
  - View import logs
  - Create new import logs
  - Update import logs
- Regular users cannot access import logs

## Usage

Once the table is created, the import system will automatically:

1. Create a log entry when an import starts
2. Update the log with progress
3. Record final results (success/failure counts)
4. Store any errors that occurred

## Viewing Import History

You can query import logs in Supabase:

```sql
-- View recent imports
SELECT 
  username,
  module_type,
  filename,
  total_records,
  successful_records,
  failed_records,
  status,
  created_at
FROM import_logs
ORDER BY created_at DESC
LIMIT 10;

-- View imports by module type
SELECT 
  module_type,
  COUNT(*) as total_imports,
  SUM(successful_records) as total_records_imported
FROM import_logs
WHERE status = 'completed'
GROUP BY module_type;

-- View failed imports
SELECT 
  username,
  module_type,
  filename,
  error_details,
  created_at
FROM import_logs
WHERE status = 'failed'
ORDER BY created_at DESC;
```

## Troubleshooting

### Error: "relation 'user_profiles' does not exist"

The RLS policies reference the `user_profiles` table. If you get this error:

1. Make sure you've run the main EMR schema setup first
2. Or temporarily disable RLS policies and re-enable after creating user_profiles

### Error: "permission denied"

Make sure you're running the script as a user with sufficient privileges (typically the project owner or service role).

## Next Steps

After setting up the database:

1. The import system is ready to use
2. Import buttons will appear in:
   - Patients page
   - Inventory page
   - Services page
3. All imports will be automatically logged

## Support

If you encounter issues:

1. Check the verification queries in the SQL script
2. Verify your user has admin or staff role
3. Check Supabase logs for detailed error messages
