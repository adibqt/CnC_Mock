"""
LiveKit API routes for video conferencing
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import logging

from database import get_db
from models import User, Doctor, Appointment
from auth import get_current_user
from services.livekit_service import livekit_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/livekit", tags=["livekit"])

class VideoCallRequest(BaseModel):
    appointment_id: int
    room_type: str = "consultation"  # consultation, emergency, group

class JoinRoomResponse(BaseModel):
    token: str
    url: str
    room_name: str
    participant_identity: str
    participant_name: str

@router.post("/join-appointment", response_model=JoinRoomResponse)
async def join_appointment_call(
    request: VideoCallRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate token for user to join appointment video call
    """
    try:
        # Get appointment details
        appointment = db.query(Appointment).filter(
            Appointment.id == request.appointment_id
        ).first()
        
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found"
            )
        
        #check for restart

        # Check if user is authorized (patient or doctor)
        if current_user.id != appointment.patient_id and current_user.id != appointment.doctor_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to join this appointment"
            )
        
        # Generate room name based on appointment
        room_name = f"appointment_{appointment.id}_{request.room_type}"
        
        # Determine participant identity and name
        print(f"\n🔍 PARTICIPANT IDENTITY DEBUG:")
        print(f"   Current user ID: {current_user.id}")
        print(f"   Has specialization: {hasattr(current_user, 'specialization')}")
        print(f"   Appointment patient_id: {appointment.patient_id}")
        print(f"   Appointment doctor_id: {appointment.doctor_id}")
        
        if hasattr(current_user, 'specialization'):  # Doctor
            participant_identity = f"doctor_{current_user.id}"
            participant_name = f"Dr. {current_user.full_name}"
            print(f"   ✅ IDENTIFIED AS DOCTOR: {participant_identity}")
        else:  # Patient
            participant_identity = f"patient_{current_user.id}"
            participant_name = current_user.name or current_user.full_name
            print(f"   ✅ IDENTIFIED AS PATIENT: {participant_identity}")
        
        # Generate access token
        token_data = livekit_service.generate_access_token(
            room_name=room_name,
            participant_identity=participant_identity,
            participant_name=participant_name
        )
        
        logger.info(f"🎥 Generated LiveKit token for user {current_user.id} ({participant_name}) in room {room_name}")
        logger.info(f"   Participant identity: {participant_identity}")
        logger.info(f"   LiveKit URL: {token_data['url']}")
        
        return JoinRoomResponse(
            token=token_data['token'],
            url=token_data['url'],
            room_name=token_data['room_name'],
            participant_identity=participant_identity,
            participant_name=participant_name
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error joining appointment call: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to join video call"
        )

@router.post("/create-room/{room_name}")
async def create_video_room(
    room_name: str,
    max_participants: int = 10,
    current_user: User = Depends(get_current_user)
):
    """
    Create a new video room (for doctors or admin users)
    """
    try:
        # Check if user is authorized to create rooms (doctors only for now)
        if not hasattr(current_user, 'specialization'):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only doctors can create video rooms"
            )
        
        room_data = await livekit_service.create_room(room_name, max_participants)
        
        logger.info(f"Created LiveKit room {room_name} by doctor {current_user.id}")
        
        return {
            "message": "Room created successfully",
            "room_data": room_data
        }
        
    except Exception as e:
        logger.error(f"Error creating video room: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create video room"
        )

@router.delete("/end-room/{room_name}")
async def end_video_room(
    room_name: str,
    current_user: User = Depends(get_current_user)
):
    """
    End a video room session
    """
    try:
        # Check if user is authorized to end rooms (doctors only for now)
        if not hasattr(current_user, 'specialization'):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only doctors can end video rooms"
            )
        
        result = await livekit_service.end_room(room_name)
        
        logger.info(f"Ended LiveKit room {room_name} by doctor {current_user.id}")
        
        return result
        
    except Exception as e:
        logger.error(f"Error ending video room: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to end video room"
        )

@router.get("/room-status/{appointment_id}")
async def get_room_status(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Check if a video room is active and how many participants are in it
    """
    logger.info(f"🎯 ROOM STATUS CHECK STARTED for appointment {appointment_id}")
    try:
        # Verify appointment exists and user has access
        appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
        logger.info(f"   Appointment found: {appointment is not None}")
        
        if not appointment:
            # Return inactive instead of raising exception for polling
            return {
                "is_active": False,
                "participant_count": 0,
                "room_name": f"appointment_{appointment_id}_consultation"
            }
        
        # Check if user is part of this appointment
        is_patient = appointment.patient_id == current_user.id
        is_doctor = hasattr(current_user, 'specialization') and appointment.doctor_id == current_user.id
        
        if not (is_patient or is_doctor):
            # Return inactive instead of raising exception for polling
            return {
                "is_active": False,
                "participant_count": 0,
                "room_name": f"appointment_{appointment_id}_consultation"
            }
        
        # Check room status - use same room name format as join-appointment
        room_name = f"appointment_{appointment_id}_consultation"
        
        # Close DB session before async LiveKit call to prevent connection pool issues
        db.close()
        
        try:
            print(f"\n🔍 CHECKING LIVEKIT ROOM: {room_name}")
            logger.info(f"🔍 Checking room status for: {room_name}")
            room_info = await livekit_service.get_room_info(room_name)
            print(f"✅ ROOM INFO: {room_info}")
            logger.info(f"✅ Room info received: {room_info}")
            
            is_active = room_info.get('is_active', False)
            participant_count = room_info.get('num_participants', 0)
            
            print(f"📊 RESULT - Active: {is_active}, Participants: {participant_count}")
            logger.info(f"📊 Room {room_name} - Active: {is_active}, Participants: {participant_count}")
            
            return {
                "is_active": is_active,
                "participant_count": participant_count,
                "room_name": room_name
            }
        except Exception as check_error:
            # Room doesn't exist or is empty - this is normal when no one is in the room
            logger.warning(f"⚠️ Room check failed for {room_name}: {str(check_error)}")
            return {
                "is_active": False,
                "participant_count": 0,
                "room_name": room_name,
                "message": "Room not currently active"
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking room status: {str(e)}")
        # Return inactive status on error
        return {
            "is_active": False,
            "participant_count": 0
        }