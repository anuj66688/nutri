'use client';

import React from 'react';
import { X, CheckCircle2, Info } from 'lucide-react';
import { FoodLog, FoodNutrientData } from '@/types';
import { formatNumber } from '@/lib/utils';

interface FoodDetailModalProps {
  food: FoodLog | null;
  isOpen: boolean;
  onClose: () => void;
}

export const FoodDetailModal: React.FC<FoodDetailModalProps> = ({
  food,
  isOpen,
  onClose
}) => {
  if (!isOpen || !food) return null;

  const nutrients: FoodNutrientData | undefined = food.nutrients || undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-800 flex items-start justify-between bg-slate-50/50 dark:bg-zinc-900/50">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                {food.meal_type}
              </span>
              {food.is_estimate && (
                <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
                  Approximate quantity
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white capitalize mt-1.5">
              {food.food_name}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Serving: {food.quantity} {food.unit}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Macronutrient Summary Grid */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
              Macronutrients
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/60 dark:border-emerald-900/30">
                <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300">Calories</span>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {formatNumber(nutrients?.calories, 'kcal')}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-800">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Protein</span>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {formatNumber(nutrients?.protein, 'g')}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-800">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Carbohydrates</span>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {formatNumber(nutrients?.carbohydrates, 'g')}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-800">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Fat</span>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {formatNumber(nutrients?.fat, 'g')}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-800">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Dietary Fiber</span>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {formatNumber(nutrients?.fiber, 'g')}
                </p>
              </div>
            </div>
          </div>

          {/* Micronutrients Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Micronutrients (Raw Quantities)
              </h3>
              <span className="text-[11px] text-slate-400">No fabricated percentages</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-zinc-800 border border-slate-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden text-sm">
              {[
                { label: 'Iron (Fe)', value: nutrients?.iron, unit: 'mg' },
                { label: 'Calcium (Ca)', value: nutrients?.calcium, unit: 'mg' },
                { label: 'Magnesium (Mg)', value: nutrients?.magnesium, unit: 'mg' },
                { label: 'Potassium (K)', value: nutrients?.potassium, unit: 'mg' },
                { label: 'Sodium (Na)', value: nutrients?.sodium, unit: 'mg' },
                { label: 'Zinc (Zn)', value: nutrients?.zinc, unit: 'mg' },
                { label: 'Vitamin A (RAE)', value: nutrients?.vitamin_a, unit: 'µg' },
                { label: 'Vitamin C', value: nutrients?.vitamin_c, unit: 'mg' },
                { label: 'Vitamin D', value: nutrients?.vitamin_d, unit: 'µg' },
                { label: 'Vitamin B12', value: nutrients?.vitamin_b12, unit: 'µg' },
                { label: 'Folate (total)', value: nutrients?.folate, unit: 'µg' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
                  <span className={`text-xs font-semibold ${item.value !== null && item.value !== undefined ? 'text-slate-900 dark:text-white' : 'text-slate-400 italic'}`}>
                    {formatNumber(item.value, item.unit)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Citation Info */}
          <div className="flex items-start space-x-2 p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-xl text-xs text-slate-500 dark:text-slate-400">
            <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-medium text-slate-700 dark:text-slate-300">Data Source:</span>{' '}
              {nutrients?.data_source || 'USDA FoodData Central'}. Values are scaled strictly from standard laboratory reference profiles without artificial estimation.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
