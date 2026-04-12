/**
 * Check-in mapping types.
 */

export type { DoshaDelta } from '../inputs/types.js';

/**
 * Definition of a single chip pair with Ayurvedic dosha mappings.
 *
 * The description field explains the Ayurvedic rationale for the mapping.
 */
export type ChipPairDefinition = {
  id: string;
  left_label: string;
  right_label: string;
  left_vata_delta: number;
  left_pitta_delta: number;
  left_kapha_delta: number;
  right_vata_delta: number;
  right_pitta_delta: number;
  right_kapha_delta: number;
  description: string;
};
