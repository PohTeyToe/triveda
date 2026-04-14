/**
 * ReportCard -- history list item for a blood work report.
 * Shows vendor badge, file name, date, biomarker count, status, and delete button.
 */

import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useBloodWorkDelete } from '../../hooks/useBloodWorkDelete';
import type { BloodWorkReportSummary } from '../../lib/types';

interface ReportCardProps {
  report: BloodWorkReportSummary;
}

const VENDOR_COLORS: Record<string, string> = {
  lifelabs: 'bg-blue-500/20 text-blue-400',
  quest: 'bg-emerald-500/20 text-emerald-400',
  labcorp: 'bg-purple-500/20 text-purple-400',
  ahs: 'bg-teal-500/20 text-teal-400',
  unknown: 'bg-light/10 text-light/50',
};

const STATUS_COLORS: Record<string, string> = {
  complete: 'bg-emerald-500/15 text-emerald-400',
  processing: 'bg-amber-500/15 text-amber-400',
  pending: 'bg-light/10 text-light/40',
  failed: 'bg-red-500/15 text-red-400',
};

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function ReportCard({ report }: ReportCardProps) {
  const navigate = useNavigate();
  const deleteMutation = useBloodWorkDelete();
  const [showConfirm, setShowConfirm] = useState(false);

  const vendorLabel = report.vendor ?? 'unknown';
  const vendorClass = VENDOR_COLORS[vendorLabel] ?? VENDOR_COLORS.unknown;
  const statusClass = STATUS_COLORS[report.status] ?? STATUS_COLORS.pending;

  const handleCardClick = () => {
    if (report.status === 'complete') {
      navigate({ to: '/blood-work', search: { view: '', report: report.id } });
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(true);
  };

  const confirmDelete = () => {
    deleteMutation.mutate(report.id);
    setShowConfirm(false);
  };

  return (
    <>
      <div
        className={`
          flex items-center gap-3 p-3 rounded-xl
          bg-white dark:bg-dark-surface border border-dark-border/30 dark:border-dark-border
          ${report.status === 'complete' ? 'cursor-pointer hover:border-teal-500/30' : ''}
          transition-colors
        `}
        onClick={handleCardClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleCardClick();
        }}
        tabIndex={report.status === 'complete' ? 0 : -1}
        role={report.status === 'complete' ? 'button' : undefined}
      >
        {/* Vendor badge */}
        <span
          className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${vendorClass}`}
        >
          {vendorLabel}
        </span>

        {/* File info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-light/80 dark:text-light/80 truncate">{report.fileName}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-light/40 dark:text-light/40">
              {formatDate(report.uploadedAt)}
            </span>
            {report.biomarkerCount > 0 && (
              <span className="text-xs text-light/30 dark:text-light/30">
                {report.biomarkerCount} biomarkers
              </span>
            )}
          </div>
        </div>

        {/* Status + delete */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusClass}`}>
            {report.status}
          </span>

          <button
            type="button"
            onClick={handleDelete}
            className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
            aria-label="Delete report"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4 text-light/30 hover:text-red-400"
              aria-hidden="true"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              <line x1="10" x2="10" y1="11" y2="17" />
              <line x1="14" x2="14" y1="11" y2="17" />
            </svg>
          </button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowConfirm(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setShowConfirm(false);
          }}
        >
          <div
            className="bg-white dark:bg-dark-elevated border border-dark-border rounded-xl p-6 max-w-sm mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-light/90 dark:text-light/90 mb-2">
              Delete Lab Report
            </h3>
            <p className="text-sm text-light/60 dark:text-light/60 mb-6">
              This will permanently delete this report, all extracted biomarkers, and the uploaded
              file. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm rounded-lg border border-dark-border/50 dark:border-dark-border text-light/60 hover:text-light/80 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 text-sm rounded-lg bg-red-500 text-cream hover:bg-red-600 transition-colors"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
