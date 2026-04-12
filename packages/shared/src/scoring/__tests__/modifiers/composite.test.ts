import { describe, expect, it } from 'vitest';
import { computeCompositeModifier } from '../../modifiers/index.js';

describe('computeCompositeModifier', () => {
  it('single modifier 1.1 -> 1.1 (within clamp range)', () => {
    expect(computeCompositeModifier([1.1])).toBeCloseTo(1.1, 10);
  });

  it('single modifier 0.9 -> 0.9 (within clamp range)', () => {
    expect(computeCompositeModifier([0.9])).toBeCloseTo(0.9, 10);
  });

  it('three modifiers 1.2 * 1.1 * 1.1 = 1.452 -> clamped to 1.25', () => {
    const product = 1.2 * 1.1 * 1.1;
    expect(product).toBeGreaterThan(1.25);
    expect(computeCompositeModifier([1.2, 1.1, 1.1])).toBeCloseTo(1.25, 10);
  });

  it('three modifiers 0.8 * 0.9 * 0.9 = 0.648 -> clamped to 0.8', () => {
    const product = 0.8 * 0.9 * 0.9;
    expect(product).toBeLessThan(0.8);
    expect(computeCompositeModifier([0.8, 0.9, 0.9])).toBeCloseTo(0.8, 10);
  });

  it('empty values array -> 1.0 (no modifiers)', () => {
    expect(computeCompositeModifier([])).toBe(1.0);
  });

  it('modifier exactly at MODIFIER_CLAMP.min (0.8) -> no clamping', () => {
    expect(computeCompositeModifier([0.8])).toBeCloseTo(0.8, 10);
  });

  it('modifier exactly at MODIFIER_CLAMP.max (1.25) -> no clamping', () => {
    expect(computeCompositeModifier([1.25])).toBeCloseTo(1.25, 10);
  });

  it('single modifier 1.0 -> 1.0 (identity)', () => {
    expect(computeCompositeModifier([1.0])).toBe(1.0);
  });

  it('all modifiers at 1.0 -> composite is 1.0', () => {
    expect(computeCompositeModifier([1.0, 1.0, 1.0])).toBe(1.0);
  });
});
