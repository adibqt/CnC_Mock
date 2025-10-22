"""
Run migration on production Neon database
"""
import os
from sqlalchemy import create_engine, text

# Get DATABASE_URL from Render environment variable
# You need to set this in your environment or copy it from Render dashboard
NEON_DATABASE_URL = os.getenv('PRODUCTION_DATABASE_URL') or input("Enter your Neon DATABASE_URL from Render: ").strip()

def migrate():
    """Update appointment_date column from VARCHAR to DATE"""
    
    print(f"🔗 Connecting to Neon PostgreSQL...")
    engine = create_engine(NEON_DATABASE_URL)
    
    with engine.connect() as conn:
        try:
            print("🔄 Converting appointment_date from VARCHAR to DATE...")
            
            # PostgreSQL: ALTER COLUMN with USING clause to cast existing data
            conn.execute(text("""
                ALTER TABLE appointments 
                ALTER COLUMN appointment_date TYPE DATE 
                USING appointment_date::DATE
            """))
            
            conn.commit()
            print("✅ Successfully converted appointment_date to DATE type on production database!")
            
        except Exception as e:
            print(f"❌ Error during migration: {e}")
            conn.rollback()
            raise

if __name__ == "__main__":
    migrate()
