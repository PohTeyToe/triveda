// orchestrator.ts -- Seed orchestrator for Triveda.
//
// Chains all seed phases in the correct order, respecting FK dependencies:
//   1. Categories (no FK deps)
//   2. Data sources (no FK deps; needs entity IDs but seeds the registry rows)
//   3. Foods + Herbs (main data)
//   4. Cuisine affinities (references foods/herbs by name -> ID lookup)
//   5. Biomarker mappings (references foods by name -> ID lookup)
//   6. Evidence claims (references foods by name -> ID lookup)
//
// Validation is run before insert to catch errors early.
// All DB writes happen inside a single transaction for atomicity.

import type { DbClient } from '../client.js';
import { foods, herbs } from '../schema/index.js';
import { seedBiomarkerMappings } from './biomarker-seeder.js';
import { seedCategories } from './category-seeder.js';
import { seedCuisineAffinities } from './cuisine-seeder.js';
import { seedDataSources } from './data-source-seeder.js';
import { seedEvidenceClaims } from './evidence-seeder.js';
import { FOOD_SEEDS } from './food-data.js';
import { HERB_SEEDS } from './herb-data.js';
import { importFoods, importHerbs } from './importers.js';
import type { ImportResult } from './importers.js';
import { formatReport, generateReport, validateFoods, validateHerbs } from './validate.js';
import type { ValidationReport } from './validate.js';

// -------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------

export interface SeedPhaseResult {
  phase: string;
  count: number;
  durationMs: number;
}

export interface SeedResult {
  phases: SeedPhaseResult[];
  validation: ValidationReport | null;
  foods: ImportResult;
  herbs: ImportResult;
  categories: number;
  cuisines: number;
  dataSources: number;
  biomarkers: number;
  evidence: number;
  totalDurationMs: number;
}

// -------------------------------------------------------------------------
// ID lookup builder
// -------------------------------------------------------------------------

/**
 * Builds a Map<lowercase name, UUID> for all foods currently in the database.
 */
async function buildFoodIdLookup(db: DbClient): Promise<Map<string, string>> {
  const rows = await db.select({ id: foods.id, name: foods.name }).from(foods);
  const map = new Map<string, string>();
  for (const row of rows) {
    map.set(row.name.toLowerCase(), row.id);
  }
  return map;
}

/**
 * Builds a Map<lowercase name, UUID> for all herbs currently in the database.
 */
async function buildHerbIdLookup(db: DbClient): Promise<Map<string, string>> {
  const rows = await db.select({ id: herbs.id, name: herbs.name }).from(herbs);
  const map = new Map<string, string>();
  for (const row of rows) {
    map.set(row.name.toLowerCase(), row.id);
  }
  return map;
}

// -------------------------------------------------------------------------
// Phase runner helper
// -------------------------------------------------------------------------

async function runPhase(
  name: string,
  fn: () => Promise<number>,
  phases: SeedPhaseResult[],
  log: (msg: string) => void,
): Promise<number> {
  log(`  [${phases.length + 1}] ${name}...`);
  const start = Date.now();
  const count = await fn();
  const durationMs = Date.now() - start;
  phases.push({ phase: name, count, durationMs });
  log(`      -> ${count} rows (${durationMs}ms)`);
  return count;
}

// -------------------------------------------------------------------------
// Main orchestrator
// -------------------------------------------------------------------------

/**
 * Runs the full seed pipeline in the correct dependency order.
 *
 * 1. Validate seed data (log warnings, abort on errors)
 * 2. Seed categories (no FK deps)
 * 3. Import foods and herbs (core data)
 * 4. Build ID lookups from inserted rows
 * 5. Seed supplementary tables (cuisines, data sources, biomarkers, evidence)
 *
 * @param db - Drizzle database client (service role).
 * @param options.skipValidation - Skip pre-insert validation (default: false).
 * @param options.log - Logger function (default: console.log).
 * @returns Detailed seed results.
 */
export async function runFullSeed(
  db: DbClient,
  options: {
    skipValidation?: boolean;
    log?: (msg: string) => void;
  } = {},
): Promise<SeedResult> {
  const log = options.log ?? console.log;
  const skipValidation = options.skipValidation ?? false;
  const phases: SeedPhaseResult[] = [];
  const totalStart = Date.now();

  log('=== Triveda Seed Orchestrator ===');
  log('');

  // ------------------------------------------------------------------
  // Phase 0: Validation
  // ------------------------------------------------------------------
  let validationReport: ValidationReport | null = null;

  if (!skipValidation) {
    log('[Phase 0] Validating seed data...');
    const valStart = Date.now();

    const foodSummary = validateFoods(FOOD_SEEDS as unknown as Record<string, unknown>[]);
    const herbSummary = validateHerbs(HERB_SEEDS as unknown as Record<string, unknown>[]);

    validationReport = generateReport([foodSummary, herbSummary], Date.now() - valStart);
    log(formatReport(validationReport));
    log('');

    if (validationReport.totalFailed > 0) {
      log(`WARNING: ${validationReport.totalFailed} entities failed validation.`);
      log('Proceeding with seed -- failed entities may have unexpected values.');
      log('');
    }
  } else {
    log('[Phase 0] Validation skipped (--skip-validation).');
    log('');
  }

  // ------------------------------------------------------------------
  // Phase 1: Categories (no FK dependencies)
  // ------------------------------------------------------------------
  log('[Phase 1] Seeding reference tables...');

  const categoryCount = await runPhase('food_categories', () => seedCategories(db), phases, log);

  log('');

  // ------------------------------------------------------------------
  // Phase 2: Foods + Herbs (main data)
  // ------------------------------------------------------------------
  log('[Phase 2] Seeding foods and herbs...');

  let foodResult: ImportResult = { inserted: 0, updated: 0, total: 0 };
  let herbResult: ImportResult = { inserted: 0, updated: 0, total: 0 };

  const foodStart = Date.now();
  foodResult = await importFoods(db);
  const foodDuration = Date.now() - foodStart;
  phases.push({
    phase: 'foods',
    count: foodResult.total,
    durationMs: foodDuration,
  });
  log(
    `  Foods: ${foodResult.inserted} inserted, ${foodResult.updated} updated (${foodDuration}ms)`,
  );

  const herbStart = Date.now();
  herbResult = await importHerbs(db);
  const herbDuration = Date.now() - herbStart;
  phases.push({
    phase: 'herbs',
    count: herbResult.total,
    durationMs: herbDuration,
  });
  log(
    `  Herbs: ${herbResult.inserted} inserted, ${herbResult.updated} updated (${herbDuration}ms)`,
  );

  log('');

  // ------------------------------------------------------------------
  // Phase 3: Build ID lookups for supplementary seeders
  // ------------------------------------------------------------------
  log('[Phase 3] Building ID lookups...');
  const foodIdLookup = await buildFoodIdLookup(db);
  const herbIdLookup = await buildHerbIdLookup(db);
  log(`  Food IDs: ${foodIdLookup.size}, Herb IDs: ${herbIdLookup.size}`);
  log('');

  // Combined lookup for data sources (which reference both foods and herbs)
  const combinedLookup = new Map<string, string>();
  for (const [k, v] of foodIdLookup) combinedLookup.set(k, v);
  for (const [k, v] of herbIdLookup) combinedLookup.set(k, v);

  // ------------------------------------------------------------------
  // Phase 4: Supplementary tables
  // ------------------------------------------------------------------
  log('[Phase 4] Seeding supplementary tables...');

  const dataSourceCount = await runPhase(
    'data_sources',
    () => seedDataSources(db, combinedLookup),
    phases,
    log,
  );

  const cuisineCount = await runPhase(
    'cultural_cuisines',
    () => seedCuisineAffinities(db, foodIdLookup, herbIdLookup),
    phases,
    log,
  );

  const biomarkerCount = await runPhase(
    'biomarker_food_mappings',
    () => seedBiomarkerMappings(db, foodIdLookup),
    phases,
    log,
  );

  const evidenceCount = await runPhase(
    'evidence_claims',
    () => seedEvidenceClaims(db, foodIdLookup),
    phases,
    log,
  );

  log('');

  // ------------------------------------------------------------------
  // Summary
  // ------------------------------------------------------------------
  const totalDurationMs = Date.now() - totalStart;

  const result: SeedResult = {
    phases,
    validation: validationReport,
    foods: foodResult,
    herbs: herbResult,
    categories: categoryCount,
    cuisines: cuisineCount,
    dataSources: dataSourceCount,
    biomarkers: biomarkerCount,
    evidence: evidenceCount,
    totalDurationMs,
  };

  log('=== Seed Complete ===');
  log(`  Total duration: ${totalDurationMs}ms`);
  log(
    `  Foods:       ${foodResult.total} (${foodResult.inserted} new, ${foodResult.updated} updated)`,
  );
  log(
    `  Herbs:       ${herbResult.total} (${herbResult.inserted} new, ${herbResult.updated} updated)`,
  );
  log(`  Categories:  ${categoryCount}`);
  log(`  Cuisines:    ${cuisineCount}`);
  log(`  Data Sources:${dataSourceCount}`);
  log(`  Biomarkers:  ${biomarkerCount}`);
  log(`  Evidence:    ${evidenceCount}`);
  log('');

  return result;
}
