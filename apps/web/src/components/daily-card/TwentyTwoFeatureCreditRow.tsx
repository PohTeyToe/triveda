/**
 * TwentyTwoFeatureCreditRow -- horizontal scroll strip of 22 credit chips.
 * Proves backend intelligence. Visible after first Why panel open.
 * Includes stagger animation on first reveal and roving tabindex.
 */

import { ALL_FEATURE_IDS, type CreditSource } from '@triveda/shared';
import { motion } from 'framer-motion';
import { type KeyboardEvent, useCallback, useRef, useState } from 'react';
import { staggerContainer, staggerItem } from '../../lib/animations';
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
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeCount = credits.filter((c) => c.active).length;

  // Mark as revealed after first animation
  const isFirstReveal = visible && !hasRevealed.current;
  if (visible && !hasRevealed.current) {
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

  return (
    <div className="mt-5" data-testid="credit-row">
      {/* Label */}
      <p className="text-xs text-cream/30 font-body mb-2">
        Powered by {activeCount} of 22 insight sources
      </p>

      {/* Chip container with momentum scroll */}
      <motion.div
        ref={scrollRef}
        role="toolbar"
        aria-label="Backend intelligence features"
        className="flex gap-2 overflow-x-auto scrollbar-hide py-1"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 3%, black 97%, transparent)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent, black 3%, black 97%, transparent)',
        }}
        onKeyDown={handleKeyDown}
        variants={isFirstReveal ? staggerContainer : undefined}
        initial={isFirstReveal ? 'hidden' : undefined}
        animate={isFirstReveal ? 'visible' : undefined}
      >
        {ALL_FEATURE_IDS.map((feature, index) => {
          const credit = credits.find((c) => c.featureId === feature.id);
          const isActive = credit?.active ?? false;

          return (
            <motion.div key={feature.id} variants={isFirstReveal ? staggerItem : undefined}>
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
