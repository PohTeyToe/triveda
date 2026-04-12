/**
 * Zod output schemas for structured LLM responses.
 *
 * Each schema matches the corresponding tradition output type in types.ts.
 * The .describe() calls guide the model toward correct structured output.
 * Versioned under prompts/v1/ so prompt iterations can coexist.
 *
 * No runtime, no side effects -- pure schema definitions.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Ayurveda output schema
// ---------------------------------------------------------------------------

export const ayurvedaOutputSchema = z
  .object({
    rasa: z.string().describe('Primary taste classification'),
    virya: z.string().describe('Potency: heating or cooling'),
    vipaka: z.string().describe('Post-digestive effect'),
    dosha_rationale: z.string().describe('How this food affects the user dosha profile'),
    plain_english: z
      .string()
      .describe('1-3 sentence explanation a non-practitioner would understand'),
  })
  .strict();

export type AyurvedaSchemaOutput = z.infer<typeof ayurvedaOutputSchema>;

// ---------------------------------------------------------------------------
// TCM output schema
// ---------------------------------------------------------------------------

export const tcmOutputSchema = z
  .object({
    thermal: z.string().describe('Thermal nature of this food'),
    element: z.string().describe('Dominant Five Element affinity'),
    organ_clock: z.string().describe('How this food relates to the current organ hour'),
    plain_english: z.string().describe('1-3 sentence explanation'),
  })
  .strict();

export type TCMSchemaOutput = z.infer<typeof tcmOutputSchema>;

// ---------------------------------------------------------------------------
// Naturopathy output schema
// ---------------------------------------------------------------------------

export const naturopathyOutputSchema = z
  .object({
    evidence_level: z
      .enum(['strong', 'moderate', 'preliminary', 'traditional_only', 'none'])
      .describe('Strongest evidence level for the primary health claim'),
    pubmed_citations: z
      .array(
        z.object({
          claim: z.string(),
          source: z.string(),
          year: z.number().optional(),
        }),
      )
      .describe('Citations supporting health claims'),
    honest_gaps: z.array(z.string()).describe('Claims that lack scientific evidence'),
    plain_english: z.string().describe('1-3 sentence evidence summary'),
  })
  .strict();

export type NaturopathySchemaOutput = z.infer<typeof naturopathyOutputSchema>;

// ---------------------------------------------------------------------------
// Synthesis output schema
// ---------------------------------------------------------------------------

export const synthesisOutputSchema = z
  .object({
    convergence_framing: z
      .string()
      .min(1)
      .describe('How the three traditions relate on this recommendation'),
    two_sentence_rationale: z.string().describe('Surface card text the user reads in 5 seconds'),
  })
  .strict();

export type SynthesisSchemaOutput = z.infer<typeof synthesisOutputSchema>;
