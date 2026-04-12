import { forwardRef, memo } from 'react';
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
      <div
        ref={ref}
        tabIndex={tabIndex}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onClick={() => onNavigate(herb.id)}
        onMouseEnter={() => onPrefetch(herb.id)}
        className="flex items-center gap-3 p-3 border-b border-dark-border hover:bg-dark-surface/50 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-teal rounded"
        role="button"
      >
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
          <p className="text-sm font-medium text-light truncate">{herb.name}</p>
          <p className="text-xs text-light/40 capitalize">{herb.category}</p>
          <p className="text-xs text-light/50 truncate">{summary}</p>
        </div>

        <div className="flex gap-1 shrink-0">
          {traditions.map((t) => (
            <span
              key={t}
              className="text-[10px] px-2 py-0.5 rounded-full bg-dark-border text-light/50"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    );
  }),
);
