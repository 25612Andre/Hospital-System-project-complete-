ALTER TABLE user_accounts
    ADD COLUMN IF NOT EXISTS enabled BOOLEAN;

UPDATE user_accounts
SET enabled = TRUE
WHERE enabled IS NULL;

ALTER TABLE user_accounts
    ALTER COLUMN enabled SET DEFAULT TRUE;

ALTER TABLE user_accounts
    ALTER COLUMN enabled SET NOT NULL;
