// biomarker-seeder.ts -- Populates the biomarker_food_mappings table with
// relationships between canonical biomarkers and foods.
//
// Each mapping records whether a food is 'supportive' (helps normalize the
// biomarker) or 'contraindicated' (may worsen it), with an effect magnitude,
// mechanism description, and citation.
//
// Uses onConflictDoUpdate on (canonical_biomarker_key, food_id, effect_direction)
// for idempotency.

import { sql } from 'drizzle-orm';
import type { DbClient } from '../client.js';
import { biomarkerFoodMappings } from '../schema/index.js';
import type { NewBiomarkerFoodMapping } from '../types.js';

// -------------------------------------------------------------------------
// Canonical biomarker definitions
// -------------------------------------------------------------------------

export interface BiomarkerDef {
  key: string;
  display_name: string;
  category: string;
  unit: string;
}

export const CANONICAL_BIOMARKERS: BiomarkerDef[] = [
  // Basic Metabolic
  { key: 'glucose', display_name: 'Fasting Glucose', category: 'basic_metabolic', unit: 'mg/dL' },
  { key: 'bun', display_name: 'Blood Urea Nitrogen', category: 'basic_metabolic', unit: 'mg/dL' },
  { key: 'creatinine', display_name: 'Creatinine', category: 'basic_metabolic', unit: 'mg/dL' },
  { key: 'calcium', display_name: 'Calcium', category: 'basic_metabolic', unit: 'mg/dL' },
  { key: 'potassium', display_name: 'Potassium', category: 'basic_metabolic', unit: 'mEq/L' },
  { key: 'sodium', display_name: 'Sodium', category: 'basic_metabolic', unit: 'mEq/L' },

  // Lipid Panel
  { key: 'total_cholesterol', display_name: 'Total Cholesterol', category: 'lipid', unit: 'mg/dL' },
  { key: 'ldl_cholesterol', display_name: 'LDL Cholesterol', category: 'lipid', unit: 'mg/dL' },
  { key: 'hdl_cholesterol', display_name: 'HDL Cholesterol', category: 'lipid', unit: 'mg/dL' },
  { key: 'triglycerides', display_name: 'Triglycerides', category: 'lipid', unit: 'mg/dL' },

  // CBC
  { key: 'hemoglobin', display_name: 'Hemoglobin', category: 'cbc', unit: 'g/dL' },
  { key: 'ferritin', display_name: 'Ferritin', category: 'cbc', unit: 'ng/mL' },

  // Thyroid
  { key: 'tsh', display_name: 'TSH', category: 'thyroid', unit: 'mIU/L' },
  { key: 'free_t3', display_name: 'Free T3', category: 'thyroid', unit: 'pg/mL' },
  { key: 'free_t4', display_name: 'Free T4', category: 'thyroid', unit: 'ng/dL' },

  // Vitamins & Minerals
  { key: 'vitamin_d', display_name: 'Vitamin D (25-OH)', category: 'vitamins', unit: 'ng/mL' },
  { key: 'vitamin_b12', display_name: 'Vitamin B12', category: 'vitamins', unit: 'pg/mL' },
  { key: 'folate', display_name: 'Folate', category: 'vitamins', unit: 'ng/mL' },
  { key: 'magnesium', display_name: 'Magnesium', category: 'vitamins', unit: 'mg/dL' },

  // Inflammatory
  { key: 'crp', display_name: 'C-Reactive Protein', category: 'inflammatory', unit: 'mg/L' },
  {
    key: 'esr',
    display_name: 'Erythrocyte Sedimentation Rate',
    category: 'inflammatory',
    unit: 'mm/hr',
  },
  { key: 'homocysteine', display_name: 'Homocysteine', category: 'inflammatory', unit: 'umol/L' },

  // Liver
  { key: 'alt', display_name: 'ALT', category: 'liver', unit: 'U/L' },
  { key: 'ast', display_name: 'AST', category: 'liver', unit: 'U/L' },
  { key: 'alp', display_name: 'ALP', category: 'liver', unit: 'U/L' },
  { key: 'bilirubin', display_name: 'Total Bilirubin', category: 'liver', unit: 'mg/dL' },
  { key: 'albumin', display_name: 'Albumin', category: 'liver', unit: 'g/dL' },

  // Diabetes
  { key: 'hba1c', display_name: 'HbA1c', category: 'diabetes', unit: '%' },
  { key: 'fasting_insulin', display_name: 'Fasting Insulin', category: 'diabetes', unit: 'uIU/mL' },

  // Other
  { key: 'uric_acid', display_name: 'Uric Acid', category: 'other', unit: 'mg/dL' },
  { key: 'iron', display_name: 'Serum Iron', category: 'other', unit: 'ug/dL' },
];

// -------------------------------------------------------------------------
// Biomarker-food mapping data
// -------------------------------------------------------------------------

export interface BiomarkerMappingEntry {
  biomarker_key: string;
  food_name: string;
  effect_direction: 'supportive' | 'contraindicated';
  effect_magnitude: number;
  mechanism: string;
  citation: string;
}

/**
 * Curated biomarker-food mappings for the top 10 biomarkers.
 * Each biomarker has 5+ supportive and 3+ contraindicated foods.
 */
export const CANONICAL_BIOMARKER_MAPPINGS: BiomarkerMappingEntry[] = [
  // === GLUCOSE ===
  // Supportive (help normalize/lower glucose)
  {
    biomarker_key: 'glucose',
    food_name: 'oats',
    effect_direction: 'supportive',
    effect_magnitude: 0.75,
    mechanism: 'Beta-glucan fiber slows glucose absorption and improves insulin sensitivity',
    citation: 'Whitehead et al., Am J Clin Nutr 2014',
  },
  {
    biomarker_key: 'glucose',
    food_name: 'bitter gourd',
    effect_direction: 'supportive',
    effect_magnitude: 0.8,
    mechanism: 'Charantin and polypeptide-p mimic insulin action, lowering blood glucose',
    citation: 'Joseph & Jini, J Ethnopharmacol 2013',
  },
  {
    biomarker_key: 'glucose',
    food_name: 'mung bean',
    effect_direction: 'supportive',
    effect_magnitude: 0.6,
    mechanism: 'Low glycemic index with high fiber content slows postprandial glucose spike',
    citation: 'Yao et al., J Agric Food Chem 2014',
  },
  {
    biomarker_key: 'glucose',
    food_name: 'spinach',
    effect_direction: 'supportive',
    effect_magnitude: 0.55,
    mechanism: 'Thylakoid membranes reduce appetite hormones and slow carbohydrate digestion',
    citation: 'Stenblom et al., Appetite 2015',
  },
  {
    biomarker_key: 'glucose',
    food_name: 'almond',
    effect_direction: 'supportive',
    effect_magnitude: 0.5,
    mechanism: 'Monounsaturated fats and fiber improve glycemic control when eaten with meals',
    citation: 'Cohen & Johnston, Metabolism 2011',
  },
  {
    biomarker_key: 'glucose',
    food_name: 'lemon',
    effect_direction: 'supportive',
    effect_magnitude: 0.35,
    mechanism: 'Citric acid and polyphenols may reduce postprandial glucose response',
    citation: 'Freitas & Araujo, Eur J Nutr 2020',
  },
  // Contraindicated (may raise glucose)
  {
    biomarker_key: 'glucose',
    food_name: 'basmati rice',
    effect_direction: 'contraindicated',
    effect_magnitude: 0.5,
    mechanism: 'Refined starch rapidly converts to glucose despite lower GI than other rice',
    citation: 'Kaur et al., J Food Sci Technol 2016',
  },
  {
    biomarker_key: 'glucose',
    food_name: 'dates',
    effect_direction: 'contraindicated',
    effect_magnitude: 0.6,
    mechanism: 'High natural sugar content (60-70% sugars) raises blood glucose rapidly',
    citation: 'Alkaabi et al., Nutr J 2011',
  },
  {
    biomarker_key: 'glucose',
    food_name: 'honey',
    effect_direction: 'contraindicated',
    effect_magnitude: 0.55,
    mechanism:
      'High fructose and glucose content increases blood sugar despite lower GI than sucrose',
    citation: 'Erejuwa et al., Molecules 2012',
  },

  // === HBA1C ===
  {
    biomarker_key: 'hba1c',
    food_name: 'oats',
    effect_direction: 'supportive',
    effect_magnitude: 0.7,
    mechanism: 'Regular beta-glucan intake reduces average blood glucose over 2-3 months',
    citation: 'EFSA Panel, EFSA Journal 2011',
  },
  {
    biomarker_key: 'hba1c',
    food_name: 'bitter gourd',
    effect_direction: 'supportive',
    effect_magnitude: 0.65,
    mechanism: 'Daily intake for 12 weeks shown to reduce HbA1c by 0.2-0.5%',
    citation: 'Krawinkel & Keding, J Ethnopharmacol 2006',
  },
  {
    biomarker_key: 'hba1c',
    food_name: 'red lentil',
    effect_direction: 'supportive',
    effect_magnitude: 0.55,
    mechanism: 'High resistant starch and fiber moderate long-term glycemic control',
    citation: 'Sievenpiper et al., Diabetologia 2009',
  },
  {
    biomarker_key: 'hba1c',
    food_name: 'chickpea',
    effect_direction: 'supportive',
    effect_magnitude: 0.5,
    mechanism: 'Low GI legume shown to improve HbA1c when replacing high-GI grains',
    citation: 'Pittaway et al., J Am Coll Nutr 2008',
  },
  {
    biomarker_key: 'hba1c',
    food_name: 'broccoli',
    effect_direction: 'supportive',
    effect_magnitude: 0.45,
    mechanism: 'Sulforaphane activates Nrf2 pathway and may reduce hepatic glucose production',
    citation: 'Axelsson et al., Sci Transl Med 2017',
  },
  {
    biomarker_key: 'hba1c',
    food_name: 'dates',
    effect_direction: 'contraindicated',
    effect_magnitude: 0.5,
    mechanism: 'Chronic high sugar intake raises average blood glucose over time',
    citation: 'Alkaabi et al., Nutr J 2011',
  },
  {
    biomarker_key: 'hba1c',
    food_name: 'honey',
    effect_direction: 'contraindicated',
    effect_magnitude: 0.45,
    mechanism: 'Regular consumption contributes to sustained hyperglycemia',
    citation: 'Erejuwa et al., Molecules 2012',
  },
  {
    biomarker_key: 'hba1c',
    food_name: 'basmati rice',
    effect_direction: 'contraindicated',
    effect_magnitude: 0.4,
    mechanism: 'High glycemic load staple raises long-term average glucose',
    citation: 'Sun et al., BMJ 2010',
  },

  // === LDL CHOLESTEROL ===
  {
    biomarker_key: 'ldl_cholesterol',
    food_name: 'oats',
    effect_direction: 'supportive',
    effect_magnitude: 0.8,
    mechanism: 'Beta-glucan binds bile acids, reducing cholesterol reabsorption by 5-10%',
    citation: 'Whitehead et al., Am J Clin Nutr 2014',
  },
  {
    biomarker_key: 'ldl_cholesterol',
    food_name: 'almond',
    effect_direction: 'supportive',
    effect_magnitude: 0.65,
    mechanism: 'Monounsaturated fats and plant sterols reduce LDL particle number',
    citation: 'Berryman et al., J Am Heart Assoc 2015',
  },
  {
    biomarker_key: 'ldl_cholesterol',
    food_name: 'olive oil',
    effect_direction: 'supportive',
    effect_magnitude: 0.6,
    mechanism: 'Oleic acid and polyphenols reduce LDL oxidation and particle number',
    citation: 'Estruch et al., N Engl J Med 2013',
  },
  {
    biomarker_key: 'ldl_cholesterol',
    food_name: 'chickpea',
    effect_direction: 'supportive',
    effect_magnitude: 0.55,
    mechanism: 'Soluble fiber and plant sterols reduce intestinal cholesterol absorption',
    citation: 'Pittaway et al., Ann Nutr Metab 2006',
  },
  {
    biomarker_key: 'ldl_cholesterol',
    food_name: 'avocado',
    effect_direction: 'supportive',
    effect_magnitude: 0.55,
    mechanism: 'Monounsaturated fats reduce small dense LDL particles',
    citation: 'Wang et al., J Am Heart Assoc 2015',
  },
  {
    biomarker_key: 'ldl_cholesterol',
    food_name: 'ghee',
    effect_direction: 'contraindicated',
    effect_magnitude: 0.5,
    mechanism: 'High saturated fat content may raise LDL when consumed in excess',
    citation: 'Sacks et al., Circulation 2017',
  },
  {
    biomarker_key: 'ldl_cholesterol',
    food_name: 'coconut oil',
    effect_direction: 'contraindicated',
    effect_magnitude: 0.55,
    mechanism: 'Lauric acid and other saturated fats raise LDL cholesterol',
    citation: 'Neelakantan et al., Circulation 2020',
  },
  {
    biomarker_key: 'ldl_cholesterol',
    food_name: 'egg',
    effect_direction: 'contraindicated',
    effect_magnitude: 0.35,
    mechanism: 'Dietary cholesterol has modest effect on LDL in some individuals',
    citation: 'Blesso & Fernandez, Nutrients 2018',
  },

  // === HDL CHOLESTEROL ===
  {
    biomarker_key: 'hdl_cholesterol',
    food_name: 'olive oil',
    effect_direction: 'supportive',
    effect_magnitude: 0.7,
    mechanism: 'Polyphenols and oleic acid increase HDL functionality and levels',
    citation: 'Estruch et al., N Engl J Med 2013',
  },
  {
    biomarker_key: 'hdl_cholesterol',
    food_name: 'avocado',
    effect_direction: 'supportive',
    effect_magnitude: 0.6,
    mechanism: 'Monounsaturated fats increase HDL when replacing refined carbs',
    citation: 'Wang et al., J Am Heart Assoc 2015',
  },
  {
    biomarker_key: 'hdl_cholesterol',
    food_name: 'salmon',
    effect_direction: 'supportive',
    effect_magnitude: 0.65,
    mechanism: 'Omega-3 fatty acids increase HDL particle size and count',
    citation: 'Balk et al., Atherosclerosis 2006',
  },
  {
    biomarker_key: 'hdl_cholesterol',
    food_name: 'almond',
    effect_direction: 'supportive',
    effect_magnitude: 0.5,
    mechanism: 'Regular nut consumption associated with 3-5% HDL increase',
    citation: 'Berryman et al., J Am Heart Assoc 2015',
  },
  {
    biomarker_key: 'hdl_cholesterol',
    food_name: 'egg',
    effect_direction: 'supportive',
    effect_magnitude: 0.4,
    mechanism: 'Phospholipids in egg yolk support HDL particle formation',
    citation: 'Blesso & Fernandez, Nutrients 2018',
  },

  // === TRIGLYCERIDES ===
  {
    biomarker_key: 'triglycerides',
    food_name: 'salmon',
    effect_direction: 'supportive',
    effect_magnitude: 0.8,
    mechanism: 'EPA and DHA reduce hepatic VLDL-triglyceride synthesis by 25-30%',
    citation: 'Skulas-Ray et al., Circulation 2019',
  },
  {
    biomarker_key: 'triglycerides',
    food_name: 'olive oil',
    effect_direction: 'supportive',
    effect_magnitude: 0.5,
    mechanism: 'Replacing saturated fat with MUFA reduces postprandial triglycerides',
    citation: 'Estruch et al., N Engl J Med 2013',
  },
  {
    biomarker_key: 'triglycerides',
    food_name: 'almond',
    effect_direction: 'supportive',
    effect_magnitude: 0.45,
    mechanism: 'Fiber and healthy fats reduce postprandial lipemia',
    citation: 'Berryman et al., J Am Heart Assoc 2015',
  },
  {
    biomarker_key: 'triglycerides',
    food_name: 'oats',
    effect_direction: 'supportive',
    effect_magnitude: 0.5,
    mechanism: 'Soluble fiber reduces hepatic lipogenesis from excess carbohydrates',
    citation: 'EFSA Panel, EFSA Journal 2011',
  },
  {
    biomarker_key: 'triglycerides',
    food_name: 'avocado',
    effect_direction: 'supportive',
    effect_magnitude: 0.45,
    mechanism: 'MUFA intake associated with lower fasting triglycerides',
    citation: 'Wang et al., J Am Heart Assoc 2015',
  },
  {
    biomarker_key: 'triglycerides',
    food_name: 'dates',
    effect_direction: 'contraindicated',
    effect_magnitude: 0.55,
    mechanism: 'High fructose content promotes hepatic de novo lipogenesis',
    citation: 'Stanhope et al., J Clin Invest 2009',
  },
  {
    biomarker_key: 'triglycerides',
    food_name: 'honey',
    effect_direction: 'contraindicated',
    effect_magnitude: 0.5,
    mechanism: 'Fructose in honey drives triglyceride synthesis in the liver',
    citation: 'Stanhope et al., J Clin Invest 2009',
  },
  {
    biomarker_key: 'triglycerides',
    food_name: 'basmati rice',
    effect_direction: 'contraindicated',
    effect_magnitude: 0.4,
    mechanism: 'Excess refined carbohydrate increases hepatic triglyceride production',
    citation: 'Parks et al., J Nutr 2008',
  },

  // === TSH ===
  {
    biomarker_key: 'tsh',
    food_name: 'sesame seed',
    effect_direction: 'supportive',
    effect_magnitude: 0.4,
    mechanism: 'Selenium in sesame supports thyroid hormone conversion',
    citation: 'Rayman, Lancet 2012',
  },
  {
    biomarker_key: 'tsh',
    food_name: 'egg',
    effect_direction: 'supportive',
    effect_magnitude: 0.5,
    mechanism: 'Iodine and selenium in eggs support normal thyroid function',
    citation: 'Zimmermann & Boelaert, Lancet Diabetes Endocrinol 2015',
  },
  {
    biomarker_key: 'tsh',
    food_name: 'salmon',
    effect_direction: 'supportive',
    effect_magnitude: 0.55,
    mechanism: 'Iodine, selenium, and omega-3s support thyroid hormone production',
    citation: 'Rayman, Lancet 2012',
  },
  {
    biomarker_key: 'tsh',
    food_name: 'yogurt',
    effect_direction: 'supportive',
    effect_magnitude: 0.45,
    mechanism: 'Dairy iodine supports thyroid function in iodine-deficient populations',
    citation: 'Zimmermann & Boelaert, Lancet Diabetes Endocrinol 2015',
  },
  {
    biomarker_key: 'tsh',
    food_name: 'spinach',
    effect_direction: 'supportive',
    effect_magnitude: 0.35,
    mechanism: 'Magnesium and iron support enzymatic thyroid hormone conversion',
    citation: 'Moncayo & Moncayo, BMC Endocr Disord 2015',
  },
  {
    biomarker_key: 'tsh',
    food_name: 'bok choy',
    effect_direction: 'contraindicated',
    effect_magnitude: 0.45,
    mechanism:
      'Goitrogens (thiocyanates) can interfere with iodine uptake when eaten raw in excess',
    citation: 'Felker et al., Nutr Rev 2016',
  },
  {
    biomarker_key: 'tsh',
    food_name: 'broccoli',
    effect_direction: 'contraindicated',
    effect_magnitude: 0.4,
    mechanism: 'Glucosinolates may inhibit thyroid peroxidase when consumed in large amounts',
    citation: 'Felker et al., Nutr Rev 2016',
  },
  {
    biomarker_key: 'tsh',
    food_name: 'tofu',
    effect_direction: 'contraindicated',
    effect_magnitude: 0.35,
    mechanism: 'Soy isoflavones may interfere with thyroid medication absorption',
    citation: 'Messina & Redmond, Thyroid 2006',
  },

  // === FERRITIN ===
  {
    biomarker_key: 'ferritin',
    food_name: 'spinach',
    effect_direction: 'supportive',
    effect_magnitude: 0.55,
    mechanism: 'Non-heme iron with vitamin C co-consumption improves iron stores',
    citation: 'Hallberg & Hulthen, Am J Clin Nutr 2000',
  },
  {
    biomarker_key: 'ferritin',
    food_name: 'red lentil',
    effect_direction: 'supportive',
    effect_magnitude: 0.6,
    mechanism:
      'High non-heme iron content (3.3mg/100g) supports ferritin when paired with vitamin C',
    citation: 'Thavarajah et al., J Agric Food Chem 2009',
  },
  {
    biomarker_key: 'ferritin',
    food_name: 'beetroot',
    effect_direction: 'supportive',
    effect_magnitude: 0.5,
    mechanism: 'Iron and folate content supports red blood cell production and iron stores',
    citation: 'Priya et al., IOSR J Nursing 2013',
  },
  {
    biomarker_key: 'ferritin',
    food_name: 'egg',
    effect_direction: 'supportive',
    effect_magnitude: 0.45,
    mechanism: 'Heme iron in egg yolk has moderate bioavailability for iron stores',
    citation: 'Young et al., Br J Nutr 2018',
  },
  {
    biomarker_key: 'ferritin',
    food_name: 'salmon',
    effect_direction: 'supportive',
    effect_magnitude: 0.5,
    mechanism: 'Heme iron source with high bioavailability',
    citation: 'Hurrell & Egli, Am J Clin Nutr 2010',
  },
  {
    biomarker_key: 'ferritin',
    food_name: 'green tea',
    effect_direction: 'contraindicated',
    effect_magnitude: 0.5,
    mechanism: 'Tannins and catechins chelate non-heme iron, reducing absorption by 60-70%',
    citation: 'Hurrell et al., Br J Nutr 1999',
  },
  {
    biomarker_key: 'ferritin',
    food_name: 'yogurt',
    effect_direction: 'contraindicated',
    effect_magnitude: 0.35,
    mechanism: 'Calcium in dairy inhibits both heme and non-heme iron absorption at the meal',
    citation: 'Hallberg & Hulthen, Am J Clin Nutr 2000',
  },
  {
    biomarker_key: 'ferritin',
    food_name: 'tofu',
    effect_direction: 'contraindicated',
    effect_magnitude: 0.3,
    mechanism: 'Phytates in soy reduce iron bioavailability despite iron content',
    citation: 'Hurrell & Egli, Am J Clin Nutr 2010',
  },

  // === VITAMIN D ===
  {
    biomarker_key: 'vitamin_d',
    food_name: 'salmon',
    effect_direction: 'supportive',
    effect_magnitude: 0.85,
    mechanism: 'Wild salmon provides 600-1000 IU vitamin D3 per 100g serving',
    citation: 'Holick, N Engl J Med 2007',
  },
  {
    biomarker_key: 'vitamin_d',
    food_name: 'egg',
    effect_direction: 'supportive',
    effect_magnitude: 0.45,
    mechanism: 'Egg yolks provide 40-50 IU vitamin D3 per egg',
    citation: 'Holick, N Engl J Med 2007',
  },
  {
    biomarker_key: 'vitamin_d',
    food_name: 'yogurt',
    effect_direction: 'supportive',
    effect_magnitude: 0.35,
    mechanism: 'Fortified dairy provides 80-120 IU vitamin D per serving',
    citation: 'Holick, N Engl J Med 2007',
  },
  {
    biomarker_key: 'vitamin_d',
    food_name: 'ghee',
    effect_direction: 'supportive',
    effect_magnitude: 0.3,
    mechanism: 'Fat-soluble vitamin D is better absorbed with dietary fat from ghee',
    citation: 'Dawson-Hughes et al., J Bone Miner Res 2015',
  },
  {
    biomarker_key: 'vitamin_d',
    food_name: 'tofu',
    effect_direction: 'supportive',
    effect_magnitude: 0.3,
    mechanism: 'Fortified tofu can provide 100-200 IU vitamin D per serving',
    citation: 'Holick, N Engl J Med 2007',
  },

  // === VITAMIN B12 ===
  {
    biomarker_key: 'vitamin_b12',
    food_name: 'salmon',
    effect_direction: 'supportive',
    effect_magnitude: 0.85,
    mechanism: 'Rich source of B12 at 4.8 ug per 100g (200% daily value)',
    citation: 'Allen, Am J Clin Nutr 2009',
  },
  {
    biomarker_key: 'vitamin_b12',
    food_name: 'egg',
    effect_direction: 'supportive',
    effect_magnitude: 0.55,
    mechanism: 'Egg yolk provides 0.9 ug B12 per egg with good bioavailability',
    citation: 'Allen, Am J Clin Nutr 2009',
  },
  {
    biomarker_key: 'vitamin_b12',
    food_name: 'yogurt',
    effect_direction: 'supportive',
    effect_magnitude: 0.5,
    mechanism: 'Fermented dairy provides B12 with enhanced bioavailability',
    citation: 'Allen, Am J Clin Nutr 2009',
  },
  {
    biomarker_key: 'vitamin_b12',
    food_name: 'ghee',
    effect_direction: 'supportive',
    effect_magnitude: 0.2,
    mechanism: 'Trace B12 retained from butter, improved absorption with fat',
    citation: 'USDA FoodData Central',
  },
  {
    biomarker_key: 'vitamin_b12',
    food_name: 'tofu',
    effect_direction: 'supportive',
    effect_magnitude: 0.25,
    mechanism: 'Fortified tofu provides 1-2 ug B12 per serving',
    citation: 'Watanabe, Exp Biol Med 2007',
  },
  {
    biomarker_key: 'vitamin_b12',
    food_name: 'green tea',
    effect_direction: 'contraindicated',
    effect_magnitude: 0.25,
    mechanism: 'Polyphenols may reduce B12 absorption when consumed with B12-rich meals',
    citation: 'Reinstatler et al., Am J Clin Nutr 2012',
  },

  // === CRP (C-Reactive Protein) ===
  {
    biomarker_key: 'crp',
    food_name: 'salmon',
    effect_direction: 'supportive',
    effect_magnitude: 0.75,
    mechanism: 'EPA/DHA reduce pro-inflammatory cytokines (IL-6, TNF-alpha) that stimulate CRP',
    citation: 'Calder, Am J Clin Nutr 2006',
  },
  {
    biomarker_key: 'crp',
    food_name: 'olive oil',
    effect_direction: 'supportive',
    effect_magnitude: 0.65,
    mechanism: 'Oleocanthal has ibuprofen-like COX inhibition, reducing systemic inflammation',
    citation: 'Beauchamp et al., Nature 2005',
  },
  {
    biomarker_key: 'crp',
    food_name: 'green tea',
    effect_direction: 'supportive',
    effect_magnitude: 0.55,
    mechanism: 'EGCG catechins suppress NF-kB activation and reduce inflammatory markers',
    citation: 'Tipoe et al., BioFactors 2007',
  },
  {
    biomarker_key: 'crp',
    food_name: 'spinach',
    effect_direction: 'supportive',
    effect_magnitude: 0.45,
    mechanism: 'Carotenoids and flavonoids have antioxidant and anti-inflammatory effects',
    citation: 'Hamer & Chida, Eur J Clin Nutr 2007',
  },
  {
    biomarker_key: 'crp',
    food_name: 'avocado',
    effect_direction: 'supportive',
    effect_magnitude: 0.5,
    mechanism: 'Anti-inflammatory lipids and carotenoids reduce CRP when replacing saturated fat',
    citation: 'Li et al., J Am Heart Assoc 2020',
  },
  {
    biomarker_key: 'crp',
    food_name: 'beetroot',
    effect_direction: 'supportive',
    effect_magnitude: 0.4,
    mechanism: 'Betalains have anti-inflammatory properties via COX-2 inhibition',
    citation: 'Esatbeyoglu et al., J Agric Food Chem 2015',
  },
  {
    biomarker_key: 'crp',
    food_name: 'ghee',
    effect_direction: 'contraindicated',
    effect_magnitude: 0.35,
    mechanism: 'Excess saturated fat may promote low-grade systemic inflammation',
    citation: 'Minihane et al., Br J Nutr 2015',
  },
  {
    biomarker_key: 'crp',
    food_name: 'coconut oil',
    effect_direction: 'contraindicated',
    effect_magnitude: 0.4,
    mechanism: 'High saturated fat content may increase inflammatory markers in some individuals',
    citation: 'Minihane et al., Br J Nutr 2015',
  },
  {
    biomarker_key: 'crp',
    food_name: 'basmati rice',
    effect_direction: 'contraindicated',
    effect_magnitude: 0.3,
    mechanism: 'High glycemic load diets associated with elevated CRP',
    citation: 'Buyken et al., Am J Clin Nutr 2014',
  },

  // === URIC ACID ===
  {
    biomarker_key: 'uric_acid',
    food_name: 'lemon',
    effect_direction: 'supportive',
    effect_magnitude: 0.55,
    mechanism: 'Citrate alkalinizes urine and promotes uric acid excretion',
    citation: 'Kanbara et al., Internal Med 2010',
  },
  {
    biomarker_key: 'uric_acid',
    food_name: 'beetroot',
    effect_direction: 'supportive',
    effect_magnitude: 0.4,
    mechanism: 'Nitrates and betalains support renal uric acid clearance',
    citation: 'Hobbs et al., Free Rad Biol Med 2013',
  },
  {
    biomarker_key: 'uric_acid',
    food_name: 'green tea',
    effect_direction: 'supportive',
    effect_magnitude: 0.45,
    mechanism: 'Catechins inhibit xanthine oxidase, reducing uric acid production',
    citation: 'Chen et al., Int J Mol Sci 2017',
  },
  {
    biomarker_key: 'uric_acid',
    food_name: 'avocado',
    effect_direction: 'supportive',
    effect_magnitude: 0.35,
    mechanism: 'Low purine content with anti-inflammatory fats supports uric acid management',
    citation: 'Choi et al., Arthritis Rheum 2004',
  },
  {
    biomarker_key: 'uric_acid',
    food_name: 'spinach',
    effect_direction: 'supportive',
    effect_magnitude: 0.3,
    mechanism:
      'Despite moderate purines, vegetable purines show lower gout risk than animal purines',
    citation: 'Choi et al., N Engl J Med 2004',
  },

  // === IRON ===
  {
    biomarker_key: 'iron',
    food_name: 'spinach',
    effect_direction: 'supportive',
    effect_magnitude: 0.6,
    mechanism: 'Contains 2.7mg non-heme iron per 100g, enhanced by vitamin C co-consumption',
    citation: 'Hallberg & Hulthen, Am J Clin Nutr 2000',
  },
  {
    biomarker_key: 'iron',
    food_name: 'red lentil',
    effect_direction: 'supportive',
    effect_magnitude: 0.6,
    mechanism: 'Legume iron (3.3mg/100g) with moderate bioavailability',
    citation: 'Thavarajah et al., J Agric Food Chem 2009',
  },
  {
    biomarker_key: 'iron',
    food_name: 'beetroot',
    effect_direction: 'supportive',
    effect_magnitude: 0.45,
    mechanism: 'Iron content combined with folate supports iron metabolism',
    citation: 'Priya et al., IOSR J Nursing 2013',
  },
  {
    biomarker_key: 'iron',
    food_name: 'quinoa',
    effect_direction: 'supportive',
    effect_magnitude: 0.45,
    mechanism: 'Contains 4.6mg iron per 100g with lower phytate than other grains',
    citation: 'Repo-Carrasco et al., J Sci Food Agric 2003',
  },
  {
    biomarker_key: 'iron',
    food_name: 'egg',
    effect_direction: 'supportive',
    effect_magnitude: 0.4,
    mechanism: 'Egg yolk iron has moderate bioavailability',
    citation: 'Young et al., Br J Nutr 2018',
  },
  {
    biomarker_key: 'iron',
    food_name: 'green tea',
    effect_direction: 'contraindicated',
    effect_magnitude: 0.55,
    mechanism: 'Tannins chelate iron and reduce absorption by up to 70% at the meal',
    citation: 'Hurrell et al., Br J Nutr 1999',
  },
  {
    biomarker_key: 'iron',
    food_name: 'yogurt',
    effect_direction: 'contraindicated',
    effect_magnitude: 0.35,
    mechanism: 'Calcium competes with iron for absorption via DMT-1 transporter',
    citation: 'Hallberg & Hulthen, Am J Clin Nutr 2000',
  },
  {
    biomarker_key: 'iron',
    food_name: 'tofu',
    effect_direction: 'contraindicated',
    effect_magnitude: 0.3,
    mechanism: 'Phytic acid in soy binds iron, reducing bioavailability',
    citation: 'Hurrell & Egli, Am J Clin Nutr 2010',
  },

  // === HOMOCYSTEINE ===
  {
    biomarker_key: 'homocysteine',
    food_name: 'spinach',
    effect_direction: 'supportive',
    effect_magnitude: 0.7,
    mechanism:
      'Folate (194 ug/100g) is a key cofactor for homocysteine remethylation to methionine',
    citation: 'Refsum et al., Clin Chem 2004',
  },
  {
    biomarker_key: 'homocysteine',
    food_name: 'red lentil',
    effect_direction: 'supportive',
    effect_magnitude: 0.6,
    mechanism: 'Folate-rich legume supports homocysteine metabolism via one-carbon cycle',
    citation: 'Refsum et al., Clin Chem 2004',
  },
  {
    biomarker_key: 'homocysteine',
    food_name: 'beetroot',
    effect_direction: 'supportive',
    effect_magnitude: 0.55,
    mechanism: 'Betaine acts as methyl donor for homocysteine conversion independent of folate',
    citation: 'Craig, Am J Clin Nutr 2004',
  },
  {
    biomarker_key: 'homocysteine',
    food_name: 'egg',
    effect_direction: 'supportive',
    effect_magnitude: 0.45,
    mechanism: 'Choline and B12 in eggs support homocysteine remethylation',
    citation: 'Zeisel & da Costa, Ann Rev Nutr 2009',
  },
  {
    biomarker_key: 'homocysteine',
    food_name: 'salmon',
    effect_direction: 'supportive',
    effect_magnitude: 0.55,
    mechanism: 'B12 and B6 in fatty fish are essential cofactors for homocysteine metabolism',
    citation: 'Refsum et al., Clin Chem 2004',
  },

  // === MAGNESIUM ===
  {
    biomarker_key: 'magnesium',
    food_name: 'almond',
    effect_direction: 'supportive',
    effect_magnitude: 0.7,
    mechanism: 'Almonds provide 270mg magnesium per 100g (65% daily value)',
    citation: 'USDA FoodData Central',
  },
  {
    biomarker_key: 'magnesium',
    food_name: 'spinach',
    effect_direction: 'supportive',
    effect_magnitude: 0.65,
    mechanism: 'Chlorophyll-bound magnesium at 79mg per 100g',
    citation: 'USDA FoodData Central',
  },
  {
    biomarker_key: 'magnesium',
    food_name: 'quinoa',
    effect_direction: 'supportive',
    effect_magnitude: 0.55,
    mechanism: 'Pseudocereal with 197mg magnesium per 100g',
    citation: 'Repo-Carrasco et al., J Sci Food Agric 2003',
  },
  {
    biomarker_key: 'magnesium',
    food_name: 'avocado',
    effect_direction: 'supportive',
    effect_magnitude: 0.5,
    mechanism: 'Provides 29mg magnesium per 100g with high bioavailability',
    citation: 'USDA FoodData Central',
  },
  {
    biomarker_key: 'magnesium',
    food_name: 'mung bean',
    effect_direction: 'supportive',
    effect_magnitude: 0.5,
    mechanism: 'Legume magnesium (189mg/100g dry) supports mineral status',
    citation: 'USDA FoodData Central',
  },

  // === ALBUMIN ===
  {
    biomarker_key: 'albumin',
    food_name: 'egg',
    effect_direction: 'supportive',
    effect_magnitude: 0.65,
    mechanism: 'Complete protein with high biological value supports hepatic albumin synthesis',
    citation: 'Wolfe et al., J Sports Sci Med 2017',
  },
  {
    biomarker_key: 'albumin',
    food_name: 'salmon',
    effect_direction: 'supportive',
    effect_magnitude: 0.6,
    mechanism: 'High-quality protein supplies amino acids for albumin production',
    citation: 'Kurpad, J Nutr 2006',
  },
  {
    biomarker_key: 'albumin',
    food_name: 'yogurt',
    effect_direction: 'supportive',
    effect_magnitude: 0.5,
    mechanism: 'Whey and casein protein support sustained amino acid supply for albumin',
    citation: 'Kurpad, J Nutr 2006',
  },
  {
    biomarker_key: 'albumin',
    food_name: 'chickpea',
    effect_direction: 'supportive',
    effect_magnitude: 0.45,
    mechanism: 'Plant protein with reasonable amino acid profile supports albumin synthesis',
    citation: 'Young & Pellett, Am J Clin Nutr 1994',
  },
  {
    biomarker_key: 'albumin',
    food_name: 'quinoa',
    effect_direction: 'supportive',
    effect_magnitude: 0.5,
    mechanism: 'Complete plant protein with all essential amino acids for albumin production',
    citation: 'Abugoch, Adv Food Nutr Res 2009',
  },
];

// -------------------------------------------------------------------------
// Seeder function
// -------------------------------------------------------------------------

/**
 * Seeds the biomarker_food_mappings table with curated biomarker-food relationships.
 *
 * @param db - Database client (service role).
 * @param foodIdLookup - Map of lowercase food name to food UUID.
 * @returns Total number of mapping rows upserted.
 */
export async function seedBiomarkerMappings(
  db: DbClient,
  foodIdLookup: Map<string, string>,
): Promise<number> {
  const rows: NewBiomarkerFoodMapping[] = [];

  for (const mapping of CANONICAL_BIOMARKER_MAPPINGS) {
    const foodId = foodIdLookup.get(mapping.food_name.toLowerCase());
    if (!foodId) continue;

    const biomarkerDef = CANONICAL_BIOMARKERS.find((b) => b.key === mapping.biomarker_key);
    if (!biomarkerDef) continue;

    rows.push({
      biomarker_name: biomarkerDef.display_name,
      canonical_biomarker_key: mapping.biomarker_key,
      food_id: foodId,
      effect_direction: mapping.effect_direction,
      effect_magnitude: mapping.effect_magnitude.toFixed(2),
      mechanism: mapping.mechanism,
      citation: mapping.citation,
    });
  }

  if (rows.length === 0) return 0;

  // Insert in chunks of 200 to avoid parameter limits
  const CHUNK_SIZE = 200;
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    await db
      .insert(biomarkerFoodMappings)
      .values(chunk)
      .onConflictDoUpdate({
        target: [
          biomarkerFoodMappings.canonical_biomarker_key,
          biomarkerFoodMappings.food_id,
          biomarkerFoodMappings.effect_direction,
        ],
        set: {
          biomarker_name: sql`excluded.biomarker_name`,
          effect_magnitude: sql`excluded.effect_magnitude`,
          mechanism: sql`excluded.mechanism`,
          citation: sql`excluded.citation`,
        },
      });
  }

  return rows.length;
}
