/**
 * BloodWorkHistoryScreen -- landing page for blood work feature.
 * Lists all user reports with empty state and upload CTA.
 */

import { Link } from '@tanstack/react-router';
import { useBloodWorkHistory } from '../../hooks/useBloodWorkHistory';
import { ReportCard } from './ReportCard';

export function BloodWorkHistoryScreen() {
  const { data: reports, isLoading } = useBloodWorkHistory();

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-teal">Blood Work Reports</h1>
        <Link
          to="/blood-work"
          search={{ view: 'upload', report: '' }}
          className="px-4 py-2 rounded-xl bg-teal-500 text-cream text-sm font-medium hover:bg-teal-600 transition-colors"
        >
          Upload New Report
        </Link>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 rounded-xl bg-dark-border/10 dark:bg-dark-border/10 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (!reports || reports.length === 0) && (
        <div className="text-center py-16">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-16 h-16 text-light/15 dark:text-light/15 mx-auto mb-4"
            aria-hidden="true"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
            <circle cx="11.5" cy="14.5" r="2.5" />
            <path d="M13.25 16.25 15 18" />
          </svg>
          <p className="text-lg text-light/50 dark:text-light/50 mb-2">No lab reports yet</p>
          <p className="text-sm text-light/30 dark:text-light/30 max-w-sm mx-auto mb-6">
            Upload your first lab report to see how your blood work influences your food
            recommendations.
          </p>
          <Link
            to="/blood-work"
            search={{ view: 'upload', report: '' }}
            className="inline-flex px-6 py-3 rounded-xl bg-teal-500 text-cream font-medium hover:bg-teal-600 transition-colors"
          >
            Upload Lab Report
          </Link>
        </div>
      )}

      {/* Report list */}
      {!isLoading && reports && reports.length > 0 && (
        <div className="space-y-2">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}
