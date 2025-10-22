"""
Migration script to create clinic-related tables
Author: System
Date: 2025-10-20
"""

import sys
import os
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from config import settings

def migrate():
    print("=" * 60)
    print("Starting Clinic Module Migration")
    print("=" * 60)
    
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        # Create clinics table
        print("\n1. Creating clinics table...")
        create_clinics = text("""
            CREATE TABLE IF NOT EXISTS clinics (
                id SERIAL PRIMARY KEY,
                clinic_name VARCHAR NOT NULL,
                phone VARCHAR UNIQUE NOT NULL,
                hashed_password VARCHAR NOT NULL,
                license_number VARCHAR UNIQUE NOT NULL,
                address VARCHAR NOT NULL,
                city VARCHAR,
                state VARCHAR,
                postal_code VARCHAR,
                email VARCHAR,
                is_verified BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                verified_at TIMESTAMP WITH TIME ZONE,
                verified_by INTEGER,
                services_offered JSONB,
                operating_hours VARCHAR,
                contact_person VARCHAR,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE
            );
            
            CREATE INDEX IF NOT EXISTS idx_clinics_phone ON clinics(phone);
            CREATE INDEX IF NOT EXISTS idx_clinics_license ON clinics(license_number);
            CREATE INDEX IF NOT EXISTS idx_clinics_verified ON clinics(is_verified);
        """)
        conn.execute(create_clinics)
        conn.commit()
        print("   ✓ clinics table created")
        
        # Create lab_test_quotation_requests table
        print("\n2. Creating lab_test_quotation_requests table...")
        create_lab_quotation_requests = text("""
            CREATE TABLE IF NOT EXISTS lab_test_quotation_requests (
                id SERIAL PRIMARY KEY,
                prescription_id INTEGER NOT NULL REFERENCES prescriptions(id),
                patient_id INTEGER NOT NULL REFERENCES users(id),
                lab_tests JSONB NOT NULL,
                additional_notes TEXT,
                status VARCHAR DEFAULT 'pending',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE
            );
            
            CREATE INDEX IF NOT EXISTS idx_lab_quotation_requests_patient ON lab_test_quotation_requests(patient_id);
            CREATE INDEX IF NOT EXISTS idx_lab_quotation_requests_prescription ON lab_test_quotation_requests(prescription_id);
            CREATE INDEX IF NOT EXISTS idx_lab_quotation_requests_status ON lab_test_quotation_requests(status);
        """)
        conn.execute(create_lab_quotation_requests)
        conn.commit()
        print("   ✓ lab_test_quotation_requests table created")
        
        # Create lab_test_quotation_responses table
        print("\n3. Creating lab_test_quotation_responses table...")
        create_lab_quotation_responses = text("""
            CREATE TABLE IF NOT EXISTS lab_test_quotation_responses (
                id SERIAL PRIMARY KEY,
                quotation_request_id INTEGER NOT NULL REFERENCES lab_test_quotation_requests(id),
                clinic_id INTEGER NOT NULL REFERENCES clinics(id),
                test_items JSONB NOT NULL,
                total_amount FLOAT NOT NULL,
                estimated_delivery VARCHAR,
                additional_notes TEXT,
                is_accepted BOOLEAN DEFAULT FALSE,
                accepted_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE
            );
            
            CREATE INDEX IF NOT EXISTS idx_lab_quotation_responses_request ON lab_test_quotation_responses(quotation_request_id);
            CREATE INDEX IF NOT EXISTS idx_lab_quotation_responses_clinic ON lab_test_quotation_responses(clinic_id);
            CREATE INDEX IF NOT EXISTS idx_lab_quotation_responses_accepted ON lab_test_quotation_responses(is_accepted);
        """)
        conn.execute(create_lab_quotation_responses)
        conn.commit()
        print("   ✓ lab_test_quotation_responses table created")
        
        # Create junction table
        print("\n4. Creating lab_test_quotation_request_clinics table...")
        create_junction = text("""
            CREATE TABLE IF NOT EXISTS lab_test_quotation_request_clinics (
                id SERIAL PRIMARY KEY,
                quotation_request_id INTEGER NOT NULL REFERENCES lab_test_quotation_requests(id) ON DELETE CASCADE,
                clinic_id INTEGER NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT uq_lab_request_clinic UNIQUE (quotation_request_id, clinic_id)
            );
            
            CREATE INDEX IF NOT EXISTS idx_lab_request_clinic_request ON lab_test_quotation_request_clinics(quotation_request_id);
            CREATE INDEX IF NOT EXISTS idx_lab_request_clinic_clinic ON lab_test_quotation_request_clinics(clinic_id);
        """)
        conn.execute(create_junction)
        conn.commit()
        print("   ✓ lab_test_quotation_request_clinics table created")
        
        # Create lab_reports table
        print("\n5. Creating lab_reports table...")
        create_lab_reports = text("""
            CREATE TABLE IF NOT EXISTS lab_reports (
                id SERIAL PRIMARY KEY,
                quotation_response_id INTEGER NOT NULL REFERENCES lab_test_quotation_responses(id),
                clinic_id INTEGER NOT NULL REFERENCES clinics(id),
                patient_id INTEGER NOT NULL REFERENCES users(id),
                report_id VARCHAR UNIQUE NOT NULL,
                report_title VARCHAR NOT NULL,
                test_results JSONB NOT NULL,
                diagnosis_notes TEXT,
                technician_name VARCHAR,
                pathologist_name VARCHAR,
                report_file_url VARCHAR,
                report_images JSONB,
                status VARCHAR DEFAULT 'pending',
                verified_at TIMESTAMP WITH TIME ZONE,
                test_date TIMESTAMP WITH TIME ZONE,
                report_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE
            );
            
            CREATE INDEX IF NOT EXISTS idx_lab_reports_report_id ON lab_reports(report_id);
            CREATE INDEX IF NOT EXISTS idx_lab_reports_patient ON lab_reports(patient_id);
            CREATE INDEX IF NOT EXISTS idx_lab_reports_clinic ON lab_reports(clinic_id);
            CREATE INDEX IF NOT EXISTS idx_lab_reports_status ON lab_reports(status);
        """)
        conn.execute(create_lab_reports)
        conn.commit()
        print("   ✓ lab_reports table created")
        
    print("\n" + "=" * 60)
    print("Migration completed successfully!")
    print("=" * 60)

if __name__ == "__main__":
    try:
        migrate()
    except Exception as e:
        print(f"\n❌ Migration failed with error:")
        print(f"   {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
