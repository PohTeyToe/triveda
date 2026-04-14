/**
 * Vendor-normalizer router.
 */

import type { NormalizedBiomarker } from '../canonical-schema.js';
import type { RawBiomarker, VendorType } from '../types.js';
import { normalizeAHS } from './ahs.js';
import { normalizeGeneric } from './generic.js';
import { normalizeLabCorp } from './labcorp.js';
import { normalizeLifeLabs } from './lifelabs.js';
import { normalizeQuest } from './quest.js';

export interface VendorNormalizer {
  normalize(raw: RawBiomarker): NormalizedBiomarker | null;
}

export function getNormalizer(vendor: VendorType): VendorNormalizer {
  switch (vendor) {
    case 'lifelabs':
      return { normalize: normalizeLifeLabs };
    case 'quest':
      return { normalize: normalizeQuest };
    case 'labcorp':
      return { normalize: normalizeLabCorp };
    case 'ahs':
      return { normalize: normalizeAHS };
    default:
      return { normalize: normalizeGeneric };
  }
}

export { normalizeLifeLabs, normalizeQuest, normalizeLabCorp, normalizeAHS, normalizeGeneric };
