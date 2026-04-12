import { describe, expect, it } from 'vitest';
import { filterAllergies } from '../../filters/allergies.js';
import type { FoodForScoring, Ritu, TCMElement } from '../../types.js';

function makeFood(id: string, tags: string[], contraindications?: string[]): FoodForScoring {
  return {
    id,
    name: `food-${id}`,
    tags,
    contraindications,
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

describe('filterAllergies', () => {
  it('food with tags including tree_nut, allergy tree_nut -> filtered out', () => {
    const foods = [makeFood('1', ['tree_nut', 'grain'])];
    const result = filterAllergies(foods, ['tree_nut']);
    expect(result).toHaveLength(0);
  });

  it('food with contraindications including shellfish, allergy shellfish -> filtered out', () => {
    const foods = [makeFood('1', ['vegetable'], ['shellfish'])];
    const result = filterAllergies(foods, ['shellfish']);
    expect(result).toHaveLength(0);
  });

  it('food with neither tags nor contraindications matching -> passes', () => {
    const foods = [makeFood('1', ['grain'], ['lactose'])];
    const result = filterAllergies(foods, ['shellfish']);
    expect(result).toHaveLength(1);
  });

  it('food with undefined contraindications -> only tags checked, no crash', () => {
    const foods = [makeFood('1', ['grain'], undefined)];
    const result = filterAllergies(foods, ['shellfish']);
    expect(result).toHaveLength(1);
  });

  it('empty allergies list -> all foods pass', () => {
    const foods = [makeFood('1', ['tree_nut'], ['shellfish']), makeFood('2', ['dairy'])];
    const result = filterAllergies(foods, []);
    expect(result).toHaveLength(2);
  });
});
