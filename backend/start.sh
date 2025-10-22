#!/bin/bash
# Startup script for Render deployment
# This script runs migrations and starts the server

set -e

echo "🚀 Starting Click & Care Backend on Render..."

# Use Render's PORT environment variable, default to 8000 for local dev
PORT=${PORT:-8000}

echo "📡 Port: $PORT"

# Note: Database migrations should be run manually or via Render's deploy hook
# Not running migrations automatically to avoid conflicts with multiple instances

# Start the server
echo "🌐 Starting FastAPI server on port $PORT..."
exec uvicorn main:app --host 0.0.0.0 --port "$PORT" $@
