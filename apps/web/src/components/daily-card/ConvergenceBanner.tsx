/**
 * ConvergenceBanner -- single-line banner displaying the convergence state
 * from the deterministic engine. Three states: converged (green),
 * diverged (amber/terracotta), partial (neutral).
 *
 * Copy is verbatim from Sasha. Hardcoded, not LLM-generated.
 */

type ConvergenceBannerProps = {
  convergence: {
    state: 'converged' | 'diverged' | 'partial';
    dimensions: { name: string; agrees: boolean }[];
    partialLabel?: string;
  };
};

const BANNER_CONFIG = {
  converged: {
    border: 'border-l-4 border-green',
    bg: 'bg-green/5',
    text: 'All three traditions point the same direction this morning',
  },
  diverged: {
    border: 'border-l-4 border-terracotta',
    bg: 'bg-terracotta/5',
    text: 'Traditions disagree on this one -- here is why it is interesting',
  },
  partial: {
    border: 'border-l-4 border-neutral-500',
    bg: 'bg-neutral-500/5',
    text: '', // Uses partialLabel
  },
} as const;

export function ConvergenceBanner({ convergence }: ConvergenceBannerProps) {
  const config = BANNER_CONFIG[convergence.state];
  const displayText =
    convergence.state === 'partial'
      ? convergence.partialLabel || 'Some traditions align on this recommendation'
      : config.text;

  return (
    <output
      className={`${config.border} ${config.bg} p-3 mb-3 rounded-r-lg block`}
      data-testid="convergence-banner"
    >
      <p className="font-body text-sm text-neutral-700 dark:text-neutral-300">{displayText}</p>
    </output>
  );
}
