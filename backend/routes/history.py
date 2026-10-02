from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, Any, List, Optional
from database import get_supabase_admin, get_current_user_id

router = APIRouter(prefix="/api/history", tags=["Personal History"])

@router.get("")
async def get_personal_history(
    category: Optional[str] = Query(None, pattern="^(body|food|laboratory|insights)?$"),
    user_id: str = Depends(get_current_user_id)
):
    """
    Returns authentic chronological history across Body, Food, Laboratory, and AI insights.
    Never invents historical data.
    """
    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=500, detail="Database not available")

    result: Dict[str, Any] = {
        "body": [],
        "food": [],
        "laboratory": [],
        "insights": []
    }

    if category is None or category == "body":
        body_res = client.table("body_measurements").select("*").eq("user_id", user_id).order("recorded_date", desc=True).execute()
        result["body"] = body_res.data or []

    if category is None or category == "food":
        food_res = client.table("food_logs").select("*").eq("user_id", user_id).order("date", desc=True).order("created_at", desc=True).limit(100).execute()
        food_logs = food_res.data or []
        if food_logs:
            f_ids = [f["id"] for f in food_logs]
            nuts_res = client.table("food_nutrients").select("*").in_("food_log_id", f_ids).execute()
            nuts_map = {n["food_log_id"]: n for n in (nuts_res.data or [])}
            for f in food_logs:
                f["nutrients"] = nuts_map.get(f["id"])
        result["food"] = food_logs

    if category is None or category == "laboratory":
        lab_res = client.table("lab_values").select("*").eq("user_id", user_id).order("test_date", desc=True).execute()
        result["laboratory"] = lab_res.data or []

    if category is None or category == "insights":
        ins_res = client.table("ai_insights").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        result["insights"] = ins_res.data or []

    return result
