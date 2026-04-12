/**
 * Constitutional Scoring Engine
 *
 * Converts 0-18 self-assessment answers into a three-tradition
 * constitutional profile: Ayurvedic dosha ratios, TCM Five Element
 * type, and Naturopathic metabolic classification.
 *
 * Supports progressive scoring -- produces a valid profile from
 * 0 answers, refining as more arrive.
 *
 * Pure functions only -- no IO or side effects.
 */

import { z } from 'zod';
import type {
  ANSDominance,
  Answer,
  ConstitutionalDebug,
  ConstitutionalProfile,
  ConstitutionalResult,
  Dosha,
  DoshaClassification,
  DoshaProfile,
  ElementScores,
  MetabolicType,
  TCMElement,
} from './types.js';
import { AnswerSchema } from './types.js';
import { mode, normalize } from './utils/index.js';

// ---------------------------------------------------------------------------
// Internal types for question matrices
// ---------------------------------------------------------------------------

interface DoshaWeights {
  vata: number;
  pitta: number;
  kapha: number;
}

interface DoshaQuestion {
  questionId: number;
  diagnosticWeight: number;
  options: Record<string, DoshaWeights>;
}

interface ElementWeights {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
}

interface ElementQuestion {
  questionId: number;
  options: Record<string, ElementWeights>;
}

// ---------------------------------------------------------------------------
// 10-Question Dosha Scoring Matrix (questions 1-10)
// ---------------------------------------------------------------------------

const DOSHA_QUESTIONS: readonly DoshaQuestion[] = [
  {
    questionId: 1,
    diagnosticWeight: 1.5, // Body frame -- strong diagnostic signal
    options: {
      a: { vata: 0.9, pitta: 0.1, kapha: 0.0 }, // thin, light
      b: { vata: 0.1, pitta: 0.8, kapha: 0.1 }, // medium, athletic
      c: { vata: 0.0, pitta: 0.1, kapha: 0.9 }, // large, solid
    },
  },
  {
    questionId: 2,
    diagnosticWeight: 1.0, // Skin type
    options: {
      a: { vata: 0.85, pitta: 0.1, kapha: 0.05 }, // dry, rough
      b: { vata: 0.05, pitta: 0.85, kapha: 0.1 }, // warm, oily, sensitive
      c: { vata: 0.05, pitta: 0.1, kapha: 0.85 }, // thick, smooth, cool
    },
  },
  {
    questionId: 3,
    diagnosticWeight: 1.2, // Sleep quality
    options: {
      a: { vata: 0.85, pitta: 0.15, kapha: 0.0 }, // light sleeper
      b: { vata: 0.1, pitta: 0.8, kapha: 0.1 }, // moderate
      c: { vata: 0.0, pitta: 0.1, kapha: 0.9 }, // deep, heavy
    },
  },
  {
    questionId: 4,
    diagnosticWeight: 1.3, // Digestion
    options: {
      a: { vata: 0.8, pitta: 0.15, kapha: 0.05 }, // irregular
      b: { vata: 0.05, pitta: 0.9, kapha: 0.05 }, // strong, sharp
      c: { vata: 0.05, pitta: 0.1, kapha: 0.85 }, // slow, steady
    },
  },
  {
    questionId: 5,
    diagnosticWeight: 0.8, // Temperature preference
    options: {
      a: { vata: 0.8, pitta: 0.1, kapha: 0.1 }, // dislikes cold
      b: { vata: 0.1, pitta: 0.8, kapha: 0.1 }, // dislikes heat
      c: { vata: 0.1, pitta: 0.05, kapha: 0.85 }, // dislikes damp/cold
    },
  },
  {
    questionId: 6,
    diagnosticWeight: 1.0, // Stress response
    options: {
      a: { vata: 0.85, pitta: 0.1, kapha: 0.05 }, // anxious, worried
      b: { vata: 0.1, pitta: 0.85, kapha: 0.05 }, // irritable, angry
      c: { vata: 0.05, pitta: 0.05, kapha: 0.9 }, // withdrawn, avoidant
    },
  },
  {
    questionId: 7,
    diagnosticWeight: 0.7, // Energy pattern
    options: {
      a: { vata: 0.85, pitta: 0.1, kapha: 0.05 }, // bursts then crashes
      b: { vata: 0.1, pitta: 0.8, kapha: 0.1 }, // focused and driven
      c: { vata: 0.05, pitta: 0.1, kapha: 0.85 }, // slow start, endurance
    },
  },
  {
    questionId: 8,
    diagnosticWeight: 0.5, // Speech pattern
    options: {
      a: { vata: 0.8, pitta: 0.15, kapha: 0.05 }, // fast, talkative
      b: { vata: 0.1, pitta: 0.8, kapha: 0.1 }, // sharp, precise
      c: { vata: 0.05, pitta: 0.1, kapha: 0.85 }, // slow, melodious
    },
  },
  {
    questionId: 9,
    diagnosticWeight: 2.0, // Appetite pattern -- highest diagnostic weight
    options: {
      a: { vata: 0.85, pitta: 0.1, kapha: 0.05 }, // irregular, variable
      b: { vata: 0.05, pitta: 0.9, kapha: 0.05 }, // strong, can't skip
      c: { vata: 0.05, pitta: 0.1, kapha: 0.85 }, // can skip meals easily
    },
  },
  {
    questionId: 10,
    diagnosticWeight: 1.0, // Weight tendency
    options: {
      a: { vata: 0.85, pitta: 0.1, kapha: 0.05 }, // hard to gain
      b: { vata: 0.1, pitta: 0.8, kapha: 0.1 }, // gains/loses easily
      c: { vata: 0.0, pitta: 0.1, kapha: 0.9 }, // gains easily
    },
  },
] as const;

// ---------------------------------------------------------------------------
// 5-Question Five Element Scoring Matrix (questions 11-15)
// ---------------------------------------------------------------------------

const ELEMENT_QUESTIONS: readonly ElementQuestion[] = [
  {
    questionId: 11, // Seasonal response
    options: {
      a: { wood: 0.7, fire: 0.1, earth: 0.05, metal: 0.05, water: 0.1 }, // spring agitated
      b: { wood: 0.1, fire: 0.7, earth: 0.1, metal: 0.05, water: 0.05 }, // summer overheat
      c: { wood: 0.05, fire: 0.05, earth: 0.7, metal: 0.1, water: 0.1 }, // late summer sluggish
      d: { wood: 0.05, fire: 0.05, earth: 0.1, metal: 0.7, water: 0.1 }, // autumn melancholy
      e: { wood: 0.1, fire: 0.05, earth: 0.05, metal: 0.05, water: 0.75 }, // winter depleted
    },
  },
  {
    questionId: 12, // Emotional tendency
    options: {
      a: { wood: 0.7, fire: 0.15, earth: 0.05, metal: 0.05, water: 0.05 }, // frustration/anger
      b: { wood: 0.1, fire: 0.7, earth: 0.1, metal: 0.05, water: 0.05 }, // anxiety/joy swings
      c: { wood: 0.05, fire: 0.1, earth: 0.7, metal: 0.05, water: 0.1 }, // worry/overthinking
      d: { wood: 0.05, fire: 0.05, earth: 0.05, metal: 0.75, water: 0.1 }, // grief/sadness
      e: { wood: 0.1, fire: 0.05, earth: 0.1, metal: 0.05, water: 0.7 }, // fear/insecurity
    },
  },
  {
    questionId: 13, // Body area prone to issues
    options: {
      a: { wood: 0.75, fire: 0.1, earth: 0.05, metal: 0.05, water: 0.05 }, // eyes, tendons, sides
      b: { wood: 0.05, fire: 0.75, earth: 0.05, metal: 0.05, water: 0.1 }, // heart, circulation
      c: { wood: 0.05, fire: 0.05, earth: 0.75, metal: 0.1, water: 0.05 }, // digestion, muscles
      d: { wood: 0.05, fire: 0.05, earth: 0.05, metal: 0.75, water: 0.1 }, // lungs, skin
      e: { wood: 0.05, fire: 0.1, earth: 0.05, metal: 0.05, water: 0.75 }, // kidneys, bones, joints
    },
  },
  {
    questionId: 14, // Time of day energy peak
    options: {
      a: { wood: 0.65, fire: 0.15, earth: 0.05, metal: 0.1, water: 0.05 }, // early morning
      b: { wood: 0.1, fire: 0.7, earth: 0.1, metal: 0.05, water: 0.05 }, // late morning
      c: { wood: 0.05, fire: 0.1, earth: 0.7, metal: 0.1, water: 0.05 }, // afternoon
      d: { wood: 0.1, fire: 0.05, earth: 0.05, metal: 0.7, water: 0.1 }, // evening
      e: { wood: 0.05, fire: 0.05, earth: 0.1, metal: 0.1, water: 0.7 }, // night
    },
  },
  {
    questionId: 15, // Taste craving
    options: {
      a: { wood: 0.7, fire: 0.1, earth: 0.1, metal: 0.05, water: 0.05 }, // sour
      b: { wood: 0.1, fire: 0.7, earth: 0.05, metal: 0.1, water: 0.05 }, // bitter
      c: { wood: 0.05, fire: 0.1, earth: 0.7, metal: 0.1, water: 0.05 }, // sweet
      d: { wood: 0.1, fire: 0.05, earth: 0.05, metal: 0.7, water: 0.1 }, // pungent/spicy
      e: { wood: 0.05, fire: 0.05, earth: 0.1, metal: 0.05, water: 0.75 }, // salty
    },
  },
] as const;

// ---------------------------------------------------------------------------
// 3-Question Metabolic Typing Decision Tree (questions 16-18)
// ---------------------------------------------------------------------------

/** Q16: Oxidation rate signal. Maps choice to numeric signal. */
const OXIDATION_MAP: Record<string, number> = {
  a: 1, // fast oxidizer: crave fatty/heavy foods, energized by protein
  b: 0, // mixed: no strong preference
  c: -1, // slow oxidizer: prefer light foods, energized by carbs
};

/** Q17: ANS dominance. Maps choice to ANSDominance type. */
const ANS_MAP: Record<string, ANSDominance> = {
  a: 'sympathetic', // fight-or-flight dominant
  b: 'balanced', // balanced ANS
  c: 'parasympathetic', // rest-and-digest dominant
};

/** Q18: Recovery signal. Refines oxidation classification. */
const RECOVERY_MAP: Record<string, number> = {
  a: 1, // quick recovery, high energy after exercise
  b: 0, // moderate recovery
  c: -1, // slow recovery, prolonged fatigue
};

// ---------------------------------------------------------------------------
// Dosha descriptions for summary generation
// ---------------------------------------------------------------------------

const DOSHA_DESCRIPTIONS: Record<Dosha, string> = {
  vata:
    'Vata types tend toward creativity and quick thinking, with variable energy ' +
    'and a preference for warmth and routine.',
  pitta:
    'Pitta types tend toward focus and determination, with strong digestion ' +
    'and a preference for cooling and moderation.',
  kapha:
    'Kapha types tend toward stability and endurance, with steady energy ' +
    'and a preference for stimulation and variety.',
};

const TRIDOSHIC_DESCRIPTION =
  'This rare pattern means no single dosha strongly dominates. ' +
  'Balance across all three gives adaptability but requires mindful attention ' +
  'to whichever dosha is currently aggravated.';

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------

/**
 * Classify a dosha profile as single, dual, or tridoshic.
 *
 * Thresholds:
 * - Tridoshic: gap between 1st and 2nd < 0.08 AND gap between 2nd and 3rd < 0.08
 * - Dual: gap between 1st and 2nd < 0.15 AND gap between 2nd and 3rd >= 0.10
 * - Single: everything else
 */
export function classifyDosha(profile: DoshaProfile): DoshaClassification {
  const entries: [Dosha, number][] = [
    ['vata', profile.vata],
    ['pitta', profile.pitta],
    ['kapha', profile.kapha],
  ];
  entries.sort((a, b) => b[1] - a[1]);

  const [first, second, third] = entries as [[Dosha, number], [Dosha, number], [Dosha, number]];
  const gap12 = first[1] - second[1];
  const gap23 = second[1] - third[1];

  let type: 'single' | 'dual' | 'tridoshic';
  if (gap12 < 0.08 && gap23 < 0.08) {
    type = 'tridoshic';
  } else if (gap12 < 0.15 && gap23 >= 0.1) {
    type = 'dual';
  } else {
    type = 'single';
  }

  return {
    type,
    primary: first[0],
    secondary: second[0],
    tertiary: third[0],
  };
}

// ---------------------------------------------------------------------------
// Confidence
// ---------------------------------------------------------------------------

/**
 * Compute confidence from dosha answer consistency.
 *
 * For each dosha question answered, determines which dosha the chosen
 * option most strongly indicates. Finds the mode (most frequent dominant
 * dosha). Consistency = count of mode / total dosha answers.
 *
 * Returns 0.5 + (consistency * 0.4), yielding range [0.5, 0.9].
 * Returns 0.5 when no dosha answers are present.
 */
export function computeConfidence(answers: Answer[]): number {
  const doshaAnswers = answers.filter((a) => a.questionId >= 1 && a.questionId <= 10);

  if (doshaAnswers.length === 0) return 0.5;

  const dominants: string[] = [];
  for (const answer of doshaAnswers) {
    const question = DOSHA_QUESTIONS.find((q) => q.questionId === answer.questionId);
    if (!question) continue;
    const weights = question.options[answer.choice.toLowerCase()];
    if (!weights) continue;

    // Find which dosha this option most strongly indicates
    let maxDosha: Dosha = 'vata';
    let maxVal = -1;
    for (const d of ['vata', 'pitta', 'kapha'] as const) {
      if (weights[d] > maxVal) {
        maxVal = weights[d];
        maxDosha = d;
      }
    }
    dominants.push(maxDosha);
  }

  if (dominants.length === 0) return 0.5;

  const modeDosha = mode(dominants);
  const modeCount = dominants.filter((d) => d === modeDosha).length;
  const consistency = modeCount / dominants.length;

  return 0.5 + consistency * 0.4;
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

/**
 * Generate a plain-language summary from a constitutional profile.
 * Deterministic template -- NOT LLM-generated.
 */
export function generateSummary(profile: ConstitutionalProfile): string {
  if (profile.completeness === 0) {
    return 'No assessment data available yet.';
  }

  const { doshaType } = profile;

  switch (doshaType.type) {
    case 'tridoshic':
      return `Your constitution is tridoshic -- a balanced blend of all three doshas. ${TRIDOSHIC_DESCRIPTION}`;
    case 'dual':
      return `Your constitution shows a ${capitalize(doshaType.primary)}-${capitalize(doshaType.secondary)} pattern. ${DOSHA_DESCRIPTIONS[doshaType.primary]} ${DOSHA_DESCRIPTIONS[doshaType.secondary]}`;
    default:
      return `Your constitution shows a primary ${capitalize(doshaType.primary)} pattern. ${DOSHA_DESCRIPTIONS[doshaType.primary]}`;
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------------------------------------------------------------------------
// Metabolic Typing
// ---------------------------------------------------------------------------

interface MetabolicResult {
  metabolicType: MetabolicType;
  ansDominance: ANSDominance;
}

/**
 * Compute metabolic typing from questions 16-18.
 * Returns null if any of the three metabolic answers are missing.
 * Finds answers by questionId (16, 17, 18), NOT by array index.
 */
function computeMetabolicType(answers: Answer[]): MetabolicResult | null {
  const q16 = answers.find((a) => a.questionId === 16);
  const q17 = answers.find((a) => a.questionId === 17);
  const q18 = answers.find((a) => a.questionId === 18);

  if (!q16 || !q17 || !q18) return null;

  const oxidationSignal = OXIDATION_MAP[q16.choice.toLowerCase()] ?? 0;
  const ansResult = ANS_MAP[q17.choice.toLowerCase()] ?? 'balanced';
  const recoverySignal = RECOVERY_MAP[q18.choice.toLowerCase()] ?? 0;

  // Combine oxidation and recovery signals
  const combinedOxidation = (oxidationSignal + recoverySignal) / 2;

  let metabolicType: MetabolicType;
  if (combinedOxidation > 0.3) {
    metabolicType = 'fast_oxidizer';
  } else if (combinedOxidation < -0.3) {
    metabolicType = 'slow_oxidizer';
  } else {
    metabolicType = 'mixed_oxidizer';
  }

  return { metabolicType, ansDominance: ansResult };
}

// ---------------------------------------------------------------------------
// Element Scoring
// ---------------------------------------------------------------------------

interface ElementResult {
  scores: ElementScores;
  primaryElement: TCMElement;
  secondaryElement: TCMElement;
  rawScores: Record<string, number>;
}

/**
 * Compute element scores from questions 11-15.
 * Returns null if no element answers are present.
 */
function computeElementScores(answers: Answer[]): ElementResult | null {
  const elementAnswers = answers.filter((a) => a.questionId >= 11 && a.questionId <= 15);

  if (elementAnswers.length === 0) return null;

  const raw: Record<string, number> = {
    wood: 0,
    fire: 0,
    earth: 0,
    metal: 0,
    water: 0,
  };

  for (const answer of elementAnswers) {
    const question = ELEMENT_QUESTIONS.find((q) => q.questionId === answer.questionId);
    if (!question) continue;
    const weights = question.options[answer.choice.toLowerCase()];
    if (!weights) continue;

    for (const element of ['wood', 'fire', 'earth', 'metal', 'water'] as const) {
      raw[element] += weights[element];
    }
  }

  const normalized = normalize(raw);
  const scores: ElementScores = {
    wood: normalized.wood ?? 0,
    fire: normalized.fire ?? 0,
    earth: normalized.earth ?? 0,
    metal: normalized.metal ?? 0,
    water: normalized.water ?? 0,
  };

  // Determine primary and secondary elements
  const sorted = (Object.entries(scores) as [TCMElement, number][]).sort((a, b) => b[1] - a[1]);

  return {
    scores,
    primaryElement: sorted[0]?.[0] ?? 'wood',
    secondaryElement: sorted[1]?.[0] ?? 'fire',
    rawScores: raw,
  };
}

// ---------------------------------------------------------------------------
// Dosha Scoring
// ---------------------------------------------------------------------------

interface DoshaResult {
  profile: DoshaProfile;
  rawVata: number;
  rawPitta: number;
  rawKapha: number;
  totalWeight: number;
  perQuestionDominant: string[];
}

/**
 * Compute dosha scores from weighted accumulation of questions 1-10.
 * Returns equal distribution (0.33/0.33/0.33) if no dosha answers are present.
 */
function computeDoshaScores(answers: Answer[]): DoshaResult {
  const doshaAnswers = answers.filter((a) => a.questionId >= 1 && a.questionId <= 10);

  const perQuestionDominant: string[] = [];

  if (doshaAnswers.length === 0) {
    return {
      profile: {
        vata: 1 / 3,
        pitta: 1 / 3,
        kapha: 1 / 3,
      },
      rawVata: 0,
      rawPitta: 0,
      rawKapha: 0,
      totalWeight: 0,
      perQuestionDominant,
    };
  }

  let rawVata = 0;
  let rawPitta = 0;
  let rawKapha = 0;
  let totalWeight = 0;

  for (const answer of doshaAnswers) {
    const question = DOSHA_QUESTIONS.find((q) => q.questionId === answer.questionId);
    if (!question) continue;

    const weights = question.options[answer.choice.toLowerCase()];
    if (!weights) continue;

    const w = question.diagnosticWeight;
    rawVata += weights.vata * w;
    rawPitta += weights.pitta * w;
    rawKapha += weights.kapha * w;
    totalWeight += w;

    // Track per-question dominant dosha
    let maxDosha: Dosha = 'vata';
    let maxVal = -1;
    for (const d of ['vata', 'pitta', 'kapha'] as const) {
      if (weights[d] > maxVal) {
        maxVal = weights[d];
        maxDosha = d;
      }
    }
    perQuestionDominant.push(maxDosha);
  }

  const normalized = normalize({ vata: rawVata, pitta: rawPitta, kapha: rawKapha });

  return {
    profile: {
      vata: normalized.vata ?? 0,
      pitta: normalized.pitta ?? 0,
      kapha: normalized.kapha ?? 0,
    },
    rawVata,
    rawPitta,
    rawKapha,
    totalWeight,
    perQuestionDominant,
  };
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

const AnswersArraySchema = z.array(AnswerSchema);

/**
 * Score a constitutional assessment from 0-18 answers.
 *
 * Produces a valid ConstitutionalResult at every stage of completeness:
 * - 0 answers: equal dosha distribution, null elements/metabolic, confidence 0.5
 * - 1-10 answers: progressive dosha refinement
 * - 11-15 answers: adds element scores
 * - 16-18 answers: adds metabolic typing
 *
 * Pure function -- no IO or side effects.
 */
export function scoreConstitution(answers: Answer[]): ConstitutionalResult {
  // Validate input
  const parsed = AnswersArraySchema.parse(answers);

  // Compute dosha scores (questions 1-10)
  const doshaResult = computeDoshaScores(parsed);

  // Classify dosha pattern
  const doshaType = classifyDosha(doshaResult.profile);

  // Compute element scores (questions 11-15)
  const elementResult = computeElementScores(parsed);

  // Compute metabolic typing (questions 16-18)
  const metabolicResult = computeMetabolicType(parsed);

  // Compute confidence from dosha answer consistency
  const confidence = computeConfidence(parsed);

  // Compute completeness
  const completeness = parsed.length / 18;

  // Build profile
  const profile: ConstitutionalProfile = {
    doshaScores: doshaResult.profile,
    doshaType,
    elementScores: elementResult?.scores ?? null,
    primaryElement: elementResult?.primaryElement ?? null,
    secondaryElement: elementResult?.secondaryElement ?? null,
    metabolicType: metabolicResult?.metabolicType ?? null,
    ansDominance: metabolicResult?.ansDominance ?? null,
    completeness,
    confidence,
    summary: '', // placeholder -- filled below
  };

  // Generate summary (needs the profile to be assembled first)
  profile.summary = generateSummary(profile);

  // Build debug output
  const debug: ConstitutionalDebug = {
    rawVata: doshaResult.rawVata,
    rawPitta: doshaResult.rawPitta,
    rawKapha: doshaResult.rawKapha,
    totalWeight: doshaResult.totalWeight,
    perQuestionDominant: doshaResult.perQuestionDominant,
    consistencyRatio:
      doshaResult.perQuestionDominant.length > 0
        ? doshaResult.perQuestionDominant.filter((d) => d === mode(doshaResult.perQuestionDominant))
            .length / doshaResult.perQuestionDominant.length
        : 0,
    classificationPath: doshaType.type,
    elementRawScores: elementResult?.rawScores ?? null,
  };

  return { profile, debug };
}
