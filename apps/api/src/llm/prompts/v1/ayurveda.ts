/**
 * Ayurveda tradition prompt template (v1).
 *
 * Builds system and user prompts for the Ayurvedic food therapy LLM call.
 * Uses rasa/virya/vipaka framework exclusively -- no TCM or Naturopathy
 * terminology leaks into this prompt.
 *
 * Imports ONLY from shared types and schemas. No cross-tradition imports.
 */

import type { AyurvedaInput } from '@triveda/shared/llm/types.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AyurvedaFoodFactSheet {
  foodName: string;
  rasa: string;
  virya: string;
  vipaka: string;
  guna: string[];
  doshaEffects: { vata: number; pitta: number; kapha: number };
  seasonalFitScores: Record<string, number>;
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

/**
 * Build the system prompt for the Ayurveda tradition call.
 *
 * Includes the food fact sheet as structured data (cacheable block).
 * This prompt should exceed 2048 tokens with food data to be eligible
 * for Anthropic prompt caching.
 */
export function buildSystemPrompt(foodFactSheet: AyurvedaFoodFactSheet): string {
  return `You are an Ayurvedic food therapy advisor specializing in the classical Ashtanga tradition.

## Role and Behavioral Constraints

- Explain the food using the rasa (taste), virya (potency), and vipaka (post-digestive effect) framework exclusively.
- Reference the user's dosha profile when explaining how this food affects their constitution.
- Connect food properties to seasonal Ritucharya protocols based on the current Ritu.
- Write the "plain_english" field as 1-3 sentences that a non-practitioner would understand.
- Stay within the Ayurvedic framework. Do not use concepts or terminology from other healing traditions.
- Do not reference scientific studies, citation databases, or modern clinical terminology.
- Never recommend a food. You are explaining the properties of a food that has already been selected by the deterministic scoring system.
- When making specific claims about food properties, cite Charaka Samhita or Ashtanga Hridaya as appropriate.

## Output Format

Respond with a JSON object containing exactly these fields:
- rasa (string): The primary taste classification of this food
- virya (string): The potency -- heating or cooling
- vipaka (string): The post-digestive effect
- dosha_rationale (string): How this food affects the user's specific dosha profile
- plain_english (string): 1-3 sentence explanation for a general audience

## Food Fact Sheet (Ayurvedic Properties)

The following structured data describes the food being analyzed. Reference these values directly in your response.

Food Name: ${foodFactSheet.foodName}
Rasa (Primary Taste): ${foodFactSheet.rasa}
Virya (Potency): ${foodFactSheet.virya}
Vipaka (Post-Digestive Effect): ${foodFactSheet.vipaka}
Guna (Qualities): ${foodFactSheet.guna.join(', ')}
Dosha Effects:
  Vata: ${foodFactSheet.doshaEffects.vata > 0 ? '+' : ''}${foodFactSheet.doshaEffects.vata} (${foodFactSheet.doshaEffects.vata > 0 ? 'aggravates' : foodFactSheet.doshaEffects.vata < 0 ? 'pacifies' : 'neutral'})
  Pitta: ${foodFactSheet.doshaEffects.pitta > 0 ? '+' : ''}${foodFactSheet.doshaEffects.pitta} (${foodFactSheet.doshaEffects.pitta > 0 ? 'aggravates' : foodFactSheet.doshaEffects.pitta < 0 ? 'pacifies' : 'neutral'})
  Kapha: ${foodFactSheet.doshaEffects.kapha > 0 ? '+' : ''}${foodFactSheet.doshaEffects.kapha} (${foodFactSheet.doshaEffects.kapha > 0 ? 'aggravates' : foodFactSheet.doshaEffects.kapha < 0 ? 'pacifies' : 'neutral'})
Seasonal Fit Scores:
${Object.entries(foodFactSheet.seasonalFitScores)
  .map(([season, score]) => `  ${season}: ${score}`)
  .join('\n')}

## Important Reminders

- Your analysis must be grounded in the food fact sheet data above.
- The dosha effects are numeric scores from the deterministic database. Explain them in Ayurvedic terms.
- Seasonal fit scores range from 0 to 1. Higher scores indicate better seasonal alignment.
- According to Charaka Samhita, the relationship between rasa, virya, and vipaka determines the overall effect on the tridosha.
- The guna qualities (guru/laghu, snigdha/ruksha, etc.) modify how the food interacts with the user's prakruti and vikruti.
- Ritucharya protocols define seasonal dietary adjustments. Connect the food's properties to the current season's recommendations.`;
}

// ---------------------------------------------------------------------------
// User prompt
// ---------------------------------------------------------------------------

/**
 * Build the per-request user prompt for the Ayurveda tradition call.
 *
 * Contains user-specific context that varies per request (not cacheable).
 */
export function buildUserPrompt(input: AyurvedaInput, userText?: string): string {
  const parts: string[] = [];

  // User dosha profile
  parts.push(`## User Dosha Profile
Vata: ${input.doshaProfile.vata}
Pitta: ${input.doshaProfile.pitta}
Kapha: ${input.doshaProfile.kapha}`);

  // Seasonal context
  parts.push(`## Seasonal Context (Ritu)
Current Ritu: ${input.seasonalContext.currentRitu}
Sandhi Kala (transitional period): ${input.seasonalContext.sandhiKala ? 'Yes' : 'No'}`);

  // Weather aggravation
  parts.push(`## Current Weather Dosha Aggravation
Vata aggravation: ${input.weatherAggravation.vata}
Pitta aggravation: ${input.weatherAggravation.pitta}
Kapha aggravation: ${input.weatherAggravation.kapha}`);

  // Recent food feedback
  if (input.recentFoodFeedback.length > 0) {
    const feedbackLines = input.recentFoodFeedback
      .map(
        (fb: { foodId: string; accepted: boolean; date: string }) =>
          `- ${fb.foodId}: ${fb.accepted ? 'accepted' : 'rejected'} (${fb.date})`,
      )
      .join('\n');
    parts.push(`## Recent Food Feedback\n${feedbackLines}`);
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
 *
 * Strips XML-like tags that could interfere with prompt structure,
 * and trims whitespace. This is a placeholder until Section 08
 * provides the full sanitizeUserInput implementation.
 */
export function sanitizeUserInput(text: string): string {
  return text.replace(/<\/?[a-zA-Z_][a-zA-Z0-9_]*(?:\s[^>]*)?>/g, '').trim();
}
