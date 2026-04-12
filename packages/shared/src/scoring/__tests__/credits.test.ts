import { describe, expect, it } from 'vitest';
import { ALWAYS_ACTIVE_COUNT, emitCredits } from '../credits.js';
import { FACTOR_WEIGHTS } from '../factors/constants.js';
import { scoreFood } from '../score-food.js';
import type { FactorBreakdown, ModifierResult } from '../types.js';
import {
  CONTEXT_WITH_HISTORY,
  FULL_MODIFIERS,
  HEMANTA_CONTEXT,
  MINIMAL_PROFILE,
  OATS,
  VATA_PROFILE,
} from './fixtures.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBreakdown(): FactorBreakdown {
  return {
    constitutional: { weight: 0.3, rawScore: 0.6, weightedScore: 0.18, rationale: '' },
    seasonal: { weight: 0.2, rawScore: 0.7, weightedScore: 0.14, rationale: '' },
    weather: { weight: 0.15, rawScore: 0.85, weightedScore: 0.1275, rationale: '' },
    element: { weight: 0.15, rawScore: 0.68, weightedScore: 0.102, rationale: '' },
    antiRepetition: { weight: 0.12, rawScore: 1.0, weightedScore: 0.12, rationale: '' },
    organClock: { weight: 0.08, rawScore: 1.0, weightedScore: 0.08, rationale: '' },
  };
}

function makeModifierResults(applied: boolean): ModifierResult[] {
  return [
    { name: 'bloodWork', value: applied ? 1.05 : 1.0, applied, rationale: '' },
    { name: 'culturalMatch', value: applied ? 1.03 : 1.0, applied, rationale: '' },
    { name: 'dailyCheckIn', value: applied ? 1.02 : 1.0, applied, rationale: '' },
  ];
}

// ---------------------------------------------------------------------------
// emitCredits direct tests
// ---------------------------------------------------------------------------

describe('emitCredits', () => {
  it('always returns exactly 22 entries', () => {
    const credits = emitCredits(
      OATS,
      VATA_PROFILE,
      HEMANTA_CONTEXT,
      makeBreakdown(),
      makeModifierResults(false),
    );
    expect(credits).toHaveLength(22);
  });

  it('every entry has non-empty featureId and featureName strings', () => {
    const credits = emitCredits(
      OATS,
      VATA_PROFILE,
      HEMANTA_CONTEXT,
      makeBreakdown(),
      makeModifierResults(false),
    );
    for (const c of credits) {
      expect(c.featureId.length).toBeGreaterThan(0);
      expect(c.featureName.length).toBeGreaterThan(0);
    }
  });

  it('at least 6 entries have active === true (core factors)', () => {
    const credits = emitCredits(
      OATS,
      VATA_PROFILE,
      HEMANTA_CONTEXT,
      makeBreakdown(),
      makeModifierResults(false),
    );
    const activeCount = credits.filter((c) => c.active).length;
    expect(activeCount).toBeGreaterThanOrEqual(6);
  });

  it('future features have active === false', () => {
    const credits = emitCredits(
      OATS,
      VATA_PROFILE,
      HEMANTA_CONTEXT,
      makeBreakdown(),
      makeModifierResults(false),
    );
    const futureIds = [
      'journal-sentiment',
      'consultation-reasoning',
      'gamification-engagement',
      'practitioner-matching',
      'preference-learning',
    ];
    for (const id of futureIds) {
      const credit = credits.find((c) => c.featureId === id);
      expect(credit).toBeDefined();
      expect(credit?.active).toBe(false);
    }
  });

  it('element factor credit is latent when profile.primaryElement is null', () => {
    const credits = emitCredits(
      OATS,
      MINIMAL_PROFILE,
      HEMANTA_CONTEXT,
      makeBreakdown(),
      makeModifierResults(false),
    );
    const elementCredit = credits.find((c) => c.featureId === 'five-element-affinity');
    expect(elementCredit).toBeDefined();
    expect(elementCredit?.active).toBe(false);
  });

  it('element factor credit is active when profile.primaryElement is defined', () => {
    const credits = emitCredits(
      OATS,
      VATA_PROFILE,
      HEMANTA_CONTEXT,
      makeBreakdown(),
      makeModifierResults(false),
    );
    const elementCredit = credits.find((c) => c.featureId === 'five-element-affinity');
    expect(elementCredit).toBeDefined();
    expect(elementCredit?.active).toBe(true);
  });

  it('blood work modifier credit is latent when not provided', () => {
    const credits = emitCredits(
      OATS,
      VATA_PROFILE,
      HEMANTA_CONTEXT,
      makeBreakdown(),
      makeModifierResults(false),
    );
    const bwCredit = credits.find((c) => c.featureId === 'blood-work-interpretation');
    expect(bwCredit).toBeDefined();
    expect(bwCredit?.active).toBe(false);
  });

  it('blood work modifier credit is active when provided', () => {
    const credits = emitCredits(
      OATS,
      VATA_PROFILE,
      HEMANTA_CONTEXT,
      makeBreakdown(),
      makeModifierResults(true),
    );
    const bwCredit = credits.find((c) => c.featureId === 'blood-work-interpretation');
    expect(bwCredit).toBeDefined();
    expect(bwCredit?.active).toBe(true);
  });

  it('cultural match modifier credit is latent when not provided', () => {
    const credits = emitCredits(
      OATS,
      VATA_PROFILE,
      HEMANTA_CONTEXT,
      makeBreakdown(),
      makeModifierResults(false),
    );
    const cmCredit = credits.find((c) => c.featureId === 'cultural-food-matching');
    expect(cmCredit).toBeDefined();
    expect(cmCredit?.active).toBe(false);
  });

  it('daily check-in modifier credit is active when provided', () => {
    const credits = emitCredits(
      OATS,
      VATA_PROFILE,
      HEMANTA_CONTEXT,
      makeBreakdown(),
      makeModifierResults(true),
    );
    const ciCredit = credits.find((c) => c.featureId === 'daily-check-in-state');
    expect(ciCredit).toBeDefined();
    expect(ciCredit?.active).toBe(true);
  });

  it('credit #22 (progressive profile state) is always active', () => {
    const credits = emitCredits(
      OATS,
      MINIMAL_PROFILE,
      HEMANTA_CONTEXT,
      makeBreakdown(),
      makeModifierResults(false),
    );
    const profileCredit = credits.find((c) => c.featureId === 'progressive-profile-state');
    expect(profileCredit).toBeDefined();
    expect(profileCredit?.active).toBe(true);
  });

  it('with full profile and all modifiers -> count active credits >= 12', () => {
    const credits = emitCredits(
      OATS,
      VATA_PROFILE,
      CONTEXT_WITH_HISTORY,
      makeBreakdown(),
      makeModifierResults(true),
    );
    const activeCount = credits.filter((c) => c.active).length;
    expect(activeCount).toBeGreaterThanOrEqual(12);
  });

  it('with zero answers and no modifiers -> count active credits >= 6 (core factors)', () => {
    const credits = emitCredits(
      OATS,
      MINIMAL_PROFILE,
      HEMANTA_CONTEXT,
      makeBreakdown(),
      makeModifierResults(false),
    );
    const activeCount = credits.filter((c) => c.active).length;
    // Core always-active: #1, #3, #8, #13, #14, #15, #17, #22 = 8
    // Element (#6, #16) will be latent. Modifiers latent. Future inactive.
    expect(activeCount).toBeGreaterThanOrEqual(6);
  });
});

// ---------------------------------------------------------------------------
// Wire into scoreFood
// ---------------------------------------------------------------------------

describe('credits wired into scoreFood', () => {
  it('scoreFood returns ScoredFood with credits.length === 22', () => {
    const result = scoreFood(OATS, VATA_PROFILE, HEMANTA_CONTEXT);
    expect(result.credits).toHaveLength(22);
  });

  it('credits reflect actual factor scores from the same scoring call', () => {
    const result = scoreFood(OATS, VATA_PROFILE, HEMANTA_CONTEXT, FULL_MODIFIERS);

    // Check that the constitutional credit is active
    const doshaCredit = result.credits.find((c) => c.featureId === 'dosha-analysis');
    expect(doshaCredit?.active).toBe(true);

    // Blood work should be active since we passed modifiers
    const bwCredit = result.credits.find((c) => c.featureId === 'blood-work-interpretation');
    expect(bwCredit?.active).toBe(true);
  });

  it('ALWAYS_ACTIVE_COUNT is at least 7', () => {
    expect(ALWAYS_ACTIVE_COUNT).toBeGreaterThanOrEqual(7);
  });
});
