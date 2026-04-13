/**
 * WeeklyHerbScreen -- displays this week's recommended herb.
 * Fetches from /api/v1/weekly-herb and shows herb name, description,
 * tradition notes (if available), and usage suggestions.
 */

import { motion } from 'framer-motion';
import { Leaf, Loader2, Sprout } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cardEntranceProps, staggerContainer, staggerItem } from '../../lib/animations';
import { apiFetch } from '../../lib/api-client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WeeklyHerbResponse {
  herb: { id: string; name: string; description: string } | null;
  traditionNotes: {
    ayurveda?: string;
    tcm?: string;
    naturopathy?: string;
  } | null;
  traditionNotesPending: boolean;
  credits: Array<{
    featureId: string;
    featureName: string;
    active: boolean;
    contribution: string;
  }> | null;
  nextDeliveryDate: string | null;
  reason: string | null;
}

// ---------------------------------------------------------------------------
// Usage suggestions (static for demo)
// ---------------------------------------------------------------------------

const USAGE_SUGGESTIONS = [
  { icon: '🍵', label: 'Tea', tip: 'Steep 1 tsp dried herb in hot water for 5-10 minutes' },
  { icon: '🍳', label: 'Cooking', tip: 'Add to soups, stews, or grain bowls' },
  { icon: '💊', label: 'Supplement', tip: 'Available as capsules or tincture at health stores' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WeeklyHerbScreen() {
  const [data, setData] = useState<WeeklyHerbResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiFetch<WeeklyHerbResponse>('/weekly-herb')
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center gap-3 text-cream/40">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="text-sm font-body">Loading your weekly herb...</p>
      </div>
    );
  }

  // Error or no herb available
  if (error || !data?.herb) {
    return (
      <motion.div {...cardEntranceProps} className="py-12">
        <div className="bg-dark-elevated rounded-2xl p-8 text-center">
          <Sprout className="w-10 h-10 text-teal/30 mx-auto mb-4" />
          <h2 className="font-heading text-xl font-bold text-cream mb-2">Weekly Herb</h2>
          <p className="text-sm text-cream/50 font-body leading-relaxed max-w-xs mx-auto">
            {data?.reason === 'profile_incomplete'
              ? 'Complete your constitution profile to receive personalized weekly herb recommendations.'
              : 'Your weekly herb recommendation will appear here.'}
          </p>
        </div>
      </motion.div>
    );
  }

  const { herb, traditionNotes, traditionNotesPending } = data;

  return (
    <div className="py-6 space-y-5">
      {/* Header */}
      <motion.div {...cardEntranceProps}>
        <p className="text-xs text-cream/40 font-body uppercase tracking-widest mb-1">
          This Week's Herb
        </p>
      </motion.div>

      {/* Main herb card */}
      <motion.div {...cardEntranceProps} className="bg-dark-elevated rounded-2xl p-5">
        {/* Herb image placeholder */}
        <div className="bg-dark-surface-high rounded-xl h-40 flex items-center justify-center mb-4">
          <Leaf className="w-12 h-12 text-teal/30" />
        </div>

        <h1 className="font-heading text-2xl font-bold text-teal tracking-tight capitalize">
          {herb.name}
        </h1>
        <p className="font-body text-sm text-cream/70 leading-relaxed mt-2">{herb.description}</p>
      </motion.div>

      {/* Tradition perspectives */}
      {(traditionNotes || traditionNotesPending) && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          <p className="text-xs text-cream/40 font-body uppercase tracking-widest">
            Traditional Perspectives
          </p>

          {traditionNotesPending && !traditionNotes ? (
            <motion.div
              variants={staggerItem}
              className="bg-dark-elevated rounded-xl p-4 flex items-center gap-3"
            >
              <Loader2 className="w-4 h-4 animate-spin text-teal/50" />
              <p className="text-sm text-cream/50 font-body">
                Tradition notes are being prepared...
              </p>
            </motion.div>
          ) : null}

          {traditionNotes?.ayurveda && (
            <motion.div variants={staggerItem} className="bg-dark-elevated rounded-xl p-4">
              <p className="text-xs text-terracotta font-medium mb-1">Ayurveda</p>
              <p className="text-sm text-cream/70 font-body leading-relaxed">
                {traditionNotes.ayurveda}
              </p>
            </motion.div>
          )}

          {traditionNotes?.tcm && (
            <motion.div variants={staggerItem} className="bg-dark-elevated rounded-xl p-4">
              <p className="text-xs text-amber-400 font-medium mb-1">
                Traditional Chinese Medicine
              </p>
              <p className="text-sm text-cream/70 font-body leading-relaxed">
                {traditionNotes.tcm}
              </p>
            </motion.div>
          )}

          {traditionNotes?.naturopathy && (
            <motion.div variants={staggerItem} className="bg-dark-elevated rounded-xl p-4">
              <p className="text-xs text-green font-medium mb-1">Naturopathy</p>
              <p className="text-sm text-cream/70 font-body leading-relaxed">
                {traditionNotes.naturopathy}
              </p>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* How to incorporate */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        <p className="text-xs text-cream/40 font-body uppercase tracking-widest">
          How to Incorporate
        </p>

        {USAGE_SUGGESTIONS.map((s) => (
          <motion.div
            key={s.label}
            variants={staggerItem}
            className="bg-dark-elevated rounded-xl p-4 flex items-start gap-3"
          >
            <span className="text-xl" aria-hidden="true">
              {s.icon}
            </span>
            <div>
              <p className="text-sm font-medium text-cream">{s.label}</p>
              <p className="text-xs text-cream/50 font-body mt-0.5">{s.tip}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
