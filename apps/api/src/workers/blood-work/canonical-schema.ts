/**
 * Canonical biomarker registry, Zod validation schema, unit conversion,
 * and three-tradition context per biomarker.
 */

import { z } from 'zod';
import type { CanonicalBiomarkerEntry, TraditionContext } from './types.js';

// ---------------------------------------------------------------------------
// Zod schema for a normalized biomarker
// ---------------------------------------------------------------------------

export const NormalizedBiomarkerSchema = z.object({
  canonicalKey: z.string(),
  displayName: z.string(),
  value: z.number(),
  unit: z.string(),
  originalUnit: z.string().nullable(),
  referenceRangeLow: z.number().nullable(),
  referenceRangeHigh: z.number().nullable(),
  flag: z.enum(['normal', 'low', 'high', 'critical']),
  loincCode: z.string().nullable(),
  confidence: z.number().min(0).max(1),
});

export type NormalizedBiomarker = z.infer<typeof NormalizedBiomarkerSchema>;

// ---------------------------------------------------------------------------
// Canonical biomarker registry
// ---------------------------------------------------------------------------

export const CANONICAL_BIOMARKER_REGISTRY: CanonicalBiomarkerEntry[] = [
  {
    canonicalKey: 'glucose_fasting',
    displayName: 'Fasting Glucose',
    canonicalUnit: 'mmol/L',
    loincCode: '1558-6',
    conversionFactors: {
      'mg/dL': 0.05551,
    },
  },
  {
    canonicalKey: 'hba1c',
    displayName: 'HbA1c',
    canonicalUnit: '%',
    loincCode: '4548-4',
    conversionFactors: {
      'mmol/mol': (v: number) => 0.0915 * v + 2.15,
    },
  },
  {
    canonicalKey: 'ldl_cholesterol',
    displayName: 'LDL Cholesterol',
    canonicalUnit: 'mmol/L',
    loincCode: '2089-1',
    conversionFactors: {
      'mg/dL': 0.02586,
    },
  },
  {
    canonicalKey: 'hdl_cholesterol',
    displayName: 'HDL Cholesterol',
    canonicalUnit: 'mmol/L',
    loincCode: '2085-9',
    conversionFactors: {
      'mg/dL': 0.02586,
    },
  },
  {
    canonicalKey: 'total_cholesterol',
    displayName: 'Total Cholesterol',
    canonicalUnit: 'mmol/L',
    loincCode: '2093-3',
    conversionFactors: {
      'mg/dL': 0.02586,
    },
  },
  {
    canonicalKey: 'triglycerides',
    displayName: 'Triglycerides',
    canonicalUnit: 'mmol/L',
    loincCode: '2571-8',
    conversionFactors: {
      'mg/dL': 0.01129,
    },
  },
  {
    canonicalKey: 'tsh',
    displayName: 'TSH',
    canonicalUnit: 'mIU/L',
    loincCode: '3016-3',
    conversionFactors: {
      'uIU/mL': 1.0,
    },
  },
  {
    canonicalKey: 'ferritin',
    displayName: 'Ferritin',
    canonicalUnit: 'ug/L',
    loincCode: '2276-4',
    conversionFactors: {
      'ng/mL': 1.0,
    },
  },
  {
    canonicalKey: 'vitamin_d_25_oh',
    displayName: 'Vitamin D 25-OH',
    canonicalUnit: 'nmol/L',
    loincCode: '35365-6',
    conversionFactors: {
      'ng/mL': 2.496,
    },
  },
  {
    canonicalKey: 'vitamin_b12',
    displayName: 'Vitamin B12',
    canonicalUnit: 'pmol/L',
    loincCode: '2132-9',
    conversionFactors: {
      'pg/mL': 0.7378,
    },
  },
  {
    canonicalKey: 'hs_crp',
    displayName: 'hs-CRP',
    canonicalUnit: 'mg/L',
    loincCode: '30522-7',
    conversionFactors: {
      'mg/dL': 10.0,
    },
  },
  {
    canonicalKey: 'iron',
    displayName: 'Iron',
    canonicalUnit: 'umol/L',
    loincCode: '14798-3',
    conversionFactors: {
      'ug/dL': 0.1791,
    },
  },
  {
    canonicalKey: 'hemoglobin',
    displayName: 'Hemoglobin',
    canonicalUnit: 'g/L',
    loincCode: '718-7',
    conversionFactors: {
      'g/dL': 10.0,
    },
  },
  {
    canonicalKey: 'wbc',
    displayName: 'White Blood Cells',
    canonicalUnit: 'x10^9/L',
    loincCode: '6690-2',
    conversionFactors: {
      'K/uL': 1.0,
      'x10^3/uL': 1.0,
    },
  },
  {
    canonicalKey: 'platelets',
    displayName: 'Platelets',
    canonicalUnit: 'x10^9/L',
    loincCode: '777-3',
    conversionFactors: {
      'K/uL': 1.0,
      'x10^3/uL': 1.0,
    },
  },
];

/**
 * Lookup map for fast registry access by canonical key.
 */
const REGISTRY_MAP = new Map(
  CANONICAL_BIOMARKER_REGISTRY.map((entry) => [entry.canonicalKey, entry]),
);

/**
 * Find a registry entry by canonical key.
 */
export function getRegistryEntry(canonicalKey: string): CanonicalBiomarkerEntry | undefined {
  return REGISTRY_MAP.get(canonicalKey);
}

// ---------------------------------------------------------------------------
// Unit conversion
// ---------------------------------------------------------------------------

/**
 * Convert a value from a given unit to the canonical unit for a biomarker.
 * Returns null if the fromUnit is not recognized in the registry.
 * If the fromUnit matches the canonical unit, returns the value unchanged.
 */
export function convertToCanonicalUnit(
  value: number,
  fromUnit: string,
  canonicalKey: string,
): { value: number; unit: string } | null {
  const entry = REGISTRY_MAP.get(canonicalKey);
  if (!entry) return null;

  // Already in canonical unit
  if (fromUnit === entry.canonicalUnit) {
    return { value, unit: entry.canonicalUnit };
  }

  const factor = entry.conversionFactors[fromUnit];
  if (factor === undefined) return null;

  if (typeof factor === 'function') {
    return { value: factor(value), unit: entry.canonicalUnit };
  }

  return { value: value * factor, unit: entry.canonicalUnit };
}

// ---------------------------------------------------------------------------
// Three-tradition context per biomarker
// ---------------------------------------------------------------------------

export const BIOMARKER_TRADITION_CONTEXT: Record<string, TraditionContext> = {
  glucose_fasting: {
    ayurveda:
      'Fasting glucose relates to Medas Dhatu (fat tissue) and Kapha dosha. Elevated glucose suggests excess Kapha accumulation. Bitter and astringent foods (fenugreek, bitter gourd, turmeric) traditionally support glucose metabolism in Ayurveda.',
    tcm: 'In TCM, blood sugar regulation involves the Spleen-Pancreas organ system and Earth element. Elevated glucose may indicate Spleen Qi deficiency with dampness accumulation, suggesting the need for Qi-tonifying and dampness-resolving foods.',
    naturopathy:
      'Strong evidence links dietary fiber, chromium-rich foods, and low-glycemic choices to improved fasting glucose. Cinnamon shows moderate evidence for glucose-lowering effects. Evidence level: strong for dietary fiber, moderate for cinnamon.',
  },
  hba1c: {
    ayurveda:
      'HbA1c reflects long-term glucose control, tied to Prameha (urinary disorders) in Ayurveda. Chronic elevation indicates deep Kapha-Medas imbalance. Bitter rasa foods and Tikta Ghrita (medicated ghee) are traditional interventions.',
    tcm: 'Long-term glucose patterns in TCM relate to Kidney Yin deficiency with internal heat. The Kidney and Spleen organ systems are both involved. Yin-nourishing foods and herbs may support balance.',
    naturopathy:
      'HbA1c improvement is well-documented with whole-grain diets, regular physical activity, and Mediterranean-pattern eating. Reducing refined carbohydrates has strong evidence for HbA1c reduction. Evidence level: strong.',
  },
  ldl_cholesterol: {
    ayurveda:
      'LDL cholesterol corresponds to Ama (metabolic toxins) obstructing Medas Dhatu channels. Pungent and bitter foods (garlic, turmeric, triphala) are traditionally used to clear channel blockages and reduce Ama.',
    tcm: 'Elevated LDL maps to Phlegm and Blood Stasis patterns in TCM, involving the Liver and Spleen. Foods that invigorate blood circulation and resolve phlegm (hawthorn, green tea) are traditionally recommended.',
    naturopathy:
      'Strong evidence supports plant sterols, soluble fiber (oats, psyllium), and nuts for LDL reduction. Replacing saturated fat with unsaturated fat is a well-established intervention. Evidence level: strong.',
  },
  hdl_cholesterol: {
    ayurveda:
      'HDL cholesterol represents healthy Agni (digestive fire) maintaining clean Medas Dhatu. Low HDL suggests weakened Agni. Ghee in small amounts, cumin, and black pepper traditionally support healthy lipid metabolism.',
    tcm: 'Healthy HDL levels reflect balanced Qi circulation through the Liver system. Low HDL may indicate Liver Qi stagnation. Movement-promoting foods and bitter greens support Liver Qi flow.',
    naturopathy:
      'Moderate evidence supports olive oil, fatty fish (omega-3s), and moderate physical activity for raising HDL. Reducing trans fats has strong evidence for HDL improvement. Evidence level: moderate to strong.',
  },
  total_cholesterol: {
    ayurveda:
      'Total cholesterol reflects overall Medas Dhatu (fat tissue) balance. Moderation in sweet and heavy (guru) foods prevents excess Kapha accumulation. Light, warm foods with pungent and bitter tastes support balance.',
    tcm: 'Total cholesterol relates to the Spleen-Liver axis in TCM. The Spleen transforms and transports fats; the Liver ensures smooth flow. Dampness-resolving and Liver-soothing foods support healthy levels.',
    naturopathy:
      'Dietary modification is first-line for total cholesterol management. Plant-based diets, soluble fiber, and reduced saturated fat intake have strong evidence. Portfolio diet approach combines multiple interventions. Evidence level: strong.',
  },
  triglycerides: {
    ayurveda:
      'Triglycerides relate to Meda Dhatu Vriddhi (excess fat tissue growth), a Kapha condition. Honey, warm water, and foods with Tikshna (sharp) guna like ginger and black pepper traditionally reduce Meda excess.',
    tcm: 'Elevated triglycerides map to Dampness and Phlegm patterns, primarily involving the Spleen. Cold, raw, and greasy foods aggravate this pattern. Warm, cooked foods with aromatic spices help resolve dampness.',
    naturopathy:
      'Strong evidence links omega-3 fatty acids (fatty fish, flaxseed) to triglyceride reduction. Reducing refined sugars and alcohol has strong evidence. Weight loss even at 5-10% shows significant improvement. Evidence level: strong.',
  },
  tsh: {
    ayurveda:
      'TSH reflects thyroid function, connected to Agni (metabolic fire) in Ayurveda. High TSH (hypothyroid) suggests diminished Agni. Selenium-rich foods and warming spices (ginger, long pepper) traditionally support thyroid function.',
    tcm: 'Thyroid function in TCM relates to Kidney Yang and Spleen Qi. Hypothyroidism maps to Kidney Yang deficiency with cold signs. Yang-warming foods (walnuts, cinnamon, lamb) traditionally support this pattern.',
    naturopathy:
      'Selenium and iodine are essential micronutrients for thyroid function. Brazil nuts (selenium), seaweed (iodine), and zinc-rich foods support thyroid hormone synthesis. Goitrogenic food effects are minimal when cooked. Evidence level: moderate.',
  },
  ferritin: {
    ayurveda:
      'Ferritin reflects iron stores, corresponding to Rakta Dhatu (blood tissue) in Ayurveda. Low levels suggest depletion of this dhatu. Foods with sweet and astringent rasa (pomegranate, dates, dark leafy greens) traditionally support blood tissue building.',
    tcm: 'In TCM, iron stores relate to Liver Blood. Low ferritin maps to a Liver Blood Deficiency pattern, suggesting the Liver organ system and Wood element need support. Blood-nourishing foods (goji berries, red dates, dark greens) are recommended.',
    naturopathy:
      'Strong evidence: iron-rich foods (red meat, lentils, spinach) raise ferritin levels. Vitamin C co-consumption enhances non-heme iron absorption (well-established mechanism). Calcium and tannins inhibit absorption. Evidence level: strong.',
  },
  vitamin_d_25_oh: {
    ayurveda:
      'Vitamin D relates to Asthi Dhatu (bone tissue) nourishment in Ayurveda. Deficiency weakens bones and immunity. Sunlight exposure is primary; ghee and sesame oil traditionally support fat-soluble vitamin absorption.',
    tcm: 'Vitamin D deficiency in TCM aligns with Kidney Essence (Jing) deficiency, as the Kidneys govern bones. The Water element and Kidney organ system are central. Bone broth and kidney-nourishing foods support this pattern.',
    naturopathy:
      'Fatty fish (salmon, sardines), egg yolks, and fortified foods provide dietary vitamin D. Sunlight remains the primary source. Supplementation is well-evidenced for deficiency correction. Evidence level: strong for supplementation.',
  },
  vitamin_b12: {
    ayurveda:
      'B12 supports Majja Dhatu (nerve tissue) in Ayurveda. Deficiency affects neurological function. Animal-derived foods are the primary traditional source; fermented foods like yogurt also provide some B12.',
    tcm: 'B12 deficiency maps to Blood and Qi deficiency patterns in TCM, affecting the Heart and Spleen systems. These organs govern blood production and mental clarity. Blood-building formulas and animal proteins are traditional supports.',
    naturopathy:
      'B12 is found almost exclusively in animal products (meat, fish, eggs, dairy). Fortified nutritional yeast is a reliable plant-based source. Supplementation is essential for strict vegans. Evidence level: strong.',
  },
  hs_crp: {
    ayurveda:
      'hs-CRP reflects systemic inflammation, related to Pitta aggravation and Ama accumulation in Ayurveda. Cooling, anti-inflammatory foods (cucumber, coriander, coconut) with bitter and sweet rasa help pacify Pitta-driven inflammation.',
    tcm: 'Elevated CRP maps to Heat and Toxin patterns in TCM, often involving the Liver and Heart. Clearing heat and resolving toxins through cooling foods (chrysanthemum tea, mung beans) is the traditional approach.',
    naturopathy:
      'Anti-inflammatory dietary patterns (Mediterranean diet, omega-3 rich foods) have strong evidence for CRP reduction. Turmeric (curcumin) shows moderate evidence. Reducing refined sugars and processed foods helps. Evidence level: strong for dietary patterns.',
  },
  iron: {
    ayurveda:
      'Serum iron reflects Rakta Dhatu (blood tissue) quality. Both deficiency and excess affect Pitta dosha. Iron-rich foods with appropriate rasa (pomegranate, jaggery, amla) support balanced Rakta without aggravating Pitta.',
    tcm: 'Iron levels relate to Blood quality in TCM, governed by the Liver and Spleen. The Spleen generates Blood from food; the Liver stores it. Foods that strengthen both organs support iron balance.',
    naturopathy:
      'Heme iron (animal sources) has higher bioavailability than non-heme iron (plant sources). Vitamin C enhances non-heme absorption. Tea, coffee, and calcium taken with meals reduce absorption. Evidence level: strong.',
  },
  hemoglobin: {
    ayurveda:
      'Hemoglobin directly reflects Rakta Dhatu health. Low hemoglobin is Rakta Kshaya (blood tissue depletion). Traditional blood-building foods include beetroot, pomegranate, and iron-rich greens cooked with ghee for absorption.',
    tcm: 'Hemoglobin corresponds to Blood volume and quality in TCM. Low hemoglobin is Blood Deficiency, often involving the Spleen (production) and Liver (storage). Dang Gui (angelica), red dates, and dark greens build blood.',
    naturopathy:
      'Iron, folate, and vitamin B12 are all required for hemoglobin synthesis. A diet combining heme iron sources with vitamin C-rich fruits and adequate B vitamins supports production. Evidence level: strong.',
  },
  wbc: {
    ayurveda:
      'White blood cells reflect Ojas (vital essence) and immune strength in Ayurveda. Low WBC suggests diminished Ojas. Rasayana (rejuvenative) foods like ashwagandha, shatavari, and tulsi traditionally strengthen immunity.',
    tcm: 'WBC count reflects Wei Qi (defensive Qi) in TCM, governed by the Lung and Spleen. Low counts suggest Qi deficiency. Astragalus, mushrooms (shiitake, reishi), and warm nourishing soups traditionally boost Wei Qi.',
    naturopathy:
      'Adequate protein, zinc, vitamin C, and vitamin D support immune cell production. Mushrooms (beta-glucans) have moderate evidence for immune modulation. Chronic stress suppresses WBC count. Evidence level: moderate.',
  },
  platelets: {
    ayurveda:
      'Platelets relate to Rakta Dhatu coagulation function. Abnormal counts affect blood quality. Papaya leaf extract is a traditional Ayurvedic remedy for low platelets, alongside gooseberry (amla) and wheatgrass.',
    tcm: 'Platelet function in TCM relates to the Spleen governing Blood and preventing extravasation. Spleen Qi deficiency can lead to low platelets. Spleen-tonifying foods (sweet potato, rice, dates) are the traditional approach.',
    naturopathy:
      'Folate, vitamin B12, and iron deficiencies can affect platelet counts. Papaya leaf extract shows emerging evidence for platelet support in some studies. A balanced diet with adequate micronutrients is the foundation. Evidence level: moderate for papaya leaf.',
  },
};
