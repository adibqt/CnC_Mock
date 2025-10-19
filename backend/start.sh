#!/bin/bash
# Startup script for Docker container
# This script runs migrations and starts the server

set -e

echo "🚀 Starting Click & Care Backend..."

# Wait for database to be ready
echo "⏳ Waiting for database..."
while ! nc -z postgres 5432; do
  sleep 0.1
done
echo "✅ Database is ready!"

# Run migrations
echo "🔄 Running database migrations..."
python migrations/migrate_admin.py
python migrations/migrate_profile.py
python migrations/migrate_doctor_profile.py
python migrations/migrate_schedule.py
python migrations/migrate_appointments.py
python migrations/migrate_ai_consultations.py
python migrations/migrate_prescriptions.py
echo "✅ Migrations completed!"

# Start the server
echo "🌐 Starting FastAPI server..."
exec uvicorn main:app --host 0.0.0.0 --port 8000 $@
