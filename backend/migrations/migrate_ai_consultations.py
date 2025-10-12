"""
Migration script to create AI consultations table
Run this script to add the ai_consultations table to the database
"""

import psycopg2
from psycopg2 import sql

# Database connection parameters
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "click_and_care"
DB_USER = "postgres"
DB_PASSWORD = "admin"

def create_ai_consultations_table():
    """Create ai_consultations table for storing AI conversation history"""
    
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
        
        # Create ai_consultations table
        migration = """
        CREATE TABLE IF NOT EXISTS ai_consultations (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            message TEXT NOT NULL,
            message_type VARCHAR(50) DEFAULT 'text',
            symptoms_extracted JSON,
            recommended_doctors JSON,
            conversation_context JSON,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Create index on user_id for faster queries
        CREATE INDEX IF NOT EXISTS idx_ai_consultations_user_id 
        ON ai_consultations(user_id);
        
        -- Create index on created_at for sorting
        CREATE INDEX IF NOT EXISTS idx_ai_consultations_created_at 
        ON ai_consultations(created_at DESC);
        """
        
        print("Executing migration...")
        cursor.execute(migration)
        print("✓ Created ai_consultations table")
        print("✓ Created indexes for performance")
        
        cursor.close()
        conn.close()
        
        print("\n✅ Migration completed successfully!")
        print("The ai_consultations table is now ready to use.")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {str(e)}")
        raise

if __name__ == "__main__":
    create_ai_consultations_table()
