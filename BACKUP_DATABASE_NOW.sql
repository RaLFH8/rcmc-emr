-- ============================================
-- DATABASE BACKUP SCRIPT (FREE TIER COMPATIBLE)
-- Run this in Supabase SQL Editor BEFORE security updates
-- ============================================
-- NOTE: This creates a backup schema within your database
-- Works on Supabase free tier (no point-in-time recovery needed)
-- ============================================

-- Step 1: Create backup schema
CREATE SCHEMA IF NOT EXISTS backup_feb_26_2026;

-- Step 2: Copy all tables to backup schema
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT LIKE 'sql_%'
    LOOP
        EXECUTE format('CREATE TABLE backup_feb_26_2026.%I AS SELECT * FROM public.%I', 
                      table_record.tablename, 
                      table_record.tablename);
        RAISE NOTICE 'Backed up table: %', table_record.tablename;
    END LOOP;
END $$;

-- Step 3: Verify backup
SELECT 
    'BACKUP VERIFICATION' as info,
    schemaname,
    tablename,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_schema = schemaname AND table_name = tablename) as column_count
FROM pg_tables 
WHERE schemaname = 'backup_feb_26_2026'
ORDER BY tablename;

-- Step 4: Record backup metadata
CREATE TABLE IF NOT EXISTS backup_feb_26_2026.backup_metadata (
    backup_date TIMESTAMP DEFAULT NOW(),
    backup_name TEXT DEFAULT 'pre-security-update',
    notes TEXT
);

INSERT INTO backup_feb_26_2026.backup_metadata (notes) 
VALUES ('Backup created before security hardening and online appointment system implementation');

-- Step 5: Show summary
SELECT 
    'BACKUP COMPLETE' as status,
    COUNT(*) as tables_backed_up,
    NOW() as backup_time
FROM pg_tables 
WHERE schemaname = 'backup_feb_26_2026';

-- ============================================
-- RESTORE INSTRUCTIONS (IF NEEDED)
-- ============================================

/*
To restore from this backup, run:

DO $$
DECLARE
    table_record RECORD;
BEGIN
    -- Disable triggers temporarily
    SET session_replication_role = replica;
    
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'backup_feb_26_2026'
        AND tablename != 'backup_metadata'
    LOOP
        -- Truncate current table
        EXECUTE format('TRUNCATE TABLE public.%I CASCADE', table_record.tablename);
        
        -- Restore from backup
        EXECUTE format('INSERT INTO public.%I SELECT * FROM backup_feb_26_2026.%I', 
                      table_record.tablename, 
                      table_record.tablename);
        
        RAISE NOTICE 'Restored table: %', table_record.tablename;
    END LOOP;
    
    -- Re-enable triggers
    SET session_replication_role = DEFAULT;
END $$;

SELECT 'RESTORE COMPLETE' as status;
*/

-- ============================================
-- TO DELETE BACKUP (After successful update)
-- ============================================

/*
DROP SCHEMA backup_feb_26_2026 CASCADE;
*/
