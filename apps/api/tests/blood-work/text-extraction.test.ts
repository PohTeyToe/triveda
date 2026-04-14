/**
 * Unit tests for the PDF text extraction pipeline.
 */

import { describe, expect, it } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  extractPdfText,
  isTextSufficient,
  parseBiomarkersByPage,
} from '../../src/workers/blood-work/extract-text.js';

const FIXTURES_DIR = join(
  import.meta.dir ?? new URL('.', import.meta.url).pathname.replace(/^\//, ''),
  '..',
  'fixtures',
  'blood-work',
);

async function loadFixture(name: string): Promise<Uint8Array> {
  return new Uint8Array(await readFile(join(FIXTURES_DIR, name)));
}

describe('extractPdfText', () => {
  it('extracts per-page text arrays for LifeLabs fixture', async () => {
    const bytes = await loadFixture('lifelabs-sample.pdf');
    const { pages } = await extractPdfText(bytes);
    expect(pages.length).toBeGreaterThan(0);
    expect(pages[0]).toContain('LifeLabs');
  });

  it('extracts per-page text arrays for Quest fixture', async () => {
    const bytes = await loadFixture('quest-sample.pdf');
    const { pages } = await extractPdfText(bytes);
    expect(pages[0]).toContain('Quest Diagnostics');
  });

  it('extracts per-page text arrays for LabCorp fixture', async () => {
    const bytes = await loadFixture('labcorp-sample.pdf');
    const { pages } = await extractPdfText(bytes);
    expect(pages[0]?.toLowerCase()).toContain('labcorp');
  });

  it('extracts per-page text arrays for AHS fixture', async () => {
    const bytes = await loadFixture('ahs-sample.pdf');
    const { pages } = await extractPdfText(bytes);
    expect(pages[0]).toContain('Alberta Health Services');
  });

  it('returns page count in metadata', async () => {
    const bytes = await loadFixture('lifelabs-sample.pdf');
    const { meta } = await extractPdfText(bytes);
    expect(meta.pageCount).toBeGreaterThanOrEqual(1);
  });

  it('reports insufficient text for scanned fixture', async () => {
    const bytes = await loadFixture('scanned-sample.pdf');
    const { pages } = await extractPdfText(bytes);
    expect(isTextSufficient(pages)).toBe(false);
  });

  it('reports sufficient text for vendor fixtures', async () => {
    const bytes = await loadFixture('lifelabs-sample.pdf');
    const { pages } = await extractPdfText(bytes);
    expect(isTextSufficient(pages)).toBe(true);
  });
});

describe('parseBiomarkersByPage', () => {
  it('extracts 12 biomarkers from the LifeLabs fixture', async () => {
    const bytes = await loadFixture('lifelabs-sample.pdf');
    const { pages } = await extractPdfText(bytes);
    const rows = parseBiomarkersByPage(pages, 'lifelabs');
    expect(rows.length).toBe(12);
    const first = rows.find((r) => r.name === 'Glucose, Fasting');
    expect(first?.value).toBe('5.2');
    expect(first?.unit).toBe('mmol/L');
  });

  it('extracts biomarkers from the Quest fixture with mg/dL units', async () => {
    const bytes = await loadFixture('quest-sample.pdf');
    const { pages } = await extractPdfText(bytes);
    const rows = parseBiomarkersByPage(pages, 'quest');
    const glucose = rows.find((r) => r.name.toLowerCase().includes('glucose'));
    expect(glucose?.unit).toBe('mg/dL');
  });

  it('parses <value range format correctly', async () => {
    const bytes = await loadFixture('lifelabs-sample.pdf');
    const { pages } = await extractPdfText(bytes);
    const rows = parseBiomarkersByPage(pages, 'lifelabs');
    const ldl = rows.find((r) => r.name === 'LDL Cholesterol');
    expect(ldl?.referenceRange).toBe('< 3.4');
  });

  it('returns zero biomarkers for a non-lab-report PDF', async () => {
    const bytes = await loadFixture('not-a-lab-report.pdf');
    const { pages } = await extractPdfText(bytes);
    const rows = parseBiomarkersByPage(pages, 'unknown');
    expect(rows.length).toBe(0);
  });

  it('returns zero biomarkers for a scanned PDF', async () => {
    const bytes = await loadFixture('scanned-sample.pdf');
    const { pages } = await extractPdfText(bytes);
    const rows = parseBiomarkersByPage(pages, 'unknown');
    expect(rows.length).toBe(0);
  });
});

describe('isTextSufficient', () => {
  it('returns false for empty pages array', () => {
    expect(isTextSufficient([])).toBe(false);
  });

  it('returns true when average >= 50 chars per page', () => {
    const pages = ['a'.repeat(100)];
    expect(isTextSufficient(pages)).toBe(true);
  });

  it('returns false when average < 50 chars per page', () => {
    expect(isTextSufficient(['short', ''])).toBe(false);
  });
});
