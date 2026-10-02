'use client';

import React from 'react';

interface MacroProgressBarProps {
  label: string;
  consumed: number;
  target?: number;
  unit: string;
  color?: 'emerald' | 'teal' | 'amber' | 'blue';
  targetLabel?: string;
}

export const MacroProgressBar: React.FC<MacroProgressBarProps> = ({
  label,
  consumed,
  target,
  unit,
  color = 'emerald',
  targetLabel = 'Calculated Target'
}) => {
  const percentage = target && target > 0 ? Math.min(Math.round((consumed / target) * 100), 100) : 0;
  
  const colorMap = {
    emerald: 'bg-emerald-600 dark:bg-emerald-500',
    teal: 'bg-teal-600 dark:bg-teal-500',
    amber: 'bg-amber-600 dark:bg-amber-500',
    blue: 'bg-sky-600 dark:bg-sky-500'
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </span>
        {target ? (
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
            {targetLabel}: {target.toLocaleString()} {unit}
          </span>
        ) : (
          <span className="text-[11px] text-slate-400">Target not set</span>
        )}
      </div>

      <div className="flex items-baseline space-x-1.5 mb-3">
        <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {consumed.toLocaleString()}
        </span>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {unit}
        </span>
        {target && (
          <span className="text-xs text-slate-400 ml-auto font-medium">
            {percentage}%
          </span>
        )}
      </div>

      {target && target > 0 ? (
        <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${colorMap[color]}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      ) : (
        <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full" />
      )}
    </div>
  );
};
