"""
Test script to verify prescription data in database
Run this from the backend directory: python scripts/test_prescriptions.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from models import Prescription, Appointment, User, Doctor

def test_prescriptions():
    db = SessionLocal()
    
    try:
        # Get all prescriptions
        prescriptions = db.query(Prescription).all()
        
        print(f"\n📋 Total Prescriptions: {len(prescriptions)}")
        print("=" * 60)
        
        if len(prescriptions) == 0:
            print("❌ No prescriptions found in database!")
            print("\nTo create test prescriptions:")
            print("1. Log in as a doctor")
            print("2. Mark some appointments as 'completed'")
            print("3. Use the Write Prescription page to create prescriptions")
            return
        
        for presc in prescriptions:
            print(f"\n✅ Prescription ID: {presc.prescription_id}")
            print(f"   Database ID: {presc.id}")
            print(f"   Appointment ID: {presc.appointment_id}")
            print(f"   Patient ID: {presc.patient_id}")
            print(f"   Doctor ID: {presc.doctor_id}")
            print(f"   Diagnosis: {presc.diagnosis[:50]}...")
            print(f"   Medications: {len(presc.medications)} item(s)")
            print(f"   Created: {presc.created_at}")
            
            # Get patient info
            patient = db.query(User).filter(User.id == presc.patient_id).first()
            if patient:
                print(f"   Patient Name: {patient.name}")
            
            # Get doctor info
            doctor = db.query(Doctor).filter(Doctor.id == presc.doctor_id).first()
            if doctor:
                print(f"   Doctor Name: {doctor.name or doctor.full_name}")
            
            print("-" * 60)
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_prescriptions()
