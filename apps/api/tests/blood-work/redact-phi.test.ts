import { describe, expect, it } from 'bun:test';
import { redactPhi } from '../../src/workers/blood-work/redact-phi.js';

describe('redactPhi', () => {
  it('redacts numeric values under value-like keys', () => {
    const input = { biomarker: { value: 5.2, unit: 'mmol/L' } };
    const result = redactPhi(input) as { biomarker: { value: unknown } };
    expect(result.biomarker.value).toBe('[REDACTED]');
  });

  it('preserves counts', () => {
    const input = { biomarker_count: 12, total: 5 };
    const result = redactPhi(input) as { biomarker_count: number; total: number };
    expect(result.biomarker_count).toBe(12);
    expect(result.total).toBe(5);
  });

  it('preserves confidence scores', () => {
    const input = { confidence: 0.92 };
    const result = redactPhi(input) as { confidence: number };
    expect(result.confidence).toBe(0.92);
  });

  it('preserves UUIDs and string identifiers', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    const input = { user_id: id, job_id: id, report_id: id };
    const result = redactPhi(input) as Record<string, string>;
    expect(result.user_id).toBe(id);
    expect(result.job_id).toBe(id);
    expect(result.report_id).toBe(id);
  });

  it('recurses into nested objects', () => {
    const input = { report: { biomarkers: [{ value: 5.2, level: 3.8 }] } };
    const result = redactPhi(input) as {
      report: { biomarkers: Array<{ value: unknown; level: unknown }> };
    };
    expect(result.report.biomarkers[0]?.value).toBe('[REDACTED]');
    expect(result.report.biomarkers[0]?.level).toBe('[REDACTED]');
  });

  it('preserves file metadata fields', () => {
    const input = { file_size_bytes: 12345, page_count: 3, duration_ms: 500 };
    const result = redactPhi(input) as Record<string, number>;
    expect(result.file_size_bytes).toBe(12345);
    expect(result.page_count).toBe(3);
    expect(result.duration_ms).toBe(500);
  });

  it('handles arrays recursively', () => {
    const input = [{ value: 5.2 }, { value: 3.1 }];
    const result = redactPhi(input) as Array<{ value: unknown }>;
    expect(result[0]?.value).toBe('[REDACTED]');
    expect(result[1]?.value).toBe('[REDACTED]');
  });
});
