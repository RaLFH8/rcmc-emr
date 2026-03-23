# Analytics Dashboard Database Migrations

This directory contains SQL migration files for setting up the analytics dashboard database infrastructure.

## Migration Files

### 01-setup-dashboard-config.sql

**Purpose**: Creates the `dashboard_config` table and inserts baseline data for the analytics dashboard.

**What it does**:
1. Creates `emr.dashboard_config` table with JSONB storage for flexible configuration
2. Inserts baseline performance metrics for comparison (Patient Satisfaction, Recovery Rate, etc.)
3. Inserts expense budget configuration (Staff Salaries, Operational Costs)
4. Verifies and creates indexes on all date columns for optimal query performance
5. Sets up Row Level Security (RLS) policies for the config table

**Requirements**: 
- Supabase project with `emr` schema already created
- `uuid-ossp` extension enabled
- `emr.user_profiles` table exists (for RLS policies)

## How to Run Migrations

### Option 1: Supabase SQL Editor (Recommended)

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of `01-setup-dashboard-config.sql`
5. Paste into the SQL editor
6. Click **Run** to execute the migration
7. Check the output for success messages and verification results

### Option 2: Supabase CLI

```bash
# Navigate to the project root
cd rcmc-emr

# Run the migration using Supabase CLI
supabase db execute --file .kiro/specs/reports-analytics-dashboard-transformation/migrations/01-setup-dashboard-config.sql
```

### Option 3: psql Command Line

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run the migration file
\i .kiro/specs/reports-analytics-dashboard-transformation/migrations/01-setup-dashboard-config.sql
```

## Verification

After running the migration, you should see:

1. **Success Messages**:
   - ✓ Dashboard configuration table created successfully
   - ✓ Baseline metrics inserted
   - ✓ Expense budgets configured
   - ✓ Date column indexes verified

2. **Verification Queries Output**:
   - Config count showing 2 entries
   - Baseline metrics JSON displayed
   - Expense budgets JSON displayed
   - List of all date-related indexes

## Manual Verification

You can manually verify the migration by running these queries in the SQL Editor:

```sql
-- Check if dashboard_config table exists
SELECT * FROM emr.dashboard_config;

-- Verify baseline metrics
SELECT config_value->'patientSatisfaction' as patient_satisfaction
FROM emr.dashboard_config
WHERE config_key = 'baseline_metrics';

-- Verify expense budgets
SELECT config_value->'staff_salaries' as staff_salaries,
       config_value->'operational_costs' as operational_costs
FROM emr.dashboard_config
WHERE config_key = 'expense_budgets';

-- Check indexes on date columns
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'emr'
  AND indexname LIKE '%date%'
ORDER BY tablename;
```

## Rollback

If you need to rollback this migration:

```sql
-- Drop the dashboard_config table
DROP TABLE IF EXISTS emr.dashboard_config CASCADE;

-- Note: This will not remove the indexes as they may be used by other features
-- Only drop indexes if you're certain they're not needed:
-- DROP INDEX IF EXISTS emr.idx_patients_created_at;
-- DROP INDEX IF EXISTS emr.idx_billing_created_at;
-- etc.
```

## Troubleshooting

### Error: relation "emr.satisfaction_ratings" does not exist

This is expected if the patient satisfaction survey feature hasn't been implemented yet. The migration will skip creating the index for this table and continue successfully.

### Error: role "authenticated" does not exist

Make sure you're running this on a Supabase database. The `authenticated` role is automatically created by Supabase.

### Error: function "emr.update_updated_at_column" does not exist

This function should be created by the base schema (`supabase-schema.sql`). Run the base schema first before running this migration.

## Next Steps

After successfully running this migration:

1. Verify the analytics dashboard can read the baseline metrics
2. Test the performance comparison chart displays correctly
3. Verify expense breakdown chart uses the budget values
4. Check that all date-filtered queries perform well (< 500ms)

## Configuration Updates

To update the baseline metrics or expense budgets after initial setup:

```sql
-- Update baseline metrics
UPDATE emr.dashboard_config
SET config_value = '{
  "patientSatisfaction": 4.3,
  "recoveryRate": 4.6,
  "emergencyResponse": 4.0,
  "followUpRate": 4.2,
  "treatmentSuccess": 4.5
}'::jsonb,
    updated_at = NOW()
WHERE config_key = 'baseline_metrics';

-- Update expense budgets
UPDATE emr.dashboard_config
SET config_value = '{
  "staff_salaries": 550000,
  "operational_costs": 220000
}'::jsonb,
    updated_at = NOW()
WHERE config_key = 'expense_budgets';
```

## Support

If you encounter any issues running this migration, please check:

1. Your Supabase project is active and accessible
2. You have the necessary permissions (admin role)
3. The base schema (`supabase-schema.sql`) has been run first
4. The `emr` schema exists in your database

For additional help, refer to the main spec documentation in the parent directory.
