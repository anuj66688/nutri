'use client';

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceArea
} from 'recharts';
import { LabValue } from '@/types';
import { formatDate } from '@/lib/utils';
import { Activity, AlertCircle } from 'lucide-react';

interface LabTrendChartProps {
  markerName: string;
  data: LabValue[];
}

export const LabTrendChart: React.FC<LabTrendChartProps> = ({
  markerName,
  data
}) => {
  // Sort data by test_date ascending
  const sortedData = [...data].sort((a, b) => new Date(a.test_date).getTime() - new Date(b.test_date).getTime());

  if (sortedData.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs">
        No laboratory records available for this marker.
      </div>
    );
  }

  // Section 6 rule: If only one measurement, DO NOT create a misleading trend line!
  if (sortedData.length === 1) {
    const single = sortedData[0];
    return (
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30">
        <div className="flex items-center space-x-2 text-slate-500 text-xs mb-3">
          <Activity className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold uppercase tracking-wider">{markerName}</span>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {single.value}
          </span>
          <span className="text-sm font-semibold text-slate-500">
            {single.unit}
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-500">
          Recorded on {formatDate(single.test_date)}
          {single.reference_range && ` • Reference Range: ${single.reference_range}`}
        </div>
        <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 flex items-center space-x-2 text-xs text-amber-800 dark:text-amber-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Single measurement recorded. Additional tests are needed to establish a longitudinal trend line.</span>
        </div>
      </div>
    );
  }

  const chartData = sortedData.map((d) => ({
    date: formatDate(d.test_date),
    value: d.value,
    unit: d.unit,
    ref: d.reference_range || null
  }));

  const latest = sortedData[sortedData.length - 1];

  return (
    <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 pb-4 border-b border-slate-100 dark:border-zinc-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Laboratory Trend
            </span>
            {latest.reference_range && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400">
                Ref: {latest.reference_range} {latest.unit}
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {markerName}
          </h3>
        </div>

        <div className="mt-2 sm:mt-0 text-left sm:text-right">
          <span className="text-2xl font-black text-slate-900 dark:text-white">
            {latest.value}{' '}
            <span className="text-xs font-medium text-slate-500">{latest.unit}</span>
          </span>
          <span className="block text-[11px] text-slate-400">
            Latest: {formatDate(latest.test_date)} ({sortedData.length} records)
          </span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" domain={['auto', 'auto']} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const p = payload[0].payload;
                  return (
                    <div className="p-3 bg-slate-900 text-white rounded-xl shadow-lg text-xs space-y-1">
                      <p className="font-semibold text-slate-300">{p.date}</p>
                      <p className="font-bold text-sm text-emerald-400">
                        {p.value} {p.unit}
                      </p>
                      {p.ref && <p className="text-[10px] text-slate-400">Ref: {p.ref}</p>}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#059669"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#059669', strokeWidth: 2, stroke: '#ffffff' }}
              activeDot={{ r: 6, fill: '#047857' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
