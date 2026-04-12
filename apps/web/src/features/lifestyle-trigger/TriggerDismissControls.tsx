/**
 * TriggerDismissControls -- three-button dismiss row.
 *
 * Got it (acknowledge), Remind me (suppress 7 days), Not interested (suppress 30 days).
 */

import type { DismissalType } from '@triveda/shared';

interface TriggerDismissControlsProps {
  onDismiss: (type: DismissalType) => void;
  disabled?: boolean;
}

const DISMISS_OPTIONS: Array<{
  type: DismissalType;
  label: string;
  icon: string;
  ariaLabel: string;
}> = [
  {
    type: 'got_it',
    label: 'Got it',
    icon: '\u2714',
    ariaLabel: 'Dismiss trigger, acknowledged',
  },
  {
    type: 'remind_me',
    label: 'Remind me',
    icon: '\u23F0',
    ariaLabel: 'Dismiss trigger, remind me next week',
  },
  {
    type: 'not_interested',
    label: 'Not interested',
    icon: '\u2717',
    ariaLabel: 'Dismiss trigger, not interested for 30 days',
  },
];

export function TriggerDismissControls({ onDismiss, disabled }: TriggerDismissControlsProps) {
  return (
    <div className="flex gap-2 justify-between">
      {DISMISS_OPTIONS.map((opt) => (
        <button
          key={opt.type}
          type="button"
          onClick={() => onDismiss(opt.type)}
          disabled={disabled}
          aria-label={opt.ariaLabel}
          className={`
            flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium
            border border-dark-border/30 dark:border-dark-border
            text-gray-600 dark:text-gray-400
            transition-colors
            ${
              disabled
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-gray-100 dark:hover:bg-dark-surface'
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
