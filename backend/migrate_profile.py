"""
Migration script to add profile fields to users table
Run this to update existing database without losing data
"""
from sqlalchemy import text
from database import engine

def migrate_users_table():
    """Add new profile columns to users table"""
    
    migrations = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth VARCHAR;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS blood_group VARCHAR;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS height INTEGER;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS weight INTEGER;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS state VARCHAR;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url VARCHAR;",
    ]
    
    print("Starting database migration...")
    print("=" * 50)
    
    with engine.connect() as conn:
        for i, migration in enumerate(migrations, 1):
            try:
                conn.execute(text(migration))
                conn.commit()
                field_name = migration.split("ADD COLUMN IF NOT EXISTS ")[1].split(" ")[0]
                print(f"✓ [{i}/{len(migrations)}] Added column: {field_name}")
            except Exception as e:
                print(f"✗ [{i}/{len(migrations)}] Failed: {e}")
    
    print("=" * 50)
    print("Migration completed successfully!")
    print("\nNew profile fields added to users table:")
    print("  - name")
    print("  - date_of_birth")
    print("  - blood_group")
    print("  - height (inches)")
    print("  - weight (kg)")
    print("  - country")
    print("  - state")
    print("  - city")
    print("  - profile_picture_url")

if __name__ == "__main__":
    migrate_users_table()
