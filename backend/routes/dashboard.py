from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List, Optional
from datetime import date, timedelta, datetime
from database import get_supabase_admin, get_current_user_id
from services.nutrition_calculator import NutritionCalculator
from models.schemas import FoodNutrientData

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("")
async def get_dashboard_data(user_id: str = Depends(get_current_user_id)):
    """
    Returns consolidated, authentic user dashboard information:
    - User Profile & current weight
    - Today's consumed totals & Calculated Targets
    - Today's meals categorized by breakfast, lunch, dinner, snack
    - Recent 14-day nutrition history for interactive charts
    - Recent lab tests
    - Stored/derived data-backed AI insights
    """
    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=500, detail="Database not available")

    # 1. Fetch Profile
    prof_res = client.table("profiles").select("*").eq("id", user_id).execute()
    profile = prof_res.data[0] if prof_res.data else None
    
    targets = {}
    if profile:
        targets = NutritionCalculator.calculate_estimated_targets(profile)

    # 2. Today's date and meals
    today_str = str(date.today())
    today_meals_res = client.table("food_logs").select("*").eq("user_id", user_id).eq("date", today_str).order("created_at").execute()
    today_logs = today_meals_res.data or []

    # Fetch nutrients for today's logs
    log_ids = [l["id"] for l in today_logs]
    nuts_by_log: Dict[str, Any] = {}
    if log_ids:
        nuts_res = client.table("food_nutrients").select("*").in_("food_log_id", log_ids).execute()
        for n in (nuts_res.data or []):
            nuts_by_log[n["food_log_id"]] = n

    categorized_meals: Dict[str, List[Dict[str, Any]]] = {
        "breakfast": [],
        "lunch": [],
        "dinner": [],
        "snack": []
    }

    consumed_totals = {
        "calories": 0.0,
        "protein": 0.0,
        "carbohydrates": 0.0,
        "fat": 0.0,
        "fiber": 0.0
    }

    for log in today_logs:
        mtype = log.get("meal_type", "lunch").lower()
        if mtype not in categorized_meals:
            categorized_meals[mtype] = []
        
        n_info = nuts_by_log.get(log["id"], {})
        log_entry = {
            **log,
            "nutrients": n_info
        }
        categorized_meals[mtype].append(log_entry)

        consumed_totals["calories"] += float(n_info.get("calories") or 0)
        consumed_totals["protein"] += float(n_info.get("protein") or 0)
        consumed_totals["carbohydrates"] += float(n_info.get("carbohydrates") or 0)
        consumed_totals["fat"] += float(n_info.get("fat") or 0)
        consumed_totals["fiber"] += float(n_info.get("fiber") or 0)

    for k in consumed_totals:
        consumed_totals[k] = round(consumed_totals[k], 1)

    # 3. Nutrition Trends (Last 14 days)
    start_date = str(date.today() - timedelta(days=14))
    history_res = client.table("daily_nutrition").select("*").eq("user_id", user_id).gte("date", start_date).order("date", desc=False).execute()
    nutrition_trends = history_res.data or []

    # 4. Recent Lab Results (Latest 5)
    labs_res = client.table("lab_values").select("*").eq("user_id", user_id).order("test_date", desc=True).limit(5).execute()
    recent_labs = labs_res.data or []

    # 5. Body measurements for weight trend
    body_res = client.table("body_measurements").select("*").eq("user_id", user_id).order("recorded_date", desc=False).execute()
    body_history = body_res.data or []

    # 6. Data-backed AI Insights (strictly not fabricated)
    insights = NutritionCalculator.derive_data_backed_insights(
        food_history=nutrition_trends,
        body_history=body_history,
        lab_history=recent_labs
    )

    # Greeting based on local time
    current_hour = datetime.now().hour
    if current_hour < 12:
        greeting = "Good morning"
    elif current_hour < 17:
        greeting = "Good afternoon"
    else:
        greeting = "Good evening"

    user_name = profile.get("name", "User") if profile else "User"

    return {
        "greeting": f"{greeting}, {user_name}",
        "profile": profile,
        "consumed": consumed_totals,
        "targets": targets,
        "meals": categorized_meals,
        "trends": nutrition_trends,
        "recent_labs": recent_labs,
        "insights": insights,
        "body_measurements": body_history
    }
