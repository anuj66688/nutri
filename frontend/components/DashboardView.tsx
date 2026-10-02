'use client';

import React from 'react';
import {
  Plus,
  Utensils,
  TrendingUp,
  FileSpreadsheet,
  Sparkles,
  Info,
  Calendar,
  Flame,
  Scale,
  Activity,
  ChevronRight
} from 'lucide-react';
import { DashboardData, FoodLog } from '@/types';
import { MacroProgressBar } from './MacroProgressBar';
import { EmptyState } from './EmptyState';
import { formatDate } from '@/lib/utils';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface DashboardViewProps {
  data: DashboardData;
  onOpenFoodModal: (mealType?: string) => void;
  onOpenLabModal: () => void;
  onSelectFood: (food: FoodLog) => void;
  onOpenDietModal: () => void;
  onNavigateToTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  onOpenFoodModal,
  onOpenLabModal,
  onSelectFood,
  onOpenDietModal,
  onNavigateToTab
}) => {
  const { greeting, profile, consumed, targets, meals, trends, recent_labs, insights } = data;

  const totalMealsCount =
    (meals.breakfast?.length || 0) +
    (meals.lunch?.length || 0) +
    (meals.dinner?.length || 0) +
    (meals.snack?.length || 0);

  const mealCategories = [
    { key: 'breakfast', label: 'Breakfast', items: meals.breakfast || [] },
    { key: 'lunch', label: 'Lunch', items: meals.lunch || [] },
    { key: 'dinner', label: 'Dinner', items: meals.dinner || [] },
    { key: 'snack', label: 'Snacks', items: meals.snack || [] },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Top Greeting Header (Section 16 requirement) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {greeting}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Here's your nutrition overview.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => onOpenFoodModal()}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log Food</span>
          </button>
          <button
            onClick={onOpenLabModal}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-zinc-800 hover:bg-slate-50 border border-slate-200 dark:border-zinc-700 transition-all shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Upload Lab</span>
          </button>
        </div>
      </div>

      {/* Target Notification Banner */}
      {targets.target_type && (
        <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/80 dark:border-emerald-900/30 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span className="text-slate-700 dark:text-slate-300">
              Daily targets are calculated using your physiological baseline (Mifflin-St Jeor formula). Labeled as estimated targets.
            </span>
          </div>
          <span className="hidden sm:inline text-[11px] font-semibold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
            {targets.target_type}
          </span>
        </div>
      )}

      {/* Primary Overview Cards (Section 10 & 16: Weight, Calories, Protein, Fiber, etc.) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Weight Card */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Weight
            </span>
            <Scale className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="my-3">
            <div className="flex items-baseline space-x-1">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {profile?.weight ?? '—'}
              </span>
              <span className="text-xs font-semibold text-slate-500">kg</span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-1">
              Height: {profile?.height ?? '—'} cm
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            Baseline recorded
          </div>
        </div>

        {/* Calories Card */}
        <MacroProgressBar
          label="Calories"
          consumed={consumed.calories}
          target={targets.estimated_calorie_target}
          unit="kcal"
          color="emerald"
        />

        {/* Protein Card */}
        <MacroProgressBar
          label="Protein"
          consumed={consumed.protein}
          target={targets.estimated_protein_target}
          unit="g"
          color="teal"
        />

        {/* Fiber Card */}
        <MacroProgressBar
          label="Dietary Fiber"
          consumed={consumed.fiber}
          target={targets.estimated_fiber_target}
          unit="g"
          color="blue"
        />
      </div>

      {/* Today's Meals Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Today's Meals
            </h2>
            <p className="text-xs text-slate-500">
              Logged food items and exact nutrient values from USDA FoodData Central
            </p>
          </div>
        </div>

        {totalMealsCount === 0 ? (
          <EmptyState
            icon={Utensils}
            title="No meals logged yet."
            description="Start by adding your first meal."
            actionLabel="Log First Meal"
            onAction={() => onOpenFoodModal('breakfast')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {mealCategories.map((cat) => (
              <div
                key={cat.key}
                className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      {cat.label}
                    </span>
                    <button
                      onClick={() => onOpenFoodModal(cat.key)}
                      className="p-1 rounded-lg text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                      title={`Add to ${cat.label}`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-zinc-800 mt-2">
                    {cat.items.length === 0 ? (
                      <p className="py-4 text-center text-xs text-slate-400 italic">
                        No {cat.label.toLowerCase()} logged
                      </p>
                    ) : (
                      cat.items.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => onSelectFood(item)}
                          className="py-2.5 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 rounded-xl px-2 -mx-2 transition-colors cursor-pointer group"
                        >
                          <div>
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 capitalize block group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                              {item.food_name}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {item.quantity} {item.unit}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-slate-900 dark:text-white block">
                              {item.nutrients?.calories ? `${Math.round(item.nutrients.calories)} kcal` : '—'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {item.nutrients?.protein ? `${item.nutrients.protein}g P` : ''}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nutrition Trends & Recent Labs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Nutrition Trends (Recharts) */}
        <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Nutrition Trends
              </h3>
              <p className="text-xs text-slate-400">
                Daily calorie intake across recent logs
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('history')}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center"
            >
              <span>View History</span>
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          {trends.length < 2 ? (
            <EmptyState
              icon={TrendingUp}
              title="Not enough data for a trend yet."
              description="Keep logging to build your history."
              className="py-12"
            />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={formatDate} />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="p-3 bg-slate-900 text-white rounded-xl shadow-lg text-xs space-y-1">
                            <p className="font-semibold text-slate-300">{formatDate(d.date)}</p>
                            <p className="font-bold text-emerald-400">{d.total_calories} kcal</p>
                            <p className="text-slate-400">Protein: {d.total_protein}g • Fiber: {d.total_fiber}g</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="total_calories" fill="#059669" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Recent Lab Results */}
        <div className="lg:col-span-5 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Recent Lab Results
                </h3>
                <p className="text-xs text-slate-400">
                  Extracted biomarkers linked to original reports
                </p>
              </div>
              <button
                onClick={() => onNavigateToTab('lab-history')}
                className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center"
              >
                <span>All Tests</span>
                <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>

            {recent_labs.length === 0 ? (
              <EmptyState
                icon={FileSpreadsheet}
                title="No lab reports uploaded yet."
                description="Upload a report to begin tracking your results."
                actionLabel="Upload Report"
                onAction={onOpenLabModal}
                className="py-10"
              />
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                {recent_labs.slice(0, 5).map((lab) => (
                  <div key={lab.id} className="py-3 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        {lab.test_name}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {formatDate(lab.test_date)}
                        {lab.reference_range && ` • Ref: ${lab.reference_range}`}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {lab.value}{' '}
                        <span className="text-xs font-medium text-slate-500">{lab.unit}</span>
                      </span>
                      {lab.is_flagged_for_review && (
                        <span className="block text-[10px] text-amber-600 font-semibold">
                          Flagged
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Insights Section (Section 16: Only show if supported by actual stored data!) */}
      {insights.length > 0 && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-200/60 dark:border-emerald-800/40">
          <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Data-Backed Observations</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            {insights.map((insight, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-xs"
              >
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                  {insight.title}
                </h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {insight.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
