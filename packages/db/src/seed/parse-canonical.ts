// Deterministic markdown parser for the food-database-v1.md canonical food file.
// No LLM calls -- pure string processing. Transforms structured markdown into
// NewFood-compatible objects that can be inserted directly into the foods table.

import { readFileSync } from 'node:fs';
import type { ElementFit, RituFit } from '../schema/shared-columns.js';
import type { NewFood } from '../types.js';
import {
  DOSHA_SHORTHAND,
  ELEMENT_KEYS,
  GUNA_MAP,
  ORGAN_TO_ELEMENT,
  RASA_MAP,
  RITU_ADJACENCY,
  RITU_KEYS,
  type RituName,
  SEASON_TO_RITU,
  SECTION_TO_CATEGORY,
  VIRYA_MAP,
} from './constants.js';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Parsed evidence claim from the Naturopathy line. */
export interface ParsedEvidenceClaim {
  claim: string;
  evidence_level: string;
  source_citation: string;
}

/** A canonical food with extra parsed fields beyond what NewFood needs. */
export interface CanonicalFood extends NewFood {
  convergence_notes: string | null;
  best_for: string | null;
  evidence_claims_raw: ParsedEvidenceClaim[];
  thermal_contradiction: boolean;
}

// ---------------------------------------------------------------------------
// Internal parsing helpers
// ---------------------------------------------------------------------------

/** Lowercase, trim, and collapse whitespace. */
function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Split on ` | ` or `|`, trimming each segment. */
function splitBar(line: string): string[] {
  return line
    .split(/\s*\|\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Split on commas, trimming each segment. */
function splitComma(s: string): string[] {
  return s
    .split(/\s*,\s*/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/**
 * Extract the value after a "Key: Value" pattern.
 * Returns empty string if key is not found.
 */
function extractField(segment: string, key: string): string {
  const pattern = new RegExp(`${key}:\\s*(.+)`, 'i');
  const match = segment.match(pattern);
  if (!match) return '';
  return (match[1] ?? '').trim();
}

/**
 * Parse rasa from a string like "sweet, astringent" or "madhura".
 * Maps English to Sanskrit, passes through already-Sanskrit values.
 */
export function parseRasa(raw: string): string[] {
  const terms = splitComma(raw);
  return terms.map((t) => {
    const lower = norm(t);
    return RASA_MAP[lower] ?? lower;
  });
}

/**
 * Parse virya from a string like "Heating" or "heating (cooked), cooling (dry)".
 * For conditional virya, takes the first value (primary/cooked).
 */
export function parseVirya(raw: string): string {
  const lower = norm(raw);

  // Handle conditional: "heating (cooked), cooling (dry)" -- take first
  const conditionalMatch = lower.match(/^(\w+)\s*\(/);
  if (conditionalMatch) {
    const term = conditionalMatch[1] ?? '';
    return VIRYA_MAP[term] ?? term;
  }

  // Handle "neutral to warm" -- take first word
  if (lower.includes(' to ')) {
    const parts = lower.split(/\s+to\s+/);
    const first = parts[0] ?? lower;
    return VIRYA_MAP[first] ?? first;
  }

  return VIRYA_MAP[lower] ?? lower;
}

/**
 * Parse vipaka from a string. Maps English to Sanskrit.
 */
export function parseVipaka(raw: string): string {
  const lower = norm(raw);
  return RASA_MAP[lower] ?? lower;
}

/**
 * Parse guna from a comma-separated string.
 * Maps English to Sanskrit, passes through already-Sanskrit values.
 */
export function parseGuna(raw: string): string[] {
  const terms = splitComma(raw);
  return terms.map((t) => {
    const lower = norm(t);
    return GUNA_MAP[lower] ?? lower;
  });
}

/**
 * Parse dosha effects from a string like "V- P- K=" or "V+ (raw) V- (cooked)".
 *
 * Returns { vata_effect, pitta_effect, kapha_effect } as numbers.
 * For conditional effects (e.g., "V+ (raw) V- (cooked)"), takes the cooked value.
 */
export function parseDoshaEffects(raw: string): {
  vata_effect: number;
  pitta_effect: number;
  kapha_effect: number;
} {
  const result = { vata_effect: 0, pitta_effect: 0, kapha_effect: 0 };
  const text = raw.replace(/Dosha:\s*/i, '');

  // Extract all dosha tokens with optional condition annotations.
  const tokens = text.matchAll(/([VPK])([+\-=]{1,2})\s*(?:\((\w+)\))?/gi);
  // Group by dosha letter. If there are multiple for the same letter with
  // different conditions, prefer the (cooked) annotation; otherwise take the
  // last one listed.
  const parsed: Record<string, { effect: number; condition: string | null }[]> = {
    V: [],
    P: [],
    K: [],
  };

  for (const m of tokens) {
    const letter = (m[1] ?? '').toUpperCase();
    const symbol = m[2] ?? '';
    const condition = m[3] ? norm(m[3]) : null;
    const value = DOSHA_SHORTHAND[symbol] ?? 0;
    const bucket = parsed[letter];
    if (bucket) {
      bucket.push({ effect: value, condition });
    }
  }

  for (const [letter, entries] of Object.entries(parsed)) {
    let finalEffect = 0;
    if (entries.length === 1) {
      const single = entries[0];
      finalEffect = single ? single.effect : 0;
    } else if (entries.length > 1) {
      // Prefer "cooked" value if present; otherwise take last entry
      const cooked = entries.find((e) => e.condition === 'cooked');
      const last = entries[entries.length - 1];
      finalEffect = cooked ? cooked.effect : last ? last.effect : 0;
    }

    if (letter === 'V') result.vata_effect = finalEffect;
    if (letter === 'P') result.pitta_effect = finalEffect;
    if (letter === 'K') result.kapha_effect = finalEffect;
  }

  return result;
}

/**
 * Parse thermal nature from a string like "Warm", "neutral to warm", "Hot".
 * For "X to Y" patterns, takes the first (primary) value.
 */
export function parseThermalNature(raw: string): string {
  const lower = norm(raw);

  // Handle "neutral to warm" -- take first
  if (lower.includes(' to ')) {
    const parts = lower.split(/\s+to\s+/);
    return parts[0] ?? lower;
  }

  return lower;
}

/**
 * Parse organ affinities, normalizing to snake_case.
 * e.g., "Spleen, Stomach, Large Intestine" -> ["spleen", "stomach", "large_intestine"]
 */
export function parseOrganAffinity(raw: string): string[] {
  return splitComma(raw).map((o) => norm(o).replace(/\s+/g, '_'));
}

/**
 * Parse TCM actions, normalizing to snake_case.
 * e.g., "tonify Qi, clear heat" -> ["tonify_qi", "clear_heat"]
 */
export function parseActions(raw: string): string[] {
  return splitComma(raw).map((a) => norm(a).replace(/\s+/g, '_'));
}

/**
 * Parse evidence claims from the Naturopathy line.
 * Input format: "claim1 (level); claim2 (level) [PubMed:12345]"
 * or separated by ` | `.
 */
export function parseEvidenceClaims(raw: string): ParsedEvidenceClaim[] {
  if (!raw.trim()) return [];

  // Split by semicolon or pipe
  const parts = raw.split(/\s*[;|]\s*/).filter(Boolean);
  const claims: ParsedEvidenceClaim[] = [];

  for (const part of parts) {
    // Extract PubMed citation if present (do this first so level regex works)
    const pubmedMatch = part.match(/\[PubMed:\s*(\d+)\]/i);
    // Strip PubMed marker before looking for evidence level
    const withoutPubmed = pubmedMatch ? part.replace(/\s*\[PubMed:\s*\d+\]/i, '') : part;

    // Extract evidence level in parentheses, e.g., "(strong)"
    const levelMatch = withoutPubmed.match(/\(([^)]+)\)\s*$/);

    const evidence_level = levelMatch ? norm(levelMatch[1] ?? '') : 'unspecified';
    const source_citation = pubmedMatch
      ? `PubMed:${pubmedMatch[1] ?? ''}`
      : 'traditional_knowledge';

    // The claim text is everything before the level/citation markers
    let claim = withoutPubmed;
    if (levelMatch) claim = claim.replace(/\(([^)]+)\)\s*$/, '');
    claim = claim.trim();

    if (claim) {
      claims.push({ claim, evidence_level, source_citation });
    }
  }

  return claims;
}

// ---------------------------------------------------------------------------
// Ritu fit and element fit derivation
// ---------------------------------------------------------------------------

/**
 * Derive ritu_fit scores from the "Best for" line.
 * Seasons explicitly mentioned -> 0.85.
 * Adjacent seasons -> 0.60.
 * Opposite seasons -> 0.35.
 * "All seasons" -> 0.75 for all.
 */
export function deriveRituFit(bestFor: string | null): RituFit {
  const base: RituFit = {
    shishira: 0.35,
    vasanta: 0.35,
    grishma: 0.35,
    varsha: 0.35,
    sharad: 0.35,
    hemanta: 0.35,
  };

  if (!bestFor) return base;

  const lower = norm(bestFor);

  // "all seasons" or "year-round"
  if (
    lower.includes('all season') ||
    lower.includes('year-round') ||
    lower.includes('year round')
  ) {
    return {
      shishira: 0.75,
      vasanta: 0.75,
      grishma: 0.75,
      varsha: 0.75,
      sharad: 0.75,
      hemanta: 0.75,
    };
  }

  // Find explicitly mentioned seasons
  const matchedRitus = new Set<RituName>();
  for (const [seasonTerm, ritu] of Object.entries(SEASON_TO_RITU)) {
    if (lower.includes(seasonTerm)) {
      matchedRitus.add(ritu);
    }
  }

  if (matchedRitus.size === 0) return base;

  // Set matched seasons to 0.85
  for (const ritu of matchedRitus) {
    base[ritu] = 0.85;
  }

  // Set adjacent seasons to 0.60 (unless already primary)
  for (const ritu of matchedRitus) {
    const neighbors = RITU_ADJACENCY[ritu];
    for (const neighbor of neighbors) {
      if (!matchedRitus.has(neighbor) && base[neighbor] < 0.6) {
        base[neighbor] = 0.6;
      }
    }
  }

  return base;
}

/**
 * Derive element_fit scores from TCM organ affinities.
 * Organs mapped to their element -> 0.85.
 * Non-primary elements -> 0.40.
 */
export function deriveElementFit(organAffinities: string[]): ElementFit {
  const base: ElementFit = {
    wood: 0.4,
    fire: 0.4,
    earth: 0.4,
    metal: 0.4,
    water: 0.4,
  };

  for (const organ of organAffinities) {
    const element = ORGAN_TO_ELEMENT[organ];
    if (element) {
      base[element] = 0.85;
    }
  }

  return base;
}

/**
 * Detect thermal contradiction between Ayurvedic virya and TCM thermal nature.
 * e.g., Ayurveda says "heating" but TCM says "cool".
 */
export function detectThermalContradiction(virya: string, thermalNature: string): boolean {
  const ayurvedaHot = virya === 'ushna';
  const tcmCold = thermalNature === 'cool' || thermalNature === 'cold';
  const ayurvedaCold = virya === 'sheeta';
  const tcmHot = thermalNature === 'hot' || thermalNature === 'warm';
  return (ayurvedaHot && tcmCold) || (ayurvedaCold && tcmHot);
}

// ---------------------------------------------------------------------------
// Line parsers for the three tradition blocks
// ---------------------------------------------------------------------------

interface AyurvedaParsed {
  rasa: string[];
  virya: string;
  vipaka: string;
  guna: string[];
  vata_effect: number;
  pitta_effect: number;
  kapha_effect: number;
}

function parseAyurvedaLine(line: string): AyurvedaParsed {
  // Remove the bold prefix
  const content = line.replace(/^\*\*Ayurveda:\*\*\s*/i, '');
  const segments = splitBar(content);

  let rasa: string[] = [];
  let virya = '';
  let vipaka = '';
  let guna: string[] = [];
  let doshaRaw = '';

  for (const seg of segments) {
    const segLower = seg.toLowerCase();
    if (segLower.startsWith('rasa:')) {
      rasa = parseRasa(extractField(seg, 'Rasa'));
    } else if (segLower.startsWith('virya:')) {
      virya = parseVirya(extractField(seg, 'Virya'));
    } else if (segLower.startsWith('vipaka:')) {
      vipaka = parseVipaka(extractField(seg, 'Vipaka'));
    } else if (segLower.startsWith('guna:')) {
      guna = parseGuna(extractField(seg, 'Guna'));
    } else if (segLower.startsWith('dosha:')) {
      doshaRaw = seg;
    }
  }

  const dosha = parseDoshaEffects(doshaRaw);

  return { rasa, virya, vipaka, guna, ...dosha };
}

interface TcmParsed {
  thermal_nature: string;
  flavor: string[];
  organ_affinity: string[];
  actions: string[];
}

function parseTcmLine(line: string): TcmParsed {
  const content = line.replace(/^\*\*TCM:\*\*\s*/i, '');
  const segments = splitBar(content);

  let thermal_nature = '';
  let flavor: string[] = [];
  let organ_affinity: string[] = [];
  let actions: string[] = [];

  for (const seg of segments) {
    const segLower = seg.toLowerCase();
    if (segLower.startsWith('nature:')) {
      thermal_nature = parseThermalNature(extractField(seg, 'Nature'));
    } else if (segLower.startsWith('flavor:') || segLower.startsWith('flavors:')) {
      const key = segLower.startsWith('flavors') ? 'Flavors' : 'Flavor';
      flavor = splitComma(extractField(seg, key)).map(norm);
    } else if (segLower.startsWith('organ:') || segLower.startsWith('organs:')) {
      const key = segLower.startsWith('organs') ? 'Organs' : 'Organ';
      organ_affinity = parseOrganAffinity(extractField(seg, key));
    } else if (segLower.startsWith('action:') || segLower.startsWith('actions:')) {
      const key = segLower.startsWith('actions') ? 'Actions' : 'Action';
      actions = parseActions(extractField(seg, key));
    }
  }

  return { thermal_nature, flavor, organ_affinity, actions };
}

interface NaturopathyParsed {
  contraindications: string[];
  evidence_claims_raw: ParsedEvidenceClaim[];
}

function parseNaturopathyLine(line: string): NaturopathyParsed {
  const content = line.replace(/^\*\*Naturopathy:\*\*\s*/i, '');
  const segments = splitBar(content);

  let contraindications: string[] = [];
  let evidenceRaw = '';

  for (const seg of segments) {
    const segLower = seg.toLowerCase();
    if (segLower.startsWith('contraindication')) {
      const val = extractField(seg, 'Contraindications') || extractField(seg, 'Contraindication');
      if (val && val.toLowerCase() !== 'none') {
        contraindications = splitComma(val).map((c) => c.trim());
      }
    } else if (segLower.startsWith('evidence claim') || segLower.startsWith('evidence:')) {
      evidenceRaw = extractField(seg, 'Evidence claims') || extractField(seg, 'Evidence');
    }
  }

  return {
    contraindications,
    evidence_claims_raw: parseEvidenceClaims(evidenceRaw),
  };
}

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

/**
 * Parse food-database-v1.md and return an array of CanonicalFood objects.
 *
 * The markdown file uses this structure:
 * - ## CATEGORY HEADING (e.g., "## GRAINS")
 * - ### N. Food Name
 * - **Ayurveda:** ...
 * - **TCM:** ...
 * - **Naturopathy:** ...
 * - **Convergence notes:** ...
 * - **Best for:** ...
 */
export function parseCanonicalFoods(filePath: string): CanonicalFood[] {
  const markdown = readFileSync(filePath, 'utf-8');
  const foods: CanonicalFood[] = [];

  // Track current category from ## headings
  let currentCategory = 'uncategorized';

  // Split into lines for processing
  const lines = markdown.split('\n');

  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? '';

    // Detect category headings: "## GRAINS", "## VEGETABLES", etc.
    const categoryMatch = line.match(/^##\s+([A-Z][A-Z &]+)\s*$/);
    if (categoryMatch) {
      const heading = (categoryMatch[1] ?? '').trim();
      currentCategory = SECTION_TO_CATEGORY[heading] ?? norm(heading).replace(/\s+/g, '_');
      i++;
      continue;
    }

    // Detect food entry: "### 1. Basmati Rice" or "### 1. Basmati Rice (Oryza sativa)"
    const foodMatch = line.match(/^###\s+\d+\.\s+(.+)$/);
    if (foodMatch) {
      const rawName = (foodMatch[1] ?? '').trim();
      // Strip parenthetical Latin names if present
      const name = rawName.replace(/\s*\([^)]*\)\s*$/, '').trim();

      // Collect all lines until the next ### or ## heading
      const blockLines: string[] = [];
      i++;
      while (i < lines.length) {
        const nextLine = lines[i] ?? '';
        if (/^#{2,3}\s/.test(nextLine)) break;
        blockLines.push(nextLine);
        i++;
      }

      // Find each tradition line
      const ayurvedaLine = blockLines.find((l) => l.startsWith('**Ayurveda:'));
      const tcmLine = blockLines.find((l) => l.startsWith('**TCM:'));
      const naturopathyLine = blockLines.find((l) => l.startsWith('**Naturopathy:'));
      const convergenceLine = blockLines.find((l) => l.startsWith('**Convergence'));
      const bestForLine = blockLines.find((l) => l.startsWith('**Best for:'));

      // Parse each tradition
      const ayurveda = ayurvedaLine
        ? parseAyurvedaLine(ayurvedaLine)
        : {
            rasa: [],
            virya: '',
            vipaka: '',
            guna: [],
            vata_effect: 0,
            pitta_effect: 0,
            kapha_effect: 0,
          };

      const tcm = tcmLine
        ? parseTcmLine(tcmLine)
        : { thermal_nature: 'neutral', flavor: [], organ_affinity: [], actions: [] };

      const naturopathy = naturopathyLine
        ? parseNaturopathyLine(naturopathyLine)
        : { contraindications: [], evidence_claims_raw: [] };

      // Extract convergence notes and best-for
      const convergence_notes = convergenceLine
        ? convergenceLine.replace(/^\*\*Convergence\s*notes?:\*\*\s*/i, '').trim() || null
        : null;

      const best_for = bestForLine
        ? bestForLine.replace(/^\*\*Best for:\*\*\s*/i, '').trim() || null
        : null;

      // Derive computed fields
      const ritu_fit = deriveRituFit(best_for);
      const element_fit = deriveElementFit(tcm.organ_affinity);
      const thermal_contradiction = detectThermalContradiction(ayurveda.virya, tcm.thermal_nature);

      const food: CanonicalFood = {
        name,
        category: currentCategory,
        seed_source: 'canonical',
        validation_status: 'validated',

        // Ayurveda
        rasa: ayurveda.rasa,
        virya: ayurveda.virya,
        vipaka: ayurveda.vipaka,
        guna: ayurveda.guna,
        vata_effect: ayurveda.vata_effect,
        pitta_effect: ayurveda.pitta_effect,
        kapha_effect: ayurveda.kapha_effect,
        ritu_fit,

        // TCM
        thermal_nature: tcm.thermal_nature,
        flavor: tcm.flavor,
        organ_affinity: tcm.organ_affinity,
        actions: tcm.actions,
        element_fit,

        // Naturopathy
        contraindications:
          naturopathy.contraindications.length > 0 ? naturopathy.contraindications : null,

        // Extra parsed fields (not in foods table directly)
        convergence_notes,
        best_for,
        evidence_claims_raw: naturopathy.evidence_claims_raw,
        thermal_contradiction,
      };

      foods.push(food);
      continue;
    }

    i++;
  }

  return foods;
}
