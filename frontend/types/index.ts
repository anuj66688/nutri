export type Sex = 'male' | 'female' | 'other';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active' | 'extra_active';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Profile {
  id: string;
  name: string;
  age: number;
  sex: Sex;
  height: number; // cm
  weight: number; // kg
  activity_level: ActivityLevel;
  waist_measurement?: number; // cm
  created_at?: string;
  updated_at?: string;
}

export interface BodyMeasurement {
  id: string;
  user_id: string;
  recorded_date: string;
  weight: number;
  height?: number;
  waist?: number;
  hip?: number;
  chest?: number;
  notes?: string;
  created_at?: string;
}

export interface FoodNutrientData {
  calories?: number | null;
  protein?: number | null;
  carbohydrates?: number | null;
  fat?: number | null;
  fiber?: number | null;
  iron?: number | null;
  calcium?: number | null;
  magnesium?: number | null;
  potassium?: number | null;
  sodium?: number | null;
  zinc?: number | null;
  vitamin_a?: number | null;
  vitamin_c?: number | null;
  vitamin_d?: number | null;
  vitamin_b12?: number | null;
  folate?: number | null;
  other_nutrients?: Record<string, any> | null;
  data_source?: string;
}

export interface FoodItemParsed {
  food_name: string;
  quantity?: number | null;
  unit: string;
  meal_type?: MealType;
  is_quantity_missing: boolean;
  is_estimate: boolean;
  clarification_needed?: string | null;
  nutrients?: FoodNutrientData | null;
}

export interface FoodLog {
  id: string;
  user_id: string;
  date: string;
  time?: string;
  meal_type: MealType;
  food_name: string;
  quantity: number;
  unit: string;
  raw_query?: string;
  is_estimate: boolean;
  nutrients?: FoodNutrientData | null;
  created_at?: string;
}

export interface LabValue {
  id: string;
  report_id?: string;
  user_id: string;
  test_name: string;
  value: number;
  unit: string;
  reference_range?: string | null;
  test_date: string;
  is_flagged_for_review: boolean;
  notes?: string | null;
  created_at?: string;
}

export interface LabReport {
  id: string;
  user_id: string;
  file_path: string;
  file_name: string;
  file_type: string;
  file_size?: number;
  report_date?: string;
  status: string;
  created_at?: string;
  values: LabValue[];
}

export interface DailyTargets {
  estimated_calorie_target?: number;
  estimated_protein_target?: number;
  estimated_carbs_target?: number;
  estimated_fat_target?: number;
  estimated_fiber_target?: number;
  target_type?: string;
}

export interface DashboardData {
  greeting: string;
  profile?: Profile | null;
  consumed: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
  };
  targets: DailyTargets;
  meals: {
    breakfast: FoodLog[];
    lunch: FoodLog[];
    dinner: FoodLog[];
    snack: FoodLog[];
  };
  trends: Array<{
    date: string;
    total_calories: number;
    total_protein: number;
    total_carbohydrates: number;
    total_fat: number;
    total_fiber: number;
  }>;
  recent_labs: LabValue[];
  insights: Array<{
    type: string;
    title: string;
    content: string;
    observed_data_basis?: Record<string, any>;
  }>;
  body_measurements: BodyMeasurement[];
}

export interface AIChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  context_snapshot?: Record<string, any>;
  created_at?: string;
}

export interface AIConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AIChatResponse {
  conversation_id: string;
  message: string;
  context_used: Record<string, any>;
}

export interface DietAnalysis {
  observed_data: Record<string, any>;
  calculated_metrics: Record<string, any>;
  ai_interpretation: string;
  disclaimer: string;
}
