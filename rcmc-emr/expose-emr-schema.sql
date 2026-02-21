-- =====================================================
-- EXPOSE EMR SCHEMA TO SUPABASE API
-- =====================================================
-- This allows the Supabase client to access emr schema tables

-- Grant usage on emr schema to anon and authenticated roles
GRANT USAGE ON SCHEMA emr TO anon, authenticated;

-- Grant permissions on all tables in emr schema
GRANT ALL ON ALL TABLES IN SCHEMA emr TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA emr TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA emr TO anon, authenticated;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA emr GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA emr GRANT ALL ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA emr GRANT ALL ON FUNCTIONS TO anon, authenticated;

-- Verify the schema is accessible
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'emr';

-- Success! Now the emr schema is exposed to the API
