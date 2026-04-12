/**
 * Inline error banner with retry mechanism.
 *
 * Used across onboarding for network/server errors.
 * Persists until user retries (not a dismissible toast).
 */

import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { bannerSlideDown } from '../../lib/animations';
import { Spinner } from './Spinner';

interface ErrorBannerProps {
  message: string;
  onRetry: () => void;
  isRetrying?: boolean;
}

export function ErrorBanner({ message, onRetry, isRetrying }: ErrorBannerProps) {
  return (
    <AnimatePresence>
      <motion.div
        {...bannerSlideDown}
        role="alert"
        className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20"
      >
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-body text-sm text-red-600 dark:text-red-400">{message}</p>
        </div>
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className="shrink-0 px-3 py-1 text-sm font-body rounded-lg
            text-red-600 dark:text-red-400
            hover:bg-red-500/10 dark:hover:bg-red-500/20
            focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors"
        >
          {isRetrying ? <Spinner size="sm" /> : 'Try again'}
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Returns the appropriate error message based on the error type.
 */
export function getErrorMessage(error: Error | null): string {
  if (!error) return 'Something went wrong.';
  if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
    return 'Could not reach the server. Check your connection and try again.';
  }
  if (error.message.includes('500') || error.message.includes('Internal')) {
    return 'Something went wrong on our end. Tap to try again.';
  }
  return error.message || 'Something went wrong.';
}
