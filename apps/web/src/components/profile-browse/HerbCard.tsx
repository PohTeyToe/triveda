import { motion } from 'framer-motion';
import { forwardRef, memo } from 'react';
import { foodCardTap, staggerItem } from '../../lib/animations';
import type { BrowseHerb } from '../../lib/types';
import { GlyphFallback } from './GlyphFallback';

interface HerbCardProps {
  herb: BrowseHerb;
  onNavigate: (herbId: string) => void;
  onPrefetch: (herbId: string) => void;
  tabIndex?: number;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onFocus?: () => void;
}

function buildSummary(herb: BrowseHerb): string {
  if (herb.herb_actions?.length) {
    return herb.herb_actions.slice(0, 3).join(', ');
  }
  return herb.category;
}

function getTraditions(herb: BrowseHerb): string[] {
  if (herb.traditions?.length) return herb.traditions;
  const t: string[] = [];
  if (herb.rasa?.length || herb.virya) t.push('Ayurveda');
  if (herb.thermal_nature || herb.tcm_flavor?.length) t.push('TCM');
  if (herb.bioactive_compounds?.length) t.push('Naturopathy');
  return t.length > 0 ? t : ['Ayurveda', 'TCM', 'Naturopathy'];
}

export const HerbCard = memo(
  forwardRef<HTMLDivElement, HerbCardProps>(function HerbCard(
    { herb, onNavigate, onPrefetch, tabIndex, onKeyDown, onFocus },
    ref,
  ) {
    const summary = buildSummary(herb);
    const traditions = getTraditions(herb);

    return (
      <motion.div
        ref={ref}
        variants={staggerItem}
        whileTap={foodCardTap.whileTap}
        tabIndex={tabIndex}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onClick={() => onNavigate(herb.id)}
        onMouseEnter={() => onPrefetch(herb.id)}
        className="bg-dark-elevated rounded-2xl p-4 cursor-pointer transition-colors hover:bg-dark-surface-high focus:outline-none focus:ring-2 focus:ring-teal"
      >
        <div className="flex items-center gap-3">
          {herb.image_url ? (
            <img
              src={herb.image_url}
              alt={herb.name}
              className="w-12 h-12 rounded-full object-cover shrink-0"
            />
          ) : (
            <GlyphFallback name={herb.name} category={herb.category} size={48} />
          )}

          <div className="flex-1 min-w-0">
            <p className="font-heading text-lg font-bold text-cream truncate">{herb.name}</p>
            <p className="font-body text-xs text-cream/40 uppercase tracking-wider">
              {herb.category}
            </p>
          </div>
        </div>

        {/* Action tags */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {summary.split(', ').map((tag) => (
            <span
              key={tag}
              className="font-body text-xs text-cream/50 bg-dark-surface-high rounded-full px-2.5 py-0.5"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Tradition chips */}
        <div className="mt-2 flex gap-1.5">
          {traditions.map((t) => (
            <span
              key={t}
              className="font-body text-[10px] text-parchment/60 bg-dark-surface-low rounded-full px-2 py-0.5"
            >
              {t}
            </span>
          ))}
        </div>
      </motion.div>
    );
  }),
);
