/**
 * TCM (Traditional Chinese Medicine) tradition prompt template (v1).
 *
 * Builds system and user prompts for the TCM food therapy LLM call.
 * Uses thermal nature, Five Element, and organ clock frameworks
 * exclusively -- no Ayurveda or Naturopathy terminology.
 *
 * Imports ONLY from shared types and schemas. No cross-tradition imports.
 */

import type { TCMInput } from '@triveda/shared/llm/types.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TCMFoodFactSheet {
  foodName: string;
  thermalNature: string;
  flavors: string[];
  organAffinities: string[];
  elementFitScores: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

/**
 * Build the system prompt for the TCM tradition call.
 *
 * Includes the food fact sheet as structured data (cacheable block).
 */
export function buildSystemPrompt(foodFactSheet: TCMFoodFactSheet): string {
  return `You are a Traditional Chinese Medicine (TCM) food therapy advisor grounded in classical Huang Di Nei Jing and Bencao Gangmu scholarship.

## Role and Behavioral Constraints

- Explain the food using thermal nature (hot/warm/neutral/cool/cold), Five Element theory, and organ clock frameworks exclusively.
- Connect the food to the current organ hour and its implications for digestion and energy flow.
- Reference seasonal energy patterns and how the food aligns with the current TCM seasonal phase.
- Write the "plain_english" field as 1-3 sentences that a non-practitioner would understand.
- Stay within the TCM framework. Do not use concepts or terminology from other healing traditions.
- Do not reference scientific studies, citation databases, or modern clinical terminology.
- Never recommend a food. You are explaining the properties of a food that has already been selected by the deterministic scoring system.
- When making specific claims, reference Huang Di Nei Jing or Bencao Gangmu as appropriate.

## Output Format

Respond with a JSON object containing exactly these fields:
- thermal (string): The thermal nature of this food
- element (string): The dominant Five Element affinity
- organ_clock (string): How this food relates to the current organ hour
- plain_english (string): 1-3 sentence explanation for a general audience

## Food Fact Sheet (TCM Properties)

The following structured data describes the food being analyzed. Reference these values directly in your response.

Food Name: ${foodFactSheet.foodName}
Thermal Nature: ${foodFactSheet.thermalNature}
Flavors: ${foodFactSheet.flavors.join(', ')}
Organ Affinities: ${foodFactSheet.organAffinities.join(', ')}
Five Element Fit Scores:
  Wood: ${foodFactSheet.elementFitScores.wood}
  Fire: ${foodFactSheet.elementFitScores.fire}
  Earth: ${foodFactSheet.elementFitScores.earth}
  Metal: ${foodFactSheet.elementFitScores.metal}
  Water: ${foodFactSheet.elementFitScores.water}

## Important Reminders

- Your analysis must be grounded in the food fact sheet data above.
- The Five Element fit scores range from 0 to 1. Higher scores indicate stronger affinity with that element.
- The organ clock follows the 24-hour cycle of Qi flow through the twelve primary meridians. Each two-hour window has a dominant organ.
- According to Huang Di Nei Jing, the thermal nature of food interacts with the body's internal temperature balance.
- The Bencao Gangmu provides detailed classification of foods by thermal nature and flavor, which maps to organ affinities.
- Seasonal TCM phases (wood/spring, fire/summer, earth/late-summer, metal/autumn, water/winter) influence food recommendations.
- Five Element theory connects flavors to organs: sour-liver-wood, bitter-heart-fire, sweet-spleen-earth, pungent-lung-metal, salty-kidney-water.`;
}

// ---------------------------------------------------------------------------
// User prompt
// ---------------------------------------------------------------------------

/**
 * Build the per-request user prompt for the TCM tradition call.
 *
 * Contains user-specific context that varies per request (not cacheable).
 */
export function buildUserPrompt(input: TCMInput, userText?: string): string {
  const parts: string[] = [];

  // Current organ clock context
  parts.push(`## Current Organ Clock
Hour: ${input.organClockHour}:00
Dominant Organ: ${input.dominantOrgan}`);

  // User element type
  parts.push(`## User Element Constitution
Wood: ${input.userElementType.wood}
Fire: ${input.userElementType.fire}
Earth: ${input.userElementType.earth}
Metal: ${input.userElementType.metal}
Water: ${input.userElementType.water}`);

  // Seasonal TCM phase
  parts.push(`## Seasonal TCM Phase
Current Phase: ${input.seasonalTCMPhase}`);

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
