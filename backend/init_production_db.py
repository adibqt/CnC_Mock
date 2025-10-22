"""
Initialize Neon production database with tables and admin user
Run this ONLY ONCE to set up the production database
"""

import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from config import settings
from database import Base
import models
from passlib.context import CryptContext
import re

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_database_host(db_url):
    """Extract host from database URL"""
    pattern = r'@([^:/]+)'
    match = re.search(pattern, db_url)
    return match.group(1) if match else "unknown"

def init_database():
    """Initialize production database"""
    
    print("="*70)
    print("🚀 INITIALIZING PRODUCTION DATABASE")
    print("="*70)
    
    # Check database URL
    db_url = settings.DATABASE_URL
    host = get_database_host(db_url)
    
    print(f"\n📊 Database Host: {host}")
    
    if 'localhost' in host or '127.0.0.1' in host:
        print("❌ ERROR: This script should only be used for production databases!")
        print("   Current database is localhost (local database)")
        print("   To use this script, update DATABASE_URL in backend/.env to point to Neon")
        return False
    
    if 'neon.tech' not in host:
        response = input(f"\n⚠️ WARNING: Database host is '{host}' (not Neon)\n   Continue? (yes/no): ")
        if response.lower() != 'yes':
            print("❌ Cancelled")
            return False
    
    try:
        # Create engine
        engine = create_engine(db_url)
        
        print("\n1️⃣ Creating database tables...")
        Base.metadata.create_all(bind=engine)
        print("✅ Tables created successfully")
        
        # Create session
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        print("\n2️⃣ Checking for existing admin user...")
        existing_admin = db.query(models.User).filter(
            models.User.username == "admin"
        ).first()
        
        if existing_admin:
            print("⚠️ Admin user already exists")
        else:
            print("3️⃣ Creating admin user...")
            
            # Create admin user
            admin_user = models.User(
                username="admin",
                email="admin@clickandcare.com",
                full_name="System Administrator",
                hashed_password=pwd_context.hash("admin123"),
                role="admin",
                phone="0000000000",
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            
            print("✅ Admin user created:")
            print("   Username: admin")
            print("   Password: admin123")
            print("   Email: admin@clickandcare.com")
        
        print("\n4️⃣ Checking database statistics...")
        
        # Count records
        user_count = db.query(models.User).count()
        doctor_count = db.query(models.DoctorProfile).count()
        appointment_count = db.query(models.Appointment).count()
        
        print(f"   Users: {user_count}")
        print(f"   Doctors: {doctor_count}")
        print(f"   Appointments: {appointment_count}")
        
        db.close()
        
        print("\n" + "="*70)
        print("🎉 DATABASE INITIALIZATION COMPLETE!")
        print("="*70)
        print("\n✅ You can now:")
        print("   1. Log in with username 'admin' and password 'admin123'")
        print("   2. Access the admin panel")
        print("   3. Create doctor profiles and appointments")
        print("\n")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = init_database()
    sys.exit(0 if success else 1)
