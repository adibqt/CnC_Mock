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
    created_at: datetime
    
    class Config:
        from_attributes = True

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
