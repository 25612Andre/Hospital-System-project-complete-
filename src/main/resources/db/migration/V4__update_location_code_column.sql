-- Update locations table for better compatibility with Rwanda administrative data
-- Increase code column length and remove unique constraint (codes may repeat across types)

-- First, drop the unique constraint if it exists
ALTER TABLE locations DROP CONSTRAINT IF EXISTS uk_location_code;

-- Ensure code column can hold longer codes
ALTER TABLE locations ALTER COLUMN code TYPE VARCHAR(50);
