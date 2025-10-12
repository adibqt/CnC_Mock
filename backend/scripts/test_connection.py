import psycopg2
from dotenv import load_dotenv
import os

# Load .env file
load_dotenv()

# Get DATABASE_URL
db_url = os.getenv('DATABASE_URL')
print(f"Testing connection with URL: {db_url}")

# Try to connect
try:
    # Parse the URL manually
    # Format: postgresql://user:password@host:port/database
    import re
    match = re.match(r'postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)', db_url)
    if match:
        user, password, host, port, database = match.groups()
        print(f"\nConnection details:")
        print(f"  User: {user}")
        print(f"  Password: {password}")
        print(f"  Host: {host}")
        print(f"  Port: {port}")
        print(f"  Database: {database}")
    
    conn = psycopg2.connect(db_url)
    print("\n✅ Connection successful!")
    conn.close()
except Exception as e:
    print(f"\n❌ Connection failed: {e}")
    print(f"\nPlease verify:")
    print(f"1. PostgreSQL is running")
    print(f"2. Database 'click_and_care' exists")
    print(f"3. Password in .env is correct")
