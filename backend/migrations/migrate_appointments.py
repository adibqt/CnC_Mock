"""
Appointment System Migration
Creates appointments table for doctor-patient bookings
"""

import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import engine

def migrate():
    """Create appointments table"""
    
    migration_sql = """
    -- Drop table if exists (for development)
    DROP TABLE IF EXISTS appointments CASCADE;
    
    -- Create appointments table
    CREATE TABLE appointments (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
        
        -- Appointment details
        appointment_date DATE NOT NULL,
        time_slot VARCHAR(50) NOT NULL,
        
        -- Status: pending, confirmed, completed, cancelled, no_show
        status VARCHAR(20) DEFAULT 'pending',
        
        -- Symptoms and notes
        symptoms TEXT,
        patient_notes TEXT,
        doctor_notes TEXT,
        
        -- Metadata
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Constraints
        CONSTRAINT check_status CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
        CONSTRAINT unique_doctor_time UNIQUE (doctor_id, appointment_date, time_slot)
    );
    
    -- Create indexes for better query performance
    CREATE INDEX idx_appointments_patient ON appointments(patient_id);
    CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
    CREATE INDEX idx_appointments_date ON appointments(appointment_date);
    CREATE INDEX idx_appointments_status ON appointments(status);
    CREATE INDEX idx_appointments_doctor_date ON appointments(doctor_id, appointment_date);
    
    -- Create trigger to update updated_at timestamp
    CREATE OR REPLACE FUNCTION update_appointments_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    CREATE TRIGGER appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_appointments_updated_at();
    """
    
    try:
        with engine.connect() as conn:
            # Execute migration
            conn.execute(text(migration_sql))
            conn.commit()
            print("✅ Appointments table created successfully!")
            
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        raise

if __name__ == "__main__":
    print("Starting appointments migration...")
    migrate()
    print("Migration completed!")
