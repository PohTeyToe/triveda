import { describe, expect, it } from 'vitest';
import {
  CheckInChipPairSchema,
  CulturalPreferenceSchema,
  DailyCheckInAnswerSchema,
  FaceScanReadingSchema,
} from '../types.js';

describe('FaceScanReadingSchema', () => {
  const validReading = {
    vata_delta: 0.2,
    pitta_delta: -0.1,
    kapha_delta: 0.05,
    wood_hint: 0.5,
    fire_hint: 0.5,
    earth_hint: 0.5,
    metal_hint: 0.5,
    water_hint: 0.5,
    stress_level: 0.3,
    skin_tone: 'warm, balanced',
    confidence: 0.55,
    simulated: true as const,
    generated_at: '2026-04-12T12:00:00.000Z',
    seed_hour: 474000,
  };

  it('accepts valid reading with all fields in range', () => {
    const result = FaceScanReadingSchema.safeParse(validReading);
    expect(result.success).toBe(true);
  });

  it('rejects vata_delta outside [-1, 1]', () => {
    const result = FaceScanReadingSchema.safeParse({ ...validReading, vata_delta: 1.5 });
    expect(result.success).toBe(false);
  });

  it('rejects pitta_delta outside [-1, 1]', () => {
    const result = FaceScanReadingSchema.safeParse({ ...validReading, pitta_delta: -1.5 });
    expect(result.success).toBe(false);
  });

  it('rejects kapha_delta outside [-1, 1]', () => {
    const result = FaceScanReadingSchema.safeParse({ ...validReading, kapha_delta: 2.0 });
    expect(result.success).toBe(false);
  });

  it('rejects element hints outside [0, 1]', () => {
    expect(FaceScanReadingSchema.safeParse({ ...validReading, wood_hint: -0.1 }).success).toBe(
      false,
    );
    expect(FaceScanReadingSchema.safeParse({ ...validReading, fire_hint: 1.1 }).success).toBe(
      false,
    );
  });

  it('rejects confidence outside [0.4, 0.7]', () => {
    expect(FaceScanReadingSchema.safeParse({ ...validReading, confidence: 0.3 }).success).toBe(
      false,
    );
    expect(FaceScanReadingSchema.safeParse({ ...validReading, confidence: 0.8 }).success).toBe(
      false,
    );
  });

  it('rejects simulated !== true', () => {
    const result = FaceScanReadingSchema.safeParse({ ...validReading, simulated: false });
    expect(result.success).toBe(false);
  });

  it('rejects empty skin_tone', () => {
    const result = FaceScanReadingSchema.safeParse({ ...validReading, skin_tone: '' });
    expect(result.success).toBe(false);
  });
});

describe('DailyCheckInAnswerSchema', () => {
  it('accepts valid answer with date and selections', () => {
    const result = DailyCheckInAnswerSchema.safeParse({
      date: '2026-04-12',
      selections: { energy: 'left' },
      dismissed: false,
      synced: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid date format', () => {
    expect(
      DailyCheckInAnswerSchema.safeParse({
        date: '04/12/2026',
        selections: {},
        dismissed: false,
        synced: false,
      }).success,
    ).toBe(false);
    expect(
      DailyCheckInAnswerSchema.safeParse({
        date: '2026-4-12',
        selections: {},
        dismissed: false,
        synced: false,
      }).success,
    ).toBe(false);
  });

  it('accepts empty selections', () => {
    const result = DailyCheckInAnswerSchema.safeParse({
      date: '2026-04-12',
      selections: {},
      dismissed: false,
      synced: false,
    });
    expect(result.success).toBe(true);
  });
});

describe('CulturalPreferenceSchema', () => {
  it('accepts valid cuisine code', () => {
    const result = CulturalPreferenceSchema.safeParse({ cuisine_code: 'jamaican' });
    expect(result.success).toBe(true);
  });

  it('rejects weight_override above 0.10', () => {
    const result = CulturalPreferenceSchema.safeParse({
      cuisine_code: 'jamaican',
      weight_override: 0.15,
    });
    expect(result.success).toBe(false);
  });
});

describe('CheckInChipPairSchema', () => {
  it('validates all fields are present', () => {
    const validPair = {
      id: 'energy',
      left_label: 'Tired',
      right_label: 'Energetic',
      left_vata_delta: 0.08,
      left_pitta_delta: 0,
      left_kapha_delta: 0,
      right_vata_delta: -0.05,
      right_pitta_delta: 0,
      right_kapha_delta: 0,
    };
    expect(CheckInChipPairSchema.safeParse(validPair).success).toBe(true);
  });

  it('rejects missing left_label', () => {
    const invalid = {
      id: 'energy',
      right_label: 'Energetic',
      left_vata_delta: 0.08,
      left_pitta_delta: 0,
      left_kapha_delta: 0,
      right_vata_delta: -0.05,
      right_pitta_delta: 0,
      right_kapha_delta: 0,
    };
    expect(CheckInChipPairSchema.safeParse(invalid).success).toBe(false);
  });
});
