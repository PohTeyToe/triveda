// Valid enum values for food and herb properties.
// Used by the validation pipeline to check that seed data contains
// only recognized values for categorical fields.
//
// Also includes mapping constants used by the canonical parser and
// Amidha importer (section 04/05).

// -- Ayurveda --

/** The six classical tastes (rasa). */
export const VALID_RASA = [
  'madhura', // sweet
  'amla', // sour
  'lavana', // salty
  'katu', // pungent
  'tikta', // bitter
  'kashaya', // astringent
] as const;

export type Rasa = (typeof VALID_RASA)[number];

/** Virya (potency) -- heating or cooling. */
export const VALID_VIRYA = ['ushna', 'sheeta'] as const;

export type Virya = (typeof VALID_VIRYA)[number];

/** Vipaka (post-digestive effect). */
export const VALID_VIPAKA = ['madhura', 'amla', 'katu'] as const;

export type Vipaka = (typeof VALID_VIPAKA)[number];

/** Guna (physical qualities). */
export const VALID_GUNA = [
  'guru', // heavy
  'laghu', // light
  'snigdha', // oily/unctuous
  'ruksha', // dry
  'ushna', // hot
  'sheeta', // cold
  'manda', // slow/dull
  'tikshna', // sharp/penetrating
  'sthira', // stable
  'sara', // flowing/mobile
  'mridu', // soft
  'kathina', // hard
  'vishada', // clear
  'picchila', // slimy/cloudy
  'slakshna', // smooth
  'khara', // rough
  'sukshma', // subtle
  'sthula', // gross
  'sandra', // dense
  'drava', // liquid
] as const;

export type Guna = (typeof VALID_GUNA)[number];

/** Dosha effect range: -2 (strongly reduces) to +2 (strongly aggravates). */
export const DOSHA_EFFECT_MIN = -2;
export const DOSHA_EFFECT_MAX = 2;

/** The six Ayurvedic seasons (ritu). */
export const RITU_KEYS = ['shishira', 'vasanta', 'grishma', 'varsha', 'sharad', 'hemanta'] as const;

export type RituName = (typeof RITU_KEYS)[number];

// -- TCM --

/** TCM thermal nature. */
export const VALID_THERMAL_NATURE = ['hot', 'warm', 'neutral', 'cool', 'cold'] as const;

export type ThermalNature = (typeof VALID_THERMAL_NATURE)[number];

/** TCM flavors. */
export const VALID_TCM_FLAVOR = [
  'sweet',
  'sour',
  'bitter',
  'pungent',
  'salty',
  'bland',
  'astringent',
] as const;

/** TCM organ affinities (Zang-Fu organ system). */
export const VALID_ORGAN_AFFINITY = [
  'heart',
  'small_intestine',
  'liver',
  'gallbladder',
  'spleen',
  'stomach',
  'lung',
  'large_intestine',
  'kidney',
  'bladder',
  'pericardium',
  'triple_burner',
] as const;

export type TcmOrgan = (typeof VALID_ORGAN_AFFINITY)[number];

/** Five Elements. */
export const ELEMENT_KEYS = ['wood', 'fire', 'earth', 'metal', 'water'] as const;

export type ElementName = (typeof ELEMENT_KEYS)[number];

// -- Metadata --

/** Allowed seed_source values. */
export const VALID_SEED_SOURCE = ['canonical', 'usda', 'llm_drafted', 'manual'] as const;

/** Allowed validation_status values. */
export const VALID_VALIDATION_STATUS = [
  'pending',
  'validated',
  'flagged',
  'human_reviewed',
] as const;

/** Herb pregnancy safety values. */
export const VALID_PREGNANCY_SAFETY = ['safe', 'caution', 'contraindicated', 'unknown'] as const;

// -- Food categories (canonical list) --
// These are the top-level categories expected in the food_categories table.
// Subcategories are free-form text, not validated against a fixed list.

export const VALID_FOOD_CATEGORIES = [
  'grains',
  'legumes',
  'vegetables',
  'fruits',
  'dairy',
  'nuts_seeds',
  'oils_fats',
  'spices',
  'sweeteners',
  'beverages',
  'animal_protein',
  'seafood',
  'fermented',
  'condiments',
] as const;

/** Herb categories. */
export const VALID_HERB_CATEGORIES = [
  'adaptogen',
  'bitter',
  'carminative',
  'demulcent',
  'digestive',
  'nervine',
  'rejuvenative',
  'respiratory',
  'circulatory',
  'immune',
  'anti_inflammatory',
  'cleansing',
  'tonic',
] as const;

// =========================================================================
// Mapping constants -- used by canonical parser and seed importers
// =========================================================================

// ---------------------------------------------------------------------------
// English-to-Sanskrit rasa mapping
// ---------------------------------------------------------------------------

/** Map English taste names to their Sanskrit equivalents. */
export const RASA_MAP: Record<string, Rasa> = {
  sweet: 'madhura',
  sour: 'amla',
  salty: 'lavana',
  pungent: 'katu',
  bitter: 'tikta',
  astringent: 'kashaya',
};

// ---------------------------------------------------------------------------
// Virya mapping
// ---------------------------------------------------------------------------

/** Map English virya terms to Sanskrit. */
export const VIRYA_MAP: Record<string, Virya> = {
  heating: 'ushna',
  hot: 'ushna',
  warming: 'ushna',
  warm: 'ushna',
  cooling: 'sheeta',
  cold: 'sheeta',
  cool: 'sheeta',
};

// ---------------------------------------------------------------------------
// Guna mapping
// ---------------------------------------------------------------------------

/** Map common English guna terms to Sanskrit. */
export const GUNA_MAP: Record<string, Guna> = {
  heavy: 'guru',
  light: 'laghu',
  oily: 'snigdha',
  unctuous: 'snigdha',
  dry: 'ruksha',
  hot: 'ushna',
  cold: 'sheeta',
  slow: 'manda',
  dull: 'manda',
  sharp: 'tikshna',
  penetrating: 'tikshna',
  stable: 'sthira',
  static: 'sthira',
  flowing: 'sara',
  mobile: 'sara',
  soft: 'mridu',
  hard: 'kathina',
  clear: 'vishada',
  non_slimy: 'vishada',
  sticky: 'picchila',
  slimy: 'picchila',
  cloudy: 'picchila',
  smooth: 'slakshna',
  rough: 'khara',
  subtle: 'sukshma',
  gross: 'sthula',
  dense: 'sandra',
  liquid: 'drava',
};

// ---------------------------------------------------------------------------
// Dosha effect mapping (for Amidha importer, section 05)
// ---------------------------------------------------------------------------

/**
 * Map text descriptions to numeric dosha effects.
 * Negative = reduces/pacifies, positive = aggravates/increases.
 */
export const DOSHA_EFFECT_MAP: Record<string, number> = {
  'strongly pacifies': -2,
  pacifies: -1,
  reduces: -1,
  neutral: 0,
  aggravates: 1,
  increases: 1,
  'strongly aggravates': 2,
};

/**
 * Map shorthand dosha notation from canonical markdown.
 * e.g. "V- P- K=" -> vata=-1, pitta=-1, kapha=0
 */
export const DOSHA_SHORTHAND: Record<string, number> = {
  '--': -2,
  '-': -1,
  '=': 0,
  '+': 1,
  '++': 2,
};

// ---------------------------------------------------------------------------
// Season (Ritu) adjacency and mapping
// ---------------------------------------------------------------------------

/** Map common English season references to Ayurvedic ritus. */
export const SEASON_TO_RITU: Record<string, RituName> = {
  'late winter': 'shishira',
  winter: 'hemanta',
  'early winter': 'hemanta',
  spring: 'vasanta',
  summer: 'grishma',
  monsoon: 'varsha',
  rainy: 'varsha',
  autumn: 'sharad',
  fall: 'sharad',
};

/**
 * Adjacent ritu pairs for computing "nearby season" fitness scores.
 * Each ritu maps to its two neighbors in the annual cycle.
 */
export const RITU_ADJACENCY: Record<RituName, RituName[]> = {
  shishira: ['hemanta', 'vasanta'],
  vasanta: ['shishira', 'grishma'],
  grishma: ['vasanta', 'varsha'],
  varsha: ['grishma', 'sharad'],
  sharad: ['varsha', 'hemanta'],
  hemanta: ['sharad', 'shishira'],
};

// ---------------------------------------------------------------------------
// TCM organ-to-element mapping
// ---------------------------------------------------------------------------

/** Map TCM organs to their associated Wu Xing element. */
export const ORGAN_TO_ELEMENT: Record<string, ElementName> = {
  liver: 'wood',
  gallbladder: 'wood',
  heart: 'fire',
  small_intestine: 'fire',
  pericardium: 'fire',
  triple_burner: 'fire',
  spleen: 'earth',
  stomach: 'earth',
  lung: 'metal',
  large_intestine: 'metal',
  kidney: 'water',
  bladder: 'water',
};

// ---------------------------------------------------------------------------
// Canonical food categories with display metadata
// ---------------------------------------------------------------------------

export const FOOD_CATEGORIES_DISPLAY = [
  { name: 'grains', icon: 'grain', display_order: 1 },
  { name: 'legumes', icon: 'legume', display_order: 2 },
  { name: 'vegetables', icon: 'vegetable', display_order: 3 },
  { name: 'fruits', icon: 'fruit', display_order: 4 },
  { name: 'dairy', icon: 'dairy', display_order: 5 },
  { name: 'spices', icon: 'spice', display_order: 6 },
  { name: 'oils_fats', icon: 'oil', display_order: 7 },
  { name: 'animal_protein', icon: 'protein', display_order: 8 },
  { name: 'nuts_seeds', icon: 'nut', display_order: 9 },
  { name: 'beverages', icon: 'beverage', display_order: 10 },
] as const;

// ---------------------------------------------------------------------------
// Canonical biomarkers
// ---------------------------------------------------------------------------

export const CANONICAL_BIOMARKERS = [
  { name: 'Fasting Glucose', canonical_key: 'fasting_glucose' },
  { name: 'HbA1c', canonical_key: 'hba1c' },
  { name: 'Total Cholesterol', canonical_key: 'total_cholesterol' },
  { name: 'LDL Cholesterol', canonical_key: 'ldl_cholesterol' },
  { name: 'HDL Cholesterol', canonical_key: 'hdl_cholesterol' },
  { name: 'Triglycerides', canonical_key: 'triglycerides' },
  { name: 'CRP (C-Reactive Protein)', canonical_key: 'crp' },
  { name: 'ESR', canonical_key: 'esr' },
  { name: 'Iron (Serum)', canonical_key: 'iron_serum' },
  { name: 'Ferritin', canonical_key: 'ferritin' },
  { name: 'Transferrin Saturation', canonical_key: 'transferrin_saturation' },
  { name: 'Vitamin D (25-OH)', canonical_key: 'vitamin_d_25oh' },
  { name: 'Vitamin B12', canonical_key: 'vitamin_b12' },
  { name: 'Folate', canonical_key: 'folate' },
  { name: 'Calcium', canonical_key: 'calcium' },
  { name: 'Magnesium', canonical_key: 'magnesium' },
  { name: 'Zinc', canonical_key: 'zinc' },
  { name: 'TSH', canonical_key: 'tsh' },
  { name: 'Free T3', canonical_key: 'free_t3' },
  { name: 'Free T4', canonical_key: 'free_t4' },
  { name: 'ALT', canonical_key: 'alt' },
  { name: 'AST', canonical_key: 'ast' },
  { name: 'ALP', canonical_key: 'alp' },
  { name: 'GGT', canonical_key: 'ggt' },
  { name: 'Creatinine', canonical_key: 'creatinine' },
  { name: 'BUN', canonical_key: 'bun' },
  { name: 'eGFR', canonical_key: 'egfr' },
  { name: 'Uric Acid', canonical_key: 'uric_acid' },
  { name: 'Hemoglobin', canonical_key: 'hemoglobin' },
  { name: 'Platelets', canonical_key: 'platelets' },
  { name: 'WBC', canonical_key: 'wbc' },
  { name: 'Omega-3 Index', canonical_key: 'omega3_index' },
] as const;

// ---------------------------------------------------------------------------
// Cuisines
// ---------------------------------------------------------------------------

export const CUISINES = [
  'indian',
  'chinese',
  'japanese',
  'mediterranean',
  'middle_eastern',
  'southeast_asian',
  'western',
  'african',
] as const;

export type Cuisine = (typeof CUISINES)[number];

// ---------------------------------------------------------------------------
// Section heading -> category slug (for canonical markdown parser)
// ---------------------------------------------------------------------------

/** Map section headers in food-database-v1.md to category slugs. */
export const SECTION_TO_CATEGORY: Record<string, string> = {
  GRAINS: 'grains',
  LEGUMES: 'legumes',
  VEGETABLES: 'vegetables',
  FRUITS: 'fruits',
  DAIRY: 'dairy',
  'DAIRY & FERMENTED': 'dairy',
  SPICES: 'spice',
  'SPICES & AROMATICS': 'spices',
  OILS: 'oils_fats',
  'OILS & FATS': 'oils_fats',
  PROTEINS: 'animal_protein',
  'ANIMAL PROTEINS': 'animal_protein',
  'NUTS & SEEDS': 'nuts_seeds',
  BEVERAGES: 'beverages',
  SWEETENERS: 'sweeteners',
};
