"""
Lab Report Management Router
Handles lab report creation, file uploads, and report viewing
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from database import get_db
from models import (
    LabReport, LabTestQuotationResponse, LabTestQuotationRequest,
    Clinic, User
)
from schemas import LabReportCreate, LabReportResponse, TestResultItem
from auth import get_current_user, get_current_clinic
from typing import List, Optional
import os
import uuid
import random
from datetime import datetime
import json

router = APIRouter(prefix="/api/lab-reports", tags=["lab-reports"])

# File upload configuration
UPLOAD_DIR = "backend/uploads/lab_reports"
ALLOWED_EXTENSIONS = {'.pdf', '.jpg', '.jpeg', '.png'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)


def generate_report_id():
    """Generate unique lab report ID"""
    return f"LAB-{random.randint(10000, 99999)}"


def validate_file(file: UploadFile) -> bool:
    """Validate uploaded file"""
    # Check file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    return True


def save_upload_file(file: UploadFile, prefix: str = "") -> str:
    """Save uploaded file and return relative path"""
    # Generate unique filename
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{prefix}_{uuid.uuid4().hex}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        content = file.file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds 10MB limit"
            )
        buffer.write(content)
    
    # Return relative path for storage
    return f"/uploads/lab_reports/{unique_filename}"


@router.post("/create", response_model=dict)
def create_lab_report(
    quotation_response_id: int = Form(...),
    report_title: str = Form(...),
    test_results: str = Form(...),  # JSON string
    diagnosis_notes: Optional[str] = Form(None),
    technician_name: Optional[str] = Form(None),
    pathologist_name: Optional[str] = Form(None),
    test_date: Optional[str] = Form(None),
    report_file: Optional[UploadFile] = File(None),
    report_images: Optional[List[UploadFile]] = File(None),
    current_clinic: Clinic = Depends(get_current_clinic),
    db: Session = Depends(get_db)
):
    """
    Clinic creates a lab report for an accepted quotation
    Supports PDF report and multiple images
    """
    
    # Verify quotation response exists and belongs to clinic
    quotation_response = db.query(LabTestQuotationResponse).filter(
        LabTestQuotationResponse.id == quotation_response_id,
        LabTestQuotationResponse.clinic_id == current_clinic.id
    ).first()
    
    if not quotation_response:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quotation response not found"
        )
    
    if not quotation_response.is_accepted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quotation must be accepted before creating report"
        )
    
    # Check if report already exists
    existing_report = db.query(LabReport).filter(
        LabReport.quotation_response_id == quotation_response_id
    ).first()
    
    if existing_report:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lab report already exists for this quotation"
        )
    
    # Get patient ID from quotation request
    quotation_request = db.query(LabTestQuotationRequest).filter(
        LabTestQuotationRequest.id == quotation_response.quotation_request_id
    ).first()
    
    # Parse test results JSON
    try:
        test_results_list = json.loads(test_results)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid test results format"
        )
    
    # Generate unique report ID
    report_id = generate_report_id()
    while db.query(LabReport).filter(LabReport.report_id == report_id).first():
        report_id = generate_report_id()
    
    # Handle file uploads
    report_file_url = None
    if report_file:
        validate_file(report_file)
        report_file_url = save_upload_file(report_file, prefix=f"report_{report_id}")
    
    report_images_urls = []
    if report_images:
        for idx, image in enumerate(report_images):
            validate_file(image)
            image_url = save_upload_file(image, prefix=f"report_{report_id}_img{idx}")
            report_images_urls.append(image_url)
    
    # Parse test date if provided
    parsed_test_date = None
    if test_date:
        try:
            parsed_test_date = datetime.fromisoformat(test_date.replace('Z', '+00:00'))
        except:
            parsed_test_date = None
    
    # Create lab report
    lab_report = LabReport(
        quotation_response_id=quotation_response_id,
        clinic_id=current_clinic.id,
        patient_id=quotation_request.patient_id,
        report_id=report_id,
        report_title=report_title,
        test_results=test_results_list,
        diagnosis_notes=diagnosis_notes,
        technician_name=technician_name,
        pathologist_name=pathologist_name,
        report_file_url=report_file_url,
        report_images=report_images_urls if report_images_urls else None,
        status="completed",
        test_date=parsed_test_date,
        verified_at=datetime.utcnow()
    )
    
    db.add(lab_report)
    
    # Update quotation request status
    quotation_request.status = "completed"
    
    db.commit()
    db.refresh(lab_report)
    
    return {
        "message": "Lab report created successfully",
        "report_id": lab_report.report_id,
        "id": lab_report.id,
        "has_file": report_file_url is not None,
        "images_count": len(report_images_urls)
    }


@router.get("/my-reports", response_model=list[dict])
def get_my_lab_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all lab reports for current patient
    """
    
    reports = db.query(LabReport).filter(
        LabReport.patient_id == current_user.id
    ).order_by(LabReport.created_at.desc()).all()
    
    result = []
    for report in reports:
        clinic = db.query(Clinic).filter(Clinic.id == report.clinic_id).first()
        
        result.append({
            "id": report.id,
            "report_id": report.report_id,
            "report_title": report.report_title,
            "test_results": report.test_results,
            "diagnosis_notes": report.diagnosis_notes,
            "technician_name": report.technician_name,
            "pathologist_name": report.pathologist_name,
            "report_file_url": report.report_file_url,
            "report_images": report.report_images,
            "status": report.status,
            "test_date": report.test_date,
            "report_date": report.report_date,
            "created_at": report.created_at,
            "clinic": {
                "id": clinic.id,
                "clinic_name": clinic.clinic_name,
                "address": clinic.address,
                "phone": clinic.phone,
                "email": clinic.email
            } if clinic else None
        })
    
    return result


@router.get("/clinic/reports", response_model=list[dict])
def get_clinic_reports(
    current_clinic: Clinic = Depends(get_current_clinic),
    db: Session = Depends(get_db)
):
    """
    Get all lab reports created by current clinic
    """
    
    reports = db.query(LabReport).filter(
        LabReport.clinic_id == current_clinic.id
    ).order_by(LabReport.created_at.desc()).all()
    
    result = []
    for report in reports:
        patient = db.query(User).filter(User.id == report.patient_id).first()
        
        result.append({
            "id": report.id,
            "report_id": report.report_id,
            "report_title": report.report_title,
            "test_results": report.test_results,
            "status": report.status,
            "test_date": report.test_date,
            "report_date": report.report_date,
            "created_at": report.created_at,
            "patient": {
                "id": patient.id,
                "name": patient.name,
                "phone": patient.phone
            } if patient else None
        })
    
    return result


@router.get("/{report_id}", response_model=dict)
def get_lab_report_details(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed lab report by report ID
    """
    
    report = db.query(LabReport).filter(
        LabReport.report_id == report_id,
        LabReport.patient_id == current_user.id
    ).first()
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lab report not found"
        )
    
    clinic = db.query(Clinic).filter(Clinic.id == report.clinic_id).first()
    patient = db.query(User).filter(User.id == report.patient_id).first()
    
    return {
        "id": report.id,
        "report_id": report.report_id,
        "report_title": report.report_title,
        "test_results": report.test_results,
        "diagnosis_notes": report.diagnosis_notes,
        "technician_name": report.technician_name,
        "pathologist_name": report.pathologist_name,
        "report_file_url": report.report_file_url,
        "report_images": report.report_images,
        "status": report.status,
        "test_date": report.test_date,
        "report_date": report.report_date,
        "created_at": report.created_at,
        "clinic": {
            "id": clinic.id,
            "clinic_name": clinic.clinic_name,
            "address": clinic.address,
            "phone": clinic.phone,
            "email": clinic.email,
            "license_number": clinic.license_number
        } if clinic else None,
        "patient": {
            "id": patient.id,
            "name": patient.name,
            "phone": patient.phone,
            "date_of_birth": patient.date_of_birth,
            "blood_group": patient.blood_group
        } if patient else None
    }


@router.get("/accepted-quotations/pending-reports", response_model=list[dict])
def get_accepted_quotations_pending_reports(
    current_clinic: Clinic = Depends(get_current_clinic),
    db: Session = Depends(get_db)
):
    """
    Get accepted quotations that don't have lab reports yet
    Clinic can create reports for these
    """
    
    # Get accepted quotations for this clinic
    accepted_quotations = db.query(LabTestQuotationResponse).filter(
        LabTestQuotationResponse.clinic_id == current_clinic.id,
        LabTestQuotationResponse.is_accepted == True
    ).all()
    
    result = []
    for quotation in accepted_quotations:
        # Check if report already exists
        existing_report = db.query(LabReport).filter(
            LabReport.quotation_response_id == quotation.id
        ).first()
        
        if not existing_report:
            # Get request details
            request = db.query(LabTestQuotationRequest).filter(
                LabTestQuotationRequest.id == quotation.quotation_request_id
            ).first()
            
            if request:
                patient = db.query(User).filter(User.id == request.patient_id).first()
                
                result.append({
                    "quotation_response_id": quotation.id,
                    "quotation_request_id": request.id,
                    "lab_tests": request.lab_tests,
                    "test_items": quotation.test_items,
                    "total_amount": quotation.total_amount,
                    "accepted_at": quotation.accepted_at,
                    "patient": {
                        "id": patient.id,
                        "name": patient.name,
                        "phone": patient.phone,
                        "date_of_birth": patient.date_of_birth,
                        "blood_group": patient.blood_group
                    } if patient else None
                })
    
    return result


@router.delete("/{report_id}")
def delete_lab_report(
    report_id: int,
    current_clinic: Clinic = Depends(get_current_clinic),
    db: Session = Depends(get_db)
):
    """
    Delete a lab report (clinic only)
    """
    
    report = db.query(LabReport).filter(
        LabReport.id == report_id,
        LabReport.clinic_id == current_clinic.id
    ).first()
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lab report not found"
        )
    
    # Delete associated files
    if report.report_file_url:
        file_path = os.path.join("backend", report.report_file_url.lstrip('/'))
        if os.path.exists(file_path):
            os.remove(file_path)
    
    if report.report_images:
        for image_url in report.report_images:
            image_path = os.path.join("backend", image_url.lstrip('/'))
            if os.path.exists(image_path):
                os.remove(image_path)
    
    db.delete(report)
    db.commit()
    
    return {"message": "Lab report deleted successfully"}
