from typing import Dict, Any, List, Optional
from datetime import date, timedelta
from models.schemas import ProfileResponse

class NutritionCalculator:
    @staticmethod
    def calculate_estimated_targets(profile: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculates estimated nutritional targets using standard Mifflin-St Jeor formula.
        Targets are explicitly labeled as 'Calculated' and not medical prescriptions.
        """
        weight = float(profile.get("weight", 70))
        height = float(profile.get("height", 175))
        age = int(profile.get("age", 30))
        sex = str(profile.get("sex", "male")).lower()
        activity = str(profile.get("activity_level", "sedentary")).lower()

        # Mifflin-St Jeor BMR
        if sex == "male":
            bmr = 10 * weight + 6.25 * height - 5 * age + 5
        else:
            bmr = 10 * weight + 6.25 * height - 5 * age - 161

        activity_factors = {
            "sedentary": 1.2,
            "light": 1.375,
            "moderate": 1.55,
            "very_active": 1.725,
            "extra_active": 1.9
        }
        factor = activity_factors.get(activity, 1.2)
        tdee = bmr * factor

        # Macronutrient distribution recommendations
        # Protein: 1.6 g/kg standard healthy active maintenance
        protein_g = round(weight * 1.6, 1)
        # Fat: 25% of calories
        fat_calories = tdee * 0.25
        fat_g = round(fat_calories / 9.0, 1)
        # Carbohydrates: remaining calories
        carb_calories = max(0, tdee - (protein_g * 4.0) - fat_calories)
        carbs_g = round(carb_calories / 4.0, 1)
        # Fiber: ~14g per 1000 kcal
        fiber_g = round((tdee / 1000.0) * 14.0, 1)

        return {
            "estimated_calorie_target": round(tdee),
            "estimated_protein_target": protein_g,
            "estimated_carbs_target": carbs_g,
            "estimated_fat_target": fat_g,
            "estimated_fiber_target": fiber_g,
            "target_type": "Calculated (Mifflin-St Jeor estimate)"
        }

    @staticmethod
    def derive_data_backed_insights(
        food_history: List[Dict[str, Any]],
        body_history: List[Dict[str, Any]],
        lab_history: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Derives insights ONLY if supported by real stored data.
        Returns an empty list if data is insufficient.
        """
        insights: List[Dict[str, Any]] = []

        if len(food_history) >= 7:
            recent_7 = food_history[-7:]
            prev_7 = food_history[-14:-7] if len(food_history) >= 14 else []

            recent_protein = [d.get("total_protein", 0) for d in recent_7 if d.get("total_protein")]
            if recent_protein:
                avg_recent_p = sum(recent_protein) / len(recent_protein)
                if prev_7:
                    prev_protein = [d.get("total_protein", 0) for d in prev_7 if d.get("total_protein")]
                    if prev_protein:
                        avg_prev_p = sum(prev_protein) / len(prev_protein)
                        diff = avg_recent_p - avg_prev_p
                        if diff >= 5.0:
                            insights.append({
                                "type": "trend",
                                "title": "Protein Intake Increased",
                                "content": f"Your average daily protein intake has increased by {round(diff, 1)}g over the last 7 days compared to the prior week.",
                                "observed_data_basis": {"recent_avg": round(avg_recent_p, 1), "previous_avg": round(avg_prev_p, 1)}
                            })
                        elif diff <= -5.0:
                            insights.append({
                                "type": "trend",
                                "title": "Protein Intake Decreased",
                                "content": f"Your average daily protein intake has decreased by {round(abs(diff), 1)}g over the last 7 days compared to the prior week.",
                                "observed_data_basis": {"recent_avg": round(avg_recent_p, 1), "previous_avg": round(avg_prev_p, 1)}
                            })

        # Body weight changes
        if len(body_history) >= 2:
            first_w = body_history[0].get("weight")
            latest_w = body_history[-1].get("weight")
            if first_w and latest_w and first_w != latest_w:
                w_diff = round(latest_w - first_w, 1)
                sign = "+" if w_diff > 0 else ""
                insights.append({
                    "type": "weight",
                    "title": "Recorded Weight Change",
                    "content": f"Recorded weight changed by {sign}{w_diff} kg between {body_history[0].get('recorded_date')} and {body_history[-1].get('recorded_date')}.",
                    "observed_data_basis": {"initial": first_w, "current": latest_w}
                })

        return insights
