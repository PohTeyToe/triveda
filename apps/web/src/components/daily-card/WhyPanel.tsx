/**
 * WhyPanel -- expandable "depth on demand" panel below the food card.
 * Contains convergence banner and three independently expandable tradition sections.
 * Collapses on day change (keyed on demoDay).
 */

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronUp } from 'lucide-react';
import { useRef, useState } from 'react';
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

  return (
    <div data-testid="why-panel">
      {/* Toggle button */}
      {!isOpen && (
        <button
          type="button"
          onClick={handleToggle}
          aria-expanded={false}
          aria-controls="why-panel-content"
          className="
            font-body text-sm text-teal
            hover:underline
            focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-dark
            rounded py-1
          "
        >
          Why?
        </button>
      )}

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id="why-panel-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <section className="pt-3" aria-label="Why this food was recommended">
              <ConvergenceBanner convergence={convergence} />

              <TraditionSection title="Your Constitution" tradition="ayurveda" />
              <TraditionSection title="Your Energy Today" tradition="tcm" />
              <TraditionSection title="The Evidence" tradition="naturopathy" />

              {/* Collapse chevron */}
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={handleToggle}
                  aria-expanded={true}
                  aria-controls="why-panel-content"
                  aria-label="Collapse why panel"
                  className="
                    text-neutral-400 hover:text-teal
                    transition-colors p-1
                    focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-dark
                    rounded
                  "
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
