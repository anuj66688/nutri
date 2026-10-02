'use client';

import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  FileText,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { api } from '@/lib/api';
import { LabReport } from '@/types';
import { EmptyState } from './EmptyState';
import { formatDate } from '@/lib/utils';

interface LabReportsViewProps {
  onOpenUploadModal: () => void;
}

export const LabReportsView: React.FC<LabReportsViewProps> = ({
  onOpenUploadModal
}) => {
  const [reports, setReports] = useState<LabReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await api.getLabReports();
      setReports(data);
      if (data.length > 0 && !expandedReportId) {
        setExpandedReportId(data[0].id);
      }
    } catch (e) {
      console.warn("Failed to load reports:", e);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedReportId(expandedReportId === id ? null : id);
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Laboratory Reports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Uploaded clinical reports, preserved originals, and extracted biomarker values
          </p>
        </div>

        <button
          onClick={onOpenUploadModal}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors shadow-xs cursor-pointer"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Lab Report</span>
        </button>
      </div>

      {reports.length === 0 ? (
        <EmptyState
          icon={FileSpreadsheet}
          title="No lab reports uploaded yet."
          description="Upload a report to begin tracking your results."
          actionLabel="Upload First Report"
          onAction={onOpenUploadModal}
          className="py-16"
        />
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const isExpanded = expandedReportId === report.id;
            return (
              <div
                key={report.id}
                className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs transition-all"
              >
                {/* Report Card Header */}
                <div
                  onClick={() => toggleExpand(report.id)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {report.file_name}
                      </h3>
                      <div className="flex items-center space-x-3 text-xs text-slate-400 mt-0.5">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatDate(report.report_date || report.created_at || '')}</span>
                        </span>
                        <span>•</span>
                        <span>{report.values.length} tests extracted</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                      {report.status}
                    </span>
                    <button className="text-slate-400">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Extracted Tests */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/30 dark:bg-zinc-900/30">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
                      Extracted Laboratory Measurements ({report.values.length})
                    </span>

                    {report.values.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-2">
                        No structured laboratory test values recognized in this document.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {report.values.map((v) => (
                          <div
                            key={v.id}
                            className="p-3.5 rounded-2xl bg-white dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60 text-xs flex flex-col justify-between"
                          >
                            <div className="flex items-start justify-between">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {v.test_name}
                              </span>
                              {v.is_flagged_for_review && (
                                <span className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded-md font-semibold">
                                  Review
                                </span>
                              )}
                            </div>

                            <div className="my-2">
                              <span className="text-lg font-bold text-slate-900 dark:text-white">
                                {v.value}{' '}
                                <span className="text-xs font-medium text-slate-500">{v.unit}</span>
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-400 border-t border-slate-100 dark:border-zinc-700/50 pt-2 flex items-center justify-between">
                              <span>Ref: {v.reference_range || 'Not provided'}</span>
                              <span>{formatDate(v.test_date)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
