import { describe, expect, it } from 'vitest';
import { filterRestrictions } from '../../filters/restrictions.js';
import type { FoodForScoring, Ritu, TCMElement } from '../../types.js';

function makeFood(id: string, tags: string[]): FoodForScoring {
  return {
    id,
    name: `food-${id}`,
    tags,
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

describe('filterRestrictions', () => {
  it('food with tags [dairy, grain], restriction dairy -> filtered out', () => {
    const foods = [makeFood('1', ['dairy', 'grain'])];
    const result = filterRestrictions(foods, ['dairy']);
    expect(result).toHaveLength(0);
  });

  it('food with tags [grain, vegetable], restriction dairy -> passes', () => {
    const foods = [makeFood('1', ['grain', 'vegetable'])];
    const result = filterRestrictions(foods, ['dairy']);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('multiple restrictions [dairy, gluten], food matching one (dairy) -> filtered out', () => {
    const foods = [makeFood('1', ['dairy', 'vegetable'])];
    const result = filterRestrictions(foods, ['dairy', 'gluten']);
    expect(result).toHaveLength(0);
  });

  it('empty restrictions list -> all foods pass', () => {
    const foods = [makeFood('1', ['dairy']), makeFood('2', ['gluten'])];
    const result = filterRestrictions(foods, []);
    expect(result).toHaveLength(2);
  });

  it('food with empty tags array -> passes any restriction', () => {
    const foods = [makeFood('1', [])];
    const result = filterRestrictions(foods, ['dairy', 'gluten']);
    expect(result).toHaveLength(1);
  });

  it('restriction meat, food tags [meat, red_meat] -> filtered out (matches meat)', () => {
    const foods = [makeFood('1', ['meat', 'red_meat'])];
    const result = filterRestrictions(foods, ['meat']);
    expect(result).toHaveLength(0);
  });

  it('50 foods with 5 restrictions -> correct subset passes', () => {
    const restrictions = ['dairy', 'gluten', 'soy', 'egg', 'shellfish'];
    const foods: FoodForScoring[] = [];
    for (let i = 0; i < 50; i++) {
      // Every 3rd food has a restricted tag
      const tags = i % 3 === 0 ? [restrictions[i % 5]] : ['vegetable'];
      foods.push(makeFood(String(i), tags));
    }
    const result = filterRestrictions(foods, restrictions);
    // 50 foods, every 3rd is restricted: indices 0,3,6,9,...,48 = 17 restricted
    // 50 - 17 = 33 pass
    expect(result).toHaveLength(33);
    // Verify none of the passing foods have restricted tags
    for (const food of result) {
      for (const tag of food.tags) {
        expect(restrictions).not.toContain(tag);
      }
    }
  });
});
