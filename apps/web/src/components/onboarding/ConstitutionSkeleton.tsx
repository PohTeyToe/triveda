/**
 * Loading skeleton matching the Constitution Card layout.
 *
 * Prevents layout shift when data arrives.
 * Same padding, gap, and sizing as the real card.
 */

import { Card } from '../layout/Card';

export function ConstitutionSkeleton() {
  return (
    <div
      className="space-y-4 animate-pulse"
      aria-busy="true"
      aria-label="Loading constitution profile"
    >
      {/* Summary skeleton */}
      <Card variant="elevated" className="border-t-2 border-teal/30 p-4 md:p-6">
        {/* Heading */}
        <div className="h-8 w-48 bg-gray-200 dark:bg-dark-surface rounded mb-3" />
        {/* Summary lines */}
        <div className="space-y-2">
          <div className="h-4 w-full bg-gray-200 dark:bg-dark-surface rounded" />
          <div className="h-4 w-full bg-gray-200 dark:bg-dark-surface rounded" />
          <div className="h-4 w-3/4 bg-gray-200 dark:bg-dark-surface rounded" />
        </div>
      </Card>

      {/* Section skeletons */}
      <Card variant="default" className="p-4 md:p-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-dark-border last:border-b-0"
          >
            <div className="h-5 w-40 bg-gray-200 dark:bg-dark-surface rounded" />
            <div className="h-5 w-5 bg-gray-200 dark:bg-dark-surface rounded" />
          </div>
        ))}
      </Card>
    </div>
  );
}
