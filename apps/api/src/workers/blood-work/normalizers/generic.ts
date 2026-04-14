/**
 * Generic fallback normalizer — combines aliases from all known vendors
 * plus canonical slugs. Used when vendor detection returns 'unknown'.
 */

import type { NormalizedBiomarker } from '../canonical-schema.js';
import type { RawBiomarker } from '../types.js';
import { AHS_ALIASES } from './ahs.js';
import { LABCORP_ALIASES } from './labcorp.js';
import { LIFELABS_ALIASES } from './lifelabs.js';
import { QUEST_ALIASES } from './quest.js';
import { buildGenericAliases, normalizeWithAliases } from './shared.js';

export const GENERIC_ALIASES = buildGenericAliases([
  LIFELABS_ALIASES,
  QUEST_ALIASES,
  LABCORP_ALIASES,
  AHS_ALIASES,
]);

export function normalizeGeneric(raw: RawBiomarker): NormalizedBiomarker | null {
  return normalizeWithAliases(raw, { aliases: GENERIC_ALIASES, baseConfidence: 0.85 });
}
