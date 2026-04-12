import { forwardRef, memo } from 'react';
import type { BrowseFood } from '../../lib/types';
import { GlyphFallback } from './GlyphFallback';

interface FoodCardProps {
  food: BrowseFood;
  onNavigate: (foodId: string) => void;
  onPrefetch: (foodId: string) => void;
  tabIndex?: number;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onFocus?: () => void;
}

function buildSummary(food: BrowseFood): string {
  const parts: string[] = [];
  if (food.rasa?.[0]) parts.push(food.rasa[0]);
  if (food.virya)
    parts.push(
      food.virya === 'sheeta' ? 'cooling' : food.virya === 'ushna' ? 'heating' : food.virya,
    );
  if (food.dosha_effects) {
    const effects = Object.entries(food.dosha_effects) as [string, number][];
    const pacifying = effects.find(([, v]) => v < 0);
    if (pacifying) parts.push(`${pacifying[0]}-pacifying`);
  }
  return parts.length > 0 ? parts.join(', ') : food.category;
}

function getTraditions(food: BrowseFood): string[] {
  if (food.traditions?.length) return food.traditions;
  const t: string[] = [];
  if (food.rasa?.length || food.virya) t.push('Ayurveda');
  if (food.thermal_nature || food.tcm_flavor?.length) t.push('TCM');
  if (food.glycemic_index != null || food.bioactive_compounds?.length) t.push('Naturopathy');
  return t.length > 0 ? t : ['Ayurveda', 'TCM', 'Naturopathy'];
}

export const FoodCard = memo(
  forwardRef<HTMLDivElement, FoodCardProps>(function FoodCard(
    { food, onNavigate, onPrefetch, tabIndex, onKeyDown, onFocus },
    ref,
  ) {
    const summary = buildSummary(food);
    const traditions = getTraditions(food);

    return (
      <div
        ref={ref}
        tabIndex={tabIndex}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onClick={() => onNavigate(food.id)}
        onMouseEnter={() => onPrefetch(food.id)}
        className="flex items-center gap-3 p-3 border-b border-dark-border hover:bg-dark-surface/50 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-teal rounded"
        role="button"
      >
        {/* Image or glyph */}
        {food.image_url ? (
          <img
            src={food.image_url}
            alt={food.name}
            className="w-12 h-12 rounded-full object-cover shrink-0"
          />
        ) : (
          <GlyphFallback name={food.name} category={food.category} size={48} />
        )}

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-light truncate">{food.name}</p>
          <p className="text-xs text-light/40 capitalize">{food.category}</p>
          <p className="text-xs text-light/50 truncate">{summary}</p>
        </div>

        {/* Tradition chips */}
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
