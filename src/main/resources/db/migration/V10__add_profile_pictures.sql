-- Add profile_picture_url column to patients and doctors tables
ALTER TABLE patients ADD COLUMN IF NOT EXISTS profile_picture_url VARCHAR(500);
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS profile_picture_url VARCHAR(500);
