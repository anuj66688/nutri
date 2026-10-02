-- AI Nutrition Intelligence Platform - Supabase PostgreSQL Schema
-- Clean relational schema with Row Level Security (RLS) enabled on all tables

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age INTEGER NOT NULL CHECK (age > 0 AND age < 130),
    sex TEXT NOT NULL CHECK (sex IN ('male', 'female', 'other')),
    height NUMERIC NOT NULL CHECK (height > 30 AND height < 300), -- in cm
    weight NUMERIC NOT NULL CHECK (weight > 10 AND weight < 500), -- in kg
    activity_level TEXT NOT NULL CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'very_active', 'extra_active')),
    waist_measurement NUMERIC, -- in cm
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. BODY MEASUREMENTS
CREATE TABLE IF NOT EXISTS public.body_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
    weight NUMERIC NOT NULL,
    height NUMERIC,
    waist NUMERIC,
    hip NUMERIC,
    chest NUMERIC,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. LAB REPORTS
CREATE TABLE IF NOT EXISTS public.lab_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    report_date DATE,
    raw_extracted_text TEXT,
    status TEXT NOT NULL DEFAULT 'processed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. LAB VALUES
CREATE TABLE IF NOT EXISTS public.lab_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES public.lab_reports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    test_name TEXT NOT NULL,
    value NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    reference_range TEXT,
    test_date DATE NOT NULL,
    is_flagged_for_review BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. FOOD LOGS
CREATE TABLE IF NOT EXISTS public.food_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time TIME NOT NULL DEFAULT CURRENT_TIME,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    food_name TEXT NOT NULL,
    quantity NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    raw_query TEXT,
    is_estimate BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. FOOD NUTRIENTS
CREATE TABLE IF NOT EXISTS public.food_nutrients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    food_log_id UUID NOT NULL REFERENCES public.food_logs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    calories NUMERIC,
    protein NUMERIC,
    carbohydrates NUMERIC,
    fat NUMERIC,
    fiber NUMERIC,
    iron NUMERIC,
    calcium NUMERIC,
    magnesium NUMERIC,
    potassium NUMERIC,
    sodium NUMERIC,
    zinc NUMERIC,
    vitamin_a NUMERIC,
    vitamin_c NUMERIC,
    vitamin_d NUMERIC,
    vitamin_b12 NUMERIC,
    folate NUMERIC,
    other_nutrients JSONB DEFAULT '{}'::jsonb,
    data_source TEXT DEFAULT 'USDA FoodData Central',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. DAILY NUTRITION
CREATE TABLE IF NOT EXISTS public.daily_nutrition (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_calories NUMERIC NOT NULL DEFAULT 0,
    total_protein NUMERIC NOT NULL DEFAULT 0,
    total_carbohydrates NUMERIC NOT NULL DEFAULT 0,
    total_fat NUMERIC NOT NULL DEFAULT 0,
    total_fiber NUMERIC NOT NULL DEFAULT 0,
    estimated_calorie_target NUMERIC,
    estimated_protein_target NUMERIC,
    estimated_carbs_target NUMERIC,
    estimated_fat_target NUMERIC,
    estimated_fiber_target NUMERIC,
    target_type TEXT NOT NULL DEFAULT 'Calculated',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_daily_nutrition UNIQUE (user_id, date)
);

-- 8. AI CONVERSATIONS
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Nutrition Consultation',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. AI MESSAGES
CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    context_snapshot JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. AI INSIGHTS
CREATE TABLE IF NOT EXISTS public.ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL,
    content TEXT NOT NULL,
    observed_data_basis JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_nutrients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_nutrition ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- POLICIES
-- profiles
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- body_measurements
CREATE POLICY "body_measurements_select" ON public.body_measurements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "body_measurements_insert" ON public.body_measurements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "body_measurements_update" ON public.body_measurements FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "body_measurements_delete" ON public.body_measurements FOR DELETE USING (auth.uid() = user_id);

-- lab_reports
CREATE POLICY "lab_reports_select" ON public.lab_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "lab_reports_insert" ON public.lab_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "lab_reports_update" ON public.lab_reports FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "lab_reports_delete" ON public.lab_reports FOR DELETE USING (auth.uid() = user_id);

-- lab_values
CREATE POLICY "lab_values_select" ON public.lab_values FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "lab_values_insert" ON public.lab_values FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "lab_values_update" ON public.lab_values FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "lab_values_delete" ON public.lab_values FOR DELETE USING (auth.uid() = user_id);

-- food_logs
CREATE POLICY "food_logs_select" ON public.food_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "food_logs_insert" ON public.food_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "food_logs_update" ON public.food_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "food_logs_delete" ON public.food_logs FOR DELETE USING (auth.uid() = user_id);

-- food_nutrients
CREATE POLICY "food_nutrients_select" ON public.food_nutrients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "food_nutrients_insert" ON public.food_nutrients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "food_nutrients_update" ON public.food_nutrients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "food_nutrients_delete" ON public.food_nutrients FOR DELETE USING (auth.uid() = user_id);

-- daily_nutrition
CREATE POLICY "daily_nutrition_select" ON public.daily_nutrition FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "daily_nutrition_insert" ON public.daily_nutrition FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "daily_nutrition_update" ON public.daily_nutrition FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "daily_nutrition_delete" ON public.daily_nutrition FOR DELETE USING (auth.uid() = user_id);

-- ai_conversations
CREATE POLICY "ai_conversations_select" ON public.ai_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ai_conversations_insert" ON public.ai_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ai_conversations_update" ON public.ai_conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ai_conversations_delete" ON public.ai_conversations FOR DELETE USING (auth.uid() = user_id);

-- ai_messages
CREATE POLICY "ai_messages_select" ON public.ai_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ai_messages_insert" ON public.ai_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ai_messages_update" ON public.ai_messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ai_messages_delete" ON public.ai_messages FOR DELETE USING (auth.uid() = user_id);

-- ai_insights
CREATE POLICY "ai_insights_select" ON public.ai_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ai_insights_insert" ON public.ai_insights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ai_insights_update" ON public.ai_insights FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ai_insights_delete" ON public.ai_insights FOR DELETE USING (auth.uid() = user_id);

-- STORAGE BUCKETS (run in Supabase SQL editor or storage configuration)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('lab-reports', 'lab-reports', false) ON CONFLICT DO NOTHING;
