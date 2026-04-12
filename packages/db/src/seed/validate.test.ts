// Tests for the seed data validation pipeline.
//
// Covers:
// - Zod schema validation (valid food/herb passes, invalid fails)
// - Ayurveda field checks (rasa, virya, vipaka, guna, dosha effects, ritu_fit)
// - TCM field checks (thermal_nature, flavor, organ_affinity, actions, element_fit)
// - Food-specific checks (category cross-ref, glycemic_index, bioactive_compounds)
// - Herb-specific checks (herb_actions, pregnancy_safety, is_culinary)
// - Cross-tradition consistency (virya vs thermal_nature)
// - Dosha consistency (virya vs pitta_effect)
// - Duplicate name detection
// - Completeness (empty arrays, missing ritu_fit keys)
// - Report generation and formatting

import { describe, expect, it } from 'vitest';
import {
  type EntityResult,
  type ValidationIssue,
  type ValidationSummary,
  formatReport,
  generateReport,
  validateFoods,
  validateHerbs,
} from './validate.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Get the first entity result, throwing if missing (keeps TS happy). */
function first(summary: ValidationSummary): EntityResult {
  const r = summary.results[0];
  if (!r) throw new Error('Expected at least one result');
  return r;
}

/** Filter issues by severity and field from an entity result. */
function issuesFor(
  result: EntityResult,
  severity: 'error' | 'warning',
  field: string,
): ValidationIssue[] {
  return result.issues.filter((i) => i.severity === severity && i.field === field);
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** A minimal valid food object that passes all checks. */
function validFood(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    name: 'rice',
    category: 'grains',
    rasa: ['madhura'],
    virya: 'sheeta',
    vipaka: 'madhura',
    guna: ['guru', 'snigdha'],
    vata_effect: -1,
    pitta_effect: -1,
    kapha_effect: 1,
    ritu_fit: {
      shishira: 0.8,
      vasanta: 0.6,
      grishma: 0.7,
      varsha: 0.5,
      sharad: 0.6,
      hemanta: 0.9,
    },
    thermal_nature: 'cool',
    flavor: ['sweet'],
    organ_affinity: ['spleen', 'stomach'],
    actions: ['tonify_qi'],
    element_fit: {
      wood: 0.2,
      fire: 0.1,
      earth: 0.8,
      metal: 0.3,
      water: 0.4,
    },
    seed_source: 'canonical',
    validation_status: 'pending',
    ...overrides,
  };
}

/** A minimal valid herb object that passes all checks. */
function validHerb(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    name: 'ashwagandha',
    category: 'adaptogen',
    rasa: ['tikta', 'kashaya'],
    virya: 'ushna',
    vipaka: 'madhura',
    guna: ['laghu', 'snigdha'],
    vata_effect: -2,
    pitta_effect: 1,
    kapha_effect: 0,
    ritu_fit: {
      shishira: 0.9,
      vasanta: 0.5,
      grishma: 0.3,
      varsha: 0.6,
      sharad: 0.5,
      hemanta: 0.8,
    },
    thermal_nature: 'warm',
    flavor: ['bitter', 'astringent'],
    organ_affinity: ['kidney', 'lung'],
    actions: ['tonify_yang', 'calm_shen'],
    element_fit: {
      wood: 0.3,
      fire: 0.5,
      earth: 0.6,
      metal: 0.4,
      water: 0.7,
    },
    herb_actions: ['adaptogenic', 'nervine', 'rejuvenative'],
    pregnancy_safety: 'contraindicated',
    is_culinary: false,
    seed_source: 'canonical',
    validation_status: 'pending',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Food validation -- happy path
// ---------------------------------------------------------------------------

describe('validateFoods', () => {
  it('passes a fully valid food with no issues', () => {
    const summary = validateFoods([validFood()]);
    expect(summary.total).toBe(1);
    expect(summary.passed).toBe(1);
    expect(summary.failed).toBe(0);
    const r = first(summary);
    expect(r.valid).toBe(true);
    expect(r.issues.filter((i) => i.severity === 'error')).toHaveLength(0);
  });

  it('passes multiple valid foods', () => {
    const summary = validateFoods([
      validFood({ name: 'rice' }),
      validFood({ name: 'wheat' }),
      validFood({ name: 'barley' }),
    ]);
    expect(summary.passed).toBe(3);
    expect(summary.failed).toBe(0);
  });

  // -------------------------------------------------------------------------
  // Ayurveda field checks
  // -------------------------------------------------------------------------

  describe('Ayurveda checks', () => {
    it('errors on invalid rasa value', () => {
      const r = first(validateFoods([validFood({ rasa: ['sweet'] })]));
      const errors = issuesFor(r, 'error', 'rasa');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]?.message).toContain('sweet');
    });

    it('errors on empty rasa array', () => {
      const r = first(validateFoods([validFood({ rasa: [] })]));
      expect(issuesFor(r, 'error', 'rasa').length).toBeGreaterThan(0);
    });

    it('warns on duplicate rasa values', () => {
      const r = first(validateFoods([validFood({ rasa: ['madhura', 'madhura'] })]));
      const warnings = issuesFor(r, 'warning', 'rasa');
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0]?.message).toContain('duplicate');
    });

    it('errors on invalid virya', () => {
      const r = first(validateFoods([validFood({ virya: 'hot' })]));
      expect(issuesFor(r, 'error', 'virya').length).toBeGreaterThan(0);
    });

    it('errors on invalid vipaka', () => {
      const r = first(validateFoods([validFood({ vipaka: 'tikta' })]));
      expect(issuesFor(r, 'error', 'vipaka').length).toBeGreaterThan(0);
    });

    it('errors on invalid guna value', () => {
      const r = first(validateFoods([validFood({ guna: ['heavy'] })]));
      expect(issuesFor(r, 'error', 'guna').length).toBeGreaterThan(0);
    });

    it('errors on dosha effect outside [-2, +2] range', () => {
      const r = first(validateFoods([validFood({ vata_effect: 5 })]));
      const errors = issuesFor(r, 'error', 'vata_effect');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]?.message).toContain('-2');
      expect(errors[0]?.message).toContain('2');
    });

    it('errors on non-integer dosha effect', () => {
      const r = first(validateFoods([validFood({ pitta_effect: 1.5 })]));
      expect(issuesFor(r, 'error', 'pitta_effect').length).toBeGreaterThan(0);
    });

    it('errors on missing ritu_fit key', () => {
      const rituFit = {
        shishira: 0.8,
        vasanta: 0.6,
        grishma: 0.7,
        varsha: 0.5,
        sharad: 0.6,
        // hemanta missing
      };
      const r = first(validateFoods([validFood({ ritu_fit: rituFit })]));
      const errors = issuesFor(r, 'error', 'ritu_fit');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]?.message).toContain('hemanta');
    });

    it('errors on ritu_fit value outside [0, 1]', () => {
      const rituFit = {
        shishira: 1.5,
        vasanta: 0.6,
        grishma: 0.7,
        varsha: 0.5,
        sharad: 0.6,
        hemanta: 0.9,
      };
      const r = first(validateFoods([validFood({ ritu_fit: rituFit })]));
      expect(issuesFor(r, 'error', 'ritu_fit').length).toBeGreaterThan(0);
    });

    it('warns on extra ritu_fit keys', () => {
      const rituFit = {
        shishira: 0.8,
        vasanta: 0.6,
        grishma: 0.7,
        varsha: 0.5,
        sharad: 0.6,
        hemanta: 0.9,
        monsoon: 0.4, // extra key
      };
      const r = first(validateFoods([validFood({ ritu_fit: rituFit })]));
      const warnings = issuesFor(r, 'warning', 'ritu_fit');
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0]?.message).toContain('monsoon');
    });
  });

  // -------------------------------------------------------------------------
  // TCM field checks
  // -------------------------------------------------------------------------

  describe('TCM checks', () => {
    it('errors on invalid thermal_nature', () => {
      const r = first(validateFoods([validFood({ thermal_nature: 'lukewarm' })]));
      expect(issuesFor(r, 'error', 'thermal_nature').length).toBeGreaterThan(0);
    });

    it('errors on invalid TCM flavor', () => {
      const r = first(validateFoods([validFood({ flavor: ['umami'] })]));
      expect(issuesFor(r, 'error', 'flavor').length).toBeGreaterThan(0);
    });

    it('errors on empty flavor array', () => {
      const r = first(validateFoods([validFood({ flavor: [] })]));
      expect(issuesFor(r, 'error', 'flavor').length).toBeGreaterThan(0);
    });

    it('errors on invalid organ_affinity', () => {
      const r = first(validateFoods([validFood({ organ_affinity: ['brain'] })]));
      expect(issuesFor(r, 'error', 'organ_affinity').length).toBeGreaterThan(0);
    });

    it('errors on empty organ_affinity', () => {
      const r = first(validateFoods([validFood({ organ_affinity: [] })]));
      expect(issuesFor(r, 'error', 'organ_affinity').length).toBeGreaterThan(0);
    });

    it('errors on empty actions array', () => {
      const r = first(validateFoods([validFood({ actions: [] })]));
      expect(issuesFor(r, 'error', 'actions').length).toBeGreaterThan(0);
    });

    it('errors on missing element_fit key', () => {
      const elementFit = {
        wood: 0.2,
        fire: 0.1,
        earth: 0.8,
        metal: 0.3,
        // water missing
      };
      const r = first(validateFoods([validFood({ element_fit: elementFit })]));
      const errors = issuesFor(r, 'error', 'element_fit');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]?.message).toContain('water');
    });

    it('errors on element_fit value outside [0, 1]', () => {
      const elementFit = {
        wood: -0.1,
        fire: 0.1,
        earth: 0.8,
        metal: 0.3,
        water: 0.4,
      };
      const r = first(validateFoods([validFood({ element_fit: elementFit })]));
      expect(issuesFor(r, 'error', 'element_fit').length).toBeGreaterThan(0);
    });

    it('warns on extra element_fit keys', () => {
      const elementFit = {
        wood: 0.2,
        fire: 0.1,
        earth: 0.8,
        metal: 0.3,
        water: 0.4,
        aether: 0.5,
      };
      const r = first(validateFoods([validFood({ element_fit: elementFit })]));
      const warnings = issuesFor(r, 'warning', 'element_fit');
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0]?.message).toContain('aether');
    });
  });

  // -------------------------------------------------------------------------
  // Food-specific checks
  // -------------------------------------------------------------------------

  describe('food-specific checks', () => {
    it('errors when category is not in the valid set', () => {
      const categories = new Set(['grains', 'legumes', 'vegetables']);
      const r = first(validateFoods([validFood({ category: 'desserts' })], categories));
      const errors = issuesFor(r, 'error', 'category');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]?.message).toContain('desserts');
    });

    it('skips category cross-ref when validCategoryNames is empty', () => {
      const r = first(validateFoods([validFood({ category: 'anything_goes' })]));
      expect(issuesFor(r, 'error', 'category')).toHaveLength(0);
    });

    it('warns on glycemic_index outside typical range', () => {
      const r = first(validateFoods([validFood({ glycemic_index: 250 })]));
      expect(issuesFor(r, 'warning', 'glycemic_index').length).toBeGreaterThan(0);
    });

    it('errors on non-integer glycemic_index', () => {
      const r = first(validateFoods([validFood({ glycemic_index: 55.5 })]));
      expect(issuesFor(r, 'error', 'glycemic_index').length).toBeGreaterThan(0);
    });

    it('passes when glycemic_index is null (optional)', () => {
      const r = first(validateFoods([validFood({ glycemic_index: null })]));
      const giIssues = r.issues.filter((i) => i.field === 'glycemic_index');
      expect(giIssues).toHaveLength(0);
    });

    it('errors on malformed bioactive_compounds entry', () => {
      const r = first(
        validateFoods([
          validFood({
            bioactive_compounds: [{ name: '', amount_per_100g: -1, unit: '' }],
          }),
        ]),
      );
      const errors = issuesFor(r, 'error', 'bioactive_compounds');
      // name empty, amount negative, unit empty = 3 errors
      expect(errors.length).toBe(3);
    });

    it('passes valid bioactive_compounds', () => {
      const r = first(
        validateFoods([
          validFood({
            bioactive_compounds: [{ name: 'vitamin C', amount_per_100g: 53.2, unit: 'mg' }],
          }),
        ]),
      );
      expect(issuesFor(r, 'error', 'bioactive_compounds')).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Cross-tradition consistency
  // -------------------------------------------------------------------------

  describe('cross-tradition consistency', () => {
    it('warns when virya is ushna but thermal_nature is cold', () => {
      const r = first(validateFoods([validFood({ virya: 'ushna', thermal_nature: 'cold' })]));
      const warnings = issuesFor(r, 'warning', 'virya+thermal_nature');
      expect(warnings.length).toBe(1);
      expect(warnings[0]?.message).toContain('ushna');
      expect(warnings[0]?.message).toContain('cold');
    });

    it('warns when virya is sheeta but thermal_nature is hot', () => {
      const r = first(validateFoods([validFood({ virya: 'sheeta', thermal_nature: 'hot' })]));
      expect(issuesFor(r, 'warning', 'virya+thermal_nature').length).toBe(1);
    });

    it('does not warn when virya and thermal_nature are aligned', () => {
      const r = first(validateFoods([validFood({ virya: 'ushna', thermal_nature: 'warm' })]));
      expect(r.issues.filter((i) => i.field === 'virya+thermal_nature')).toHaveLength(0);
    });

    it('does not warn when thermal_nature is neutral (compatible with either virya)', () => {
      const r = first(validateFoods([validFood({ virya: 'ushna', thermal_nature: 'neutral' })]));
      expect(r.issues.filter((i) => i.field === 'virya+thermal_nature')).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Dosha consistency
  // -------------------------------------------------------------------------

  describe('dosha consistency', () => {
    it('warns when ushna virya has pitta_effect of -2', () => {
      const r = first(
        validateFoods([validFood({ virya: 'ushna', pitta_effect: -2, thermal_nature: 'warm' })]),
      );
      expect(issuesFor(r, 'warning', 'dosha_consistency').length).toBe(1);
    });

    it('warns when sheeta virya has pitta_effect of +2', () => {
      const r = first(validateFoods([validFood({ virya: 'sheeta', pitta_effect: 2 })]));
      expect(issuesFor(r, 'warning', 'dosha_consistency').length).toBe(1);
    });

    it('does not warn on mild mismatch (pitta_effect -1 with ushna is fine)', () => {
      const r = first(
        validateFoods([validFood({ virya: 'ushna', pitta_effect: -1, thermal_nature: 'warm' })]),
      );
      expect(r.issues.filter((i) => i.field === 'dosha_consistency')).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Duplicate detection
  // -------------------------------------------------------------------------

  describe('duplicate detection', () => {
    it('errors on duplicate food names', () => {
      const summary = validateFoods([validFood({ name: 'rice' }), validFood({ name: 'rice' })]);
      const r = first(summary);
      const dupeErrors = issuesFor(r, 'error', 'name');
      expect(dupeErrors.length).toBe(1);
      expect(dupeErrors[0]?.message).toContain('duplicate');
      expect(dupeErrors[0]?.message).toContain('2 times');
    });

    it('does not flag unique names', () => {
      const summary = validateFoods([validFood({ name: 'rice' }), validFood({ name: 'wheat' })]);
      for (const r of summary.results) {
        const dupes = r.issues.filter((i) => i.field === 'name');
        expect(dupes).toHaveLength(0);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  describe('edge cases', () => {
    it('handles empty foods array', () => {
      const summary = validateFoods([]);
      expect(summary.total).toBe(0);
      expect(summary.passed).toBe(0);
      expect(summary.failed).toBe(0);
      expect(summary.results).toHaveLength(0);
    });

    it('uses "<unnamed>" for food with no name', () => {
      const food = validFood();
      food.name = undefined as unknown as string;
      const r = first(validateFoods([food]));
      expect(r.name).toBe('<unnamed>');
    });

    it('treats null ritu_fit as error', () => {
      const r = first(validateFoods([validFood({ ritu_fit: null })]));
      expect(issuesFor(r, 'error', 'ritu_fit').length).toBeGreaterThan(0);
    });

    it('treats null element_fit as error', () => {
      const r = first(validateFoods([validFood({ element_fit: null })]));
      expect(issuesFor(r, 'error', 'element_fit').length).toBeGreaterThan(0);
    });
  });
});

// ---------------------------------------------------------------------------
// Herb validation
// ---------------------------------------------------------------------------

describe('validateHerbs', () => {
  it('passes a fully valid herb with no errors', () => {
    const summary = validateHerbs([validHerb()]);
    expect(summary.total).toBe(1);
    expect(summary.passed).toBe(1);
    expect(summary.failed).toBe(0);
    const r = first(summary);
    expect(r.issues.filter((i) => i.severity === 'error')).toHaveLength(0);
  });

  describe('herb-specific checks', () => {
    it('errors on empty herb_actions', () => {
      const r = first(validateHerbs([validHerb({ herb_actions: [] })]));
      expect(issuesFor(r, 'error', 'herb_actions').length).toBeGreaterThan(0);
    });

    it('errors on invalid pregnancy_safety', () => {
      const r = first(validateHerbs([validHerb({ pregnancy_safety: 'maybe' })]));
      expect(issuesFor(r, 'error', 'pregnancy_safety').length).toBeGreaterThan(0);
    });

    it('warns when pregnancy_safety is null', () => {
      const r = first(validateHerbs([validHerb({ pregnancy_safety: null })]));
      expect(issuesFor(r, 'warning', 'pregnancy_safety').length).toBe(1);
    });

    it('errors when is_culinary is not boolean', () => {
      const r = first(validateHerbs([validHerb({ is_culinary: 'yes' })]));
      expect(issuesFor(r, 'error', 'is_culinary').length).toBeGreaterThan(0);
    });

    it('warns on non-canonical herb category', () => {
      const r = first(validateHerbs([validHerb({ category: 'exotic' })]));
      expect(issuesFor(r, 'warning', 'category').length).toBeGreaterThan(0);
    });
  });

  it('errors on duplicate herb names', () => {
    const summary = validateHerbs([
      validHerb({ name: 'ashwagandha' }),
      validHerb({ name: 'ashwagandha' }),
    ]);
    const r = first(summary);
    expect(issuesFor(r, 'error', 'name').length).toBe(1);
  });

  it('handles empty herbs array', () => {
    const summary = validateHerbs([]);
    expect(summary.total).toBe(0);
    expect(summary.passed).toBe(0);
    expect(summary.results).toHaveLength(0);
  });

  it('runs cross-tradition consistency on herbs', () => {
    const r = first(validateHerbs([validHerb({ virya: 'ushna', thermal_nature: 'cold' })]));
    expect(r.issues.filter((i) => i.field === 'virya+thermal_nature').length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Report generation
// ---------------------------------------------------------------------------

describe('generateReport', () => {
  it('aggregates counts from multiple summaries', () => {
    const foodSummary: ValidationSummary = {
      entityType: 'food',
      total: 10,
      passed: 8,
      failed: 2,
      warnings: 3,
      results: [],
    };
    const herbSummary: ValidationSummary = {
      entityType: 'herb',
      total: 5,
      passed: 4,
      failed: 1,
      warnings: 1,
      results: [],
    };

    const report = generateReport([foodSummary, herbSummary], 500);

    expect(report.totalEntities).toBe(15);
    expect(report.totalPassed).toBe(12);
    expect(report.totalFailed).toBe(3);
    expect(report.totalWarnings).toBe(4);
    expect(report.durationMs).toBe(500);
    expect(report.summaries).toHaveLength(2);
  });

  it('includes ISO timestamp in generatedAt', () => {
    const report = generateReport([]);
    // Should be a valid ISO date string
    expect(() => new Date(report.generatedAt).toISOString()).not.toThrow();
  });

  it('handles empty summaries array', () => {
    const report = generateReport([]);
    expect(report.totalEntities).toBe(0);
    expect(report.totalPassed).toBe(0);
    expect(report.totalFailed).toBe(0);
    expect(report.summaries).toHaveLength(0);
  });
});

describe('formatReport', () => {
  it('produces a human-readable string with all sections', () => {
    const foodResult = validateFoods([
      validFood({ name: 'good_rice' }),
      validFood({ name: 'bad_food', rasa: ['invalid'] }),
    ]);
    const report = generateReport([foodResult], 42);
    const text = formatReport(report);

    expect(text).toContain('Seed Data Validation Report');
    expect(text).toContain('42ms');
    expect(text).toContain('Total entities: 2');
    expect(text).toContain('bad_food');
    expect(text).toContain('[ERROR]');
  });

  it('includes warnings section', () => {
    const result = validateFoods([validFood({ virya: 'ushna', thermal_nature: 'cold' })]);
    const report = generateReport([result]);
    const text = formatReport(report);

    expect(text).toContain('[WARN]');
    expect(text).toContain('virya+thermal_nature');
  });
});

// ---------------------------------------------------------------------------
// Integration: combined food + herb validation
// ---------------------------------------------------------------------------

describe('combined validation flow', () => {
  it('validates foods and herbs together into a unified report', () => {
    const foodResult = validateFoods(
      [validFood({ name: 'rice' }), validFood({ name: 'lentils', category: 'legumes' })],
      new Set(['grains', 'legumes']),
    );
    const herbResult = validateHerbs([validHerb({ name: 'ashwagandha' })]);

    const report = generateReport([foodResult, herbResult], 100);

    expect(report.totalEntities).toBe(3);
    expect(report.totalPassed).toBe(3);
    expect(report.totalFailed).toBe(0);
    expect(report.summaries).toHaveLength(2);
    expect(report.summaries[0]?.entityType).toBe('food');
    expect(report.summaries[1]?.entityType).toBe('herb');
  });

  it('correctly tallies failures across entity types', () => {
    const foodResult = validateFoods([
      validFood({ name: 'bad', rasa: [] }), // fails
      validFood({ name: 'good' }), // passes
    ]);
    const herbResult = validateHerbs([
      validHerb({ name: 'bad_herb', herb_actions: [] }), // fails
    ]);

    const report = generateReport([foodResult, herbResult]);

    expect(report.totalEntities).toBe(3);
    expect(report.totalFailed).toBe(2);
    expect(report.totalPassed).toBe(1);
  });
});
