"""
Migration script for pharmacy module tables.
Creates pharmacies, quotation_requests, and quotation_responses tables.
"""

import sys
from pathlib import Path

# Add parent directory to path to import backend modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from database import engine, SessionLocal

def migrate_pharmacy_tables():
    """Create pharmacy-related tables with proper indexes and constraints."""
    
    db = SessionLocal()
    try:
        print("Starting pharmacy tables migration...")
        
        # 1. Create pharmacies table
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS pharmacies (
                id SERIAL PRIMARY KEY,
                phone VARCHAR(20) UNIQUE NOT NULL,
                hashed_password VARCHAR NOT NULL,
                
                -- Pharmacy Details
                pharmacy_name VARCHAR(200) NOT NULL,
                owner_name VARCHAR(100),
                license_number VARCHAR(100) UNIQUE NOT NULL,
                
                -- Address Information
                street_address VARCHAR(300) NOT NULL,
                city VARCHAR(100) NOT NULL,
                state VARCHAR(100) NOT NULL,
                postal_code VARCHAR(20) NOT NULL,
                country VARCHAR(100) DEFAULT 'Bangladesh' NOT NULL,
                
                -- Contact Information
                email VARCHAR(200) UNIQUE,
                alternate_phone VARCHAR(20),
                
                -- Verification & Status
                is_verified BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                verified_at TIMESTAMP WITH TIME ZONE,
                verified_by INTEGER REFERENCES admins(id),
                
                -- Metadata
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE
            );
        """))
        print("✓ Created pharmacies table")
        
        # 2. Create indexes for pharmacies table
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_pharmacies_phone ON pharmacies(phone);
        """))
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_pharmacies_license ON pharmacies(license_number);
        """))
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_pharmacies_name ON pharmacies(pharmacy_name);
        """))
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_pharmacies_city ON pharmacies(city);
        """))
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_pharmacies_verified ON pharmacies(is_verified);
        """))
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_pharmacies_active ON pharmacies(is_active);
        """))
        print("✓ Created indexes for pharmacies table")
        
        # 3. Create quotation_requests table
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS quotation_requests (
                id SERIAL PRIMARY KEY,
                patient_id INTEGER NOT NULL REFERENCES users(id),
                prescription_id INTEGER NOT NULL REFERENCES prescriptions(id),
                
                -- Request Details
                status VARCHAR(20) DEFAULT 'pending' NOT NULL,
                patient_notes TEXT,
                
                -- Metadata
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE,
                
                -- Constraints
                CONSTRAINT quotation_requests_status_check 
                    CHECK (status IN ('pending', 'quoted', 'accepted', 'rejected', 'cancelled'))
            );
        """))
        print("✓ Created quotation_requests table")
        
        # 4. Create indexes for quotation_requests table
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_quotation_requests_patient ON quotation_requests(patient_id);
        """))
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_quotation_requests_prescription ON quotation_requests(prescription_id);
        """))
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_quotation_requests_status ON quotation_requests(status);
        """))
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_quotation_requests_created ON quotation_requests(created_at DESC);
        """))
        print("✓ Created indexes for quotation_requests table")
        
        # 5. Create quotation_responses table
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS quotation_responses (
                id SERIAL PRIMARY KEY,
                quotation_request_id INTEGER NOT NULL REFERENCES quotation_requests(id),
                pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id),
                
                -- Quotation Details
                quoted_items JSONB NOT NULL,
                subtotal NUMERIC(10, 2) NOT NULL,
                delivery_charge NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
                total_amount NUMERIC(10, 2) NOT NULL,
                
                -- Additional Information
                notes TEXT,
                estimated_delivery_time VARCHAR(100),
                
                -- Status
                status VARCHAR(20) DEFAULT 'quoted' NOT NULL,
                
                -- Metadata
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE,
                
                -- Constraints
                CONSTRAINT quotation_responses_status_check 
                    CHECK (status IN ('quoted', 'accepted', 'rejected', 'cancelled')),
                CONSTRAINT quotation_responses_amounts_check 
                    CHECK (subtotal >= 0 AND delivery_charge >= 0 AND total_amount >= 0),
                CONSTRAINT quotation_responses_unique 
                    UNIQUE (quotation_request_id, pharmacy_id)
            );
        """))
        print("✓ Created quotation_responses table")
        
        # 6. Create indexes for quotation_responses table
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_quotation_responses_request ON quotation_responses(quotation_request_id);
        """))
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_quotation_responses_pharmacy ON quotation_responses(pharmacy_id);
        """))
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_quotation_responses_status ON quotation_responses(status);
        """))
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_quotation_responses_created ON quotation_responses(created_at DESC);
        """))
        print("✓ Created indexes for quotation_responses table")
        
        # Commit all changes
        db.commit()
        print("\n✅ Pharmacy tables migration completed successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Migration failed: {str(e)}")
        raise
    finally:
        db.close()

def main():
    """Main entry point for migration."""
    try:
        migrate_pharmacy_tables()
    except Exception as e:
        print(f"Error during migration: {e}")
        raise

if __name__ == "__main__":
    main()
