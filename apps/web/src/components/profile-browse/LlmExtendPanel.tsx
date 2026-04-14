/**
 * LlmExtendPanel -- side panel (desktop) / bottom drawer (mobile) that
 * shows the AI generation progress and result for a food not in the DB.
 *
 * Responsive layout:
 *   < 1024px: Vaul Drawer, 70% height, bottom
 *   >= 1024px: fixed aside on the right, 400px wide
 */

import { AnimatePresence, motion } from 'framer-motion';
import { Clock, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Drawer } from 'vaul';
import { useFoodDetail } from '../../hooks/profile-browse';
import type { BrowseFood } from '../../lib/types';
import { ConfidenceBadge } from './ConfidenceBadge';
import { GlyphFallback } from './GlyphFallback';
import { TraditionSection } from './TraditionSection';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface LlmExtendPanelProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'idle' | 'streaming' | 'complete' | 'error';
  progress: { stage: string; percent: number } | null;
  generatedFood: BrowseFood | null;
  error: { message: string; closestMatchId?: string } | null;
  query: string;
  onRetry: () => void;
  onSave: () => void;
  onNavigateToMatch?: (foodId: string) => void;
  isSaved?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stageLabel(percent: number): string {
  if (percent < 34) return 'Generating Ayurveda properties...';
  if (percent < 67) return 'Generating TCM properties...';
  if (percent < 100) return 'Generating Naturopathy properties...';
  return 'Finalizing...';
}

// ---------------------------------------------------------------------------
// Shared inner content (used by both desktop aside and mobile drawer)
// ---------------------------------------------------------------------------

function PanelContent(props: LlmExtendPanelProps) {
  const {
    status,
    progress,
    generatedFood,
    error,
    query,
    onClose,
    onRetry,
    onSave,
    onNavigateToMatch,
    isSaved,
  } = props;

  const canClose = status !== 'streaming';

  return (
    <div
      className="h-full flex flex-col bg-dark-surface text-cream overflow-hidden"
      data-testid="llm-extend-panel"
    >
      {/* Close button */}
      {canClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 p-2 rounded-full hover:bg-dark-elevated transition-colors focus:outline-none focus:ring-2 focus:ring-teal"
        >
          <X className="w-4 h-4 text-cream/70" />
        </button>
      )}

      <div className="flex-1 overflow-y-auto p-6 pt-8">
        {status === 'streaming' && <StreamingBody progress={progress} query={query} />}
        {status === 'complete' && generatedFood && (
          <CompleteBody food={generatedFood} onSave={onSave} isSaved={isSaved} />
        )}
        {status === 'error' && error && (
          <ErrorBody error={error} onRetry={onRetry} onNavigateToMatch={onNavigateToMatch} />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Streaming body
// ---------------------------------------------------------------------------

function StreamingBody({
  progress,
  query,
}: {
  progress: { stage: string; percent: number } | null;
  query: string;
}) {
  const percent = progress?.percent ?? 0;
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-teal" aria-hidden="true" />
        <h2 className="font-heading text-xl text-cream">Generating {query}...</h2>
      </div>

      <div
        className="relative w-full bg-dark-surface rounded-full overflow-hidden mb-3"
        style={{ height: 6 }}
        role="progressbar"
        tabIndex={0}
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Generation progress: ${Math.round(percent)}%`}
      >
        <motion.div
          className="absolute top-0 left-0 h-full bg-teal rounded-full"
          initial={{ width: 0 }}
          animate={{
            width: `${percent}%`,
            opacity: [1, 0.7, 1],
          }}
          transition={{
            width: { duration: 0.4 },
            opacity: { duration: 1.2, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' },
          }}
        />
      </div>

      <p className="text-xs text-cream/50 font-body" aria-live="polite">
        {stageLabel(percent)}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Complete body
// ---------------------------------------------------------------------------

function CompleteBody({
  food,
  onSave,
  isSaved,
}: {
  food: BrowseFood;
  onSave: () => void;
  isSaved?: boolean;
}) {
  const confidence = food.confidence_score ?? 0.5;
  return (
    <div>
      <h2 className="font-heading text-2xl text-cream mb-3">{food.name}</h2>

      <div
        className="flex items-start gap-2 rounded-lg px-3 py-2 mb-4 bg-amber-500/20 text-amber-400"
        data-testid="pending-validation-badge"
      >
        <Clock className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
        <p className="text-xs font-body leading-snug">
          Pending validation -- this entry was generated by AI and has not been verified.
        </p>
      </div>

      <div className="flex justify-center mb-4">
        <GlyphFallback name={food.name} category={food.category} size={200} />
      </div>

      <div className="mb-4">
        <ConfidenceBadge score={confidence} />
      </div>

      <div className="mb-6 space-y-0">
        <TraditionSection title="Ayurveda" id="llm-ayurveda" defaultExpanded={false}>
          <AyurvedaSummary food={food} />
        </TraditionSection>
        <TraditionSection title="TCM" id="llm-tcm" defaultExpanded={false}>
          <TcmSummary food={food} />
        </TraditionSection>
        <TraditionSection title="Naturopathy" id="llm-naturopathy" defaultExpanded={false}>
          <NaturopathySummary food={food} />
        </TraditionSection>
      </div>

      <button
        type="button"
        onClick={onSave}
        disabled={isSaved}
        className={`w-full rounded-full px-4 py-3 font-body font-medium text-sm transition-colors min-h-[44px] ${
          isSaved
            ? 'bg-dark-elevated text-cream/50 cursor-not-allowed'
            : 'bg-teal text-dark hover:bg-teal/90'
        }`}
      >
        {isSaved ? 'Saved to browse history' : 'Save to my browse history'}
      </button>
    </div>
  );
}

function AyurvedaSummary({ food }: { food: BrowseFood }) {
  return (
    <div className="space-y-2 text-sm">
      {food.rasa?.length ? <InfoRow label="Rasa" value={food.rasa.join(', ')} /> : null}
      {food.virya ? <InfoRow label="Virya" value={food.virya} /> : null}
      {food.vipaka ? <InfoRow label="Vipaka" value={food.vipaka} /> : null}
      {food.guna?.length ? <InfoRow label="Guna" value={food.guna.join(', ')} /> : null}
      {food.dosha_effects ? (
        <InfoRow
          label="Dosha"
          value={Object.entries(food.dosha_effects)
            .map(([d, e]) => `${d}: ${e > 0 ? '+' : ''}${e}`)
            .join(' | ')}
        />
      ) : null}
    </div>
  );
}

function TcmSummary({ food }: { food: BrowseFood }) {
  return (
    <div className="space-y-2 text-sm">
      {food.thermal_nature ? <InfoRow label="Thermal" value={food.thermal_nature} /> : null}
      {food.tcm_flavor?.length ? (
        <InfoRow label="Flavor" value={food.tcm_flavor.join(', ')} />
      ) : null}
      {food.organ_affinity?.length ? (
        <InfoRow label="Organs" value={food.organ_affinity.join(', ')} />
      ) : null}
      {food.tcm_actions?.length ? (
        <InfoRow label="Actions" value={food.tcm_actions.join(', ')} />
      ) : null}
    </div>
  );
}

function NaturopathySummary({ food }: { food: BrowseFood }) {
  return (
    <div className="space-y-2 text-sm">
      {food.glycemic_index != null ? (
        <InfoRow label="GI" value={String(food.glycemic_index)} />
      ) : null}
      {food.bioactive_compounds?.length ? (
        <div>
          <p className="text-xs text-cream/40 mb-1">Bioactive compounds</p>
          <ul className="text-xs text-cream/70 space-y-0.5">
            {food.bioactive_compounds.slice(0, 4).map((c) => (
              <li key={c.name}>
                {c.name}: {c.amount} {c.unit}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {food.evidence_claims?.length ? (
        <div>
          <p className="text-xs text-cream/40 mb-1">Evidence</p>
          <ul className="text-xs text-cream/70 space-y-1">
            {food.evidence_claims.slice(0, 3).map((claim) => (
              <li key={claim.claim}>{claim.claim}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-xs">
      <span className="text-cream/40 w-16 shrink-0 capitalize">{label}</span>
      <span className="text-cream/80 capitalize">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error body
// ---------------------------------------------------------------------------

function ErrorBody({
  error,
  onRetry,
  onNavigateToMatch,
}: {
  error: { message: string; closestMatchId?: string };
  onRetry: () => void;
  onNavigateToMatch?: (foodId: string) => void;
}) {
  const closest = useFoodDetail(error.closestMatchId);

  return (
    <div>
      <h2 className="font-heading text-lg text-cream mb-3">Could not generate this entry</h2>
      <p className="text-sm text-cream/60 mb-4 font-body">{error.message}</p>

      {error.closestMatchId && (
        <p className="text-sm mb-4">
          <button
            type="button"
            onClick={() => {
              if (error.closestMatchId) onNavigateToMatch?.(error.closestMatchId);
            }}
            className="text-teal hover:underline focus:outline-none focus:ring-2 focus:ring-teal rounded"
          >
            Did you mean {closest.data?.name ?? 'loading...'}?
          </button>
        </p>
      )}

      <button
        type="button"
        onClick={onRetry}
        className="w-full rounded-full border border-teal text-teal px-4 py-3 text-sm font-body font-medium hover:bg-teal/10 transition-colors min-h-[44px]"
      >
        Try again
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Public component -- responsive wrapper
// ---------------------------------------------------------------------------

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(min-width: 1024px)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return isDesktop;
}

export function LlmExtendPanel(props: LlmExtendPanelProps) {
  const { isOpen, status, onClose } = props;
  const isDesktop = useIsDesktop();

  // Prevent the drawer from closing while streaming
  const dismissible = status !== 'streaming';

  if (isDesktop) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={dismissible ? onClose : undefined}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-screen w-[400px] z-50 shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-label="AI-generated food entry"
            >
              <PanelContent {...props} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && dismissible) onClose();
      }}
      dismissible={dismissible}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 h-[70vh] rounded-t-2xl outline-none">
          <Drawer.Title className="sr-only">AI-generated food entry</Drawer.Title>
          <div className="h-full">
            <div className="mx-auto w-12 h-1.5 rounded-full bg-cream/20 mt-2 mb-1" />
            <div className="h-[calc(100%-1rem)]">
              <PanelContent {...props} />
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
