// Shared Ayurveda and TCM column definitions for foods and herbs tables.
// These are plain objects spread into pgTable calls -- not Drizzle mixins.

import { jsonb, smallint, text } from 'drizzle-orm/pg-core';

/** Six Ayurvedic seasons mapped to relevance scores (0-1). */
export type RituFit = Record<
  'shishira' | 'vasanta' | 'grishma' | 'varsha' | 'sharad' | 'hemanta',
  number
>;

/** Five TCM elements mapped to affinity scores (0-1). */
export type ElementFit = Record<'wood' | 'fire' | 'earth' | 'metal' | 'water', number>;

/**
 * Ayurveda columns shared between foods and herbs tables.
 * Dosha effects use smallint (-2 to +2 scale): negative = reduces, positive = aggravates.
 */
export const ayurvedaColumns = {
  rasa: text('rasa').array().notNull(),
  virya: text('virya').notNull(),
  vipaka: text('vipaka').notNull(),
  guna: text('guna').array().notNull(),
  vata_effect: smallint('vata_effect').notNull(),
  pitta_effect: smallint('pitta_effect').notNull(),
  kapha_effect: smallint('kapha_effect').notNull(),
  ritu_fit: jsonb('ritu_fit').$type<RituFit>().notNull(),
};

/**
 * TCM columns shared between foods and herbs tables.
 */
export const tcmColumns = {
  thermal_nature: text('thermal_nature').notNull(),
  flavor: text('flavor').array().notNull(),
  organ_affinity: text('organ_affinity').array().notNull(),
  actions: text('actions').array().notNull(),
  element_fit: jsonb('element_fit').$type<ElementFit>().notNull(),
};
