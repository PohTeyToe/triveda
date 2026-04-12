/**
 * SimulatedBadge -- persistent pill indicating simulated data.
 *
 * Always rendered, never conditionally hidden. Every screen element
 * showing simulated data carries this badge.
 */

const VARIANT_CLASSES = {
  capture: 'absolute top-2 right-2',
  result: 'inline-block',
  credit: 'inline-block text-[10px]',
} as const;

type SimulatedBadgeProps = {
  variant: 'capture' | 'result' | 'credit';
};

export function SimulatedBadge({ variant }: SimulatedBadgeProps) {
  return (
    <span
      className={`bg-teal-600 text-white text-xs font-sans rounded-full px-2 py-0.5 ${VARIANT_CLASSES[variant]}`}
    >
      Simulated
    </span>
  );
}
