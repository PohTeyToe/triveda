/**
 * v1 prompt templates -- public API.
 *
 * Re-exports all tradition prompt builders and their food fact sheet types.
 * Versioned under v1/ so prompt iterations can coexist.
 */

export {
  buildSystemPrompt as buildAyurvedaSystemPrompt,
  buildUserPrompt as buildAyurvedaUserPrompt,
  type AyurvedaFoodFactSheet,
} from './ayurveda.js';

export {
  buildSystemPrompt as buildTCMSystemPrompt,
  buildUserPrompt as buildTCMUserPrompt,
  type TCMFoodFactSheet,
} from './tcm.js';

export {
  buildSystemPrompt as buildNaturopathySystemPrompt,
  buildUserPrompt as buildNaturopathyUserPrompt,
  type NaturopathyFoodFactSheet,
} from './naturopathy.js';

export {
  buildSystemPrompt as buildSynthesisSystemPrompt,
  buildUserPrompt as buildSynthesisUserPrompt,
} from './synthesis.js';
