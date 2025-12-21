-- Baseline schema for Hospital Management System (PostgreSQL)
CREATE TABLE IF NOT EXISTS locations (
    id          BIGSERIAL PRIMARY KEY,
    code        VARCHAR(32) NOT NULL UNIQUE,
    name        VARCHAR(150) NOT NULL,
    type        VARCHAR(20) NOT NULL,
    parent_id   BIGINT REFERENCES locations (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_locations_parent ON locations (parent_id);
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations (type);

CREATE TABLE IF NOT EXISTS departments (
    id                BIGSERIAL PRIMARY KEY,
    name              VARCHAR(120) NOT NULL UNIQUE,
    consultation_fee  NUMERIC(10, 2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS doctors (
    id             BIGSERIAL PRIMARY KEY,
    name           VARCHAR(120) NOT NULL,
    contact        VARCHAR(120) NOT NULL,
    specialization VARCHAR(120) NOT NULL,
    department_id  BIGINT NOT NULL REFERENCES departments (id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_doctors_department ON doctors (department_id);

CREATE TABLE IF NOT EXISTS patients (
    id          BIGSERIAL PRIMARY KEY,
    full_name   VARCHAR(150) NOT NULL,
    age         INT NOT NULL,
    gender      VARCHAR(16) NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    phone       VARCHAR(40) NOT NULL UNIQUE,
    location_id BIGINT NOT NULL REFERENCES locations (id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_patients_location ON patients (location_id);

CREATE TABLE IF NOT EXISTS patient_doctors (
    patient_id BIGINT NOT NULL REFERENCES patients (id) ON DELETE CASCADE,
    doctor_id  BIGINT NOT NULL REFERENCES doctors (id) ON DELETE CASCADE,
    PRIMARY KEY (patient_id, doctor_id)
);

CREATE TABLE IF NOT EXISTS appointments (
    id                BIGSERIAL PRIMARY KEY,
    doctor_id         BIGINT NOT NULL REFERENCES doctors (id) ON DELETE RESTRICT,
    patient_id        BIGINT NOT NULL REFERENCES patients (id) ON DELETE RESTRICT,
    appointment_date  TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    status            VARCHAR(30) NOT NULL,
    consultation_fee  NUMERIC(10, 2) NOT NULL DEFAULT 0,
    created_at        TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments (doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments (patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments (appointment_date);

CREATE TABLE IF NOT EXISTS bills (
    id             BIGSERIAL PRIMARY KEY,
    amount         NUMERIC(10, 2) NOT NULL,
    appointment_id BIGINT NOT NULL UNIQUE REFERENCES appointments (id) ON DELETE CASCADE,
    issued_date    TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    status         VARCHAR(40) NOT NULL
);

CREATE TABLE IF NOT EXISTS user_accounts (
    id                  BIGSERIAL PRIMARY KEY,
    username            VARCHAR(150) NOT NULL UNIQUE,
    password            VARCHAR(255) NOT NULL,
    role                VARCHAR(30) NOT NULL,
    two_factor_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
    location_id         BIGINT REFERENCES locations (id),
    patient_id          BIGINT UNIQUE REFERENCES patients (id),
    doctor_id           BIGINT UNIQUE REFERENCES doctors (id)
);

CREATE INDEX IF NOT EXISTS idx_user_accounts_location ON user_accounts (location_id);
