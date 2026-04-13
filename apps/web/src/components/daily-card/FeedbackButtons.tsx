/**
 * FeedbackButtons -- checkmark (tried), X (rejected), "what else?" chip.
 * Optimistic update via useFoodFeedback mutation.
 */

import { Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { useFoodFeedback } from '../../hooks/useFoodFeedback';

type FeedbackButtonsProps = {
  suggestionId: string;
  currentFeedback?: 'tried' | 'rejected' | null;
  userId?: string;
  demoDay?: number;
  apiUrl?: string;
  authToken?: string;
};

export function FeedbackButtons({
  suggestionId,
  currentFeedback,
  userId,
  demoDay,
  apiUrl,
  authToken,
}: FeedbackButtonsProps) {
  const mutation = useFoodFeedback({ userId, demoDay, apiUrl, authToken });

  const isTried = currentFeedback === 'tried';
  const isRejected = currentFeedback === 'rejected';

  const handleFeedback = (response: 'tried' | 'rejected') => {
    if ((response === 'tried' && isTried) || (response === 'rejected' && isRejected)) {
      return; // Already in that state
    }
    mutation.mutate({ suggestion_id: suggestionId, response });
  };

  const handleWhatElse = () => {
    toast('Coming soon -- we will let you request alternatives in a future update.');
  };

  return (
    <div className="flex items-center gap-2" data-testid="feedback-buttons">
      {/* Tried button */}
      <button
        type="button"
        onClick={() => handleFeedback('tried')}
        aria-label="I tried this food"
        aria-pressed={isTried}
        className={`
          min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center
          transition-colors
          focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-dark
          ${isTried ? 'bg-teal/20 text-teal' : 'bg-dark-surface-high text-cream/40'}
        `}
      >
        <Check className="w-5 h-5" />
      </button>

      {/* Rejected button */}
      <button
        type="button"
        onClick={() => handleFeedback('rejected')}
        aria-label="I skipped this food"
        aria-pressed={isRejected}
        className={`
          min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center
          transition-colors
          focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-dark
          ${isRejected ? 'bg-cream/10 text-cream/60' : 'bg-dark-surface-high text-cream/40'}
        `}
      >
        <X className="w-5 h-5" />
      </button>

      {/* What else chip */}
      <button
        type="button"
        onClick={handleWhatElse}
        aria-label="Request an alternative"
        className="
          text-xs px-3 py-1.5 rounded-full
          bg-dark-surface-high text-cream/50 font-body
          hover:text-teal
          transition-colors
          focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-dark
        "
      >
        What else?
      </button>
    </div>
  );
}
