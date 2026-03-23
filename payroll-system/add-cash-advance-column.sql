-- Migration: Add cash_advance column to employees table
-- Run this in your Supabase SQL Editor

ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS cash_advance NUMERIC DEFAULT 0;

COMMENT ON COLUMN employees.cash_advance IS 'Cash advance amount to be deducted from salary';
