import sys
sys.path.insert(0, '.')

from database import SessionLocal
from models import Prescription, User

db = SessionLocal()
p = db.query(Prescription).first()

if p:
    patient = db.query(User).filter(User.id == p.patient_id).first()
    print(f'\nPrescription found!')
    print(f'Prescription ID: {p.prescription_id}')
    print(f'Patient ID: {p.patient_id}')
    if patient:
        print(f'Patient Name: {patient.name}')
        print(f'Patient Email: {patient.email}')
    print(f'Diagnosis: {p.diagnosis}')
    print(f'Medications: {p.medications}')
else:
    print('No prescriptions found')

db.close()
