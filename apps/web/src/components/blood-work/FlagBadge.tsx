/**
 * FlagBadge -- small pill badge showing biomarker flag status.
 * Color-coded: green (normal), blue (low), orange (high), red (critical).
 */

type FlagType = 'normal' | 'low' | 'high' | 'critical';

interface FlagBadgeProps {
  flag: FlagType;
}

const FLAG_CONFIG: Record<FlagType, { label: string; classes: string }> = {
  normal: {
    label: 'Normal',
    classes: 'bg-emerald-500/15 text-emerald-400 dark:bg-emerald-500/15 dark:text-emerald-400',
  },
  low: {
    label: 'Low',
    classes: 'bg-blue-500/15 text-blue-400 dark:bg-blue-500/15 dark:text-blue-400',
  },
  high: {
    label: 'High',
    classes: 'bg-amber-500/15 text-amber-400 dark:bg-amber-500/15 dark:text-amber-400',
  },
  critical: {
    label: 'Critical',
    classes: 'bg-red-500/15 text-red-400 dark:bg-red-500/15 dark:text-red-400',
  },
};

export function FlagBadge({ flag }: FlagBadgeProps) {
  const config = FLAG_CONFIG[flag];

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.classes}`}
      aria-label={`Status: ${flag}`}
    >
      {config.label}
    </span>
  );
}
