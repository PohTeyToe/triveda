/**
 * Shared helpers for vendor normalizers: alias lookup, value parsing,
 * reference-range parsing, unit conversion, and flag computation.
 */

import {
  CANONICAL_BIOMARKER_REGISTRY,
  type NormalizedBiomarker,
  convertToCanonicalUnit,
  getRegistryEntry,
} from '../canonical-schema.js';
import type { BiomarkerFlag, RawBiomarker } from '../types.js';

export interface ParsedValue {
  value: number;
  note: string | null;
}

export function parseValue(raw: string): ParsedValue | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (/^n\/?a$/i.test(trimmed)) return null;

  const lt = /^<=?\s*(-?\d+(?:[.,]\d+)?)$/.exec(trimmed);
  if (lt) {
    return { value: Number(lt[1]?.replace(',', '.')), note: 'less_than' };
  }
  const gt = /^>=?\s*(-?\d+(?:[.,]\d+)?)$/.exec(trimmed);
  if (gt) {
    return { value: Number(gt[1]?.replace(',', '.')), note: 'greater_than' };
  }

  const plain = trimmed.replace(',', '.');
  const n = Number(plain);
  if (!Number.isFinite(n)) return null;
  return { value: n, note: null };
}

export interface RefRange {
  low: number | null;
  high: number | null;
}

export function parseReferenceRange(raw: string): RefRange {
  if (!raw || !raw.trim()) return { low: null, high: null };
  const cleaned = raw
    .replace(/\s+/g, ' ')
    .replace(
      /\s*(mmol\/l|mg\/dl|mg\/l|g\/l|g\/dl|ng\/ml|ng\/l|pg\/ml|pmol\/l|nmol\/l|ug\/l|ug\/dl|umol\/l|uiu\/ml|miu\/l|k\/ul|x10\^9\/l|x10\^3\/ul|%)\s*$/i,
      '',
    )
    .trim();

  const dashMatch = /^(-?\d+(?:[.,]\d+)?)\s*[-\u2013]\s*(-?\d+(?:[.,]\d+)?)$/.exec(cleaned);
  if (dashMatch) {
    return {
      low: Number(dashMatch[1]?.replace(',', '.')),
      high: Number(dashMatch[2]?.replace(',', '.')),
    };
  }

  const gt = /^>=?\s*(-?\d+(?:[.,]\d+)?)$/.exec(cleaned);
  if (gt) return { low: Number(gt[1]?.replace(',', '.')), high: null };

  const lt = /^<=?\s*(-?\d+(?:[.,]\d+)?)$/.exec(cleaned);
  if (lt) return { low: null, high: Number(lt[1]?.replace(',', '.')) };

  return { low: null, high: null };
}

export function computeFlag(value: number, low: number | null, high: number | null): BiomarkerFlag {
  if (low == null && high == null) return 'normal';
  if (high != null && value > high) {
    const distance = high - (low ?? high);
    if (distance > 0 && value - high > 2 * distance) return 'critical';
    return 'high';
  }
  if (low != null && value < low) {
    const distance = (high ?? low) - low;
    if (distance > 0 && low - value > 2 * distance) return 'critical';
    return 'low';
  }
  return 'normal';
}

function convertRangeBound(
  value: number | null,
  fromUnit: string,
  canonicalKey: string,
): number | null {
  if (value == null) return null;
  const converted = convertToCanonicalUnit(value, fromUnit, canonicalKey);
  return converted ? converted.value : null;
}

export interface NormalizeOptions {
  aliases: Record<string, string>;
  baseConfidence?: number;
}

function normaliseName(raw: string): string {
  return raw.toLowerCase().replace(/\s+/g, ' ').trim().replace(/[:;]/g, '').trim();
}

export function normalizeWithAliases(
  raw: RawBiomarker,
  opts: NormalizeOptions,
): NormalizedBiomarker | null {
  const key = normaliseName(raw.name);
  const canonicalKey = opts.aliases[key];
  if (!canonicalKey) return null;

  const entry = getRegistryEntry(canonicalKey);
  if (!entry) return null;

  const parsed = parseValue(raw.value);
  if (!parsed) return null;

  let unit = raw.unit;
  let value = parsed.value;
  let originalUnit: string | null = null;
  const converted = convertToCanonicalUnit(parsed.value, raw.unit, canonicalKey);
  if (converted) {
    if (converted.unit !== raw.unit) {
      originalUnit = raw.unit;
      unit = converted.unit;
      value = converted.value;
    } else {
      unit = converted.unit;
    }
  }

  const rawRange = parseReferenceRange(raw.referenceRange);
  const refLow = converted ? convertRangeBound(rawRange.low, raw.unit, canonicalKey) : rawRange.low;
  const refHigh = converted
    ? convertRangeBound(rawRange.high, raw.unit, canonicalKey)
    : rawRange.high;

  const flag = computeFlag(value, refLow, refHigh);

  return {
    canonicalKey,
    displayName: entry.displayName,
    value,
    unit,
    originalUnit,
    referenceRangeLow: refLow,
    referenceRangeHigh: refHigh,
    flag,
    loincCode: entry.loincCode ?? null,
    confidence: opts.baseConfidence ?? 0.95,
  };
}

export function buildGenericAliases(
  vendorTables: Array<Record<string, string>>,
): Record<string, string> {
  const merged: Record<string, string> = {};
  for (const t of vendorTables) {
    for (const [k, v] of Object.entries(t)) {
      merged[k] = v;
    }
  }
  for (const entry of CANONICAL_BIOMARKER_REGISTRY) {
    merged[entry.canonicalKey.toLowerCase()] = entry.canonicalKey;
    merged[entry.displayName.toLowerCase()] = entry.canonicalKey;
  }
  return merged;
}
