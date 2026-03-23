-- Migration: Add sss_number column to employees table
-- Run this in your Supabase SQL Editor

ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS sss_number TEXT;

-- Optional: Add comment to the column
COMMENT ON COLUMN employees.sss_number IS 'SSS Number in format XX-XXXXXXX-X';
