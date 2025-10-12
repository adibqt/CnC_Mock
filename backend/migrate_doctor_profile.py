"""
Migration script to add doctor profile fields
Run this script to add new columns to the doctors table
"""
from sqlalchemy import text
from database import engine

def migrate():
    migrations = [
        "ALTER TABLE doctors ADD COLUMN IF NOT EXISTS name VARCHAR;",
        "ALTER TABLE doctors ADD COLUMN IF NOT EXISTS bmdc_number VARCHAR;",
        "ALTER TABLE doctors ADD COLUMN IF NOT EXISTS mbbs_certificate_url VARCHAR;",
        "ALTER TABLE doctors ADD COLUMN IF NOT EXISTS fcps_certificate_url VARCHAR;",
        "ALTER TABLE doctors ADD COLUMN IF NOT EXISTS degrees JSON;",
        "ALTER TABLE doctors ADD COLUMN IF NOT EXISTS profile_picture_url VARCHAR;",
    ]
    
    with engine.connect() as connection:
        for migration in migrations:
            try:
                connection.execute(text(migration))
                connection.commit()
                print(f"✓ Executed: {migration}")
            except Exception as e:
                print(f"✗ Error executing {migration}: {e}")
    
    print("\n✅ Migration completed!")

if __name__ == "__main__":
    migrate()
