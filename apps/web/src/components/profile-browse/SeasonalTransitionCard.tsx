import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useAcknowledgeTransition, useSeasonalTransition } from '../../hooks/profile-browse';
import { TraditionSection } from './TraditionSection';

/**
 * Full-screen overlay shown when a seasonal transition is active.
 * Three tradition sections explain the shift. Dismiss acknowledges
 * server-side so it does not reappear.
 */
export function SeasonalTransitionCard() {
  const { data } = useSeasonalTransition();
  const { mutate: acknowledge, isPending } = useAcknowledgeTransition();
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const isActive = data?.active && data.transition;
  const transition = data?.transition;

  // Focus management: trap focus when open, return on close
  useEffect(() => {
    if (isActive) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      closeButtonRef.current?.focus();
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isActive]);

  const handleDismiss = () => {
    if (!transition) return;
    acknowledge({
      from_ritu: transition.from_ritu,
      to_ritu: transition.to_ritu,
    });
  };

  return (
    <AnimatePresence>
      {isActive && transition && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] bg-dark/90 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Seasonal transition"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-dark-surface border border-dark-border p-6"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-heading text-xl font-bold text-teal">Season Changing</h2>
                <p className="text-sm text-light/60 mt-1">
                  {transition.from_ritu} to {transition.to_ritu}
                </p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={handleDismiss}
                disabled={isPending}
                aria-label="Dismiss seasonal transition"
                className="p-2 rounded-lg text-light/40 hover:text-light hover:bg-dark-border transition-colors focus:outline-none focus:ring-2 focus:ring-teal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tradition sections */}
            <div className="space-y-2">
              <TraditionSection title="Ayurveda" id="seasonal-ayurveda" defaultExpanded>
                <p className="text-sm text-light/70">{transition.ayurveda_explanation}</p>
              </TraditionSection>

              <TraditionSection
                title="Traditional Chinese Medicine"
                id="seasonal-tcm"
                defaultExpanded
              >
                <p className="text-sm text-light/70">{transition.tcm_explanation}</p>
              </TraditionSection>

              <TraditionSection title="Naturopathy" id="seasonal-naturopathy" defaultExpanded>
                <p className="text-sm text-light/70">{transition.naturopathy_explanation}</p>
              </TraditionSection>
            </div>

            {/* Dismiss button */}
            <button
              type="button"
              onClick={handleDismiss}
              disabled={isPending}
              className="w-full mt-6 min-h-11 px-4 py-3 rounded-xl bg-teal text-dark font-medium text-sm hover:bg-teal-soft transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-teal"
            >
              {isPending ? 'Acknowledging...' : 'Got it, adjust my recommendations'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
