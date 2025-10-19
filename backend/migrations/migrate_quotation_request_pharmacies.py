"""
Migration to create quotation_request_pharmacies table and back up existing data.
Creates association table linking quotation requests to targeted pharmacies.
"""

import sys
import os
from datetime import datetime, timezone

# Ensure backend package is importable
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import engine


def create_backups(conn, suffix: str) -> None:
    """Create backup tables for quotation data prior to migration."""
    request_backup = f"quotation_requests_backup_{suffix}"
    response_backup = f"quotation_responses_backup_{suffix}"

    conn.execute(
        text(
            f"CREATE TABLE IF NOT EXISTS {request_backup} AS TABLE quotation_requests WITH DATA;"
        )
    )
    conn.execute(
        text(
            f"CREATE TABLE IF NOT EXISTS {response_backup} AS TABLE quotation_responses WITH DATA;"
        )
    )
    print(f"✅ Created backup tables: {request_backup}, {response_backup}")


def create_association_table(conn) -> None:
    """Create the quotation_request_pharmacies association table if it does not exist."""
    conn.execute(
        text(
            """
            CREATE TABLE IF NOT EXISTS quotation_request_pharmacies (
                id SERIAL PRIMARY KEY,
                quotation_request_id INTEGER NOT NULL REFERENCES quotation_requests(id) ON DELETE CASCADE,
                pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT uq_request_pharmacy UNIQUE (quotation_request_id, pharmacy_id)
            );

            CREATE INDEX IF NOT EXISTS idx_qrp_request ON quotation_request_pharmacies(quotation_request_id);
            CREATE INDEX IF NOT EXISTS idx_qrp_pharmacy ON quotation_request_pharmacies(pharmacy_id);
            CREATE INDEX IF NOT EXISTS idx_qrp_request_pharmacy ON quotation_request_pharmacies(quotation_request_id, pharmacy_id);
            """
        )
    )
    print("✅ Ensured quotation_request_pharmacies table and indexes exist")


def seed_existing_requests(conn) -> None:
    """Populate association entries for existing requests so pending items remain visible."""
    conn.execute(
        text(
            """
            INSERT INTO quotation_request_pharmacies (quotation_request_id, pharmacy_id)
            SELECT qr.id, p.id
            FROM quotation_requests qr
            JOIN pharmacies p ON p.is_active IS TRUE
            WHERE qr.status IN ('pending', 'quoted')
            AND NOT EXISTS (
                SELECT 1
                FROM quotation_request_pharmacies qrp
                WHERE qrp.quotation_request_id = qr.id
                AND qrp.pharmacy_id = p.id
            );
            """
        )
    )
    print("✅ Seeded existing quotation requests with active pharmacies")


def migrate():
    """Run the migration within a transaction."""
    suffix = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")

    with engine.begin() as conn:
        print("Starting quotation request pharmacies migration...")
        create_backups(conn, suffix)
        create_association_table(conn)
        seed_existing_requests(conn)
        print("🚀 Migration finished successfully!")


if __name__ == "__main__":
    migrate()
