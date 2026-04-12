import { describe, expect, it } from 'vitest';
import {
  bloodWorkModifierStub,
  culturalMatchModifierStub,
  dailyCheckInModifierStub,
} from '../../modifiers/index.js';

describe('modifier stubs', () => {
  it('bloodWorkModifierStub returns 1.0', () => {
    expect(bloodWorkModifierStub()).toBe(1.0);
  });

  it('culturalMatchModifierStub returns 1.0', () => {
    expect(culturalMatchModifierStub()).toBe(1.0);
  });

  it('dailyCheckInModifierStub returns 1.0', () => {
    expect(dailyCheckInModifierStub()).toBe(1.0);
  });
});
