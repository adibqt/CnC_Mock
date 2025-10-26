"""
Router for quotation management.
Handles quotation requests from patients and quotation responses from pharmacies.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select, and_, or_, func
from datetime import datetime
from typing import List, Optional
from decimal import Decimal

from database import get_db
from models import (
    QuotationRequest, 
    QuotationResponse, 
    QuotationRequestPharmacy,
    Pharmacy, 
    User, 
    Prescription,
    QuotationStatus
)
from schemas import (
    QuotationRequestCreate,
    QuotationRequestResponse,
    QuotationResponseCreate,
    QuotationResponseUpdate,
    QuotationResponseResponse
)
from auth import get_current_user, get_current_pharmacy

router = APIRouter(prefix="/api/quotations", tags=["quotations"])


# Patient Endpoints

@router.post("/request", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_quotation_request(
    request_data: QuotationRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Patient creates a quotation request for a prescription.
    Pharmacies will be able to see this and submit quotations.
    """
    print(f"🎯 DEBUG: create_quotation_request called, current_user: {current_user}")
    try:
        # Verify prescription exists and belongs to the user
        prescription = db.query(Prescription).filter(
            and_(
                Prescription.id == request_data.prescription_id,
                Prescription.patient_id == current_user.id
            )
        ).first()
        
        if not prescription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prescription not found or does not belong to you"
            )
        
        # Check if quotation request already exists for this prescription
        existing_request = db.query(QuotationRequest).filter(
            and_(
                QuotationRequest.prescription_id == request_data.prescription_id,
                QuotationRequest.patient_id == current_user.id,
                QuotationRequest.status.in_(['pending', 'quoted'])
            )
        ).first()
        
        if existing_request:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An active quotation request already exists for this prescription"
            )
        
        # Validate selected pharmacies
        selected_pharmacy_ids = list(dict.fromkeys(request_data.pharmacy_ids))

        pharmacies = db.query(Pharmacy).filter(
            Pharmacy.id.in_(selected_pharmacy_ids),
            Pharmacy.is_active.is_(True)
        ).all()

        if len(pharmacies) != len(selected_pharmacy_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or more selected pharmacies are invalid or inactive"
            )

        # Create quotation request
        quotation_request = QuotationRequest(
            patient_id=current_user.id,
            prescription_id=request_data.prescription_id,
            patient_notes=request_data.patient_notes,
            status=QuotationStatus.PENDING
        )
        
        db.add(quotation_request)
        db.flush()

        for pharmacy_id in selected_pharmacy_ids:
            db.add(
                QuotationRequestPharmacy(
                    quotation_request_id=quotation_request.id,
                    pharmacy_id=pharmacy_id
                )
            )

        db.commit()
        db.refresh(quotation_request)
        
        return {
            "message": "Quotation request created successfully",
            "request_id": quotation_request.id,
            "prescription_id": quotation_request.prescription_id,
            "status": quotation_request.status.value,
            "target_pharmacies": [
                {
                    "id": pharmacy.id,
                    "pharmacy_name": pharmacy.pharmacy_name,
                    "city": pharmacy.city,
                    "state": pharmacy.state
                }
                for pharmacy in pharmacies
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create quotation request: {str(e)}"
        )


@router.get("/my-requests", response_model=List[QuotationRequestResponse])
def get_my_quotation_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all quotation requests created by the current patient."""
    try:
        requests = db.query(QuotationRequest).filter(
            QuotationRequest.patient_id == current_user.id
        ).options(
            selectinload(QuotationRequest.prescription),
            selectinload(QuotationRequest.quotation_responses),
            selectinload(QuotationRequest.target_pharmacies).selectinload(QuotationRequestPharmacy.pharmacy)
        ).order_by(QuotationRequest.created_at.desc()).all()
        
        # Format response with nested data
        formatted_requests = []
        for req in requests:
            request_dict = {
                "id": req.id,
                "patient_id": req.patient_id,
                "prescription_id": req.prescription_id,
                "status": req.status.value,
                "patient_notes": req.patient_notes,
                "created_at": req.created_at,
                "updated_at": req.updated_at,
                "prescription": {
                    "id": req.prescription.id,
                    "prescription_id": req.prescription.prescription_id,
                    "diagnosis": req.prescription.diagnosis,
                    "medications": req.prescription.medications
                } if req.prescription else None,
                "quotation_responses": [
                    {
                        "id": resp.id,
                        "pharmacy_id": resp.pharmacy_id,
                        "subtotal": float(resp.subtotal),
                        "delivery_charge": float(resp.delivery_charge),
                        "total_amount": float(resp.total_amount),
                        "status": resp.status.value,
                        "created_at": resp.created_at
                    } for resp in req.quotation_responses
                ] if req.quotation_responses else [],
                "target_pharmacies": [
                    {
                        "id": assoc.pharmacy.id,
                        "pharmacy_name": assoc.pharmacy.pharmacy_name,
                        "city": assoc.pharmacy.city,
                        "state": assoc.pharmacy.state
                    }
                    for assoc in req.target_pharmacies
                    if assoc.pharmacy
                ] if req.target_pharmacies else []
            }
            formatted_requests.append(request_dict)
        
        return formatted_requests
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch quotation requests: {str(e)}"
        )


@router.get("/request/{request_id}/responses", response_model=List[QuotationResponseResponse])
def get_quotation_responses(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all quotation responses for a specific request."""
    try:
        # Verify request belongs to user
        request = db.query(QuotationRequest).filter(
            and_(
                QuotationRequest.id == request_id,
                QuotationRequest.patient_id == current_user.id
            )
        ).first()
        
        if not request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quotation request not found"
            )
        
        # Get all responses for this request
        responses = db.query(QuotationResponse).filter(
            QuotationResponse.quotation_request_id == request_id
        ).options(
            selectinload(QuotationResponse.pharmacy)
        ).order_by(QuotationResponse.total_amount).all()
        
        # Format response
        formatted_responses = []
        for resp in responses:
            # Normalize quoted_items to ensure consistent field names
            normalized_items = []
            for item in resp.quoted_items:
                normalized_item = {
                    "medicine_name": item.get("medicine") or item.get("medicine_name"),
                    "quantity": item.get("quantity"),
                    "unit_price": item.get("unit_price"),
                    "total_price": item.get("total_price")
                }
                normalized_items.append(normalized_item)
            
            response_dict = {
                "id": resp.id,
                "quotation_request_id": resp.quotation_request_id,
                "pharmacy_id": resp.pharmacy_id,
                "quoted_items": normalized_items,
                "subtotal": float(resp.subtotal),
                "delivery_charge": float(resp.delivery_charge),
                "total_amount": float(resp.total_amount),
                "notes": resp.notes,
                "estimated_delivery_time": resp.estimated_delivery_time,
                "status": resp.status.value,
                "created_at": resp.created_at,
                "updated_at": resp.updated_at,
                "pharmacy": {
                    "id": resp.pharmacy.id,
                    "pharmacy_name": resp.pharmacy.pharmacy_name,
                    "street_address": resp.pharmacy.street_address,
                    "city": resp.pharmacy.city,
                    "state": resp.pharmacy.state,
                    "phone": resp.pharmacy.phone,
                    "email": resp.pharmacy.email
                } if resp.pharmacy else None
            }
            formatted_responses.append(response_dict)
        
        return formatted_responses
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch quotation responses: {str(e)}"
        )


# Pharmacy Endpoints

@router.get("/pending", response_model=List[QuotationRequestResponse])
def get_pending_quotation_requests(
    current_pharmacy: Pharmacy = Depends(get_current_pharmacy),
    db: Session = Depends(get_db)
):
    """
    Get all pending quotation requests that pharmacy hasn't responded to yet.
    Only shows requests with status 'pending' or 'quoted' (but not already quoted by this pharmacy).
    """
    try:
        # Get quotation request IDs that this pharmacy has already responded to
        responded_request_ids = [r.quotation_request_id for r in db.query(QuotationResponse.quotation_request_id).filter(
            QuotationResponse.pharmacy_id == current_pharmacy.id
        ).all()]
        
        # Get pending requests not yet responded to and targeted to this pharmacy
        filters = [
            QuotationRequest.status.in_([QuotationStatus.PENDING, QuotationStatus.QUOTED]),
            QuotationRequestPharmacy.pharmacy_id == current_pharmacy.id
        ]

        if responded_request_ids:
            filters.append(~QuotationRequest.id.in_(responded_request_ids))

        query = db.query(QuotationRequest).join(
            QuotationRequestPharmacy,
            QuotationRequestPharmacy.quotation_request_id == QuotationRequest.id
        ).filter(
            *filters
        ).options(
            selectinload(QuotationRequest.prescription),
            selectinload(QuotationRequest.patient),
            selectinload(QuotationRequest.target_pharmacies).selectinload(QuotationRequestPharmacy.pharmacy)
        ).order_by(QuotationRequest.created_at.desc())
        
        requests = query.all()
        
        # Format response
        formatted_requests = []
        for req in requests:
            request_dict = {
                "id": req.id,
                "patient_id": req.patient_id,
                "prescription_id": req.prescription_id,
                "status": req.status.value,
                "patient_notes": req.patient_notes,
                "created_at": req.created_at,
                "updated_at": req.updated_at,
                "patient": {
                    "id": req.patient.id,
                    "name": req.patient.name,
                    "phone": req.patient.phone,
                    "city": req.patient.city
                } if req.patient else None,
                "prescription": {
                    "id": req.prescription.id,
                    "prescription_id": req.prescription.prescription_id,
                    "diagnosis": req.prescription.diagnosis,
                    "medications": req.prescription.medications,
                    "created_at": req.prescription.created_at
                } if req.prescription else None,
                "target_pharmacies": [
                    {
                        "id": assoc.pharmacy.id,
                        "pharmacy_name": assoc.pharmacy.pharmacy_name,
                        "city": assoc.pharmacy.city,
                        "state": assoc.pharmacy.state
                    }
                    for assoc in req.target_pharmacies
                    if assoc.pharmacy
                ] if req.target_pharmacies else []
            }
            formatted_requests.append(request_dict)
        
        return formatted_requests
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch pending requests: {str(e)}"
        )


@router.post("/respond", response_model=dict, status_code=status.HTTP_201_CREATED)
def submit_quotation_response(
    response_data: QuotationResponseCreate,
    current_pharmacy: Pharmacy = Depends(get_current_pharmacy),
    db: Session = Depends(get_db)
):
    """Pharmacy submits a quotation response for a request."""
    try:
        # Verify quotation request exists
        request = db.query(QuotationRequest).filter(
            QuotationRequest.id == response_data.quotation_request_id
        ).first()
        
        if not request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quotation request not found"
            )

        # Ensure this request was targeted to the current pharmacy
        is_targeted = db.query(QuotationRequestPharmacy).filter(
            QuotationRequestPharmacy.quotation_request_id == response_data.quotation_request_id,
            QuotationRequestPharmacy.pharmacy_id == current_pharmacy.id
        ).first()

        if not is_targeted:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This quotation request is not assigned to your pharmacy"
            )
        
        # Check if pharmacy already responded
        existing_response = db.query(QuotationResponse).filter(
            and_(
                QuotationResponse.quotation_request_id == response_data.quotation_request_id,
                QuotationResponse.pharmacy_id == current_pharmacy.id
            )
        ).first()
        
        if existing_response:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already submitted a quotation for this request"
            )
        
        # Calculate subtotal and total
        subtotal = sum(item.total_price for item in response_data.quoted_items)
        total_amount = subtotal + (response_data.delivery_charge or 0)
        
        # Create quotation response
        quotation_response = QuotationResponse(
            quotation_request_id=response_data.quotation_request_id,
            pharmacy_id=current_pharmacy.id,
            quoted_items=[item.dict() for item in response_data.quoted_items],
            subtotal=Decimal(str(subtotal)),
            delivery_charge=Decimal(str(response_data.delivery_charge or 0)),
            total_amount=Decimal(str(total_amount)),
            notes=response_data.notes,
            estimated_delivery_time=response_data.estimated_delivery_time,
            status=QuotationStatus.QUOTED
        )
        
        db.add(quotation_response)
        
        # Update request status to 'quoted'
        request.status = QuotationStatus.QUOTED
        request.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(quotation_response)
        
        return {
            "message": "Quotation submitted successfully",
            "response_id": quotation_response.id,
            "total_amount": float(quotation_response.total_amount),
            "status": quotation_response.status.value
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit quotation: {str(e)}"
        )


@router.get("/my-quotations", response_model=List[QuotationResponseResponse])
def get_my_quotations(
    current_pharmacy: Pharmacy = Depends(get_current_pharmacy),
    db: Session = Depends(get_db)
):
    """Get all quotations submitted by the current pharmacy."""
    try:
        quotations = db.query(QuotationResponse).filter(
            QuotationResponse.pharmacy_id == current_pharmacy.id
        ).options(
            selectinload(QuotationResponse.quotation_request).selectinload(QuotationRequest.patient),
            selectinload(QuotationResponse.quotation_request).selectinload(QuotationRequest.prescription)
        ).order_by(QuotationResponse.created_at.desc()).all()
        
        # Format response
        formatted_quotations = []
        for quot in quotations:
            quotation_dict = {
                "id": quot.id,
                "quotation_request_id": quot.quotation_request_id,
                "pharmacy_id": quot.pharmacy_id,
                "quoted_items": quot.quoted_items,
                "subtotal": float(quot.subtotal),
                "delivery_charge": float(quot.delivery_charge),
                "total_amount": float(quot.total_amount),
                "notes": quot.notes,
                "estimated_delivery_time": quot.estimated_delivery_time,
                "status": quot.status.value,
                "created_at": quot.created_at,
                "updated_at": quot.updated_at,
                "quotation_request": {
                    "id": quot.quotation_request.id,
                    "patient_id": quot.quotation_request.patient_id,
                    "prescription_id": quot.quotation_request.prescription_id,
                    "status": quot.quotation_request.status.value,
                    "patient_notes": quot.quotation_request.patient_notes,
                    "patient": {
                        "id": quot.quotation_request.patient.id,
                        "name": quot.quotation_request.patient.name,
                        "phone": quot.quotation_request.patient.phone
                    } if quot.quotation_request.patient else None,
                    "prescription": {
                        "id": quot.quotation_request.prescription.id,
                        "prescription_id": quot.quotation_request.prescription.prescription_id,
                        "medications": quot.quotation_request.prescription.medications
                    } if quot.quotation_request.prescription else None
                } if quot.quotation_request else None
            }
            formatted_quotations.append(quotation_dict)
        
        return formatted_quotations
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch quotations: {str(e)}"
        )


@router.put("/{quotation_id}/accept", response_model=dict)
def accept_quotation(
    quotation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Patient accepts a quotation response.
    Updates quotation response and request status to 'accepted'.
    """
    try:
        # Get quotation response with relationships
        quotation = db.query(QuotationResponse).filter(
            QuotationResponse.id == quotation_id
        ).options(
            selectinload(QuotationResponse.quotation_request),
            selectinload(QuotationResponse.pharmacy)
        ).first()
        
        if not quotation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quotation not found"
            )
        
        # Verify the quotation belongs to the current user's request
        if quotation.quotation_request.patient_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only accept quotations for your own requests"
            )
        
        # Check if quotation is in a valid state to be accepted
        if quotation.status != QuotationStatus.QUOTED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot accept quotation with status: {quotation.status.value}"
            )
        
        # Update quotation response status
        quotation.status = QuotationStatus.ACCEPTED
        quotation.updated_at = datetime.utcnow()
        
        # Update quotation request status
        quotation.quotation_request.status = QuotationStatus.ACCEPTED
        quotation.quotation_request.updated_at = datetime.utcnow()
        
        # Reject other quotations for the same request
        other_quotations = db.query(QuotationResponse).filter(
            and_(
                QuotationResponse.quotation_request_id == quotation.quotation_request_id,
                QuotationResponse.id != quotation_id,
                QuotationResponse.status == QuotationStatus.QUOTED
            )
        ).all()
        
        for other_quot in other_quotations:
            other_quot.status = QuotationStatus.REJECTED
            other_quot.updated_at = datetime.utcnow()
        
        db.commit()
        
        return {
            "message": "Quotation accepted successfully",
            "quotation_id": quotation.id,
            "pharmacy_name": quotation.pharmacy.pharmacy_name if quotation.pharmacy else "Unknown",
            "total_amount": float(quotation.total_amount)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to accept quotation: {str(e)}"
        )


# Public Endpoint (for patients to see verified pharmacies)

@router.get("/pharmacies", response_model=List[dict])
def get_verified_pharmacies(db: Session = Depends(get_db)):
    """Get list of all verified and active pharmacies."""
    try:
        pharmacies = db.query(Pharmacy).filter(
            and_(
                Pharmacy.is_verified == True,
                Pharmacy.is_active == True
            )
        ).order_by(Pharmacy.pharmacy_name).all()
        
        return [
            {
                "id": pharmacy.id,
                "pharmacy_name": pharmacy.pharmacy_name,
                "street_address": pharmacy.street_address,
                "city": pharmacy.city,
                "state": pharmacy.state,
                "postal_code": pharmacy.postal_code,
                "phone": pharmacy.phone,
                "email": pharmacy.email
            }
            for pharmacy in pharmacies
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch pharmacies: {str(e)}"
        )
