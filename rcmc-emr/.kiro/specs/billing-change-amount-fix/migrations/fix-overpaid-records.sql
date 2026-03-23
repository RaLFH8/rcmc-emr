-- One-time fix: cap amount_paid at total_amount for all records where overpayment was stored
-- Run this once in the Supabase SQL editor

UPDATE billing
SET amount_paid = total_amount
WHERE amount_paid > total_amount;
