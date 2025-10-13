from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum

class UserRole(str, enum.Enum):
    PATIENT = "patient"
    DOCTOR = "doctor"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.PATIENT, nullable=False)
    
    # Profile Information
    name = Column(String, nullable=True)
    date_of_birth = Column(String, nullable=True)  # Format: YYYY-MM-DD
    blood_group = Column(String, nullable=True)  # A+, A-, B+, B-, AB+, AB-, O+, O-
    height = Column(Integer, nullable=True)  # Height in inches
    weight = Column(Integer, nullable=True)  # Weight in kg
    country = Column(String, nullable=True)
    state = Column(String, nullable=True)
    city = Column(String, nullable=True)
    profile_picture_url = Column(String, nullable=True)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Doctor(Base):
    __tablename__ = "doctors"
    
    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    specialization = Column(String, nullable=False)
    license_number = Column(String, unique=True, nullable=False)
    
    # Profile Information - New fields
    name = Column(String, nullable=True)  # Doctor's preferred name
    bmdc_number = Column(String, nullable=True)  # Bangladesh Medical & Dental Council number
    mbbs_certificate_url = Column(String, nullable=True)  # MBBS certificate file path
    fcps_certificate_url = Column(String, nullable=True)  # FCPS certificate file path
    degrees = Column(JSON, nullable=True)  # List of degrees: [{"degree": "MBBS", "institution": "DMC", "year": "2015"}, ...]
    profile_picture_url = Column(String, nullable=True)
    schedule = Column(JSON, nullable=True)  # Weekly schedule: {"monday": [{"start": "09:00", "end": "17:00"}], ...}
    
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class AIConsultation(Base):
    __tablename__ = "ai_consultations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    message_type = Column(String, default="text")  # 'text' or 'audio'
    symptoms_extracted = Column(JSON, nullable=True)
    recommended_doctors = Column(JSON, nullable=True)
    conversation_context = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", backref="consultations")

class AppointmentStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"

class Appointment(Base):
    __tablename__ = "appointments"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    
    # Appointment details
    appointment_date = Column(String, nullable=False)  # Format: YYYY-MM-DD
    time_slot = Column(String, nullable=False)  # Format: "09:00 AM - 10:00 AM"
    status = Column(Enum(AppointmentStatus, values_callable=lambda x: [e.value for e in x]), default=AppointmentStatus.PENDING, nullable=False)
    
    # Notes and symptoms
    symptoms = Column(Text, nullable=True)
    patient_notes = Column(Text, nullable=True)
    doctor_notes = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    patient = relationship("User", backref="appointments")
    doctor = relationship("Doctor", backref="appointments")
