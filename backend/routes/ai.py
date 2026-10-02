from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any, Optional
from datetime import date, timedelta
from database import get_supabase_admin, get_current_user_id
from models.schemas import AIChatRequest, AIChatResponse, DietAnalysisResponse
from services.groq_service import GroqService
from services.nutrition_calculator import NutritionCalculator

router = APIRouter(prefix="/api/ai", tags=["AI Copilot"])

async def _build_user_context(client: Any, user_id: str) -> Dict[str, Any]:
    """Compiles real, authentic user context for Groq"""
    # Profile
    prof_res = client.table("profiles").select("*").eq("id", user_id).execute()
    profile = prof_res.data[0] if prof_res.data else None

    # Today's food totals
    today_str = str(date.today())
    today_nutrition_res = client.table("daily_nutrition").select("*").eq("user_id", user_id).eq("date", today_str).execute()
    today_nutrition = today_nutrition_res.data[0] if today_nutrition_res.data else None

    # Today's logged foods
    food_logs_res = client.table("food_logs").select("food_name, quantity, unit, meal_type, time").eq("user_id", user_id).eq("date", today_str).execute()
    recent_foods = food_logs_res.data or []

    # Recent lab values
    labs_res = client.table("lab_values").select("test_name, value, unit, reference_range, test_date").eq("user_id", user_id).order("test_date", desc=True).limit(10).execute()
    recent_labs = labs_res.data or []

    # Latest body measurements
    body_res = client.table("body_measurements").select("recorded_date, weight, waist").eq("user_id", user_id).order("recorded_date", desc=True).limit(5).execute()
    measurements = body_res.data or []

    # Target calculations if profile exists
    targets = NutritionCalculator.calculate_estimated_targets(profile) if profile else {}

    return {
        "profile": profile,
        "calculated_targets": targets,
        "today_totals": today_nutrition,
        "today_foods": recent_foods,
        "recent_lab_values": recent_labs,
        "recent_measurements": measurements
    }

@router.post("/chat", response_model=AIChatResponse)
async def chat_with_copilot(
    payload: AIChatRequest,
    user_id: str = Depends(get_current_user_id)
):
    """
    Interacts with the AI Nutrition Assistant using Groq llama-3.3-70b-versatile.
    Provides verified stored user context and enforces strict non-fabrication rules.
    """
    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=500, detail="Database not available")

    # Get or create conversation
    conv_id = payload.conversation_id
    if not conv_id:
        conv_insert = client.table("ai_conversations").insert({
            "user_id": user_id,
            "title": payload.message[:40] + ("..." if len(payload.message) > 40 else "")
        }).execute()
        if conv_insert.data:
            conv_id = conv_insert.data[0]["id"]
        else:
            raise HTTPException(status_code=500, detail="Failed to initialize conversation")

    # Fetch past conversation messages
    history_res = client.table("ai_messages").select("role, content").eq("conversation_id", conv_id).order("created_at").limit(10).execute()
    conversation_history = history_res.data or []

    # Build authentic user context
    user_context = await _build_user_context(client, user_id)

    # Save user message
    client.table("ai_messages").insert({
        "conversation_id": conv_id,
        "user_id": user_id,
        "role": "user",
        "content": payload.message
    }).execute()

    # Generate AI response
    assistant_reply = await GroqService.chat_with_assistant(
        user_message=payload.message,
        user_context=user_context,
        conversation_history=conversation_history
    )

    # Save assistant message
    client.table("ai_messages").insert({
        "conversation_id": conv_id,
        "user_id": user_id,
        "role": "assistant",
        "content": assistant_reply,
        "context_snapshot": user_context
    }).execute()

    return AIChatResponse(
        conversation_id=conv_id,
        message=assistant_reply,
        context_used={
            "weight": user_context.get("profile", {}).get("weight") if user_context.get("profile") else None,
            "today_calories": user_context.get("today_totals", {}).get("total_calories") if user_context.get("today_totals") else 0,
            "today_protein": user_context.get("today_totals", {}).get("total_protein") if user_context.get("today_totals") else 0,
            "recent_labs_count": len(user_context.get("recent_lab_values", []))
        }
    )

@router.get("/conversations")
async def list_conversations(user_id: str = Depends(get_current_user_id)):
    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=500, detail="Database not available")
    
    res = client.table("ai_conversations").select("*").eq("user_id", user_id).order("updated_at", desc=True).execute()
    return res.data or []

@router.get("/conversations/{conv_id}/messages")
async def get_conversation_messages(conv_id: str, user_id: str = Depends(get_current_user_id)):
    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=500, detail="Database not available")

    res = client.table("ai_messages").select("*").eq("conversation_id", conv_id).eq("user_id", user_id).order("created_at").execute()
    return res.data or []

@router.post("/is-my-diet-working", response_model=DietAnalysisResponse)
async def analyze_is_my_diet_working(user_id: str = Depends(get_current_user_id)):
    """
    Dedicated feature to evaluate: 'Is my current eating pattern working?'
    Compares historical food intake, weight changes, and lab measurements.
    Strictly forbids false certainty and causation claims.
    """
    client = get_supabase_admin()
    if not client:
        raise HTTPException(status_code=500, detail="Database not available")

    # Fetch longitudinal food intake (up to last 60 days)
    start_date = str(date.today() - timedelta(days=60))
    daily_res = client.table("daily_nutrition").select("*").eq("user_id", user_id).gte("date", start_date).order("date").execute()
    nutrition_history = daily_res.data or []

    # Fetch body measurements
    body_res = client.table("body_measurements").select("*").eq("user_id", user_id).order("recorded_date").execute()
    body_history = body_res.data or []

    # Fetch lab values
    labs_res = client.table("lab_values").select("*").eq("user_id", user_id).order("test_date").execute()
    lab_history = labs_res.data or []

    # Fetch profile
    prof_res = client.table("profiles").select("*").eq("id", user_id).execute()
    profile = prof_res.data[0] if prof_res.data else None

    # Calculate observed statistics
    days_logged = len(nutrition_history)
    avg_cals = (sum(d.get("total_calories", 0) for d in nutrition_history) / days_logged) if days_logged > 0 else None
    avg_protein = (sum(d.get("total_protein", 0) for d in nutrition_history) / days_logged) if days_logged > 0 else None
    avg_fiber = (sum(d.get("total_fiber", 0) for d in nutrition_history) / days_logged) if days_logged > 0 else None

    weight_change = None
    if len(body_history) >= 2:
        weight_change = round(body_history[-1]["weight"] - body_history[0]["weight"], 2)

    observed_data = {
        "days_logged": days_logged,
        "body_measurements_recorded": len(body_history),
        "lab_markers_recorded": len(lab_history),
        "weight_change_kg": weight_change,
        "earliest_log": nutrition_history[0]["date"] if nutrition_history else None,
        "latest_log": nutrition_history[-1]["date"] if nutrition_history else None
    }

    calculated_metrics = {
        "average_calories": round(avg_cals, 1) if avg_cals is not None else "Insufficient data available",
        "average_protein_g": round(avg_protein, 1) if avg_protein is not None else "Insufficient data available",
        "average_fiber_g": round(avg_fiber, 1) if avg_fiber is not None else "Insufficient data available"
    }

    diet_context = {
        "profile": profile,
        "observed_data": observed_data,
        "calculated_metrics": calculated_metrics,
        "recent_daily_samples": nutrition_history[-10:],
        "body_measurements": body_history[-5:],
        "lab_records": lab_history
    }

    result = await GroqService.analyze_diet_effectiveness(diet_context)

    return DietAnalysisResponse(
        observed_data=observed_data,
        calculated_metrics=calculated_metrics,
        ai_interpretation=result["interpretation"],
        disclaimer=result["disclaimer"]
    )
