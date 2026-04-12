/**
 * BloodWorkResultsScreen -- full report view with biomarker table.
 * Shows report metadata and all extracted biomarkers with tradition context.
 */

import { Link } from '@tanstack/react-router';
import { useBloodWorkReport } from '../../hooks/useBloodWorkReport';
import { BiomarkerTable } from './BiomarkerTable';

interface BloodWorkResultsScreenProps {
  reportId: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function BloodWorkResultsScreen({ reportId }: BloodWorkResultsScreenProps) {
  const { data: report, isLoading, error } = useBloodWorkReport(reportId);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-dark-border/20 dark:bg-dark-border/20 rounded" />
          <div className="h-4 w-64 bg-dark-border/20 dark:bg-dark-border/20 rounded" />
          <div className="h-64 bg-dark-border/10 dark:bg-dark-border/10 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-4xl mx-auto py-8 text-center">
        <p className="text-red-400 mb-4">{error?.message ?? 'Report not found.'}</p>
        <Link
          to="/blood-work"
          search={{ view: '', report: '' }}
          className="text-sm text-teal-400 hover:text-teal-300 underline underline-offset-2"
        >
          Back to Blood Work
        </Link>
      </div>
    );
  }

  // Count flags
  const flagCounts = report.biomarkers.reduce(
    (acc, bm) => {
      acc[bm.flag] = (acc[bm.flag] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            to="/blood-work"
            search={{ view: '', report: '' }}
            className="text-xs text-teal-400 hover:text-teal-300 mb-2 inline-block"
          >
            &larr; All Reports
          </Link>
          <h1 className="font-heading text-2xl font-bold text-teal">Lab Results</h1>
          <p className="text-sm text-light/40 dark:text-light/40 mt-1">
            {report.fileName} - {formatDate(report.uploadedAt)}
          </p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl bg-dark-surface/50 dark:bg-dark-surface/50 border border-dark-border/20 dark:border-dark-border/20 p-3 text-center">
          <p className="text-2xl font-bold text-light/80 dark:text-light/80">
            {report.biomarkers.length}
          </p>
          <p className="text-xs text-light/40 dark:text-light/40">Biomarkers</p>
        </div>
        <div className="rounded-xl bg-dark-surface/50 dark:bg-dark-surface/50 border border-dark-border/20 dark:border-dark-border/20 p-3 text-center">
          <p className="text-2xl font-bold text-emerald-400">{flagCounts.normal ?? 0}</p>
          <p className="text-xs text-light/40 dark:text-light/40">Normal</p>
        </div>
        <div className="rounded-xl bg-dark-surface/50 dark:bg-dark-surface/50 border border-dark-border/20 dark:border-dark-border/20 p-3 text-center">
          <p className="text-2xl font-bold text-amber-400">
            {(flagCounts.high ?? 0) + (flagCounts.low ?? 0)}
          </p>
          <p className="text-xs text-light/40 dark:text-light/40">Flagged</p>
        </div>
        <div className="rounded-xl bg-dark-surface/50 dark:bg-dark-surface/50 border border-dark-border/20 dark:border-dark-border/20 p-3 text-center">
          <p className="text-2xl font-bold text-light/60 dark:text-light/60">
            {report.vendor ?? 'Unknown'}
          </p>
          <p className="text-xs text-light/40 dark:text-light/40">Lab vendor</p>
        </div>
      </div>

      {/* Report metadata */}
      <div className="flex flex-wrap gap-3 text-xs text-light/40 dark:text-light/40">
        {report.extractionMethod && <span>Extraction: {report.extractionMethod}</span>}
        {report.pageCount != null && <span>{report.pageCount} pages</span>}
        <span>{formatSize(report.fileSizeBytes)}</span>
        {report.processedAt && <span>Processed: {formatDate(report.processedAt)}</span>}
      </div>

      {/* Biomarker table */}
      <div>
        <h2 className="text-lg font-semibold text-light/80 dark:text-light/80 mb-3">
          Extracted Biomarkers
        </h2>
        <p className="text-xs text-light/40 dark:text-light/40 mb-4">
          Click any row to see three-tradition interpretations from Ayurveda, Traditional Chinese
          Medicine, and Naturopathy.
        </p>
        <BiomarkerTable biomarkers={report.biomarkers} />
      </div>
    </div>
  );
}
