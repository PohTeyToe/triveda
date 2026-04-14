/**
 * Worker pipeline tests.
 *
 * Uses an in-memory fake Drizzle client to exercise the full pipeline
 * without a real database. Vision fetch is mocked.
 */

import { describe, expect, it } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { processBloodWorkJob } from '../../src/workers/blood-work/pipeline.js';

const FIXTURES_DIR = join(
  import.meta.dir ?? new URL('.', import.meta.url).pathname.replace(/^\//, ''),
  '..',
  'fixtures',
  'blood-work',
);

async function loadFixture(name: string): Promise<Uint8Array> {
  return new Uint8Array(await readFile(join(FIXTURES_DIR, name)));
}

interface BiomarkerRow {
  id: string;
  report_id: string;
  canonical_key: string;
  display_name: string;
  value: string;
  unit: string;
  original_unit: string | null;
  reference_range_low: string | null;
  reference_range_high: string | null;
  flag: string;
  confidence: string;
  loinc_code: string | null;
}

interface ReportRow {
  id: string;
  user_id: string;
  status: string;
  stage: string | null;
  vendor: string | null;
  extraction_method: string | null;
  page_count: number | null;
  food_influences: unknown;
  processed_at: Date | null;
  started_at: Date | null;
  error_message: string | null;
}

/**
 * Minimal fake Drizzle client that implements the methods the pipeline
 * uses: select, insert, update. Returns no food mappings so the influence
 * resolver produces an empty map (the pipeline should still complete).
 */
// biome-ignore lint/suspicious/noExplicitAny: test-only fake DB shape
function createFakeDb(state: { reports: ReportRow[]; biomarkers: BiomarkerRow[] }): any {
  return {
    select: (_cols?: unknown) => ({
      from: (_tbl: unknown) => ({
        where: (_cond: unknown) => ({
          limit: (_n: number) => [],
          orderBy: (_o: unknown) => [],
        }),
        innerJoin: () => ({ where: () => ({ orderBy: () => [] }) }),
      }),
    }),
    insert: (_tbl: { [key: string]: unknown }) => ({
      values: (vals: Record<string, unknown>) => ({
        returning: (_cols?: unknown) => {
          const tableName =
            // Drizzle tables have a symbol describing table name; fall back to checking field presence.
            vals.canonical_key !== undefined
              ? 'biomarkers'
              : vals.biomarker_id !== undefined
                ? 'review_queue'
                : 'other';
          if (tableName === 'biomarkers') {
            const row: BiomarkerRow = {
              id: `bm-${state.biomarkers.length + 1}`,
              report_id: vals.report_id as string,
              canonical_key: vals.canonical_key as string,
              display_name: vals.display_name as string,
              value: vals.value as string,
              unit: vals.unit as string,
              original_unit: (vals.original_unit as string | null) ?? null,
              reference_range_low: (vals.reference_range_low as string | null) ?? null,
              reference_range_high: (vals.reference_range_high as string | null) ?? null,
              flag: vals.flag as string,
              confidence: vals.confidence as string,
              loinc_code: (vals.loinc_code as string | null) ?? null,
            };
            state.biomarkers.push(row);
            return [{ id: row.id }];
          }
          return [];
        },
      }),
    }),
    update: (_tbl: unknown) => ({
      set: (vals: Record<string, unknown>) => ({
        where: (_cond: unknown) => {
          // Apply to all reports in state (pipeline targets by id).
          for (const r of state.reports) {
            Object.assign(r, vals);
          }
          return [];
        },
      }),
    }),
    delete: () => ({ where: () => [] }),
  };
}

describe('processBloodWorkJob', () => {
  it('processes LifeLabs fixture end-to-end and completes', async () => {
    const fileBuffer = await loadFixture('lifelabs-sample.pdf');
    const reportId = 'report-1';
    const state: { reports: ReportRow[]; biomarkers: BiomarkerRow[] } = {
      reports: [
        {
          id: reportId,
          user_id: 'user-1',
          status: 'pending',
          stage: null,
          vendor: null,
          extraction_method: null,
          page_count: null,
          food_influences: null,
          processed_at: null,
          started_at: null,
          error_message: null,
        },
      ],
      biomarkers: [],
    };
    const db = createFakeDb(state);

    const telemetryEvents: Array<{ event: string; payload: Record<string, unknown> }> = [];

    const result = await processBloodWorkJob({
      reportId,
      userId: 'user-1',
      fileBuffer,
      fileType: 'application/pdf',
      db,
      disableVision: true,
      emitTelemetry: (event, payload) => telemetryEvents.push({ event, payload }),
    });

    expect(result.status).toBe('complete');
    expect(result.biomarkerCount).toBeGreaterThanOrEqual(10);
    expect(result.extractionMethod).toBe('text');
    expect(result.vendor).toBe('lifelabs');
    // Stage should have advanced and report marked complete
    expect(state.reports[0]?.status).toBe('complete');

    // Telemetry should contain start + extracted + complete
    const events = telemetryEvents.map((e) => e.event);
    expect(events).toContain('blood_work.start');
    expect(events).toContain('blood_work.complete');
  });

  it('marks report as failed for a non-lab-report PDF', async () => {
    const fileBuffer = await loadFixture('not-a-lab-report.pdf');
    const reportId = 'report-2';
    const state: { reports: ReportRow[]; biomarkers: BiomarkerRow[] } = {
      reports: [
        {
          id: reportId,
          user_id: 'user-1',
          status: 'pending',
          stage: null,
          vendor: null,
          extraction_method: null,
          page_count: null,
          food_influences: null,
          processed_at: null,
          started_at: null,
          error_message: null,
        },
      ],
      biomarkers: [],
    };
    const db = createFakeDb(state);

    const result = await processBloodWorkJob({
      reportId,
      userId: 'user-1',
      fileBuffer,
      fileType: 'application/pdf',
      db,
      disableVision: true,
    });

    expect(result.status).toBe('failed');
    expect(result.errorMessage).toMatch(/doesn't appear to be a lab report/i);
    expect(state.reports[0]?.status).toBe('failed');
  });

  it('marks report as failed for a scanned PDF when vision is disabled', async () => {
    const fileBuffer = await loadFixture('scanned-sample.pdf');
    const reportId = 'report-3';
    const state: { reports: ReportRow[]; biomarkers: BiomarkerRow[] } = {
      reports: [
        {
          id: reportId,
          user_id: 'user-1',
          status: 'pending',
          stage: null,
          vendor: null,
          extraction_method: null,
          page_count: null,
          food_influences: null,
          processed_at: null,
          started_at: null,
          error_message: null,
        },
      ],
      biomarkers: [],
    };
    const db = createFakeDb(state);

    const result = await processBloodWorkJob({
      reportId,
      userId: 'user-1',
      fileBuffer,
      fileType: 'application/pdf',
      db,
      disableVision: true,
    });

    expect(result.status).toBe('failed');
  });

  it('never logs raw biomarker values through the telemetry hook', async () => {
    const fileBuffer = await loadFixture('lifelabs-sample.pdf');
    const reportId = 'report-4';
    const state: { reports: ReportRow[]; biomarkers: BiomarkerRow[] } = {
      reports: [
        {
          id: reportId,
          user_id: 'user-1',
          status: 'pending',
          stage: null,
          vendor: null,
          extraction_method: null,
          page_count: null,
          food_influences: null,
          processed_at: null,
          started_at: null,
          error_message: null,
        },
      ],
      biomarkers: [],
    };
    const db = createFakeDb(state);

    const events: Array<{ event: string; payload: unknown }> = [];
    await processBloodWorkJob({
      reportId,
      userId: 'user-1',
      fileBuffer,
      fileType: 'application/pdf',
      db,
      disableVision: true,
      emitTelemetry: (event, payload) => events.push({ event, payload }),
    });

    const serialized = JSON.stringify(events);
    // Known fixture biomarker values from LifeLabs fixture:
    const leakedValues = ['5.2 mmol/L', '3.8 mmol/L', '42 nmol/L', '138 g/L'];
    for (const v of leakedValues) {
      expect(serialized).not.toContain(v);
    }
  });
});
