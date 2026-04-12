interface ConfidenceBadgeProps {
  score: number;
}

function getConfidenceStyle(score: number) {
  if (score >= 0.8) return { style: 'bg-green/20 text-green', label: 'High confidence' };
  if (score >= 0.5)
    return { style: 'bg-amber-500/20 text-amber-400', label: 'Moderate confidence' };
  return { style: 'bg-red-500/20 text-red-400', label: 'Low confidence' };
}

export function ConfidenceBadge({ score }: ConfidenceBadgeProps) {
  const percentage = Math.round(score * 100);
  const { style, label } = getConfidenceStyle(score);

  return (
    <span
      aria-label={`Confidence: ${percentage}%`}
      className={`${style} inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium`}
    >
      <span>{percentage}%</span>
      <span className="opacity-70">{label}</span>
    </span>
  );
}
