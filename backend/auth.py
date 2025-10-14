from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from fastapi.security.http import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from config import settings

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt"""
    # Ensure password is within bcrypt's 72 byte limit
    if len(password.encode('utf-8')) > 72:
        raise ValueError("Password cannot be longer than 72 bytes")
    
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str):
    """Decode and verify a JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None

# Security scheme
security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(lambda: None)
):
    """
    Dependency to get current authenticated user from JWT token
    """
    from database import get_db
    from models import User, Doctor
    
    # Get actual DB session
    if db is None:
        db = next(get_db())
    
    # Extract token
    token = credentials.credentials
    
    # Decode token
    payload = decode_access_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user info from token
    phone: str = payload.get("sub")
    user_type: str = payload.get("user_type")
    
    if phone is None or user_type is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Query user based on type
    if user_type == "user":
        user = db.query(User).filter(User.phone == phone).first()
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        return user
    elif user_type == "doctor":
        doctor = db.query(Doctor).filter(Doctor.phone == phone).first()
        if doctor is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Doctor not found"
            )
        return doctor
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user type"
        )

def get_current_doctor(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(lambda: None)
):
    """
    Dependency to get current authenticated doctor from JWT token
    Specifically ensures the user is a doctor
    """
    from database import get_db
    from models import Doctor
    
    # Get actual DB session
    if db is None:
        db = next(get_db())
    
    # Extract token
    token = credentials.credentials
    
    # Decode token
    payload = decode_access_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user info from token
    phone: str = payload.get("sub")
    user_type: str = payload.get("user_type")
    
    if phone is None or user_type is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Ensure user type is doctor
    if user_type != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can access this endpoint"
        )
    
    # Query doctor
    doctor = db.query(Doctor).filter(Doctor.phone == phone).first()
    if doctor is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Doctor not found"
        )
    
    return doctor

def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(lambda: None)
):
    """
    Dependency to get current authenticated admin from JWT token
    Specifically ensures the user is an admin
    """
    from database import get_db
    from models import Admin
    
    # Get actual DB session
    if db is None:
        db = next(get_db())
    
    # Extract token
    token = credentials.credentials
    
    # Decode token
    payload = decode_access_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get admin info from token
    username: str = payload.get("sub")
    user_type: str = payload.get("user_type")
    
    if username is None or user_type is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Ensure user type is admin
    if user_type != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access this endpoint"
        )
    
    # Query admin
    admin = db.query(Admin).filter(Admin.username == username).first()
    if admin is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin not found"
        )
    
    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin account is deactivated"
        )
    
    return admin
