"""
Migration script to add admin, specializations, and symptoms tables
"""
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy import text
from database import engine
from auth import get_password_hash

def migrate():
    """Add admin-related tables and default data"""
    
    migration_sql = """
    -- Create admins table
    CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR UNIQUE NOT NULL,
        hashed_password VARCHAR NOT NULL,
        full_name VARCHAR NOT NULL,
        email VARCHAR UNIQUE,
        role VARCHAR DEFAULT 'admin' NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_login TIMESTAMP WITH TIME ZONE
    );
    
    -- Create specializations table
    CREATE TABLE IF NOT EXISTS specializations (
        id SERIAL PRIMARY KEY,
        name VARCHAR UNIQUE NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by INTEGER REFERENCES admins(id)
    );
    
    -- Create symptoms table
    CREATE TABLE IF NOT EXISTS symptoms (
        id SERIAL PRIMARY KEY,
        name VARCHAR UNIQUE NOT NULL,
        description TEXT,
        category VARCHAR,
        suggested_specialization_id INTEGER REFERENCES specializations(id),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by INTEGER REFERENCES admins(id)
    );
    
    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
    CREATE INDEX IF NOT EXISTS idx_specializations_name ON specializations(name);
    CREATE INDEX IF NOT EXISTS idx_specializations_active ON specializations(is_active);
    CREATE INDEX IF NOT EXISTS idx_symptoms_name ON symptoms(name);
    CREATE INDEX IF NOT EXISTS idx_symptoms_category ON symptoms(category);
    CREATE INDEX IF NOT EXISTS idx_symptoms_active ON symptoms(is_active);
    """
    
    try:
        with engine.connect() as conn:
            conn.execute(text(migration_sql))
            conn.commit()
            print("✅ Admin tables created successfully!")

            # Ensure new columns exist on existing tables
            try:
                conn.execute(text(
                    "ALTER TABLE symptoms ADD COLUMN IF NOT EXISTS suggested_specialization_id INTEGER REFERENCES specializations(id)"
                ))
                conn.commit()
            except Exception as _:
                # Safe to ignore if DB doesn't support IF NOT EXISTS (handled by try)
                pass
            
            # Check if default admin exists
            result = conn.execute(text("SELECT COUNT(*) FROM admins WHERE username = 'admin'"))
            count = result.scalar()
            
            if count == 0:
                # Create default admin user (username: admin, password: admin123)
                default_password_hash = get_password_hash("admin123")
                conn.execute(text("""
                    INSERT INTO admins (username, hashed_password, full_name, email, role, is_active)
                    VALUES (:username, :password, :full_name, :email, :role, :is_active)
                """), {
                    "username": "admin",
                    "password": default_password_hash,
                    "full_name": "System Administrator",
                    "email": "admin@clickandcare.com",
                    "role": "super_admin",
                    "is_active": True
                })
                conn.commit()
                print("✅ Default admin created (username: admin, password: admin123)")
            else:
                print("ℹ️  Default admin already exists")
            
            # Add default specializations
            default_specializations = [
                ("Cardiology", "Heart and cardiovascular system specialists"),
                ("Dermatology", "Skin, hair, and nail specialists"),
                ("Neurology", "Brain and nervous system specialists"),
                ("Orthopedics", "Bone, joint, and muscle specialists"),
                ("Pediatrics", "Children's health specialists"),
                ("Psychiatry", "Mental health specialists"),
                ("General Medicine", "General health and common diseases"),
                ("Gynecology", "Women's reproductive health specialists"),
                ("ENT", "Ear, Nose, and Throat specialists"),
                ("Ophthalmology", "Eye and vision specialists"),
                ("Dentistry", "Dental and oral health specialists"),
                ("Surgery", "Surgical procedures specialists"),
                ("Gastroenterology", "Digestive system specialists"),
                ("Pulmonology", "Lung and respiratory specialists"),
                ("Endocrinology", "Hormone and gland specialists")
            ]
            
            for spec_name, spec_desc in default_specializations:
                result = conn.execute(
                    text("SELECT COUNT(*) FROM specializations WHERE name = :name"),
                    {"name": spec_name}
                )
                if result.scalar() == 0:
                    conn.execute(text("""
                        INSERT INTO specializations (name, description)
                        VALUES (:name, :description)
                    """), {"name": spec_name, "description": spec_desc})
            
            conn.commit()
            print(f"✅ Added {len(default_specializations)} default specializations")
            
            # Add default symptoms
            default_symptoms = [
                ("Fever", "Body temperature higher than normal", "General"),
                ("Cough", "Sudden expulsion of air from lungs", "Respiratory"),
                ("Headache", "Pain in head or upper neck", "General"),
                ("Fatigue", "Extreme tiredness", "General"),
                ("Shortness of breath", "Difficulty breathing", "Respiratory"),
                ("Chest pain", "Pain in chest area", "Cardiovascular"),
                ("Nausea", "Feeling of sickness with urge to vomit", "Digestive"),
                ("Vomiting", "Forceful expulsion of stomach contents", "Digestive"),
                ("Diarrhea", "Loose or watery bowel movements", "Digestive"),
                ("Abdominal pain", "Pain in stomach area", "Digestive"),
                ("Sore throat", "Pain or irritation in throat", "Respiratory"),
                ("Runny nose", "Excess nasal discharge", "Respiratory"),
                ("Muscle pain", "Pain in muscles", "Musculoskeletal"),
                ("Joint pain", "Pain in joints", "Musculoskeletal"),
                ("Rash", "Change in skin appearance", "Dermatological"),
                ("Dizziness", "Feeling of spinning or losing balance", "Neurological"),
                ("Back pain", "Pain in back area", "Musculoskeletal"),
                ("Anxiety", "Feeling of worry or nervousness", "Mental Health"),
                ("Depression", "Persistent sad mood", "Mental Health"),
                ("Insomnia", "Difficulty sleeping", "Sleep Disorder")
            ]

            # Ensure homepage quick concerns exist and are active
            homepage_concerns = [
                ("Temperature", "Raised body temperature", "General"),
                ("Snuffle", "Nasal congestion and runny nose", "Respiratory"),
                ("Weakness", "General weakness or fatigue", "General"),
                ("Viruses", "Viral symptoms and infections", "General"),
                ("Syncytial Virus", "Respiratory syncytial virus (RSV)", "Respiratory"),
                ("Adenoviruses", "Common adenoviral infections", "Respiratory"),
                ("Rhinoviruses", "Common cold viruses", "Respiratory"),
                ("Factors", "Lifestyle or environmental factors", "General"),
                ("Infection", "General infection symptoms", "General"),
            ]
            
            for symp_name, symp_desc, symp_cat in default_symptoms + homepage_concerns:
                result = conn.execute(
                    text("SELECT COUNT(*) FROM symptoms WHERE name = :name"),
                    {"name": symp_name}
                )
                if result.scalar() == 0:
                    conn.execute(text("""
                        INSERT INTO symptoms (name, description, category, is_active)
                        VALUES (:name, :description, :category, TRUE)
                    """), {"name": symp_name, "description": symp_desc, "category": symp_cat})
                else:
                    # Ensure these are marked active
                    conn.execute(text("""
                        UPDATE symptoms SET is_active = TRUE, category = COALESCE(category, :category)
                        WHERE name = :name
                    """), {"name": symp_name, "category": symp_cat})
            
            conn.commit()
            print(f"✅ Added {len(default_symptoms)} default symptoms")

            # Backfill mapping: map homepage concerns to common specializations if present
            mapping = {
                "Temperature": "General Medicine",
                "Weakness": "General Medicine",
                "Viruses": "General Medicine",
                "Factors": "General Medicine",
                "Snuffle": "ENT",
                "Rhinoviruses": "ENT",
                "Infection": "Dermatology",
                "Syncytial Virus": "Pulmonology",
                "Adenoviruses": "General Medicine",
            }
            for symptom_name, spec_name in mapping.items():
                spec_id_row = conn.execute(text("SELECT id FROM specializations WHERE name=:n"), {"n": spec_name}).fetchone()
                if spec_id_row:
                    conn.execute(text("""
                        UPDATE symptoms SET suggested_specialization_id=:sid
                        WHERE name=:sname
                    """), {"sid": spec_id_row[0], "sname": symptom_name})
            conn.commit()
            
            return True
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        return False

if __name__ == "__main__":
    migrate()
