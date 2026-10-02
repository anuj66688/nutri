from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import List, Optional
from datetime import date, datetime
import uuid
from database import get_supabase_admin, get_current_user_id
from models.schemas import LabReportResponse, LabValueResponse, LabValueRecord
from services.lab_parser import LabReportParser

router = APIRouter(prefix="/api/labs", tags=["Lab Reports"])

ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"]

@router.post("/upload", response_model=LabReportResponse)
async def upload_lab_report(
    file: UploadFile = File(...),
    report_date: Optional[str] = Form(None),
    user_id: str = Depends(get_current_user_id)
):
    """
    Uploads a laboratory report (PDF, JPG, JPEG, PNG),
    stores original file, extracts text, uses Groq for structured extraction,
    and stores lab test values with source linking.
    """
    content_type = file.content_type or ""
    filename = file.filename or "report.pdf"
    
    # Validation
    if content_type not in ALLOWED_TYPES and not any(filename.lower().endswith(ext) for ext in [".pdf", ".jpg", ".jpeg", ".png"]):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Please upload a PDF, JPG, JPEG, or PNG document."
        )

    file_bytes = await file.read()
    if len(file_bytes) > 20 * 1024 * 1024:  # 20MB limit
        raise HTTPException(status_code=400, detail="File size exceeds maximum limit of 20MB.")

    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=500, detail="Database not available")

    # Upload original to Supabase Storage bucket 'lab-reports'
    storage_path = f"{user_id}/{uuid.uuid4()}_{filename}"
    try:
        client.storage.from_("lab-reports").upload(storage_path, file_bytes, {"content-type": content_type})
    except Exception as e:
        print(f"Notice: Supabase storage upload note: {e}")
        # Proceed with file_path reference

    effective_date = report_date or str(date.today())

    # Extract text and parse laboratory values
    try:
        extracted_text, lab_records = await LabReportParser.process_report_file(
            file_bytes=file_bytes,
            file_name=filename,
            content_type=content_type,
            default_date=effective_date
        )
    except Exception as e:
        print(f"Parsing error: {e}")
        extracted_text = ""
        lab_records = []

    # Insert into lab_reports
    report_insert = client.table("lab_reports").insert({
        "user_id": user_id,
        "file_path": storage_path,
        "file_name": filename,
        "file_type": content_type,
        "file_size": len(file_bytes),
        "report_date": effective_date,
        "raw_extracted_text": extracted_text,
        "status": "processed" if lab_records else "needs_review"
    }).execute()

    if not report_insert.data:
        raise HTTPException(status_code=500, detail="Failed to record lab report.")

    report_row = report_insert.data[0]
    report_id = report_row["id"]

    # Insert lab_values
    saved_values: List[LabValueResponse] = []
    if lab_records:
        records_to_insert = []
        for r in lab_records:
            records_to_insert.append({
                "report_id": report_id,
                "user_id": user_id,
                "test_name": r.test_name,
                "value": r.value,
                "unit": r.unit,
                "reference_range": r.reference_range,
                "test_date": str(r.test_date),
                "is_flagged_for_review": r.is_flagged_for_review,
                "notes": r.notes
            })
        
        val_insert = client.table("lab_values").insert(records_to_insert).execute()
        for v in (val_insert.data or []):
            saved_values.append(LabValueResponse(**v))

    return LabReportResponse(
        id=report_id,
        user_id=user_id,
        file_path=storage_path,
        file_name=filename,
        file_type=content_type,
        file_size=len(file_bytes),
        report_date=report_row.get("report_date"),
        status=report_row["status"],
        created_at=report_row.get("created_at"),
        values=saved_values
    )

@router.get("/reports", response_model=List[LabReportResponse])
async def get_lab_reports(user_id: str = Depends(get_current_user_id)):
    """Lists all uploaded reports and their extracted values"""
    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=500, detail="Database not available")

    reports_res = client.table("lab_reports").select("*").eq("user_id", user_id).order("report_date", desc=True).execute()
    reports = reports_res.data or []
    if not reports:
        return []

    report_ids = [r["id"] for r in reports]
    vals_res = client.table("lab_values").select("*").in_("report_id", report_ids).order("test_date", desc=False).execute()
    
    vals_by_report: dict = {}
    for v in (vals_res.data or []):
        rep_id = v["report_id"]
        if rep_id not in vals_by_report:
            vals_by_report[rep_id] = []
        vals_by_report[rep_id].append(LabValueResponse(**v))

    return [
        LabReportResponse(
            id=r["id"],
            user_id=r["user_id"],
            file_path=r["file_path"],
            file_name=r["file_name"],
            file_type=r["file_type"],
            file_size=r.get("file_size"),
            report_date=r.get("report_date"),
            status=r["status"],
            created_at=r.get("created_at"),
            values=vals_by_report.get(r["id"], [])
        )
        for r in reports
    ]

@router.get("/markers")
async def get_distinct_markers(user_id: str = Depends(get_current_user_id)):
    """Returns list of unique lab test marker names for the user"""
    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=500, detail="Database not available")

    vals_res = client.table("lab_values").select("test_name").eq("user_id", user_id).execute()
    markers = sorted(list({v["test_name"] for v in (vals_res.data or []) if v.get("test_name")}))
    return markers

@router.get("/values", response_model=List[LabValueResponse])
async def get_lab_values(
    marker: Optional[str] = None,
    user_id: str = Depends(get_current_user_id)
):
    """Returns historical values for all markers or filtered by a specific marker"""
    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=500, detail="Database not available")

    query = client.table("lab_values").select("*").eq("user_id", user_id)
    if marker:
        query = query.ilike("test_name", marker)
    
    res = query.order("test_date", desc=False).execute()
    return [LabValueResponse(**v) for v in (res.data or [])]

@router.post("/values/manual", response_model=LabValueResponse)
async def add_manual_lab_value(
    record: LabValueRecord,
    user_id: str = Depends(get_current_user_id)
):
    """Allows manual recording or correction of a lab test marker"""
    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=500, detail="Database not available")

    data = record.model_dump()
    data["user_id"] = user_id
    data["test_date"] = str(data["test_date"])

    res = client.table("lab_values").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to save lab marker value")
    return LabValueResponse(**res.data[0])
