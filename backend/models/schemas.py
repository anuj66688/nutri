import datetime as dt
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

# Profile
class ProfileBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    age: int = Field(..., gt=0, lt=130)
    sex: str = Field(..., pattern="^(male|female|other)$")
    height: float = Field(..., gt=30, lt=300, description="Height in cm")
    weight: float = Field(..., gt=10, lt=500, description="Weight in kg")
    activity_level: str = Field(..., pattern="^(sedentary|light|moderate|very_active|extra_active)$")
    waist_measurement: Optional[float] = Field(None, gt=20, lt=300, description="Waist in cm")

class ProfileCreate(ProfileBase):
    pass

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    sex: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    activity_level: Optional[str] = None
    waist_measurement: Optional[float] = None

class ProfileResponse(ProfileBase):
    id: str
    created_at: Optional[dt.datetime] = None
    updated_at: Optional[dt.datetime] = None

# Body Measurement
class BodyMeasurementCreate(BaseModel):
    recorded_date: dt.date = Field(default_factory=dt.date.today)
    weight: float = Field(..., gt=10, lt=500)
    height: Optional[float] = None
    waist: Optional[float] = None
    hip: Optional[float] = None
    chest: Optional[float] = None
    notes: Optional[str] = None

class BodyMeasurementResponse(BodyMeasurementCreate):
    id: str
    user_id: str
    created_at: Optional[dt.datetime] = None

# Food & Nutrition
class FoodNutrientData(BaseModel):
    calories: Optional[float] = None
    protein: Optional[float] = None
    carbohydrates: Optional[float] = None
    fat: Optional[float] = None
    fiber: Optional[float] = None
    iron: Optional[float] = None
    calcium: Optional[float] = None
    magnesium: Optional[float] = None
    potassium: Optional[float] = None
    sodium: Optional[float] = None
    zinc: Optional[float] = None
    vitamin_a: Optional[float] = None
    vitamin_c: Optional[float] = None
    vitamin_d: Optional[float] = None
    vitamin_b12: Optional[float] = None
    folate: Optional[float] = None
    other_nutrients: Optional[Dict[str, Any]] = None
    data_source: str = "USDA FoodData Central"

class FoodItemParsed(BaseModel):
    food_name: str
    quantity: Optional[float] = None
    unit: str = "serving"
    meal_type: Optional[str] = "lunch"
    is_quantity_missing: bool = False
    is_estimate: bool = False
    clarification_needed: Optional[str] = None
    nutrients: Optional[FoodNutrientData] = None

class NaturalFoodParseRequest(BaseModel):
    text: str = Field(..., min_length=2, description="Natural food text like '2 rotis, dal and curd'")
    meal_type: Optional[str] = None
    date: Optional[dt.date] = None
    time: Optional[str] = None

class FoodLogCreate(BaseModel):
    food_name: str
    quantity: float = Field(..., gt=0)
    unit: str
    meal_type: str = Field(..., pattern="^(breakfast|lunch|dinner|snack)$")
    date: dt.date = Field(default_factory=dt.date.today)
    time: Optional[str] = None
    raw_query: Optional[str] = None
    is_estimate: bool = False
    nutrients: Optional[FoodNutrientData] = None

class FoodLogResponse(BaseModel):
    id: str
    user_id: str
    date: dt.date
    time: Any
    meal_type: str
    food_name: str
    quantity: float
    unit: str
    raw_query: Optional[str] = None
    is_estimate: bool
    nutrients: Optional[FoodNutrientData] = None
    created_at: Optional[dt.datetime] = None

# Lab Values and Reports
class LabValueRecord(BaseModel):
    test_name: str
    value: float
    unit: str
    reference_range: Optional[str] = None
    test_date: dt.date
    is_flagged_for_review: bool = False
    notes: Optional[str] = None

class LabValueResponse(LabValueRecord):
    id: str
    report_id: Optional[str] = None
    user_id: str
    created_at: Optional[dt.datetime] = None

class LabReportResponse(BaseModel):
    id: str
    user_id: str
    file_path: str
    file_name: str
    file_type: str
    file_size: Optional[int] = None
    report_date: Optional[dt.date] = None
    status: str
    created_at: Optional[dt.datetime] = None
    values: List[LabValueResponse] = []

# Daily Nutrition Dashboard
class DailyNutritionSummary(BaseModel):
    date: dt.date
    total_calories: float
    total_protein: float
    total_carbohydrates: float
    total_fat: float
    total_fiber: float
    estimated_calorie_target: Optional[float] = None
    estimated_protein_target: Optional[float] = None
    estimated_carbs_target: Optional[float] = None
    estimated_fat_target: Optional[float] = None
    estimated_fiber_target: Optional[float] = None
    target_type: str = "Calculated"
    meals: Dict[str, List[FoodLogResponse]] = {}
    micronutrients: Dict[str, Optional[float]] = {}

# AI Assistant
class AIChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    message: str = Field(..., min_length=1)

class AIChatResponse(BaseModel):
    conversation_id: str
    message: str
    context_used: Dict[str, Any]

class DietAnalysisResponse(BaseModel):
    observed_data: Dict[str, Any]
    calculated_metrics: Dict[str, Any]
    ai_interpretation: str
    disclaimer: str = "This analysis highlights observed changes in your logged data over time. It does not establish direct causation or replace professional medical advice."
