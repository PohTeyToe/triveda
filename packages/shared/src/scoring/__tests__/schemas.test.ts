import { describe, expect, it } from 'vitest';
import {
  FeedbackResponseSchema,
  FoodAyurvedaSchema,
  FoodFeedbackSchema,
  FoodForScoringSchema,
  FoodTCMSchema,
  ModifierValuesSchema,
  RituSchema,
  TCMElementSchema,
  ThermalNatureSchema,
} from '../schemas.js';

describe('RituSchema', () => {
  it('accepts valid ritu values', () => {
    for (const r of ['shishira', 'vasanta', 'grishma', 'varsha', 'sharad', 'hemanta']) {
      expect(RituSchema.parse(r)).toBe(r);
    }
  });

  it('rejects invalid values', () => {
    expect(() => RituSchema.parse('summer')).toThrow();
  });
});

describe('TCMElementSchema', () => {
  it('accepts all 5 elements', () => {
    for (const e of ['wood', 'fire', 'earth', 'metal', 'water']) {
      expect(TCMElementSchema.parse(e)).toBe(e);
    }
  });

  it('rejects invalid values', () => {
    expect(() => TCMElementSchema.parse('air')).toThrow();
  });
});

describe('ThermalNatureSchema', () => {
  it('accepts all 5 thermal natures', () => {
    for (const t of ['hot', 'warm', 'neutral', 'cool', 'cold']) {
      expect(ThermalNatureSchema.parse(t)).toBe(t);
    }
  });
});

describe('FeedbackResponseSchema', () => {
  it('accepts valid responses', () => {
    for (const r of ['accepted', 'rejected', 'ignored']) {
      expect(FeedbackResponseSchema.parse(r)).toBe(r);
    }
  });
});

describe('FoodForScoringSchema', () => {
  const validFood = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Ginger',
    tags: ['spice'],
    ayurveda: {
      vataEffect: -1,
      pittaEffect: 0.5,
      kaphaEffect: -1.5,
      rituFit: {
        shishira: 0.8,
        vasanta: 0.6,
        grishma: 0.3,
        varsha: 0.7,
        sharad: 0.5,
        hemanta: 0.9,
      },
    },
    tcm: {
      thermalNature: 'warm',
      organAffinity: ['stomach', 'lung'],
      elementFit: { wood: 0.2, fire: 0.7, earth: 0.5, metal: 0.3, water: 0.1 },
    },
  };

  it('accepts valid food input', () => {
    const result = FoodForScoringSchema.parse(validFood);
    expect(result.name).toBe('Ginger');
  });

  it('accepts food with contraindications', () => {
    const result = FoodForScoringSchema.parse({
      ...validFood,
      contraindications: ['pregnancy'],
    });
    expect(result.contraindications).toEqual(['pregnancy']);
  });

  it('rejects empty name', () => {
    expect(() => FoodForScoringSchema.parse({ ...validFood, name: '' })).toThrow();
  });

  it('rejects invalid UUID', () => {
    expect(() => FoodForScoringSchema.parse({ ...validFood, id: 'not-a-uuid' })).toThrow();
  });

  it('rejects dosha effect out of range', () => {
    expect(() =>
      FoodForScoringSchema.parse({
        ...validFood,
        ayurveda: { ...validFood.ayurveda, vataEffect: 3 },
      }),
    ).toThrow();
  });
});

describe('FoodFeedbackSchema', () => {
  it('accepts valid feedback', () => {
    const result = FoodFeedbackSchema.parse({
      foodId: '550e8400-e29b-41d4-a716-446655440000',
      date: '2026-04-12',
      response: 'accepted',
    });
    expect(result.response).toBe('accepted');
  });

  it('rejects invalid date format', () => {
    expect(() =>
      FoodFeedbackSchema.parse({
        foodId: '550e8400-e29b-41d4-a716-446655440000',
        date: 'April 12',
        response: 'accepted',
      }),
    ).toThrow();
  });
});

describe('ModifierValuesSchema', () => {
  it('accepts all fields undefined (empty object)', () => {
    const result = ModifierValuesSchema.parse({});
    expect(result.bloodWork).toBeUndefined();
    expect(result.culturalMatch).toBeUndefined();
    expect(result.dailyCheckIn).toBeUndefined();
  });

  it('accepts valid modifier values', () => {
    const result = ModifierValuesSchema.parse({
      bloodWork: 1.05,
      culturalMatch: 1.05,
      dailyCheckIn: 1.0,
    });
    expect(result.bloodWork).toBe(1.05);
  });

  it('rejects bloodWork out of range', () => {
    expect(() => ModifierValuesSchema.parse({ bloodWork: 1.5 })).toThrow();
    expect(() => ModifierValuesSchema.parse({ bloodWork: 0.5 })).toThrow();
  });

  it('rejects culturalMatch below 1.0', () => {
    expect(() => ModifierValuesSchema.parse({ culturalMatch: 0.9 })).toThrow();
  });
});
