'use client';

import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { LabReport } from '@/types';

interface LabUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportUploaded: () => void;
}

export const LabUploadModal: React.FC<LabUploadModalProps> = ({
  isOpen,
  onClose,
  onReportUploaded
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [reportDate, setReportDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState<'idle' | 'reading' | 'extracting'>('idle');
  const [processedReport, setProcessedReport] = useState<LabReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|jpe?g|png)$/i)) {
        setError('Unsupported file type. Please upload a PDF, JPG, JPEG, or PNG document.');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadStage('reading');
    setError(null);

    try {
      setTimeout(() => {
        setUploadStage('extracting');
      }, 1200);

      const report = await api.uploadLabReport(selectedFile, reportDate);
      setProcessedReport(report);
      onReportUploaded();
    } catch (err: any) {
      setError(err.message || 'Unable to analyze this report. Please try uploading a clearer image or PDF.');
    } finally {
      setIsUploading(false);
      setUploadStage('idle');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Upload Laboratory Report
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              PDF, JPG, JPEG, or PNG clinical test documents
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
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!processedReport ? (
            <div className="space-y-4">
              {/* Drop area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 dark:border-zinc-700 hover:border-emerald-600/50 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-zinc-800/30"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/*"
                  className="hidden"
                />
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                {selectedFile ? (
                  <div>
                    <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 block">
                      {selectedFile.name}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Click to replace
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Click to choose laboratory file or drag & drop
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Supported: PDF, JPG, PNG (Max 20MB)
                    </span>
                  </div>
                )}
              </div>

              {/* Report Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Report Collection Date
                </label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Upload & Parse Action */}
              <button
                type="button"
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>
                      {uploadStage === 'reading'
                        ? 'Reading your report...'
                        : 'Extracting structured measurements...'}
                    </span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>Upload & Process Report</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Results Screen */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 flex items-center space-x-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <div>
                  <h3 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    Report Processed Successfully
                  </h3>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                    Extracted {processedReport.values.length} standardized laboratory measurements.
                  </p>
                </div>
              </div>

              {/* Extracted values */}
              <div className="divide-y divide-slate-100 dark:divide-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden text-xs">
                {processedReport.values.length === 0 ? (
                  <div className="p-4 text-center text-slate-500">
                    No clear laboratory test values could be automatically recognized in this document.
                  </div>
                ) : (
                  processedReport.values.map((val, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {val.test_name}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Reference: {val.reference_range ? val.reference_range : 'Not provided in report'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {val.value} {val.unit}
                        </span>
                        {val.is_flagged_for_review && (
                          <span className="block text-[10px] text-amber-600 font-medium">
                            Flagged for review
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
