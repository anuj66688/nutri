'use client';

import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';
import { api } from '@/lib/api';
import { FoodLog } from '@/types';
import { EmptyState } from './EmptyState';
import { formatDate } from '@/lib/utils';

interface FoodLogViewProps {
  onOpenFoodModal: () => void;
  onSelectFood: (food: FoodLog) => void;
}

export const FoodLogView: React.FC<FoodLogViewProps> = ({
  onOpenFoodModal,
  onSelectFood
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const items = await api.getFoodLogs(selectedDate);
      setLogs(items);
    } catch (e) {
      console.warn('Failed to load food logs:', e);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedDate]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.deleteFoodLog(id);
      fetchLogs();
    } catch (e) {
      alert('Failed to remove food log item.');
    }
  };

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Group by meal_type
  const mealsByType: Record<string, FoodLog[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: []
  };

  let dayCalories = 0;
  let dayProtein = 0;
  let dayCarbs = 0;
  let dayFat = 0;
  let dayFiber = 0;

  logs.forEach((item) => {
    const type = item.meal_type.toLowerCase();
    if (mealsByType[type]) {
      mealsByType[type].push(item);
    } else {
      mealsByType.snack.push(item);
    }

    if (item.nutrients) {
      dayCalories += item.nutrients.calories || 0;
      dayProtein += item.nutrients.protein || 0;
      dayCarbs += item.nutrients.carbohydrates || 0;
      dayFat += item.nutrients.fat || 0;
      dayFiber += item.nutrients.fiber || 0;
    }
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header with Date Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Food & Nutrition Log
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Grounded in USDA FoodData Central nutritional facts
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Date Picker Controls */}
          <div className="flex items-center space-x-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-1 shadow-2xs">
            <button
              onClick={handlePrevDay}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2 py-1 text-xs font-semibold bg-transparent border-0 text-slate-800 dark:text-white focus:outline-none"
            />
            <button
              onClick={handleNextDay}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onOpenFoodModal}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log Food</span>
          </button>
        </div>
      </div>

      {/* Daily Aggregate Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-xs text-xs">
        <div>
          <span className="text-[11px] text-slate-400 block font-medium">Day's Energy</span>
          <span className="text-lg font-bold text-slate-900 dark:text-white">
            {Math.round(dayCalories)} kcal
          </span>
        </div>
        <div>
          <span className="text-[11px] text-slate-400 block font-medium">Protein</span>
          <span className="text-lg font-bold text-slate-900 dark:text-white">
            {Math.round(dayProtein)} g
          </span>
        </div>
        <div>
          <span className="text-[11px] text-slate-400 block font-medium">Carbohydrates</span>
          <span className="text-lg font-bold text-slate-900 dark:text-white">
            {Math.round(dayCarbs)} g
          </span>
        </div>
        <div>
          <span className="text-[11px] text-slate-400 block font-medium">Fat</span>
          <span className="text-lg font-bold text-slate-900 dark:text-white">
            {Math.round(dayFat)} g
          </span>
        </div>
        <div>
          <span className="text-[11px] text-slate-400 block font-medium">Fiber</span>
          <span className="text-lg font-bold text-slate-900 dark:text-white">
            {Math.round(dayFiber)} g
          </span>
        </div>
      </div>

      {/* Meal Lists */}
      {logs.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="No meals logged yet."
          description={`Start by adding your first meal for ${formatDate(selectedDate)}.`}
          actionLabel="Log a Meal"
          onAction={onOpenFoodModal}
          className="py-16"
        />
      ) : (
        <div className="space-y-6">
          {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((mealType) => {
            const items = mealsByType[mealType];
            if (items.length === 0) return null;

            return (
              <div
                key={mealType}
                className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-xs"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 capitalize">
                    {mealType} ({items.length})
                  </h3>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onSelectFood(item)}
                      className="py-3.5 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 rounded-2xl px-3 -mx-3 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                          <UtensilsCrossed className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white capitalize group-hover:text-emerald-700 transition-colors">
                              {item.food_name}
                            </span>
                            {item.is_estimate && (
                              <span className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full font-medium">
                                Approximate
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400">
                            {item.quantity} {item.unit}
                            {item.time && ` • ${item.time.slice(0, 5)}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <span className="text-sm font-bold text-slate-900 dark:text-white block">
                            {item.nutrients?.calories ? `${Math.round(item.nutrients.calories)} kcal` : '—'}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {item.nutrients?.protein ? `${item.nutrients.protein}g protein` : ''}
                          </span>
                        </div>

                        <button
                          onClick={(e) => handleDelete(e, item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
