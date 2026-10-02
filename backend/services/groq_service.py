import json
from typing import List, Dict, Any, Optional
from groq import Groq
from config import settings
from models.schemas import FoodItemParsed, LabValueRecord

class GroqService:
    @classmethod
    def get_client(cls) -> Optional[Groq]:
        if not settings.GROQ_API_KEY:
            return None
        try:
            return Groq(api_key=settings.GROQ_API_KEY)
        except Exception as e:
            print(f"Error initializing Groq client: {e}")
            return None

    @classmethod
    async def parse_food_input(cls, text: str) -> List[FoodItemParsed]:
        """
        Parses natural language food logs into structured items.
        Does NOT invent quantities or nutritional facts.
        """
        client = cls.get_client()
        if not client:
            # Fallback simple split if no Groq key configured
            items = [x.strip() for x in text.replace("and", ",").split(",") if x.strip()]
            return [FoodItemParsed(food_name=item, quantity=1.0, unit="serving", is_estimate=True) for item in items]

        prompt = f"""
You are an expert clinical nutrition parser.
Analyze this food intake text: "{text}"

Break it down into individual food items.
RULES:
1. Extract 'food_name' (clean singular or recognizable food name like 'egg', 'roti', 'dal', 'curd', 'grilled chicken', 'chicken biryani').
2. Extract 'quantity' (numeric float) and 'unit' (e.g., 'piece', 'gram', 'cup', 'bowl', 'plate', 'slice', 'serving').
3. If quantity is NOT mentioned or ambiguous (e.g. "I ate chicken" or "dal"), do NOT invent a quantity. Set 'is_quantity_missing': true, 'quantity': null, and 'clarification_needed': "Please specify the quantity or serving size for <food_name>."
4. If an exact quantity is given (e.g., "2 eggs", "200 grams grilled chicken"), set 'is_quantity_missing': false and 'is_estimate': false.
5. Do NOT invent or output nutritional values (calories, protein, etc.).
6. Output ONLY valid JSON array of objects conforming to:
[
  {{
    "food_name": "string",
    "quantity": number or null,
    "unit": "string",
    "meal_type": "breakfast" | "lunch" | "dinner" | "snack",
    "is_quantity_missing": boolean,
    "is_estimate": boolean,
    "clarification_needed": string or null
  }}
]
"""
        try:
            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a clinical nutrition data extractor. Output strictly valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            raw_content = chat_completion.choices[0].message.content or "{}"
            parsed = json.loads(raw_content)
            
            # If wrapped in a parent key like {"items": [...]}
            if isinstance(parsed, dict):
                items_list = parsed.get("items") or parsed.get("foods") or list(parsed.values())[0] if parsed else []
                if not isinstance(items_list, list):
                    items_list = [parsed]
            else:
                items_list = parsed

            results: List[FoodItemParsed] = []
            for item in items_list:
                results.append(FoodItemParsed(
                    food_name=item.get("food_name", "Unknown food"),
                    quantity=float(item["quantity"]) if item.get("quantity") is not None else None,
                    unit=item.get("unit", "serving"),
                    meal_type=item.get("meal_type", "lunch"),
                    is_quantity_missing=bool(item.get("is_quantity_missing", False)),
                    is_estimate=bool(item.get("is_estimate", False)),
                    clarification_needed=item.get("clarification_needed")
                ))
            return results
        except Exception as e:
            print(f"Error parsing food input with Groq: {e}")
            # Safe graceful fallback
            return [FoodItemParsed(food_name=text, quantity=1.0, unit="serving", is_estimate=True)]

    @classmethod
    async def extract_lab_data(cls, extracted_text: str, default_date: str) -> List[LabValueRecord]:
        """
        Converts extracted lab report text into structured lab records.
        Strictly preserves reference ranges and flags ambiguous units.
        """
        client = cls.get_client()
        if not client:
            return []

        prompt = f"""
You are a precision clinical laboratory data parser.
Below is text extracted from a medical laboratory report:
---
{extracted_text}
---

Extract recognized laboratory measurements.
CRITICAL RULES:
1. For each test, extract:
   - test_name: Standardized clinical name (e.g., 'Hemoglobin', 'Vitamin B12', 'Vitamin D, 25-Hydroxy', 'Fasting Blood Sugar', 'Total Cholesterol', 'Serum Ferritin', 'TSH', 'HbA1c').
   - value: Numeric value as float.
   - unit: Exact unit as stated in the report (e.g., 'g/dL', 'pg/mL', 'ng/mL', 'mg/dL', 'µIU/mL').
   - reference_range: Exact reference range stated in the report (e.g. '13.0-17.0', '< 200', '70-99'). If the report does NOT provide a reference range, output null. NEVER invent or guess a reference range.
   - test_date: YYYY-MM-DD format if found in the report text; otherwise use "{default_date}".
   - is_flagged_for_review: true if unit cannot be confidently identified, value is ambiguous, or format is unclear; false otherwise.
   - notes: Any critical comment noted on this test, or null.
2. Output ONLY a valid JSON object with key "lab_values":
{{
  "lab_values": [
    {{
      "test_name": "string",
      "value": number,
      "unit": "string",
      "reference_range": string or null,
      "test_date": "YYYY-MM-DD",
      "is_flagged_for_review": boolean,
      "notes": string or null
    }}
  ]
}}
"""
        try:
            response = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a clinical laboratory data extractor. Output strictly valid JSON. Do not invent missing data."},
                    {"role": "user", "content": prompt}
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.0,
                response_format={"type": "json_object"}
            )
            raw = response.choices[0].message.content or "{}"
            data = json.loads(raw)
            items = data.get("lab_values", [])
            
            results: List[LabValueRecord] = []
            for item in items:
                if item.get("test_name") and item.get("value") is not None:
                    try:
                        val = float(item["value"])
                        results.append(LabValueRecord(
                            test_name=str(item["test_name"]).strip(),
                            value=val,
                            unit=str(item.get("unit", "")).strip() or "unit",
                            reference_range=item.get("reference_range"),
                            test_date=item.get("test_date", default_date),
                            is_flagged_for_review=bool(item.get("is_flagged_for_review", False)),
                            notes=item.get("notes")
                        ))
                    except (ValueError, TypeError):
                        continue
            return results
        except Exception as e:
            print(f"Error extracting lab data with Groq: {e}")
            return []

    @classmethod
    async def chat_with_assistant(
        cls,
        user_message: str,
        user_context: Dict[str, Any],
        conversation_history: List[Dict[str, str]]
    ) -> str:
        """
        AI Nutrition Assistant using Groq llama-3.3-70b-versatile.
        Follows all strict behavioral rules from Section 14.
        """
        client = cls.get_client()
        if not client:
            return "AI service is currently not connected. Please ensure GROQ_API_KEY is configured in your backend environment."

        system_prompt = f"""
You are the AI Nutrition Assistant in an AI Nutrition Intelligence Platform.
You assist the user by reviewing their authentic, stored personal nutrition, laboratory, and body measurement data.

CURRENT USER PROFILE & REAL STORED DATA:
{json.dumps(user_context, indent=2, default=str)}

MANDATORY RULES:
1. NEVER invent user data, laboratory values, food logs, or measurements.
2. NEVER fabricate nutritional facts.
3. If information is unavailable or unrecorded in the user's data, explicitly say:
   "Insufficient data available." or "I don't have enough information to determine this."
   Do NOT fill missing values with guesses.
4. Clearly distinguish estimates from measured values.
5. Do NOT diagnose medical conditions.
6. Do NOT claim that food will cure a disease.
7. Do NOT prescribe medication or tell users to stop prescribed medication.
8. Encourage professional medical consultation when the situation requires clinical interpretation.
9. Do NOT treat correlation as causation.
10. Use the user's historical data when answering questions about their past eating or trends.
11. Present answers professionally with clean markdown formatting, structured lists, and nutrient/food breakdowns where applicable.
"""
        messages = [{"role": "system", "content": system_prompt}]
        for msg in conversation_history[-10:]:
            messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": user_message})

        try:
            response = client.chat.completions.create(
                messages=messages,
                model="llama-3.3-70b-versatile",
                temperature=0.3,
                max_tokens=1500
            )
            return response.choices[0].message.content or "No response generated."
        except Exception as e:
            print(f"Groq chat error: {e}")
            return "Unable to process your request at this moment. Please check network connectivity and backend Groq settings."

    @classmethod
    async def analyze_diet_effectiveness(
        cls,
        diet_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Analyzes 'Is my diet working?' by comparing longitudinal data.
        Strictly prevents claiming causation.
        """
        client = cls.get_client()
        if not client:
            return {
                "interpretation": "Insufficient data available to analyze diet effectiveness.",
                "disclaimer": "This analysis highlights observed changes in your logged data over time. It does not establish direct causation or replace professional medical advice."
            }

        prompt = f"""
Analyze the user's longitudinal data to answer: "Is my current eating pattern working?"

DATA SUMMARY:
{json.dumps(diet_context, indent=2, default=str)}

RULES:
1. Compare available historical information: food intake, average calorie intake, protein intake, fiber intake, weight changes, body measurements, laboratory measurements.
2. CRITICAL: DO NOT claim causation.
   For example, do NOT say: "Your diet caused your vitamin level to increase."
   Instead say: "Your vitamin level increased during the same period in which your logged diet changed. This does not establish that the diet caused the change."
3. Clearly distinguish:
   - Observed data
   - Calculated values
   - AI interpretation
4. If there is insufficient data (e.g. only 1 or 2 days of food or single lab test), state clearly that more longitudinal records are needed.
"""
        try:
            response = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a clinical data scientist in nutrition. Follow causation and data integrity rules strictly."},
                    {"role": "user", "content": prompt}
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.2,
                max_tokens=1500
            )
            return {
                "interpretation": response.choices[0].message.content or "Insufficient data available.",
                "disclaimer": "This analysis highlights observed changes in your logged data over time. It does not establish direct causation or replace professional medical advice."
            }
        except Exception as e:
            print(f"Error in diet effectiveness analysis: {e}")
            return {
                "interpretation": "Insufficient data available to analyze diet effectiveness at this time.",
                "disclaimer": "This analysis highlights observed changes in your logged data over time. It does not establish direct causation or replace professional medical advice."
            }
