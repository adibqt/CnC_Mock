"""Quick script to check specializations in database"""
from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(text("SELECT id, name, is_active FROM specializations ORDER BY name"))
    specs = result.fetchall()
    print(f"\nTotal specializations in database: {len(specs)}\n")
    for spec in specs:
        status = "✓ Active" if spec[2] else "✗ Inactive"
        print(f"ID {spec[0]:2d}: {spec[1]:30s} {status}")
