from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Symptom
from typing import List

router = APIRouter(prefix="/api/public", tags=["public"])


@router.get("/symptoms", response_model=List[dict])
def get_active_symptoms(db: Session = Depends(get_db)):
    """Return all active symptoms (public, no auth)."""
    symptoms = (
        db.query(Symptom)
        .filter(Symptom.is_active == True)
        .order_by(Symptom.name)
        .all()
    )
    return [
        {
            "id": s.id,
            "name": s.name,
            "description": s.description,
            "category": s.category,
            "suggested_specialization_id": s.suggested_specialization_id,
            "is_active": s.is_active,
        }
        for s in symptoms
    ]
