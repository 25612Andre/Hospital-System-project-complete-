-- Remove duplicate demo locations that conflict with the actual Rwanda location data
-- First unlink any users/patients that might reference these locations
UPDATE user_accounts SET location_id = NULL WHERE location_id IN (
    SELECT id FROM locations WHERE code IN ('RW-KGL', 'RW-NOR', 'RW-KGL-GAS', 'RW-KGL-GAS-KIM', 'RW-KGL-GAS-KIM-BIB', 'RW-KGL-GAS-KIM-BIB-01', 'RW-NOR-MUS', 'RW-NOR-MUS-MUH', 'RW-NOR-MUS-MUH-KAG', 'RW-NOR-MUS-MUH-KAG-01')
);

UPDATE patients SET location_id = NULL WHERE location_id IN (
    SELECT id FROM locations WHERE code IN ('RW-KGL', 'RW-NOR', 'RW-KGL-GAS', 'RW-KGL-GAS-KIM', 'RW-KGL-GAS-KIM-BIB', 'RW-KGL-GAS-KIM-BIB-01', 'RW-NOR-MUS', 'RW-NOR-MUS-MUH', 'RW-NOR-MUS-MUH-KAG', 'RW-NOR-MUS-MUH-KAG-01')
);

-- Break parent links first
UPDATE locations SET parent_id = NULL WHERE code LIKE 'RW-%';

-- Delete the demo locations
DELETE FROM locations WHERE code LIKE 'RW-%';
