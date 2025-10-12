"""Debug script to test signup functionality"""
import sys
from database import SessionLocal, engine
from models import User, Base
from auth import get_password_hash

def test_signup():
    print("=" * 50)
    print("Testing Signup Functionality")
    print("=" * 50)
    
    # Check database connection
    try:
        db = SessionLocal()
        print("✓ Database connection successful")
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return
    
    # Check if tables exist
    try:
        Base.metadata.create_all(bind=engine)
        print("✓ Database tables checked/created")
    except Exception as e:
        print(f"✗ Table creation failed: {e}")
        return
    
    # Test password hashing
    try:
        test_password = "test123"
        hashed = get_password_hash(test_password)
        print(f"✓ Password hashing works")
        print(f"  Original: {test_password}")
        print(f"  Hashed length: {len(hashed)} chars")
    except Exception as e:
        print(f"✗ Password hashing failed: {e}")
        return
    
    # Test user creation
    try:
        # Check if test user exists
        test_phone = "+1234567890TEST"
        existing = db.query(User).filter(User.phone == test_phone).first()
        if existing:
            db.delete(existing)
            db.commit()
            print("✓ Cleaned up existing test user")
        
        # Create test user
        test_user = User(
            phone=test_phone,
            hashed_password=get_password_hash("testpass123"),
            role="patient"
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        
        print("✓ Test user created successfully")
        print(f"  ID: {test_user.id}")
        print(f"  Phone: {test_user.phone}")
        print(f"  Role: {test_user.role}")
        
        # Clean up
        db.delete(test_user)
        db.commit()
        print("✓ Test user cleaned up")
        
    except Exception as e:
        print(f"✗ User creation failed: {e}")
        import traceback
        traceback.print_exc()
        return
    
    finally:
        db.close()
    
    print("\n" + "=" * 50)
    print("All tests passed! ✓")
    print("=" * 50)

if __name__ == "__main__":
    test_signup()
