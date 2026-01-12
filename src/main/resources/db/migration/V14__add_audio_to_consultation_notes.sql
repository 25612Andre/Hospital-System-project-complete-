-- Add optional audio recording metadata to consultation notes.

ALTER TABLE consultation_notes
    ADD COLUMN IF NOT EXISTS audio_filename VARCHAR(255);

ALTER TABLE consultation_notes
    ADD COLUMN IF NOT EXISTS audio_content_type VARCHAR(100);

ALTER TABLE consultation_notes
    ADD COLUMN IF NOT EXISTS audio_original_filename VARCHAR(255);

