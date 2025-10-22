"""
Fix appointment_date column type from VARCHAR to DATE
Run this script to update the database schema
"""
import os
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine, text
from config import settings

def migrate():
    """Update appointment_date column from VARCHAR to DATE"""
    
    engine = create_engine(settings.DATABASE_URL)
    
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
            print("✅ Successfully converted appointment_date to DATE type!")
            
        except Exception as e:
            print(f"❌ Error during migration: {e}")
            conn.rollback()
            raise

if __name__ == "__main__":
    migrate()
