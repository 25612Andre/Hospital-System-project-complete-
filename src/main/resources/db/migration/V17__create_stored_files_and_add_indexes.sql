-- Create stored_files table for database-backed file storage
CREATE TABLE IF NOT EXISTS stored_files (
    id BIGSERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL UNIQUE,
    content_type VARCHAR(100) NOT NULL,
    data BYTEA NOT NULL
);

-- Add video URL fields to departments and doctors and location
ALTER TABLE departments ADD COLUMN IF NOT EXISTS educational_video_url VARCHAR(500);
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS video_url VARCHAR(500);

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(type);
CREATE INDEX IF NOT EXISTS idx_locations_parent_id ON locations(parent_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);
CREATE INDEX IF NOT EXISTS idx_user_accounts_username ON user_accounts(username);
CREATE INDEX IF NOT EXISTS idx_voice_messages_recipient ON voice_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_voice_messages_is_read ON voice_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_stored_files_filename ON stored_files(filename);
