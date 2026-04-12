import { describe, expect, it } from 'vitest';
import type { DailyCheckInAnswer } from '../../inputs/types.js';
import { CHIP_PAIRS, computeCheckInDelta } from '../index.js';

function makeAnswer(selections: Record<string, 'left' | 'right' | null>): DailyCheckInAnswer {
  return {
    date: '2026-04-12',
    selections,
    dismissed: false,
    synced: false,
  };
}

describe('CHIP_PAIRS', () => {
  it('has exactly 6 pairs', () => {
    expect(CHIP_PAIRS.length).toBe(6);
  });

  it('each chip pair has all required fields', () => {
    for (const pair of CHIP_PAIRS) {
      expect(pair.id).toBeTruthy();
      expect(pair.left_label).toBeTruthy();
      expect(pair.right_label).toBeTruthy();
      expect(typeof pair.left_vata_delta).toBe('number');
      expect(typeof pair.left_pitta_delta).toBe('number');
      expect(typeof pair.left_kapha_delta).toBe('number');
      expect(typeof pair.right_vata_delta).toBe('number');
      expect(typeof pair.right_pitta_delta).toBe('number');
      expect(typeof pair.right_kapha_delta).toBe('number');
      expect(pair.description).toBeTruthy();
    }
  });

  it('all pair IDs are unique', () => {
    const ids = new Set(CHIP_PAIRS.map((p) => p.id));
    expect(ids.size).toBe(6);
  });
});

describe('computeCheckInDelta', () => {
  it('returns zero deltas for empty selections', () => {
    const result = computeCheckInDelta(makeAnswer({}));
    expect(result).toEqual({ vata: 0, pitta: 0, kapha: 0 });
  });

  it('computes delta with dismissed answer (does not check dismissed)', () => {
    // computeCheckInDelta does NOT check dismissed -- scoring.ts does that
    const answer: DailyCheckInAnswer = {
      date: '2026-04-12',
      selections: { energy: 'left' },
      dismissed: true,
      synced: false,
    };
    const result = computeCheckInDelta(answer);
    expect(result.vata).toBeCloseTo(0.08);
  });

  it('computes correct delta for "Tired" selected', () => {
    const result = computeCheckInDelta(makeAnswer({ energy: 'left' }));
    expect(result.vata).toBeCloseTo(0.08);
    expect(result.pitta).toBeCloseTo(0);
    expect(result.kapha).toBeCloseTo(0);
  });

  it('computes correct delta for "Anxious" selected', () => {
    const result = computeCheckInDelta(makeAnswer({ anxiety: 'left' }));
    expect(result.vata).toBeCloseTo(0.06);
    expect(result.pitta).toBeCloseTo(0.04);
    expect(result.kapha).toBeCloseTo(0);
  });

  it('clamps vata when "Tired" and "Cold" selected', () => {
    const result = computeCheckInDelta(makeAnswer({ energy: 'left', temperature: 'right' }));
    // Raw: 0.08 + 0.08 = 0.16, clamped to 0.1
    expect(result.vata).toBeCloseTo(0.1);
    expect(result.pitta).toBeCloseTo(0);
    expect(result.kapha).toBeCloseTo(0);
  });

  it('clamps vata to +0.1 when all left chips selected', () => {
    const selections: Record<string, 'left'> = {};
    for (const pair of CHIP_PAIRS) {
      selections[pair.id] = 'left';
    }
    const result = computeCheckInDelta(makeAnswer(selections));
    expect(result.vata).toBeLessThanOrEqual(0.1);
  });

  it('clamps pitta to +0.1 when all left chips selected', () => {
    const selections: Record<string, 'left'> = {};
    for (const pair of CHIP_PAIRS) {
      selections[pair.id] = 'left';
    }
    const result = computeCheckInDelta(makeAnswer(selections));
    expect(result.pitta).toBeLessThanOrEqual(0.1);
  });

  it('computes correct delta for opposing selections (Tired + Calm)', () => {
    const result = computeCheckInDelta(makeAnswer({ energy: 'left', anxiety: 'right' }));
    expect(result.vata).toBeCloseTo(0.08 + -0.04);
    expect(result.pitta).toBeCloseTo(0 + -0.03);
    expect(result.kapha).toBeCloseTo(0);
  });

  it('never returns any dosha outside [-0.1, +0.1] for all combinations', () => {
    // Exhaustive test: 3^6 = 729 combinations (left/right/null per pair)
    const choices: Array<'left' | 'right' | null> = ['left', 'right', null];
    const pairIds = CHIP_PAIRS.map((p) => p.id);

    function* generateCombinations(
      index: number,
      current: Record<string, 'left' | 'right' | null>,
    ): Generator<Record<string, 'left' | 'right' | null>> {
      if (index === pairIds.length) {
        yield { ...current };
        return;
      }
      for (const choice of choices) {
        const key = pairIds[index] ?? '';
        current[key] = choice;
        yield* generateCombinations(index + 1, current);
      }
    }

    let count = 0;
    for (const selections of generateCombinations(0, {})) {
      const result = computeCheckInDelta(makeAnswer(selections));
      expect(result.vata).toBeGreaterThanOrEqual(-0.1);
      expect(result.vata).toBeLessThanOrEqual(0.1);
      expect(result.pitta).toBeGreaterThanOrEqual(-0.1);
      expect(result.pitta).toBeLessThanOrEqual(0.1);
      expect(result.kapha).toBeGreaterThanOrEqual(-0.1);
      expect(result.kapha).toBeLessThanOrEqual(0.1);
      count++;
    }
    expect(count).toBe(729);
  });

  it('table-driven test for every individual chip', () => {
    const expected = [
      { id: 'energy', side: 'left' as const, vata: 0.08, pitta: 0, kapha: 0 },
      { id: 'energy', side: 'right' as const, vata: -0.05, pitta: 0, kapha: 0 },
      { id: 'anxiety', side: 'left' as const, vata: 0.06, pitta: 0.04, kapha: 0 },
      { id: 'anxiety', side: 'right' as const, vata: -0.04, pitta: -0.03, kapha: 0 },
      { id: 'digestion', side: 'left' as const, vata: 0, pitta: 0, kapha: 0.08 },
      { id: 'digestion', side: 'right' as const, vata: 0.05, pitta: 0, kapha: -0.03 },
      { id: 'temperature', side: 'left' as const, vata: 0, pitta: 0.08, kapha: 0 },
      { id: 'temperature', side: 'right' as const, vata: 0.08, pitta: 0, kapha: 0 },
      { id: 'rest', side: 'left' as const, vata: -0.03, pitta: -0.02, kapha: -0.02 },
      { id: 'rest', side: 'right' as const, vata: 0, pitta: 0, kapha: 0.07 },
      { id: 'appetite', side: 'left' as const, vata: 0, pitta: 0.06, kapha: 0 },
      { id: 'appetite', side: 'right' as const, vata: 0, pitta: 0, kapha: 0.05 },
    ];

    for (const tc of expected) {
      const result = computeCheckInDelta(makeAnswer({ [tc.id]: tc.side }));
      expect(result.vata).toBeCloseTo(tc.vata, 10);
      expect(result.pitta).toBeCloseTo(tc.pitta, 10);
      expect(result.kapha).toBeCloseTo(tc.kapha, 10);
    }
  });
});
