"""
Router for pharmacy authentication and profile management.
Handles signup, login, and profile operations for pharmacies.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import select, or_, and_
from datetime import datetime, timedelta
from typing import Optional

from database import get_db
from models import Pharmacy
from schemas import (
    PharmacyCreate, 
    PharmacyLogin, 
    PharmacyResponse, 
    PharmacyProfileUpdate,
    Token
)
from auth import (
    get_password_hash, 
    verify_password, 
    create_access_token,
    get_current_pharmacy
)

router = APIRouter(prefix="/api/pharmacy", tags=["pharmacy"])


@router.post("/signup", response_model=dict, status_code=status.HTTP_201_CREATED)
def pharmacy_signup(pharmacy_data: PharmacyCreate, db: Session = Depends(get_db)):
    """
    Register a new pharmacy.
    Pharmacy will be pending verification until admin approves.
    """
    try:
        # Check if phone already exists
        existing_pharmacy = db.query(Pharmacy).filter(
            Pharmacy.phone == pharmacy_data.phone
        ).first()
        
        if existing_pharmacy:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already registered"
            )
        
        # Check if license number already exists
        existing_license = db.query(Pharmacy).filter(
            Pharmacy.license_number == pharmacy_data.license_number
        ).first()
        
        if existing_license:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="License number already registered"
            )
        
        # Check if email already exists (if provided)
        if pharmacy_data.email:
            existing_email = db.query(Pharmacy).filter(
                Pharmacy.email == pharmacy_data.email
            ).first()
            
            if existing_email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
        
        # Create new pharmacy (unverified by default)
        new_pharmacy = Pharmacy(
            phone=pharmacy_data.phone,
            hashed_password=get_password_hash(pharmacy_data.password),
            pharmacy_name=pharmacy_data.pharmacy_name,
            owner_name=pharmacy_data.owner_name,
            license_number=pharmacy_data.license_number,
            street_address=pharmacy_data.street_address,
            city=pharmacy_data.city,
            state=pharmacy_data.state,
            postal_code=pharmacy_data.postal_code,
            country=pharmacy_data.country or "Bangladesh",
            email=pharmacy_data.email,
            alternate_phone=pharmacy_data.alternate_phone,
            is_verified=False,  # Requires admin verification
            is_active=True
        )
        
        db.add(new_pharmacy)
        db.commit()
        db.refresh(new_pharmacy)
        
        return {
            "message": "Pharmacy registered successfully. Please wait for admin verification.",
            "pharmacy_id": new_pharmacy.id,
            "is_verified": new_pharmacy.is_verified,
            "pharmacy_name": new_pharmacy.pharmacy_name
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/login", response_model=Token)
def pharmacy_login(credentials: PharmacyLogin, db: Session = Depends(get_db)):
    """
    Pharmacy login endpoint.
    Returns JWT token and pharmacy data if credentials are valid and pharmacy is verified.
    """
    try:
        # Find pharmacy by phone
        pharmacy = db.query(Pharmacy).filter(
            Pharmacy.phone == credentials.phone
        ).first()
        
        if not pharmacy:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid phone number or password"
            )
        
        # Verify password
        if not verify_password(credentials.password, pharmacy.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid phone number or password"
            )
        
        # Check if pharmacy is active
        if not pharmacy.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Pharmacy account is deactivated. Please contact admin."
            )
        
        # Check if pharmacy is verified
        if not pharmacy.is_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Pharmacy account is pending verification. Please wait for admin approval."
            )
        
        # Create access token
        access_token = create_access_token(
            data={"sub": pharmacy.phone, "user_type": "pharmacy"}
        )
        
        # Prepare pharmacy data
        pharmacy_data = {
            "id": pharmacy.id,
            "phone": pharmacy.phone,
            "pharmacy_name": pharmacy.pharmacy_name,
            "owner_name": pharmacy.owner_name,
            "license_number": pharmacy.license_number,
            "street_address": pharmacy.street_address,
            "city": pharmacy.city,
            "state": pharmacy.state,
            "postal_code": pharmacy.postal_code,
            "country": pharmacy.country,
            "email": pharmacy.email,
            "alternate_phone": pharmacy.alternate_phone,
            "is_verified": pharmacy.is_verified,
            "is_active": pharmacy.is_active
        }
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_type": "pharmacy",
            "user_data": pharmacy_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )


@router.get("/profile", response_model=PharmacyResponse)
def get_pharmacy_profile(current_pharmacy: Pharmacy = Depends(get_current_pharmacy)):
    """Get current pharmacy's profile information."""
    return current_pharmacy


@router.put("/profile", response_model=PharmacyResponse)
def update_pharmacy_profile(
    profile_data: PharmacyProfileUpdate,
    current_pharmacy: Pharmacy = Depends(get_current_pharmacy),
    db: Session = Depends(get_db)
):
    """
    Update pharmacy profile information.
    Cannot update phone, license_number, or verification status.
    """
    try:
        # Check for email uniqueness if being updated
        if profile_data.email and profile_data.email != current_pharmacy.email:
            existing_email = db.query(Pharmacy).filter(
                and_(
                    Pharmacy.email == profile_data.email,
                    Pharmacy.id != current_pharmacy.id
                )
            ).first()
            
            if existing_email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already in use by another pharmacy"
                )
        
        # Update only provided fields
        update_data = profile_data.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(current_pharmacy, field, value)
        
        current_pharmacy.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(current_pharmacy)
        
        return current_pharmacy
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Profile update failed: {str(e)}"
        )


@router.get("/verification-status", response_model=dict)
def check_verification_status(current_pharmacy: Pharmacy = Depends(get_current_pharmacy)):
    """Check the verification status of the current pharmacy."""
    return {
        "pharmacy_id": current_pharmacy.id,
        "pharmacy_name": current_pharmacy.pharmacy_name,
        "is_verified": current_pharmacy.is_verified,
        "is_active": current_pharmacy.is_active,
        "verified_at": current_pharmacy.verified_at,
        "message": "Pharmacy is verified and active" if current_pharmacy.is_verified 
                   else "Pharmacy is pending admin verification"
    }

