-- Add profile picture support for user accounts.
ALTER TABLE user_accounts
    ADD COLUMN IF NOT EXISTS profile_picture_url VARCHAR(500);

-- Backfill existing user_accounts from linked patient/doctor profiles where possible.
UPDATE user_accounts u
SET profile_picture_url = p.profile_picture_url
FROM patients p
WHERE u.patient_id = p.id
  AND u.profile_picture_url IS NULL
  AND p.profile_picture_url IS NOT NULL;

UPDATE user_accounts u
SET profile_picture_url = d.profile_picture_url
FROM doctors d
WHERE u.doctor_id = d.id
  AND u.profile_picture_url IS NULL
  AND d.profile_picture_url IS NOT NULL;

