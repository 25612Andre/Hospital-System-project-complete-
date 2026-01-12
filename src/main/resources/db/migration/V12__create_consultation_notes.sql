-- Consultation notes and prescriptions for completed appointments

CREATE TABLE IF NOT EXISTS consultation_notes (
    id             BIGSERIAL PRIMARY KEY,
    appointment_id BIGINT NOT NULL UNIQUE REFERENCES appointments (id) ON DELETE CASCADE,
    doctor_id      BIGINT NOT NULL REFERENCES doctors (id) ON DELETE RESTRICT,
    patient_id     BIGINT NOT NULL REFERENCES patients (id) ON DELETE RESTRICT,
    observations   TEXT NOT NULL,
    created_at     TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_consultation_notes_appointment ON consultation_notes (appointment_id);
CREATE INDEX IF NOT EXISTS idx_consultation_notes_doctor ON consultation_notes (doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultation_notes_patient ON consultation_notes (patient_id);

CREATE TABLE IF NOT EXISTS prescription_items (
    id                    BIGSERIAL PRIMARY KEY,
    consultation_note_id  BIGINT NOT NULL REFERENCES consultation_notes (id) ON DELETE CASCADE,
    medication_name       VARCHAR(255) NOT NULL,
    dosage                VARCHAR(255),
    frequency             VARCHAR(255),
    duration              VARCHAR(255),
    instructions          TEXT,
    created_at            TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prescription_items_note ON prescription_items (consultation_note_id);

