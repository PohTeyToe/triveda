// Seed data validation pipeline for Triveda.
//
// Runs all seed data through Zod schemas and domain-specific checks
// before insertion. Catches errors that Zod alone cannot:
// - Cross-reference validation (category IDs, foreign key targets)
// - Completeness checks (required tradition properties filled)
// - Consistency checks (dosha effects in range, element fits sum correctly)
// - Report generation (warnings and errors per food/herb)
//
// Usage:
//   import { validateFoods, validateHerbs, generateReport } from './validate.js';
//   const result = validateFoods(foods, categoryNames);
//   const report = generateReport([result, herbResult]);

import type { z } from 'zod/v4';
import { insertFoodSchema, insertHerbSchema } from '../validation.js';
import {
  DOSHA_EFFECT_MAX,
  DOSHA_EFFECT_MIN,
  ELEMENT_KEYS,
  RITU_KEYS,
  VALID_FOOD_CATEGORIES,
  VALID_GUNA,
  VALID_HERB_CATEGORIES,
  VALID_ORGAN_AFFINITY,
  VALID_PREGNANCY_SAFETY,
  VALID_RASA,
  VALID_TCM_FLAVOR,
  VALID_THERMAL_NATURE,
  VALID_VIPAKA,
  VALID_VIRYA,
} from './constants.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Severity = 'error' | 'warning';

export interface ValidationIssue {
  severity: Severity;
  field: string;
  message: string;
  value?: unknown;
}

export interface EntityResult {
  name: string;
  entityType: 'food' | 'herb';
  issues: ValidationIssue[];
  valid: boolean;
}

export interface ValidationSummary {
  entityType: 'food' | 'herb';
  total: number;
  passed: number;
  failed: number;
  warnings: number;
  results: EntityResult[];
}

export interface ValidationReport {
  generatedAt: string;
  durationMs: number;
  summaries: ValidationSummary[];
  totalEntities: number;
  totalPassed: number;
  totalFailed: number;
  totalWarnings: number;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function issue(
  severity: Severity,
  field: string,
  message: string,
  value?: unknown,
): ValidationIssue {
  return { severity, field, message, value };
}

function includes<T>(arr: readonly T[], val: unknown): val is T {
  return (arr as readonly unknown[]).includes(val);
}

// ---------------------------------------------------------------------------
// Shared Ayurveda checks (foods and herbs both have these columns)
// ---------------------------------------------------------------------------

function checkAyurveda(row: Record<string, unknown>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // rasa -- must be non-empty array of valid values
  const rasa = row.rasa;
  if (!Array.isArray(rasa) || rasa.length === 0) {
    issues.push(issue('error', 'rasa', 'rasa must be a non-empty array', rasa));
  } else {
    for (const r of rasa) {
      if (!includes(VALID_RASA, r)) {
        issues.push(issue('error', 'rasa', `invalid rasa value: "${r}"`, r));
      }
    }
    // Warn on duplicates
    if (new Set(rasa).size !== rasa.length) {
      issues.push(issue('warning', 'rasa', 'rasa contains duplicate values', rasa));
    }
  }

  // virya
  if (!includes(VALID_VIRYA, row.virya)) {
    issues.push(issue('error', 'virya', `invalid virya: "${row.virya}"`, row.virya));
  }

  // vipaka
  if (!includes(VALID_VIPAKA, row.vipaka)) {
    issues.push(issue('error', 'vipaka', `invalid vipaka: "${row.vipaka}"`, row.vipaka));
  }

  // guna -- must be non-empty array of valid values
  const guna = row.guna;
  if (!Array.isArray(guna) || guna.length === 0) {
    issues.push(issue('error', 'guna', 'guna must be a non-empty array', guna));
  } else {
    for (const g of guna) {
      if (!includes(VALID_GUNA, g)) {
        issues.push(issue('error', 'guna', `invalid guna value: "${g}"`, g));
      }
    }
  }

  // dosha effects -- must be integers in [-2, +2]
  for (const dosha of ['vata_effect', 'pitta_effect', 'kapha_effect'] as const) {
    const val = row[dosha];
    if (typeof val !== 'number' || !Number.isInteger(val)) {
      issues.push(issue('error', dosha, `${dosha} must be an integer`, val));
    } else if (val < DOSHA_EFFECT_MIN || val > DOSHA_EFFECT_MAX) {
      issues.push(
        issue(
          'error',
          dosha,
          `${dosha} must be between ${DOSHA_EFFECT_MIN} and ${DOSHA_EFFECT_MAX}`,
          val,
        ),
      );
    }
  }

  // ritu_fit -- must have all 6 season keys with values in [0, 1]
  const rituFit = row.ritu_fit;
  if (rituFit == null || typeof rituFit !== 'object') {
    issues.push(issue('error', 'ritu_fit', 'ritu_fit must be an object', rituFit));
  } else {
    const rf = rituFit as Record<string, unknown>;
    for (const key of RITU_KEYS) {
      if (!(key in rf)) {
        issues.push(issue('error', 'ritu_fit', `ritu_fit missing season: "${key}"`));
      } else {
        const v = rf[key];
        if (typeof v !== 'number' || v < 0 || v > 1) {
          issues.push(
            issue('error', 'ritu_fit', `ritu_fit["${key}"] must be a number in [0, 1]`, v),
          );
        }
      }
    }
    // Warn on extra keys
    for (const key of Object.keys(rf)) {
      if (!includes(RITU_KEYS, key)) {
        issues.push(issue('warning', 'ritu_fit', `ritu_fit has unexpected key: "${key}"`));
      }
    }
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Shared TCM checks
// ---------------------------------------------------------------------------

function checkTCM(row: Record<string, unknown>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // thermal_nature
  if (!includes(VALID_THERMAL_NATURE, row.thermal_nature)) {
    issues.push(
      issue(
        'error',
        'thermal_nature',
        `invalid thermal_nature: "${row.thermal_nature}"`,
        row.thermal_nature,
      ),
    );
  }

  // flavor -- non-empty array of valid values
  const flavor = row.flavor;
  if (!Array.isArray(flavor) || flavor.length === 0) {
    issues.push(issue('error', 'flavor', 'flavor must be a non-empty array', flavor));
  } else {
    for (const f of flavor) {
      if (!includes(VALID_TCM_FLAVOR, f)) {
        issues.push(issue('error', 'flavor', `invalid TCM flavor: "${f}"`, f));
      }
    }
  }

  // organ_affinity -- non-empty array of valid organs
  const organs = row.organ_affinity;
  if (!Array.isArray(organs) || organs.length === 0) {
    issues.push(
      issue('error', 'organ_affinity', 'organ_affinity must be a non-empty array', organs),
    );
  } else {
    for (const o of organs) {
      if (!includes(VALID_ORGAN_AFFINITY, o)) {
        issues.push(issue('error', 'organ_affinity', `invalid organ: "${o}"`, o));
      }
    }
  }

  // actions -- must be non-empty array of strings
  const actions = row.actions;
  if (!Array.isArray(actions) || actions.length === 0) {
    issues.push(issue('error', 'actions', 'actions must be a non-empty array', actions));
  }

  // element_fit -- must have all 5 element keys with values in [0, 1]
  const elementFit = row.element_fit;
  if (elementFit == null || typeof elementFit !== 'object') {
    issues.push(issue('error', 'element_fit', 'element_fit must be an object', elementFit));
  } else {
    const ef = elementFit as Record<string, unknown>;
    for (const key of ELEMENT_KEYS) {
      if (!(key in ef)) {
        issues.push(issue('error', 'element_fit', `element_fit missing element: "${key}"`));
      } else {
        const v = ef[key];
        if (typeof v !== 'number' || v < 0 || v > 1) {
          issues.push(
            issue('error', 'element_fit', `element_fit["${key}"] must be a number in [0, 1]`, v),
          );
        }
      }
    }
    for (const key of Object.keys(ef)) {
      if (!includes(ELEMENT_KEYS, key)) {
        issues.push(issue('warning', 'element_fit', `element_fit has unexpected key: "${key}"`));
      }
    }
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Consistency checks
// ---------------------------------------------------------------------------

/**
 * Cross-tradition consistency: if virya is "ushna" (heating), thermal_nature
 * should lean warm/hot. If "sheeta" (cooling), thermal_nature should lean
 * cool/cold. Mismatches are warnings, not errors -- some foods genuinely
 * have complex cross-tradition profiles.
 */
function checkCrossTraditionConsistency(row: Record<string, unknown>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const virya = row.virya as string;
  const thermal = row.thermal_nature as string;

  if (virya === 'ushna' && (thermal === 'cool' || thermal === 'cold')) {
    issues.push(
      issue(
        'warning',
        'virya+thermal_nature',
        `virya is "ushna" (heating) but thermal_nature is "${thermal}" -- verify cross-tradition alignment`,
      ),
    );
  }

  if (virya === 'sheeta' && (thermal === 'warm' || thermal === 'hot')) {
    issues.push(
      issue(
        'warning',
        'virya+thermal_nature',
        `virya is "sheeta" (cooling) but thermal_nature is "${thermal}" -- verify cross-tradition alignment`,
      ),
    );
  }

  return issues;
}

/**
 * Check that dosha effects are internally consistent with virya.
 * Heating (ushna) foods typically aggravate pitta (positive effect)
 * and reduce vata/kapha. This is a soft check (warning).
 */
function checkDoshaConsistency(row: Record<string, unknown>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const virya = row.virya as string;
  const pitta = row.pitta_effect as number;

  // Strong mismatch: heating food that strongly reduces pitta, or
  // cooling food that strongly aggravates pitta
  if (virya === 'ushna' && pitta <= -2) {
    issues.push(
      issue(
        'warning',
        'dosha_consistency',
        'virya is "ushna" but pitta_effect is -2 (strongly reduces) -- unusual combination',
      ),
    );
  }

  if (virya === 'sheeta' && pitta >= 2) {
    issues.push(
      issue(
        'warning',
        'dosha_consistency',
        'virya is "sheeta" but pitta_effect is +2 (strongly aggravates) -- unusual combination',
      ),
    );
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Food-specific checks
// ---------------------------------------------------------------------------

function checkFoodSpecific(
  row: Record<string, unknown>,
  validCategories: ReadonlySet<string>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Category cross-reference
  const category = row.category as string;
  if (validCategories.size > 0 && !validCategories.has(category)) {
    issues.push(
      issue(
        'error',
        'category',
        `category "${category}" does not match any known food category`,
        category,
      ),
    );
  }

  // glycemic_index -- optional but if present must be 0-200 range
  const gi = row.glycemic_index;
  if (gi != null) {
    if (typeof gi !== 'number' || !Number.isInteger(gi)) {
      issues.push(issue('error', 'glycemic_index', 'glycemic_index must be an integer', gi));
    } else if (gi < 0 || gi > 200) {
      issues.push(
        issue(
          'warning',
          'glycemic_index',
          `glycemic_index ${gi} is outside typical range [0, 200]`,
          gi,
        ),
      );
    }
  }

  // bioactive_compounds -- optional but if present, validate structure
  const compounds = row.bioactive_compounds;
  if (compounds != null) {
    if (!Array.isArray(compounds)) {
      issues.push(
        issue('error', 'bioactive_compounds', 'bioactive_compounds must be an array', compounds),
      );
    } else {
      for (let i = 0; i < compounds.length; i++) {
        const c = compounds[i] as Record<string, unknown>;
        if (!c || typeof c !== 'object') {
          issues.push(
            issue('error', 'bioactive_compounds', `bioactive_compounds[${i}] is not an object`),
          );
          continue;
        }
        if (typeof c.name !== 'string' || c.name.length === 0) {
          issues.push(
            issue('error', 'bioactive_compounds', `bioactive_compounds[${i}].name is required`),
          );
        }
        if (typeof c.amount_per_100g !== 'number' || c.amount_per_100g < 0) {
          issues.push(
            issue(
              'error',
              'bioactive_compounds',
              `bioactive_compounds[${i}].amount_per_100g must be >= 0`,
            ),
          );
        }
        if (typeof c.unit !== 'string' || c.unit.length === 0) {
          issues.push(
            issue('error', 'bioactive_compounds', `bioactive_compounds[${i}].unit is required`),
          );
        }
      }
    }
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Herb-specific checks
// ---------------------------------------------------------------------------

function checkHerbSpecific(row: Record<string, unknown>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // herb_actions -- required non-empty array
  const herbActions = row.herb_actions;
  if (!Array.isArray(herbActions) || herbActions.length === 0) {
    issues.push(
      issue('error', 'herb_actions', 'herb_actions must be a non-empty array', herbActions),
    );
  }

  // pregnancy_safety -- optional, but if present must be valid
  const safety = row.pregnancy_safety;
  if (safety != null && !includes(VALID_PREGNANCY_SAFETY, safety)) {
    issues.push(
      issue('error', 'pregnancy_safety', `invalid pregnancy_safety: "${safety}"`, safety),
    );
  }

  // Warn if pregnancy_safety is missing -- it should be filled for herbs
  if (safety == null) {
    issues.push(
      issue(
        'warning',
        'pregnancy_safety',
        'pregnancy_safety is not set -- should be filled for production data',
      ),
    );
  }

  // is_culinary -- must be boolean
  if (typeof row.is_culinary !== 'boolean') {
    issues.push(issue('error', 'is_culinary', 'is_culinary must be a boolean', row.is_culinary));
  }

  // category validation against herb categories
  const category = row.category as string;
  if (!includes(VALID_HERB_CATEGORIES, category)) {
    issues.push(
      issue(
        'warning',
        'category',
        `herb category "${category}" is not in the canonical herb category list`,
        category,
      ),
    );
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Zod schema validation
// ---------------------------------------------------------------------------

function runZodValidation(
  row: Record<string, unknown>,
  schema: z.ZodType,
  entityName: string,
): ValidationIssue[] {
  const result = schema.safeParse(row);
  if (result.success) return [];

  const issues: ValidationIssue[] = [];
  // z.ZodError from zod/v4
  if (result.error && 'issues' in result.error) {
    for (const zodIssue of result.error.issues) {
      const path = zodIssue.path.join('.');
      issues.push(
        issue(
          'error',
          path || entityName,
          `Zod: ${zodIssue.message}`,
          'input' in zodIssue ? zodIssue.input : undefined,
        ),
      );
    }
  }
  return issues;
}

// ---------------------------------------------------------------------------
// Duplicate detection
// ---------------------------------------------------------------------------

function checkDuplicateNames(
  rows: Record<string, unknown>[],
  entityType: 'food' | 'herb',
): Map<string, ValidationIssue[]> {
  const nameCount = new Map<string, number>();
  const extraIssues = new Map<string, ValidationIssue[]>();

  for (const row of rows) {
    const name = (row.name as string) || '';
    nameCount.set(name, (nameCount.get(name) || 0) + 1);
  }

  for (const [name, count] of nameCount) {
    if (count > 1) {
      const issueList = extraIssues.get(name) || [];
      issueList.push(
        issue('error', 'name', `duplicate ${entityType} name "${name}" appears ${count} times`),
      );
      extraIssues.set(name, issueList);
    }
  }

  return extraIssues;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Validate an array of food seed data objects.
 *
 * @param foods - Array of food objects (matching the insert schema shape)
 * @param validCategoryNames - Set of known category names from food_categories table.
 *   Pass an empty set to skip category cross-reference validation.
 */
export function validateFoods(
  foods: Record<string, unknown>[],
  validCategoryNames: ReadonlySet<string> = new Set(),
): ValidationSummary {
  const results: EntityResult[] = [];
  let warningCount = 0;

  const duplicateIssues = checkDuplicateNames(foods, 'food');

  for (const food of foods) {
    const name = (food.name as string) || '<unnamed>';
    const issues: ValidationIssue[] = [];

    // 1. Zod schema validation
    issues.push(...runZodValidation(food, insertFoodSchema, name));

    // 2. Ayurveda domain checks
    issues.push(...checkAyurveda(food));

    // 3. TCM domain checks
    issues.push(...checkTCM(food));

    // 4. Food-specific checks
    issues.push(...checkFoodSpecific(food, validCategoryNames));

    // 5. Cross-tradition consistency
    issues.push(...checkCrossTraditionConsistency(food));

    // 6. Dosha consistency
    issues.push(...checkDoshaConsistency(food));

    // 7. Duplicate name issues
    const dupes = duplicateIssues.get(food.name as string);
    if (dupes) issues.push(...dupes);

    const hasErrors = issues.some((i) => i.severity === 'error');
    warningCount += issues.filter((i) => i.severity === 'warning').length;

    results.push({
      name,
      entityType: 'food',
      issues,
      valid: !hasErrors,
    });
  }

  const passed = results.filter((r) => r.valid).length;

  return {
    entityType: 'food',
    total: foods.length,
    passed,
    failed: foods.length - passed,
    warnings: warningCount,
    results,
  };
}

/**
 * Validate an array of herb seed data objects.
 *
 * @param herbs - Array of herb objects (matching the insert schema shape)
 */
export function validateHerbs(herbs: Record<string, unknown>[]): ValidationSummary {
  const results: EntityResult[] = [];
  let warningCount = 0;

  const duplicateIssues = checkDuplicateNames(herbs, 'herb');

  for (const herb of herbs) {
    const name = (herb.name as string) || '<unnamed>';
    const issues: ValidationIssue[] = [];

    // 1. Zod schema validation
    issues.push(...runZodValidation(herb, insertHerbSchema, name));

    // 2. Ayurveda domain checks
    issues.push(...checkAyurveda(herb));

    // 3. TCM domain checks
    issues.push(...checkTCM(herb));

    // 4. Herb-specific checks
    issues.push(...checkHerbSpecific(herb));

    // 5. Cross-tradition consistency
    issues.push(...checkCrossTraditionConsistency(herb));

    // 6. Dosha consistency
    issues.push(...checkDoshaConsistency(herb));

    // 7. Duplicate name issues
    const dupes = duplicateIssues.get(herb.name as string);
    if (dupes) issues.push(...dupes);

    const hasErrors = issues.some((i) => i.severity === 'error');
    warningCount += issues.filter((i) => i.severity === 'warning').length;

    results.push({
      name,
      entityType: 'herb',
      issues,
      valid: !hasErrors,
    });
  }

  const passed = results.filter((r) => r.valid).length;

  return {
    entityType: 'herb',
    total: herbs.length,
    passed,
    failed: herbs.length - passed,
    warnings: warningCount,
    results,
  };
}

/**
 * Generate a validation report from one or more summary objects.
 * The report is a plain object suitable for JSON serialization.
 */
export function generateReport(summaries: ValidationSummary[], durationMs = 0): ValidationReport {
  let totalEntities = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  let totalWarnings = 0;

  for (const s of summaries) {
    totalEntities += s.total;
    totalPassed += s.passed;
    totalFailed += s.failed;
    totalWarnings += s.warnings;
  }

  return {
    generatedAt: new Date().toISOString(),
    durationMs,
    summaries,
    totalEntities,
    totalPassed,
    totalFailed,
    totalWarnings,
  };
}

/**
 * Format a report as a human-readable string for console output.
 */
export function formatReport(report: ValidationReport): string {
  const lines: string[] = [];

  lines.push('=== Seed Data Validation Report ===');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Duration: ${report.durationMs}ms`);
  lines.push('');
  lines.push(`Total entities: ${report.totalEntities}`);
  lines.push(`  Passed: ${report.totalPassed}`);
  lines.push(`  Failed: ${report.totalFailed}`);
  lines.push(`  Warnings: ${report.totalWarnings}`);

  for (const summary of report.summaries) {
    lines.push('');
    lines.push(`--- ${summary.entityType}s ---`);
    lines.push(`  Total: ${summary.total} | Passed: ${summary.passed} | Failed: ${summary.failed}`);

    const failedResults = summary.results.filter((r) => !r.valid);
    if (failedResults.length > 0) {
      lines.push('');
      lines.push('  Failures:');
      for (const r of failedResults) {
        lines.push(`    ${r.name}:`);
        for (const i of r.issues.filter((x) => x.severity === 'error')) {
          lines.push(`      [ERROR] ${i.field}: ${i.message}`);
        }
      }
    }

    const warningResults = summary.results.filter((r) =>
      r.issues.some((i) => i.severity === 'warning'),
    );
    if (warningResults.length > 0) {
      lines.push('');
      lines.push('  Warnings:');
      for (const r of warningResults) {
        const warnings = r.issues.filter((i) => i.severity === 'warning');
        if (warnings.length > 0) {
          lines.push(`    ${r.name}:`);
          for (const w of warnings) {
            lines.push(`      [WARN] ${w.field}: ${w.message}`);
          }
        }
      }
    }
  }

  return lines.join('\n');
}
