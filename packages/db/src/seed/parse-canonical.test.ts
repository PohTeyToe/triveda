// Tests for the canonical food markdown parser.
// Uses a test fixture with 8 representative foods covering all edge cases.

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  CANONICAL_BIOMARKERS,
  DOSHA_EFFECT_MAP,
  DOSHA_SHORTHAND,
  ELEMENT_KEYS,
  ORGAN_TO_ELEMENT,
  RASA_MAP,
  RITU_KEYS,
  SECTION_TO_CATEGORY,
  VIRYA_MAP,
} from './constants.js';
import {
  type CanonicalFood,
  deriveElementFit,
  deriveRituFit,
  detectThermalContradiction,
  parseActions,
  parseCanonicalFoods,
  parseDoshaEffects,
  parseEvidenceClaims,
  parseGuna,
  parseOrganAffinity,
  parseRasa,
  parseThermalNature,
  parseVipaka,
  parseVirya,
} from './parse-canonical.js';

// ---------------------------------------------------------------------------
// Test fixture path
// ---------------------------------------------------------------------------

const THIS_DIR = dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = resolve(THIS_DIR, '__fixtures__', 'food-database-test.md');

// ---------------------------------------------------------------------------
// Helper -- find a food by name, throwing if not found (avoids non-null assertions)
// ---------------------------------------------------------------------------

function findFood(foods: CanonicalFood[], name: string): CanonicalFood {
  const found = foods.find((f) => f.name === name);
  if (!found) throw new Error(`Food "${name}" not found in parsed output`);
  return found;
}

// ---------------------------------------------------------------------------
// Constants tests
// ---------------------------------------------------------------------------

describe('constants', () => {
  it('RASA_MAP maps all 6 English tastes to Sanskrit', () => {
    const pairs: [string, string][] = [
      ['sweet', 'madhura'],
      ['sour', 'amla'],
      ['salty', 'lavana'],
      ['pungent', 'katu'],
      ['bitter', 'tikta'],
      ['astringent', 'kashaya'],
    ];
    for (const [eng, san] of pairs) {
      expect(RASA_MAP[eng]).toBe(san);
    }
    expect(Object.keys(RASA_MAP)).toHaveLength(6);
  });

  it('DOSHA_EFFECT_MAP has correct numeric mappings', () => {
    expect(DOSHA_EFFECT_MAP['strongly pacifies']).toBe(-2);
    expect(DOSHA_EFFECT_MAP.pacifies).toBe(-1);
    expect(DOSHA_EFFECT_MAP.reduces).toBe(-1);
    expect(DOSHA_EFFECT_MAP.neutral).toBe(0);
    expect(DOSHA_EFFECT_MAP.aggravates).toBe(1);
    expect(DOSHA_EFFECT_MAP.increases).toBe(1);
    expect(DOSHA_EFFECT_MAP['strongly aggravates']).toBe(2);
  });

  it('DOSHA_SHORTHAND maps +/-/= symbols correctly', () => {
    expect(DOSHA_SHORTHAND['--']).toBe(-2);
    expect(DOSHA_SHORTHAND['-']).toBe(-1);
    expect(DOSHA_SHORTHAND['=']).toBe(0);
    expect(DOSHA_SHORTHAND['+']).toBe(1);
    expect(DOSHA_SHORTHAND['++']).toBe(2);
  });

  it('VIRYA_MAP maps English virya terms to Sanskrit', () => {
    expect(VIRYA_MAP.heating).toBe('ushna');
    expect(VIRYA_MAP.cooling).toBe('sheeta');
    expect(VIRYA_MAP.hot).toBe('ushna');
    expect(VIRYA_MAP.cold).toBe('sheeta');
  });

  it('CANONICAL_BIOMARKERS has 32 entries', () => {
    expect(CANONICAL_BIOMARKERS.length).toBe(32);
    for (const b of CANONICAL_BIOMARKERS) {
      expect(b.name).toBeTruthy();
      expect(b.canonical_key).toBeTruthy();
      expect(b.canonical_key).toMatch(/^[a-z0-9_]+$/);
    }
  });

  it('ORGAN_TO_ELEMENT maps all 12 organs to 5 elements', () => {
    const organs = Object.keys(ORGAN_TO_ELEMENT);
    expect(organs.length).toBe(12);
    const elements = new Set(Object.values(ORGAN_TO_ELEMENT));
    expect(elements.size).toBe(5);
  });

  it('SECTION_TO_CATEGORY covers standard section headings', () => {
    expect(SECTION_TO_CATEGORY.GRAINS).toBe('grains');
    expect(SECTION_TO_CATEGORY.VEGETABLES).toBe('vegetables');
    expect(SECTION_TO_CATEGORY.FRUITS).toBe('fruits');
    expect(SECTION_TO_CATEGORY['NUTS & SEEDS']).toBe('nuts_seeds');
  });
});

// ---------------------------------------------------------------------------
// Individual parser function tests
// ---------------------------------------------------------------------------

describe('parseRasa', () => {
  it('maps single English taste to Sanskrit', () => {
    expect(parseRasa('Sweet')).toEqual(['madhura']);
  });

  it('maps multiple English tastes to Sanskrit', () => {
    expect(parseRasa('Sweet, Astringent')).toEqual(['madhura', 'kashaya']);
  });

  it('passes through already-Sanskrit values', () => {
    expect(parseRasa('madhura')).toEqual(['madhura']);
  });

  it('handles three tastes', () => {
    expect(parseRasa('Bitter, Pungent, Astringent')).toEqual(['tikta', 'katu', 'kashaya']);
  });
});

describe('parseVirya', () => {
  it('maps simple Heating to ushna', () => {
    expect(parseVirya('Heating')).toBe('ushna');
  });

  it('maps simple Cooling to sheeta', () => {
    expect(parseVirya('Cooling')).toBe('sheeta');
  });

  it('takes first value for conditional virya', () => {
    expect(parseVirya('Heating (cooked), Cooling (dry)')).toBe('ushna');
  });

  it('takes first value for "neutral to warm"', () => {
    expect(parseVirya('neutral to warm')).toBe('neutral');
  });
});

describe('parseVipaka', () => {
  it('maps English to Sanskrit', () => {
    expect(parseVipaka('Sweet')).toBe('madhura');
    expect(parseVipaka('Pungent')).toBe('katu');
    expect(parseVipaka('Sour')).toBe('amla');
  });
});

describe('parseGuna', () => {
  it('maps English guna terms to Sanskrit', () => {
    expect(parseGuna('light, dry')).toEqual(['laghu', 'ruksha']);
  });

  it('handles three gunas', () => {
    expect(parseGuna('light, dry, sharp')).toEqual(['laghu', 'ruksha', 'tikshna']);
  });

  it('maps heavy and oily', () => {
    expect(parseGuna('heavy, oily')).toEqual(['guru', 'snigdha']);
  });
});

describe('parseDoshaEffects', () => {
  it('parses simple V- P- K= notation', () => {
    const result = parseDoshaEffects('Dosha: V- P- K=');
    expect(result).toEqual({ vata_effect: -1, pitta_effect: -1, kapha_effect: 0 });
  });

  it('parses V- P= K+ notation', () => {
    const result = parseDoshaEffects('Dosha: V- P= K+');
    expect(result).toEqual({ vata_effect: -1, pitta_effect: 0, kapha_effect: 1 });
  });

  it('parses V+ P- K- notation', () => {
    const result = parseDoshaEffects('Dosha: V+ P- K-');
    expect(result).toEqual({ vata_effect: 1, pitta_effect: -1, kapha_effect: -1 });
  });

  it('handles conditional dosha: V+ (raw) V- (cooked) -> takes cooked', () => {
    const result = parseDoshaEffects('Dosha: V+ (raw) V- (cooked) P- K=');
    expect(result.vata_effect).toBe(-1);
    expect(result.pitta_effect).toBe(-1);
    expect(result.kapha_effect).toBe(0);
  });

  it('handles V= P= K- notation', () => {
    const result = parseDoshaEffects('Dosha: V= P= K-');
    expect(result).toEqual({ vata_effect: 0, pitta_effect: 0, kapha_effect: -1 });
  });
});

describe('parseThermalNature', () => {
  it('normalizes to lowercase', () => {
    expect(parseThermalNature('Hot')).toBe('hot');
    expect(parseThermalNature('Warm')).toBe('warm');
    expect(parseThermalNature('Cool')).toBe('cool');
  });

  it('takes first value for "neutral to warm"', () => {
    expect(parseThermalNature('Neutral to Warm')).toBe('neutral');
  });
});

describe('parseOrganAffinity', () => {
  it('normalizes to snake_case', () => {
    expect(parseOrganAffinity('Spleen, Stomach, Large Intestine')).toEqual([
      'spleen',
      'stomach',
      'large_intestine',
    ]);
  });
});

describe('parseActions', () => {
  it('normalizes to snake_case', () => {
    expect(parseActions('tonify qi, harmonize middle')).toEqual(['tonify_qi', 'harmonize_middle']);
  });
});

describe('parseEvidenceClaims', () => {
  it('parses claims with evidence levels', () => {
    const result = parseEvidenceClaims(
      'supports digestive health (moderate); low glycemic compared to other rice (strong)',
    );
    expect(result).toHaveLength(2);
    expect(result[0]?.claim).toBe('supports digestive health');
    expect(result[0]?.evidence_level).toBe('moderate');
    expect(result[1]?.evidence_level).toBe('strong');
  });

  it('extracts PubMed citations', () => {
    const result = parseEvidenceClaims('lowers LDL cholesterol (strong) [PubMed:25411276]');
    expect(result).toHaveLength(1);
    expect(result[0]?.evidence_level).toBe('strong');
    expect(result[0]?.source_citation).toBe('PubMed:25411276');
  });

  it('returns empty array for empty input', () => {
    expect(parseEvidenceClaims('')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Derived score tests
// ---------------------------------------------------------------------------

describe('deriveRituFit', () => {
  it('sets all seasons to 0.75 for "All seasons"', () => {
    const fit = deriveRituFit('All seasons | Vata, Pitta types | Lunch');
    for (const ritu of RITU_KEYS) {
      expect(fit[ritu]).toBe(0.75);
    }
  });

  it('sets mentioned seasons to 0.85, adjacent to 0.60, others to 0.35', () => {
    const fit = deriveRituFit('Winter, autumn | Vata types | Morning');
    expect(fit.hemanta).toBe(0.85);
    expect(fit.sharad).toBe(0.85);
    expect(fit.shishira).toBe(0.6);
    expect(fit.varsha).toBe(0.6);
    expect(fit.grishma).toBe(0.35);
  });

  it('returns all 0.35 when no best_for is provided', () => {
    const fit = deriveRituFit(null);
    for (const ritu of RITU_KEYS) {
      expect(fit[ritu]).toBe(0.35);
    }
  });

  it('produces valid scores in [0, 1] range', () => {
    const fit = deriveRituFit('Summer, spring | Pitta types');
    for (const ritu of RITU_KEYS) {
      expect(fit[ritu]).toBeGreaterThanOrEqual(0);
      expect(fit[ritu]).toBeLessThanOrEqual(1);
    }
  });
});

describe('deriveElementFit', () => {
  it('maps spleen/stomach to earth=0.85', () => {
    const fit = deriveElementFit(['spleen', 'stomach']);
    expect(fit.earth).toBe(0.85);
    expect(fit.wood).toBe(0.4);
    expect(fit.fire).toBe(0.4);
    expect(fit.metal).toBe(0.4);
    expect(fit.water).toBe(0.4);
  });

  it('maps multiple organs to multiple elements', () => {
    const fit = deriveElementFit(['liver', 'stomach', 'large_intestine']);
    expect(fit.wood).toBe(0.85);
    expect(fit.earth).toBe(0.85);
    expect(fit.metal).toBe(0.85);
  });

  it('produces valid scores in [0, 1] range', () => {
    const fit = deriveElementFit(['spleen', 'kidney']);
    for (const el of ELEMENT_KEYS) {
      expect(fit[el]).toBeGreaterThanOrEqual(0);
      expect(fit[el]).toBeLessThanOrEqual(1);
    }
  });
});

describe('detectThermalContradiction', () => {
  it('detects Ayurveda heating + TCM cool as contradiction', () => {
    expect(detectThermalContradiction('ushna', 'cool')).toBe(true);
  });

  it('detects Ayurveda heating + TCM cold as contradiction', () => {
    expect(detectThermalContradiction('ushna', 'cold')).toBe(true);
  });

  it('does not flag matching thermal natures', () => {
    expect(detectThermalContradiction('ushna', 'hot')).toBe(false);
    expect(detectThermalContradiction('ushna', 'warm')).toBe(false);
    expect(detectThermalContradiction('sheeta', 'cool')).toBe(false);
  });

  it('does not flag neutral TCM nature', () => {
    expect(detectThermalContradiction('ushna', 'neutral')).toBe(false);
    expect(detectThermalContradiction('sheeta', 'neutral')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Full parser integration tests
// ---------------------------------------------------------------------------

describe('parseCanonicalFoods', () => {
  const foods = parseCanonicalFoods(FIXTURE_PATH);

  it('extracts exactly 8 foods from the test fixture', () => {
    expect(foods).toHaveLength(8);
  });

  // -- Basmati Rice --

  describe('Basmati Rice', () => {
    it('exists in parsed output', () => {
      expect(foods.find((f) => f.name === 'Basmati Rice')).toBeDefined();
    });

    it('has rasa = ["madhura"]', () => {
      const rice = findFood(foods, 'Basmati Rice');
      expect(rice.rasa).toEqual(['madhura']);
    });

    it('has virya = "sheeta"', () => {
      const rice = findFood(foods, 'Basmati Rice');
      expect(rice.virya).toBe('sheeta');
    });

    it('has vipaka = "madhura"', () => {
      const rice = findFood(foods, 'Basmati Rice');
      expect(rice.vipaka).toBe('madhura');
    });

    it('has dosha effects: vata=-1, pitta=-1, kapha=0', () => {
      const rice = findFood(foods, 'Basmati Rice');
      expect(rice.vata_effect).toBe(-1);
      expect(rice.pitta_effect).toBe(-1);
      expect(rice.kapha_effect).toBe(0);
    });

    it('has thermal_nature = "neutral"', () => {
      const rice = findFood(foods, 'Basmati Rice');
      expect(rice.thermal_nature).toBe('neutral');
    });

    it('has organ_affinity including spleen and stomach', () => {
      const rice = findFood(foods, 'Basmati Rice');
      expect(rice.organ_affinity).toContain('spleen');
      expect(rice.organ_affinity).toContain('stomach');
    });

    it('has category = "grains"', () => {
      const rice = findFood(foods, 'Basmati Rice');
      expect(rice.category).toBe('grains');
    });

    it('has seed_source = "canonical"', () => {
      const rice = findFood(foods, 'Basmati Rice');
      expect(rice.seed_source).toBe('canonical');
    });

    it('has validation_status = "validated"', () => {
      const rice = findFood(foods, 'Basmati Rice');
      expect(rice.validation_status).toBe('validated');
    });

    it('has ritu_fit with all 0.75 (all seasons)', () => {
      const rice = findFood(foods, 'Basmati Rice');
      for (const ritu of RITU_KEYS) {
        expect(rice.ritu_fit[ritu]).toBe(0.75);
      }
    });
  });

  // -- Oats --

  describe('Oats', () => {
    it('exists in parsed output', () => {
      expect(foods.find((f) => f.name === 'Oats')).toBeDefined();
    });

    it('has virya = "ushna" (takes primary/cooked heating value)', () => {
      const oats = findFood(foods, 'Oats');
      expect(oats.virya).toBe('ushna');
    });

    it('has dosha effects: vata=-1, pitta=0, kapha=+1', () => {
      const oats = findFood(foods, 'Oats');
      expect(oats.vata_effect).toBe(-1);
      expect(oats.pitta_effect).toBe(0);
      expect(oats.kapha_effect).toBe(1);
    });

    it('has evidence claims with PubMed citation', () => {
      const oats = findFood(foods, 'Oats');
      const ldlClaim = oats.evidence_claims_raw.find((c) => c.claim.includes('LDL'));
      expect(ldlClaim).toBeDefined();
      expect(ldlClaim?.evidence_level).toBe('strong');
      expect(ldlClaim?.source_citation).toBe('PubMed:25411276');
    });
  });

  // -- Barley --

  describe('Barley', () => {
    it('handles multi-value rasa: sweet, astringent', () => {
      const barley = findFood(foods, 'Barley');
      expect(barley.rasa).toEqual(['madhura', 'kashaya']);
    });

    it('has vipaka = "katu"', () => {
      const barley = findFood(foods, 'Barley');
      expect(barley.vipaka).toBe('katu');
    });
  });

  // -- Buckwheat --

  describe('Buckwheat', () => {
    it('is flagged as thermal contradiction (Ayurveda heating, TCM cool)', () => {
      const buckwheat = findFood(foods, 'Buckwheat');
      expect(buckwheat.thermal_contradiction).toBe(true);
      expect(buckwheat.virya).toBe('ushna');
      expect(buckwheat.thermal_nature).toBe('cool');
    });
  });

  // -- Spinach --

  describe('Spinach', () => {
    it('has category = "vegetables"', () => {
      const spinach = findFood(foods, 'Spinach');
      expect(spinach.category).toBe('vegetables');
    });

    it('has contraindications', () => {
      const spinach = findFood(foods, 'Spinach');
      expect(spinach.contraindications).toBeDefined();
      expect(spinach.contraindications?.length).toBeGreaterThan(0);
    });
  });

  // -- Ginger --

  describe('Ginger', () => {
    it('has thermal_nature = "hot"', () => {
      const ginger = findFood(foods, 'Ginger');
      expect(ginger.thermal_nature).toBe('hot');
    });

    it('has category from SPICES & AROMATICS section', () => {
      const ginger = findFood(foods, 'Ginger');
      expect(ginger.category).toBeDefined();
    });

    it('has evidence claims with PubMed citation', () => {
      const ginger = findFood(foods, 'Ginger');
      const nauseaClaim = ginger.evidence_claims_raw.find((c) => c.claim.includes('nausea'));
      expect(nauseaClaim).toBeDefined();
      expect(nauseaClaim?.source_citation).toBe('PubMed:10793599');
    });
  });

  // -- Turmeric --

  describe('Turmeric', () => {
    it('has three rasa values', () => {
      const turmeric = findFood(foods, 'Turmeric');
      expect(turmeric.rasa).toEqual(['tikta', 'katu', 'kashaya']);
    });

    it('has all-seasons ritu_fit', () => {
      const turmeric = findFood(foods, 'Turmeric');
      for (const ritu of RITU_KEYS) {
        expect(turmeric.ritu_fit[ritu]).toBe(0.75);
      }
    });
  });

  // -- Apple (conditional dosha) --

  describe('Apple', () => {
    it('handles conditional dosha: V+(raw) V-(cooked) -> vata_effect = -1', () => {
      const apple = findFood(foods, 'Apple');
      expect(apple.vata_effect).toBe(-1);
    });

    it('has category = "fruits"', () => {
      const apple = findFood(foods, 'Apple');
      expect(apple.category).toBe('fruits');
    });

    it('has convergence notes mentioning raw/cooked difference', () => {
      const apple = findFood(foods, 'Apple');
      expect(apple.convergence_notes).toBeDefined();
      expect(apple.convergence_notes).toContain('raw');
    });
  });

  // -- Cross-cutting assertions --

  describe('all foods', () => {
    it('have non-empty rasa', () => {
      for (const food of foods) {
        expect(food.rasa.length).toBeGreaterThan(0);
      }
    });

    it('have non-empty virya', () => {
      for (const food of foods) {
        expect(food.virya).toBeTruthy();
      }
    });

    it('have non-empty vipaka', () => {
      for (const food of foods) {
        expect(food.vipaka).toBeTruthy();
      }
    });

    it('have non-empty thermal_nature', () => {
      for (const food of foods) {
        expect(food.thermal_nature).toBeTruthy();
      }
    });

    it('have non-empty flavor array', () => {
      for (const food of foods) {
        expect(food.flavor.length).toBeGreaterThan(0);
      }
    });

    it('have valid ritu_fit with all 6 ritus and values in [0.0, 1.0]', () => {
      for (const food of foods) {
        for (const ritu of RITU_KEYS) {
          const val = food.ritu_fit[ritu];
          expect(val).toBeGreaterThanOrEqual(0);
          expect(val).toBeLessThanOrEqual(1);
        }
      }
    });

    it('have valid element_fit with all 5 elements and values in [0.0, 1.0]', () => {
      for (const food of foods) {
        for (const el of ELEMENT_KEYS) {
          const val = food.element_fit[el];
          expect(val).toBeGreaterThanOrEqual(0);
          expect(val).toBeLessThanOrEqual(1);
        }
      }
    });

    it('have seed_source = "canonical" and validation_status = "validated"', () => {
      for (const food of foods) {
        expect(food.seed_source).toBe('canonical');
        expect(food.validation_status).toBe('validated');
      }
    });

    it('have non-empty guna array', () => {
      for (const food of foods) {
        expect(food.guna.length).toBeGreaterThan(0);
      }
    });

    it('have non-empty organ_affinity array', () => {
      for (const food of foods) {
        expect(food.organ_affinity.length).toBeGreaterThan(0);
      }
    });

    it('have non-empty actions array', () => {
      for (const food of foods) {
        expect(food.actions.length).toBeGreaterThan(0);
      }
    });
  });
});
