"""
Migration script to create the prescriptions table
Run this script to add the prescription functionality to your database
"""

import sys
from pathlib import Path

# Add parent directory to path to import config
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, text
from config import settings

def migrate_prescriptions():
    """Create prescriptions table"""
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        # Create prescriptions table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS prescriptions (
                id SERIAL PRIMARY KEY,
                appointment_id INTEGER NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
                patient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
                prescription_id VARCHAR NOT NULL UNIQUE,
                diagnosis TEXT NOT NULL,
                medications JSONB NOT NULL,
                advice TEXT,
                follow_up TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE
            );
        """))
        
        # Create indexes for better query performance
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_prescriptions_appointment_id 
            ON prescriptions(appointment_id);
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id 
            ON prescriptions(patient_id);
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_id 
            ON prescriptions(doctor_id);
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_prescriptions_prescription_id 
            ON prescriptions(prescription_id);
        """))
        
        conn.commit()
        print("✓ Prescriptions table created successfully!")

if __name__ == "__main__":
    try:
        migrate_prescriptions()
        print("\n✅ Migration completed successfully!")
    except Exception as e:
        print(f"\n❌ Migration failed: {str(e)}")
