/**
 * LabCorp normalizer (US, conventional units).
 */

import type { NormalizedBiomarker } from '../canonical-schema.js';
import type { RawBiomarker } from '../types.js';
import { normalizeWithAliases } from './shared.js';

export const LABCORP_ALIASES: Record<string, string> = {
  // Glucose
  glucose: 'glucose_fasting',
  'glucose, fasting': 'glucose_fasting',
  'glucose, serum': 'glucose_fasting',

  // HbA1c
  'hemoglobin a1c': 'hba1c',
  hba1c: 'hba1c',
  a1c: 'hba1c',

  // LDL
  'ldl chol calc (nih)': 'ldl_cholesterol',
  'ldl cholesterol': 'ldl_cholesterol',
  'ldl-cholesterol': 'ldl_cholesterol',
  ldl: 'ldl_cholesterol',

  // HDL
  'hdl cholesterol': 'hdl_cholesterol',
  hdl: 'hdl_cholesterol',

  // Total chol
  'cholesterol, total': 'total_cholesterol',
  'total cholesterol': 'total_cholesterol',
  cholesterol: 'total_cholesterol',

  // Trig
  triglycerides: 'triglycerides',
  triglyceride: 'triglycerides',

  // TSH
  tsh: 'tsh',

  // Ferritin
  ferritin: 'ferritin',
  'ferritin, serum': 'ferritin',

  // Vitamin D
  '25(oh)d': 'vitamin_d_25_oh',
  '25-oh vitamin d': 'vitamin_d_25_oh',
  'vitamin d, 25-hydroxy': 'vitamin_d_25_oh',
  'vitamin d 25-oh': 'vitamin_d_25_oh',

  // B12
  'vitamin b12': 'vitamin_b12',
  b12: 'vitamin_b12',

  // CRP
  hscrp: 'hs_crp',
  'hs-crp': 'hs_crp',
  'c-reactive protein (cardiac)': 'hs_crp',

  // Iron
  iron: 'iron',
  'iron, serum': 'iron',

  // Hemoglobin
  hemoglobin: 'hemoglobin',
  hgb: 'hemoglobin',

  // WBC
  wbc: 'wbc',
  'white blood count': 'wbc',

  // Platelets
  platelets: 'platelets',
};

export function normalizeLabCorp(raw: RawBiomarker): NormalizedBiomarker | null {
  return normalizeWithAliases(raw, { aliases: LABCORP_ALIASES });
}
