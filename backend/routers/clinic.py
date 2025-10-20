"""
Clinic Authentication and Profile Management Router
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Clinic
from schemas import (
    ClinicSignup, ClinicLogin, ClinicResponse, ClinicUpdate
)
from auth import get_password_hash, verify_password, create_access_token, get_current_clinic
from datetime import timedelta
from config import settings

router = APIRouter(prefix="/api/clinic", tags=["clinic"])


@router.post("/signup", response_model=dict)
def clinic_signup(
    clinic_data: ClinicSignup,
    db: Session = Depends(get_db)
):
    """
    Register a new clinic
    Initial status: unverified, will need admin approval
    """
    
    # Check if phone already exists
    existing_clinic = db.query(Clinic).filter(Clinic.phone == clinic_data.phone).first()
    if existing_clinic:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered"
        )
    
    # Check if license number already exists
    existing_license = db.query(Clinic).filter(
        Clinic.license_number == clinic_data.license_number
    ).first()
    if existing_license:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="License number already registered"
        )
    
    # Hash password
    hashed_password = get_password_hash(clinic_data.password)
    
    # Create new clinic
    new_clinic = Clinic(
        clinic_name=clinic_data.clinic_name,
        phone=clinic_data.phone,
        hashed_password=hashed_password,
        license_number=clinic_data.license_number,
        address=clinic_data.address,
        city=clinic_data.city,
        state=clinic_data.state,
        postal_code=clinic_data.postal_code,
        email=clinic_data.email,
        contact_person=clinic_data.contact_person,
        is_verified=False,
        is_active=True
    )
    
    db.add(new_clinic)
    db.commit()
    db.refresh(new_clinic)
    
    return {
        "message": "Clinic registered successfully. Please wait for admin verification.",
        "clinic_id": new_clinic.id,
        "clinic_name": new_clinic.clinic_name,
        "is_verified": new_clinic.is_verified
    }


@router.post("/login")
def clinic_login(
    login_data: ClinicLogin,
    db: Session = Depends(get_db)
):
    """
    Login for clinics
    Returns access token only if clinic is verified
    """
    
    # Find clinic by phone
    clinic = db.query(Clinic).filter(Clinic.phone == login_data.phone).first()
    
    if not clinic:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone number or password"
        )
    
    # Verify password
    if not verify_password(login_data.password, clinic.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone number or password"
        )
    
    # Check if clinic is active
    if not clinic.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact support."
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": clinic.phone, "user_type": "clinic"},
        expires_delta=access_token_expires
    )
    
    # Return token and clinic info
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_type": "clinic",
        "clinic_data": {
            "id": clinic.id,
            "clinic_name": clinic.clinic_name,
            "phone": clinic.phone,
            "license_number": clinic.license_number,
            "address": clinic.address,
            "city": clinic.city,
            "state": clinic.state,
            "email": clinic.email,
            "contact_person": clinic.contact_person,
            "is_verified": clinic.is_verified,
            "is_active": clinic.is_active
        }
    }


@router.get("/profile", response_model=ClinicResponse)
def get_clinic_profile(
    current_clinic: Clinic = Depends(get_current_clinic),
    db: Session = Depends(get_db)
):
    """
    Get current clinic's profile
    Requires authentication
    """
    return current_clinic


@router.put("/profile", response_model=ClinicResponse)
def update_clinic_profile(
    profile_update: ClinicUpdate,
    current_clinic: Clinic = Depends(get_current_clinic),
    db: Session = Depends(get_db)
):
    """
    Update clinic profile
    Requires authentication
    """
    
    # Update fields if provided
    if profile_update.clinic_name is not None:
        current_clinic.clinic_name = profile_update.clinic_name
    
    if profile_update.address is not None:
        current_clinic.address = profile_update.address
    
    if profile_update.city is not None:
        current_clinic.city = profile_update.city
    
    if profile_update.state is not None:
        current_clinic.state = profile_update.state
    
    if profile_update.postal_code is not None:
        current_clinic.postal_code = profile_update.postal_code
    
    if profile_update.email is not None:
        current_clinic.email = profile_update.email
    
    if profile_update.contact_person is not None:
        current_clinic.contact_person = profile_update.contact_person
    
    if profile_update.services_offered is not None:
        current_clinic.services_offered = profile_update.services_offered
    
    if profile_update.operating_hours is not None:
        current_clinic.operating_hours = profile_update.operating_hours
    
    db.commit()
    db.refresh(current_clinic)
    
    return current_clinic


@router.get("/check-verification")
def check_verification_status(
    current_clinic: Clinic = Depends(get_current_clinic)
):
    """
    Check if clinic is verified
    """
    return {
        "is_verified": current_clinic.is_verified,
        "is_active": current_clinic.is_active,
        "clinic_name": current_clinic.clinic_name
    }
