from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from config import settings
from database import engine, Base
from routers import users_router, doctors_router, ai_router
# Force reload after .env changes
from routers.appointments import router as appointments_router
from routers.livekit import router as livekit_router
from routers.prescriptions import router as prescriptions_router
from routers.admin import router as admin_router
from pathlib import Path

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="Click & Care API",
    description="Backend API for Click & Care Medical Platform",
    version="1.0.0"
)

# Create uploads directory if it doesn't exist
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)

# Mount static files for uploaded images
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users_router)
app.include_router(doctors_router)
app.include_router(ai_router)
app.include_router(appointments_router)
app.include_router(livekit_router)
app.include_router(prescriptions_router)
app.include_router(admin_router)

@app.on_event("startup")
async def startup_event():
    """Verify configuration on startup"""
    print("\n" + "="*60)
    print("Click & Care API - Startup Configuration")
    print("="*60)
    print(f"Database URL: {settings.DATABASE_URL[:30]}...")
    print(f"Environment: {settings.ENVIRONMENT}")
    print(f"GEMINI_API_KEY loaded: {'Yes' if settings.GEMINI_API_KEY else 'No'}")
    if settings.GEMINI_API_KEY:
        print(f"GEMINI_API_KEY length: {len(settings.GEMINI_API_KEY)} characters")
        print(f"GEMINI_API_KEY preview: {settings.GEMINI_API_KEY[:15]}...")
    
    # Check for FFmpeg
    import subprocess
    import shutil
    ffmpeg_found = shutil.which("ffmpeg") is not None
    print(f"FFmpeg available: {'Yes' if ffmpeg_found else 'No (Audio features disabled)'}")
    if not ffmpeg_found:
        print("  WARNING: Install FFmpeg for audio recording features: choco install ffmpeg -y")
    else:
        print("WARNING: GEMINI_API_KEY is not set!")
    print("="*60 + "\n")

@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Click & Care API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "active"
    }

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
