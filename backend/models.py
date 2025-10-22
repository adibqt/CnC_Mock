from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum, Text, JSON, ForeignKey, Numeric, Float, UniqueConstraint, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum

class UserRole(str, enum.Enum):
    PATIENT = "patient"
    DOCTOR = "doctor"
    ADMIN = "admin"

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
    appointment_date = Column(Date, nullable=False)  # Changed from String to Date
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

class Prescription(Base):
    __tablename__ = "prescriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=False, unique=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    
    # Prescription Details
    prescription_id = Column(String, unique=True, nullable=False, index=True)  # e.g., "CC-84321"
    diagnosis = Column(Text, nullable=False)
    medications = Column(JSON, nullable=False)  # List of medication objects
    lab_tests = Column(JSON, nullable=True, default=[])  # List of lab test objects
    advice = Column(Text, nullable=True)
    follow_up = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    appointment = relationship("Appointment", backref="prescription")
    patient = relationship("User", backref="prescriptions")
    doctor = relationship("Doctor", backref="prescriptions")

class Admin(Base):
    __tablename__ = "admins"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=True)
    role = Column(String, default="admin", nullable=False)  # Can be 'admin' or 'super_admin'
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)

class Specialization(Base):
    __tablename__ = "specializations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(Integer, ForeignKey("admins.id"), nullable=True)

class Symptom(Base):
    __tablename__ = "symptoms"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=True)  # e.g., "General", "Respiratory", "Digestive"
    suggested_specialization_id = Column(Integer, ForeignKey("specializations.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(Integer, ForeignKey("admins.id"), nullable=True)

class Pharmacy(Base):
    __tablename__ = "pharmacies"
    
    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    # Pharmacy Details
    pharmacy_name = Column(String, nullable=False, index=True)
    owner_name = Column(String, nullable=True)
    license_number = Column(String, unique=True, nullable=False, index=True)
    
    # Address Information
    street_address = Column(String, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    postal_code = Column(String, nullable=False)
    country = Column(String, default="Bangladesh", nullable=False)
    
    # Contact Information
    email = Column(String, unique=True, nullable=True)
    alternate_phone = Column(String, nullable=True)
    
    # Verification & Status
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    verified_by = Column(Integer, ForeignKey("admins.id"), nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class QuotationStatus(str, enum.Enum):
    PENDING = "pending"
    QUOTED = "quoted"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    CANCELLED = "cancelled"

class QuotationRequest(Base):
    __tablename__ = "quotation_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id"), nullable=False)
    
    # Request Details
    status = Column(Enum(QuotationStatus, values_callable=lambda x: [e.value for e in x]), default=QuotationStatus.PENDING, nullable=False)
    patient_notes = Column(Text, nullable=True)  # Additional requests or preferences
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    patient = relationship("User", backref="quotation_requests")
    prescription = relationship("Prescription", backref="quotation_requests")
    target_pharmacies = relationship(
        "QuotationRequestPharmacy",
        back_populates="quotation_request",
        cascade="all, delete-orphan"
    )

class QuotationResponse(Base):
    __tablename__ = "quotation_responses"
    
    id = Column(Integer, primary_key=True, index=True)
    quotation_request_id = Column(Integer, ForeignKey("quotation_requests.id"), nullable=False)
    pharmacy_id = Column(Integer, ForeignKey("pharmacies.id"), nullable=False)
    
    # Quotation Details
    quoted_items = Column(JSON, nullable=False)  # List of items: [{"medicine": "Med A", "quantity": 10, "unit_price": 50, "total_price": 500}, ...]
    subtotal = Column(Numeric(10, 2), nullable=False)  # Total of all items
    delivery_charge = Column(Numeric(10, 2), default=0.00, nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)  # Subtotal + Delivery
    
    # Additional Information
    notes = Column(Text, nullable=True)  # Pharmacy's message to patient
    estimated_delivery_time = Column(String, nullable=True)  # e.g., "2-3 hours", "Next day"
    
    # Status
    status = Column(Enum(QuotationStatus, values_callable=lambda x: [e.value for e in x]), default=QuotationStatus.QUOTED, nullable=False)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    quotation_request = relationship("QuotationRequest", backref="quotation_responses")
    pharmacy = relationship("Pharmacy", backref="quotation_responses")


class QuotationRequestPharmacy(Base):
    __tablename__ = "quotation_request_pharmacies"

    id = Column(Integer, primary_key=True, index=True)
    quotation_request_id = Column(Integer, ForeignKey("quotation_requests.id", ondelete="CASCADE"), nullable=False)
    pharmacy_id = Column(Integer, ForeignKey("pharmacies.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("quotation_request_id", "pharmacy_id", name="uq_request_pharmacy"),
    )

    quotation_request = relationship("QuotationRequest", back_populates="target_pharmacies")
    pharmacy = relationship("Pharmacy", backref="quotation_request_targets")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String(50), nullable=False, default="general")
    data = Column(JSON, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    read_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", backref="notifications")


class Clinic(Base):
    __tablename__ = "clinics"
    
    id = Column(Integer, primary_key=True, index=True)
    clinic_name = Column(String, nullable=False, index=True)
    phone = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    
    # Clinic Information
    license_number = Column(String, unique=True, nullable=False)
    address = Column(String, nullable=False)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    postal_code = Column(String, nullable=True)
    email = Column(String, nullable=True)
    
    # Verification
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    verified_by = Column(Integer, nullable=True)  # Admin ID who verified
    
    # Additional Info
    services_offered = Column(JSON, nullable=True)  # List of lab tests offered
    operating_hours = Column(String, nullable=True)
    contact_person = Column(String, nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class LabTestQuotationRequest(Base):
    __tablename__ = "lab_test_quotation_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Request Details
    lab_tests = Column(JSON, nullable=False)  # List of lab tests from prescription
    additional_notes = Column(Text, nullable=True)
    
    # Status
    status = Column(String, default="pending")  # pending, accepted, completed, cancelled
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    prescription = relationship("Prescription", backref="lab_quotation_requests")
    patient = relationship("User", backref="lab_quotation_requests")
    target_clinics = relationship("LabTestQuotationRequestClinic", back_populates="quotation_request")


class LabTestQuotationResponse(Base):
    __tablename__ = "lab_test_quotation_responses"
    
    id = Column(Integer, primary_key=True, index=True)
    quotation_request_id = Column(Integer, ForeignKey("lab_test_quotation_requests.id"), nullable=False)
    clinic_id = Column(Integer, ForeignKey("clinics.id"), nullable=False)
    
    # Response Details
    test_items = Column(JSON, nullable=False)  # List of {test_name, price, notes}
    total_amount = Column(Float, nullable=False)
    estimated_delivery = Column(String, nullable=True)  # e.g., "24 hours", "2-3 days"
    additional_notes = Column(Text, nullable=True)
    
    # Status
    is_accepted = Column(Boolean, default=False)
    accepted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    quotation_request = relationship("LabTestQuotationRequest", backref="quotation_responses")
    clinic = relationship("Clinic", backref="lab_quotation_responses")


class LabTestQuotationRequestClinic(Base):
    __tablename__ = "lab_test_quotation_request_clinics"

    id = Column(Integer, primary_key=True, index=True)
    quotation_request_id = Column(Integer, ForeignKey("lab_test_quotation_requests.id", ondelete="CASCADE"), nullable=False)
    clinic_id = Column(Integer, ForeignKey("clinics.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("quotation_request_id", "clinic_id", name="uq_lab_request_clinic"),
    )

    quotation_request = relationship("LabTestQuotationRequest", back_populates="target_clinics")
    clinic = relationship("Clinic", backref="lab_quotation_request_targets")


class LabReport(Base):
    __tablename__ = "lab_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    quotation_response_id = Column(Integer, ForeignKey("lab_test_quotation_responses.id"), nullable=False)
    clinic_id = Column(Integer, ForeignKey("clinics.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Report Details
    report_id = Column(String, unique=True, nullable=False, index=True)  # e.g., "LAB-12345"
    report_title = Column(String, nullable=False)
    test_results = Column(JSON, nullable=False)  # List of {test_name, result, unit, normal_range, status}
    diagnosis_notes = Column(Text, nullable=True)
    technician_name = Column(String, nullable=True)
    pathologist_name = Column(String, nullable=True)
    
    # File Attachments
    report_file_url = Column(String, nullable=True)  # PDF report path
    report_images = Column(JSON, nullable=True)  # List of image paths
    
    # Status
    status = Column(String, default="pending")  # pending, completed, verified
    verified_at = Column(DateTime(timezone=True), nullable=True)
    
    # Metadata
    test_date = Column(DateTime(timezone=True), nullable=True)
    report_date = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    quotation_response = relationship("LabTestQuotationResponse", backref="lab_report")
    clinic = relationship("Clinic", backref="lab_reports")
    patient = relationship("User", backref="lab_reports")

