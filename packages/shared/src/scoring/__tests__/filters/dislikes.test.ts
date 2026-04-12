import { describe, expect, it } from 'vitest';
import { filterDislikes } from '../../filters/dislikes.js';
import type { FoodForScoring, Ritu, TCMElement } from '../../types.js';

function makeFood(id: string): FoodForScoring {
  return {
    id,
    name: `food-${id}`,
    tags: [],
    contraindications: undefined,
    ayurveda: {
      vataEffect: 0,
      pittaEffect: 0,
      kaphaEffect: 0,
      rituFit: {
        shishira: 0.5,
        vasanta: 0.5,
        grishma: 0.5,
        varsha: 0.5,
        sharad: 0.5,
        hemanta: 0.5,
      } as Record<Ritu, number>,
    },
    tcm: {
      thermalNature: 'neutral',
      organAffinity: [],
      elementFit: {
        wood: 0.5,
        fire: 0.5,
        earth: 0.5,
        metal: 0.5,
        water: 0.5,
      } as Record<TCMElement, number>,
    },
  };
}

describe('filterDislikes', () => {
  it('food with id food-123, dislike list includes food-123 -> filtered out', () => {
    const foods = [makeFood('food-123')];
    const result = filterDislikes(foods, ['food-123']);
    expect(result).toHaveLength(0);
  });

  it('food with id food-456, dislike list does not include -> passes', () => {
    const foods = [makeFood('food-456')];
    const result = filterDislikes(foods, ['food-123']);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('food-456');
  });

  it('empty dislike list -> all foods pass', () => {
    const foods = [makeFood('food-1'), makeFood('food-2')];
    const result = filterDislikes(foods, []);
    expect(result).toHaveLength(2);
  });

  it('dislike list with 3 IDs, 10 foods -> only matching IDs removed', () => {
    const foods = Array.from({ length: 10 }, (_, i) => makeFood(`food-${i}`));
    const dislikes = ['food-2', 'food-5', 'food-8'];
    const result = filterDislikes(foods, dislikes);
    expect(result).toHaveLength(7);
    const resultIds = result.map((f) => f.id);
    expect(resultIds).not.toContain('food-2');
    expect(resultIds).not.toContain('food-5');
    expect(resultIds).not.toContain('food-8');
  });
});
