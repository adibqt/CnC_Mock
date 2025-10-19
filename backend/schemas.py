from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    phone: str = Field(..., min_length=10, max_length=20)

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=72, description="Password must be 6-72 characters")

class UserLogin(BaseModel):
    phone: str
    password: str = Field(..., max_length=72)

class UserResponse(UserBase):
    id: int
    role: str
    is_active: bool
    name: Optional[str] = None
    date_of_birth: Optional[str] = None
    blood_group: Optional[str] = None
    height: Optional[int] = None
    weight: Optional[int] = None
    country: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    profile_picture_url: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class ProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    date_of_birth: Optional[str] = Field(None, pattern=r'^\d{4}-\d{2}-\d{2}$')
    blood_group: Optional[str] = Field(None, pattern=r'^(A|B|AB|O)[+-]$')
    height: Optional[int] = Field(None, ge=0, le=300, description="Height in inches")
    weight: Optional[int] = Field(None, ge=0, le=500, description="Weight in kg")
    country: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    city: Optional[str] = Field(None, max_length=100)
    
    @validator('blood_group')
    def validate_blood_group(cls, v):
        if v and v not in ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']:
            raise ValueError('Invalid blood group. Must be A+, A-, B+, B-, AB+, AB-, O+, or O-')
        return v

# Doctor Schemas
class DoctorBase(BaseModel):
    phone: str = Field(..., min_length=10, max_length=20)
    full_name: str = Field(..., min_length=3, max_length=100)
    specialization: str
    license_number: str

class DoctorCreate(DoctorBase):
    password: str = Field(..., min_length=6, max_length=72, description="Password must be 6-72 characters")
    
    @validator('full_name')
    def name_must_not_be_empty(cls, v):
        if not v or v.strip() == '':
            raise ValueError('Full name cannot be empty')
        return v.strip()
    
    @validator('license_number')
    def license_must_not_be_empty(cls, v):
        if not v or v.strip() == '':
            raise ValueError('License number cannot be empty')
        return v.strip()

class DoctorLogin(BaseModel):
    phone: str
    password: str = Field(..., max_length=72)

class DoctorResponse(DoctorBase):
    id: int
    is_verified: bool
    is_active: bool
    created_at: datetime
    name: Optional[str] = None
    bmdc_number: Optional[str] = None
    mbbs_certificate_url: Optional[str] = None
    fcps_certificate_url: Optional[str] = None
    degrees: Optional[list] = None
    profile_picture_url: Optional[str] = None
    
    class Config:
        from_attributes = True

class DoctorProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    bmdc_number: Optional[str] = Field(None, min_length=4, max_length=20)
    degrees: Optional[list] = None  # List of {degree, institution, year}
    
    @validator('degrees')
    def validate_degrees(cls, v):
        if v:
            for degree in v:
                if not isinstance(degree, dict):
                    raise ValueError('Each degree must be a dictionary')
                if 'degree' not in degree or 'institution' not in degree:
                    raise ValueError('Each degree must have "degree" and "institution" fields')
        return v

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user_type: str  # "user" or "doctor"
    user_data: dict

class TokenData(BaseModel):
    phone: Optional[str] = None
    user_type: Optional[str] = None

# AI Consultation Schemas
class AIConsultationRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=5000)
    conversation_history: Optional[list] = None

class AIConsultationResponse(BaseModel):
    symptoms: dict
    recommendations: dict
    emergency: bool
    ai_response: str
    consultation_id: int
    
    class Config:
        from_attributes = True

class ConsultationHistoryResponse(BaseModel):
    id: int
    message: str
    message_type: str
    symptoms_extracted: Optional[dict]
    recommended_doctors: Optional[dict]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Appointment Schemas
class AppointmentCreate(BaseModel):
    doctor_id: int = Field(..., gt=0)
    appointment_date: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}$')
    time_slot: str = Field(..., min_length=1, max_length=50)
    symptoms: Optional[str] = Field(None, max_length=2000)
    patient_notes: Optional[str] = Field(None, max_length=1000)
    
    @validator('appointment_date')
    def validate_future_date(cls, v):
        from datetime import datetime, timedelta
        try:
            appointment_date = datetime.strptime(v, '%Y-%m-%d').date()
            today = datetime.now().date()
            # Allow appointments from tomorrow onwards
            if appointment_date <= today:
                raise ValueError('Appointment date must be at least one day in the future')
        except ValueError as e:
            if "does not match format" in str(e):
                raise ValueError('Date must be in YYYY-MM-DD format')
            raise
        return v

class AppointmentUpdate(BaseModel):
    status: Optional[str] = None
    doctor_notes: Optional[str] = Field(None, max_length=1000)
    
    @validator('status')
    def validate_status(cls, v):
        if v and v not in ['pending', 'confirmed', 'completed', 'cancelled', 'no_show']:
            raise ValueError('Invalid status')
        return v

class AppointmentResponse(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    appointment_date: str
    time_slot: str
    status: str
    symptoms: Optional[str]
    patient_notes: Optional[str]
    doctor_notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    
    # Nested data
    patient: Optional[dict] = None
    doctor: Optional[dict] = None
    
    class Config:
        from_attributes = True

# Prescription Schemas
class MedicationItem(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    dosage: str = Field(..., min_length=1, max_length=100)
    frequency: str = Field(..., min_length=1, max_length=200)
    duration: str = Field(..., min_length=1, max_length=100)
    notes: Optional[str] = Field(None, max_length=500)

class PrescriptionCreate(BaseModel):
    appointment_id: int = Field(..., gt=0)
    diagnosis: str = Field(..., min_length=1, max_length=5000)
    medications: list[MedicationItem] = Field(..., min_items=1)
    advice: Optional[str] = Field(None, max_length=2000)
    follow_up: Optional[str] = Field(None, max_length=1000)

class PrescriptionResponse(BaseModel):
    id: int
    appointment_id: int
    patient_id: int
    doctor_id: int
    prescription_id: str
    diagnosis: str
    medications: list
    advice: Optional[str]
    follow_up: Optional[str]
    created_at: datetime
    
    # Nested data
    patient: Optional[dict] = None
    doctor: Optional[dict] = None
    appointment: Optional[dict] = None
    
    class Config:
        from_attributes = True

# Admin Schemas
class AdminLogin(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6, max_length=72)

class AdminResponse(BaseModel):
    id: int
    username: str
    full_name: str
    email: Optional[str]
    role: str
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime]
    
    class Config:
        from_attributes = True

# Specialization Schemas
class SpecializationCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)

class SpecializationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    is_active: Optional[bool] = None

class SpecializationResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Symptom Schemas
class SymptomCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    category: Optional[str] = Field(None, max_length=100)
    suggested_specialization_id: Optional[int] = None

class SymptomUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    category: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None
    suggested_specialization_id: Optional[int] = None

class SymptomResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    category: Optional[str]
    suggested_specialization_id: Optional[int]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Admin Management Schemas
class UserManagementUpdate(BaseModel):
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None

class DoctorVerificationUpdate(BaseModel):
    is_verified: Optional[bool] = None
    is_active: Optional[bool] = None

# Pharmacy Schemas
class PharmacyBase(BaseModel):
    phone: str = Field(..., min_length=10, max_length=20)
    pharmacy_name: str = Field(..., min_length=2, max_length=200)
    license_number: str = Field(..., min_length=3, max_length=100)

class PharmacyCreate(PharmacyBase):
    password: str = Field(..., min_length=6, max_length=72, description="Password must be 6-72 characters")
    owner_name: Optional[str] = Field(None, max_length=100)
    street_address: str = Field(..., min_length=5, max_length=300)
    city: str = Field(..., min_length=2, max_length=100)
    state: str = Field(..., min_length=2, max_length=100)
    postal_code: str = Field(..., min_length=3, max_length=20)
    country: Optional[str] = Field("Bangladesh", max_length=100)
    email: Optional[str] = Field(None, max_length=200)
    alternate_phone: Optional[str] = Field(None, max_length=20)
    
    @validator('pharmacy_name', 'owner_name')
    def name_must_not_be_empty(cls, v):
        if v and v.strip() == '':
            raise ValueError('Name cannot be empty')
        return v.strip() if v else v

class PharmacyLogin(BaseModel):
    phone: str
    password: str = Field(..., max_length=72)

class PharmacyResponse(PharmacyBase):
    id: int
    owner_name: Optional[str]
    street_address: str
    city: str
    state: str
    postal_code: str
    country: str
    email: Optional[str]
    alternate_phone: Optional[str]
    is_verified: bool
    is_active: bool
    verified_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True

class PharmacyProfileUpdate(BaseModel):
    pharmacy_name: Optional[str] = Field(None, min_length=2, max_length=200)
    owner_name: Optional[str] = Field(None, max_length=100)
    street_address: Optional[str] = Field(None, min_length=5, max_length=300)
    city: Optional[str] = Field(None, min_length=2, max_length=100)
    state: Optional[str] = Field(None, min_length=2, max_length=100)
    postal_code: Optional[str] = Field(None, min_length=3, max_length=20)
    email: Optional[str] = Field(None, max_length=200)
    alternate_phone: Optional[str] = Field(None, max_length=20)

class PharmacyVerificationUpdate(BaseModel):
    is_verified: Optional[bool] = None
    is_active: Optional[bool] = None

# Quotation Schemas
class QuotationTargetPharmacy(BaseModel):
    id: int
    pharmacy_name: str
    city: Optional[str]
    state: Optional[str]

    class Config:
        from_attributes = True


class QuotationRequestCreate(BaseModel):
    prescription_id: int = Field(..., gt=0)
    pharmacy_ids: List[int] = Field(..., min_items=1, description="List of pharmacy IDs to receive the request")
    patient_notes: Optional[str] = Field(None, max_length=1000)

    @validator('pharmacy_ids')
    def validate_pharmacy_ids(cls, v):
        if len(set(v)) != len(v):
            raise ValueError('Duplicate pharmacy IDs are not allowed')
        return v

class QuotationRequestResponse(BaseModel):
    id: int
    patient_id: int
    prescription_id: int
    status: str
    patient_notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    
    # Nested data
    patient: Optional[dict] = None
    prescription: Optional[dict] = None
    quotation_responses: Optional[list] = []
    target_pharmacies: Optional[List[QuotationTargetPharmacy]] = None
    
    class Config:
        from_attributes = True

class QuotedItem(BaseModel):
    medicine: str = Field(..., min_length=1, max_length=200)
    quantity: int = Field(..., gt=0)
    unit_price: float = Field(..., gt=0)
    total_price: float = Field(..., gt=0)
    
    @validator('total_price')
    def validate_total_price(cls, v, values):
        if 'quantity' in values and 'unit_price' in values:
            expected = values['quantity'] * values['unit_price']
            if abs(v - expected) > 0.01:  # Allow small floating point differences
                raise ValueError('Total price must equal quantity * unit_price')
        return v

class QuotationResponseCreate(BaseModel):
    quotation_request_id: int = Field(..., gt=0)
    quoted_items: list[QuotedItem] = Field(..., min_items=1)
    delivery_charge: Optional[float] = Field(0.00, ge=0)
    notes: Optional[str] = Field(None, max_length=1000)
    estimated_delivery_time: Optional[str] = Field(None, max_length=100)
    
    @validator('quoted_items')
    def validate_quoted_items(cls, v):
        if not v:
            raise ValueError('At least one item must be quoted')
        return v

class QuotationResponseUpdate(BaseModel):
    status: Optional[str] = None
    
    @validator('status')
    def validate_status(cls, v):
        if v and v not in ['quoted', 'accepted', 'rejected', 'cancelled']:
            raise ValueError('Invalid status')
        return v

class QuotationResponseResponse(BaseModel):
    id: int
    quotation_request_id: int
    pharmacy_id: int
    quoted_items: list
    subtotal: float
    delivery_charge: float
    total_amount: float
    notes: Optional[str]
    estimated_delivery_time: Optional[str]
    status: str
    created_at: datetime
    updated_at: Optional[datetime]
    
    # Nested data
    pharmacy: Optional[dict] = None
    quotation_request: Optional[dict] = None
    
    class Config:
        from_attributes = True


# Notification Schemas
class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    category: str
    is_read: bool
    created_at: datetime
    data: Optional[dict] = None

    class Config:
        from_attributes = True


class NotificationMarkRead(BaseModel):
    is_read: bool = True

