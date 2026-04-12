// supplementary-seeders.test.ts -- Unit tests for supplementary seed data.
//
// These tests validate the static seed data (shapes, ranges, consistency)
// without requiring a database connection. The seeder functions themselves
// are integration-tested when run against a real database.

import { describe, expect, it } from 'vitest';

import { ALL_CATEGORIES, SUB_CATEGORIES, TOP_LEVEL_CATEGORIES } from './category-seeder.js';

import { CANONICAL_BIOMARKERS, CANONICAL_BIOMARKER_MAPPINGS } from './biomarker-seeder.js';

import {
  CANONICAL_FOOD_AFFINITIES,
  CANONICAL_HERB_AFFINITIES,
  CUISINE_CODES,
  derivePrevalenceTag,
} from './cuisine-seeder.js';

import { CANONICAL_SOURCE_ASSIGNMENTS, DATA_SOURCE_REGISTRY } from './data-source-seeder.js';

import { CANONICAL_EVIDENCE_CLAIMS, EVIDENCE_LEVELS } from './evidence-seeder.js';

// =========================================================================
// Category Seeder
// =========================================================================

describe('category seed data', () => {
  it('has 10 top-level categories', () => {
    expect(TOP_LEVEL_CATEGORIES).toHaveLength(10);
  });

  it('each top-level category has an icon and display_order', () => {
    for (const cat of TOP_LEVEL_CATEGORIES) {
      expect(cat.icon).toBeTruthy();
      expect(cat.display_order).toBeGreaterThan(0);
    }
  });

  it('top-level display_order values are unique and sequential (1-10)', () => {
    const orders = TOP_LEVEL_CATEGORIES.map((c) => c.display_order).sort((a, b) => a - b);
    expect(orders).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('all display_order values across all categories are unique', () => {
    const orders = ALL_CATEGORIES.map((c) => c.display_order);
    const unique = new Set(orders);
    expect(unique.size).toBe(orders.length);
  });

  it('sub-categories reference valid parent categories', () => {
    const topNames = new Set(TOP_LEVEL_CATEGORIES.map((c) => c.category));
    for (const sub of SUB_CATEGORIES) {
      expect(sub.parent_category).toBeTruthy();
      expect(topNames.has(sub.parent_category as string)).toBe(true);
    }
  });

  it('top-level categories have no parent_category', () => {
    for (const cat of TOP_LEVEL_CATEGORIES) {
      expect(cat.parent_category).toBeUndefined();
    }
  });

  it('each category has a non-empty description', () => {
    for (const cat of ALL_CATEGORIES) {
      expect(cat.description.length).toBeGreaterThan(0);
    }
  });

  it('category names are unique across all categories', () => {
    const names = ALL_CATEGORIES.map((c) => c.category);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });
});

// =========================================================================
// Biomarker Seeder
// =========================================================================

describe('biomarker seed data', () => {
  it('defines 30+ canonical biomarkers', () => {
    expect(CANONICAL_BIOMARKERS.length).toBeGreaterThanOrEqual(30);
  });

  it('each biomarker has a unique key', () => {
    const keys = CANONICAL_BIOMARKERS.map((b) => b.key);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });

  it('each biomarker has a display_name, category, and unit', () => {
    for (const b of CANONICAL_BIOMARKERS) {
      expect(b.display_name).toBeTruthy();
      expect(b.category).toBeTruthy();
      expect(b.unit).toBeTruthy();
    }
  });

  it('glucose has >= 5 supportive food mappings', () => {
    const glucoseSupportive = CANONICAL_BIOMARKER_MAPPINGS.filter(
      (m) => m.biomarker_key === 'glucose' && m.effect_direction === 'supportive',
    );
    expect(glucoseSupportive.length).toBeGreaterThanOrEqual(5);
  });

  it('glucose has >= 3 contraindicated food mappings', () => {
    const glucoseContra = CANONICAL_BIOMARKER_MAPPINGS.filter(
      (m) => m.biomarker_key === 'glucose' && m.effect_direction === 'contraindicated',
    );
    expect(glucoseContra.length).toBeGreaterThanOrEqual(3);
  });

  it('top 10 biomarkers are present in mappings', () => {
    const topKeys = [
      'glucose',
      'hba1c',
      'ldl_cholesterol',
      'hdl_cholesterol',
      'triglycerides',
      'tsh',
      'ferritin',
      'vitamin_d',
      'vitamin_b12',
      'crp',
    ];
    const mappedKeys = new Set(CANONICAL_BIOMARKER_MAPPINGS.map((m) => m.biomarker_key));
    for (const key of topKeys) {
      expect(mappedKeys.has(key)).toBe(true);
    }
  });

  it('effect_magnitude values are in [0.0, 1.0]', () => {
    for (const m of CANONICAL_BIOMARKER_MAPPINGS) {
      expect(m.effect_magnitude).toBeGreaterThanOrEqual(0);
      expect(m.effect_magnitude).toBeLessThanOrEqual(1);
    }
  });

  it('effect_direction is either supportive or contraindicated', () => {
    for (const m of CANONICAL_BIOMARKER_MAPPINGS) {
      expect(['supportive', 'contraindicated']).toContain(m.effect_direction);
    }
  });

  it('citation is non-empty for each mapping', () => {
    for (const m of CANONICAL_BIOMARKER_MAPPINGS) {
      expect(m.citation.length).toBeGreaterThan(0);
    }
  });

  it('mechanism is non-empty for each mapping', () => {
    for (const m of CANONICAL_BIOMARKER_MAPPINGS) {
      expect(m.mechanism.length).toBeGreaterThan(0);
    }
  });

  it('all biomarker keys in mappings exist in CANONICAL_BIOMARKERS', () => {
    const validKeys = new Set(CANONICAL_BIOMARKERS.map((b) => b.key));
    for (const m of CANONICAL_BIOMARKER_MAPPINGS) {
      expect(validKeys.has(m.biomarker_key)).toBe(true);
    }
  });
});

// =========================================================================
// Cuisine Seeder
// =========================================================================

describe('cuisine seed data', () => {
  it('defines 20 cuisine codes', () => {
    expect(CUISINE_CODES).toHaveLength(20);
  });

  it('cuisine codes are unique', () => {
    const unique = new Set(CUISINE_CODES);
    expect(unique.size).toBe(CUISINE_CODES.length);
  });

  it('includes the 8 core cuisines from spec', () => {
    const codes = new Set<string>(CUISINE_CODES);
    for (const core of [
      'indian',
      'chinese',
      'mediterranean',
      'japanese',
      'mexican',
      'caribbean',
      'middle_eastern',
      'west_african',
    ]) {
      expect(codes.has(core)).toBe(true);
    }
  });

  it('food affinity scores are in [0.0, 1.0]', () => {
    for (const entry of CANONICAL_FOOD_AFFINITIES) {
      for (const [, score] of Object.entries(entry.affinities)) {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      }
    }
  });

  it('herb affinity scores are in [0.0, 1.0]', () => {
    for (const entry of CANONICAL_HERB_AFFINITIES) {
      for (const [, score] of Object.entries(entry.affinities)) {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      }
    }
  });

  it('basmati rice has high affinity (>= 0.8) for indian cuisine', () => {
    const rice = CANONICAL_FOOD_AFFINITIES.find((f) => f.food_name === 'basmati rice');
    expect(rice).toBeDefined();
    expect(rice?.affinities.indian).toBeGreaterThanOrEqual(0.8);
  });

  it('herb entries use entity_type herb', () => {
    for (const entry of CANONICAL_HERB_AFFINITIES) {
      expect(entry.entity_type).toBe('herb');
    }
  });

  it('food entries use entity_type food', () => {
    for (const entry of CANONICAL_FOOD_AFFINITIES) {
      expect(entry.entity_type).toBe('food');
    }
  });

  it('has 25+ food affinity entries', () => {
    expect(CANONICAL_FOOD_AFFINITIES.length).toBeGreaterThanOrEqual(25);
  });
});

describe('derivePrevalenceTag', () => {
  it('returns staple for >= 0.8', () => {
    expect(derivePrevalenceTag(0.8)).toBe('staple');
    expect(derivePrevalenceTag(0.95)).toBe('staple');
    expect(derivePrevalenceTag(1.0)).toBe('staple');
  });

  it('returns common for >= 0.5 and < 0.8', () => {
    expect(derivePrevalenceTag(0.5)).toBe('common');
    expect(derivePrevalenceTag(0.7)).toBe('common');
    expect(derivePrevalenceTag(0.79)).toBe('common');
  });

  it('returns occasional for >= 0.2 and < 0.5', () => {
    expect(derivePrevalenceTag(0.2)).toBe('occasional');
    expect(derivePrevalenceTag(0.35)).toBe('occasional');
    expect(derivePrevalenceTag(0.49)).toBe('occasional');
  });

  it('returns rare for < 0.2', () => {
    expect(derivePrevalenceTag(0.0)).toBe('rare');
    expect(derivePrevalenceTag(0.1)).toBe('rare');
    expect(derivePrevalenceTag(0.19)).toBe('rare');
  });
});

// =========================================================================
// Data Source Seeder
// =========================================================================

describe('data source seed data', () => {
  it('defines 10+ data source registry entries', () => {
    expect(DATA_SOURCE_REGISTRY.length).toBeGreaterThanOrEqual(10);
  });

  it('each source has a non-empty source_name and description', () => {
    for (const source of DATA_SOURCE_REGISTRY) {
      expect(source.source_name.length).toBeGreaterThan(0);
      expect(source.description.length).toBeGreaterThan(0);
    }
  });

  it('source names are unique', () => {
    const names = DATA_SOURCE_REGISTRY.map((s) => s.source_name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  it('canonical source assignments reference valid sources', () => {
    const validSources = new Set(DATA_SOURCE_REGISTRY.map((s) => s.source_name));
    for (const assignment of CANONICAL_SOURCE_ASSIGNMENTS) {
      for (const source of assignment.sources) {
        expect(validSources.has(source.source_name)).toBe(true);
      }
    }
  });

  it('confidence scores are in [0.0, 1.0]', () => {
    for (const assignment of CANONICAL_SOURCE_ASSIGNMENTS) {
      for (const source of assignment.sources) {
        expect(source.confidence_score).toBeGreaterThanOrEqual(0);
        expect(source.confidence_score).toBeLessThanOrEqual(1);
      }
    }
  });

  it('entity_type is food or herb', () => {
    for (const assignment of CANONICAL_SOURCE_ASSIGNMENTS) {
      expect(['food', 'herb']).toContain(assignment.entity_type);
    }
  });

  it('properties_covered is non-empty for each source', () => {
    for (const assignment of CANONICAL_SOURCE_ASSIGNMENTS) {
      for (const source of assignment.sources) {
        expect(source.properties_covered.length).toBeGreaterThan(0);
      }
    }
  });

  it('verification_date is a valid ISO date string', () => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    for (const assignment of CANONICAL_SOURCE_ASSIGNMENTS) {
      for (const source of assignment.sources) {
        expect(source.verification_date).toMatch(dateRegex);
      }
    }
  });
});

// =========================================================================
// Evidence Seeder
// =========================================================================

describe('evidence seed data', () => {
  it('defines 4 valid evidence levels', () => {
    expect(EVIDENCE_LEVELS).toHaveLength(4);
    expect(EVIDENCE_LEVELS).toContain('strong');
    expect(EVIDENCE_LEVELS).toContain('moderate');
    expect(EVIDENCE_LEVELS).toContain('emerging');
    expect(EVIDENCE_LEVELS).toContain('traditional_only');
  });

  it('has 20+ food entries with evidence claims', () => {
    expect(CANONICAL_EVIDENCE_CLAIMS.length).toBeGreaterThanOrEqual(20);
  });

  it('each food has at least 2 evidence claims', () => {
    for (const entry of CANONICAL_EVIDENCE_CLAIMS) {
      expect(entry.claims.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('evidence_level is a valid value for all claims', () => {
    const validLevels = new Set(EVIDENCE_LEVELS);
    for (const entry of CANONICAL_EVIDENCE_CLAIMS) {
      for (const claim of entry.claims) {
        expect(validLevels.has(claim.evidence_level)).toBe(true);
      }
    }
  });

  it('source_citation is non-empty for all claims', () => {
    for (const entry of CANONICAL_EVIDENCE_CLAIMS) {
      for (const claim of entry.claims) {
        expect(claim.source_citation.length).toBeGreaterThan(0);
      }
    }
  });

  it('claim text is non-empty for all claims', () => {
    for (const entry of CANONICAL_EVIDENCE_CLAIMS) {
      for (const claim of entry.claims) {
        expect(claim.claim.length).toBeGreaterThan(0);
      }
    }
  });

  it('basmati rice has evidence about glycemic index', () => {
    const rice = CANONICAL_EVIDENCE_CLAIMS.find((e) => e.food_name === 'basmati rice');
    expect(rice).toBeDefined();
    const giClaim = rice?.claims.find((c) => c.claim.toLowerCase().includes('glycemic'));
    expect(giClaim).toBeDefined();
  });

  it('pubmed_id is a string when present', () => {
    for (const entry of CANONICAL_EVIDENCE_CLAIMS) {
      for (const claim of entry.claims) {
        if (claim.pubmed_id !== undefined) {
          expect(typeof claim.pubmed_id).toBe('string');
          expect(claim.pubmed_id.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('food names are lowercase', () => {
    for (const entry of CANONICAL_EVIDENCE_CLAIMS) {
      expect(entry.food_name).toBe(entry.food_name.toLowerCase());
    }
  });
});
