/**
 * LifeLabs normalizer (Canadian, SI units).
 */

import type { NormalizedBiomarker } from '../canonical-schema.js';
import type { RawBiomarker } from '../types.js';
import { normalizeWithAliases } from './shared.js';

export const LIFELABS_ALIASES: Record<string, string> = {
  // Glucose
  'glucose, fasting': 'glucose_fasting',
  'fasting glucose': 'glucose_fasting',
  'fasting blood glucose': 'glucose_fasting',
  'glucose (fasting)': 'glucose_fasting',
  glucose: 'glucose_fasting',

  // HbA1c
  hba1c: 'hba1c',
  'hemoglobin a1c': 'hba1c',
  'hgb a1c': 'hba1c',

  // LDL
  'ldl cholesterol': 'ldl_cholesterol',
  ldl: 'ldl_cholesterol',
  'ldl-c': 'ldl_cholesterol',

  // HDL
  'hdl cholesterol': 'hdl_cholesterol',
  hdl: 'hdl_cholesterol',
  'hdl-c': 'hdl_cholesterol',

  // Total chol
  'total cholesterol': 'total_cholesterol',
  'cholesterol total': 'total_cholesterol',
  cholesterol: 'total_cholesterol',

  // Triglycerides
  triglycerides: 'triglycerides',
  triglyceride: 'triglycerides',
  trig: 'triglycerides',

  // TSH
  tsh: 'tsh',
  'thyroid stimulating hormone': 'tsh',
  thyrotropin: 'tsh',

  // Ferritin
  ferritin: 'ferritin',
  'serum ferritin': 'ferritin',
  fer: 'ferritin',

  // Vitamin D
  '25-oh vitamin d': 'vitamin_d_25_oh',
  'vitamin d, 25-hydroxy': 'vitamin_d_25_oh',
  'vit d 25-oh': 'vitamin_d_25_oh',
  '25-hydroxyvitamin d': 'vitamin_d_25_oh',
  'vitamin d 25-oh': 'vitamin_d_25_oh',

  // B12
  'vitamin b12': 'vitamin_b12',
  b12: 'vitamin_b12',
  cobalamin: 'vitamin_b12',

  // hs-CRP
  'hs-crp': 'hs_crp',
  'high sensitivity c-reactive protein': 'hs_crp',
  hscrp: 'hs_crp',

  // Iron
  iron: 'iron',
  'serum iron': 'iron',
  fe: 'iron',

  // Hemoglobin
  hemoglobin: 'hemoglobin',
  hgb: 'hemoglobin',
  hb: 'hemoglobin',

  // WBC
  wbc: 'wbc',
  'white blood cells': 'wbc',
  'white blood cell count': 'wbc',

  // Platelets
  platelets: 'platelets',
  'platelet count': 'platelets',
  plt: 'platelets',
};

export function normalizeLifeLabs(raw: RawBiomarker): NormalizedBiomarker | null {
  return normalizeWithAliases(raw, { aliases: LIFELABS_ALIASES });
}
