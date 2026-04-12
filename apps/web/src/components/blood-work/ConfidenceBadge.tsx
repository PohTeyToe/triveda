/**
 * ConfidenceBadge -- small badge showing extraction confidence percentage.
 * Green >= 0.9, amber 0.8-0.9, red < 0.8 with warning indicator.
 */

interface ConfidenceBadgeProps {
  confidence: number;
}

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const pct = Math.round(confidence * 100);

  let colorClasses: string;
  let showWarning = false;

  if (confidence >= 0.9) {
    colorClasses = 'text-emerald-400';
  } else if (confidence >= 0.8) {
    colorClasses = 'text-amber-400';
  } else {
    colorClasses = 'text-red-400';
    showWarning = true;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${colorClasses}`}
      aria-label={`Confidence: ${pct}%`}
    >
      {showWarning && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          className="w-3 h-3"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M6.701 2.25c.577-1 2.02-1 2.598 0l5.196 9a1.5 1.5 0 0 1-1.299 2.25H2.804a1.5 1.5 0 0 1-1.3-2.25l5.197-9ZM8 5a.75.75 0 0 1 .75.75v2.5a.75.75 0 0 1-1.5 0v-2.5A.75.75 0 0 1 8 5Zm0 6.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
            clipRule="evenodd"
          />
        </svg>
      )}
      {pct}%
    </span>
  );
}
