/**
 * Error fallback for the Daily Card surface.
 * Used with react-error-boundary's ErrorBoundary in DailyCardHomeScreen.
 */

import { useQueryClient } from '@tanstack/react-query';
import type { FallbackProps } from 'react-error-boundary';
import { Card } from '../layout/Card';

export function DailyCardErrorFallback({ resetErrorBoundary }: FallbackProps) {
  const queryClient = useQueryClient();

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['daily-food'] });
    resetErrorBoundary();
  };

  return (
    <Card variant="elevated" className="max-w-md mx-auto text-center">
      <div className="p-6">
        <h2 className="font-heading text-lg font-semibold text-cream dark:text-cream mb-2">
          We could not reach Triveda just now
        </h2>
        <p className="font-body text-sm text-neutral-400 dark:text-neutral-400 mb-4">
          Something went wrong loading your daily recommendation.
        </p>
        <button
          type="button"
          onClick={handleRetry}
          className="font-body text-sm px-4 py-2 rounded-lg bg-teal text-cream hover:bg-teal-soft transition-colors focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-dark"
        >
          Retry
        </button>
      </div>
    </Card>
  );
}
