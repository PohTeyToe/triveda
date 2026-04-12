import { describe, expect, it } from 'vitest';
import {
  computeConvergence,
  constitutionalAgreement,
  evidenceAgreement,
  seasonalAgreement,
  thermalAgreement,
} from '../convergence.js';
import type { ConstitutionalProfile, DayContext, FoodForConvergence } from '../types.js';

// ---------------------------------------------------------------------------
// Fixtures: Profiles
// ---------------------------------------------------------------------------

/** Strongly Vata-dominant profile with element scores and metabolic type */
const vataProfile: ConstitutionalProfile = {
  doshaScores: { vata: 0.6, pitta: 0.25, kapha: 0.15 },
  doshaType: {
    type: 'single',
    primary: 'vata',
    secondary: 'pitta',
    tertiary: 'kapha',
  },
  elementScores: { wood: 0.1, fire: 0.15, earth: 0.1, metal: 0.25, water: 0.4 },
  primaryElement: 'water',
  secondaryElement: 'metal',
  metabolicType: 'fast_oxidizer',
  ansDominance: 'sympathetic',
  completeness: 1.0,
  confidence: 0.9,
  summary: 'Vata-dominant profile',
};

/** Profile with only 3 answers -- no element scores, no metabolic type */
const incompleteProfile: ConstitutionalProfile = {
  doshaScores: { vata: 0.5, pitta: 0.3, kapha: 0.2 },
  doshaType: {
    type: 'single',
    primary: 'vata',
    secondary: 'pitta',
    tertiary: 'kapha',
  },
  elementScores: null,
  primaryElement: null,
  secondaryElement: null,
  metabolicType: null,
  ansDominance: null,
  completeness: 0.17,
  confidence: 0.4,
  summary: 'Incomplete profile',
};

// ---------------------------------------------------------------------------
// Fixtures: Day Context
// ---------------------------------------------------------------------------

/** Winter context: Hemanta, water phase, cold weather */
const winterContext: DayContext = {
  seasonal: {
    ayurvedaRitu: 'hemanta',
    tcmPhase: 'water',
    isTransition: false,
    transitionProgress: 0,
    seasonalIntensity: 0.85,
  },
  weather: {
    thermalNeed: 0.8,
    kaphaAggravation: 0.3,
    vataAggravation: 0.6,
    pittaAggravation: 0.1,
    tcmWindPattern: 'wind_cold',
  },
  organClock: {
    activeOrgan: 'kidney',
    pairedOrgan: 'bladder',
    element: 'water',
    isDigestiveWindow: false,
    isWindDownWindow: false,
  },
};

// ---------------------------------------------------------------------------
// Fixtures: Foods
// ---------------------------------------------------------------------------

/**
 * Ginger: warming in both traditions, good for Vata, winter-appropriate,
 * strong evidence. Should produce full agreement (4/4).
 */
const gingerFixture: FoodForConvergence = {
  ayurveda: {
    virya: 'ushna',
    vataEffect: -1, // reduces vata (good for vata user)
    pittaEffect: 0.5,
    kaphaEffect: -0.8,
    seasonalFit: {
      shishira: 0.8,
      vasanta: 0.5,
      grishma: 0.3,
      varsha: 0.6,
      sharad: 0.5,
      hemanta: 0.9,
    },
  },
  tcm: {
    thermalNature: 'warm',
    elementFit: { wood: 0.3, fire: 0.5, earth: 0.6, metal: 0.7, water: 0.8 },
  },
  naturopathy: {
    evidenceLevel: 'strong',
    metabolicTypeAffinity: {
      fast_oxidizer: 0.7,
      slow_oxidizer: 0.5,
      mixed_oxidizer: 0.6,
    },
  },
};

/**
 * Buckwheat: Ayurveda says heating (ushna), TCM says cool.
 * Thermal disagreement. Should produce interestingDivergence.
 */
const buckwheatFixture: FoodForConvergence = {
  ayurveda: {
    virya: 'ushna',
    vataEffect: -0.5,
    pittaEffect: 0.3,
    kaphaEffect: -0.6,
    seasonalFit: {
      shishira: 0.7,
      vasanta: 0.6,
      grishma: 0.4,
      varsha: 0.5,
      sharad: 0.6,
      hemanta: 0.8,
    },
  },
  tcm: {
    thermalNature: 'cool',
    elementFit: { wood: 0.4, fire: 0.3, earth: 0.7, metal: 0.5, water: 0.6 },
  },
  naturopathy: {
    evidenceLevel: 'moderate',
    metabolicTypeAffinity: {
      fast_oxidizer: 0.6,
      slow_oxidizer: 0.7,
      mixed_oxidizer: 0.5,
    },
  },
};

/**
 * Millet: Both traditions endorse for Kapha, but Naturopathy flags
 * goitrogenic concern -- evidence level is 'none'.
 * Evidence dimension disagrees.
 */
const milletFixture: FoodForConvergence = {
  ayurveda: {
    virya: 'sheeta',
    vataEffect: 0.3,
    pittaEffect: -0.4,
    kaphaEffect: -0.9,
    seasonalFit: {
      shishira: 0.5,
      vasanta: 0.7,
      grishma: 0.8,
      varsha: 0.6,
      sharad: 0.7,
      hemanta: 0.6,
    },
  },
  tcm: {
    thermalNature: 'cool',
    elementFit: { wood: 0.5, fire: 0.4, earth: 0.8, metal: 0.6, water: 0.7 },
  },
  naturopathy: {
    evidenceLevel: 'none',
    metabolicTypeAffinity: {
      fast_oxidizer: 0.6,
      slow_oxidizer: 0.4,
      mixed_oxidizer: 0.5,
    },
  },
};

/** Food with TCM neutral thermal nature */
const neutralThermalFood: FoodForConvergence = {
  ayurveda: {
    virya: 'ushna',
    vataEffect: -0.3,
    pittaEffect: 0.2,
    kaphaEffect: -0.4,
    seasonalFit: {
      shishira: 0.5,
      vasanta: 0.5,
      grishma: 0.5,
      varsha: 0.5,
      sharad: 0.5,
      hemanta: 0.5,
    },
  },
  tcm: {
    thermalNature: 'neutral',
    elementFit: { wood: 0.5, fire: 0.5, earth: 0.5, metal: 0.5, water: 0.5 },
  },
  naturopathy: {
    evidenceLevel: 'moderate',
    metabolicTypeAffinity: {
      fast_oxidizer: 0.5,
      slow_oxidizer: 0.5,
      mixed_oxidizer: 0.5,
    },
  },
};

/** Food with high dosha fit but low element fit (constitutional split) */
const splitFitFood: FoodForConvergence = {
  ayurveda: {
    virya: 'ushna',
    vataEffect: -1.5, // very good for vata
    pittaEffect: 0.2,
    kaphaEffect: -0.5,
    seasonalFit: {
      shishira: 0.6,
      vasanta: 0.5,
      grishma: 0.4,
      varsha: 0.5,
      sharad: 0.5,
      hemanta: 0.7,
    },
  },
  tcm: {
    thermalNature: 'warm',
    // Low fit for water (primary) and metal (secondary)
    elementFit: { wood: 0.8, fire: 0.9, earth: 0.7, metal: 0.2, water: 0.1 },
  },
  naturopathy: {
    evidenceLevel: 'strong',
    metabolicTypeAffinity: {
      fast_oxidizer: 0.8,
      slow_oxidizer: 0.5,
      mixed_oxidizer: 0.6,
    },
  },
};

// ---------------------------------------------------------------------------
// Thermal Agreement Tests
// ---------------------------------------------------------------------------

describe('thermalAgreement', () => {
  it('ginger (virya ushna + TCM warm) agrees, mentions warming', () => {
    const result = thermalAgreement(gingerFixture);
    expect(result.agrees).toBe(true);
    expect(result.detail).toContain('warming');
  });

  it('buckwheat (virya ushna + TCM cool) disagrees', () => {
    const result = thermalAgreement(buckwheatFixture);
    expect(result.agrees).toBe(false);
    expect(result.detail).toContain('disagreement');
  });

  it('food with TCM neutral agrees', () => {
    const result = thermalAgreement(neutralThermalFood);
    expect(result.agrees).toBe(true);
    expect(result.detail).toContain('neutral');
  });

  it('millet (virya sheeta + TCM cool) agrees as cooling', () => {
    const result = thermalAgreement(milletFixture);
    expect(result.agrees).toBe(true);
    expect(result.detail).toContain('cooling');
  });
});

// ---------------------------------------------------------------------------
// Constitutional Agreement Tests
// ---------------------------------------------------------------------------

describe('constitutionalAgreement', () => {
  it('food with dosha fit > 0.6 AND element fit > 0.6 agrees', () => {
    // Ginger: good for vata (high dosha fit), high water element fit (0.8)
    const { result, doshaFitScore, elementFitScore } = constitutionalAgreement(
      gingerFixture,
      vataProfile,
    );
    expect(doshaFitScore).toBeGreaterThan(0.6);
    expect(elementFitScore).toBeGreaterThan(0.6);
    expect(result.agrees).toBe(true);
  });

  it('food with dosha fit > 0.6 BUT element fit < 0.4 disagrees', () => {
    // splitFitFood: great for vata dosha but terrible water/metal element fit
    const { result, doshaFitScore, elementFitScore } = constitutionalAgreement(
      splitFitFood,
      vataProfile,
    );
    expect(doshaFitScore).toBeGreaterThan(0.6);
    expect(elementFitScore).toBeLessThan(0.4);
    expect(result.agrees).toBe(false);
  });

  it('food with both dosha and element fit < 0.4 agrees (both say bad)', () => {
    // Construct a food that is bad for vata and bad element fit
    const badFood: FoodForConvergence = {
      ayurveda: {
        virya: 'sheeta',
        vataEffect: 1.5, // aggravates vata
        pittaEffect: 0.5,
        kaphaEffect: 0.5,
        seasonalFit: {
          shishira: 0.3,
          vasanta: 0.3,
          grishma: 0.3,
          varsha: 0.3,
          sharad: 0.3,
          hemanta: 0.3,
        },
      },
      tcm: {
        thermalNature: 'cold',
        elementFit: { wood: 0.8, fire: 0.7, earth: 0.6, metal: 0.1, water: 0.1 },
      },
      naturopathy: {
        evidenceLevel: 'weak',
        metabolicTypeAffinity: {
          fast_oxidizer: 0.3,
          slow_oxidizer: 0.5,
          mixed_oxidizer: 0.4,
        },
      },
    };
    const { result, doshaFitScore, elementFitScore } = constitutionalAgreement(
      badFood,
      vataProfile,
    );
    expect(doshaFitScore).toBeLessThan(0.4);
    expect(elementFitScore).toBeLessThan(0.4);
    expect(result.agrees).toBe(true);
  });

  it('incomplete profile (no element scores) agrees with note', () => {
    const { result } = constitutionalAgreement(gingerFixture, incompleteProfile);
    expect(result.agrees).toBe(true);
    expect(result.detail).toContain('incomplete');
  });
});

// ---------------------------------------------------------------------------
// Seasonal Agreement Tests
// ---------------------------------------------------------------------------

describe('seasonalAgreement', () => {
  it('ginger in hemanta/water: both fits > 0.5, agrees', () => {
    const { result, ayurFit, tcmFit } = seasonalAgreement(gingerFixture, winterContext);
    expect(ayurFit).toBeGreaterThan(0.5);
    expect(tcmFit).toBeGreaterThan(0.5);
    expect(result.agrees).toBe(true);
  });

  it('food appropriate in Ayurveda but poor TCM element fit disagrees', () => {
    const seasonalSplitFood: FoodForConvergence = {
      ...gingerFixture,
      ayurveda: {
        ...gingerFixture.ayurveda,
        seasonalFit: {
          ...gingerFixture.ayurveda.seasonalFit,
          hemanta: 0.9, // good Ayurvedic fit
        },
      },
      tcm: {
        ...gingerFixture.tcm,
        elementFit: { wood: 0.8, fire: 0.7, earth: 0.6, metal: 0.5, water: 0.2 },
        // water = 0.2, below 0.5
      },
    };
    const { result, ayurFit, tcmFit } = seasonalAgreement(seasonalSplitFood, winterContext);
    expect(ayurFit).toBeGreaterThan(0.5);
    expect(tcmFit).toBeLessThan(0.5);
    expect(result.agrees).toBe(false);
  });

  it('handles sandhi kala transition blending', () => {
    const transitionContext: DayContext = {
      ...winterContext,
      seasonal: {
        ...winterContext.seasonal,
        isTransition: true,
        transitionProgress: 0.5,
        adjacentRitu: 'shishira',
      },
    };
    // hemanta = 0.9, shishira = 0.8 for ginger
    // blended: 0.5 * 0.9 + 0.5 * 0.8 = 0.85
    const { ayurFit } = seasonalAgreement(gingerFixture, transitionContext);
    expect(ayurFit).toBeCloseTo(0.85, 2);
  });
});

// ---------------------------------------------------------------------------
// Evidence Agreement Tests
// ---------------------------------------------------------------------------

describe('evidenceAgreement', () => {
  it('strong evidence AND metabolic affinity > 0.5 agrees', () => {
    const { result, metabolicAffinityScore } = evidenceAgreement(gingerFixture, vataProfile);
    expect(metabolicAffinityScore).toBeGreaterThan(0.5);
    expect(result.agrees).toBe(true);
  });

  it('evidence is "none" disagrees with honest flag', () => {
    const { result } = evidenceAgreement(milletFixture, vataProfile);
    expect(result.agrees).toBe(false);
    expect(result.detail).toContain('no evidence');
  });

  it('incomplete profile returns agrees with not-assessable note', () => {
    const { result, metabolicAffinityScore } = evidenceAgreement(gingerFixture, incompleteProfile);
    expect(result.agrees).toBe(true);
    expect(result.detail).toContain('not yet assessable');
    expect(metabolicAffinityScore).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Convergence Aggregation Tests
// ---------------------------------------------------------------------------

describe('computeConvergence', () => {
  it('ginger (all 4 agree): score 1.0, agreementCount 4, no divergence', () => {
    const result = computeConvergence(gingerFixture, vataProfile, winterContext);
    expect(result.report.agreementCount).toBe(4);
    expect(result.report.score).toBe(1.0);
    expect(result.report.interestingDivergence).toBe(false);
  });

  it('buckwheat (thermal disagreement): interestingDivergence true', () => {
    const result = computeConvergence(buckwheatFixture, vataProfile, winterContext);
    expect(result.report.dimensions.thermal.agrees).toBe(false);
    expect(result.report.interestingDivergence).toBe(true);
    expect(result.report.agreementCount).toBeLessThanOrEqual(3);
  });

  it('millet (evidence contradiction): score < 1.0', () => {
    const result = computeConvergence(milletFixture, vataProfile, winterContext);
    expect(result.report.dimensions.evidence.agrees).toBe(false);
    expect(result.report.score).toBeLessThan(1.0);
  });

  it('score equals agreementCount / 4', () => {
    const result = computeConvergence(buckwheatFixture, vataProfile, winterContext);
    expect(result.report.score).toBe(result.report.agreementCount / 4);
  });
});

// ---------------------------------------------------------------------------
// Interesting Divergence Logic Tests
// ---------------------------------------------------------------------------

describe('interestingDivergence', () => {
  it('thermal disagrees -> always interesting', () => {
    const result = computeConvergence(buckwheatFixture, vataProfile, winterContext);
    expect(result.report.dimensions.thermal.agrees).toBe(false);
    expect(result.report.interestingDivergence).toBe(true);
  });

  it('all 4 agree -> not interesting', () => {
    const result = computeConvergence(gingerFixture, vataProfile, winterContext);
    expect(result.report.agreementCount).toBe(4);
    expect(result.report.interestingDivergence).toBe(false);
  });

  it('constitutional disagrees but 2+ others agree -> interesting', () => {
    // splitFitFood: thermal agrees (both warming), constitutional disagrees,
    // seasonal should agree, evidence should agree
    const result = computeConvergence(splitFitFood, vataProfile, winterContext);
    expect(result.report.dimensions.thermal.agrees).toBe(true);
    expect(result.report.dimensions.constitutional.agrees).toBe(false);
    expect(result.report.interestingDivergence).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Debug Output Tests
// ---------------------------------------------------------------------------

describe('debug output', () => {
  it('includes doshaFitScore and elementFitScore', () => {
    const result = computeConvergence(gingerFixture, vataProfile, winterContext);
    expect(typeof result.debug.doshaFitScore).toBe('number');
    expect(typeof result.debug.elementFitScore).toBe('number');
  });

  it('includes seasonalFitScoreAyurveda and seasonalFitScoreTCM', () => {
    const result = computeConvergence(gingerFixture, vataProfile, winterContext);
    expect(typeof result.debug.seasonalFitScoreAyurveda).toBe('number');
    expect(typeof result.debug.seasonalFitScoreTCM).toBe('number');
  });

  it('includes ayurvedaThermal and tcmThermal', () => {
    const result = computeConvergence(gingerFixture, vataProfile, winterContext);
    expect(result.debug.ayurvedaThermal).toBe('warming');
    expect(result.debug.tcmThermal).toBe('warming');
  });

  it('includes evidenceLevelRaw', () => {
    const result = computeConvergence(gingerFixture, vataProfile, winterContext);
    expect(result.debug.evidenceLevelRaw).toBe('strong');
  });

  it('metabolicAffinityScore is null for incomplete profile', () => {
    const result = computeConvergence(gingerFixture, incompleteProfile, winterContext);
    expect(result.debug.metabolicAffinityScore).toBeNull();
  });
});
