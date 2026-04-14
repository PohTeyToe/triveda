/**
 * TriggeredRecsBanner -- notification-style card displayed at the top of the
 * Home screen when a pattern is detected (poor sleep, low energy, etc).
 *
 * Fetches from GET /api/v1/triggered-recs. Renders nothing if there are no
 * active display triggers. Dismissal is local-only (no backend mutation).
 */

import { useQuery } from '@tanstack/react-query';
import type { ActiveTrigger, CreditSource } from '@triveda/shared';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { apiFetch } from '../../lib/api-client';
import { BreathworkWalkthrough } from './BreathworkWalkthrough';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TriggeredRecsResponse {
  triggers: ActiveTrigger[];
  credits: CreditSource[];
}

const TRIGGER_LABELS: Record<ActiveTrigger['type'], string> = {
  sleep: 'Sleep Pattern Detected',
  stress: 'Stress Pattern Detected',
  digestive: 'Digestive Pattern Detected',
  energy: 'Energy Pattern Detected',
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTriggeredRecs() {
  return useQuery<TriggeredRecsResponse>({
    queryKey: ['triggered-recs'],
    queryFn: async () => {
      try {
        return await apiFetch<TriggeredRecsResponse>('/triggered-recs');
      } catch {
        // Gracefully degrade -- no triggers on error
        return { triggers: [], credits: [] };
      }
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    gcTime: 10 * 60_000,
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TriggeredRecsBanner() {
  const { data } = useTriggeredRecs();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [walkthroughOpen, setWalkthroughOpen] = useState<string | null>(null);

  const visible = (data?.triggers ?? []).filter((t) => t.display && !dismissed.has(t.type));
  const walkthroughTrigger = visible.find((t) => t.type === walkthroughOpen);

  if (visible.length === 0) return null;

  return (
    <div className="mb-4" data-testid="triggered-recs-banner">
      {walkthroughTrigger?.recommendation.learnMore && (
        <BreathworkWalkthrough
          template={walkthroughTrigger.recommendation.learnMore}
          open={true}
          onClose={() => setWalkthroughOpen(null)}
        />
      )}
      <AnimatePresence initial={false}>
        {visible.map((trigger) => (
          <motion.div
            key={trigger.type}
            layout
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="relative mb-3 rounded-2xl border border-teal-400/40 bg-teal-950/30 p-4 shadow-[0_0_24px_-8px_rgba(45,212,191,0.35)] backdrop-blur-sm"
          >
            {/* Dismiss */}
            <button
              type="button"
              aria-label="Dismiss recommendation"
              onClick={() =>
                setDismissed((prev) => {
                  const next = new Set(prev);
                  next.add(trigger.type);
                  return next;
                })
              }
              className="absolute top-2 right-2 rounded-full p-1.5 text-cream/50 transition-colors hover:bg-cream/5 hover:text-cream/80 focus:outline-none focus:ring-2 focus:ring-teal-400/60"
            >
              <X size={14} strokeWidth={2.2} />
            </button>

            {/* Header */}
            <div className="flex items-start gap-3 pr-6">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-400/15 text-teal-300">
                <AlertCircle size={16} strokeWidth={2} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-300/90 font-body">
                  {TRIGGER_LABELS[trigger.type]}
                </p>
                <h3 className="mt-0.5 text-base font-semibold text-cream font-display leading-snug">
                  {trigger.recommendation.title}
                </h3>
              </div>
            </div>

            {/* Body */}
            <p className="mt-3 text-sm text-cream/75 leading-relaxed font-body">
              {trigger.recommendation.body}
            </p>

            {/* Learn more (breathwork / herb details) */}
            {trigger.recommendation.learnMore && (
              <button
                type="button"
                onClick={() => setWalkthroughOpen(trigger.type)}
                className="mt-3 flex w-full items-center gap-2 rounded-lg bg-cream/[0.03] border border-cream/5 px-3 py-2 text-left hover:border-teal-400/40 hover:bg-teal-400/5 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400/60"
                aria-label={`Open ${trigger.recommendation.learnMore.name} walkthrough`}
              >
                <Sparkles size={14} className="text-teal-300/80 shrink-0" strokeWidth={2} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-cream/90 truncate font-body">
                    {trigger.recommendation.learnMore.name}
                  </p>
                  <p className="text-[11px] text-cream/50 truncate font-body">
                    {trigger.recommendation.learnMore.durationMinutes} min
                    {' · '}
                    {trigger.recommendation.tradition}
                  </p>
                </div>
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
