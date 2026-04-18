-- Rename location types to Departement/Commune/Quartier
UPDATE locations SET type = 'DEPARTEMENT' WHERE type = 'DISTRICT';
UPDATE locations SET type = 'COMMUNE' WHERE type = 'SECTOR';
UPDATE locations SET type = 'QUARTIER' WHERE type = 'CELL';
