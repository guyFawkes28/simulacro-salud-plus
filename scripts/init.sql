CREATE TABLE IF NOT EXISTS insurances (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    coverage_percentage INT NOT NULL
);

CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT
);

CREATE TABLE IF NOT EXISTS doctors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    specialty VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    appointment_id VARCHAR(50) UNIQUE NOT NULL,
    appointment_date DATE NOT NULL,
    patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id INT REFERENCES doctors(id) ON DELETE CASCADE,
    insurance_id INT REFERENCES insurances(id) ON DELETE SET NULL,
    treatment_code VARCHAR(20),
    treatment_description TEXT,
    treatment_cost DECIMAL(12, 2),
    amount_paid DECIMAL(12, 2)
);

-- Indexes for frequent search fields
CREATE INDEX IF NOT EXISTS idx_patients_email      ON patients(email);
CREATE INDEX IF NOT EXISTS idx_doctors_email       ON doctors(email);
CREATE INDEX IF NOT EXISTS idx_doctors_specialty   ON doctors(specialty);
CREATE INDEX IF NOT EXISTS idx_appointments_date   ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor  ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_insurance ON appointments(insurance_id);