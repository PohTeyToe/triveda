/**
 * WeeklyHerbPreview -- compact card for the home screen.
 *
 * Shows herb name and a link to the full weekly herb view.
 * Renders null when no herb is available.
 */

import { useWeeklyHerb } from './useWeeklyHerb';

export function WeeklyHerbPreview() {
  const { data } = useWeeklyHerb();

  if (!data || !data.herb) {
    return null;
  }

  return (
    <div className="flex items-center justify-between bg-white dark:bg-dark-surface border border-dark-border/30 dark:border-dark-border rounded-xl px-3 py-2 max-h-20">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-lg" role="img" aria-label="herb">
          &#x1F33F;
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {data.herb.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">This week's herb</p>
        </div>
      </div>
      <span className="text-gray-400 text-sm flex-shrink-0" aria-hidden="true">
        &#x2192;
      </span>
    </div>
  );
}
