/**
 * ReferenceRangeBar -- visual bar showing where a biomarker value falls
 * relative to its reference range.
 */

interface ReferenceRangeBarProps {
  value: number;
  low: number | null;
  high: number | null;
  displayName: string;
  unit: string;
}

export function ReferenceRangeBar({ value, low, high, displayName, unit }: ReferenceRangeBarProps) {
  if (low == null && high == null) {
    return <span className="text-xs text-light/30 dark:text-light/30">No reference range</span>;
  }

  // Calculate the bar range with some padding
  const rangeLow = low ?? (high != null ? high * 0.5 : 0);
  const rangeHigh = high ?? (low != null ? low * 2 : 100);
  const spread = rangeHigh - rangeLow;
  const padding = spread * 0.3;
  const barMin = rangeLow - padding;
  const barMax = rangeHigh + padding;
  const barRange = barMax - barMin;

  // Clamp value position between 0% and 100%
  const valuePosition = Math.max(0, Math.min(100, ((value - barMin) / barRange) * 100));

  // Calculate the green zone (reference range)
  const greenStart = ((rangeLow - barMin) / barRange) * 100;
  const greenEnd = ((rangeHigh - barMin) / barRange) * 100;

  // Build the aria-label
  let rangeText: string;
  if (low != null && high != null) {
    rangeText = `range ${low}-${high} ${unit}`;
  } else if (low != null) {
    rangeText = `minimum ${low} ${unit}`;
  } else {
    rangeText = `maximum ${high} ${unit}`;
  }

  const positionText =
    value < (low ?? Number.NEGATIVE_INFINITY)
      ? 'below normal'
      : value > (high ?? Number.POSITIVE_INFINITY)
        ? 'above normal'
        : 'within normal';

  return (
    <div
      className="relative w-full h-3 rounded-full bg-dark-border/30 dark:bg-dark-border/30 overflow-hidden"
      aria-label={`${displayName}: ${value} ${unit}, ${positionText} ${rangeText}`}
      role="img"
    >
      {/* Green reference range zone */}
      <div
        className="absolute top-0 bottom-0 bg-emerald-500/25 dark:bg-emerald-500/25"
        style={{
          left: `${Math.max(0, greenStart)}%`,
          width: `${Math.min(100, greenEnd) - Math.max(0, greenStart)}%`,
        }}
      />

      {/* Value marker */}
      <div
        className="absolute top-0 bottom-0 w-1.5 rounded-full bg-teal-400 dark:bg-teal-400 shadow-sm"
        style={{ left: `calc(${valuePosition}% - 3px)` }}
      />
    </div>
  );
}
