-- Migration: Add sss_salary column to employees table
-- Run this in your Supabase SQL Editor

ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS sss_salary NUMERIC DEFAULT 0;

COMMENT ON COLUMN employees.sss_salary IS 'SSS Salary for contribution calculation (7.5% of this amount)';
