/**
 * Alberta Health Services normalizer (Canadian, SI units).
 */

import type { NormalizedBiomarker } from '../canonical-schema.js';
import type { RawBiomarker } from '../types.js';
import { normalizeWithAliases } from './shared.js';

export const AHS_ALIASES: Record<string, string> = {
  // Glucose
  'glucose (fasting)': 'glucose_fasting',
  'glucose fasting': 'glucose_fasting',
  'glucose, fasting': 'glucose_fasting',
  glucose: 'glucose_fasting',

  // HbA1c
  'hemoglobin a1c': 'hba1c',
  hba1c: 'hba1c',

  // LDL
  'ldl cholesterol': 'ldl_cholesterol',
  ldl: 'ldl_cholesterol',
  'ldl-c': 'ldl_cholesterol',

  // HDL
  'hdl cholesterol': 'hdl_cholesterol',
  hdl: 'hdl_cholesterol',

  // Total chol
  'cholesterol total': 'total_cholesterol',
  'total cholesterol': 'total_cholesterol',
  cholesterol: 'total_cholesterol',

  // Triglycerides
  triglycerides: 'triglycerides',

  // TSH
  tsh: 'tsh',

  // Ferritin
  ferritin: 'ferritin',
  'serum ferritin': 'ferritin',

  // Vitamin D
  '25-hydroxyvitamin d': 'vitamin_d_25_oh',
  '25-oh vitamin d': 'vitamin_d_25_oh',
  'vitamin d, 25-hydroxy': 'vitamin_d_25_oh',

  // B12
  'vitamin b12': 'vitamin_b12',
  b12: 'vitamin_b12',

  // CRP
  'c-reactive protein (high sensitivity)': 'hs_crp',
  'hs-crp': 'hs_crp',
  'high sensitivity crp': 'hs_crp',

  // Iron
  iron: 'iron',

  // Hgb
  hemoglobin: 'hemoglobin',
  hgb: 'hemoglobin',

  // WBC
  wbc: 'wbc',
  'white blood cell count': 'wbc',

  // Platelets
  platelets: 'platelets',
  'platelet count': 'platelets',
};

export function normalizeAHS(raw: RawBiomarker): NormalizedBiomarker | null {
  return normalizeWithAliases(raw, { aliases: AHS_ALIASES });
}
