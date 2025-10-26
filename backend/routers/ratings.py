"""
Rating Router
Handles doctor rating and review functionality
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from database import get_db
from models import DoctorRating, Doctor, User, Appointment, AppointmentStatus
from schemas import RatingCreate, RatingUpdate, RatingResponse, DoctorRatingStats
from auth import get_current_user

router = APIRouter(prefix="/api/ratings", tags=["ratings"])


@router.post("/", response_model=RatingResponse, status_code=status.HTTP_201_CREATED)
def create_rating(
    rating_data: RatingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a rating for a completed appointment
    - Patient can only rate appointments they were part of
    - Appointment must be completed
    - One rating per appointment
    """
    
    print(f"🌟 Creating rating for appointment {rating_data.appointment_id} by patient {current_user.id}")
    
    # Verify appointment exists and belongs to current user
    appointment = db.query(Appointment).filter(
        Appointment.id == rating_data.appointment_id,
        Appointment.patient_id == current_user.id
    ).first()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found or you don't have permission"
        )
    
    # Check if appointment is completed
    if appointment.status != AppointmentStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You can only rate completed appointments"
        )
    
    # Check if rating already exists
    existing_rating = db.query(DoctorRating).filter(
        DoctorRating.appointment_id == rating_data.appointment_id
    ).first()
    
    if existing_rating:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already rated this appointment"
        )
    
    # Create rating
    new_rating = DoctorRating(
        doctor_id=appointment.doctor_id,
        patient_id=current_user.id,
        appointment_id=rating_data.appointment_id,
        rating=rating_data.rating,
        review=rating_data.review
    )
    
    db.add(new_rating)
    db.commit()
    db.refresh(new_rating)
    
    # Update doctor's average rating
    update_doctor_average_rating(appointment.doctor_id, db)
    
    print(f"✅ Rating created successfully: {new_rating.rating} stars for doctor {appointment.doctor_id}")
    
    return new_rating


@router.get("/appointment/{appointment_id}", response_model=RatingResponse)
def get_rating_by_appointment(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get rating for a specific appointment"""
    
    rating = db.query(DoctorRating).filter(
        DoctorRating.appointment_id == appointment_id
    ).first()
    
    if not rating:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rating not found"
        )
    
    # Add patient name
    patient = db.query(User).filter(User.id == rating.patient_id).first()
    if patient:
        rating.patient_name = patient.name or "Anonymous"
    
    return rating


@router.put("/{rating_id}", response_model=RatingResponse)
def update_rating(
    rating_id: int,
    rating_update: RatingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an existing rating"""
    
    rating = db.query(DoctorRating).filter(
        DoctorRating.id == rating_id,
        DoctorRating.patient_id == current_user.id
    ).first()
    
    if not rating:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rating not found or you don't have permission"
        )
    
    if rating_update.rating is not None:
        rating.rating = rating_update.rating
    if rating_update.review is not None:
        rating.review = rating_update.review
    
    db.commit()
    db.refresh(rating)
    
    # Update doctor's average rating
    update_doctor_average_rating(rating.doctor_id, db)
    
    print(f"✏️ Rating {rating_id} updated successfully")
    
    return rating


@router.delete("/{rating_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rating(
    rating_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a rating"""
    
    rating = db.query(DoctorRating).filter(
        DoctorRating.id == rating_id,
        DoctorRating.patient_id == current_user.id
    ).first()
    
    if not rating:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rating not found or you don't have permission"
        )
    
    doctor_id = rating.doctor_id
    db.delete(rating)
    db.commit()
    
    # Update doctor's average rating
    update_doctor_average_rating(doctor_id, db)
    
    print(f"🗑️ Rating {rating_id} deleted successfully")
    
    return None


@router.get("/doctor/{doctor_id}/stats", response_model=DoctorRatingStats)
def get_doctor_rating_stats(
    doctor_id: int,
    db: Session = Depends(get_db)
):
    """
    Get rating statistics for a doctor
    - Average rating
    - Total number of ratings
    - Distribution of ratings (1-5 stars)
    """
    
    # Check if doctor exists
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    
    # Get all ratings
    ratings = db.query(DoctorRating).filter(DoctorRating.doctor_id == doctor_id).all()
    
    if not ratings:
        return DoctorRatingStats(
            average_rating=0.0,
            total_ratings=0,
            rating_distribution={5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
        )
    
    # Calculate average
    total_ratings = len(ratings)
    average_rating = sum(r.rating for r in ratings) / total_ratings
    
    # Calculate distribution
    distribution = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
    for rating in ratings:
        distribution[rating.rating] += 1
    
    return DoctorRatingStats(
        average_rating=round(average_rating, 1),
        total_ratings=total_ratings,
        rating_distribution=distribution
    )


@router.get("/doctor/{doctor_id}/reviews", response_model=List[RatingResponse])
def get_doctor_reviews(
    doctor_id: int,
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    Get all reviews for a doctor
    - Returns reviews with text content
    - Sorted by most recent first
    """
    
    ratings = db.query(DoctorRating).filter(
        DoctorRating.doctor_id == doctor_id,
        DoctorRating.review.isnot(None),
        DoctorRating.review != ""
    ).order_by(DoctorRating.created_at.desc()).offset(skip).limit(limit).all()
    
    # Add patient names
    result = []
    for rating in ratings:
        patient = db.query(User).filter(User.id == rating.patient_id).first()
        rating_dict = RatingResponse(
            id=rating.id,
            doctor_id=rating.doctor_id,
            patient_id=rating.patient_id,
            appointment_id=rating.appointment_id,
            rating=rating.rating,
            review=rating.review,
            patient_name=patient.name if patient else "Anonymous",
            created_at=rating.created_at
        )
        result.append(rating_dict)
    
    return result


def update_doctor_average_rating(doctor_id: int, db: Session):
    """
    Helper function to update doctor's average rating and total ratings count
    """
    
    result = db.query(
        func.avg(DoctorRating.rating).label('avg_rating'),
        func.count(DoctorRating.id).label('total_ratings')
    ).filter(DoctorRating.doctor_id == doctor_id).first()
    
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if doctor:
        doctor.average_rating = round(result.avg_rating, 1) if result.avg_rating else 0.0
        doctor.total_ratings = result.total_ratings or 0
        db.commit()
        print(f"📊 Updated doctor {doctor_id} rating: {doctor.average_rating} ({doctor.total_ratings} reviews)")
