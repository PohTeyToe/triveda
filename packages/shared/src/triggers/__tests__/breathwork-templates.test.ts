import { describe, expect, it } from 'vitest';
import {
  BREATHWORK_TEMPLATES,
  getBreathworkByRotation,
  getBreathworkTemplate,
} from '../breathwork-templates.js';
import { BREATHWORK_ROTATION_ORDER } from '../trigger-config.js';

describe('BREATHWORK_TEMPLATES', () => {
  it('has exactly 3 entries', () => {
    expect(BREATHWORK_TEMPLATES).toHaveLength(3);
  });

  it('IDs match BREATHWORK_ROTATION_ORDER', () => {
    const ids = BREATHWORK_TEMPLATES.map((t) => t.id);
    expect(ids).toEqual([...BREATHWORK_ROTATION_ORDER]);
  });

  it('4-7-8 has evidenceTier traditional', () => {
    const t = BREATHWORK_TEMPLATES.find((x) => x.id === 'four-seven-eight');
    expect(t?.evidenceTier).toBe('traditional');
  });

  it('nadi-shodhana has evidenceTier moderate', () => {
    const t = BREATHWORK_TEMPLATES.find((x) => x.id === 'nadi-shodhana');
    expect(t?.evidenceTier).toBe('moderate');
  });

  it('box-breathing has evidenceTier moderate', () => {
    const t = BREATHWORK_TEMPLATES.find((x) => x.id === 'box-breathing');
    expect(t?.evidenceTier).toBe('moderate');
  });

  it('each template has non-empty steps and duration > 0', () => {
    for (const t of BREATHWORK_TEMPLATES) {
      expect(t.steps.length).toBeGreaterThan(0);
      expect(t.durationMinutes).toBeGreaterThan(0);
      expect(t.whyThisHelps.length).toBeGreaterThan(0);
    }
  });
});

describe('getBreathworkTemplate', () => {
  it('returns 4-7-8 by id', () => {
    expect(getBreathworkTemplate('four-seven-eight')?.name).toBe('4-7-8 Breathing');
  });
  it('returns undefined for unknown id', () => {
    expect(getBreathworkTemplate('nonexistent')).toBeUndefined();
  });
});

describe('getBreathworkByRotation', () => {
  it('index 0 -> 4-7-8', () => {
    expect(getBreathworkByRotation(0).id).toBe('four-seven-eight');
  });
  it('index 1 -> nadi-shodhana', () => {
    expect(getBreathworkByRotation(1).id).toBe('nadi-shodhana');
  });
  it('index 2 -> box-breathing', () => {
    expect(getBreathworkByRotation(2).id).toBe('box-breathing');
  });
  it('index 3 wraps to 4-7-8', () => {
    expect(getBreathworkByRotation(3).id).toBe('four-seven-eight');
  });
  it('index 100 returns a valid template', () => {
    const t = getBreathworkByRotation(100);
    expect(BREATHWORK_TEMPLATES.some((x) => x.id === t.id)).toBe(true);
  });
});
