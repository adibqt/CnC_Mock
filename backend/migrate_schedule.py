import psycopg2
from psycopg2 import sql

# Database connection parameters
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "click_and_care"
DB_USER = "postgres"
DB_PASSWORD = "admin"

def add_schedule_column():
    """Add schedule column to doctors table"""
    
    try:
        # Connect to database
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        conn.autocommit = True
        cursor = conn.cursor()
        
        print("Connected to database successfully!")
        
        # Add schedule column
        migration = """
        ALTER TABLE doctors 
        ADD COLUMN IF NOT EXISTS schedule JSON;
        """
        
        print("Executing migration...")
        cursor.execute(migration)
        print("✓ Added schedule column to doctors table")
        
        cursor.close()
        conn.close()
        
        print("\n✅ Migration completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {str(e)}")
        raise

if __name__ == "__main__":
    add_schedule_column()
