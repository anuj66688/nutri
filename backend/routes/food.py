from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Dict, Any
from datetime import date, datetime
from database import get_supabase_admin, get_current_user_id
from models.schemas import (
    NaturalFoodParseRequest,
    FoodItemParsed,
    FoodLogCreate,
    FoodLogResponse,
    FoodNutrientData
)
from services.groq_service import GroqService
from services.usda_nutrition import USDANutritionService

router = APIRouter(prefix="/api/food", tags=["Food"])

@router.post("/parse", response_model=List[FoodItemParsed])
async def parse_natural_food(
    payload: NaturalFoodParseRequest,
    user_id: str = Depends(get_current_user_id)
):
    """
    Parses natural food descriptions (e.g. '2 rotis, dal and curd')
    and enriches each recognized item with structured USDA nutritional data.
    Does NOT invent quantities or fake nutrition values.
    """
    parsed_items = await GroqService.parse_food_input(payload.text)
    
    # Enrich each item with USDA nutrition facts
    enriched_items: List[FoodItemParsed] = []
    for item in parsed_items:
        # If user provided a meal type preference, override or retain
        if payload.meal_type:
            item.meal_type = payload.meal_type

        # Fetch USDA nutrients
        qty = item.quantity if (item.quantity is not None and not item.is_quantity_missing) else 1.0
        nutrients = await USDANutritionService.get_food_nutrients(
            food_name=item.food_name,
            quantity=qty,
            unit=item.unit
        )
        item.nutrients = nutrients
        enriched_items.append(item)

    return enriched_items

@router.get("/search", response_model=Optional[FoodNutrientData])
async def search_food_nutrients(
    query: str = Query(..., min_length=2),
    quantity: float = Query(1.0, gt=0),
    unit: str = Query("serving"),
    user_id: str = Depends(get_current_user_id)
):
    """Direct search against USDA FoodData Central database"""
    nutrients = await USDANutritionService.get_food_nutrients(query, quantity, unit)
    if not nutrients:
        raise HTTPException(status_code=404, detail="No USDA nutritional data found for this food.")
    return nutrients

@router.post("/log", response_model=FoodLogResponse)
async def log_food_item(
    payload: FoodLogCreate,
    user_id: str = Depends(get_current_user_id)
):
    """
    Logs a food item and stores its structured nutrient profile.
    Updates daily nutrition aggregates.
    """
    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=500, detail="Database not available")

    # Fetch nutrients if not already supplied
    nutrients = payload.nutrients
    if not nutrients:
        nutrients = await USDANutritionService.get_food_nutrients(
            payload.food_name,
            payload.quantity,
            payload.unit
        )

    log_date_str = str(payload.date)
    log_time_str = payload.time or datetime.now().strftime("%H:%M:%S")

    # Insert into food_logs
    log_insert = client.table("food_logs").insert({
        "user_id": user_id,
        "date": log_date_str,
        "time": log_time_str,
        "meal_type": payload.meal_type,
        "food_name": payload.food_name,
        "quantity": payload.quantity,
        "unit": payload.unit,
        "raw_query": payload.raw_query,
        "is_estimate": payload.is_estimate
    }).execute()

    if not log_insert.data:
        raise HTTPException(status_code=400, detail="Failed to log food")

    log_record = log_insert.data[0]
    log_id = log_record["id"]

    # Insert into food_nutrients if available
    saved_nutrients: Optional[FoodNutrientData] = None
    if nutrients:
        nutrient_dict = nutrients.model_dump()
        nutrient_dict["food_log_id"] = log_id
        nutrient_dict["user_id"] = user_id
        nut_insert = client.table("food_nutrients").insert(nutrient_dict).execute()
        if nut_insert.data:
            saved_nutrients = FoodNutrientData(**nut_insert.data[0])

    # Recompute daily_nutrition summary for this date
    await _recalculate_daily_nutrition(client, user_id, log_date_str)

    return FoodLogResponse(
        id=log_id,
        user_id=user_id,
        date=payload.date,
        time=log_time_str,
        meal_type=payload.meal_type,
        food_name=payload.food_name,
        quantity=payload.quantity,
        unit=payload.unit,
        raw_query=payload.raw_query,
        is_estimate=payload.is_estimate,
        nutrients=saved_nutrients or nutrients,
        created_at=log_record.get("created_at")
    )

@router.get("/logs", response_model=List[FoodLogResponse])
async def get_food_logs(
    target_date: Optional[date] = None,
    user_id: str = Depends(get_current_user_id)
):
    """Retrieves logged foods and linked nutrient details for a specific date or today"""
    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=500, detail="Database not available")

    query_date = str(target_date or date.today())
    logs_res = client.table("food_logs").select("*").eq("user_id", user_id).eq("date", query_date).order("created_at", desc=False).execute()
    
    logs = logs_res.data or []
    if not logs:
        return []

    log_ids = [l["id"] for l in logs]
    nuts_res = client.table("food_nutrients").select("*").in_("food_log_id", log_ids).execute()
    nuts_by_log = {n["food_log_id"]: n for n in (nuts_res.data or [])}

    results: List[FoodLogResponse] = []
    for l in logs:
        nut_data = nuts_by_log.get(l["id"])
        parsed_nut = FoodNutrientData(**nut_data) if nut_data else None
        results.append(FoodLogResponse(
            id=l["id"],
            user_id=l["user_id"],
            date=l["date"],
            time=l["time"],
            meal_type=l["meal_type"],
            food_name=l["food_name"],
            quantity=float(l["quantity"]),
            unit=l["unit"],
            raw_query=l.get("raw_query"),
            is_estimate=bool(l.get("is_estimate", False)),
            nutrients=parsed_nut,
            created_at=l.get("created_at")
        ))
    return results

@router.delete("/logs/{log_id}")
async def delete_food_log(log_id: str, user_id: str = Depends(get_current_user_id)):
    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=500, detail="Database not available")

    # Get log to know the date
    log_res = client.table("food_logs").select("date").eq("id", log_id).eq("user_id", user_id).execute()
    if not log_res.data:
        raise HTTPException(status_code=404, detail="Food log not found")
    
    log_date_str = log_res.data[0]["date"]
    client.table("food_logs").delete().eq("id", log_id).eq("user_id", user_id).execute()
    
    # Recalculate daily aggregate
    await _recalculate_daily_nutrition(client, user_id, log_date_str)
    return {"message": "Food log removed successfully"}

async def _recalculate_daily_nutrition(client: Any, user_id: str, date_str: str):
    """Internal helper to refresh total daily macro and micronutrients"""
    try:
        logs_res = client.table("food_logs").select("id").eq("user_id", user_id).eq("date", date_str).execute()
        log_ids = [l["id"] for l in (logs_res.data or [])]
        
        tot_cals = 0.0
        tot_p = 0.0
        tot_c = 0.0
        tot_f = 0.0
        tot_fib = 0.0

        if log_ids:
            nuts_res = client.table("food_nutrients").select("calories, protein, carbohydrates, fat, fiber").in_("food_log_id", log_ids).execute()
            for n in (nuts_res.data or []):
                tot_cals += float(n.get("calories") or 0)
                tot_p += float(n.get("protein") or 0)
                tot_c += float(n.get("carbohydrates") or 0)
                tot_f += float(n.get("fat") or 0)
                tot_fib += float(n.get("fiber") or 0)

        # Upsert into daily_nutrition
        client.table("daily_nutrition").upsert({
            "user_id": user_id,
            "date": date_str,
            "total_calories": round(tot_cals, 1),
            "total_protein": round(tot_p, 1),
            "total_carbohydrates": round(tot_c, 1),
            "total_fat": round(tot_f, 1),
            "total_fiber": round(tot_fib, 1),
            "updated_at": datetime.utcnow().isoformat()
        }, on_conflict="user_id,date").execute()
    except Exception as e:
        print(f"Error recalculating daily nutrition: {e}")
