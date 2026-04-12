/**
 * 10 canonical constitutional profiles for golden snapshot tests.
 *
 * Covers the full classification spectrum: 3 single-dosha, 3 dual-dosha,
 * 1 tridoshic, 1 zero-answers, 1 partial (10/18), 1 full (18/18).
 */

import type { ConstitutionalProfile } from '../../types.js';

export const PROFILES = {
  'vata-dominant': {
    doshaScores: { vata: 0.65, pitta: 0.2, kapha: 0.15 },
    doshaType: { type: 'single', primary: 'vata', secondary: 'pitta', tertiary: 'kapha' },
    elementScores: { wood: 0.7, fire: 0.3, earth: 0.2, metal: 0.1, water: 0.5 },
    primaryElement: 'wood',
    secondaryElement: 'water',
    metabolicType: 'fast_oxidizer',
    ansDominance: 'sympathetic',
    completeness: 1.0,
    confidence: 0.92,
    summary: 'Vata-dominant constitution with wood/water elements',
  },

  'pitta-dominant': {
    doshaScores: { vata: 0.15, pitta: 0.65, kapha: 0.2 },
    doshaType: { type: 'single', primary: 'pitta', secondary: 'kapha', tertiary: 'vata' },
    elementScores: { wood: 0.2, fire: 0.7, earth: 0.4, metal: 0.1, water: 0.2 },
    primaryElement: 'fire',
    secondaryElement: 'earth',
    metabolicType: 'fast_oxidizer',
    ansDominance: 'sympathetic',
    completeness: 1.0,
    confidence: 0.91,
    summary: 'Pitta-dominant constitution with fire/earth elements',
  },

  'kapha-dominant': {
    doshaScores: { vata: 0.15, pitta: 0.15, kapha: 0.7 },
    doshaType: { type: 'single', primary: 'kapha', secondary: 'pitta', tertiary: 'vata' },
    elementScores: { wood: 0.1, fire: 0.1, earth: 0.7, metal: 0.6, water: 0.3 },
    primaryElement: 'earth',
    secondaryElement: 'metal',
    metabolicType: 'slow_oxidizer',
    ansDominance: 'parasympathetic',
    completeness: 1.0,
    confidence: 0.94,
    summary: 'Kapha-dominant constitution with earth/metal elements',
  },

  'vata-pitta': {
    doshaScores: { vata: 0.42, pitta: 0.38, kapha: 0.2 },
    doshaType: { type: 'dual', primary: 'vata', secondary: 'pitta', tertiary: 'kapha' },
    elementScores: { wood: 0.5, fire: 0.5, earth: 0.2, metal: 0.1, water: 0.3 },
    primaryElement: 'wood',
    secondaryElement: 'fire',
    metabolicType: 'fast_oxidizer',
    ansDominance: 'sympathetic',
    completeness: 1.0,
    confidence: 0.85,
    summary: 'Vata-Pitta dual constitution with wood/fire elements',
  },

  'pitta-kapha': {
    doshaScores: { vata: 0.15, pitta: 0.43, kapha: 0.42 },
    doshaType: { type: 'dual', primary: 'pitta', secondary: 'kapha', tertiary: 'vata' },
    elementScores: { wood: 0.2, fire: 0.5, earth: 0.6, metal: 0.3, water: 0.2 },
    primaryElement: 'fire',
    secondaryElement: 'earth',
    metabolicType: 'mixed_oxidizer',
    ansDominance: 'balanced',
    completeness: 1.0,
    confidence: 0.83,
    summary: 'Pitta-Kapha dual constitution with fire/earth elements',
  },

  'vata-kapha': {
    doshaScores: { vata: 0.42, pitta: 0.16, kapha: 0.42 },
    doshaType: { type: 'dual', primary: 'vata', secondary: 'kapha', tertiary: 'pitta' },
    elementScores: { wood: 0.4, fire: 0.1, earth: 0.5, metal: 0.3, water: 0.5 },
    primaryElement: 'water',
    secondaryElement: 'earth',
    metabolicType: 'slow_oxidizer',
    ansDominance: 'parasympathetic',
    completeness: 1.0,
    confidence: 0.82,
    summary: 'Vata-Kapha dual constitution with water/earth elements',
  },

  tridoshic: {
    doshaScores: { vata: 0.34, pitta: 0.33, kapha: 0.33 },
    doshaType: { type: 'tridoshic', primary: 'vata', secondary: 'pitta', tertiary: 'kapha' },
    elementScores: { wood: 0.3, fire: 0.3, earth: 0.3, metal: 0.3, water: 0.3 },
    primaryElement: 'earth',
    secondaryElement: 'water',
    metabolicType: 'mixed_oxidizer',
    ansDominance: 'balanced',
    completeness: 1.0,
    confidence: 0.78,
    summary: 'Tridoshic constitution with balanced elements',
  },

  'zero-answers': {
    doshaScores: { vata: 0.33, pitta: 0.33, kapha: 0.34 },
    doshaType: { type: 'tridoshic', primary: 'kapha', secondary: 'vata', tertiary: 'pitta' },
    elementScores: null,
    primaryElement: null,
    secondaryElement: null,
    metabolicType: null,
    ansDominance: null,
    completeness: 0.0,
    confidence: 0.2,
    summary: 'No answers provided (default tridoshic)',
  },

  'partial-10': {
    doshaScores: { vata: 0.55, pitta: 0.25, kapha: 0.2 },
    doshaType: { type: 'single', primary: 'vata', secondary: 'pitta', tertiary: 'kapha' },
    elementScores: null,
    primaryElement: null,
    secondaryElement: null,
    metabolicType: null,
    ansDominance: null,
    completeness: 0.56,
    confidence: 0.6,
    summary: 'Partial profile (10/18 answers, Vata-leaning)',
  },

  'full-18': {
    doshaScores: { vata: 0.5, pitta: 0.3, kapha: 0.2 },
    doshaType: { type: 'single', primary: 'vata', secondary: 'pitta', tertiary: 'kapha' },
    elementScores: { wood: 0.6, fire: 0.4, earth: 0.2, metal: 0.1, water: 0.4 },
    primaryElement: 'wood',
    secondaryElement: 'fire',
    metabolicType: 'fast_oxidizer',
    ansDominance: 'sympathetic',
    completeness: 1.0,
    confidence: 0.95,
    summary: 'Full 18/18 Vata-dominant with wood/fire elements',
  },
} as const satisfies Record<string, ConstitutionalProfile>;

export type ProfileName = keyof typeof PROFILES;
export const PROFILE_NAMES = Object.keys(PROFILES) as ProfileName[];
