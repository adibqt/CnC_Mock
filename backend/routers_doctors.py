from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from database import get_db
from models import Doctor
from schemas import DoctorCreate, DoctorLogin, DoctorResponse, Token
from auth import get_password_hash, verify_password, create_access_token
from config import settings

router = APIRouter(prefix="/api/doctors", tags=["doctors"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Dependency to get current doctor from token
async def get_current_doctor(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        phone: str = payload.get("sub")
        user_type: str = payload.get("user_type")
        
        if phone is None or user_type != "doctor":
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    doctor = db.query(Doctor).filter(Doctor.phone == phone).first()
    if doctor is None:
        raise credentials_exception
    
    return doctor

@router.post("/signup", response_model=DoctorResponse, status_code=status.HTTP_201_CREATED)
def signup(doctor_data: DoctorCreate, db: Session = Depends(get_db)):
    """Register a new doctor"""
    
    # Check if doctor already exists
    existing_doctor = db.query(Doctor).filter(Doctor.phone == doctor_data.phone).first()
    if existing_doctor:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered"
        )
    
    # Check if license number already exists
    existing_license = db.query(Doctor).filter(Doctor.license_number == doctor_data.license_number).first()
    if existing_license:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="License number already registered"
        )
    
    # Create new doctor
    hashed_password = get_password_hash(doctor_data.password)
    new_doctor = Doctor(
        phone=doctor_data.phone,
        hashed_password=hashed_password,
        full_name=doctor_data.full_name,
        specialization=doctor_data.specialization,
        license_number=doctor_data.license_number,
        is_verified=False  # Doctors need to be verified by admin
    )
    
    db.add(new_doctor)
    db.commit()
    db.refresh(new_doctor)
    
    return new_doctor

@router.post("/login", response_model=Token)
def login(credentials: DoctorLogin, db: Session = Depends(get_db)):
    """Login doctor"""
    
    # Find doctor
    doctor = db.query(Doctor).filter(Doctor.phone == credentials.phone).first()
    
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone number or password"
        )
    
    # Verify password
    if not verify_password(credentials.password, doctor.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone number or password"
        )
    
    if not doctor.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )
    
    # Create access token
    access_token = create_access_token(
        data={"sub": doctor.phone, "user_type": "doctor", "user_id": doctor.id}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_type": "doctor",
        "user_data": {
            "id": doctor.id,
            "phone": doctor.phone,
            "full_name": doctor.full_name,
            "specialization": doctor.specialization,
            "license_number": doctor.license_number,
            "is_verified": doctor.is_verified,
            "is_active": doctor.is_active
        }
    }

@router.get("/profile", response_model=DoctorResponse)
def get_profile(current_doctor: Doctor = Depends(get_current_doctor)):
    """Get current doctor profile"""
    return current_doctor
