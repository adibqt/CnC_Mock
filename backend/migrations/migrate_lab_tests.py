"""
Migration script to add lab_tests column to prescriptions table
Author: System
Date: 2025-10-20
"""

import sys
import os
from datetime import datetime

# Add parent directory to path to import database modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from config import settings

def migrate():
    """Add lab_tests column to prescriptions table"""
    
    print("=" * 60)
    print("Starting Lab Tests Migration")
    print("=" * 60)
    
    # Create engine
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        print("\n1. Checking if lab_tests column exists...")
        
        # Check if column already exists
        check_column = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'prescriptions' 
            AND column_name = 'lab_tests'
        """)
        
        result = conn.execute(check_column)
        column_exists = result.fetchone() is not None
        
        if column_exists:
            print("   ✓ lab_tests column already exists. Skipping migration.")
            return
        
        print("   - lab_tests column does not exist. Adding...")
        
        # Add lab_tests column as JSONB with default empty array
        add_column = text("""
            ALTER TABLE prescriptions 
            ADD COLUMN lab_tests JSONB DEFAULT '[]'::jsonb
        """)
        
        conn.execute(add_column)
        conn.commit()
        
        print("   ✓ lab_tests column added successfully")
        
        # Verify the column was added
        print("\n2. Verifying migration...")
        result = conn.execute(check_column)
        if result.fetchone():
            print("   ✓ Migration verified successfully")
        else:
            print("   ✗ Migration verification failed!")
            return
        
        # Update existing records to have empty array if NULL
        print("\n3. Updating existing prescriptions with default empty array...")
        update_existing = text("""
            UPDATE prescriptions 
            SET lab_tests = '[]'::jsonb 
            WHERE lab_tests IS NULL
        """)
        
        result = conn.execute(update_existing)
        conn.commit()
        
        rows_updated = result.rowcount
        print(f"   ✓ Updated {rows_updated} existing prescriptions")
        
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
