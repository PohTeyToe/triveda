/**
 * Provider factory for LLM model instances.
 *
 * Returns Vercel AI SDK model instances configured per tradition.
 * Reads env vars at call time (not module load) for lazy initialization.
 * In mock mode (TRIVEDA_LLM_MODE=mock), the factory is bypassed entirely
 * by callers -- but it also does not throw for missing env vars.
 */

import { createAnthropic } from '@ai-sdk/anthropic';
import { createVertex } from '@ai-sdk/google-vertex';
import type { TraditionType } from '@triveda/shared/llm/types.js';
import type { LanguageModelV1 } from 'ai';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isMockMode(): boolean {
  return process.env.TRIVEDA_LLM_MODE === 'mock';
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value && !isMockMode()) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Set ${name} or use TRIVEDA_LLM_MODE=mock for local development.`,
    );
  }
  return value ?? '';
}

// ---------------------------------------------------------------------------
// Factory functions
// ---------------------------------------------------------------------------

/**
 * Returns a Vercel AI SDK model instance for the given tradition.
 *
 * - ayurveda, tcm, synthesis -> Anthropic Claude claude-sonnet-4-6
 * - naturopathy -> Google Vertex Gemini 2.5 Flash
 *
 * Env vars are read at call time, not module load time.
 */
export function getModelForTradition(tradition: TraditionType): LanguageModelV1 {
  switch (tradition) {
    case 'ayurveda':
    case 'tcm':
    case 'synthesis': {
      const apiKey = requireEnv('ANTHROPIC_API_KEY');
      const anthropic = createAnthropic({ apiKey });
      return anthropic('claude-sonnet-4-6');
    }
    case 'naturopathy': {
      const project = requireEnv('GOOGLE_CLOUD_PROJECT');
      const credentials = requireEnv('GOOGLE_APPLICATION_CREDENTIALS');
      const location = process.env.GOOGLE_CLOUD_LOCATION ?? 'us-central1';
      const vertex = createVertex({
        project,
        location,
        googleAuthOptions: {
          keyFilename: credentials,
        },
      });
      return vertex('gemini-2.5-flash');
    }
    default: {
      const _exhaustive: never = tradition;
      throw new Error(`Unknown tradition: ${_exhaustive}`);
    }
  }
}

/**
 * Returns the fallback model (Google Vertex Gemini 2.5 Flash).
 * Used by the fallback system when Claude is unavailable.
 */
export function getFallbackModel(): LanguageModelV1 {
  const project = requireEnv('GOOGLE_CLOUD_PROJECT');
  const credentials = requireEnv('GOOGLE_APPLICATION_CREDENTIALS');
  const location = process.env.GOOGLE_CLOUD_LOCATION ?? 'us-central1';
  const vertex = createVertex({
    project,
    location,
    googleAuthOptions: {
      keyFilename: credentials,
    },
  });
  return vertex('gemini-2.5-flash');
}
