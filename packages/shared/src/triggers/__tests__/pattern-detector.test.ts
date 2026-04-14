import { describe, expect, it } from 'vitest';
import type { ConstitutionalProfile } from '../../engines/types.js';
import { detectPatterns } from '../pattern-detector.js';
import type { DailyCheckIn, UserState } from '../types.js';

function mkProfile(
  vata = 0.4,
  pitta = 0.3,
  kapha = 0.3,
): ConstitutionalProfile {
  return {
    doshaScores: { vata, pitta, kapha },
    doshaType: { type: 'tridoshic', primary: 'vata', secondary: 'pitta', tertiary: 'kapha' },
    elementScores: null,
    primaryElement: null,
    secondaryElement: null,
    metabolicType: null,
    ansDominance: null,
    completeness: 100,
    confidence: 0.8,
    summary: '',
  };
}

function mkCheckIn(overrides: Partial<DailyCheckIn> & { date: string }): DailyCheckIn {
  return {
    date: overrides.date,
    mood: overrides.mood ?? 'okay',
    energy: overrides.energy ?? 'medium',
    digestion: overrides.digestion ?? 'okay',
    sleepQuality: overrides.sleepQuality,
    symptoms: overrides.symptoms,
  };
}

function daysBack(now: string, n: number): string {
  const [y, m, d] = now.slice(0, 10).split('-').map(Number);
  const date = new Date(Date.UTC(y as number, (m as number) - 1, d as number));
  date.setUTCDate(date.getUTCDate() - n);
  return date.toISOString().slice(0, 10);
}

function mkState(
  checkIns: DailyCheckIn[],
  overrides: Partial<UserState> = {},
): UserState {
  return {
    profile: mkProfile(),
    recentCheckIns: checkIns,
    triggerState: [],
    triggerFeedbackHistory: [],
    ...overrides,
  };
}

const NOW = '2026-04-10T12:00:00Z';

describe('detectPatterns — gating', () => {
  it('returns [] when fewer than MIN_CHECKINS_FOR_DETECTION check-ins', () => {
    const checkIns = [
      mkCheckIn({ date: daysBack(NOW, 1), mood: 'bad' }),
      mkCheckIn({ date: daysBack(NOW, 2), mood: 'bad' }),
      mkCheckIn({ date: daysBack(NOW, 3), mood: 'bad' }),
      mkCheckIn({ date: daysBack(NOW, 4), mood: 'bad' }),
    ];
    expect(detectPatterns(mkState(checkIns), NOW)).toEqual([]);
  });

  it('returns [] with zero check-ins', () => {
    expect(detectPatterns(mkState([]), NOW)).toEqual([]);
  });

  it('returns [] when all rules return null (neutral check-ins)', () => {
    const checkIns = Array.from({ length: 7 }, (_, i) =>
      mkCheckIn({ date: daysBack(NOW, i + 1), mood: 'good', energy: 'high', digestion: 'good' }),
    );
    expect(detectPatterns(mkState(checkIns), NOW)).toEqual([]);
  });
});

describe('detectPatterns — stress rule', () => {
  it('3 anxious check-ins in 7 days fires stress', () => {
    const checkIns: DailyCheckIn[] = [
      mkCheckIn({ date: daysBack(NOW, 1), mood: 'bad' }),
      mkCheckIn({ date: daysBack(NOW, 2), mood: 'poor' }),
      mkCheckIn({ date: daysBack(NOW, 3), mood: 'bad' }),
      mkCheckIn({ date: daysBack(NOW, 4), mood: 'okay' }),
      mkCheckIn({ date: daysBack(NOW, 5), mood: 'good' }),
    ];
    const result = detectPatterns(mkState(checkIns), NOW);
    expect(result.length).toBeGreaterThanOrEqual(1);
    const stress = result.find((r) => r.type === 'stress');
    expect(stress).toBeDefined();
    expect(stress?.display).toBe(true);
    expect(stress?.recommendation.learnMore).toBeDefined();
  });

  it('2 anxious check-ins does NOT fire', () => {
    const checkIns: DailyCheckIn[] = [
      mkCheckIn({ date: daysBack(NOW, 1), mood: 'bad' }),
      mkCheckIn({ date: daysBack(NOW, 2), mood: 'poor' }),
      mkCheckIn({ date: daysBack(NOW, 3), mood: 'okay' }),
      mkCheckIn({ date: daysBack(NOW, 4), mood: 'okay' }),
      mkCheckIn({ date: daysBack(NOW, 5), mood: 'good' }),
    ];
    const result = detectPatterns(mkState(checkIns), NOW);
    expect(result.find((r) => r.type === 'stress')).toBeUndefined();
  });

  it('3 anxious check-ins older than 7 days does NOT fire', () => {
    const checkIns: DailyCheckIn[] = Array.from({ length: 5 }, (_, i) =>
      mkCheckIn({ date: daysBack(NOW, 10 + i), mood: 'bad' }),
    );
    const result = detectPatterns(mkState(checkIns), NOW);
    expect(result).toEqual([]);
  });
});

describe('detectPatterns — energy rule and foodBias', () => {
  it('3 low energy check-ins fires energy with foodBias', () => {
    const checkIns: DailyCheckIn[] = [
      mkCheckIn({ date: daysBack(NOW, 1), energy: 'low' }),
      mkCheckIn({ date: daysBack(NOW, 2), energy: 'low' }),
      mkCheckIn({ date: daysBack(NOW, 3), energy: 'low' }),
      mkCheckIn({ date: daysBack(NOW, 4), energy: 'high' }),
      mkCheckIn({ date: daysBack(NOW, 5), energy: 'medium' }),
    ];
    const result = detectPatterns(mkState(checkIns), NOW);
    const energy = result.find((r) => r.type === 'energy');
    expect(energy).toBeDefined();
    expect(energy?.foodBias?.tag).toBe('ojas_building');
    expect(energy?.foodBias?.multiplier).toBeCloseTo(1.1);
    expect(energy?.foodBias?.expiresAfterDays).toBe(1);
  });
});

describe('detectPatterns — digestive rule tea selection', () => {
  it('Vata-dominant user gets ginger tea recommendation', () => {
    const checkIns: DailyCheckIn[] = Array.from({ length: 5 }, (_, i) =>
      mkCheckIn({ date: daysBack(NOW, i + 1), digestion: i < 3 ? 'bad' : 'okay' }),
    );
    const state = mkState(checkIns, { profile: mkProfile(0.6, 0.2, 0.2) });
    const result = detectPatterns(state, NOW);
    const dig = result.find((r) => r.type === 'digestive');
    expect(dig?.recommendation.body.toLowerCase()).toContain('ginger');
  });

  it('Kapha-dominant user gets CCF tea recommendation', () => {
    const checkIns: DailyCheckIn[] = Array.from({ length: 5 }, (_, i) =>
      mkCheckIn({ date: daysBack(NOW, i + 1), digestion: i < 3 ? 'bad' : 'okay' }),
    );
    const state = mkState(checkIns, { profile: mkProfile(0.2, 0.2, 0.6) });
    const result = detectPatterns(state, NOW);
    const dig = result.find((r) => r.type === 'digestive');
    expect(dig?.recommendation.body.toLowerCase()).toContain('cumin');
  });
});

describe('detectPatterns — sleep rule', () => {
  it('3 groggy sleepQuality values fire', () => {
    const checkIns: DailyCheckIn[] = [
      mkCheckIn({ date: daysBack(NOW, 1), sleepQuality: 'groggy' }),
      mkCheckIn({ date: daysBack(NOW, 2), sleepQuality: 'groggy' }),
      mkCheckIn({ date: daysBack(NOW, 3), sleepQuality: 'groggy' }),
      mkCheckIn({ date: daysBack(NOW, 4), sleepQuality: 'rested' }),
      mkCheckIn({ date: daysBack(NOW, 5), sleepQuality: 'rested' }),
    ];
    const result = detectPatterns(mkState(checkIns), NOW);
    expect(result.find((r) => r.type === 'sleep')).toBeDefined();
  });

  it('check-ins without sleepQuality are excluded', () => {
    // 5 check-ins, only 3 have sleepQuality, 2 are groggy -> does NOT fire
    const checkIns: DailyCheckIn[] = [
      mkCheckIn({ date: daysBack(NOW, 1), sleepQuality: 'groggy' }),
      mkCheckIn({ date: daysBack(NOW, 2), sleepQuality: 'groggy' }),
      mkCheckIn({ date: daysBack(NOW, 3), sleepQuality: 'rested' }),
      mkCheckIn({ date: daysBack(NOW, 4) }),
      mkCheckIn({ date: daysBack(NOW, 5) }),
    ];
    const result = detectPatterns(mkState(checkIns), NOW);
    expect(result.find((r) => r.type === 'sleep')).toBeUndefined();
  });
});

describe('detectPatterns — ranking and display', () => {
  it('multiple triggers: highest severity wins display=true', () => {
    // 5 days all bad mood + all low energy -> both fire
    // energy severity = (5-3) * 0.9 = 1.8
    // stress severity = (5-3) * 0.8 = 1.6
    const checkIns: DailyCheckIn[] = Array.from({ length: 5 }, (_, i) =>
      mkCheckIn({ date: daysBack(NOW, i + 1), mood: 'bad', energy: 'low' }),
    );
    const result = detectPatterns(mkState(checkIns), NOW);
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result[0]?.display).toBe(true);
    expect(result[1]?.display).toBe(false);
    // Energy has higher weight — should win
    expect(result[0]?.type).toBe('energy');
  });

  it('suppressed trigger excluded — lower-severity trigger gets display', () => {
    const checkIns: DailyCheckIn[] = Array.from({ length: 5 }, (_, i) =>
      mkCheckIn({ date: daysBack(NOW, i + 1), mood: 'bad', energy: 'low' }),
    );
    const state = mkState(checkIns, {
      triggerState: [
        {
          triggerType: 'energy',
          dismissalType: 'remind_me',
          dismissedAt: NOW,
          suppressedUntil: '2026-04-20T12:00:00Z',
        },
      ],
    });
    const result = detectPatterns(state, NOW);
    expect(result.find((r) => r.type === 'energy')).toBeUndefined();
    expect(result[0]?.type).toBe('stress');
    expect(result[0]?.display).toBe(true);
  });
});

describe('honest copy', () => {
  it('no trigger body contains AI-marketing phrases', () => {
    const checkIns: DailyCheckIn[] = Array.from({ length: 5 }, (_, i) =>
      mkCheckIn({ date: daysBack(NOW, i + 1), mood: 'bad', energy: 'low', digestion: 'bad' }),
    );
    const result = detectPatterns(mkState(checkIns), NOW);
    const denyList = ['AI detected', 'our algorithm', 'machine learning', 'predicted'];
    for (const t of result) {
      for (const phrase of denyList) {
        expect(t.recommendation.body.toLowerCase()).not.toContain(phrase.toLowerCase());
      }
    }
  });
});
