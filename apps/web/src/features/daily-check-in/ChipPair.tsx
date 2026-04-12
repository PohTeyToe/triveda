/**
 * ChipPair -- single pair of toggle chips with radio semantics.
 *
 * Tapping the already-selected chip deselects it (tri-state: left/right/null).
 */

import type { CheckInChipPair } from '@triveda/shared/inputs';
import { motion } from 'framer-motion';

type ChipPairProps = {
  pair: CheckInChipPair;
  value: 'left' | 'right' | null;
  onChange: (value: 'left' | 'right' | null) => void;
};

function ChipButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      layout
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`
        rounded-full px-4 py-1.5 text-sm font-medium transition-colors
        ${
          selected
            ? 'bg-teal-600 text-white'
            : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-500'
        }
      `}
    >
      {label}
    </motion.button>
  );
}

export function ChipPair({ pair, value, onChange }: ChipPairProps) {
  return (
    <fieldset className="flex gap-2 items-center">
      <legend className="sr-only">
        {pair.left_label} or {pair.right_label}
      </legend>
      <ChipButton
        label={pair.left_label}
        selected={value === 'left'}
        onClick={() => onChange(value === 'left' ? null : 'left')}
      />
      <ChipButton
        label={pair.right_label}
        selected={value === 'right'}
        onClick={() => onChange(value === 'right' ? null : 'right')}
      />
    </fieldset>
  );
}
