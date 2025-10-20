from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import (
    LabTestQuotationRequest, LabTestQuotationResponse, LabTestQuotationRequestClinic,
    Clinic, User, Prescription
)
from schemas import (
    LabTestQuotationRequestCreate, LabTestQuotationRequestResponse,
    LabTestQuotationResponseCreate, LabTestQuotationResponseModel
)
from auth import get_current_user, get_current_clinic

router = APIRouter(prefix="/api/lab-quotations", tags=["lab-quotations"])


@router.post("/request", response_model=dict)
def create_lab_quotation_request(
    request_data: LabTestQuotationRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Patient creates a lab test quotation request for specific clinics
    """
    
    # Verify prescription exists and belongs to user
    prescription = db.query(Prescription).filter(
        Prescription.id == request_data.prescription_id,
        Prescription.patient_id == current_user.id
    ).first()
    
    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prescription not found"
        )
    
    # Check if prescription has lab tests
    if not prescription.lab_tests or len(prescription.lab_tests) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Prescription has no lab tests"
        )
    
    # Verify all clinics exist and are active
    clinics = db.query(Clinic).filter(
        Clinic.id.in_(request_data.clinic_ids),
        Clinic.is_active == True,
        Clinic.is_verified == True
    ).all()
    
    if len(clinics) != len(request_data.clinic_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Some clinics are not available or not verified"
        )
    
    # Create quotation request
    quotation_request = LabTestQuotationRequest(
        prescription_id=request_data.prescription_id,
        patient_id=current_user.id,
        lab_tests=prescription.lab_tests,
        additional_notes=request_data.additional_notes,
        status="pending"
    )
    
    db.add(quotation_request)
    db.commit()
    db.refresh(quotation_request)
    
    # Create associations with selected clinics
    for clinic_id in request_data.clinic_ids:
        association = LabTestQuotationRequestClinic(
            quotation_request_id=quotation_request.id,
            clinic_id=clinic_id
        )
        db.add(association)
    
    db.commit()
    
    return {
        "message": "Lab test quotation request created successfully",
        "request_id": quotation_request.id,
        "clinics_notified": len(request_data.clinic_ids)
    }


@router.get("/my-requests", response_model=list[dict])
def get_my_lab_quotation_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all lab quotation requests created by current patient
    """
    
    requests = db.query(LabTestQuotationRequest).filter(
        LabTestQuotationRequest.patient_id == current_user.id
    ).order_by(LabTestQuotationRequest.created_at.desc()).all()
    
    result = []
    for req in requests:
        prescription = db.query(Prescription).filter(
            Prescription.id == req.prescription_id
        ).first()
        
        # Get target clinics
        target_clinics = db.query(Clinic).join(
            LabTestQuotationRequestClinic,
            Clinic.id == LabTestQuotationRequestClinic.clinic_id
        ).filter(
            LabTestQuotationRequestClinic.quotation_request_id == req.id
        ).all()
        
        result.append({
            "id": req.id,
            "prescription_id": req.prescription_id,
            "patient_id": req.patient_id,
            "lab_tests": req.lab_tests,
            "additional_notes": req.additional_notes,
            "status": req.status,
            "created_at": req.created_at,
            "prescription": {
                "prescription_id": prescription.prescription_id,
                "diagnosis": prescription.diagnosis
            } if prescription else None,
            "target_clinics": [
                {
                    "id": clinic.id,
                    "clinic_name": clinic.clinic_name,
                    "address": clinic.address
                }
                for clinic in target_clinics
            ]
        })
    
    return result


@router.get("/pending", response_model=list[dict])
def get_pending_lab_quotation_requests(
    current_clinic: Clinic = Depends(get_current_clinic),
    db: Session = Depends(get_db)
):
    """
    Get pending lab quotation requests for current clinic
    """
    
    requests = db.query(LabTestQuotationRequest).join(
        LabTestQuotationRequestClinic,
        LabTestQuotationRequest.id == LabTestQuotationRequestClinic.quotation_request_id
    ).filter(
        LabTestQuotationRequestClinic.clinic_id == current_clinic.id,
        LabTestQuotationRequest.status == "pending"
    ).order_by(LabTestQuotationRequest.created_at.desc()).all()
    
    result = []
    for req in requests:
        patient = db.query(User).filter(User.id == req.patient_id).first()
        prescription = db.query(Prescription).filter(
            Prescription.id == req.prescription_id
        ).first()
        
        # Check if clinic already responded
        existing_response = db.query(LabTestQuotationResponse).filter(
            LabTestQuotationResponse.quotation_request_id == req.id,
            LabTestQuotationResponse.clinic_id == current_clinic.id
        ).first()
        
        result.append({
            "id": req.id,
            "prescription_id": req.prescription_id,
            "lab_tests": req.lab_tests,
            "additional_notes": req.additional_notes,
            "status": req.status,
            "created_at": req.created_at,
            "has_responded": existing_response is not None,
            "patient": {
                "id": patient.id,
                "name": patient.name,
                "phone": patient.phone
            } if patient else None,
            "prescription": {
                "prescription_id": prescription.prescription_id,
                "diagnosis": prescription.diagnosis
            } if prescription else None
        })
    
    return result


@router.post("/respond", response_model=dict)
def submit_lab_quotation_response(
    response_data: LabTestQuotationResponseCreate,
    current_clinic: Clinic = Depends(get_current_clinic),
    db: Session = Depends(get_db)
):
    """
    Clinic submits a quotation response for a lab test request
    """
    
    # Verify request exists
    request = db.query(LabTestQuotationRequest).filter(
        LabTestQuotationRequest.id == response_data.quotation_request_id
    ).first()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quotation request not found"
        )
    
    # Verify clinic is in target list
    association = db.query(LabTestQuotationRequestClinic).filter(
        LabTestQuotationRequestClinic.quotation_request_id == request.id,
        LabTestQuotationRequestClinic.clinic_id == current_clinic.id
    ).first()
    
    if not association:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to respond to this request"
        )
    
    # Check if already responded
    existing_response = db.query(LabTestQuotationResponse).filter(
        LabTestQuotationResponse.quotation_request_id == request.id,
        LabTestQuotationResponse.clinic_id == current_clinic.id
    ).first()
    
    if existing_response:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already responded to this request"
        )
    
    # Calculate total amount
    test_items_dicts = [item.dict() for item in response_data.test_items]
    total_amount = sum(item['price'] for item in test_items_dicts)
    
    # Create quotation response
    quotation_response = LabTestQuotationResponse(
        quotation_request_id=request.id,
        clinic_id=current_clinic.id,
        test_items=test_items_dicts,
        total_amount=total_amount,
        estimated_delivery=response_data.estimated_delivery,
        additional_notes=response_data.additional_notes,
        is_accepted=False
    )
    
    db.add(quotation_response)
    db.commit()
    db.refresh(quotation_response)
    
    return {
        "message": "Quotation response submitted successfully",
        "response_id": quotation_response.id,
        "total_amount": total_amount
    }


@router.get("/responses/{request_id}", response_model=list[dict])
def get_lab_quotation_responses(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all quotation responses for a specific request (patient view)
    """
    
    # Verify request belongs to user
    request = db.query(LabTestQuotationRequest).filter(
        LabTestQuotationRequest.id == request_id,
        LabTestQuotationRequest.patient_id == current_user.id
    ).first()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quotation request not found"
        )
    
    # Get all responses
    responses = db.query(LabTestQuotationResponse).filter(
        LabTestQuotationResponse.quotation_request_id == request_id
    ).order_by(LabTestQuotationResponse.total_amount).all()
    
    result = []
    for resp in responses:
        clinic = db.query(Clinic).filter(Clinic.id == resp.clinic_id).first()
        
        result.append({
            "id": resp.id,
            "quotation_request_id": resp.quotation_request_id,
            "test_items": resp.test_items,
            "total_amount": resp.total_amount,
            "estimated_delivery": resp.estimated_delivery,
            "additional_notes": resp.additional_notes,
            "is_accepted": resp.is_accepted,
            "created_at": resp.created_at,
            "clinic": {
                "id": clinic.id,
                "clinic_name": clinic.clinic_name,
                "address": clinic.address,
                "phone": clinic.phone,
                "email": clinic.email
            } if clinic else None
        })
    
    return result


@router.put("/accept/{response_id}", response_model=dict)
def accept_lab_quotation(
    response_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Patient accepts a quotation response
    """
    
    response = db.query(LabTestQuotationResponse).filter(
        LabTestQuotationResponse.id == response_id
    ).first()
    
    if not response:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quotation response not found"
        )
    
    # Verify request belongs to user
    request = db.query(LabTestQuotationRequest).filter(
        LabTestQuotationRequest.id == response.quotation_request_id,
        LabTestQuotationRequest.patient_id == current_user.id
    ).first()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    if response.is_accepted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quotation already accepted"
        )
    
    # Update response
    response.is_accepted = True
    from datetime import datetime
    response.accepted_at = datetime.utcnow()
    
    # Update request status
    request.status = "accepted"
    
    db.commit()
    
    return {
        "message": "Quotation accepted successfully",
        "response_id": response.id,
        "clinic_id": response.clinic_id
    }


@router.get("/verified-clinics", response_model=list[dict])
def get_verified_clinics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get list of verified and active clinics for patients
    """
    
    clinics = db.query(Clinic).filter(
        Clinic.is_verified == True,
        Clinic.is_active == True
    ).order_by(Clinic.clinic_name).all()
    
    return [
        {
            "id": clinic.id,
            "clinic_name": clinic.clinic_name,
            "address": clinic.address,
            "city": clinic.city,
            "state": clinic.state,
            "phone": clinic.phone,
            "email": clinic.email,
            "operating_hours": clinic.operating_hours,
            "services_offered": clinic.services_offered
        }
        for clinic in clinics
    ]