from database import SessionLocal
from models import User, Appointment

db = SessionLocal()

# Find patient by phone
patient = db.query(User).filter(User.phone == '01913511381').first()

if patient:
    print(f'✅ Patient found!')
    print(f'   ID: {patient.id}')
    print(f'   Name: {patient.name}')
    print(f'   Phone: {patient.phone}')
    
    # Check appointments
    appointments = db.query(Appointment).filter(Appointment.patient_id == patient.id).all()
    print(f'\n📅 Appointments for this patient: {len(appointments)}')
    for apt in appointments:
        print(f'   Appointment {apt.id}:')
        print(f'      patient_id: {apt.patient_id}')
        print(f'      doctor_id: {apt.doctor_id}')
        print(f'      date: {apt.appointment_date}')
        print(f'      status: {apt.status}')
else:
    print('❌ Patient not found')

db.close()
