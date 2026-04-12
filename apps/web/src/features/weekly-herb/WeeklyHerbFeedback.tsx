/**
 * WeeklyHerbFeedback -- feedback button row for the weekly herb card.
 *
 * Four buttons: Tried it, Helpful, Not for me, Remind me next week.
 * After submission, the pressed button is highlighted and others disabled.
 */

import { useState } from 'react';
import { useWeeklyHerbFeedback } from './useWeeklyHerbFeedback';

type FeedbackOption = {
  type: 'tried' | 'helpful' | 'not_for_me' | 'remind_next_week';
  label: string;
  icon: string;
};

const OPTIONS: FeedbackOption[] = [
  { type: 'tried', label: 'Tried it', icon: '\u2714' },
  { type: 'helpful', label: 'Helpful', icon: '\uD83D\uDC4D' },
  { type: 'not_for_me', label: 'Not for me', icon: '\uD83D\uDC4E' },
  { type: 'remind_next_week', label: 'Remind me', icon: '\u23F0' },
];

interface WeeklyHerbFeedbackProps {
  herbId: string;
}

export function WeeklyHerbFeedback({ herbId }: WeeklyHerbFeedbackProps) {
  const mutation = useWeeklyHerbFeedback();
  const [selected, setSelected] = useState<string | null>(null);

  const handleClick = (type: FeedbackOption['type']) => {
    setSelected(type);
    mutation.mutate({ herb_id: herbId, feedback_type: type });
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {OPTIONS.map((opt) => (
        <button
          key={opt.type}
          type="button"
          onClick={() => handleClick(opt.type)}
          disabled={selected !== null}
          className={`
            flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium
            border border-dark-border/30 dark:border-dark-border
            transition-colors
            ${
              selected === opt.type
                ? 'bg-teal-600 text-white border-teal-600'
                : selected !== null
                  ? 'opacity-50 cursor-not-allowed text-gray-500 dark:text-gray-500'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-surface'
            }
          `}
        >
          <span>{opt.icon}</span>
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
