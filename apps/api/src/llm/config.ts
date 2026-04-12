/**
 * LLM configuration module.
 *
 * Centralizes model selection, temperature defaults, cost rates, and
 * API key validation. Imported by the orchestrator and observability
 * modules in later sections.
 */

import type { TraditionProviderMap, TraditionType } from '@triveda/shared/llm/types.js';
import { DEFAULT_PROVIDER_MAP } from '@triveda/shared/llm/types.js';

// ---------------------------------------------------------------------------
// Cost rates (USD per 1M tokens, as of 2026-04)
// ---------------------------------------------------------------------------

export interface ModelCostRate {
  inputPer1M: number;
  outputPer1M: number;
  cachedInputPer1M: number;
}

export const MODEL_COST_RATES: Record<string, ModelCostRate> = {
  'claude-sonnet-4-6': {
    inputPer1M: 3.0,
    outputPer1M: 15.0,
    cachedInputPer1M: 0.3,
  },
  'gemini-2.5-flash': {
    inputPer1M: 0.15,
    outputPer1M: 0.6,
    cachedInputPer1M: 0.0375,
  },
};

/**
 * Calculate cost in USD for a given model and token counts.
 */
export function calculateCost(
  model: string,
  tokensIn: number,
  tokensOut: number,
  cachedTokensIn = 0,
): number {
  const rates = MODEL_COST_RATES[model];
  if (!rates) {
    // Unknown model -- return 0 and log a warning in observability
    return 0;
  }
  const freshInput = tokensIn - cachedTokensIn;
  return (
    (freshInput * rates.inputPer1M) / 1_000_000 +
    (cachedTokensIn * rates.cachedInputPer1M) / 1_000_000 +
    (tokensOut * rates.outputPer1M) / 1_000_000
  );
}

// ---------------------------------------------------------------------------
// Provider config access
// ---------------------------------------------------------------------------

/**
 * Returns the provider config for a tradition, merging defaults with
 * any overrides. Currently returns defaults only -- override support
 * will be added when the admin settings UI ships.
 */
export function getProviderConfig(
  tradition: TraditionType,
  overrides?: Partial<TraditionProviderMap>,
): TraditionProviderMap[TraditionType] {
  if (overrides?.[tradition]) {
    return { ...DEFAULT_PROVIDER_MAP[tradition], ...overrides[tradition] };
  }
  return DEFAULT_PROVIDER_MAP[tradition];
}

// ---------------------------------------------------------------------------
// Env validation
// ---------------------------------------------------------------------------

export interface LLMEnvStatus {
  anthropicKeySet: boolean;
  googleCredentialsSet: boolean;
  googleProjectSet: boolean;
  mockMode: boolean;
  ready: boolean;
}

/**
 * Check whether the required LLM environment variables are configured.
 * Does NOT throw -- returns a status object for health checks.
 */
export function checkLLMEnv(): LLMEnvStatus {
  const mockMode = process.env.TRIVEDA_LLM_MODE === 'mock';
  const anthropicKeySet = !!process.env.ANTHROPIC_API_KEY;
  const googleCredentialsSet = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const googleProjectSet = !!process.env.GOOGLE_CLOUD_PROJECT;

  return {
    anthropicKeySet,
    googleCredentialsSet,
    googleProjectSet,
    mockMode,
    ready: mockMode || (anthropicKeySet && googleCredentialsSet && googleProjectSet),
  };
}
