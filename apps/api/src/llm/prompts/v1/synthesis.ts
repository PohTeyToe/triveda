/**
 * Synthesis prompt template (v1).
 *
 * Builds system and user prompts for the cross-tradition synthesis
 * LLM call. Unlike the tradition prompts, this is a synthesis writer
 * that receives all three tradition outputs and the deterministic
 * convergence flag.
 *
 * Imports ONLY from shared types. No tradition-specific prompt imports.
 */

import type {
  AyurvedaOutput,
  NaturopathyOutput,
  SynthesisInput,
  TCMOutput,
} from '@triveda/shared/llm/types.js';

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

/**
 * Build the system prompt for the synthesis call.
 *
 * The synthesis prompt is fundamentally different from tradition prompts.
 * It receives pre-computed outputs and a convergence flag, and writes
 * a human-readable summary. It does NOT compute convergence.
 */
export function buildSystemPrompt(): string {
  return `You are a cross-tradition synthesis writer for Triveda, a three-tradition food companion.

## Role and Behavioral Constraints

- You receive structured outputs from three tradition analyses (Ayurveda, TCM, Naturopathy) and a pre-computed convergence flag.
- The convergence flag has already been computed by the deterministic scoring system. You are REPORTING it, not computing it. Do not assess whether traditions agree -- that has been determined for you.
- When the convergence flag is true: frame the agreement positively. Example: "All three traditions point the same direction this morning: warm, grounding food for your constitution in a transitional season."
- When the convergence flag is false: explain the tension explicitly. Describe which traditions disagree and on what dimension. This is valuable information, not an error.
- The "two_sentence_rationale" is surface card text a user reads in 5 seconds. It must be concrete and specific to this food and this user.

## Output Format

Respond with a JSON object containing exactly these fields:
- convergence_framing (string): A 1-3 sentence framing of how the three traditions relate on this food for this user. Must be non-empty.
- two_sentence_rationale (string): The card text. Two sentences maximum. Specific to this food and user context.

## Important Reminders

- You are a reporter, not an analyst. The convergence computation is complete before you are called.
- If a tradition output is null/unavailable, note it briefly but do not speculate about what it would have said.
- Use plain language. No jargon from any tradition unless directly quoting a tradition's output.
- The convergence dimensions (thermal, constitutional, seasonal, evidence) tell you WHERE agreement or disagreement occurs.
- Keep the two_sentence_rationale actionable and grounded. "This food is good for you" is too vague. "Warm oatmeal pacifies your elevated Vata while providing moderate fiber evidence" is concrete.`;
}

// ---------------------------------------------------------------------------
// User prompt
// ---------------------------------------------------------------------------

/**
 * Build the per-request user prompt for the synthesis call.
 *
 * Includes all three tradition outputs, the convergence flag, and
 * convergence dimensions.
 */
export function buildUserPrompt(input: SynthesisInput): string {
  const parts: string[] = [];

  // Selected food
  parts.push(`## Selected Food
Name: ${input.selectedFoodName}
ID: ${input.selectedFoodId}`);

  // Deterministic convergence flag
  parts.push(`## Convergence (Pre-Computed)
Convergence Flag: ${input.convergenceFlag}
Dimensions:
  Thermal: ${input.convergenceDimensions.thermal}
  Constitutional: ${input.convergenceDimensions.constitutional}
  Seasonal: ${input.convergenceDimensions.seasonal}
  Evidence: ${input.convergenceDimensions.evidence}`);

  // Ayurveda output
  if (input.ayurvedaOutput !== null) {
    parts.push(`## Ayurveda Tradition Output
${formatTraditionOutput('ayurveda', input.ayurvedaOutput)}`);
  } else {
    parts.push('## Ayurveda Tradition Output\n(unavailable -- tradition call failed or timed out)');
  }

  // TCM output
  if (input.tcmOutput !== null) {
    parts.push(`## TCM Tradition Output
${formatTraditionOutput('tcm', input.tcmOutput)}`);
  } else {
    parts.push('## TCM Tradition Output\n(unavailable -- tradition call failed or timed out)');
  }

  // Naturopathy output
  if (input.naturopathyOutput !== null) {
    parts.push(`## Naturopathy Tradition Output
${formatTraditionOutput('naturopathy', input.naturopathyOutput)}`);
  } else {
    parts.push(
      '## Naturopathy Tradition Output\n(unavailable -- tradition call failed or timed out)',
    );
  }

  return parts.join('\n\n');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTraditionOutput(
  _tradition: 'ayurveda' | 'tcm' | 'naturopathy',
  output: AyurvedaOutput | TCMOutput | NaturopathyOutput,
): string {
  // Serialize as indented JSON for readability in the prompt
  return JSON.stringify(output, null, 2);
}
