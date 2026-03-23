-- Migration: Add incentive column to employees table
-- Run this in your Supabase SQL Editor

ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS incentive NUMERIC DEFAULT 0;

COMMENT ON COLUMN employees.incentive IS 'Incentive/bonus amount added to salary';
