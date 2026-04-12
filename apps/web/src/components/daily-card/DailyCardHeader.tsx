/**
 * DailyCardHeader -- contextual header showing date, season, weather
 * in plain English. No Sanskrit terms, no ISO formats.
 */

type DailyCardHeaderProps = {
  date: string;
  seasonLabel: string;
  weatherSummary: string;
};

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

// Dev-only Sanskrit term check
const BLOCKED_TERMS = ['Ritu', 'Vasanta', 'Sharad', 'Grishma', 'Hemanta', 'Shishira', 'Varsha'];

export function DailyCardHeader({ date, seasonLabel, weatherSummary }: DailyCardHeaderProps) {
  // Format ISO date to plain English
  const formattedDate = dateFormatter.format(new Date(`${date}T12:00:00`));

  // Dev-only assertion: no Sanskrit in season label
  if (import.meta.env.DEV) {
    for (const term of BLOCKED_TERMS) {
      if (seasonLabel.includes(term)) {
        console.warn(
          `DailyCardHeader: seasonLabel contains blocked term "${term}". Use plain English only.`,
        );
      }
    }
  }

  return (
    <div className="space-y-0.5" data-testid="daily-card-header">
      <p className="font-body text-sm font-medium text-neutral-600 dark:text-neutral-400">
        {formattedDate}
      </p>
      <p className="font-body text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {seasonLabel}
      </p>
      <p className="font-body text-xs text-neutral-500 dark:text-neutral-500">{weatherSummary}</p>
    </div>
  );
}
