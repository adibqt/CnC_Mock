from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from database import get_db
from models import Doctor, Specialization
from schemas import DoctorCreate, DoctorLogin, DoctorResponse, Token, DoctorProfileUpdate
from auth import get_password_hash, verify_password, create_access_token
from config import settings
import os
import uuid
from pathlib import Path
from typing import List

router = APIRouter(prefix="/api/doctors", tags=["doctors"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Public endpoint to get active specializations (no authentication required)
@router.get("/specializations", response_model=List[dict])
def get_active_specializations(db: Session = Depends(get_db)):
    """Get all active specializations for doctor signup"""
    specializations = db.query(Specialization).filter(
        Specialization.is_active == True
    ).order_by(Specialization.name).all()
    
    return [{"id": spec.id, "name": spec.name, "description": spec.description, "is_active": spec.is_active} 
            for spec in specializations]

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

@router.put("/profile", response_model=DoctorResponse)
def update_profile(
    profile_data: DoctorProfileUpdate,
    current_doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """Update doctor profile information"""
    
    # Update only provided fields
    update_data = profile_data.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(current_doctor, field, value)
    
    db.commit()
    db.refresh(current_doctor)
    
    return current_doctor

@router.post("/profile-picture")
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """Upload and update doctor profile picture"""
    from services.blob_service import blob_service
    
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
    
    try:
        # Upload to Vercel Blob Storage
        profile_picture_url = await blob_service.upload_file(
            file_content=contents,
            filename=file.filename,
            folder="profile_pictures",
            content_type=file.content_type
        )
        
        # Update doctor profile picture URL
        current_doctor.profile_picture_url = profile_picture_url
        
        db.commit()
        db.refresh(current_doctor)
        
        return {
            "message": "Profile picture uploaded successfully",
            "profile_picture_url": profile_picture_url
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}"
        )

@router.post("/upload-certificate")
async def upload_certificate(
    certificate_type: str,  # "mbbs" or "fcps"
    file: UploadFile = File(...),
    current_doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """Upload and update doctor certificates (MBBS or FCPS)"""
    from services.blob_service import blob_service
    
    # Validate certificate type
    if certificate_type not in ["mbbs", "fcps"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid certificate type. Must be 'mbbs' or 'fcps'."
        )
    
    # Validate file type (PDFs and images)
    allowed_types = ["application/pdf", "image/jpeg", "image/jpg", "image/png"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only PDF, JPEG, and PNG files are allowed."
        )
    
    # Validate file size (max 10MB)
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:  # 10MB in bytes
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size too large. Maximum size is 10MB."
        )
    
    try:
        # Upload to Vercel Blob Storage
        certificate_url = await blob_service.upload_file(
            file_content=contents,
            filename=file.filename,
            folder=f"certificates/{certificate_type}",
            content_type=file.content_type
        )
        
        # Update doctor certificate URL
        if certificate_type == "mbbs":
            current_doctor.mbbs_certificate_url = certificate_url
        else:  # fcps
            current_doctor.fcps_certificate_url = certificate_url
        
        db.commit()
        db.refresh(current_doctor)
        
        return {
            "message": f"{certificate_type.upper()} certificate uploaded successfully",
            "certificate_url": certificate_url
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload certificate: {str(e)}"
        )

@router.get("/home")
def get_home_data(current_doctor: Doctor = Depends(get_current_doctor), db: Session = Depends(get_db)):
    """Get doctor home page data with appointments and schedule"""
    from datetime import date
    from models import Appointment, AppointmentStatus, Prescription
    
    # Get today's date
    today = date.today()
    
    # Calculate actual statistics
    # 1. Total appointments remaining (confirmed and pending/unconfirmed)
    remaining_appointments = db.query(Appointment).filter(
        Appointment.doctor_id == current_doctor.id,
        Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
        Appointment.appointment_date >= today
    ).count()
    
    # 2. Today's appointments count
    today_appointments_count = db.query(Appointment).filter(
        Appointment.doctor_id == current_doctor.id,
        Appointment.appointment_date == today
    ).count()
    
    # 3. Prescriptions remaining to write (completed appointments without prescriptions)
    completed_appointments = db.query(Appointment).filter(
        Appointment.doctor_id == current_doctor.id,
        Appointment.status == AppointmentStatus.COMPLETED
    ).all()
    
    prescriptions_remaining = 0
    for apt in completed_appointments:
        prescription_exists = db.query(Prescription).filter(
            Prescription.appointment_id == apt.id
        ).first()
        if not prescription_exists:
            prescriptions_remaining += 1
    
    # Get today's appointments for display (keeping placeholder structure for now)
    today_appointments = []
    
    return {
        "doctor": {
            "id": current_doctor.id,
            "name": current_doctor.name or current_doctor.full_name,
            "specialization": current_doctor.specialization,
            "is_verified": current_doctor.is_verified,
            "bmdc_number": current_doctor.bmdc_number,
            "mbbs_certificate_url": current_doctor.mbbs_certificate_url,
            "fcps_certificate_url": current_doctor.fcps_certificate_url,
            "degrees": current_doctor.degrees or [],
            "profile_picture_url": current_doctor.profile_picture_url
        },
        "todayAppointments": today_appointments,
        "stats": {
            "total_patients": remaining_appointments,  # Appointments remaining
            "today_appointments": today_appointments_count,  # Appointments today
            "pending_reports": prescriptions_remaining,  # Prescriptions to write
            "rating": 4.8  # Keep as is for now
        },
        "schedule": current_doctor.schedule or {
            "monday": [],
            "tuesday": [],
            "wednesday": [],
            "thursday": [],
            "friday": [],
            "saturday": [],
            "sunday": []
        }
    }

@router.get("/schedule")
async def get_schedule(current_doctor: Doctor = Depends(get_current_doctor)):
    """Get doctor's weekly schedule"""
    return {
        "success": True,
        "schedule": current_doctor.schedule or {
            "monday": [],
            "tuesday": [],
            "wednesday": [],
            "thursday": [],
            "friday": [],
            "saturday": [],
            "sunday": []
        }
    }

@router.put("/schedule")
async def update_schedule(
    schedule_data: dict,
    current_doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """Update doctor's weekly schedule"""
    
    # Validate schedule data structure
    days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    for day in days:
        if day not in schedule_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing schedule for {day}"
            )
    
    # Update schedule
    current_doctor.schedule = schedule_data
    db.commit()
    db.refresh(current_doctor)
    
    return {
        "success": True,
        "message": "Schedule updated successfully",
        "schedule": current_doctor.schedule
    }

@router.get("/all")
async def get_all_doctors(db: Session = Depends(get_db)):
    """
    Get all active doctors
    Public endpoint for patients to browse available doctors
    """
    try:
        doctors = db.query(Doctor).filter(
            Doctor.is_active == True
        ).all()
        
        doctors_list = []
        for doctor in doctors:
            doctors_list.append({
                "id": doctor.id,
                "full_name": doctor.full_name,
                "name": doctor.name or doctor.full_name,
                "specialization": doctor.specialization,
                "phone": doctor.phone,
                "profile_picture_url": doctor.profile_picture_url,
                "schedule": doctor.schedule,
                "is_verified": doctor.is_verified
            })
        
        return doctors_list
        
    except Exception as e:
        print(f"Error fetching doctors: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch doctors"
        )
