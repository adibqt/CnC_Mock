"""Script to activate all default specializations"""
from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    # Activate all specializations except the test one
    result = conn.execute(text("""
        UPDATE specializations 
        SET is_active = TRUE 
        WHERE name != 'test' OR name IN (
            'Cardiology', 'Dermatology', 'Neurology', 'Orthopedics', 'Pediatrics',
            'Psychiatry', 'General Medicine', 'Gynecology', 'ENT', 'Ophthalmology',
            'Dentistry', 'Surgery', 'Gastroenterology', 'Pulmonology', 'Endocrinology'
        )
    """))
    conn.commit()
    print(f"✅ Activated {result.rowcount} specializations")
    
    # Show results
    result = conn.execute(text("SELECT COUNT(*) FROM specializations WHERE is_active = TRUE"))
    active_count = result.scalar()
    print(f"✅ Total active specializations: {active_count}")
