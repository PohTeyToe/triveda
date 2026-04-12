import { describe, expect, it } from 'vitest';
import { filterCandidates } from '../../filters/index.js';
import type { FoodForScoring, Ritu, ScoringContext, TCMElement } from '../../types.js';

function makeFood(id: string, tags: string[] = [], contraindications?: string[]): FoodForScoring {
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

function makeContext(overrides: Partial<ScoringContext> = {}): ScoringContext {
  return {
    seasonal: {
      ayurvedaRitu: 'hemanta',
      tcmPhase: 'water',
      isTransition: false,
      transitionProgress: 0,
      seasonalIntensity: 1.0,
    },
    weather: {
      thermalNeed: 0,
      kaphaAggravation: 0,
      vataAggravation: 0,
      pittaAggravation: 0,
      tcmWindPattern: 'none',
    },
    organClock: {
      activeOrgan: 'stomach',
      pairedOrgan: 'spleen',
      element: 'earth',
      isDigestiveWindow: true,
      isWindDownWindow: false,
    },
    recentFoods: [],
    dietaryRestrictions: [],
    allergies: [],
    explicitDislikes: [],
    today: '2026-04-10',
    ...overrides,
  };
}

describe('filterCandidates', () => {
  it('applies all three filters', () => {
    const foods = [
      makeFood('restriction-match', ['dairy']),
      makeFood('allergy-match', ['vegetable'], ['shellfish']),
      makeFood('dislike-match', ['grain']),
      makeFood('passes', ['grain']),
    ];
    const ctx = makeContext({
      dietaryRestrictions: ['dairy'],
      allergies: ['shellfish'],
      explicitDislikes: ['dislike-match'],
    });
    const result = filterCandidates(foods, ctx);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('passes');
  });

  it('food matching restriction but not allergy or dislike -> still filtered', () => {
    const foods = [makeFood('1', ['dairy'])];
    const ctx = makeContext({ dietaryRestrictions: ['dairy'] });
    expect(filterCandidates(foods, ctx)).toHaveLength(0);
  });

  it('food matching only dislike -> filtered', () => {
    const foods = [makeFood('disliked', ['vegetable'])];
    const ctx = makeContext({ explicitDislikes: ['disliked'] });
    expect(filterCandidates(foods, ctx)).toHaveLength(0);
  });

  it('food matching none -> passes', () => {
    const foods = [makeFood('good', ['vegetable'])];
    const ctx = makeContext({
      dietaryRestrictions: ['dairy'],
      allergies: ['shellfish'],
      explicitDislikes: ['other-food'],
    });
    expect(filterCandidates(foods, ctx)).toHaveLength(1);
  });

  it('empty context (no restrictions, allergies, dislikes) -> all foods pass', () => {
    const foods = [
      makeFood('1', ['dairy']),
      makeFood('2', ['shellfish']),
      makeFood('3', ['grain']),
    ];
    const ctx = makeContext();
    expect(filterCandidates(foods, ctx)).toHaveLength(3);
  });

  it('order independence: same result regardless of which filter catches the food', () => {
    // Food has both a restricted tag and is disliked
    const foods = [makeFood('both', ['dairy'])];
    const ctx1 = makeContext({
      dietaryRestrictions: ['dairy'],
      explicitDislikes: ['both'],
    });
    const ctx2 = makeContext({
      dietaryRestrictions: [],
      explicitDislikes: ['both'],
    });
    const ctx3 = makeContext({
      dietaryRestrictions: ['dairy'],
      explicitDislikes: [],
    });
    // All three should produce the same result: empty
    expect(filterCandidates(foods, ctx1)).toHaveLength(0);
    expect(filterCandidates(foods, ctx2)).toHaveLength(0);
    expect(filterCandidates(foods, ctx3)).toHaveLength(0);
  });
});
