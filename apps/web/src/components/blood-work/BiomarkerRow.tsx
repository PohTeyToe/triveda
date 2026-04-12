/**
 * BiomarkerRow -- single expandable table row for a biomarker.
 * Shows value, unit, reference range bar, flag badge, and confidence.
 * Expands to show TraditionContext on click.
 */

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import type { BloodWorkBiomarker } from '../../lib/types';
import { ConfidenceBadge } from './ConfidenceBadge';
import { FlagBadge } from './FlagBadge';
import { ReferenceRangeBar } from './ReferenceRangeBar';
import { TraditionContext } from './TraditionContext';

interface BiomarkerRowProps {
  biomarker: BloodWorkBiomarker;
}

export function BiomarkerRow({ biomarker }: BiomarkerRowProps) {
  const [expanded, setExpanded] = useState(false);
  const contextId = `tradition-context-${biomarker.id}`;

  const isLowConfidence = biomarker.confidence < 0.8;
  const rowBgClass = isLowConfidence ? 'bg-amber-500/5' : '';

  return (
    <>
      <tr
        className={`cursor-pointer hover:bg-dark-border/10 dark:hover:bg-dark-border/10 transition-colors ${rowBgClass}`}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded(!expanded);
          }
        }}
        tabIndex={0}
        role="button"
        aria-expanded={expanded}
        aria-controls={contextId}
      >
        <td className="px-3 py-2.5 text-sm font-medium text-light/90 dark:text-light/90">
          <div className="flex items-center gap-2">
            <span>{biomarker.displayName}</span>
            {biomarker.manuallyCorrected && (
              <span className="text-[10px] px-1 py-0.5 rounded bg-teal-500/15 text-teal-400">
                corrected
              </span>
            )}
          </div>
        </td>
        <td className="px-3 py-2.5 text-sm text-light/70 dark:text-light/70 tabular-nums">
          {biomarker.value} {biomarker.unit}
        </td>
        <td className="px-3 py-2.5 w-32">
          <ReferenceRangeBar
            value={biomarker.value}
            low={biomarker.referenceRangeLow}
            high={biomarker.referenceRangeHigh}
            displayName={biomarker.displayName}
            unit={biomarker.unit}
          />
        </td>
        <td className="px-3 py-2.5">
          <FlagBadge flag={biomarker.flag} />
        </td>
        <td className="px-3 py-2.5">
          <ConfidenceBadge confidence={biomarker.confidence} />
        </td>
      </tr>

      <AnimatePresence>
        {expanded && biomarker.traditionContext && (
          <tr id={contextId}>
            <td colSpan={5} className="p-0">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <TraditionContext context={biomarker.traditionContext} />
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
}
