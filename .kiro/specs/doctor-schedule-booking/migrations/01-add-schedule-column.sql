-- Migration: Add schedule JSONB column to doctors table
-- Idempotent: safe to run multiple times

ALTER TABLE doctors
  ADD COLUMN IF NOT EXISTS schedule JSONB DEFAULT NULL;

-- Seed schedules for the 4 doctors (only sets when schedule IS NULL)

-- Dr. Paz de Leon-Gadon: Mon(1), Tue(2), Wed(3), Fri(5), Sat(6) 10–19
UPDATE doctors
SET schedule = '{"1":{"start":10,"end":19},"2":{"start":10,"end":19},"3":{"start":10,"end":19},"5":{"start":10,"end":19},"6":{"start":10,"end":19}}'::jsonb
WHERE (last_name ILIKE '%de leon%' OR last_name ILIKE '%gadon%')
  AND schedule IS NULL;

-- Dr. Santiago: Tue(2) 13–15, Fri(5) 15–17
UPDATE doctors
SET schedule = '{"2":{"start":13,"end":15},"5":{"start":15,"end":17}}'::jsonb
WHERE last_name ILIKE 'santiago'
  AND schedule IS NULL;

-- Dr. Alvarez: Wed(3) 15–17
UPDATE doctors
SET schedule = '{"3":{"start":15,"end":17}}'::jsonb
WHERE last_name ILIKE 'alvarez'
  AND schedule IS NULL;

-- Dr. Rodriguez: Thu(4) 8–17
UPDATE doctors
SET schedule = '{"4":{"start":8,"end":17}}'::jsonb
WHERE last_name ILIKE 'rodriguez'
  AND schedule IS NULL;
