-- Create audit_logs table for tracking all system changes
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    action VARCHAR(50) NOT NULL,
    performed_by VARCHAR(255) NOT NULL,
    performed_by_user_id BIGINT NOT NULL,
    reason TEXT,
    old_value TEXT,
    new_value TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    additional_info TEXT
);

-- Create indexes for efficient querying
CREATE INDEX idx_entity_type_id ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_performed_by ON audit_logs (performed_by_user_id);
CREATE INDEX idx_timestamp ON audit_logs (timestamp);
CREATE INDEX idx_action ON audit_logs (action);
