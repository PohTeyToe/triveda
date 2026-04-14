import { describe, expect, it } from 'vitest';
import {
  BREATHWORK_ROTATION_ORDER,
  CHIP_TO_FIELD_MAP,
  COPY_DENY_LIST,
  COPY_TEMPLATES,
  MIN_CHECKINS_FOR_DETECTION,
  SUPPRESSION_DURATIONS,
  TRIGGER_THRESHOLD,
  TRIGGER_WEIGHTS,
  TRIGGER_WINDOW_DAYS,
} from '../trigger-config.js';
import type { TriggerType } from '../types.js';

describe('trigger-config constants', () => {
  it('MIN_CHECKINS_FOR_DETECTION is 5', () => {
    expect(MIN_CHECKINS_FOR_DETECTION).toBe(5);
  });

  it('TRIGGER_WINDOW_DAYS is 7', () => {
    expect(TRIGGER_WINDOW_DAYS).toBe(7);
  });

  it('TRIGGER_THRESHOLD is 3', () => {
    expect(TRIGGER_THRESHOLD).toBe(3);
  });

  it('TRIGGER_WEIGHTS has entries for all 4 TriggerTypes', () => {
    const types: TriggerType[] = ['stress', 'digestive', 'energy', 'sleep'];
    for (const t of types) {
      expect(TRIGGER_WEIGHTS[t]).toBeGreaterThan(0);
    }
  });

  it('sleep has highest weight', () => {
    expect(TRIGGER_WEIGHTS.sleep).toBeGreaterThanOrEqual(TRIGGER_WEIGHTS.energy);
    expect(TRIGGER_WEIGHTS.energy).toBeGreaterThanOrEqual(TRIGGER_WEIGHTS.stress);
    expect(TRIGGER_WEIGHTS.stress).toBeGreaterThanOrEqual(TRIGGER_WEIGHTS.digestive);
  });

  it('SUPPRESSION_DURATIONS matches spec', () => {
    expect(SUPPRESSION_DURATIONS.got_it).toBe(0);
    expect(SUPPRESSION_DURATIONS.remind_me).toBe(7);
    expect(SUPPRESSION_DURATIONS.not_interested).toBe(30);
  });

  it('CHIP_TO_FIELD_MAP has one entry per TriggerType', () => {
    const types = new Set(CHIP_TO_FIELD_MAP.map((m) => m.triggerType));
    expect(types.size).toBe(4);
  });

  it('stress maps to mood field with [poor, bad]', () => {
    const m = CHIP_TO_FIELD_MAP.find((x) => x.triggerType === 'stress');
    expect(m?.field).toBe('mood');
    expect(m?.matchValues).toEqual(['poor', 'bad']);
  });

  it('energy maps to energy field with [low]', () => {
    const m = CHIP_TO_FIELD_MAP.find((x) => x.triggerType === 'energy');
    expect(m?.field).toBe('energy');
    expect(m?.matchValues).toEqual(['low']);
  });

  it('digestive maps to digestion field with [poor, bad]', () => {
    const m = CHIP_TO_FIELD_MAP.find((x) => x.triggerType === 'digestive');
    expect(m?.field).toBe('digestion');
    expect(m?.matchValues).toEqual(['poor', 'bad']);
  });

  it('sleep maps to sleepQuality field with [groggy]', () => {
    const m = CHIP_TO_FIELD_MAP.find((x) => x.triggerType === 'sleep');
    expect(m?.field).toBe('sleepQuality');
    expect(m?.matchValues).toEqual(['groggy']);
  });

  it('COPY_TEMPLATES has entry for each TriggerType', () => {
    const types: TriggerType[] = ['stress', 'digestive', 'energy', 'sleep'];
    for (const t of types) {
      expect(COPY_TEMPLATES[t]).toBeTruthy();
    }
  });

  it('no COPY_TEMPLATES value matches any COPY_DENY_LIST entry', () => {
    for (const v of Object.values(COPY_TEMPLATES)) {
      for (const deny of COPY_DENY_LIST) {
        expect(v.toLowerCase()).not.toContain(deny.toLowerCase());
      }
    }
  });

  it('BREATHWORK_ROTATION_ORDER has exactly 3 entries', () => {
    expect(BREATHWORK_ROTATION_ORDER).toHaveLength(3);
  });
});
