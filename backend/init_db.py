"""
Database initialization script
Run this to create all tables
"""
from database import engine, Base
from models import User, Doctor

def init_db():
    """Initialize database tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created successfully!")
    print("✓ Tables created: users, doctors")

if __name__ == "__main__":
    init_db()
