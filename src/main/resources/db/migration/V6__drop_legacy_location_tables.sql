-- Drop legacy location tables (replaced by self-referencing locations table)
DROP TABLE IF EXISTS villages CASCADE;
DROP TABLE IF EXISTS cells CASCADE;
DROP TABLE IF EXISTS sectors CASCADE;
DROP TABLE IF EXISTS districts CASCADE;
DROP TABLE IF EXISTS provinces CASCADE;
