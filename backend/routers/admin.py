"""
Admin Router
Handles admin authentication and management operations
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime

from database import get_db
from models import Admin, User, Doctor, Appointment, Prescription, Specialization, Symptom, AppointmentStatus
from schemas import (
    AdminLogin, AdminResponse, 
    UserResponse, DoctorVerificationUpdate,
    SpecializationCreate, SpecializationUpdate, SpecializationResponse,
    SymptomCreate, SymptomUpdate, SymptomResponse,
    UserManagementUpdate
)
from auth import verify_password, get_password_hash, create_access_token, get_current_admin
from config import settings

router = APIRouter(prefix="/api/admin", tags=["Admin"])

# ============== Authentication ==============

@router.post("/login")
async def admin_login(credentials: AdminLogin, db: Session = Depends(get_db)):
    """Admin login endpoint"""
    
    # Find admin by username
    admin = db.query(Admin).filter(Admin.username == credentials.username).first()
    
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    # Verify password
    if not verify_password(credentials.password, admin.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    # Check if admin is active
    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin account is deactivated"
        )
    
    # Update last login
    admin.last_login = datetime.utcnow()
    db.commit()
    
    # Create access token
    access_token = create_access_token(
        data={"sub": admin.username, "user_type": "admin"}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "admin_data": {
            "id": admin.id,
            "username": admin.username,
            "full_name": admin.full_name,
            "email": admin.email,
            "role": admin.role
        }
    }

@router.get("/me", response_model=AdminResponse)
async def get_admin_profile(
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get current admin profile"""
    return current_admin

# ============== Dashboard Stats ==============

@router.get("/dashboard/stats")
async def get_dashboard_stats(
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get dashboard statistics"""
    
    # Count totals
    total_patients = db.query(User).count()
    total_doctors = db.query(Doctor).count()
    total_appointments = db.query(Appointment).count()
    total_prescriptions = db.query(Prescription).count()
    
    # Count pending verifications
    unverified_doctors = db.query(Doctor).filter(Doctor.is_verified == False).count()
    
    # Count by status
    pending_appointments = db.query(Appointment).filter(
        Appointment.status == AppointmentStatus.PENDING
    ).count()
    
    confirmed_appointments = db.query(Appointment).filter(
        Appointment.status == AppointmentStatus.CONFIRMED
    ).count()
    
    # Recent registrations (last 7 days)
    from datetime import timedelta
    week_ago = datetime.utcnow() - timedelta(days=7)
    
    new_patients = db.query(User).filter(User.created_at >= week_ago).count()
    new_doctors = db.query(Doctor).filter(Doctor.created_at >= week_ago).count()
    
    return {
        "totals": {
            "patients": total_patients,
            "doctors": total_doctors,
            "appointments": total_appointments,
            "prescriptions": total_prescriptions
        },
        "pending": {
            "unverified_doctors": unverified_doctors,
            "pending_appointments": pending_appointments,
            "confirmed_appointments": confirmed_appointments
        },
        "recent": {
            "new_patients_7d": new_patients,
            "new_doctors_7d": new_doctors
        }
    }

# ============== Patient Management ==============

@router.get("/patients")
async def get_all_patients(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all patients with filtering and pagination"""
    
    query = db.query(User)
    
    # Apply filters
    if search:
        query = query.filter(
            (User.name.ilike(f"%{search}%")) | 
            (User.phone.ilike(f"%{search}%"))
        )
    
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    patients = query.offset(skip).limit(limit).all()
    
    # Get appointment counts for each patient
    result = []
    for patient in patients:
        appointment_count = db.query(Appointment).filter(
            Appointment.patient_id == patient.id
        ).count()
        
        result.append({
            "id": patient.id,
            "phone": patient.phone,
            "name": patient.name,
            "date_of_birth": patient.date_of_birth,
            "blood_group": patient.blood_group,
            "city": patient.city,
            "profile_picture_url": patient.profile_picture_url,
            "is_active": patient.is_active,
            "created_at": patient.created_at,
            "appointment_count": appointment_count
        })
    
    return {
        "patients": result,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/patients/{patient_id}")
async def get_patient_details(
    patient_id: int,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get detailed patient information including appointment history"""
    
    patient = db.query(User).filter(User.id == patient_id).first()
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Get appointments with doctor details
    appointments = db.query(Appointment).filter(
        Appointment.patient_id == patient_id
    ).order_by(Appointment.created_at.desc()).all()
    
    appointments_data = []
    for apt in appointments:
        doctor = db.query(Doctor).filter(Doctor.id == apt.doctor_id).first()
        appointments_data.append({
            "id": apt.id,
            "appointment_date": apt.appointment_date,
            "time_slot": apt.time_slot,
            "status": apt.status.value if hasattr(apt.status, 'value') else apt.status,
            "symptoms": apt.symptoms,
            "created_at": apt.created_at,
            "doctor": {
                "id": doctor.id if doctor else None,
                "name": doctor.name if doctor else None,
                "specialization": doctor.specialization if doctor else None
            } if doctor else None
        })
    
    # Get prescriptions
    prescriptions = db.query(Prescription).filter(
        Prescription.patient_id == patient_id
    ).count()
    
    return {
        "patient": {
            "id": patient.id,
            "phone": patient.phone,
            "name": patient.name,
            "date_of_birth": patient.date_of_birth,
            "blood_group": patient.blood_group,
            "height": patient.height,
            "weight": patient.weight,
            "country": patient.country,
            "state": patient.state,
            "city": patient.city,
            "profile_picture_url": patient.profile_picture_url,
            "is_active": patient.is_active,
            "created_at": patient.created_at
        },
        "appointments": appointments_data,
        "stats": {
            "total_appointments": len(appointments),
            "total_prescriptions": prescriptions
        }
    }

@router.put("/patients/{patient_id}")
async def update_patient_status(
    patient_id: int,
    update_data: UserManagementUpdate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update patient status (activate/deactivate)"""
    
    patient = db.query(User).filter(User.id == patient_id).first()
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    if update_data.is_active is not None:
        patient.is_active = update_data.is_active
    
    db.commit()
    db.refresh(patient)
    
    return {
        "success": True,
        "message": f"Patient account {'activated' if patient.is_active else 'deactivated'}",
        "patient": {
            "id": patient.id,
            "name": patient.name,
            "is_active": patient.is_active
        }
    }

@router.get("/patients/{patient_id}/prescriptions")
async def get_patient_prescriptions(
    patient_id: int,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all prescriptions for a specific patient"""
    
    patient = db.query(User).filter(User.id == patient_id).first()
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    prescriptions = db.query(Prescription).filter(
        Prescription.patient_id == patient_id
    ).order_by(Prescription.created_at.desc()).all()
    
    result = []
    for presc in prescriptions:
        doctor = db.query(Doctor).filter(Doctor.id == presc.doctor_id).first()
        
        presc_dict = {
            "id": presc.id,
            "appointment_id": presc.appointment_id,
            "prescription_id": presc.prescription_id,
            "diagnosis": presc.diagnosis,
            "medications": presc.medications,
            "advice": presc.advice,
            "follow_up": presc.follow_up,
            "created_at": presc.created_at,
            "updated_at": presc.updated_at,
            "doctor": {
                "id": doctor.id if doctor else None,
                "name": doctor.name or doctor.full_name if doctor else None,
                "specialization": doctor.specialization if doctor else None,
                "license_number": doctor.bmdc_number if doctor else None
            }
        }
        result.append(presc_dict)
    
    return result

# ============== Doctor Management ==============

@router.get("/doctors")
async def get_all_doctors(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    is_verified: Optional[bool] = None,
    is_active: Optional[bool] = None,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all doctors with filtering and pagination"""
    
    query = db.query(Doctor)
    
    # Apply filters
    if search:
        query = query.filter(
            (Doctor.name.ilike(f"%{search}%")) | 
            (Doctor.full_name.ilike(f"%{search}%")) |
            (Doctor.phone.ilike(f"%{search}%")) |
            (Doctor.specialization.ilike(f"%{search}%"))
        )
    
    if is_verified is not None:
        query = query.filter(Doctor.is_verified == is_verified)
    
    if is_active is not None:
        query = query.filter(Doctor.is_active == is_active)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    doctors = query.offset(skip).limit(limit).all()
    
    # Get appointment counts for each doctor
    result = []
    for doctor in doctors:
        appointment_count = db.query(Appointment).filter(
            Appointment.doctor_id == doctor.id
        ).count()
        
        result.append({
            "id": doctor.id,
            "phone": doctor.phone,
            "full_name": doctor.full_name,
            "name": doctor.name,
            "specialization": doctor.specialization,
            "license_number": doctor.license_number,
            "bmdc_number": doctor.bmdc_number,
            "profile_picture_url": doctor.profile_picture_url,
            "is_verified": doctor.is_verified,
            "is_active": doctor.is_active,
            "created_at": doctor.created_at,
            "appointment_count": appointment_count
        })
    
    return {
        "doctors": result,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/doctors/{doctor_id}")
async def get_doctor_details(
    doctor_id: int,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get detailed doctor information including documents and statistics"""
    
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    
    # Get appointment stats
    total_appointments = db.query(Appointment).filter(
        Appointment.doctor_id == doctor_id
    ).count()
    
    completed_appointments = db.query(Appointment).filter(
        Appointment.doctor_id == doctor_id,
        Appointment.status == AppointmentStatus.COMPLETED
    ).count()
    
    # Get prescriptions count
    prescriptions = db.query(Prescription).filter(
        Prescription.doctor_id == doctor_id
    ).count()
    
    return {
        "doctor": {
            "id": doctor.id,
            "phone": doctor.phone,
            "full_name": doctor.full_name,
            "name": doctor.name,
            "specialization": doctor.specialization,
            "license_number": doctor.license_number,
            "bmdc_number": doctor.bmdc_number,
            "degrees": doctor.degrees,
            "profile_picture_url": doctor.profile_picture_url,
            "mbbs_certificate_url": doctor.mbbs_certificate_url,
            "fcps_certificate_url": doctor.fcps_certificate_url,
            "schedule": doctor.schedule,
            "is_verified": doctor.is_verified,
            "is_active": doctor.is_active,
            "created_at": doctor.created_at
        },
        "stats": {
            "total_appointments": total_appointments,
            "completed_appointments": completed_appointments,
            "total_prescriptions": prescriptions
        }
    }

@router.put("/doctors/{doctor_id}/verify")
async def update_doctor_verification(
    doctor_id: int,
    update_data: DoctorVerificationUpdate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Verify or update doctor status"""
    
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    
    if update_data.is_verified is not None:
        doctor.is_verified = update_data.is_verified
    
    if update_data.is_active is not None:
        doctor.is_active = update_data.is_active
    
    db.commit()
    db.refresh(doctor)
    
    return {
        "success": True,
        "message": "Doctor status updated successfully",
        "doctor": {
            "id": doctor.id,
            "name": doctor.name,
            "is_verified": doctor.is_verified,
            "is_active": doctor.is_active
        }
    }

# ============== Specialization Management ==============

@router.get("/specializations", response_model=List[SpecializationResponse])
async def get_specializations(
    is_active: Optional[bool] = None,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all specializations"""
    
    query = db.query(Specialization)
    
    if is_active is not None:
        query = query.filter(Specialization.is_active == is_active)
    
    return query.order_by(Specialization.name).all()

@router.post("/specializations", response_model=SpecializationResponse)
async def create_specialization(
    specialization: SpecializationCreate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Create a new specialization"""
    
    # Check if specialization already exists
    existing = db.query(Specialization).filter(
        Specialization.name == specialization.name
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Specialization already exists"
        )
    
    new_spec = Specialization(
        name=specialization.name,
        description=specialization.description,
        created_by=current_admin.id
    )
    
    db.add(new_spec)
    db.commit()
    db.refresh(new_spec)
    
    return new_spec

@router.put("/specializations/{spec_id}", response_model=SpecializationResponse)
async def update_specialization(
    spec_id: int,
    update_data: SpecializationUpdate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update a specialization"""
    
    spec = db.query(Specialization).filter(Specialization.id == spec_id).first()
    
    if not spec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Specialization not found"
        )
    
    if update_data.name is not None:
        spec.name = update_data.name
    if update_data.description is not None:
        spec.description = update_data.description
    if update_data.is_active is not None:
        spec.is_active = update_data.is_active
    
    db.commit()
    db.refresh(spec)
    
    return spec

@router.delete("/specializations/{spec_id}")
async def delete_specialization(
    spec_id: int,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Delete a specialization"""
    
    spec = db.query(Specialization).filter(Specialization.id == spec_id).first()
    
    if not spec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Specialization not found"
        )
    
    db.delete(spec)
    db.commit()
    
    return {"success": True, "message": "Specialization deleted successfully"}

# ============== Symptom Management ==============

@router.get("/symptoms", response_model=List[SymptomResponse])
async def get_symptoms(
    is_active: Optional[bool] = None,
    category: Optional[str] = None,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all symptoms"""
    
    query = db.query(Symptom)
    
    if is_active is not None:
        query = query.filter(Symptom.is_active == is_active)
    
    if category:
        query = query.filter(Symptom.category == category)
    
    return query.order_by(Symptom.name).all()

@router.post("/symptoms", response_model=SymptomResponse)
async def create_symptom(
    symptom: SymptomCreate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Create a new symptom"""
    
    # Check if symptom already exists
    existing = db.query(Symptom).filter(Symptom.name == symptom.name).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Symptom already exists"
        )
    
    new_symptom = Symptom(
        name=symptom.name,
        description=symptom.description,
        category=symptom.category,
        suggested_specialization_id=symptom.suggested_specialization_id,
        created_by=current_admin.id
    )
    
    db.add(new_symptom)
    db.commit()
    db.refresh(new_symptom)
    
    return new_symptom

@router.put("/symptoms/{symptom_id}", response_model=SymptomResponse)
async def update_symptom(
    symptom_id: int,
    update_data: SymptomUpdate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update a symptom"""
    
    symptom = db.query(Symptom).filter(Symptom.id == symptom_id).first()
    
    if not symptom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Symptom not found"
        )
    
    if update_data.name is not None:
        symptom.name = update_data.name
    if update_data.description is not None:
        symptom.description = update_data.description
    if update_data.category is not None:
        symptom.category = update_data.category
    if update_data.is_active is not None:
        symptom.is_active = update_data.is_active
    if update_data.suggested_specialization_id is not None:
        symptom.suggested_specialization_id = update_data.suggested_specialization_id
    
    db.commit()
    db.refresh(symptom)
    
    return symptom

@router.delete("/symptoms/{symptom_id}")
async def delete_symptom(
    symptom_id: int,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Delete a symptom"""
    
    symptom = db.query(Symptom).filter(Symptom.id == symptom_id).first()
    
    if not symptom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Symptom not found"
        )
    
    db.delete(symptom)
    db.commit()
    
    return {"success": True, "message": "Symptom deleted successfully"}


# Pharmacy Management Endpoints

@router.get("/pharmacies", response_model=List[dict])
async def get_all_pharmacies(
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    is_verified: Optional[bool] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None
):
    """
    Get all pharmacies with optional filters.
    Supports filtering by verification status, active status, and search.
    """
    from models import Pharmacy
    from sqlalchemy import or_, and_
    
    query = db.query(Pharmacy)
    
    # Apply filters
    filters = []
    if is_verified is not None:
        filters.append(Pharmacy.is_verified == is_verified)
    if is_active is not None:
        filters.append(Pharmacy.is_active == is_active)
    if search:
        search_filter = or_(
            Pharmacy.pharmacy_name.ilike(f"%{search}%"),
            Pharmacy.license_number.ilike(f"%{search}%"),
            Pharmacy.phone.ilike(f"%{search}%"),
            Pharmacy.city.ilike(f"%{search}%")
        )
        filters.append(search_filter)
    
    if filters:
        query = query.filter(and_(*filters))
    
    pharmacies = query.order_by(Pharmacy.created_at.desc()).offset(skip).limit(limit).all()
    
    # Format response
    return [
        {
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
            "is_active": pharmacy.is_active,
            "verified_at": pharmacy.verified_at,
            "created_at": pharmacy.created_at,
            "updated_at": pharmacy.updated_at
        }
        for pharmacy in pharmacies
    ]


@router.get("/pharmacies/{pharmacy_id}", response_model=dict)
async def get_pharmacy_details(
    pharmacy_id: int,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific pharmacy."""
    from models import Pharmacy
    
    pharmacy = db.query(Pharmacy).filter(Pharmacy.id == pharmacy_id).first()
    
    if not pharmacy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pharmacy not found"
        )
    
    return {
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
        "is_active": pharmacy.is_active,
        "verified_at": pharmacy.verified_at,
        "verified_by": pharmacy.verified_by,
        "created_at": pharmacy.created_at,
        "updated_at": pharmacy.updated_at
    }


@router.put("/pharmacies/{pharmacy_id}/verify", response_model=dict)
async def verify_pharmacy(
    pharmacy_id: int,
    verification_data: dict,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Verify or reject a pharmacy.
    Sets is_verified to True/False and records admin who verified.
    """
    from models import Pharmacy
    from datetime import datetime
    
    pharmacy = db.query(Pharmacy).filter(Pharmacy.id == pharmacy_id).first()
    
    if not pharmacy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pharmacy not found"
        )
    
    is_verified = verification_data.get("is_verified")
    is_active = verification_data.get("is_active")
    
    if is_verified is not None:
        pharmacy.is_verified = is_verified
        pharmacy.verified_by = current_admin.id
        pharmacy.verified_at = datetime.utcnow() if is_verified else None
    
    if is_active is not None:
        pharmacy.is_active = is_active
    
    pharmacy.updated_at = datetime.utcnow()
    
    # Update admin's last login
    current_admin.last_login = datetime.utcnow()
    
    db.commit()
    db.refresh(pharmacy)
    
    action = "verified" if pharmacy.is_verified else "rejected"
    
    return {
        "success": True,
        "message": f"Pharmacy {action} successfully",
        "pharmacy": {
            "id": pharmacy.id,
            "pharmacy_name": pharmacy.pharmacy_name,
            "is_verified": pharmacy.is_verified,
            "is_active": pharmacy.is_active,
            "verified_at": pharmacy.verified_at
        }
    }


@router.get("/pharmacies/stats/summary", response_model=dict)
async def get_pharmacy_stats(
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get pharmacy statistics for admin dashboard."""
    from models import Pharmacy
    from sqlalchemy import func
    
    total_pharmacies = db.query(func.count(Pharmacy.id)).scalar()
    verified_pharmacies = db.query(func.count(Pharmacy.id)).filter(Pharmacy.is_verified == True).scalar()
    pending_verification = db.query(func.count(Pharmacy.id)).filter(
        Pharmacy.is_verified == False,
        Pharmacy.is_active == True
    ).scalar()
    inactive_pharmacies = db.query(func.count(Pharmacy.id)).filter(Pharmacy.is_active == False).scalar()
    
    return {
        "total_pharmacies": total_pharmacies,
        "verified_pharmacies": verified_pharmacies,
        "pending_verification": pending_verification,
        "inactive_pharmacies": inactive_pharmacies
    }

