/**
 * Shared test fixtures for scoring engine tests.
 * Provides canonical food, profile, and context objects.
 */

import type {
  ConstitutionalProfile,
  FoodForScoring,
  ModifierValues,
  ScoringContext,
} from '../types.js';

// ---------------------------------------------------------------------------
// Canonical food: oats
// ---------------------------------------------------------------------------

export const OATS: FoodForScoring = {
  id: 'f0000000-0000-0000-0000-000000000001',
  name: 'Oats',
  tags: ['grain'],
  contraindications: undefined,
  ayurveda: {
    vataEffect: -1,
    pittaEffect: 0,
    kaphaEffect: 1,
    rituFit: {
      shishira: 0.6,
      vasanta: 0.5,
      grishma: 0.3,
      varsha: 0.6,
      sharad: 0.5,
      hemanta: 0.7,
    },
  },
  tcm: {
    thermalNature: 'warm',
    organAffinity: ['stomach', 'spleen'],
    elementFit: { wood: 0.3, fire: 0.5, earth: 0.8, metal: 0.2, water: 0.4 },
  },
};

export const GINGER: FoodForScoring = {
  id: 'f0000000-0000-0000-0000-000000000002',
  name: 'Ginger',
  tags: ['spice'],
  contraindications: undefined,
  ayurveda: {
    vataEffect: -1.5,
    pittaEffect: 1,
    kaphaEffect: -1.5,
    rituFit: {
      shishira: 0.9,
      vasanta: 0.5,
      grishma: 0.2,
      varsha: 0.7,
      sharad: 0.5,
      hemanta: 0.9,
    },
  },
  tcm: {
    thermalNature: 'hot',
    organAffinity: ['lung', 'stomach'],
    elementFit: { wood: 0.3, fire: 0.8, earth: 0.4, metal: 0.6, water: 0.2 },
  },
};

export const CUCUMBER: FoodForScoring = {
  id: 'f0000000-0000-0000-0000-000000000003',
  name: 'Cucumber',
  tags: ['vegetable'],
  contraindications: undefined,
  ayurveda: {
    vataEffect: 1,
    pittaEffect: -1.5,
    kaphaEffect: 1,
    rituFit: {
      shishira: 0.2,
      vasanta: 0.5,
      grishma: 0.9,
      varsha: 0.4,
      sharad: 0.6,
      hemanta: 0.2,
    },
  },
  tcm: {
    thermalNature: 'cool',
    organAffinity: ['kidney', 'bladder'],
    elementFit: { wood: 0.2, fire: 0.1, earth: 0.3, metal: 0.2, water: 0.8 },
  },
};

export const MILK: FoodForScoring = {
  id: 'f0000000-0000-0000-0000-000000000004',
  name: 'Milk',
  tags: ['dairy'],
  contraindications: ['lactose-intolerance'],
  ayurveda: {
    vataEffect: -1,
    pittaEffect: -0.5,
    kaphaEffect: 1.5,
    rituFit: {
      shishira: 0.5,
      vasanta: 0.4,
      grishma: 0.5,
      varsha: 0.3,
      sharad: 0.6,
      hemanta: 0.7,
    },
  },
  tcm: {
    thermalNature: 'cool',
    organAffinity: ['lung', 'stomach'],
    elementFit: { wood: 0.2, fire: 0.2, earth: 0.7, metal: 0.5, water: 0.4 },
  },
};

export const RICE: FoodForScoring = {
  id: 'f0000000-0000-0000-0000-000000000005',
  name: 'Rice',
  tags: ['grain'],
  contraindications: undefined,
  ayurveda: {
    vataEffect: -0.5,
    pittaEffect: -0.5,
    kaphaEffect: 0.5,
    rituFit: {
      shishira: 0.5,
      vasanta: 0.6,
      grishma: 0.7,
      varsha: 0.5,
      sharad: 0.6,
      hemanta: 0.6,
    },
  },
  tcm: {
    thermalNature: 'neutral',
    organAffinity: ['stomach', 'spleen'],
    elementFit: { wood: 0.3, fire: 0.3, earth: 0.7, metal: 0.3, water: 0.3 },
  },
};

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

/** Vata-dominant profile with full element data */
export const VATA_PROFILE: ConstitutionalProfile = {
  doshaScores: { vata: 0.6, pitta: 0.25, kapha: 0.15 },
  doshaType: { type: 'single', primary: 'vata', secondary: 'pitta', tertiary: 'kapha' },
  elementScores: { wood: 0.3, fire: 0.5, earth: 0.8, metal: 0.2, water: 0.4 },
  primaryElement: 'earth',
  secondaryElement: 'water',
  metabolicType: 'fast_oxidizer',
  ansDominance: 'sympathetic',
  completeness: 1.0,
  confidence: 0.9,
  summary: 'Vata-dominant constitution',
};

/** Minimal profile (0 answers) with no element data */
export const MINIMAL_PROFILE: ConstitutionalProfile = {
  doshaScores: { vata: 0.33, pitta: 0.34, kapha: 0.33 },
  doshaType: { type: 'tridoshic', primary: 'pitta', secondary: 'vata', tertiary: 'kapha' },
  elementScores: null,
  primaryElement: null,
  secondaryElement: null,
  metabolicType: null,
  ansDominance: null,
  completeness: 0.0,
  confidence: 0.2,
  summary: 'Minimal profile (no answers)',
};

// ---------------------------------------------------------------------------
// Contexts
// ---------------------------------------------------------------------------

/** Standard hemanta season context, stomach hour, no recent foods */
export const HEMANTA_CONTEXT: ScoringContext = {
  seasonal: {
    ayurvedaRitu: 'hemanta',
    tcmPhase: 'water',
    isTransition: false,
    transitionProgress: 0,
    seasonalIntensity: 1.0,
  },
  weather: {
    thermalNeed: 0.8,
    kaphaAggravation: 0.3,
    vataAggravation: 0.5,
    pittaAggravation: 0.1,
    tcmWindPattern: 'wind_cold',
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
  today: '2026-01-15',
};

/** Context with recent food history */
export const CONTEXT_WITH_HISTORY: ScoringContext = {
  ...HEMANTA_CONTEXT,
  recentFoods: [
    { foodId: 'f0000000-0000-0000-0000-000000000001', date: '2026-01-14', response: 'accepted' },
    { foodId: 'f0000000-0000-0000-0000-000000000003', date: '2026-01-10', response: 'rejected' },
  ],
};

/** Context with dietary restrictions */
export const RESTRICTED_CONTEXT: ScoringContext = {
  ...HEMANTA_CONTEXT,
  dietaryRestrictions: ['dairy'],
  allergies: ['gluten'],
  explicitDislikes: [],
};

/** Full modifier values */
export const FULL_MODIFIERS: ModifierValues = {
  bloodWork: 1.05,
  culturalMatch: 1.03,
  dailyCheckIn: 1.02,
};

/** No modifiers */
export const NO_MODIFIERS: ModifierValues = {
  bloodWork: undefined,
  culturalMatch: undefined,
  dailyCheckIn: undefined,
};

// ---------------------------------------------------------------------------
// Utility: generate N foods
// ---------------------------------------------------------------------------

export function generateFoods(count: number): FoodForScoring[] {
  const foods: FoodForScoring[] = [];
  for (let i = 0; i < count; i++) {
    const padded = String(i + 1).padStart(12, '0');
    foods.push({
      id: `f0000000-0000-0000-0000-${padded}`,
      name: `Food_${i + 1}`,
      tags: [],
      contraindications: undefined,
      ayurveda: {
        vataEffect: ((i % 5) - 2) * 0.5,
        pittaEffect: (((i + 1) % 5) - 2) * 0.5,
        kaphaEffect: (((i + 2) % 5) - 2) * 0.5,
        rituFit: {
          shishira: 0.5 + (i % 10) * 0.05,
          vasanta: 0.5 + ((i + 1) % 10) * 0.05,
          grishma: 0.5 + ((i + 2) % 10) * 0.05,
          varsha: 0.5 + ((i + 3) % 10) * 0.05,
          sharad: 0.5 + ((i + 4) % 10) * 0.05,
          hemanta: 0.5 + ((i + 5) % 10) * 0.05,
        },
      },
      tcm: {
        thermalNature: (['hot', 'warm', 'neutral', 'cool', 'cold'] as const)[i % 5] as
          | 'hot'
          | 'warm'
          | 'neutral'
          | 'cool'
          | 'cold',
        organAffinity: ['stomach'],
        elementFit: {
          wood: 0.3 + (i % 5) * 0.1,
          fire: 0.3 + ((i + 1) % 5) * 0.1,
          earth: 0.3 + ((i + 2) % 5) * 0.1,
          metal: 0.3 + ((i + 3) % 5) * 0.1,
          water: 0.3 + ((i + 4) % 5) * 0.1,
        },
      },
    });
  }
  return foods;
}
