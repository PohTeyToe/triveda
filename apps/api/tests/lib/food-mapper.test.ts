import { describe, expect, it } from 'bun:test';
import type { Food } from '@triveda/db';
import { toFoodForScoring, toFoodsForScoring } from '../../src/lib/food-mapper.js';

/**
 * Build a minimal Food fixture matching the Drizzle-inferred type.
 * All snake_case fields match Postgres column names.
 */
function makeFood(overrides: Partial<Food> = {}): Food {
  return {
    id: 'food-001',
    name: 'Turmeric',
    name_sanskrit: 'Haridra',
    name_chinese: null,
    category: 'spice',
    subcategory: 'root',
    description: 'A warming root spice.',
    // Ayurveda columns
    rasa: ['bitter', 'pungent'],
    virya: 'hot',
    vipaka: 'pungent',
    guna: ['light', 'dry'],
    vata_effect: -1,
    pitta_effect: 1,
    kapha_effect: -2,
    ritu_fit: {
      shishira: 0.8,
      vasanta: 0.6,
      grishma: 0.3,
      varsha: 0.7,
      sharad: 0.5,
      hemanta: 0.9,
    },
    // TCM columns
    thermal_nature: 'warm',
    flavor: ['bitter'],
    organ_affinity: ['liver', 'stomach'],
    actions: ['invigorate blood'],
    element_fit: {
      wood: 0.7,
      fire: 0.8,
      earth: 0.5,
      metal: 0.3,
      water: 0.4,
    },
    // Evidence / naturopathy
    glycemic_index: 15,
    bioactive_compounds: [{ name: 'curcumin', amount_per_100g: 3100, unit: 'mg' }],
    contraindications: ['blood thinners', 'gallstones'],
    // Metadata
    seed_source: 'manual',
    validation_status: 'validated',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

describe('toFoodForScoring', () => {
  it('maps all snake_case DB fields to camelCase scoring fields', () => {
    const dbFood = makeFood();
    const scored = toFoodForScoring(dbFood);

    expect(scored.id).toBe('food-001');
    expect(scored.name).toBe('Turmeric');

    // Ayurveda
    expect(scored.ayurveda.vataEffect).toBe(-1);
    expect(scored.ayurveda.pittaEffect).toBe(1);
    expect(scored.ayurveda.kaphaEffect).toBe(-2);
    expect(scored.ayurveda.rituFit.shishira).toBe(0.8);
    expect(scored.ayurveda.rituFit.hemanta).toBe(0.9);

    // TCM
    expect(scored.tcm.thermalNature).toBe('warm');
    expect(scored.tcm.organAffinity).toEqual(['liver', 'stomach']);
    expect(scored.tcm.elementFit.wood).toBe(0.7);
    expect(scored.tcm.elementFit.fire).toBe(0.8);
  });

  it('preserves contraindications array', () => {
    const dbFood = makeFood({ contraindications: ['pregnancy', 'liver disease'] });
    const scored = toFoodForScoring(dbFood);

    expect(scored.contraindications).toEqual(['pregnancy', 'liver disease']);
  });

  it('handles null contraindications (defaults to undefined)', () => {
    const dbFood = makeFood({ contraindications: null });
    const scored = toFoodForScoring(dbFood);

    expect(scored.contraindications).toBeUndefined();
  });

  it('handles empty contraindications array', () => {
    const dbFood = makeFood({ contraindications: [] });
    const scored = toFoodForScoring(dbFood);

    expect(scored.contraindications).toEqual([]);
  });

  it('builds tags from category and subcategory', () => {
    const dbFood = makeFood({ category: 'vegetable', subcategory: 'leafy' });
    const scored = toFoodForScoring(dbFood);

    expect(scored.tags).toContain('vegetable');
    expect(scored.tags).toContain('leafy');
  });

  it('builds tags with only category when subcategory is null', () => {
    const dbFood = makeFood({ category: 'grain', subcategory: null });
    const scored = toFoodForScoring(dbFood);

    expect(scored.tags).toEqual(['grain']);
  });

  it('maps ritu_fit object keys correctly', () => {
    const rituFit = {
      shishira: 0.1,
      vasanta: 0.2,
      grishma: 0.3,
      varsha: 0.4,
      sharad: 0.5,
      hemanta: 0.6,
    };
    const dbFood = makeFood({ ritu_fit: rituFit });
    const scored = toFoodForScoring(dbFood);

    expect(scored.ayurveda.rituFit).toEqual(rituFit);
  });

  it('maps element_fit object keys correctly', () => {
    const elementFit = {
      wood: 0.1,
      fire: 0.2,
      earth: 0.3,
      metal: 0.4,
      water: 0.5,
    };
    const dbFood = makeFood({ element_fit: elementFit });
    const scored = toFoodForScoring(dbFood);

    expect(scored.tcm.elementFit).toEqual(elementFit);
  });

  it('maps extreme dosha effect values correctly', () => {
    const dbFood = makeFood({
      vata_effect: -2,
      pitta_effect: 2,
      kapha_effect: 0,
    });
    const scored = toFoodForScoring(dbFood);

    expect(scored.ayurveda.vataEffect).toBe(-2);
    expect(scored.ayurveda.pittaEffect).toBe(2);
    expect(scored.ayurveda.kaphaEffect).toBe(0);
  });

  it('output has no snake_case keys at the top level', () => {
    const dbFood = makeFood();
    const scored = toFoodForScoring(dbFood);
    const keys = Object.keys(scored);

    // None of these snake_case DB fields should appear
    expect(keys).not.toContain('vata_effect');
    expect(keys).not.toContain('pitta_effect');
    expect(keys).not.toContain('kapha_effect');
    expect(keys).not.toContain('ritu_fit');
    expect(keys).not.toContain('thermal_nature');
    expect(keys).not.toContain('organ_affinity');
    expect(keys).not.toContain('element_fit');
  });
});

describe('toFoodsForScoring', () => {
  it('maps an array of DB foods', () => {
    const foods = [
      makeFood({ id: 'a', name: 'Ginger' }),
      makeFood({ id: 'b', name: 'Basil' }),
      makeFood({ id: 'c', name: 'Cumin' }),
    ];
    const scored = toFoodsForScoring(foods);

    expect(scored).toHaveLength(3);
    expect(scored[0]?.id).toBe('a');
    expect(scored[0]?.name).toBe('Ginger');
    expect(scored[2]?.id).toBe('c');
    expect(scored[2]?.name).toBe('Cumin');
  });

  it('returns empty array for empty input', () => {
    expect(toFoodsForScoring([])).toEqual([]);
  });
});
