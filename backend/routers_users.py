from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from database import get_db
from models import User
from schemas import UserCreate, UserLogin, UserResponse, Token, ProfileUpdate
from auth import get_password_hash, verify_password, create_access_token
from config import settings
import os
import uuid
from pathlib import Path

router = APIRouter(prefix="/api/users", tags=["users"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Dependency to get current user from token
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        phone: str = payload.get("sub")
        user_type: str = payload.get("user_type")
        
        if phone is None or user_type != "user":
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.phone == phone).first()
    if user is None:
        raise credentials_exception
    
    return user

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user (patient)"""
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.phone == user_data.phone).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        phone=user_data.phone,
        hashed_password=hashed_password,
        role="patient"
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login user (patient)"""
    
    # Find user
    user = db.query(User).filter(User.phone == credentials.phone).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone number or password"
        )
    
    # Verify password
    if not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone number or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user.phone, "user_type": "user", "user_id": user.id}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_type": "user",
        "user_data": {
            "id": user.id,
            "phone": user.phone,
            "role": user.role,
            "is_active": user.is_active
        }
    }

@router.get("/profile", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return current_user

@router.put("/profile", response_model=UserResponse)
def update_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile information"""
    
    # Update only provided fields
    update_data = profile_data.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    
    return current_user

@router.post("/profile-picture")
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload and update user profile picture"""
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed."
        )
    
    # Validate file size (max 5MB)
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:  # 5MB in bytes
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size too large. Maximum size is 5MB."
        )
    
    # Create uploads directory if it doesn't exist
    upload_dir = Path("uploads/profile_pictures")
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = upload_dir / unique_filename
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # Update user profile picture URL
    profile_picture_url = f"/uploads/profile_pictures/{unique_filename}"
    current_user.profile_picture_url = profile_picture_url
    
    db.commit()
    db.refresh(current_user)
    
    return {
        "message": "Profile picture uploaded successfully",
        "profile_picture_url": profile_picture_url
    }
