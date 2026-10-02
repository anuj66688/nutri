'use client';

import React, { useState, useEffect } from 'react';
import {
  History,
  Scale,
  UtensilsCrossed,
  FileSpreadsheet,
  Sparkles,
  Calendar,
  Clock
} from 'lucide-react';
import { api } from '@/lib/api';
import { BodyMeasurement, FoodLog, LabValue } from '@/types';
import { formatDate } from '@/lib/utils';
import { EmptyState } from './EmptyState';

type HistoryCategory = 'all' | 'body' | 'food' | 'laboratory' | 'insights';

export const PersonalHistoryView: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<HistoryCategory>('all');
  const [data, setData] = useState<{
    body: BodyMeasurement[];
    food: FoodLog[];
    laboratory: LabValue[];
    insights: any[];
  }>({
    body: [],
    food: [],
    laboratory: [],
    insights: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.getHistory();
      setData(res);
    } catch (e) {
      console.warn("Failed to load history:", e);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all' as HistoryCategory, label: 'All History', icon: History },
    { id: 'body' as HistoryCategory, label: 'Body Metrics', icon: Scale },
    { id: 'food' as HistoryCategory, label: 'Food Intake', icon: UtensilsCrossed },
    { id: 'laboratory' as HistoryCategory, label: 'Lab Biomarkers', icon: FileSpreadsheet },
    { id: 'insights' as HistoryCategory, label: 'AI Observations', icon: Sparkles }
  ];

  const hasAnyData =
    data.body.length > 0 ||
    data.food.length > 0 ||
    data.laboratory.length > 0 ||
    data.insights.length > 0;

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Personal History
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Chronological record across physical measurements, nutrition, and laboratory biomarkers
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-zinc-800 hover:border-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {!hasAnyData ? (
        <EmptyState
          icon={History}
          title="No history recorded yet."
          description="As you log meals, body measurements, and lab reports, your longitudinal timeline will appear here."
          className="py-16"
        />
      ) : (
        <div className="space-y-6">
          {/* Body Measurements Section */}
          {(activeCategory === 'all' || activeCategory === 'body') && data.body.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/80 dark:border-zinc-800 p-6 shadow-xs">
              <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-slate-100 dark:border-zinc-800">
                <Scale className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Body Measurements History ({data.body.length})
                </h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                {data.body.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Weight: {item.weight} kg
                      </span>
                      {item.waist && (
                        <span className="text-slate-400 ml-2">• Waist: {item.waist} cm</span>
                      )}
                      {item.notes && (
                        <span className="block text-[11px] text-slate-400 mt-0.5">{item.notes}</span>
                      )}
                    </div>
                    <span className="text-slate-400 font-medium">
                      {formatDate(item.recorded_date)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Food History Section */}
          {(activeCategory === 'all' || activeCategory === 'food') && data.food.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/80 dark:border-zinc-800 p-6 shadow-xs">
              <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-slate-100 dark:border-zinc-800">
                <UtensilsCrossed className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Food Records History ({data.food.length})
                </h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                {data.food.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                        {item.food_name}
                      </span>
                      <span className="text-slate-400 ml-2">
                        ({item.quantity} {item.unit}) • {item.meal_type}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {item.nutrients?.calories ? `${Math.round(item.nutrients.calories)} kcal` : '—'}
                      </span>
                      <span className="block text-[11px] text-slate-400">
                        {formatDate(item.date)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lab Markers Section */}
          {(activeCategory === 'all' || activeCategory === 'laboratory') && data.laboratory.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/80 dark:border-zinc-800 p-6 shadow-xs">
              <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-slate-100 dark:border-zinc-800">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Laboratory Test Results ({data.laboratory.length})
                </h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                {data.laboratory.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {item.test_name}
                      </span>
                      {item.reference_range && (
                        <span className="text-slate-400 ml-2">• Ref: {item.reference_range}</span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {item.value} {item.unit}
                      </span>
                      <span className="block text-[11px] text-slate-400">
                        {formatDate(item.test_date)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
