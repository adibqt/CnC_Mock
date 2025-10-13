import asyncio
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Appointment, User, Doctor
from config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def check_appointments():
    db = SessionLocal()
    try:
        # Get all confirmed appointments
        appointments = db.query(Appointment).filter(
            Appointment.status == 'confirmed'
        ).all()
        
        print(f"\n{'='*80}")
        print("CONFIRMED APPOINTMENTS:")
        print(f"{'='*80}\n")
        
        for apt in appointments:
            patient = db.query(User).filter(User.id == apt.patient_id).first()
            doctor = db.query(Doctor).filter(Doctor.id == apt.doctor_id).first()
            
            print(f"Appointment ID: {apt.id}")
            print(f"  Patient: {patient.name if patient else 'Unknown'} (ID: {apt.patient_id})")
            print(f"  Doctor: {doctor.full_name if doctor else 'Unknown'} (ID: {apt.doctor_id})")
            print(f"  Date: {apt.appointment_date}")
            print(f"  Status: {apt.status}")
            print(f"  LiveKit Room: appointment_{apt.id}_consultation")
            print()
        
        print(f"{'='*80}\n")
        
    finally:
        db.close()

if __name__ == "__main__":
    check_appointments()
