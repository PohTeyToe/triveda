import { describe, expect, it } from 'vitest';
import {
  classifyDosha,
  computeConfidence,
  generateSummary,
  scoreConstitution,
} from '../constitutional.js';
import type { Answer } from '../types.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** 3 answers (Q1-Q3) strongly indicating Vata */
const vataThreeAnswers: Answer[] = [
  { questionId: 1, choice: 'a' },
  { questionId: 2, choice: 'a' },
  { questionId: 3, choice: 'a' },
];

/** Complete 18-answer set for Pitta-dominant */
const pittaEighteenAnswers: Answer[] = [
  // Dosha questions 1-10: all option B (pitta)
  { questionId: 1, choice: 'b' },
  { questionId: 2, choice: 'b' },
  { questionId: 3, choice: 'b' },
  { questionId: 4, choice: 'b' },
  { questionId: 5, choice: 'b' },
  { questionId: 6, choice: 'b' },
  { questionId: 7, choice: 'b' },
  { questionId: 8, choice: 'b' },
  { questionId: 9, choice: 'b' },
  { questionId: 10, choice: 'b' },
  // Element questions 11-15: all option B (fire)
  { questionId: 11, choice: 'b' },
  { questionId: 12, choice: 'b' },
  { questionId: 13, choice: 'b' },
  { questionId: 14, choice: 'b' },
  { questionId: 15, choice: 'b' },
  // Metabolic questions 16-18
  { questionId: 16, choice: 'a' },
  { questionId: 17, choice: 'a' },
  { questionId: 18, choice: 'a' },
];

/** Complete 18-answer set for Kapha-dominant */
const kaphaFullAnswers: Answer[] = [
  // Dosha questions 1-10: all option C (kapha)
  { questionId: 1, choice: 'c' },
  { questionId: 2, choice: 'c' },
  { questionId: 3, choice: 'c' },
  { questionId: 4, choice: 'c' },
  { questionId: 5, choice: 'c' },
  { questionId: 6, choice: 'c' },
  { questionId: 7, choice: 'c' },
  { questionId: 8, choice: 'c' },
  { questionId: 9, choice: 'c' },
  { questionId: 10, choice: 'c' },
  // Element questions 11-15: all option C (earth)
  { questionId: 11, choice: 'c' },
  { questionId: 12, choice: 'c' },
  { questionId: 13, choice: 'c' },
  { questionId: 14, choice: 'c' },
  { questionId: 15, choice: 'c' },
  // Metabolic questions 16-18
  { questionId: 16, choice: 'c' },
  { questionId: 17, choice: 'c' },
  { questionId: 18, choice: 'c' },
];

/** Answer set producing Vata-Pitta dual dosha (within 15% gap) */
const vataPittaDualAnswers: Answer[] = [
  // Mix of A (vata) and B (pitta) -- roughly equal
  { questionId: 1, choice: 'a' }, // vata
  { questionId: 2, choice: 'b' }, // pitta
  { questionId: 3, choice: 'a' }, // vata
  { questionId: 4, choice: 'b' }, // pitta
  { questionId: 5, choice: 'a' }, // vata
  { questionId: 6, choice: 'b' }, // pitta
  { questionId: 7, choice: 'a' }, // vata
  { questionId: 8, choice: 'b' }, // pitta
  { questionId: 9, choice: 'a' }, // vata
  { questionId: 10, choice: 'b' }, // pitta
];

/**
 * Answer set producing tridoshic (all three within 8%).
 *
 * Diagnostic weights vary per question (0.5-2.0), so simple cycling
 * does not produce equal scores. This fixture assigns each dosha
 * a set of questions whose total weighted contribution (accounting
 * for cross-dosha leakage in each option) yields normalized scores
 * within 0.04 of each other:
 *   Vata  (a): Q9(2.0) + Q8(0.5) + Q7(0.7) + Q5(0.8)  -> ~3.82 raw
 *   Pitta (b): Q1(1.5) + Q3(1.2) + Q6(1.0)              -> ~3.77 raw
 *   Kapha (c): Q2(1.0) + Q4(1.3) + Q10(1.0)              -> ~3.42 raw
 */
const tridoshicAnswers: Answer[] = [
  { questionId: 1, choice: 'b' }, // pitta  w=1.5
  { questionId: 2, choice: 'c' }, // kapha  w=1.0
  { questionId: 3, choice: 'b' }, // pitta  w=1.2
  { questionId: 4, choice: 'c' }, // kapha  w=1.3
  { questionId: 5, choice: 'a' }, // vata   w=0.8
  { questionId: 6, choice: 'b' }, // pitta  w=1.0
  { questionId: 7, choice: 'a' }, // vata   w=0.7
  { questionId: 8, choice: 'a' }, // vata   w=0.5
  { questionId: 9, choice: 'a' }, // vata   w=2.0
  { questionId: 10, choice: 'c' }, // kapha  w=1.0
];

/** 5 answers (Q1-Q5) */
const fiveAnswers: Answer[] = [
  { questionId: 1, choice: 'a' },
  { questionId: 2, choice: 'a' },
  { questionId: 3, choice: 'a' },
  { questionId: 4, choice: 'a' },
  { questionId: 5, choice: 'a' },
];

/** 10 Pitta answers (Q1-Q10 all B) */
const tenPittaAnswers: Answer[] = Array.from({ length: 10 }, (_, i) => ({
  questionId: i + 1,
  choice: 'b',
}));

/** 15 answers: 10 dosha (pitta) + 5 element */
const fifteenAnswers: Answer[] = [
  ...tenPittaAnswers,
  { questionId: 11, choice: 'b' },
  { questionId: 12, choice: 'b' },
  { questionId: 13, choice: 'b' },
  { questionId: 14, choice: 'b' },
  { questionId: 15, choice: 'b' },
];

/** Out-of-order answers */
const outOfOrderAnswers: Answer[] = [
  { questionId: 3, choice: 'a' },
  { questionId: 1, choice: 'a' },
  { questionId: 5, choice: 'a' },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('scoreConstitution', () => {
  // -------------------------------------------------------------------------
  // Zero answers
  // -------------------------------------------------------------------------
  describe('zero answers', () => {
    it('returns equal dosha distribution (0.33/0.33/0.33)', () => {
      const result = scoreConstitution([]);
      const { doshaScores } = result.profile;
      expect(doshaScores.vata).toBeCloseTo(1 / 3, 2);
      expect(doshaScores.pitta).toBeCloseTo(1 / 3, 2);
      expect(doshaScores.kapha).toBeCloseTo(1 / 3, 2);
    });

    it('returns completeness 0', () => {
      const result = scoreConstitution([]);
      expect(result.profile.completeness).toBe(0);
    });

    it('returns confidence 0.5', () => {
      const result = scoreConstitution([]);
      expect(result.profile.confidence).toBe(0.5);
    });

    it('returns null for elementScores, metabolicType, ansDominance', () => {
      const result = scoreConstitution([]);
      expect(result.profile.elementScores).toBeNull();
      expect(result.profile.metabolicType).toBeNull();
      expect(result.profile.ansDominance).toBeNull();
    });

    it('returns default summary', () => {
      const result = scoreConstitution([]);
      expect(result.profile.summary).toBe('No assessment data available yet.');
    });
  });

  // -------------------------------------------------------------------------
  // 3 dosha answers (minimum viable)
  // -------------------------------------------------------------------------
  describe('3 dosha answers', () => {
    it('3 Vata answers returns primary vata', () => {
      const result = scoreConstitution(vataThreeAnswers);
      expect(result.profile.doshaType.primary).toBe('vata');
    });

    it('3 answers returns completeness close to 3/18', () => {
      const result = scoreConstitution(vataThreeAnswers);
      expect(result.profile.completeness).toBeCloseTo(3 / 18, 5);
    });

    it('dosha scores sum to 1.0', () => {
      const result = scoreConstitution(vataThreeAnswers);
      const { vata, pitta, kapha } = result.profile.doshaScores;
      expect(vata + pitta + kapha).toBeCloseTo(1.0, 5);
    });

    it('elementScores is null', () => {
      const result = scoreConstitution(vataThreeAnswers);
      expect(result.profile.elementScores).toBeNull();
    });

    it('metabolicType is null', () => {
      const result = scoreConstitution(vataThreeAnswers);
      expect(result.profile.metabolicType).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // 10 dosha answers
  // -------------------------------------------------------------------------
  describe('10 dosha answers', () => {
    it('10 Pitta answers returns primary pitta', () => {
      const result = scoreConstitution(tenPittaAnswers);
      expect(result.profile.doshaType.primary).toBe('pitta');
    });

    it('completeness close to 10/18', () => {
      const result = scoreConstitution(tenPittaAnswers);
      expect(result.profile.completeness).toBeCloseTo(10 / 18, 5);
    });

    it('elementScores still null', () => {
      const result = scoreConstitution(tenPittaAnswers);
      expect(result.profile.elementScores).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // 15 answers (dosha + element)
  // -------------------------------------------------------------------------
  describe('15 answers (dosha + element)', () => {
    it('returns non-null elementScores', () => {
      const result = scoreConstitution(fifteenAnswers);
      expect(result.profile.elementScores).not.toBeNull();
    });

    it('elementScores sum to 1.0', () => {
      const result = scoreConstitution(fifteenAnswers);
      const scores = result.profile.elementScores;
      if (!scores) throw new Error('elementScores should not be null');
      const sum = scores.wood + scores.fire + scores.earth + scores.metal + scores.water;
      expect(sum).toBeCloseTo(1.0, 5);
    });

    it('primaryElement is fire for all-B element answers', () => {
      const result = scoreConstitution(fifteenAnswers);
      expect(result.profile.primaryElement).toBe('fire');
    });

    it('completeness close to 15/18', () => {
      const result = scoreConstitution(fifteenAnswers);
      expect(result.profile.completeness).toBeCloseTo(15 / 18, 5);
    });

    it('metabolicType is still null', () => {
      const result = scoreConstitution(fifteenAnswers);
      expect(result.profile.metabolicType).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Full 18 answers
  // -------------------------------------------------------------------------
  describe('full 18 answers', () => {
    it('returns completeness 1.0', () => {
      const result = scoreConstitution(pittaEighteenAnswers);
      expect(result.profile.completeness).toBe(1.0);
    });

    it('returns non-null metabolicType and ansDominance', () => {
      const result = scoreConstitution(pittaEighteenAnswers);
      expect(result.profile.metabolicType).not.toBeNull();
      expect(result.profile.ansDominance).not.toBeNull();
    });

    it('all fields populated', () => {
      const result = scoreConstitution(pittaEighteenAnswers);
      const p = result.profile;
      expect(p.doshaScores).toBeDefined();
      expect(p.doshaType).toBeDefined();
      expect(p.elementScores).not.toBeNull();
      expect(p.primaryElement).not.toBeNull();
      expect(p.secondaryElement).not.toBeNull();
      expect(p.metabolicType).not.toBeNull();
      expect(p.ansDominance).not.toBeNull();
      expect(p.completeness).toBe(1.0);
      expect(p.confidence).toBeGreaterThanOrEqual(0.5);
      expect(p.summary).toBeTruthy();
    });

    it('pitta-dominant 18 answers returns primary pitta', () => {
      const result = scoreConstitution(pittaEighteenAnswers);
      expect(result.profile.doshaType.primary).toBe('pitta');
    });

    it('kapha-dominant 18 answers returns primary kapha', () => {
      const result = scoreConstitution(kaphaFullAnswers);
      expect(result.profile.doshaType.primary).toBe('kapha');
    });

    it('metabolic type is fast_oxidizer for all-A metabolic answers', () => {
      const result = scoreConstitution(pittaEighteenAnswers);
      expect(result.profile.metabolicType).toBe('fast_oxidizer');
    });

    it('metabolic type is slow_oxidizer for all-C metabolic answers', () => {
      const result = scoreConstitution(kaphaFullAnswers);
      expect(result.profile.metabolicType).toBe('slow_oxidizer');
    });

    it('ANS dominance is sympathetic for choice A on Q17', () => {
      const result = scoreConstitution(pittaEighteenAnswers);
      expect(result.profile.ansDominance).toBe('sympathetic');
    });

    it('ANS dominance is parasympathetic for choice C on Q17', () => {
      const result = scoreConstitution(kaphaFullAnswers);
      expect(result.profile.ansDominance).toBe('parasympathetic');
    });
  });

  // -------------------------------------------------------------------------
  // Dual-dosha detection
  // -------------------------------------------------------------------------
  describe('dual-dosha detection', () => {
    it('returns type dual', () => {
      const result = scoreConstitution(vataPittaDualAnswers);
      expect(result.profile.doshaType.type).toBe('dual');
    });

    it('gap between primary and secondary < 0.15', () => {
      const result = scoreConstitution(vataPittaDualAnswers);
      const scores = result.profile.doshaScores;
      const [first, second] = [scores.vata, scores.pitta, scores.kapha].sort((a, b) => b - a);
      expect((first ?? 0) - (second ?? 0)).toBeLessThan(0.15);
    });

    it('gap between secondary and tertiary >= 0.10', () => {
      const result = scoreConstitution(vataPittaDualAnswers);
      const scores = result.profile.doshaScores;
      const [, second, third] = [scores.vata, scores.pitta, scores.kapha].sort((a, b) => b - a);
      expect((second ?? 0) - (third ?? 0)).toBeGreaterThanOrEqual(0.1);
    });
  });

  // -------------------------------------------------------------------------
  // Tridoshic detection
  // -------------------------------------------------------------------------
  describe('tridoshic detection', () => {
    it('returns type tridoshic', () => {
      const result = scoreConstitution(tridoshicAnswers);
      expect(result.profile.doshaType.type).toBe('tridoshic');
    });

    it('all three dosha scores within 0.08 of each other', () => {
      const result = scoreConstitution(tridoshicAnswers);
      const { vata, pitta, kapha } = result.profile.doshaScores;
      const max = Math.max(vata, pitta, kapha);
      const min = Math.min(vata, pitta, kapha);
      expect(max - min).toBeLessThan(0.08);
    });
  });

  // -------------------------------------------------------------------------
  // Single dosha detection
  // -------------------------------------------------------------------------
  describe('single dosha detection', () => {
    it('strongly Kapha answers return type single', () => {
      const result = scoreConstitution(kaphaFullAnswers.slice(0, 10)); // just dosha questions
      expect(result.profile.doshaType.type).toBe('single');
    });

    it('gap between primary and secondary >= 0.15', () => {
      const result = scoreConstitution(kaphaFullAnswers.slice(0, 10));
      const scores = result.profile.doshaScores;
      const [first, second] = [scores.vata, scores.pitta, scores.kapha].sort((a, b) => b - a);
      expect((first ?? 0) - (second ?? 0)).toBeGreaterThanOrEqual(0.15);
    });
  });

  // -------------------------------------------------------------------------
  // Confidence scoring
  // -------------------------------------------------------------------------
  describe('confidence scoring', () => {
    it('all answers pointing to same dosha returns confidence near 0.9', () => {
      // 10 answers all pointing to pitta
      const result = scoreConstitution(tenPittaAnswers);
      expect(result.profile.confidence).toBeCloseTo(0.9, 1);
    });

    it('mixed answers returns confidence lower than consistent', () => {
      const result = scoreConstitution(tridoshicAnswers);
      // 4 vata, 3 pitta, 3 kapha -> mode 4/10 = 0.4 -> 0.5 + 0.4*0.4 = 0.66
      expect(result.profile.confidence).toBeLessThan(0.8);
    });

    it('mostly-consistent returns confidence between 0.5 and 0.9', () => {
      // 7 pitta + 3 vata = 70% consistency -> 0.5 + 0.7*0.4 = 0.78
      const mostlyPitta: Answer[] = [
        { questionId: 1, choice: 'b' },
        { questionId: 2, choice: 'b' },
        { questionId: 3, choice: 'b' },
        { questionId: 4, choice: 'b' },
        { questionId: 5, choice: 'b' },
        { questionId: 6, choice: 'b' },
        { questionId: 7, choice: 'b' },
        { questionId: 8, choice: 'a' },
        { questionId: 9, choice: 'a' },
        { questionId: 10, choice: 'a' },
      ];
      const result = scoreConstitution(mostlyPitta);
      expect(result.profile.confidence).toBeGreaterThan(0.5);
      expect(result.profile.confidence).toBeLessThan(0.9);
    });
  });

  // -------------------------------------------------------------------------
  // Plain-language summary
  // -------------------------------------------------------------------------
  describe('plain-language summary', () => {
    it('single Vata returns summary containing Vata', () => {
      const result = scoreConstitution(fiveAnswers);
      expect(result.profile.summary).toContain('Vata');
    });

    it('dual Vata-Pitta mentions both doshas', () => {
      const result = scoreConstitution(vataPittaDualAnswers);
      const summary = result.profile.summary;
      expect(summary).toContain('Vata');
      expect(summary).toContain('Pitta');
    });

    it('tridoshic uses tridoshic template', () => {
      const result = scoreConstitution(tridoshicAnswers);
      expect(result.profile.summary).toContain('tridoshic');
    });

    it('zero answers returns default message', () => {
      const result = scoreConstitution([]);
      expect(result.profile.summary).toBe('No assessment data available yet.');
    });
  });

  // -------------------------------------------------------------------------
  // Answer ordering
  // -------------------------------------------------------------------------
  describe('answer ordering', () => {
    it('out-of-order answers produce same result as sorted', () => {
      const sorted: Answer[] = [
        { questionId: 1, choice: 'a' },
        { questionId: 3, choice: 'a' },
        { questionId: 5, choice: 'a' },
      ];
      const resultSorted = scoreConstitution(sorted);
      const resultOutOfOrder = scoreConstitution(outOfOrderAnswers);

      expect(resultOutOfOrder.profile.doshaScores.vata).toBeCloseTo(
        resultSorted.profile.doshaScores.vata,
        5,
      );
      expect(resultOutOfOrder.profile.doshaScores.pitta).toBeCloseTo(
        resultSorted.profile.doshaScores.pitta,
        5,
      );
      expect(resultOutOfOrder.profile.doshaScores.kapha).toBeCloseTo(
        resultSorted.profile.doshaScores.kapha,
        5,
      );
    });

    it('metabolic questions looked up by questionId not array index', () => {
      // Put metabolic answers at the front of the array
      const weirdOrder: Answer[] = [
        { questionId: 16, choice: 'a' },
        { questionId: 17, choice: 'b' },
        { questionId: 18, choice: 'a' },
        { questionId: 1, choice: 'b' },
        { questionId: 2, choice: 'b' },
        { questionId: 3, choice: 'b' },
        { questionId: 4, choice: 'b' },
        { questionId: 5, choice: 'b' },
        { questionId: 6, choice: 'b' },
        { questionId: 7, choice: 'b' },
        { questionId: 8, choice: 'b' },
        { questionId: 9, choice: 'b' },
        { questionId: 10, choice: 'b' },
        { questionId: 11, choice: 'b' },
        { questionId: 12, choice: 'b' },
        { questionId: 13, choice: 'b' },
        { questionId: 14, choice: 'b' },
        { questionId: 15, choice: 'b' },
      ];
      const result = scoreConstitution(weirdOrder);
      expect(result.profile.metabolicType).not.toBeNull();
      expect(result.profile.ansDominance).toBe('balanced'); // choice B on Q17
    });
  });

  // -------------------------------------------------------------------------
  // Debug output
  // -------------------------------------------------------------------------
  describe('debug output', () => {
    it('includes rawVata, rawPitta, rawKapha', () => {
      const result = scoreConstitution(vataThreeAnswers);
      expect(result.debug.rawVata).toBeGreaterThan(0);
      expect(typeof result.debug.rawPitta).toBe('number');
      expect(typeof result.debug.rawKapha).toBe('number');
    });

    it('includes perQuestionDominant array', () => {
      const result = scoreConstitution(vataThreeAnswers);
      expect(Array.isArray(result.debug.perQuestionDominant)).toBe(true);
      expect(result.debug.perQuestionDominant.length).toBe(3);
    });

    it('includes classificationPath', () => {
      const result = scoreConstitution(vataThreeAnswers);
      expect(['single', 'dual', 'tridoshic']).toContain(result.debug.classificationPath);
    });

    it('includes consistencyRatio', () => {
      const result = scoreConstitution(tenPittaAnswers);
      expect(result.debug.consistencyRatio).toBeGreaterThan(0);
      expect(result.debug.consistencyRatio).toBeLessThanOrEqual(1);
    });

    it('elementRawScores is null when no element answers provided', () => {
      const result = scoreConstitution(vataThreeAnswers);
      expect(result.debug.elementRawScores).toBeNull();
    });

    it('elementRawScores is populated when element answers provided', () => {
      const result = scoreConstitution(fifteenAnswers);
      expect(result.debug.elementRawScores).not.toBeNull();
      expect(result.debug.elementRawScores?.fire).toBeGreaterThan(0);
    });
  });
});

// ---------------------------------------------------------------------------
// classifyDosha (unit tests for the classification function)
// ---------------------------------------------------------------------------

describe('classifyDosha', () => {
  it('classifies strongly dominant profile as single', () => {
    const result = classifyDosha({ vata: 0.7, pitta: 0.2, kapha: 0.1 });
    expect(result.type).toBe('single');
    expect(result.primary).toBe('vata');
  });

  it('classifies close top-two as dual when third is distant', () => {
    const result = classifyDosha({ vata: 0.42, pitta: 0.4, kapha: 0.18 });
    expect(result.type).toBe('dual');
    expect(result.primary).toBe('vata');
    expect(result.secondary).toBe('pitta');
  });

  it('classifies all-equal as tridoshic', () => {
    const result = classifyDosha({ vata: 0.34, pitta: 0.33, kapha: 0.33 });
    expect(result.type).toBe('tridoshic');
  });

  it('returns correct ordering for all permutations', () => {
    const result = classifyDosha({ vata: 0.1, pitta: 0.3, kapha: 0.6 });
    expect(result.primary).toBe('kapha');
    expect(result.secondary).toBe('pitta');
    expect(result.tertiary).toBe('vata');
  });
});

// ---------------------------------------------------------------------------
// computeConfidence (unit tests)
// ---------------------------------------------------------------------------

describe('computeConfidence', () => {
  it('returns 0.5 for empty answers', () => {
    expect(computeConfidence([])).toBe(0.5);
  });

  it('returns 0.9 for fully consistent answers', () => {
    const allPitta: Answer[] = Array.from({ length: 10 }, (_, i) => ({
      questionId: i + 1,
      choice: 'b',
    }));
    expect(computeConfidence(allPitta)).toBeCloseTo(0.9, 1);
  });

  it('ignores non-dosha questions', () => {
    const elementOnly: Answer[] = [
      { questionId: 11, choice: 'a' },
      { questionId: 12, choice: 'b' },
    ];
    expect(computeConfidence(elementOnly)).toBe(0.5);
  });
});

// ---------------------------------------------------------------------------
// generateSummary (unit tests)
// ---------------------------------------------------------------------------

describe('generateSummary', () => {
  const baseProfile: Omit<
    import('../types.js').ConstitutionalProfile,
    'summary' | 'doshaType' | 'completeness'
  > = {
    doshaScores: { vata: 0.5, pitta: 0.3, kapha: 0.2 },
    elementScores: null,
    primaryElement: null,
    secondaryElement: null,
    metabolicType: null,
    ansDominance: null,
    confidence: 0.7,
  };

  it('zero completeness returns default', () => {
    const result = generateSummary({
      ...baseProfile,
      completeness: 0,
      summary: '',
      doshaType: { type: 'single', primary: 'vata', secondary: 'pitta', tertiary: 'kapha' },
    });
    expect(result).toBe('No assessment data available yet.');
  });

  it('single type mentions primary dosha', () => {
    const result = generateSummary({
      ...baseProfile,
      completeness: 0.5,
      summary: '',
      doshaType: { type: 'single', primary: 'pitta', secondary: 'vata', tertiary: 'kapha' },
    });
    expect(result).toContain('Pitta');
    expect(result).toContain('primary');
  });

  it('dual type mentions both doshas', () => {
    const result = generateSummary({
      ...baseProfile,
      completeness: 0.5,
      summary: '',
      doshaType: { type: 'dual', primary: 'vata', secondary: 'pitta', tertiary: 'kapha' },
    });
    expect(result).toContain('Vata');
    expect(result).toContain('Pitta');
  });

  it('tridoshic type uses tridoshic template', () => {
    const result = generateSummary({
      ...baseProfile,
      completeness: 0.5,
      summary: '',
      doshaType: { type: 'tridoshic', primary: 'vata', secondary: 'pitta', tertiary: 'kapha' },
    });
    expect(result).toContain('tridoshic');
  });
});

// ---------------------------------------------------------------------------
// Progressive scoring (regression)
// ---------------------------------------------------------------------------

describe('progressive scoring', () => {
  it('produces valid profiles at every stage from 0 to 18', () => {
    const allAnswers = pittaEighteenAnswers;
    for (let n = 0; n <= 18; n++) {
      const subset = allAnswers.slice(0, n);
      const result = scoreConstitution(subset);
      const { doshaScores, completeness } = result.profile;

      // Dosha scores always sum to 1
      expect(doshaScores.vata + doshaScores.pitta + doshaScores.kapha).toBeCloseTo(1.0, 5);

      // Completeness tracks input count
      expect(completeness).toBeCloseTo(n / 18, 5);

      // Element scores null until element answers present
      if (n <= 10) {
        expect(result.profile.elementScores).toBeNull();
      }

      // Metabolic type null until all 3 metabolic answers present
      if (n < 18) {
        expect(result.profile.metabolicType).toBeNull();
      }
    }
  });
});
