"""
Migration Script: Add Doctor Ratings Table
Adds the doctor_ratings table with all necessary indexes and constraints
"""

import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def migrate():
    """Add doctor ratings table to database"""
    
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ DATABASE_URL not found in environment variables")
        return
    
    # Parse DATABASE_URL
    # Format: postgresql://user:pass@host:port/db
    database_url = database_url.replace("postgresql://", "postgres://")
    
    print(f"🔄 Connecting to database...")
    print(f"   URL: {database_url[:30]}...")
    
    try:
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        print("\n📊 Starting migration: Add Doctor Ratings")
        print("=" * 60)
        
        # Check if doctor_ratings table already exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'doctor_ratings'
            );
        """)
        table_exists = cursor.fetchone()[0]
        
        if table_exists:
            print("✅ doctor_ratings table already exists, skipping creation")
        else:
            # Create doctor_ratings table
            print("\n1️⃣ Creating doctor_ratings table...")
            cursor.execute("""
                CREATE TABLE doctor_ratings (
                    id SERIAL PRIMARY KEY,
                    doctor_id INTEGER NOT NULL,
                    patient_id INTEGER NOT NULL,
                    appointment_id INTEGER NOT NULL UNIQUE,
                    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
                    review TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    
                    CONSTRAINT fk_doctor FOREIGN KEY (doctor_id) 
                        REFERENCES doctors(id) ON DELETE CASCADE,
                    CONSTRAINT fk_patient FOREIGN KEY (patient_id) 
                        REFERENCES users(id) ON DELETE CASCADE,
                    CONSTRAINT fk_appointment FOREIGN KEY (appointment_id) 
                        REFERENCES appointments(id) ON DELETE CASCADE
                );
            """)
            print("   ✅ Table created successfully")
            
            # Create indexes
            print("\n2️⃣ Creating indexes...")
            cursor.execute("""
                CREATE INDEX idx_doctor_ratings_doctor_id ON doctor_ratings(doctor_id);
                CREATE INDEX idx_doctor_ratings_patient_id ON doctor_ratings(patient_id);
                CREATE INDEX idx_doctor_ratings_appointment_id ON doctor_ratings(appointment_id);
            """)
            print("   ✅ Indexes created successfully")
        
        # Check if doctors table has average_rating and total_ratings columns
        print("\n3️⃣ Checking doctors table columns...")
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'doctors' 
            AND column_name IN ('average_rating', 'total_ratings');
        """)
        existing_columns = [row[0] for row in cursor.fetchall()]
        
        if 'average_rating' not in existing_columns:
            print("   Adding average_rating column to doctors table...")
            cursor.execute("""
                ALTER TABLE doctors 
                ADD COLUMN average_rating REAL DEFAULT 0.0;
            """)
            print("   ✅ average_rating column added")
        else:
            print("   ✅ average_rating column already exists")
        
        if 'total_ratings' not in existing_columns:
            print("   Adding total_ratings column to doctors table...")
            cursor.execute("""
                ALTER TABLE doctors 
                ADD COLUMN total_ratings INTEGER DEFAULT 0;
            """)
            print("   ✅ total_ratings column added")
        else:
            print("   ✅ total_ratings column already exists")
        
        # Create trigger for updating updated_at timestamp
        print("\n4️⃣ Creating triggers...")
        cursor.execute("""
            CREATE OR REPLACE FUNCTION update_rating_timestamp()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
            
            DROP TRIGGER IF EXISTS trigger_update_rating_timestamp ON doctor_ratings;
            
            CREATE TRIGGER trigger_update_rating_timestamp
            BEFORE UPDATE ON doctor_ratings
            FOR EACH ROW
            EXECUTE FUNCTION update_rating_timestamp();
        """)
        print("   ✅ Triggers created successfully")
        
        # Commit changes
        conn.commit()
        print("\n" + "=" * 60)
        print("✅ Migration completed successfully!")
        print("=" * 60)
        
        # Show table info
        print("\n📋 Table structure:")
        cursor.execute("""
            SELECT column_name, data_type, character_maximum_length, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'doctor_ratings'
            ORDER BY ordinal_position;
        """)
        columns = cursor.fetchall()
        for col in columns:
            nullable = "NULL" if col[3] == "YES" else "NOT NULL"
            length = f"({col[2]})" if col[2] else ""
            print(f"   {col[0]:20} {col[1]}{length:10} {nullable}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"\n❌ Migration failed: {str(e)}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        raise


if __name__ == "__main__":
    migrate()
