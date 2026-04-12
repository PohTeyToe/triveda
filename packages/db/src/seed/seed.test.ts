// seed.test.ts -- Tests for seed data integrity and importer functions.
//
// Tests are split into three groups:
// 1. Food seed data validation (shape, uniqueness, required fields)
// 2. Herb seed data validation (shape, uniqueness, required fields)
// 3. Importer function logic (mocked DB, upsert behavior, batching)

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FOOD_SEEDS } from './food-data.js';
import { HERB_SEEDS } from './herb-data.js';

// =========================================================================
// Food seed data validation
// =========================================================================
describe('FOOD_SEEDS data', () => {
  it('contains at least 50 foods', () => {
    expect(FOOD_SEEDS.length).toBeGreaterThanOrEqual(50);
  });

  it('has unique names across all seeds', () => {
    const names = FOOD_SEEDS.map((f) => f.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });

  it('every food has required string fields', () => {
    for (const food of FOOD_SEEDS) {
      expect(food.name).toBeTruthy();
      expect(food.category).toBeTruthy();
      expect(food.virya).toBeTruthy();
      expect(food.vipaka).toBeTruthy();
      expect(food.thermal_nature).toBeTruthy();
      expect(food.seed_source).toBe('canonical');
      expect(food.validation_status).toBe('validated');
    }
  });

  it('every food has non-empty rasa, guna, flavor, organ_affinity, and actions arrays', () => {
    for (const food of FOOD_SEEDS) {
      expect(food.rasa.length).toBeGreaterThan(0);
      expect(food.guna.length).toBeGreaterThan(0);
      expect(food.flavor.length).toBeGreaterThan(0);
      expect(food.organ_affinity.length).toBeGreaterThan(0);
      expect(food.actions.length).toBeGreaterThan(0);
    }
  });

  it('dosha effects are within -2 to +2 range', () => {
    for (const food of FOOD_SEEDS) {
      expect(food.vata_effect).toBeGreaterThanOrEqual(-2);
      expect(food.vata_effect).toBeLessThanOrEqual(2);
      expect(food.pitta_effect).toBeGreaterThanOrEqual(-2);
      expect(food.pitta_effect).toBeLessThanOrEqual(2);
      expect(food.kapha_effect).toBeGreaterThanOrEqual(-2);
      expect(food.kapha_effect).toBeLessThanOrEqual(2);
    }
  });

  it('ritu_fit has all six seasons with values between 0 and 1', () => {
    const seasons = ['shishira', 'vasanta', 'grishma', 'varsha', 'sharad', 'hemanta'] as const;
    for (const food of FOOD_SEEDS) {
      for (const season of seasons) {
        const val = food.ritu_fit[season];
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(1);
      }
    }
  });

  it('element_fit has all five elements with values between 0 and 1', () => {
    const elements = ['wood', 'fire', 'earth', 'metal', 'water'] as const;
    for (const food of FOOD_SEEDS) {
      for (const element of elements) {
        const val = food.element_fit[element];
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(1);
      }
    }
  });

  it('glycemic_index is null or between 0 and 100', () => {
    for (const food of FOOD_SEEDS) {
      if (food.glycemic_index != null) {
        expect(food.glycemic_index).toBeGreaterThanOrEqual(0);
        expect(food.glycemic_index).toBeLessThanOrEqual(100);
      }
    }
  });

  it('bioactive_compounds entries have name, amount_per_100g, and unit', () => {
    for (const food of FOOD_SEEDS) {
      if (food.bioactive_compounds) {
        for (const compound of food.bioactive_compounds) {
          expect(compound.name).toBeTruthy();
          expect(typeof compound.amount_per_100g).toBe('number');
          expect(compound.unit).toBeTruthy();
        }
      }
    }
  });

  it('covers diverse categories', () => {
    const categories = new Set(FOOD_SEEDS.map((f) => f.category));
    // We expect grains, legumes, vegetables, fruits, dairy, protein, spices,
    // nuts_seeds, oils, sweeteners, beverages, condiments
    expect(categories.size).toBeGreaterThanOrEqual(8);
  });

  it('includes Indian, Chinese, and Western foods', () => {
    const hasIndian = FOOD_SEEDS.some((f) => f.name === 'ghee' || f.name === 'paneer');
    const hasChinese = FOOD_SEEDS.some((f) => f.name === 'tofu' || f.name === 'bok choy');
    const hasWestern = FOOD_SEEDS.some((f) => f.name === 'broccoli' || f.name === 'oats');
    const hasMediterranean = FOOD_SEEDS.some((f) => f.name === 'olive oil' || f.name === 'lemon');
    expect(hasIndian).toBe(true);
    expect(hasChinese).toBe(true);
    expect(hasWestern).toBe(true);
    expect(hasMediterranean).toBe(true);
  });
});

// =========================================================================
// Herb seed data validation
// =========================================================================
describe('HERB_SEEDS data', () => {
  it('contains at least 15 herbs', () => {
    expect(HERB_SEEDS.length).toBeGreaterThanOrEqual(15);
  });

  it('has unique names across all seeds', () => {
    const names = HERB_SEEDS.map((h) => h.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });

  it('every herb has required string fields', () => {
    for (const herb of HERB_SEEDS) {
      expect(herb.name).toBeTruthy();
      expect(herb.category).toBeTruthy();
      expect(herb.virya).toBeTruthy();
      expect(herb.vipaka).toBeTruthy();
      expect(herb.thermal_nature).toBeTruthy();
      expect(herb.seed_source).toBe('canonical');
      expect(herb.validation_status).toBe('validated');
    }
  });

  it('every herb has non-empty herb_actions array', () => {
    for (const herb of HERB_SEEDS) {
      expect(herb.herb_actions.length).toBeGreaterThan(0);
    }
  });

  it('dosha effects are within -2 to +2 range', () => {
    for (const herb of HERB_SEEDS) {
      expect(herb.vata_effect).toBeGreaterThanOrEqual(-2);
      expect(herb.vata_effect).toBeLessThanOrEqual(2);
      expect(herb.pitta_effect).toBeGreaterThanOrEqual(-2);
      expect(herb.pitta_effect).toBeLessThanOrEqual(2);
      expect(herb.kapha_effect).toBeGreaterThanOrEqual(-2);
      expect(herb.kapha_effect).toBeLessThanOrEqual(2);
    }
  });

  it('pregnancy_safety is a valid value or null', () => {
    const validValues = ['safe', 'caution', 'contraindicated', 'unknown', null, undefined];
    for (const herb of HERB_SEEDS) {
      expect(validValues).toContain(herb.pregnancy_safety ?? null);
    }
  });

  it('is_culinary is a boolean', () => {
    for (const herb of HERB_SEEDS) {
      expect(typeof herb.is_culinary).toBe('boolean');
    }
  });

  it('culinary herbs include tulsi and trikatu', () => {
    const culinary = HERB_SEEDS.filter((h) => h.is_culinary);
    const names = culinary.map((h) => h.name);
    expect(names).toContain('tulsi');
    expect(names).toContain('trikatu');
  });

  it('non-culinary herbs include ashwagandha and neem', () => {
    const nonCulinary = HERB_SEEDS.filter((h) => !h.is_culinary);
    const names = nonCulinary.map((h) => h.name);
    expect(names).toContain('ashwagandha');
    expect(names).toContain('neem');
  });

  it('includes both Ayurvedic and TCM herbs', () => {
    const hasAyurvedic = HERB_SEEDS.some((h) => h.name === 'ashwagandha' || h.name === 'brahmi');
    const hasTCM = HERB_SEEDS.some((h) => h.name === 'astragalus' || h.name === 'reishi');
    expect(hasAyurvedic).toBe(true);
    expect(hasTCM).toBe(true);
  });

  it('ritu_fit has all six seasons with values between 0 and 1', () => {
    const seasons = ['shishira', 'vasanta', 'grishma', 'varsha', 'sharad', 'hemanta'] as const;
    for (const herb of HERB_SEEDS) {
      for (const season of seasons) {
        const val = herb.ritu_fit[season];
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(1);
      }
    }
  });

  it('element_fit has all five elements with values between 0 and 1', () => {
    const elements = ['wood', 'fire', 'earth', 'metal', 'water'] as const;
    for (const herb of HERB_SEEDS) {
      for (const element of elements) {
        const val = herb.element_fit[element];
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(1);
      }
    }
  });
});

// =========================================================================
// Importer function tests (mocked DB)
// =========================================================================
describe('importers', () => {
  // We dynamically import the importer module after setting up mocks.
  // The importers depend on drizzle's insert().values().onConflictDoUpdate()
  // chain, so we mock the DbClient.

  const mockReturning = vi.fn<(...args: never[]) => unknown>();
  const mockOnConflictDoUpdate = vi.fn(() => ({ returning: mockReturning }));
  const mockValues = vi.fn(() => ({ onConflictDoUpdate: mockOnConflictDoUpdate }));
  const mockInsert = vi.fn(() => ({ values: mockValues }));

  const mockDb = { insert: mockInsert } as unknown as import('../client.js').DbClient;

  /** Get the last batch arg passed to mockValues and return its length. */
  function lastBatchLength(): number {
    const calls = mockValues.mock.calls as unknown[][];
    const last = calls[calls.length - 1];
    const arg = last?.[0];
    return Array.isArray(arg) ? arg.length : 1;
  }

  /** Build a mock row set of a given length simulating new inserts. */
  function mockRowsAsInserts(timestamp: Date, count: number) {
    return Array.from({ length: count }, () => ({
      id: crypto.randomUUID(),
      createdAt: timestamp,
      updatedAt: timestamp,
    }));
  }

  /** Configure mockReturning to auto-size results based on the latest batch. */
  function setupAutoSizedReturning(timestamp: Date) {
    mockReturning.mockImplementation(() =>
      Promise.resolve(mockRowsAsInserts(timestamp, lastBatchLength())),
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
    const now = new Date();
    mockReturning.mockResolvedValue(mockRowsAsInserts(now, 25));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('importFoods calls db.insert with foods table', async () => {
    const { importFoods } = await import('./importers.js');
    setupAutoSizedReturning(new Date());

    const result = await importFoods(mockDb);
    expect(result.total).toBe(FOOD_SEEDS.length);
    expect(result.inserted + result.updated).toBe(FOOD_SEEDS.length);
    expect(mockInsert).toHaveBeenCalled();
  });

  it('importHerbs calls db.insert with herbs table', async () => {
    const { importHerbs } = await import('./importers.js');
    setupAutoSizedReturning(new Date());

    const result = await importHerbs(mockDb);
    expect(result.total).toBe(HERB_SEEDS.length);
    expect(result.inserted + result.updated).toBe(HERB_SEEDS.length);
    expect(mockInsert).toHaveBeenCalled();
  });

  it('importFoods uses onConflictDoUpdate for upsert', async () => {
    const { importFoods } = await import('./importers.js');
    setupAutoSizedReturning(new Date());

    await importFoods(mockDb);
    expect(mockOnConflictDoUpdate).toHaveBeenCalled();
    const calls = mockOnConflictDoUpdate.mock.calls as unknown[][];
    const callArg = calls[0]?.[0] as Record<string, unknown> | undefined;
    expect(callArg).toHaveProperty('target');
    expect(callArg).toHaveProperty('set');
  });

  it('importFoods respects custom batchSize', async () => {
    const { importFoods } = await import('./importers.js');
    setupAutoSizedReturning(new Date());

    await importFoods(mockDb, 10);
    expect(mockInsert).toHaveBeenCalledTimes(Math.ceil(FOOD_SEEDS.length / 10));
  });

  it('distinguishes inserts from updates via timestamp comparison', async () => {
    const { importFoods } = await import('./importers.js');
    const created = new Date('2025-01-01T00:00:00Z');
    const updated = new Date('2025-06-01T00:00:00Z');

    mockReturning.mockImplementation(() => {
      const batchLen = lastBatchLength();
      return Promise.resolve(
        Array.from({ length: batchLen }, (_, i) => ({
          id: crypto.randomUUID(),
          // First item in each batch is an "update," rest are "inserts"
          createdAt: i === 0 ? created : updated,
          updatedAt: updated,
        })),
      );
    });

    const result = await importFoods(mockDb);
    expect(result.updated).toBeGreaterThan(0);
    expect(result.inserted).toBeGreaterThan(0);
    expect(result.inserted + result.updated).toBe(result.total);
  });

  it('runAllSeeds runs both importers and returns combined results', async () => {
    const { runAllSeeds } = await import('./importers.js');
    setupAutoSizedReturning(new Date());

    const result = await runAllSeeds(mockDb);
    expect(result.foods.total).toBe(FOOD_SEEDS.length);
    expect(result.herbs.total).toBe(HERB_SEEDS.length);
  });
});
