import type { Food } from '@triveda/db';
import type { FoodForScoring } from '@triveda/shared';

/**
 * Map a snake_case DB food row to the camelCase FoodForScoring
 * interface used by the scoring engine.
 *
 * This is the bridge between split 03 (DB / Drizzle) and split 04
 * (scoring engine). The scoring engine never sees snake_case keys.
 *
 * The Food type from @triveda/db has snake_case fields matching
 * Postgres columns (vata_effect, pitta_effect, etc.). The scoring
 * engine's FoodForScoring uses camelCase (vataEffect, pittaEffect).
 */
export function toFoodForScoring(food: Food): FoodForScoring {
  return {
    id: food.id,
    name: food.name,
    tags: buildTags(food),
    contraindications: food.contraindications ?? undefined,
    ayurveda: {
      vataEffect: food.vata_effect,
      pittaEffect: food.pitta_effect,
      kaphaEffect: food.kapha_effect,
      rituFit: food.ritu_fit,
    },
    tcm: {
      thermalNature: food.thermal_nature as FoodForScoring['tcm']['thermalNature'],
      organAffinity: food.organ_affinity,
      elementFit: food.element_fit,
    },
  };
}

/**
 * Build tags from the food's category and subcategory.
 * The DB schema stores category/subcategory as separate columns,
 * but the scoring engine uses a flat tags array for filtering.
 */
function buildTags(food: Food): string[] {
  const tags: string[] = [];
  if (food.category) tags.push(food.category);
  if (food.subcategory) tags.push(food.subcategory);
  return tags;
}

/**
 * Batch-map an array of DB food rows to scoring inputs.
 */
export function toFoodsForScoring(foods: Food[]): FoodForScoring[] {
  return foods.map(toFoodForScoring);
}
