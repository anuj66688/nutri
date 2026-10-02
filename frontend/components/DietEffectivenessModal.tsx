'use client';

import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, TrendingUp, Scale, Activity, ShieldCheck, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { DietAnalysis } from '@/types';

interface DietEffectivenessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DietEffectivenessModal: React.FC<DietEffectivenessModalProps> = ({
  isOpen,
  onClose
}) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<DietAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.analyzeDietEffectiveness();
      setAnalysis(res);
    } catch (err: any) {
      setError(err.message || 'Unable to complete diet effectiveness analysis.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-emerald-50/30 dark:bg-emerald-950/20">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                "Is My Diet Working?"
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Longitudinal evaluation across food intake, body metrics, and lab tests
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!analysis && !loading && (
            <div className="text-center py-8 px-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-2">
                Analyze Longitudinal Impact
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                Our clinical intelligence engine will cross-examine your recorded nutritional intake, weight changes, and laboratory reports to evaluate whether your current eating pattern is meeting your goals.
              </p>
              <button
                onClick={handleRunAnalysis}
                className="px-6 py-3 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-all flex items-center space-x-2 mx-auto cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Evaluate My Current Eating Pattern</span>
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Analyzing your longitudinal nutrition & health data...
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Comparing calorie trends, protein intake, and laboratory markers
              </p>
            </div>
          )}

          {analysis && !loading && (
            <div className="space-y-6">
              {/* Category 1: Observed Data */}
              <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 p-4 bg-slate-50/50 dark:bg-zinc-800/30">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 block mb-2">
                  1. Observed Historical Data
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/60 dark:border-zinc-800">
                    <span className="text-slate-400 block text-[11px]">Days Logged</span>
                    <strong className="text-slate-800 dark:text-slate-100 text-sm">
                      {analysis.observed_data.days_logged} days
                    </strong>
                  </div>
                  <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/60 dark:border-zinc-800">
                    <span className="text-slate-400 block text-[11px]">Weight Change</span>
                    <strong className="text-slate-800 dark:text-slate-100 text-sm">
                      {analysis.observed_data.weight_change_kg !== null
                        ? `${analysis.observed_data.weight_change_kg > 0 ? '+' : ''}${analysis.observed_data.weight_change_kg} kg`
                        : 'Insufficient data'}
                    </strong>
                  </div>
                  <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/60 dark:border-zinc-800">
                    <span className="text-slate-400 block text-[11px]">Lab Tests</span>
                    <strong className="text-slate-800 dark:text-slate-100 text-sm">
                      {analysis.observed_data.lab_markers_recorded} records
                    </strong>
                  </div>
                  <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/60 dark:border-zinc-800">
                    <span className="text-slate-400 block text-[11px]">Measurements</span>
                    <strong className="text-slate-800 dark:text-slate-100 text-sm">
                      {analysis.observed_data.body_measurements_recorded} logged
                    </strong>
                  </div>
                </div>
              </div>

              {/* Category 2: Calculated Metrics */}
              <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 p-4 bg-slate-50/50 dark:bg-zinc-800/30">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                  2. Calculated Values
                </span>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/60 dark:border-zinc-800">
                    <span className="text-slate-400 block text-[11px]">Average Calories</span>
                    <strong className="text-slate-800 dark:text-slate-100 text-sm">
                      {typeof analysis.calculated_metrics.average_calories === 'number'
                        ? `${analysis.calculated_metrics.average_calories} kcal/day`
                        : analysis.calculated_metrics.average_calories}
                    </strong>
                  </div>
                  <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/60 dark:border-zinc-800">
                    <span className="text-slate-400 block text-[11px]">Average Protein</span>
                    <strong className="text-slate-800 dark:text-slate-100 text-sm">
                      {typeof analysis.calculated_metrics.average_protein_g === 'number'
                        ? `${analysis.calculated_metrics.average_protein_g} g/day`
                        : analysis.calculated_metrics.average_protein_g}
                    </strong>
                  </div>
                  <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/60 dark:border-zinc-800">
                    <span className="text-slate-400 block text-[11px]">Average Fiber</span>
                    <strong className="text-slate-800 dark:text-slate-100 text-sm">
                      {typeof analysis.calculated_metrics.average_fiber_g === 'number'
                        ? `${analysis.calculated_metrics.average_fiber_g} g/day`
                        : analysis.calculated_metrics.average_fiber_g}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Category 3: AI Interpretation */}
              <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/40 p-5 bg-white dark:bg-zinc-900">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block mb-2">
                  3. Clinical AI Interpretation
                </span>
                <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {analysis.ai_interpretation}
                </div>
              </div>

              {/* Mandatory Causation & Medical Disclaimer (Section 12 requirement) */}
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/30 flex items-start space-x-2.5 text-xs text-amber-800 dark:text-amber-300">
                <ShieldCheck className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                <div className="leading-snug">
                  <span className="font-bold block mb-0.5">Correlation Disclaimer</span>
                  {analysis.disclaimer}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {analysis && (
          <div className="p-4 bg-slate-50 dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800 flex justify-end space-x-2">
            <button
              onClick={handleRunAnalysis}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl"
            >
              Re-evaluate
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
