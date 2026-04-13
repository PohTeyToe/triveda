/**
 * TraditionSection -- expandable section for one tradition within the Why panel.
 * Shows plain-English title, expand/collapse with motion animation,
 * and streaming state rendering (idle/streaming/complete/error).
 */

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useTraditionStream } from '../../hooks/useTraditionStream';
import { sectionExpandProps } from '../../lib/animations';

type TraditionSectionProps = {
  title: string;
  tradition: 'ayurveda' | 'tcm' | 'naturopathy';
};

export function TraditionSection({ title, tradition }: TraditionSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const traditions = useTraditionStream();
  const traditionState = traditions[tradition];
  const contentId = `${tradition}-content`;

  return (
    <div
      className="bg-dark-surface-high rounded-xl p-4 mt-2"
      data-testid={`tradition-section-${tradition}`}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className="
          w-full flex items-center justify-between
          min-h-[44px]
          focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-dark
          rounded
        "
      >
        <span className="font-body text-xs uppercase tracking-wider text-cream/40">{title}</span>
        <ChevronDown
          className={`w-4 h-4 text-cream/30 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence initial={sectionExpandProps.initial}>
        {isOpen && (
          <motion.div
            id={contentId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={sectionExpandProps.transition}
            style={{ overflow: 'hidden' }}
          >
            <div className="pt-2">
              <TraditionContent state={traditionState.state} text={traditionState.text} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Content sub-component rendering based on stream state
// ---------------------------------------------------------------------------

function TraditionContent({
  state,
  text,
}: {
  state: 'idle' | 'streaming' | 'complete' | 'error';
  text: string;
}) {
  if (state === 'idle') {
    return <p className="font-body text-sm text-cream/40">Loading...</p>;
  }

  if (state === 'streaming') {
    return (
      <p className="font-body text-sm text-cream/70 leading-relaxed">
        {text}
        <motion.span
          className="bg-teal rounded-full w-2 h-2 inline-block ml-1"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY }}
          data-testid="shimmer-dot"
        />
      </p>
    );
  }

  if (state === 'error') {
    return (
      <div>
        {text && <p className="font-body text-sm text-cream/70 leading-relaxed mb-1">{text}</p>}
        <p className="font-body text-sm text-cream/30 italic">
          Could not finish loading this section
        </p>
      </div>
    );
  }

  // complete
  return <p className="font-body text-sm text-cream/70 leading-relaxed">{text}</p>;
}
