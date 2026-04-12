/**
 * Cuisine taxonomy -- ~20 codes covering common culinary traditions.
 *
 * No standard taxonomy (Unicode CLDR, ISO, food taxonomy RFCs) covers
 * cultural cuisine classification, so we use our own kebab-case codes.
 */

import type { CuisineEntry } from './types.js';

export const CUISINES: readonly CuisineEntry[] = [
  {
    code: 'indian-north',
    label: 'North Indian',
    region: 'South Asia',
    aliases: ['punjabi', 'mughlai'],
  },
  {
    code: 'indian-south',
    label: 'South Indian',
    region: 'South Asia',
    aliases: ['tamil', 'kerala'],
  },
  { code: 'jamaican', label: 'Jamaican', region: 'Caribbean', aliases: ['caribbean'] },
  {
    code: 'west-african',
    label: 'West African',
    region: 'Africa',
    aliases: ['nigerian', 'ghanaian'],
  },
  { code: 'ethiopian', label: 'Ethiopian', region: 'Africa', aliases: ['eritrean'] },
  { code: 'cantonese', label: 'Cantonese', region: 'East Asia', aliases: ['hong-kong', 'dim-sum'] },
  { code: 'japanese', label: 'Japanese', region: 'East Asia', aliases: ['washoku'] },
  { code: 'korean', label: 'Korean', region: 'East Asia', aliases: ['hansik'] },
  { code: 'thai', label: 'Thai', region: 'Southeast Asia', aliases: [] },
  { code: 'vietnamese', label: 'Vietnamese', region: 'Southeast Asia', aliases: [] },
  { code: 'mexican', label: 'Mexican', region: 'Americas', aliases: ['tex-mex'] },
  {
    code: 'italian-southern',
    label: 'Southern Italian',
    region: 'Europe',
    aliases: ['neapolitan', 'sicilian'],
  },
  {
    code: 'italian-northern',
    label: 'Northern Italian',
    region: 'Europe',
    aliases: ['milanese', 'venetian'],
  },
  { code: 'greek', label: 'Greek', region: 'Europe', aliases: ['hellenic'] },
  {
    code: 'middle-eastern',
    label: 'Middle Eastern',
    region: 'Middle East',
    aliases: ['levantine', 'lebanese'],
  },
  { code: 'persian', label: 'Persian', region: 'Middle East', aliases: ['iranian'] },
  { code: 'mediterranean', label: 'Mediterranean', region: 'Cross-region', aliases: [] },
  {
    code: 'american-southern',
    label: 'Southern American',
    region: 'Americas',
    aliases: ['soul-food', 'cajun'],
  },
  { code: 'brazilian', label: 'Brazilian', region: 'Americas', aliases: [] },
  { code: 'french', label: 'French', region: 'Europe', aliases: [] },
] as const;

/** Find a cuisine entry by exact code match. */
export function getCuisineByCode(code: string): CuisineEntry | undefined {
  return CUISINES.find((c) => c.code === code);
}

/** Get the display label for a cuisine code, with code as fallback. */
export function getCuisineLabel(code: string): string {
  return getCuisineByCode(code)?.label ?? code;
}

/** Check if a code exists in the cuisine taxonomy. */
export function isValidCuisineCode(code: string): boolean {
  return getCuisineByCode(code) !== undefined;
}

/** Get all cuisines in a given region. */
export function getCuisinesByRegion(region: string): CuisineEntry[] {
  return CUISINES.filter((c) => c.region === region);
}

// Re-export types
export type { CuisineEntry } from './types.js';
