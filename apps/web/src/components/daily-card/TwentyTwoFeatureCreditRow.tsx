/**
 * TwentyTwoFeatureCreditRow -- horizontal scroll strip of 22 credit chips.
 * Proves backend intelligence. Visible after first Why panel open.
 * Includes stagger animation on first reveal and roving tabindex.
 */

import { ALL_FEATURE_IDS, type CreditSource } from '@triveda/shared';
import { motion } from 'framer-motion';
import { type KeyboardEvent, useCallback, useRef, useState } from 'react';
import { CreditChip } from './CreditChip';

type CreditRowProps = {
  credits: CreditSource[];
  visible: boolean;
};

const CHIP_COUNT = ALL_FEATURE_IDS.length; // 22

export function TwentyTwoFeatureCreditRow({ credits, visible }: CreditRowProps) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const hasRevealed = useRef(false);
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const activeCount = credits.filter((c) => c.active).length;

  // Mark as revealed after first animation
  const isFirstReveal = visible && !hasRevealed.current;
  if (visible && !hasRevealed.current) {
    // Will be set after render
    requestAnimationFrame(() => {
      hasRevealed.current = true;
    });
  }

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      let nextIndex = focusedIndex;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          nextIndex = (focusedIndex + 1) % CHIP_COUNT;
          break;
        case 'ArrowLeft':
          e.preventDefault();
          nextIndex = (focusedIndex - 1 + CHIP_COUNT) % CHIP_COUNT;
          break;
        case 'Home':
          e.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          nextIndex = CHIP_COUNT - 1;
          break;
        default:
          return;
      }

      setFocusedIndex(nextIndex);
      chipRefs.current[nextIndex]?.focus();
    },
    [focusedIndex],
  );

  if (!visible) return null;

  const containerVariants = isFirstReveal
    ? {
        hidden: {},
        show: { transition: { staggerChildren: 0.03 } },
      }
    : undefined;

  const activeChipVariants = isFirstReveal
    ? {
        hidden: { scale: 0.8, opacity: 0 },
        show: { scale: 1, opacity: 1 },
      }
    : undefined;

  const dormantChipVariants = isFirstReveal
    ? {
        hidden: { opacity: 0 },
        show: { opacity: 0.5 },
      }
    : undefined;

  return (
    <div className="mt-3" data-testid="credit-row">
      {/* Subtitle */}
      <p className="font-body text-xs text-neutral-500 mb-2">
        This recommendation drew on {activeCount} of your 22 insight sources
      </p>

      {/* Chip container */}
      <motion.div
        role="toolbar"
        aria-label="Backend intelligence features"
        className="
          flex gap-2 p-1 flex-nowrap
          overflow-x-auto scrollbar-hide
        "
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
        }}
        onKeyDown={handleKeyDown}
        variants={containerVariants}
        initial={isFirstReveal ? 'hidden' : undefined}
        animate={isFirstReveal ? 'show' : undefined}
      >
        {ALL_FEATURE_IDS.map((feature, index) => {
          const credit = credits.find((c) => c.featureId === feature.id);
          const isActive = credit?.active ?? false;

          return (
            <motion.div
              key={feature.id}
              variants={isActive ? activeChipVariants : dormantChipVariants}
            >
              <CreditChip
                featureId={feature.id}
                featureName={feature.label}
                active={isActive}
                contribution={credit?.contribution}
                tabIndex={index === focusedIndex ? 0 : -1}
                onFocus={() => setFocusedIndex(index)}
              />
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
