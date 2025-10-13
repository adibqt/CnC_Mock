"""
Appointment Router
Handles appointment booking and management between patients and doctors
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List
from datetime import datetime, timedelta
from database import get_db
from auth import get_current_user, get_current_doctor
from models import User, Doctor, Appointment, AppointmentStatus
from schemas import AppointmentCreate, AppointmentUpdate, AppointmentResponse

router = APIRouter(prefix="/api/appointments", tags=["Appointments"])

@router.post("/", response_model=AppointmentResponse)
async def create_appointment(
    appointment_data: AppointmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new appointment
    
    - Patient creates appointment with specific doctor
    - Validates doctor existence and availability
    - Prevents double-booking on same time slot
    """
    
    try:
        print(f"Creating appointment for user {current_user.id} with doctor {appointment_data.doctor_id}")
        print(f"Appointment data: {appointment_data}")
        
        # Verify doctor exists and is active
        doctor = db.query(Doctor).filter(
            Doctor.id == appointment_data.doctor_id,
            Doctor.is_active == True
        ).first()
        
        if not doctor:
            print(f"Doctor {appointment_data.doctor_id} not found or inactive")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Doctor not found or not available"
            )
        
        # Check if time slot is already booked
        existing_appointment = db.query(Appointment).filter(
            Appointment.doctor_id == appointment_data.doctor_id,
            Appointment.appointment_date == appointment_data.appointment_date,
            Appointment.time_slot == appointment_data.time_slot,
            Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED])
        ).first()
        
        if existing_appointment:
            print(f"Time slot {appointment_data.time_slot} already booked for {appointment_data.appointment_date}")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This time slot is already booked. Please choose another time."
            )
        
        # Create appointment
        new_appointment = Appointment(
            patient_id=current_user.id,
            doctor_id=appointment_data.doctor_id,
            appointment_date=appointment_data.appointment_date,
            time_slot=appointment_data.time_slot,
            symptoms=appointment_data.symptoms,
            patient_notes=appointment_data.patient_notes,
            status=AppointmentStatus.PENDING
        )
        
        db.add(new_appointment)
        db.commit()
        db.refresh(new_appointment)
        
        print(f"✓ Appointment created successfully: ID {new_appointment.id}")
        
        # Prepare response with patient and doctor details
        # Convert appointment_date to string if it's a date object
        appointment_date_str = new_appointment.appointment_date
        if hasattr(appointment_date_str, 'strftime'):
            appointment_date_str = appointment_date_str.strftime('%Y-%m-%d')
        
        response_data = {
            "id": new_appointment.id,
            "patient_id": new_appointment.patient_id,
            "doctor_id": new_appointment.doctor_id,
            "appointment_date": appointment_date_str,
            "time_slot": new_appointment.time_slot,
            "status": new_appointment.status.value if hasattr(new_appointment.status, 'value') else new_appointment.status,
            "symptoms": new_appointment.symptoms,
            "patient_notes": new_appointment.patient_notes,
            "doctor_notes": new_appointment.doctor_notes,
            "created_at": new_appointment.created_at,
            "updated_at": new_appointment.updated_at,
            "patient": {
                "id": current_user.id,
                "name": current_user.name or "Patient",
                "phone": current_user.phone,
                "profile_picture_url": current_user.profile_picture_url
            },
            "doctor": {
                "id": doctor.id,
                "name": doctor.full_name,
                "specialization": doctor.specialization,
                "phone": doctor.phone,
                "profile_picture_url": doctor.profile_picture_url
            }
        }
        
        return response_data
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"✗ Error creating appointment: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create appointment: {str(e)}"
        )

@router.get("/patient/my-appointments", response_model=List[AppointmentResponse])
async def get_patient_appointments(
    status_filter: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all appointments for current patient
    
    - Returns appointments sorted by date (newest first)
    - Optional status filter (pending, confirmed, completed, cancelled)
    - Includes doctor details
    """
    
    try:
        print(f"Fetching appointments for patient {current_user.id}")
        
        query = db.query(Appointment).filter(
            Appointment.patient_id == current_user.id
        )
        
        # Apply status filter if provided
        if status_filter:
            query = query.filter(Appointment.status == status_filter)
        
        appointments = query.order_by(Appointment.appointment_date.desc()).all()
        
        print(f"Found {len(appointments)} appointments for patient {current_user.id}")
        
        # Enrich with doctor details
        result = []
        for apt in appointments:
            doctor = db.query(Doctor).filter(Doctor.id == apt.doctor_id).first()
            
            # Convert appointment_date to string if it's a date object
            appointment_date_str = apt.appointment_date
            if hasattr(appointment_date_str, 'strftime'):
                appointment_date_str = appointment_date_str.strftime('%Y-%m-%d')
            
            apt_dict = {
                "id": apt.id,
                "patient_id": apt.patient_id,
                "doctor_id": apt.doctor_id,
                "appointment_date": appointment_date_str,
                "time_slot": apt.time_slot,
                "status": apt.status.value if hasattr(apt.status, 'value') else apt.status,
                "symptoms": apt.symptoms,
                "patient_notes": apt.patient_notes,
                "doctor_notes": apt.doctor_notes,
                "created_at": apt.created_at,
                "updated_at": apt.updated_at,
                "doctor": {
                    "id": doctor.id,
                    "name": doctor.full_name,
                    "specialization": doctor.specialization,
                    "phone": doctor.phone,
                    "profile_picture_url": doctor.profile_picture_url
                }
            }
            result.append(apt_dict)
        
        return result
        
    except Exception as e:
        print(f"✗ Error fetching patient appointments: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve appointments: {str(e)}"
        )

@router.get("/doctor/my-appointments", response_model=List[AppointmentResponse])
async def get_doctor_appointments(
    week: str = "current",  # "current" or "all"
    current_doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """
    Get all appointments for current doctor
    
    - Returns this week's appointments by default
    - Filter by week: 'current' for this week, 'all' for all appointments
    - Includes patient details
    """
    
    try:
        print(f"Fetching appointments for doctor {current_doctor.id}, week filter: {week}")
        
        query = db.query(Appointment).filter(
            Appointment.doctor_id == current_doctor.id
        )
        
        # Filter by current week if requested
        if week == "current":
            today = datetime.now().date()
            # Get start of week (Monday)
            start_of_week = today - timedelta(days=today.weekday())
            # Get end of week (Sunday)
            end_of_week = start_of_week + timedelta(days=6)
            
            print(f"Filtering appointments between {start_of_week} and {end_of_week}")
            
            # Since appointment_date is stored as string, we need to compare as strings
            start_str = start_of_week.strftime('%Y-%m-%d')
            end_str = end_of_week.strftime('%Y-%m-%d')
            
            query = query.filter(
                and_(
                    Appointment.appointment_date >= start_str,
                    Appointment.appointment_date <= end_str
                )
            )
        
        appointments = query.order_by(
            Appointment.appointment_date.asc(),
            Appointment.time_slot.asc()
        ).all()
        
        print(f"Found {len(appointments)} appointments for doctor {current_doctor.id}")
        
        # Enrich with patient details
        result = []
        for apt in appointments:
            patient = db.query(User).filter(User.id == apt.patient_id).first()
            
            # Convert appointment_date to string if it's a date object
            appointment_date_str = apt.appointment_date
            if hasattr(appointment_date_str, 'strftime'):
                appointment_date_str = appointment_date_str.strftime('%Y-%m-%d')
            
            apt_dict = {
                "id": apt.id,
                "patient_id": apt.patient_id,
                "doctor_id": apt.doctor_id,
                "appointment_date": appointment_date_str,
                "time_slot": apt.time_slot,
                "status": apt.status.value if hasattr(apt.status, 'value') else apt.status,
                "symptoms": apt.symptoms,
                "patient_notes": apt.patient_notes,
                "doctor_notes": apt.doctor_notes,
                "created_at": apt.created_at,
                "updated_at": apt.updated_at,
                "patient": {
                    "id": patient.id,
                    "name": patient.name or "Patient",
                    "phone": patient.phone,
                    "profile_picture_url": patient.profile_picture_url
                }
            }
            result.append(apt_dict)
        
        return result
        
    except Exception as e:
        print(f"✗ Error fetching doctor appointments: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve appointments: {str(e)}"
        )

@router.get("/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment_details(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get specific appointment details
    
    - Returns appointment with patient and doctor information
    - Only accessible by patient or doctor involved
    """
    
    try:
        appointment = db.query(Appointment).filter(
            Appointment.id == appointment_id
        ).first()
        
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found"
            )
        
        # Verify user has access (is patient or doctor in the appointment)
        # For simplicity, allowing patient access. Add doctor check if needed.
        if appointment.patient_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to view this appointment"
            )
        
        # Get doctor and patient details
        doctor = db.query(Doctor).filter(Doctor.id == appointment.doctor_id).first()
        patient = db.query(User).filter(User.id == appointment.patient_id).first()
        
        # Convert appointment_date to string if it's a date object
        appointment_date_str = appointment.appointment_date
        if hasattr(appointment_date_str, 'strftime'):
            appointment_date_str = appointment_date_str.strftime('%Y-%m-%d')
        
        return {
            "id": appointment.id,
            "patient_id": appointment.patient_id,
            "doctor_id": appointment.doctor_id,
            "appointment_date": appointment_date_str,
            "time_slot": appointment.time_slot,
            "status": appointment.status.value if hasattr(appointment.status, 'value') else appointment.status,
            "symptoms": appointment.symptoms,
            "patient_notes": appointment.patient_notes,
            "doctor_notes": appointment.doctor_notes,
            "created_at": appointment.created_at,
            "updated_at": appointment.updated_at,
            "doctor": {
                "id": doctor.id,
                "name": doctor.full_name,
                "specialization": doctor.specialization,
                "phone": doctor.phone,
                "profile_picture_url": doctor.profile_picture_url
            },
            "patient": {
                "id": patient.id,
                "name": patient.name or "Patient",
                "phone": patient.phone
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching appointment details: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve appointment details"
        )

@router.patch("/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(
    appointment_id: int,
    update_data: AppointmentUpdate,
    current_doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """
    Update appointment status and notes (Doctor only)
    
    - Only doctor can update appointment status
    - Can add doctor notes
    - Status transitions: pending -> confirmed -> completed
    """
    
    try:
        appointment = db.query(Appointment).filter(
            Appointment.id == appointment_id,
            Appointment.doctor_id == current_doctor.id
        ).first()
        
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found"
            )
        
        # Update fields if provided
        if update_data.status:
            appointment.status = update_data.status
        
        if update_data.doctor_notes is not None:
            appointment.doctor_notes = update_data.doctor_notes
        
        db.commit()
        db.refresh(appointment)
        
        # Get patient details for response
        patient = db.query(User).filter(User.id == appointment.patient_id).first()
        
        # Convert appointment_date to string if it's a date object
        appointment_date_str = appointment.appointment_date
        if hasattr(appointment_date_str, 'strftime'):
            appointment_date_str = appointment_date_str.strftime('%Y-%m-%d')
        
        return {
            "id": appointment.id,
            "patient_id": appointment.patient_id,
            "doctor_id": appointment.doctor_id,
            "appointment_date": appointment_date_str,
            "time_slot": appointment.time_slot,
            "status": appointment.status.value if hasattr(appointment.status, 'value') else appointment.status,
            "symptoms": appointment.symptoms,
            "patient_notes": appointment.patient_notes,
            "doctor_notes": appointment.doctor_notes,
            "created_at": appointment.created_at,
            "updated_at": appointment.updated_at,
            "patient": {
                "id": patient.id,
                "name": patient.name or "Patient",
                "phone": patient.phone
            },
            "doctor": {
                "id": current_doctor.id,
                "name": current_doctor.full_name,
                "specialization": current_doctor.specialization,
                "phone": current_doctor.phone,
                "profile_picture_url": current_doctor.profile_picture_url
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating appointment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update appointment"
        )

@router.delete("/{appointment_id}")
async def cancel_appointment(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cancel an appointment (Patient only)
    
    - Patient can cancel their own pending/confirmed appointments
    - Changes status to 'cancelled' rather than deleting
    """
    
    try:
        appointment = db.query(Appointment).filter(
            Appointment.id == appointment_id,
            Appointment.patient_id == current_user.id
        ).first()
        
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found"
            )
        
        # Check if appointment can be cancelled
        if appointment.status in [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot cancel appointment with status: {appointment.status}"
            )
        
        # Update status to cancelled
        appointment.status = AppointmentStatus.CANCELLED
        db.commit()
        
        return {
            "message": "Appointment cancelled successfully",
            "appointment_id": appointment_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error cancelling appointment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel appointment"
        )

@router.get("/doctor/{doctor_id}/available-slots")
async def get_doctor_available_slots(
    doctor_id: int,
    date: str,  # Format: YYYY-MM-DD
    db: Session = Depends(get_db)
):
    """
    Get available time slots for a doctor on a specific date
    
    - Returns all time slots from doctor's schedule
    - Marks slots as 'available' or 'booked'
    """
    
    try:
        # Get doctor
        doctor = db.query(Doctor).filter(
            Doctor.id == doctor_id,
            Doctor.is_active == True
        ).first()
        
        if not doctor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Doctor not found"
            )
        
        # Get doctor's schedule for the requested day
        schedule = doctor.schedule or {}
        
        # Get day of week
        try:
            date_obj = datetime.strptime(date, '%Y-%m-%d')
            day_name = date_obj.strftime('%A').lower()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Use YYYY-MM-DD"
            )
        
        # Get time slots from schedule
        day_schedule = schedule.get(day_name, [])
        
        if not day_schedule:
            return {
                "date": date,
                "day": day_name,
                "slots": [],
                "message": "Doctor is not available on this day"
            }
        
        # Generate time slots (e.g., hourly slots between start and end time)
        time_slots = []
        for shift in day_schedule:
            start_time = shift.get('start', '09:00')
            end_time = shift.get('end', '17:00')
            
            # Generate hourly slots
            start_hour = int(start_time.split(':')[0])
            end_hour = int(end_time.split(':')[0])
            
            for hour in range(start_hour, end_hour):
                slot_start = f"{hour:02d}:00"
                slot_end = f"{hour+1:02d}:00"
                time_slot = f"{slot_start} - {slot_end}"
                
                # Check if slot is booked
                is_booked = db.query(Appointment).filter(
                    Appointment.doctor_id == doctor_id,
                    Appointment.appointment_date == date,
                    Appointment.time_slot == time_slot,
                    Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED])
                ).first() is not None
                
                time_slots.append({
                    "time_slot": time_slot,
                    "available": not is_booked
                })
        
        return {
            "date": date,
            "day": day_name,
            "doctor_id": doctor_id,
            "doctor_name": doctor.full_name,
            "slots": time_slots
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching available slots: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve available slots"
        )
