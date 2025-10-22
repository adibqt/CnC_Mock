# Vercel Serverless Function Entry Point
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

# Vercel serverless function handler
def handler(request, context):
    return app(request, context)
