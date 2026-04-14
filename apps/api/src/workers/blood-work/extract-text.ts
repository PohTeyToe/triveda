/**
 * PDF text extraction using unpdf.
 *
 * Wraps `extractText` and `getMeta` for per-page text + metadata, handles
 * password-protected and unreadable PDFs, and computes a density signal
 * used to decide between the text-extraction path and the vision fallback.
 */

import { extractText, getMeta } from 'unpdf';
import type { RawBiomarker, VendorType } from './types.js';

export interface PdfMeta {
  pageCount: number;
  title: string | null;
  author: string | null;
}

export class PasswordProtectedError extends Error {
  readonly code = 'PASSWORD_PROTECTED';
  constructor(message = 'PDF is password-protected') {
    super(message);
    this.name = 'PasswordProtectedError';
  }
}

export class UnreadablePdfError extends Error {
  readonly code = 'UNREADABLE_PDF';
  constructor(message = 'PDF could not be read') {
    super(message);
    this.name = 'UnreadablePdfError';
  }
}

/**
 * Extract per-page text and metadata from a PDF.
 *
 * Throws PasswordProtectedError when the file is encrypted and
 * UnreadablePdfError for corrupted / unparseable files.
 */
export async function extractPdfText(
  pdfBuffer: ArrayBuffer | Uint8Array,
): Promise<{ pages: string[]; meta: PdfMeta }> {
  const bytes = pdfBuffer instanceof Uint8Array ? pdfBuffer : new Uint8Array(pdfBuffer);

  let pages: string[];
  let pageCount: number;
  try {
    const extracted = await extractText(bytes, { mergePages: false });
    pages = Array.isArray(extracted.text) ? extracted.text : [String(extracted.text ?? '')];
    pageCount = extracted.totalPages ?? pages.length;
  } catch (err) {
    const message = err instanceof Error ? err.message.toLowerCase() : '';
    if (message.includes('password') || message.includes('encrypted')) {
      throw new PasswordProtectedError();
    }
    throw new UnreadablePdfError(err instanceof Error ? err.message : 'PDF extraction failed');
  }

  let title: string | null = null;
  let author: string | null = null;
  try {
    const meta = await getMeta(bytes);
    const info = (meta?.info ?? {}) as Record<string, unknown>;
    title = typeof info.Title === 'string' ? info.Title : null;
    author = typeof info.Author === 'string' ? info.Author : null;

    // Heuristic: if total text is empty and metadata hints encryption, raise.
    const totalChars = pages.reduce((sum, p) => sum + (p?.length ?? 0), 0);
    const encryptedHint = Boolean((meta as { encrypted?: unknown } | null)?.encrypted);
    if (totalChars === 0 && encryptedHint) {
      throw new PasswordProtectedError();
    }
  } catch (err) {
    if (err instanceof PasswordProtectedError) throw err;
    // Meta failure is non-fatal; keep title/author null.
  }

  return { pages, meta: { pageCount, title, author } };
}

/**
 * Text density check — decision gate between text and vision paths.
 *
 * Returns true when the average page has at least 50 characters. Real
 * text-based lab reports have thousands of chars per page; scanned
 * PDFs commonly return 0–20.
 */
export function isTextSufficient(pages: string[]): boolean {
  if (pages.length === 0) return false;
  const total = pages.reduce((sum, p) => sum + (p?.trim().length ?? 0), 0);
  const average = total / pages.length;
  return average >= 50;
}

// ---------------------------------------------------------------------------
// Biomarker row parsing
// ---------------------------------------------------------------------------

const TABLE_HEADER_KEYWORDS = [
  'test name',
  'test',
  'result',
  'units',
  'unit',
  'reference range',
  'reference',
  'range',
  'flag',
];

// Value token: number, number with <, >, =, or ranges we will skip.
const VALUE_PATTERN = /^(<=?|>=?)?\d+(?:[.,]\d+)?$/;

// Unit strings we accept as anchors for the value-column detection.
const UNIT_TOKENS = new Set([
  'mmol/l',
  'mg/dl',
  'mg/l',
  'g/l',
  'g/dl',
  'ng/ml',
  'ng/l',
  'pg/ml',
  'pmol/l',
  'nmol/l',
  'ug/l',
  'ug/dl',
  'umol/l',
  'uiu/ml',
  'miu/l',
  'k/ul',
  'x10^9/l',
  'x10^3/ul',
  '%',
]);

function isBiomarkerHeaderLine(line: string): boolean {
  const lower = line.toLowerCase();
  let hits = 0;
  for (const kw of TABLE_HEADER_KEYWORDS) {
    if (lower.includes(kw)) hits += 1;
  }
  return hits >= 2;
}

/**
 * Normalize a row by collapsing runs of whitespace and stripping trailing
 * control characters. Lines are tokenized on whitespace; we then walk
 * tokens right-to-left to locate the (flag?, range, unit, value) tail.
 */
function isUnitToken(token: string): boolean {
  if (!token) return false;
  if (token === '%') return true;
  const lower = token.toLowerCase();
  if (UNIT_TOKENS.has(lower)) return true;
  // Accept compound unit patterns ending with /L, /mL, /dL, /uL
  if (/\/(l|ml|dl|ul)$/i.test(token)) return true;
  if (/^x10\^/i.test(token)) return true;
  return false;
}

function parseLine(line: string, pageIndex: number): RawBiomarker | null {
  let tokens = line
    .replace(/\u00a0/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  if (tokens.length < 3) return null;

  // Strip trailing flag token.
  const FLAGS = new Set(['h', 'l', 'hh', 'll', '*', '!']);
  if (FLAGS.has(tokens[tokens.length - 1]?.toLowerCase() ?? '')) {
    tokens = tokens.slice(0, -1);
  }

  if (tokens.length < 3) return null;

  // Find the unit token (walk from the right, bypass range-like tokens).
  let unitIdx = -1;
  for (let i = tokens.length - 1; i >= 0; i -= 1) {
    if (isUnitToken(tokens[i] ?? '')) {
      unitIdx = i;
      break;
    }
  }
  if (unitIdx === -1) return null;

  const unit = tokens[unitIdx] ?? '';
  // Anything after the unit is the reference range.
  const rangeTokens = tokens.slice(unitIdx + 1);
  const referenceRange = rangeTokens.join(' ').trim();

  // Value = token immediately before the unit.
  const valueIdx = unitIdx - 1;
  const value = tokens[valueIdx] ?? '';
  if (!VALUE_PATTERN.test(value)) return null;

  // Name = everything before the value.
  const name = tokens.slice(0, valueIdx).join(' ').trim();
  if (name.length === 0) return null;

  if (isBiomarkerHeaderLine(name)) return null;

  return {
    name,
    value,
    unit,
    referenceRange,
    pageIndex,
  };
}

/**
 * Regex-based biomarker extractor that runs over concatenated page text.
 *
 * Returns raw (un-normalized) rows. The per-vendor normalizer is
 * responsible for aliasing names and converting units.
 */
export function parseBiomarkers(fullText: string, _vendor: VendorType): RawBiomarker[] {
  const lines = fullText.split(/\r?\n/);
  const results: RawBiomarker[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i] ?? '';
    const parsed = parseLine(raw, 0);
    if (parsed) results.push(parsed);
  }

  return results;
}

/**
 * Per-page parser that preserves pageIndex. Preferred for pipelines that
 * already have pages split by `extractPdfText`.
 */
export function parseBiomarkersByPage(pages: string[], _vendor: VendorType): RawBiomarker[] {
  const results: RawBiomarker[] = [];
  for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
    const pageText = pages[pageIndex] ?? '';
    for (const line of pageText.split(/\r?\n/)) {
      const parsed = parseLine(line, pageIndex);
      if (parsed) results.push(parsed);
    }
  }
  return results;
}
