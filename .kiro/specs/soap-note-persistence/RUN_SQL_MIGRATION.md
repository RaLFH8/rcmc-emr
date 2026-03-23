# SOAP Note Persistence Fix - SQL Migration Required

## IMPORTANT: Run SQL Migration Before Testing

Before running the tests, you MUST run the SQL migration to add SOAP columns to the appointments table.

### Steps:

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to SQL Editor

2. **Run the Migration**
   - Open the file: `rcmc-emr/add-soap-columns.sql`
   - Copy the SQL content
   - Paste into Supabase SQL Editor
   - Click "Run"

3. **Verify Columns Were Added**
   - The query will show the new columns:
     - soap_subjective (TEXT)
     - soap_objective (TEXT)
     - soap_assessment (TEXT)
     - soap_plan (TEXT)

### SQL Migration Content:

```sql
-- Add SOAP columns to appointments table for in-progress consultation notes
-- These columns store temporary SOAP data during "In Progress" status
-- Data is transferred to consultations table upon completion

ALTER TABLE emr.appointments 
ADD COLUMN IF NOT EXISTS soap_subjective TEXT,
ADD COLUMN IF NOT EXISTS soap_objective TEXT,
ADD COLUMN IF NOT EXISTS soap_assessment TEXT,
ADD COLUMN IF NOT EXISTS soap_plan TEXT;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'emr' 
  AND table_name = 'appointments' 
  AND column_name LIKE 'soap_%';
```

### After Running Migration:

Once the migration is complete, you can:
1. Run the tests: `npm test soap-persistence.test.js`
2. Test the application manually
3. Verify SOAP notes persist across page refreshes

## What This Fix Does:

1. **Database Schema**: Adds 4 TEXT columns to store in-progress SOAP notes
2. **handleSaveSoap**: Now persists SOAP data to database when "Save & Continue" is clicked
3. **handleStartConsultation**: Loads existing SOAP data from database if present
4. **handleCompleteConsultation**: Retrieves SOAP data from database (handles re-render case)
5. **Review Modal**: Fetches latest SOAP data from database when opened
6. **Cleanup**: Clears SOAP fields from appointments table after consultation is completed

## Expected Behavior After Fix:

✅ SOAP notes persist to database after "Save & Continue"
✅ SOAP notes survive component re-renders and page refreshes
✅ Review modal displays correct SOAP data from database
✅ Completed consultations have SOAP data in consultations table
✅ SOAP fields are cleared from appointments table after completion
✅ All existing workflows (without SOAP) remain unchanged
