-- Make location_id nullable in patients table
ALTER TABLE patients ALTER COLUMN location_id DROP NOT NULL;
