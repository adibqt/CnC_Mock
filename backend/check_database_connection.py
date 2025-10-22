"""
Check which database the backend is connecting to
"""
from config import settings
import re

print("="*70)
print("🔍 DATABASE CONNECTION CHECK")
print("="*70)

db_url = settings.DATABASE_URL

# Parse the database URL to show details (hide password)
if db_url:
    # Extract components
    pattern = r'postgresql://([^:]+):([^@]+)@([^:/]+):?(\d+)?/(.+)'
    match = re.match(pattern, db_url)
    
    if match:
        username = match.group(1)
        password = match.group(2)
        host = match.group(3)
        port = match.group(4) or '5432'
        database = match.group(5)
        
        print(f"\n📊 Current Database Configuration:")
        print(f"   Host: {host}")
        print(f"   Port: {port}")
        print(f"   Database: {database}")
        print(f"   Username: {username}")
        print(f"   Password: {'*' * len(password)}")
        
        if 'localhost' in host or '127.0.0.1' in host:
            print(f"\n❌ WARNING: Connected to LOCAL database!")
            print(f"   This is WRONG for production deployment!")
        elif 'neon.tech' in host or 'neon.tech' in db_url:
            print(f"\n✅ Connected to NEON database (correct for production)")
        else:
            print(f"\n⚠️ Connected to: {host}")
    else:
        print(f"\n⚠️ Could not parse DATABASE_URL")
        print(f"   Raw URL: {db_url[:50]}...")
else:
    print(f"\n❌ ERROR: DATABASE_URL is not set!")

print(f"\n📝 Environment: {settings.ENVIRONMENT}")
print(f"🔐 Secret Key: {settings.SECRET_KEY[:10]}...")
print(f"🤖 Gemini API Key: {'Set' if settings.GEMINI_API_KEY else 'NOT SET'}")
print(f"🎥 LiveKit URL: {settings.LIVEKIT_URL}")

print("\n" + "="*70)
