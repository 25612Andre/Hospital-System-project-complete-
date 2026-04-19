DO $$
DECLARE
    constraint_name text;
BEGIN
    BEGIN
        ALTER TABLE locations
            ALTER COLUMN type TYPE VARCHAR(20)
            USING type::text;
    EXCEPTION
        WHEN undefined_column THEN
            NULL;
    END;

    FOR constraint_name IN
        SELECT c.conname
        FROM pg_constraint c
        JOIN pg_attribute a
          ON a.attrelid = c.conrelid
         AND a.attnum = ANY(c.conkey)
        WHERE c.conrelid = 'locations'::regclass
          AND c.contype = 'c'
          AND a.attname = 'type'
    LOOP
        EXECUTE format('ALTER TABLE locations DROP CONSTRAINT IF EXISTS %I', constraint_name);
    END LOOP;
END $$;

ALTER TABLE locations
    ADD CONSTRAINT locations_type_check
    CHECK (
        type IS NULL OR type IN (
            'PROVINCE',
            'DISTRICT',
            'SECTOR',
            'CELL',
            'VILLAGE',
            'DEPARTEMENT',
            'COMMUNE',
            'QUARTIER'
        )
    );
