from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Prescription, Appointment, Doctor, User, AppointmentStatus
from schemas import PrescriptionCreate, PrescriptionResponse
from routers.doctors import get_current_doctor
from routers.users import get_current_user
from typing import List
import random
import string

router = APIRouter(prefix="/api/prescriptions", tags=["prescriptions"])

def generate_prescription_id():
    """Generate a unique prescription ID like CC-84321"""
    random_num = ''.join(random.choices(string.digits, k=5))
    return f"CC-{random_num}"

@router.post("/", response_model=PrescriptionResponse, status_code=status.HTTP_201_CREATED)
async def create_prescription(
    prescription_data: PrescriptionCreate,
    current_doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """
    Create a new prescription for a completed appointment
    Only doctors can create prescriptions
    """
    
    # Verify the appointment exists and belongs to this doctor
    appointment = db.query(Appointment).filter(
        Appointment.id == prescription_data.appointment_id
    ).first()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    if appointment.doctor_id != current_doctor.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only create prescriptions for your own appointments"
        )
    
    if appointment.status != AppointmentStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Prescription can only be created for completed appointments"
        )
    
    # Check if prescription already exists for this appointment
    existing_prescription = db.query(Prescription).filter(
        Prescription.appointment_id == prescription_data.appointment_id
    ).first()
    
    if existing_prescription:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Prescription already exists for this appointment"
        )
    
    # Generate unique prescription ID
    prescription_id = generate_prescription_id()
    while db.query(Prescription).filter(Prescription.prescription_id == prescription_id).first():
        prescription_id = generate_prescription_id()
    
    # Convert medications to dict format for JSON storage
    medications_json = [med.dict() for med in prescription_data.medications]
    
    # Convert lab tests to dict format for JSON storage
    lab_tests_json = [test.dict() for test in prescription_data.lab_tests] if prescription_data.lab_tests else []
    
    # Create new prescription
    new_prescription = Prescription(
        appointment_id=prescription_data.appointment_id,
        patient_id=appointment.patient_id,
        doctor_id=current_doctor.id,
        prescription_id=prescription_id,
        diagnosis=prescription_data.diagnosis,
        medications=medications_json,
        lab_tests=lab_tests_json,
        advice=prescription_data.advice,
        follow_up=prescription_data.follow_up
    )
    
    db.add(new_prescription)
    db.commit()
    db.refresh(new_prescription)
    
    # Get related data for response
    patient = db.query(User).filter(User.id == appointment.patient_id).first()
    doctor = db.query(Doctor).filter(Doctor.id == current_doctor.id).first()
    
    # Build complete response with nested data
    response_dict = {
        "id": new_prescription.id,
        "appointment_id": new_prescription.appointment_id,
        "patient_id": new_prescription.patient_id,
        "doctor_id": new_prescription.doctor_id,
        "prescription_id": new_prescription.prescription_id,
        "diagnosis": new_prescription.diagnosis,
        "medications": new_prescription.medications,
        "lab_tests": new_prescription.lab_tests or [],
        "advice": new_prescription.advice,
        "follow_up": new_prescription.follow_up,
        "created_at": new_prescription.created_at,
        "updated_at": new_prescription.updated_at,
        "patient": {
            "id": patient.id,
            "name": patient.name,
            "phone": patient.phone,
            "date_of_birth": patient.date_of_birth,
            "blood_group": patient.blood_group
        },
        "doctor": {
            "id": doctor.id,
            "name": doctor.name or doctor.full_name,
            "full_name": doctor.full_name,
            "specialization": doctor.specialization,
            "degrees": doctor.degrees,
            "bmdc_number": doctor.bmdc_number
        },
        "appointment": {
            "appointment_date": appointment.appointment_date,
            "time_slot": appointment.time_slot
        }
    }
    
    return response_dict

@router.get("/doctor/appointments", response_model=List[dict])
async def get_doctor_completed_appointments(
    current_doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """
    Get all completed appointments for the current doctor
    Returns appointments that can have prescriptions created
    """
    
    appointments = db.query(Appointment).filter(
        Appointment.doctor_id == current_doctor.id,
        Appointment.status == AppointmentStatus.COMPLETED
    ).order_by(Appointment.appointment_date.desc()).all()
    
    result = []
    for apt in appointments:
        # Get patient details
        patient = db.query(User).filter(User.id == apt.patient_id).first()
        
        # Check if prescription exists
        prescription = db.query(Prescription).filter(
            Prescription.appointment_id == apt.id
        ).first()
        
        apt_dict = {
            "id": apt.id,
            "patient_id": apt.patient_id,
            "appointment_date": apt.appointment_date,
            "time_slot": apt.time_slot,
            "symptoms": apt.symptoms,
            "patient_notes": apt.patient_notes,
            "doctor_notes": apt.doctor_notes,
            "has_prescription": prescription is not None,
            "prescription_id": prescription.prescription_id if prescription else None,
            "patient": {
                "id": patient.id,
                "name": patient.name,
                "phone": patient.phone,
                "date_of_birth": patient.date_of_birth,
                "blood_group": patient.blood_group,
                "profile_picture_url": patient.profile_picture_url
            }
        }
        result.append(apt_dict)
    
    return result

@router.get("/appointment/{appointment_id}", response_model=PrescriptionResponse)
async def get_prescription_by_appointment(
    appointment_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get prescription for a specific appointment
    Accessible by both patient and doctor
    """
    
    prescription = db.query(Prescription).filter(
        Prescription.appointment_id == appointment_id
    ).first()
    
    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prescription not found for this appointment"
        )
    
    # Verify access rights
    if prescription.patient_id != current_user.id and prescription.doctor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this prescription"
        )
    
    # Get related data
    patient = db.query(User).filter(User.id == prescription.patient_id).first()
    doctor = db.query(Doctor).filter(Doctor.id == prescription.doctor_id).first()
    appointment = db.query(Appointment).filter(Appointment.id == prescription.appointment_id).first()
    
    # Build response with nested data
    response_dict = {
        "id": prescription.id,
        "appointment_id": prescription.appointment_id,
        "patient_id": prescription.patient_id,
        "doctor_id": prescription.doctor_id,
        "prescription_id": prescription.prescription_id,
        "diagnosis": prescription.diagnosis,
        "medications": prescription.medications,
        "advice": prescription.advice,
        "follow_up": prescription.follow_up,
        "created_at": prescription.created_at,
        "patient": {
            "id": patient.id,
            "name": patient.name,
            "phone": patient.phone,
            "date_of_birth": patient.date_of_birth,
            "blood_group": patient.blood_group
        },
        "doctor": {
            "id": doctor.id,
            "name": doctor.name or doctor.full_name,
            "full_name": doctor.full_name,
            "specialization": doctor.specialization,
            "degrees": doctor.degrees,
            "bmdc_number": doctor.bmdc_number
        },
        "appointment": {
            "appointment_date": appointment.appointment_date,
            "time_slot": appointment.time_slot
        }
    }
    
    return response_dict

@router.get("/patient/my-prescriptions", response_model=List[dict])
async def get_patient_prescriptions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all prescriptions for the current patient with complete details
    """
    
    prescriptions = db.query(Prescription).filter(
        Prescription.patient_id == current_user.id
    ).order_by(Prescription.created_at.desc()).all()
    
    result = []
    for presc in prescriptions:
        doctor = db.query(Doctor).filter(Doctor.id == presc.doctor_id).first()
        appointment = db.query(Appointment).filter(Appointment.id == presc.appointment_id).first()
        patient = db.query(User).filter(User.id == presc.patient_id).first()
        
        presc_dict = {
            "id": presc.id,
            "appointment_id": presc.appointment_id,
            "prescription_id": presc.prescription_id,
            "diagnosis": presc.diagnosis,
            "medications": presc.medications,  # Include medications
            "lab_tests": presc.lab_tests or [],  # Include lab tests
            "advice": presc.advice,  # Include advice
            "follow_up": presc.follow_up,  # Include follow_up
            "created_at": presc.created_at,
            "updated_at": presc.updated_at,
            "patient": {
                "id": patient.id,
                "name": patient.name,
                "phone": patient.phone,
                "date_of_birth": patient.date_of_birth,
                "blood_group": patient.blood_group
            },
            "doctor": {
                "id": doctor.id,
                "name": doctor.name or doctor.full_name,
                "specialization": doctor.specialization,
                "license_number": doctor.bmdc_number
            },
            "appointment": {
                "appointment_date": appointment.appointment_date,
                "time_slot": appointment.time_slot
            }
        }
        result.append(presc_dict)
    
    return result

@router.put("/{prescription_id}", response_model=PrescriptionResponse)
async def update_prescription(
    prescription_id: int,
    prescription_data: PrescriptionCreate,
    current_doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """
    Update an existing prescription
    Only the doctor who created it can update
    """
    
    prescription = db.query(Prescription).filter(
        Prescription.id == prescription_id
    ).first()
    
    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prescription not found"
        )
    
    if prescription.doctor_id != current_doctor.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own prescriptions"
        )
    
    # Convert medications to dict format
    medications_json = [med.dict() for med in prescription_data.medications]
    
    # Convert lab tests to dict format
    lab_tests_json = [test.dict() for test in prescription_data.lab_tests] if prescription_data.lab_tests else []
    
    # Update prescription
    prescription.diagnosis = prescription_data.diagnosis
    prescription.medications = medications_json
    prescription.lab_tests = lab_tests_json
    prescription.advice = prescription_data.advice
    prescription.follow_up = prescription_data.follow_up
    
    db.commit()
    db.refresh(prescription)
    
    return prescription
