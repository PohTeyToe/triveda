/**
 * Cuisine taxonomy types.
 */

export type CuisineEntry = {
  code: string; // lowercase kebab-case, e.g., 'jamaican'
  label: string; // display label, e.g., 'Jamaican'
  region: string; // geographic region, e.g., 'Caribbean'
  aliases: string[]; // optional search/matching aliases
};
