/**
 * Naturopathy tradition prompt template (v1).
 *
 * Builds system and user prompts for the naturopathic evidence-based
 * LLM call. Uses nutritional science, evidence grading, and PubMed
 * citation frameworks exclusively -- no Ayurveda or TCM terminology.
 *
 * Imports ONLY from shared types and schemas. No cross-tradition imports.
 */

import type { NaturopathyInput } from '@triveda/shared/llm/types.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NaturopathyFoodFactSheet {
  foodName: string;
  nutritionalData: {
    macros: { protein: number; carbs: number; fat: number; fiber: number };
    keyMicronutrients: string[];
    glycemicIndex: number;
  };
  bioactiveCompounds: { name: string; amount: string }[];
  evidenceClaims: { claim: string; evidenceLevel: string; source: string }[];
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

/**
 * Build the system prompt for the Naturopathy tradition call.
 *
 * Includes the food fact sheet as structured data. The food data block
 * should be cacheable for repeated requests about the same food.
 */
export function buildSystemPrompt(foodFactSheet: NaturopathyFoodFactSheet): string {
  const compoundLines =
    foodFactSheet.bioactiveCompounds.length > 0
      ? foodFactSheet.bioactiveCompounds.map((c) => `  ${c.name}: ${c.amount}`).join('\n')
      : '  (none documented)';

  const claimLines =
    foodFactSheet.evidenceClaims.length > 0
      ? foodFactSheet.evidenceClaims
          .map((c) => `  - "${c.claim}" [${c.evidenceLevel}] (${c.source})`)
          .join('\n')
      : '  (no evidence claims on record)';

  return `You are a nutritional science advisor with an honesty mandate. Your role is to assess health claims about food using published scientific evidence.

## Role and Behavioral Constraints

- Assess evidence levels for health claims about the food. Use the scale: strong, moderate, preliminary, traditional_only, none.
- List PubMed citations for claims that have supporting evidence. Include the claim, source identifier, and year when available.
- Explicitly flag claims that lack evidence. Use clear language: "no controlled trials exist for...", "this claim is based on traditional use only", etc.
- The "honest_gaps" array MUST contain at least one entry if any claim in the food data lacks strong evidence. Intellectual honesty is the core value of this tradition lens.
- Write the "plain_english" field as 1-3 sentences grounded in biochemistry that a non-specialist would understand.
- Stay within the evidence-based nutritional science framework. Do not use concepts or terminology from traditional healing systems.
- Do not reference traditional classification systems, energy channels, constitutional types, or non-scientific frameworks.
- Never recommend a food. You are assessing the evidence for a food that has already been selected.

## Output Format

Respond with a JSON object containing exactly these fields:
- evidence_level (string): One of "strong", "moderate", "preliminary", "traditional_only", "none"
- pubmed_citations (array): Each object has "claim" (string), "source" (string), and optional "year" (number)
- honest_gaps (array of strings): Claims that lack scientific evidence -- must have at least one entry if any claim is weakly supported
- plain_english (string): 1-3 sentence evidence summary for a general audience

## Food Fact Sheet (Nutritional and Evidence Data)

Food Name: ${foodFactSheet.foodName}

Macronutrients (per serving):
  Protein: ${foodFactSheet.nutritionalData.macros.protein}g
  Carbohydrates: ${foodFactSheet.nutritionalData.macros.carbs}g
  Fat: ${foodFactSheet.nutritionalData.macros.fat}g
  Fiber: ${foodFactSheet.nutritionalData.macros.fiber}g

Glycemic Index: ${foodFactSheet.nutritionalData.glycemicIndex}

Key Micronutrients: ${foodFactSheet.nutritionalData.keyMicronutrients.join(', ')}

Bioactive Compounds:
${compoundLines}

Existing Evidence Claims:
${claimLines}

## Important Reminders

- Your primary duty is honesty. If evidence is weak or absent, say so clearly.
- Do not inflate evidence levels. "Traditional use" is not the same as "clinical evidence".
- The honest_gaps field is mandatory whenever any health claim lacks randomized controlled trial support.
- Bioactive compounds should be discussed in terms of their known biochemical mechanisms, not traditional uses.
- When citing PubMed sources, use the format provided in the food fact sheet. Do not fabricate citation identifiers.
- Glycemic index values below 55 are considered low, 55-69 moderate, and 70+ high.`;
}

// ---------------------------------------------------------------------------
// User prompt
// ---------------------------------------------------------------------------

/**
 * Build the per-request user prompt for the Naturopathy tradition call.
 *
 * Contains user-specific context that varies per request (not cacheable).
 */
export function buildUserPrompt(input: NaturopathyInput, userText?: string): string {
  const parts: string[] = [];

  // Nutritional context
  parts.push(`## Nutritional Data
Protein: ${input.nutritionalData.macros.protein}g
Carbs: ${input.nutritionalData.macros.carbs}g
Fat: ${input.nutritionalData.macros.fat}g
Fiber: ${input.nutritionalData.macros.fiber}g
Glycemic Index: ${input.nutritionalData.glycemicIndex}
Key Micronutrients: ${input.nutritionalData.keyMicronutrients.join(', ')}`);

  // Bioactive compounds
  if (input.bioactiveCompounds.length > 0) {
    const compoundLines = input.bioactiveCompounds
      .map((c: { name: string; amount: string }) => `- ${c.name}: ${c.amount}`)
      .join('\n');
    parts.push(`## Bioactive Compounds\n${compoundLines}`);
  }

  // User biomarkers
  if (input.userBiomarkers && input.userBiomarkers.length > 0) {
    const biomarkerLines = input.userBiomarkers
      .map(
        (b: { name: string; value: number; unit: string }) => `- ${b.name}: ${b.value} ${b.unit}`,
      )
      .join('\n');
    parts.push(`## User Biomarkers\n${biomarkerLines}`);
  }

  // User-provided text (sanitized)
  if (userText !== undefined && userText.length > 0) {
    parts.push(`## User Input\n<user_input>${sanitizeUserInput(userText)}</user_input>`);
  }

  return parts.join('\n\n');
}

// ---------------------------------------------------------------------------
// Input sanitization (inline -- Section 08 not yet implemented)
// ---------------------------------------------------------------------------

/**
 * Basic sanitization for user-provided text in prompts.
 * Placeholder until Section 08 provides the full implementation.
 */
export function sanitizeUserInput(text: string): string {
  return text.replace(/<\/?[a-zA-Z_][a-zA-Z0-9_]*(?:\s[^>]*)?>/g, '').trim();
}
