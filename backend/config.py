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
    
    # Vercel-specific settings
    VERCEL_URL: str = ""  # Will be auto-populated by Vercel
    
    # Railway-specific settings
    PORT: int = 8000  # Railway will set this via environment variable
    
    class Config:
        # Explicitly set the .env file path relative to this config file
        env_file = str(BASE_DIR / ".env")
        env_file_encoding = 'utf-8'
        case_sensitive = True
        extra = 'ignore'  # Ignore extra fields in .env
        
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        
        # Ensure CORS_ORIGINS is valid JSON
        if not self.CORS_ORIGINS or self.CORS_ORIGINS.strip() == '':
            self.CORS_ORIGINS = '["*"]'  # Default to allow all if empty
        
        # Auto-detect Railway environment
        if os.getenv('RAILWAY_ENVIRONMENT'):
            self.ENVIRONMENT = 'production'
        
        # Auto-detect Vercel environment
        if os.getenv('VERCEL'):
            self.ENVIRONMENT = 'production'
            # Update CORS to include Vercel URL
            vercel_url = os.getenv('VERCEL_URL', '')
            if vercel_url:
                try:
                    origins = json.loads(self.CORS_ORIGINS)
                    # Add Vercel URL if not already present
                    vercel_https = f"https://{vercel_url}"
                    if vercel_https not in origins and "*" not in origins:
                        origins.append(vercel_https)
                    self.CORS_ORIGINS = json.dumps(origins)
                except (json.JSONDecodeError, TypeError):
                    # If parsing fails, set to allow Vercel URL
                    self.CORS_ORIGINS = f'["https://{vercel_url}"]'
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS_ORIGINS from JSON string to list"""
        try:
            if not self.CORS_ORIGINS or self.CORS_ORIGINS.strip() == '':
                return ["*"]
            
            # Handle both JSON array and single wildcard
            if self.CORS_ORIGINS.strip() == '*':
                return ["*"]
            
            return json.loads(self.CORS_ORIGINS)
        except (json.JSONDecodeError, TypeError, ValueError):
            # Fallback to allow all if parsing fails
            return ["*"]

settings = Settings()
