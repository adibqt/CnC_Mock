"""
AI Consultation Router
Handles AI-powered symptom analysis and doctor recommendations
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from auth import get_current_user
from models import User, Doctor, AIConsultation
from schemas import AIConsultationRequest, AIConsultationResponse, ConsultationHistoryResponse
from services.gemini_service import GeminiService
import speech_recognition as sr
from io import BytesIO
import os
from datetime import datetime

router = APIRouter(prefix="/api/ai", tags=["AI Consultation"])

# Initialize Gemini service
gemini_service = GeminiService()

@router.post("/analyze-symptoms", response_model=AIConsultationResponse)
async def analyze_symptoms(
    request: AIConsultationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Analyze user's text input for symptoms and recommend doctors
    
    - Extracts symptoms from natural language
    - Identifies severity and required specialty
    - Recommends relevant doctors from database
    - Stores consultation history
    """
    
    try:
        # Extract symptoms using Gemini AI
        symptoms_data = await gemini_service.analyze_symptoms(
            request.message, 
            request.conversation_history
        )
        
        # Get specialty needed
        specialty = symptoms_data.get("specialty_needed", "general")
        
        # Query available doctors based on specialty
        # Note: is_verified check removed temporarily to show all active doctors
        doctors = db.query(Doctor).filter(
            Doctor.specialization == specialty,
            Doctor.is_active == True
        ).all()
        
        # If no doctors found for specialty, get all available doctors as a fallback
        if not doctors:
            doctors = db.query(Doctor).filter(
                Doctor.is_active == True
            ).all()
        
        # Prepare doctor data for AI recommendation
        doctor_list = []
        for d in doctors:
            doctor_list.append({
                "id": d.id,
                "name": d.full_name,
                "specialization": d.specialization,
                "license_number": d.license_number,
                "profile_picture_url": d.profile_picture_url,
                "phone": d.phone
            })
        
        # Get AI recommendations for doctors
        recommendations = await gemini_service.recommend_doctors(
            symptoms_data, 
            doctor_list
        )
        
        # Save consultation to database
        consultation = AIConsultation(
            user_id=current_user.id,
            message=request.message,
            message_type="text",
            symptoms_extracted=symptoms_data,
            recommended_doctors=recommendations,
            conversation_context=request.conversation_history or []
        )
        db.add(consultation)
        db.commit()
        db.refresh(consultation)
        
        return {
            "symptoms": symptoms_data,
            "recommendations": recommendations,
            "emergency": symptoms_data.get("emergency", False),
            "ai_response": symptoms_data.get("ai_response", "I'm here to help you."),
            "consultation_id": consultation.id
        }
        
    except Exception as e:
        print(f"Error in analyze_symptoms: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze symptoms: {str(e)}"
        )

@router.post("/analyze-audio")
async def analyze_audio(
    audio: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Transcribe audio and analyze symptoms
    
    - Accepts audio file upload
    - Transcribes speech to text using Google Speech Recognition
    - Analyzes transcribed text for symptoms
    - Returns recommendations
    """
    
    try:
        # Validate audio file
        if not audio.content_type.startswith('audio/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an audio file"
            )
        
        # Read audio file
        audio_data = await audio.read()
        
        # Generate unique temporary file names
        timestamp = datetime.now().timestamp()
        temp_input_path = f"temp_audio_input_{current_user.id}_{timestamp}.webm"
        temp_wav_path = f"temp_audio_{current_user.id}_{timestamp}.wav"
        
        try:
            # Save the uploaded audio file temporarily
            with open(temp_input_path, "wb") as f:
                f.write(audio_data)
            
            # Convert audio to WAV format using pydub
            from pydub import AudioSegment
            from pydub.utils import which
            import time
            import subprocess
            
            # Try to locate FFmpeg
            ffmpeg_path = which("ffmpeg")
            if not ffmpeg_path:
                # Try common installation paths on Windows
                possible_paths = [
                    r"C:\ffmpeg\bin\ffmpeg.exe",
                    r"C:\Program Files\ffmpeg\bin\ffmpeg.exe",
                    r"C:\ProgramData\chocolatey\bin\ffmpeg.exe",
                ]
                for path in possible_paths:
                    if os.path.exists(path):
                        ffmpeg_path = path
                        AudioSegment.converter = path
                        break
                
                if not ffmpeg_path:
                    # Try to find it using where command
                    try:
                        result = subprocess.run(['where', 'ffmpeg'], capture_output=True, text=True)
                        if result.returncode == 0:
                            ffmpeg_path = result.stdout.strip().split('\n')[0]
                            AudioSegment.converter = ffmpeg_path
                    except:
                        pass
            
            if not ffmpeg_path:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="FFmpeg not found. Please install FFmpeg and restart the server. See install_ffmpeg.md for instructions."
                )
            
            # Load the audio file (supports webm, mp3, ogg, etc.)
            audio_segment = AudioSegment.from_file(temp_input_path)
            
            # Export as WAV with proper settings for speech recognition
            audio_segment.export(
                temp_wav_path,
                format="wav",
                parameters=["-ar", "16000", "-ac", "1"]  # 16kHz, mono
            )
            
            # Force Python to release the file handles
            audio_segment = None
            
            # Give Windows time to release file locks
            time.sleep(0.1)
            
            # Clean up input file with retry logic
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    if os.path.exists(temp_input_path):
                        os.remove(temp_input_path)
                    break
                except PermissionError:
                    if attempt < max_retries - 1:
                        time.sleep(0.2)
                    else:
                        # If still locked, just continue - it will be cleaned up later
                        print(f"Warning: Could not delete {temp_input_path}, will be cleaned up later")
            
            # Transcribe using speech recognition
            recognizer = sr.Recognizer()
            
            with sr.AudioFile(temp_wav_path) as source:
                audio_content = recognizer.record(source)
                text = recognizer.recognize_google(audio_content)
            
            # Clean up WAV file with retry logic
            for attempt in range(max_retries):
                try:
                    if os.path.exists(temp_wav_path):
                        os.remove(temp_wav_path)
                    break
                except PermissionError:
                    if attempt < max_retries - 1:
                        time.sleep(0.2)
                    else:
                        print(f"Warning: Could not delete {temp_wav_path}, will be cleaned up later")
            
        except sr.UnknownValueError:
            # Clean up temporary files with retry logic
            import time
            for temp_file in [temp_input_path, temp_wav_path]:
                for attempt in range(3):
                    try:
                        if os.path.exists(temp_file):
                            os.remove(temp_file)
                        break
                    except (PermissionError, OSError):
                        if attempt < 2:
                            time.sleep(0.2)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not understand audio. Please speak clearly and try again."
            )
        except sr.RequestError as e:
            # Clean up temporary files with retry logic
            import time
            for temp_file in [temp_input_path, temp_wav_path]:
                for attempt in range(3):
                    try:
                        if os.path.exists(temp_file):
                            os.remove(temp_file)
                        break
                    except (PermissionError, OSError):
                        if attempt < 2:
                            time.sleep(0.2)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Speech recognition service error: {str(e)}"
            )
        except Exception as e:
            # Clean up temporary files with retry logic
            import time
            for temp_file in [temp_input_path, temp_wav_path]:
                for attempt in range(3):
                    try:
                        if os.path.exists(temp_file):
                            os.remove(temp_file)
                        break
                    except (PermissionError, OSError):
                        if attempt < 2:
                            time.sleep(0.2)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Audio processing error: {str(e)}"
            )
        
        # Now analyze the transcribed text
        result = await analyze_symptoms(
            AIConsultationRequest(message=text),
            current_user,
            db
        )
        
        # Add transcription to response
        result_dict = dict(result)
        result_dict["transcription"] = text
        
        # Update consultation to mark as audio type
        consultation = db.query(AIConsultation).filter(
            AIConsultation.id == result_dict["consultation_id"]
        ).first()
        if consultation:
            consultation.message_type = "audio"
            db.commit()
        
        return result_dict
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in analyze_audio: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process audio: {str(e)}"
        )

@router.get("/consultation-history", response_model=List[ConsultationHistoryResponse])
async def get_consultation_history(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user's past AI consultations
    
    - Returns consultation history in reverse chronological order
    - Includes symptoms extracted and doctor recommendations
    - Limited to most recent consultations (default: 10)
    """
    
    try:
        consultations = db.query(AIConsultation).filter(
            AIConsultation.user_id == current_user.id
        ).order_by(
            AIConsultation.created_at.desc()
        ).limit(limit).all()
        
        return consultations
        
    except Exception as e:
        print(f"Error in get_consultation_history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve consultation history"
        )

@router.get("/consultation/{consultation_id}")
async def get_consultation_details(
    consultation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get details of a specific consultation
    """
    
    consultation = db.query(AIConsultation).filter(
        AIConsultation.id == consultation_id,
        AIConsultation.user_id == current_user.id
    ).first()
    
    if not consultation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultation not found"
        )
    
    return consultation

@router.delete("/consultation/{consultation_id}")
async def delete_consultation(
    consultation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a specific consultation from history
    """
    
    consultation = db.query(AIConsultation).filter(
        AIConsultation.id == consultation_id,
        AIConsultation.user_id == current_user.id
    ).first()
    
    if not consultation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultation not found"
        )
    
    db.delete(consultation)
    db.commit()
    
    return {"message": "Consultation deleted successfully"}

@router.post("/followup")
async def generate_followup(
    consultation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate AI follow-up question based on consultation history
    """
    
    # Get consultation history for context
    consultations = db.query(AIConsultation).filter(
        AIConsultation.user_id == current_user.id
    ).order_by(
        AIConsultation.created_at.desc()
    ).limit(5).all()
    
    conversation_history = [
        {
            "role": "user",
            "message": c.message,
            "symptoms": c.symptoms_extracted
        }
        for c in reversed(consultations)
    ]
    
    followup = await gemini_service.generate_followup(conversation_history)
    
    return {"followup": followup}

# Helper function to clean up old temporary audio files
def cleanup_temp_audio_files():
    """
    Clean up temporary audio files that are older than 1 hour
    This function can be called periodically or on startup
    """
    import glob
    import time
    
    current_time = time.time()
    one_hour_ago = current_time - 3600  # 1 hour in seconds
    
    # Find all temp audio files
    temp_patterns = ["temp_audio_*.webm", "temp_audio_*.wav"]
    
    for pattern in temp_patterns:
        for filepath in glob.glob(pattern):
            try:
                # Get file modification time
                file_mtime = os.path.getmtime(filepath)
                
                # If file is older than 1 hour, try to delete it
                if file_mtime < one_hour_ago:
                    os.remove(filepath)
                    print(f"Cleaned up old temp file: {filepath}")
            except Exception as e:
                print(f"Could not clean up {filepath}: {e}")
