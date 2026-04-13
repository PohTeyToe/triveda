/**
 * WhyPanel -- expandable "depth on demand" panel below the food card.
 * Contains convergence banner and three independently expandable tradition sections.
 * Collapses on day change (keyed on demoDay).
 */

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useRef, useState } from 'react';
import { sectionExpandProps } from '../../lib/animations';
import { ConvergenceBanner } from './ConvergenceBanner';
import { TraditionSection } from './TraditionSection';

type WhyPanelProps = {
  convergence: {
    state: 'converged' | 'diverged' | 'partial';
    dimensions: { name: string; agrees: boolean }[];
    partialLabel?: string;
  };
  demoDay: number;
  onFirstOpen?: () => void;
};

export function WhyPanel({ convergence, demoDay, onFirstOpen }: WhyPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const prevDayRef = useRef(demoDay);

  // Reset on day change (inline during render, no effect needed)
  if (prevDayRef.current !== demoDay) {
    prevDayRef.current = demoDay;
    setIsOpen(false);
    setHasOpened(false);
  }

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState && !hasOpened) {
      setHasOpened(true);
      onFirstOpen?.();
    }
  };

  // Convergence badge color
  const badgeBg =
    convergence.state === 'converged'
      ? 'bg-teal/15 text-teal'
      : convergence.state === 'diverged'
        ? 'bg-amber-500/15 text-amber-400'
        : 'bg-cream/10 text-cream/50';

  const badgeLabel =
    convergence.state === 'converged'
      ? 'Traditions agree'
      : convergence.state === 'diverged'
        ? 'Traditions disagree'
        : 'Partial agreement';

  return (
    <div data-testid="why-panel">
      {/* Tappable header */}
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-controls="why-panel-content"
        className="
          w-full flex items-center justify-between py-3
          min-h-[44px]
          focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-dark
          rounded-lg
        "
      >
        <div className="flex items-center gap-3">
          <span className="font-body text-sm font-medium text-cream/80">Why this food?</span>
          <span className={`${badgeBg} rounded-full px-2.5 py-0.5 text-xs font-body font-medium`}>
            {badgeLabel}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-cream/40 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence initial={sectionExpandProps.initial}>
        {isOpen && (
          <motion.div
            id="why-panel-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={sectionExpandProps.transition}
            style={{ overflow: 'hidden' }}
          >
            <section className="pb-2" aria-label="Why this food was recommended">
              <ConvergenceBanner convergence={convergence} />

              <TraditionSection title="Your Constitution" tradition="ayurveda" />
              <TraditionSection title="Your Energy Today" tradition="tcm" />
              <TraditionSection title="The Evidence" tradition="naturopathy" />
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
