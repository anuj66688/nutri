from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from database import get_supabase_admin, get_current_user_id
from models.schemas import ProfileCreate, ProfileUpdate, ProfileResponse, BodyMeasurementCreate, BodyMeasurementResponse

router = APIRouter(prefix="/api/profile", tags=["Profile"])

@router.get("", response_model=ProfileResponse)
async def get_profile(user_id: str = Depends(get_current_user_id)):
    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=500, detail="Database not available")
    
    res = client.table("profiles").select("*").eq("id", user_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Profile not found. Please complete onboarding.")
    return res.data[0]

@router.post("", response_model=ProfileResponse)
async def create_profile(profile_data: ProfileCreate, user_id: str = Depends(get_current_user_id)):
    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=500, detail="Database not available")
    
    data = profile_data.model_dump()
    data["id"] = user_id
    
    # Upsert profile
    res = client.table("profiles").upsert(data).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to save profile")
    
    # Also log initial body measurement
    try:
        client.table("body_measurements").insert({
            "user_id": user_id,
            "weight": profile_data.weight,
            "height": profile_data.height,
            "waist": profile_data.waist_measurement,
            "notes": "Initial onboarding measurement"
        }).execute()
    except Exception as e:
        print(f"Initial measurement log note: {e}")

    return res.data[0]

@router.put("", response_model=ProfileResponse)
async def update_profile(profile_data: ProfileUpdate, user_id: str = Depends(get_current_user_id)):
    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=500, detail="Database not available")
    
    update_data = {k: v for k, v in profile_data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")
    
    res = client.table("profiles").update(update_data).eq("id", user_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # If weight or waist updated, log a body measurement
    if "weight" in update_data:
        try:
            client.table("body_measurements").insert({
                "user_id": user_id,
                "weight": update_data["weight"],
                "waist": update_data.get("waist_measurement"),
                "notes": "Profile update"
            }).execute()
        except Exception:
            pass

    return res.data[0]

@router.get("/measurements", response_model=List[BodyMeasurementResponse])
async def get_measurements(user_id: str = Depends(get_current_user_id)):
    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=500, detail="Database not available")
    
    res = client.table("body_measurements").select("*").eq("user_id", user_id).order("recorded_date", desc=False).execute()
    return res.data or []

@router.post("/measurements", response_model=BodyMeasurementResponse)
async def add_measurement(measurement: BodyMeasurementCreate, user_id: str = Depends(get_current_user_id)):
    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=500, detail="Database not available")
    
    data = measurement.model_dump()
    data["user_id"] = user_id
    data["recorded_date"] = str(data["recorded_date"])
    
    res = client.table("body_measurements").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to record measurement")
    
    # Also update profile current weight
    try:
        client.table("profiles").update({"weight": measurement.weight}).eq("id", user_id).execute()
    except Exception:
        pass

    return res.data[0]
