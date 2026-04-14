/**
 * BreathworkWalkthrough — animated breathing exercise overlay.
 *
 * Renders an expanding/contracting SVG circle synced to the technique's
 * inhale/hold/exhale rhythm, plus numbered steps and "why this helps".
 * Used by TriggeredRecsBanner when the user taps "Learn more" on a
 * stress trigger.
 *
 * No audio, no haptics — purely visual. Framer Motion handles the
 * animation loop. Closing the overlay stops the animation.
 */

import type { BreathworkTemplate } from '@triveda/shared';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

interface BreathworkWalkthroughProps {
  template: BreathworkTemplate;
  open: boolean;
  onClose: () => void;
}

// Inhale/hold/exhale durations per technique (seconds).
// Derived from the steps; hardcoded here to avoid parsing prose at runtime.
const TIMING: Record<string, { inhale: number; holdIn: number; exhale: number; holdOut: number }> = {
  'four-seven-eight': { inhale: 4, holdIn: 7, exhale: 8, holdOut: 0 },
  'nadi-shodhana': { inhale: 4, holdIn: 2, exhale: 4, holdOut: 0 },
  'box-breathing': { inhale: 4, holdIn: 4, exhale: 4, holdOut: 4 },
};

export function BreathworkWalkthrough({ template, open, onClose }: BreathworkWalkthroughProps) {
  const timing = TIMING[template.id] ?? TIMING['box-breathing']!;
  const cycleSeconds = timing.inhale + timing.holdIn + timing.exhale + timing.holdOut;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-charcoal/85 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 220 }}
            className="w-full sm:max-w-md bg-charcoal-elevated border-t sm:border border-cream/10 sm:rounded-2xl rounded-t-2xl p-6 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-cream font-display">{template.name}</h3>
                <p className="text-xs text-cream/55 font-body mt-0.5">
                  {template.tradition} · {template.evidenceTier}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close walkthrough"
                className="text-cream/50 hover:text-cream/80 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Animated breath ring */}
            <div className="flex items-center justify-center my-6 h-44">
              <svg width="160" height="160" viewBox="0 0 160 160" aria-hidden="true">
                <motion.circle
                  cx="80"
                  cy="80"
                  r="30"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-teal-300/80"
                  animate={{
                    r: [30, 60, 60, 30, 30],
                  }}
                  transition={{
                    duration: cycleSeconds,
                    times: [
                      0,
                      timing.inhale / cycleSeconds,
                      (timing.inhale + timing.holdIn) / cycleSeconds,
                      (timing.inhale + timing.holdIn + timing.exhale) / cycleSeconds,
                      1,
                    ],
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'easeInOut',
                  }}
                />
                <motion.circle
                  cx="80"
                  cy="80"
                  r="30"
                  fill="currentColor"
                  className="text-teal-300/15"
                  animate={{
                    r: [30, 55, 55, 30, 30],
                  }}
                  transition={{
                    duration: cycleSeconds,
                    times: [
                      0,
                      timing.inhale / cycleSeconds,
                      (timing.inhale + timing.holdIn) / cycleSeconds,
                      (timing.inhale + timing.holdIn + timing.exhale) / cycleSeconds,
                      1,
                    ],
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'easeInOut',
                  }}
                />
              </svg>
            </div>

            {/* Steps */}
            <ol className="space-y-2 mb-5">
              {template.steps.map((step, idx) => (
                <li
                  key={`${template.id}-step-${idx}`}
                  className="flex gap-3 text-sm text-cream/85 font-body leading-relaxed"
                >
                  <span className="text-teal-300/80 font-medium tabular-nums shrink-0">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>

            {/* Why this helps */}
            <div className="rounded-lg bg-cream/[0.03] border border-cream/5 p-3">
              <p className="text-[11px] uppercase tracking-wider text-cream/50 font-body mb-1">
                Why this helps
              </p>
              <p className="text-sm text-cream/80 font-body leading-relaxed">
                {template.whyThisHelps}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
