from pydantic import BaseModel, Field, validator
from typing import Optional
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
    
    class Config:
        from_attributes = True

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user_type: str  # "user" or "doctor"
    user_data: dict

class TokenData(BaseModel):
    phone: Optional[str] = None
    user_type: Optional[str] = None
