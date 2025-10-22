# Vercel Serverless Function Entry Point for FastAPI
import sys
import os
from pathlib import Path

# Get the root directory
root_dir = Path(__file__).resolve().parent.parent

# Add backend directory to Python path
backend_dir = root_dir / "backend"
sys.path.insert(0, str(backend_dir))

# Change to backend directory for imports
os.chdir(backend_dir)

# Import FastAPI app
from main import app

# Export for Vercel
# Vercel automatically detects this and creates a serverless function
app = app
