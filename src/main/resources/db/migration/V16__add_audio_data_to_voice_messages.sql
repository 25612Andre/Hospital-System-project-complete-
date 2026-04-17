-- Add audio_data column to store binary audio directly in DB (for cloud deployment compatibility)
-- This prevents audio loss on ephemeral filesystems (Render, Railway, etc.)
ALTER TABLE voice_messages ADD COLUMN IF NOT EXISTS audio_data BYTEA;
