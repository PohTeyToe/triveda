// integration.test.ts -- Integration tests for the seed pipeline.
//
// These tests validate that all seed data components compose correctly
// WITHOUT hitting a live database. They verify:
// 1. All seed data passes Zod validation
// 2. Cross-references between supplementary seeders and core data are consistent
// 3. Every food/herb has all required tradition properties
// 4. Biomarker mappings reference valid food names
// 5. Evidence claims reference valid food names
// 6. Cuisine affinities reference valid food/herb names

import { describe, expect, it } from 'vitest';
import { insertFoodSchema, insertHerbSchema } from '../validation.js';
import { CANONICAL_BIOMARKER_MAPPINGS } from './biomarker-seeder.js';
import { ELEMENT_KEYS, RITU_KEYS } from './constants.js';
import { CANONICAL_FOOD_AFFINITIES, CANONICAL_HERB_AFFINITIES } from './cuisine-seeder.js';
import { CANONICAL_SOURCE_ASSIGNMENTS } from './data-source-seeder.js';
import { CANONICAL_EVIDENCE_CLAIMS } from './evidence-seeder.js';
import { FOOD_SEEDS } from './food-data.js';
import { HERB_SEEDS } from './herb-data.js';
import { generateReport, validateFoods, validateHerbs } from './validate.js';

// =========================================================================
// Helper: build name sets for cross-reference checks
// =========================================================================

const FOOD_NAMES = new Set(FOOD_SEEDS.map((f) => f.name.toLowerCase()));
const HERB_NAMES = new Set(HERB_SEEDS.map((h) => h.name.toLowerCase()));

// =========================================================================
// 1. Zod schema validation -- all seeds pass
// =========================================================================

describe('Zod schema validation', () => {
  it('all foods pass insertFoodSchema', () => {
    for (const food of FOOD_SEEDS) {
      const result = insertFoodSchema.safeParse(food);
      if (!result.success) {
        // Fail with a useful message showing which food and what went wrong
        expect.fail(
          `Food "${food.name}" failed Zod validation: ${JSON.stringify(result.error.issues, null, 2)}`,
        );
      }
    }
  });

  it('all herbs pass insertHerbSchema', () => {
    for (const herb of HERB_SEEDS) {
      const result = insertHerbSchema.safeParse(herb);
      if (!result.success) {
        expect.fail(
          `Herb "${herb.name}" failed Zod validation: ${JSON.stringify(result.error.issues, null, 2)}`,
        );
      }
    }
  });
});

// =========================================================================
// 2. Validation pipeline -- no errors (warnings are acceptable)
// =========================================================================

describe('validation pipeline', () => {
  it('food validation produces no errors', () => {
    const summary = validateFoods(FOOD_SEEDS as unknown as Record<string, unknown>[]);
    expect(summary.failed).toBe(0);
    expect(summary.passed).toBe(FOOD_SEEDS.length);
  });

  it('herb validation produces no errors', () => {
    const summary = validateHerbs(HERB_SEEDS as unknown as Record<string, unknown>[]);
    expect(summary.failed).toBe(0);
    expect(summary.passed).toBe(HERB_SEEDS.length);
  });

  it('combined report has zero failures', () => {
    const foodSummary = validateFoods(FOOD_SEEDS as unknown as Record<string, unknown>[]);
    const herbSummary = validateHerbs(HERB_SEEDS as unknown as Record<string, unknown>[]);
    const report = generateReport([foodSummary, herbSummary]);
    expect(report.totalFailed).toBe(0);
    expect(report.totalEntities).toBe(FOOD_SEEDS.length + HERB_SEEDS.length);
  });
});

// =========================================================================
// 3. Completeness -- every food/herb has all required tradition properties
// =========================================================================

describe('tradition property completeness', () => {
  it('every food has all Ayurveda properties', () => {
    for (const food of FOOD_SEEDS) {
      expect(food.rasa.length, `${food.name}: rasa empty`).toBeGreaterThan(0);
      expect(food.virya, `${food.name}: virya missing`).toBeTruthy();
      expect(food.vipaka, `${food.name}: vipaka missing`).toBeTruthy();
      expect(food.guna.length, `${food.name}: guna empty`).toBeGreaterThan(0);
      expect(typeof food.vata_effect, `${food.name}: vata_effect not number`).toBe('number');
      expect(typeof food.pitta_effect, `${food.name}: pitta_effect not number`).toBe('number');
      expect(typeof food.kapha_effect, `${food.name}: kapha_effect not number`).toBe('number');
    }
  });

  it('every food has all TCM properties', () => {
    for (const food of FOOD_SEEDS) {
      expect(food.thermal_nature, `${food.name}: thermal_nature missing`).toBeTruthy();
      expect(food.flavor.length, `${food.name}: flavor empty`).toBeGreaterThan(0);
      expect(food.organ_affinity.length, `${food.name}: organ_affinity empty`).toBeGreaterThan(0);
      expect(food.actions.length, `${food.name}: actions empty`).toBeGreaterThan(0);
    }
  });

  it('every food has ritu_fit with all 6 seasons', () => {
    for (const food of FOOD_SEEDS) {
      for (const season of RITU_KEYS) {
        expect(food.ritu_fit[season], `${food.name}: ritu_fit.${season} missing`).toBeDefined();
      }
    }
  });

  it('every food has element_fit with all 5 elements', () => {
    for (const food of FOOD_SEEDS) {
      for (const element of ELEMENT_KEYS) {
        expect(
          food.element_fit[element],
          `${food.name}: element_fit.${element} missing`,
        ).toBeDefined();
      }
    }
  });

  it('every herb has all Ayurveda properties', () => {
    for (const herb of HERB_SEEDS) {
      expect(herb.rasa.length, `${herb.name}: rasa empty`).toBeGreaterThan(0);
      expect(herb.virya, `${herb.name}: virya missing`).toBeTruthy();
      expect(herb.vipaka, `${herb.name}: vipaka missing`).toBeTruthy();
      expect(herb.guna.length, `${herb.name}: guna empty`).toBeGreaterThan(0);
      expect(herb.herb_actions.length, `${herb.name}: herb_actions empty`).toBeGreaterThan(0);
    }
  });

  it('every herb has all TCM properties', () => {
    for (const herb of HERB_SEEDS) {
      expect(herb.thermal_nature, `${herb.name}: thermal_nature missing`).toBeTruthy();
      expect(herb.flavor.length, `${herb.name}: flavor empty`).toBeGreaterThan(0);
      expect(herb.organ_affinity.length, `${herb.name}: organ_affinity empty`).toBeGreaterThan(0);
      expect(herb.actions.length, `${herb.name}: actions empty`).toBeGreaterThan(0);
    }
  });
});

// =========================================================================
// 4. Cross-reference: cuisine affinities reference valid food/herb names
// =========================================================================

describe('cuisine affinity cross-references', () => {
  it('all food cuisine affinities reference existing food names', () => {
    const missing: string[] = [];
    for (const entry of CANONICAL_FOOD_AFFINITIES) {
      if (!FOOD_NAMES.has(entry.food_name.toLowerCase())) {
        missing.push(entry.food_name);
      }
    }
    expect(missing, `Missing foods: ${missing.join(', ')}`).toHaveLength(0);
  });

  it('all herb cuisine affinities reference existing herb names', () => {
    const missing: string[] = [];
    for (const entry of CANONICAL_HERB_AFFINITIES) {
      if (!HERB_NAMES.has(entry.food_name.toLowerCase())) {
        missing.push(entry.food_name);
      }
    }
    expect(missing, `Missing herbs: ${missing.join(', ')}`).toHaveLength(0);
  });

  it('food affinities have entity_type = "food"', () => {
    for (const entry of CANONICAL_FOOD_AFFINITIES) {
      expect(entry.entity_type).toBe('food');
    }
  });

  it('herb affinities have entity_type = "herb"', () => {
    for (const entry of CANONICAL_HERB_AFFINITIES) {
      expect(entry.entity_type).toBe('herb');
    }
  });

  it('all affinity scores are between 0 and 1', () => {
    const allEntries = [...CANONICAL_FOOD_AFFINITIES, ...CANONICAL_HERB_AFFINITIES];
    for (const entry of allEntries) {
      for (const [cuisine, score] of Object.entries(entry.affinities)) {
        if (score !== undefined) {
          expect(score, `${entry.food_name}/${cuisine}`).toBeGreaterThanOrEqual(0);
          expect(score, `${entry.food_name}/${cuisine}`).toBeLessThanOrEqual(1);
        }
      }
    }
  });
});

// =========================================================================
// 5. Cross-reference: biomarker mappings reference valid food names
// =========================================================================

describe('biomarker mapping cross-references', () => {
  it('all biomarker mappings reference existing food names', () => {
    const missing: string[] = [];
    for (const mapping of CANONICAL_BIOMARKER_MAPPINGS) {
      if (!FOOD_NAMES.has(mapping.food_name.toLowerCase())) {
        missing.push(mapping.food_name);
      }
    }
    // Deduplicate for cleaner output
    const unique = [...new Set(missing)];
    expect(unique, `Missing foods: ${unique.join(', ')}`).toHaveLength(0);
  });

  it('all biomarker mappings have valid effect_direction', () => {
    const validDirections = ['supportive', 'contraindicated'];
    for (const mapping of CANONICAL_BIOMARKER_MAPPINGS) {
      expect(validDirections, `${mapping.food_name}/${mapping.biomarker_key}`).toContain(
        mapping.effect_direction,
      );
    }
  });

  it('all biomarker mappings have effect_magnitude in [0, 1]', () => {
    for (const mapping of CANONICAL_BIOMARKER_MAPPINGS) {
      expect(
        mapping.effect_magnitude,
        `${mapping.food_name}/${mapping.biomarker_key}`,
      ).toBeGreaterThanOrEqual(0);
      expect(
        mapping.effect_magnitude,
        `${mapping.food_name}/${mapping.biomarker_key}`,
      ).toBeLessThanOrEqual(1);
    }
  });
});

// =========================================================================
// 6. Cross-reference: evidence claims reference valid food names
// =========================================================================

describe('evidence claim cross-references', () => {
  it('all evidence claim entries reference existing food names', () => {
    const missing: string[] = [];
    for (const entry of CANONICAL_EVIDENCE_CLAIMS) {
      if (!FOOD_NAMES.has(entry.food_name.toLowerCase())) {
        missing.push(entry.food_name);
      }
    }
    expect(missing, `Missing foods: ${missing.join(', ')}`).toHaveLength(0);
  });

  it('all evidence claims have valid evidence_level', () => {
    const validLevels = ['strong', 'moderate', 'emerging', 'traditional_only'];
    for (const entry of CANONICAL_EVIDENCE_CLAIMS) {
      for (const claim of entry.claims) {
        expect(validLevels, `${entry.food_name}: ${claim.claim.slice(0, 40)}...`).toContain(
          claim.evidence_level,
        );
      }
    }
  });

  it('every claim has a non-empty citation', () => {
    for (const entry of CANONICAL_EVIDENCE_CLAIMS) {
      for (const claim of entry.claims) {
        expect(claim.source_citation.length).toBeGreaterThan(0);
      }
    }
  });
});

// =========================================================================
// 7. Cross-reference: data source assignments reference valid entity names
// =========================================================================

describe('data source assignment cross-references', () => {
  it('all source assignments reference existing food or herb names', () => {
    const missing: string[] = [];
    for (const assignment of CANONICAL_SOURCE_ASSIGNMENTS) {
      const name = assignment.entity_name.toLowerCase();
      if (assignment.entity_type === 'food' && !FOOD_NAMES.has(name)) {
        missing.push(`food: ${assignment.entity_name}`);
      }
      if (assignment.entity_type === 'herb' && !HERB_NAMES.has(name)) {
        missing.push(`herb: ${assignment.entity_name}`);
      }
    }
    expect(missing, `Missing entities: ${missing.join(', ')}`).toHaveLength(0);
  });

  it('all confidence scores are between 0 and 1', () => {
    for (const assignment of CANONICAL_SOURCE_ASSIGNMENTS) {
      for (const source of assignment.sources) {
        expect(
          source.confidence_score,
          `${assignment.entity_name}/${source.source_name}`,
        ).toBeGreaterThanOrEqual(0);
        expect(
          source.confidence_score,
          `${assignment.entity_name}/${source.source_name}`,
        ).toBeLessThanOrEqual(1);
      }
    }
  });
});

// =========================================================================
// 8. Seed counts meet minimum thresholds
// =========================================================================

describe('seed data thresholds', () => {
  it('has at least 50 foods', () => {
    expect(FOOD_SEEDS.length).toBeGreaterThanOrEqual(50);
  });

  it('has at least 15 herbs', () => {
    expect(HERB_SEEDS.length).toBeGreaterThanOrEqual(15);
  });

  it('has evidence claims for at least 20 foods', () => {
    expect(CANONICAL_EVIDENCE_CLAIMS.length).toBeGreaterThanOrEqual(20);
  });

  it('has biomarker mappings for multiple biomarkers', () => {
    const uniqueBiomarkers = new Set(CANONICAL_BIOMARKER_MAPPINGS.map((m) => m.biomarker_key));
    expect(uniqueBiomarkers.size).toBeGreaterThanOrEqual(5);
  });

  it('has cuisine affinities for at least 30 foods', () => {
    expect(CANONICAL_FOOD_AFFINITIES.length).toBeGreaterThanOrEqual(30);
  });

  it('has cuisine affinities for at least 5 herbs', () => {
    expect(CANONICAL_HERB_AFFINITIES.length).toBeGreaterThanOrEqual(5);
  });
});
