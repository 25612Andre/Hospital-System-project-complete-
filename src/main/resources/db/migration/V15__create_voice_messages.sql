CREATE TABLE voice_messages (
    id BIGSERIAL PRIMARY KEY,
    sender_id BIGINT NOT NULL,
    recipient_id BIGINT NOT NULL,
    audio_filename VARCHAR(255) NOT NULL,
    audio_content_type VARCHAR(100) NOT NULL,
    original_filename VARCHAR(255),
    timestamp TIMESTAMP NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_voice_message_sender FOREIGN KEY (sender_id) REFERENCES user_accounts(id),
    CONSTRAINT fk_voice_message_recipient FOREIGN KEY (recipient_id) REFERENCES user_accounts(id)
);
