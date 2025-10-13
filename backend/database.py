from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import settings

# Create database engine with connection pool settings
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=10,              # Maximum number of permanent connections
    max_overflow=20,           # Maximum number of connections that can be created beyond pool_size
    pool_timeout=30,           # Seconds to wait before giving up on getting a connection
    pool_recycle=3600,         # Recycle connections after 1 hour
    pool_pre_ping=True         # Verify connections before using them
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for models
Base = declarative_base()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
