import { motion } from 'framer-motion';
import { forwardRef, memo } from 'react';
import { foodCardTap, staggerItem } from '../../lib/animations';
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
      <motion.div
        ref={ref}
        variants={staggerItem}
        whileTap={foodCardTap.whileTap}
        tabIndex={tabIndex}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onClick={() => onNavigate(food.id)}
        onMouseEnter={() => onPrefetch(food.id)}
        className="bg-dark-elevated rounded-2xl p-4 cursor-pointer transition-colors hover:bg-dark-surface-high focus:outline-none focus:ring-2 focus:ring-teal"
      >
        <div className="flex items-center gap-3">
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
            <p className="font-heading text-lg font-bold text-cream truncate">{food.name}</p>
            <p className="font-body text-xs text-cream/40 uppercase tracking-wider">
              {food.category}
            </p>
          </div>
        </div>

        {/* Property tags */}
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
