-- Relax constraints on locations table to allow simple/flat entries
ALTER TABLE locations ALTER COLUMN code DROP NOT NULL;
ALTER TABLE locations ALTER COLUMN type DROP NOT NULL;

-- Ensure there is at least one "General" location to avoid UI issues if needed
-- However, we will mainly allow nulls.

-- Replace RWF with FCFA in any text-based configuration if applicable
-- (Usually handled in frontend, but check if any DB defaults exist)
