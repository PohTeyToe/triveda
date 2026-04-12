/**
 * LLMProvider interface.
 *
 * Abstraction over the LLM API (Gemini 2.5 Flash initially, swappable).
 * Types and interface only -- runtime implementations live in apps/api.
 */

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stopSequences?: string[];
}

export interface LLMUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface LLMResponse {
  text: string;
  usage: LLMUsage;
  model: string;
  finishReason: 'stop' | 'length' | 'error';
}

export interface LLMProvider {
  /** Send a completion request to the LLM. */
  complete(prompt: string, options?: LLMOptions): Promise<LLMResponse>;
}
