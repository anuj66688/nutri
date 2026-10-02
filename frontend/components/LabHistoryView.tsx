'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Activity, Search, FileSpreadsheet, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { LabValue } from '@/types';
import { LabTrendChart } from './LabTrendChart';
import { EmptyState } from './EmptyState';

interface LabHistoryViewProps {
  onOpenUploadModal: () => void;
}

export const LabHistoryView: React.FC<LabHistoryViewProps> = ({
  onOpenUploadModal
}) => {
  const [markers, setMarkers] = useState<string[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [markerValues, setMarkerValues] = useState<LabValue[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMarkers();
  }, []);

  const fetchMarkers = async () => {
    try {
      const list = await api.getLabMarkers();
      setMarkers(list);
      if (list.length > 0 && !selectedMarker) {
        selectMarker(list[0]);
      }
    } catch (e) {
      console.warn("Failed to load markers:", e);
    }
  };

  const selectMarker = async (markerName: string) => {
    setSelectedMarker(markerName);
    setLoading(true);
    try {
      const values = await api.getLabValues(markerName);
      setMarkerValues(values);
    } catch {
      setMarkerValues([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMarkers = markers.filter((m) =>
    m.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Biomarker Laboratory History
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Longitudinal clinical trends and reference range analysis
          </p>
        </div>

        <button
          onClick={onOpenUploadModal}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Lab Report</span>
        </button>
      </div>

      {markers.length === 0 ? (
        <EmptyState
          icon={FileSpreadsheet}
          title="No laboratory records available."
          description="Upload clinical lab reports to begin tracking your biomarker trends over time."
          actionLabel="Upload First Report"
          onAction={onOpenUploadModal}
          className="py-16"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Marker Selector List */}
          <div className="lg:col-span-4 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-xs flex flex-col max-h-[600px]">
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search biomarkers (e.g. B12, Iron)..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {filteredMarkers.map((marker) => (
                <button
                  key={marker}
                  onClick={() => selectMarker(marker)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                    selectedMarker === marker
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold border border-emerald-200/70 dark:border-emerald-800/50'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-800/40'
                  }`}
                >
                  <span className="truncate">{marker}</span>
                  <Activity className="w-3.5 h-3.5 opacity-50 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>

          {/* Marker Trend Graph View */}
          <div className="lg:col-span-8">
            {selectedMarker ? (
              <LabTrendChart markerName={selectedMarker} data={markerValues} />
            ) : (
              <div className="p-12 text-center text-xs text-slate-400 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800">
                Select a biomarker from the left to view historical measurements.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
