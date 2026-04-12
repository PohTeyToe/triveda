/**
 * ConstitutionEngine interface.
 *
 * Manages the user's Prakriti (birth constitution) and Vikriti (current
 * state) assessment. Implemented in split 02.
 */

export interface ConstitutionAnswer {
  questionId: string;
  value: number;
}

export interface DoshaProfile {
  vata: number;
  pitta: number;
  kapha: number;
}

export interface ConstitutionResult {
  prakriti: DoshaProfile;
  dominantDosha: 'vata' | 'pitta' | 'kapha';
  confidence: number;
}

export interface ConstitutionEngine {
  /** Assess constitution from a set of questionnaire answers. */
  assessConstitution(answers: ConstitutionAnswer[]): ConstitutionResult;
}
