/**
 * ConvergenceBanner -- single-line banner displaying the convergence state
 * from the deterministic engine. Three states: converged (teal bg),
 * diverged (amber bg), partial (neutral).
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
    bg: 'bg-teal/10',
    textColor: 'text-teal',
    text: 'All three traditions point the same direction this morning',
  },
  diverged: {
    bg: 'bg-amber-500/10',
    textColor: 'text-amber-400',
    text: 'Traditions disagree on this one -- here is why it is interesting',
  },
  partial: {
    bg: 'bg-cream/5',
    textColor: 'text-cream/60',
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
    <output className={`${config.bg} p-3 mb-3 rounded-xl block`} data-testid="convergence-banner">
      <p className={`font-body text-sm ${config.textColor}`}>{displayText}</p>
    </output>
  );
}
