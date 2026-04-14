/**
 * DailyCardHeader -- contextual header showing date, season, weather
 * in plain English. No Sanskrit terms, no ISO formats.
 */

type DailyCardHeaderProps = {
  date: string;
  seasonLabel: string;
  weatherSummary: string;
};

const weekdayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'long' });
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
});

// Dev-only Sanskrit term check
const BLOCKED_TERMS = ['Ritu', 'Vasanta', 'Sharad', 'Grishma', 'Hemanta', 'Shishira', 'Varsha'];

export function DailyCardHeader({
  date,
  seasonLabel = '',
  weatherSummary = '',
}: DailyCardHeaderProps) {
  const dateObj = date ? new Date(`${date}T12:00:00`) : new Date();
  // Guard against invalid date strings
  if (Number.isNaN(dateObj.getTime())) {
    return (
      <div className="pb-4 pt-1" data-testid="daily-card-header">
        <p className="font-body text-xs text-cream/40">Today</p>
      </div>
    );
  }
  const weekday = weekdayFormatter.format(dateObj);
  const formattedDate = dateFormatter.format(dateObj);

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
    <div className="pb-4 pt-1" data-testid="daily-card-header">
      <p className="font-body text-xs uppercase tracking-wider text-cream/40">{weekday}</p>
      <div className="flex items-baseline gap-2 mt-0.5">
        <h1 className="font-heading text-xl font-bold text-cream">{formattedDate}</h1>
        <span className="text-cream/50 text-sm font-body">{weatherSummary}</span>
      </div>
      <p className="font-body text-xs text-cream/40 mt-0.5">{seasonLabel}</p>
    </div>
  );
}
