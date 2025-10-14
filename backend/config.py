from pydantic_settings import BaseSettings
from typing import List
import json
import os
from pathlib import Path

# Get the directory where this config.py file is located
BASE_DIR = Path(__file__).resolve().parent

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    
    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days (7 * 24 * 60)
    
    # Gemini AI
    GEMINI_API_KEY: str = ""  # Will be required for AI features
    
    # LiveKit Configuration
    LIVEKIT_API_KEY: str = "your-api-key"
    LIVEKIT_API_SECRET: str = "your-api-secret"
    LIVEKIT_URL: str = "wss://your-livekit-server.livekit.io"
    
    # CORS
    CORS_ORIGINS: str = '["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"]'
    
    # Environment
    ENVIRONMENT: str = "development"
    
    class Config:
        # Explicitly set the .env file path relative to this config file
        env_file = str(BASE_DIR / ".env")
        env_file_encoding = 'utf-8'
        case_sensitive = True
        extra = 'ignore'  # Ignore extra fields in .env
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS_ORIGINS from JSON string to list"""
        try:
            return json.loads(self.CORS_ORIGINS)
        except:
            return ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"]

settings = Settings()
