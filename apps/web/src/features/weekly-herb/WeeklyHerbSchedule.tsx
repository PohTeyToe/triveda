/**
 * WeeklyHerbSchedule -- delivery day picker for profile settings.
 *
 * 7-day segmented control with instant persist (no save button).
 */

import { useWeeklyHerbSchedule } from './useWeeklyHerbSchedule';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface WeeklyHerbScheduleProps {
  currentDay: number; // 0-6
}

export function WeeklyHerbSchedule({ currentDay }: WeeklyHerbScheduleProps) {
  const mutation = useWeeklyHerbSchedule();

  const handleSelect = (day: number) => {
    if (day !== currentDay) {
      mutation.mutate({ day });
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Weekly herb delivery day
      </p>
      <div
        className="flex rounded-lg border border-dark-border/30 dark:border-dark-border overflow-hidden"
        role="group"
        aria-label="Weekly herb delivery day"
      >
        {DAY_LABELS.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => handleSelect(index)}
            className={`
              flex-1 py-2 text-xs font-medium transition-colors
              ${
                index === currentDay
                  ? 'bg-teal-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-surface'
              }
              ${index > 0 ? 'border-l border-dark-border/30 dark:border-dark-border' : ''}
            `}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
