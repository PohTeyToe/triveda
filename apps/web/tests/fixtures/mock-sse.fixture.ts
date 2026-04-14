/**
 * Expected SSE response shape for the mock LLM provider.
 *
 * Used by E2E specs to assert content rather than full-text equality. The
 * actual strings live in `packages/shared/src/llm/fixtures/` (split 05); we
 * only reference the structural/ordering contract here.
 */

export const allExpectedEvents = [
  'food_selected',
  'ayurveda_partial',
  'ayurveda_complete',
  'tcm_partial',
  'tcm_complete',
  'naturopathy_partial',
  'naturopathy_complete',
  'synthesis_complete',
] as const;

export type ExpectedEvent = (typeof allExpectedEvents)[number];

export const traditionHeadings = {
  ayurveda: /rasa|virya|vipaka|dosha/i,
  tcm: /(wu\s*xing|five\s*phase|qi|yin|yang|organ)/i,
  naturopathy: /evidence|anti-?inflammatory|nutrient|biomarker/i,
} as const;

export const synthesisPatterns = {
  convergent: /converge|agree|align/i,
  divergent: /diverge|disagree|contrast/i,
} as const;
