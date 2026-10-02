'use client';

import React, { useState } from 'react';
import { X, Sparkles, Plus, AlertCircle, Loader2, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { MealType, FoodItemParsed } from '@/types';

interface FoodLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFoodLogged: () => void;
  defaultMealType?: MealType;
}

export const FoodLogModal: React.FC<FoodLogModalProps> = ({
  isOpen,
  onClose,
  onFoodLogged,
  defaultMealType = 'lunch'
}) => {
  const [naturalText, setNaturalText] = useState('');
  const [mealType, setMealType] = useState<MealType>(defaultMealType);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [parsedItems, setParsedItems] = useState<FoodItemParsed[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!naturalText.trim()) return;

    setIsParsing(true);
    setError(null);
    try {
      const items = await api.parseFoodText(naturalText, mealType);
      setParsedItems(items);
    } catch (err: any) {
      setError(err.message || 'Failed to parse food intake. Please try again.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleUpdateItem = (index: number, field: keyof FoodItemParsed, value: any) => {
    setParsedItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      if (field === 'quantity' && value) {
        copy[index].is_quantity_missing = false;
        copy[index].clarification_needed = null;
      }
      return copy;
    });
  };

  const handleConfirmAndSave = async () => {
    // Check if any items have missing quantity
    const missingQtyItem = parsedItems.find((item) => item.is_quantity_missing || !item.quantity);
    if (missingQtyItem) {
      setError(`Please specify a quantity for "${missingQtyItem.food_name}" to calculate accurate nutritional data.`);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      for (const item of parsedItems) {
        await api.logFood({
          food_name: item.food_name,
          quantity: item.quantity || 1,
          unit: item.unit,
          meal_type: item.meal_type || mealType,
          raw_query: naturalText,
          is_estimate: item.is_estimate,
          nutrients: item.nutrients || undefined
        });
      }
      onFoodLogged();
      onClose();
      // Reset
      setNaturalText('');
      setParsedItems([]);
    } catch (err: any) {
      setError(err.message || 'Error saving food items.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Log Your Food
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Natural language entry with structured USDA nutritional calculations
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Natural Text Input Form */}
          <form onSubmit={handleParse} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                What did you eat?
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={naturalText}
                  onChange={(e) => setNaturalText(e.target.value)}
                  placeholder="e.g. 2 rotis, dal and curd OR 200g grilled chicken"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
                  autoFocus
                />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {['2 rotis, dal and curd', 'I ate 2 eggs', 'One plate chicken biryani', '200 grams grilled chicken'].map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setNaturalText(example)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/50 transition-colors"
                  >
                    "{example}"
                  </button>
                ))}
              </div>
            </div>

            {/* Meal Type Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Meal Category
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setMealType(type)}
                    className={`py-2 text-xs font-medium rounded-xl capitalize transition-all border ${
                      mealType === type
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-zinc-700 hover:border-slate-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isParsing || !naturalText.trim()}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isParsing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Calculating nutritional information...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Parse Food & Look up USDA Nutrients</span>
                </>
              )}
            </button>
          </form>

          {/* Parsed Items Review List */}
          {parsedItems.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Recognized Items ({parsedItems.length})
                </span>
                <span className="text-[11px] text-slate-400">Verify details below</span>
              </div>

              {parsedItems.map((item, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-2xl border transition-all ${
                    item.is_quantity_missing
                      ? 'border-amber-300 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/20'
                      : 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white capitalize">
                        {item.food_name}
                      </h4>
                      {item.clarification_needed && (
                        <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium mt-0.5">
                          ⚠️ {item.clarification_needed}
                        </p>
                      )}
                    </div>
                    {item.nutrients?.calories && (
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        {Math.round(item.nutrients.calories)} kcal
                      </span>
                    )}
                  </div>

                  {/* Quantity & Unit inputs */}
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <label className="text-[10px] text-slate-400 font-medium block mb-0.5">Quantity</label>
                      <input
                        type="number"
                        step="any"
                        value={item.quantity ?? ''}
                        onChange={(e) => handleUpdateItem(index, 'quantity', parseFloat(e.target.value) || null)}
                        placeholder="e.g. 2 or 150"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-medium block mb-0.5">Unit</label>
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => handleUpdateItem(index, 'unit', e.target.value)}
                        placeholder="e.g. pieces, grams, cup"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {item.nutrients && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/50 dark:border-zinc-700/50 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Protein: <strong className="text-slate-800 dark:text-slate-200">{item.nutrients.protein ?? 'N/A'}g</strong></span>
                      <span>Carbs: <strong className="text-slate-800 dark:text-slate-200">{item.nutrients.carbohydrates ?? 'N/A'}g</strong></span>
                      <span>Fat: <strong className="text-slate-800 dark:text-slate-200">{item.nutrients.fat ?? 'N/A'}g</strong></span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {parsedItems.length > 0 && (
          <div className="p-4 bg-slate-50 dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmAndSave}
              disabled={isSaving}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl flex items-center space-x-1.5 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Food Entries</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
