import { describe, expect, it } from 'bun:test';
import {
  normalizeAHS,
  normalizeGeneric,
  normalizeLabCorp,
  normalizeLifeLabs,
  normalizeQuest,
} from '../../src/workers/blood-work/normalizers/index.js';
import type { RawBiomarker } from '../../src/workers/blood-work/types.js';

function raw(name: string, value: string, unit: string, referenceRange = ''): RawBiomarker {
  return { name, value, unit, referenceRange, pageIndex: 0 };
}

describe('LifeLabs normalizer', () => {
  it('maps "25-OH Vitamin D" to canonical key vitamin_d_25_oh', () => {
    const result = normalizeLifeLabs(raw('25-OH Vitamin D', '42', 'nmol/L', '75 - 250'));
    expect(result?.canonicalKey).toBe('vitamin_d_25_oh');
    expect(result?.unit).toBe('nmol/L');
    expect(result?.flag).toBe('low');
  });

  it('maps "Vitamin D, 25-Hydroxy" to canonical key vitamin_d_25_oh', () => {
    const result = normalizeLifeLabs(raw('Vitamin D, 25-Hydroxy', '60', 'nmol/L'));
    expect(result?.canonicalKey).toBe('vitamin_d_25_oh');
  });

  it('maps "Ferritin" to canonical key ferritin', () => {
    const result = normalizeLifeLabs(raw('Ferritin', '50', 'ug/L', '20 - 200'));
    expect(result?.canonicalKey).toBe('ferritin');
    expect(result?.flag).toBe('normal');
  });

  it('returns null for unrecognized biomarker names', () => {
    const result = normalizeLifeLabs(raw('Some Unknown Marker', '1', 'mg/L'));
    expect(result).toBeNull();
  });

  it('computes low flag when value below reference range', () => {
    const result = normalizeLifeLabs(raw('Ferritin', '15', 'ug/L', '20 - 200'));
    expect(result?.flag).toBe('low');
  });

  it('computes high flag when value above reference range', () => {
    const result = normalizeLifeLabs(raw('LDL Cholesterol', '4.2', 'mmol/L', '< 3.4'));
    expect(result?.flag).toBe('high');
  });
});

describe('Quest normalizer', () => {
  it('maps "Vitamin D, 25-OH, Total" to canonical key vitamin_d_25_oh', () => {
    const result = normalizeQuest(raw('Vitamin D, 25-OH, Total', '30', 'ng/mL'));
    expect(result?.canonicalKey).toBe('vitamin_d_25_oh');
  });

  it('converts ng/mL to nmol/L for vitamin D (value * 2.496)', () => {
    const result = normalizeQuest(raw('Vitamin D, 25-OH, Total', '30', 'ng/mL'));
    expect(result?.value).toBeCloseTo(74.88, 1);
    expect(result?.unit).toBe('nmol/L');
    expect(result?.originalUnit).toBe('ng/mL');
  });

  it('converts mg/dL to mmol/L for glucose (value * 0.05551)', () => {
    const result = normalizeQuest(raw('Glucose, Fasting', '92', 'mg/dL', '65 - 99'));
    expect(result?.value).toBeCloseTo(92 * 0.05551, 3);
    expect(result?.unit).toBe('mmol/L');
    expect(result?.flag).toBe('normal');
  });

  it('converts reference ranges to canonical units', () => {
    const result = normalizeQuest(raw('LDL Cholesterol', '148', 'mg/dL', '< 130'));
    expect(result?.unit).toBe('mmol/L');
    expect(result?.referenceRangeHigh).toBeCloseTo(130 * 0.02586, 3);
    expect(result?.flag).toBe('high');
  });
});

describe('LabCorp normalizer', () => {
  it('maps "25(OH)D" to canonical key vitamin_d_25_oh', () => {
    const result = normalizeLabCorp(raw('25(OH)D', '17', 'ng/mL', '30 - 100'));
    expect(result?.canonicalKey).toBe('vitamin_d_25_oh');
    expect(result?.flag).toBe('low');
  });

  it('maps "LDL Chol Calc (NIH)" to canonical key ldl_cholesterol', () => {
    const result = normalizeLabCorp(raw('LDL Chol Calc (NIH)', '100', 'mg/dL'));
    expect(result?.canonicalKey).toBe('ldl_cholesterol');
  });

  it('converts conventional units to SI for glucose', () => {
    const result = normalizeLabCorp(raw('Glucose', '90', 'mg/dL'));
    expect(result?.unit).toBe('mmol/L');
    expect(result?.value).toBeCloseTo(90 * 0.05551, 3);
  });
});

describe('AHS normalizer', () => {
  it('maps "25-Hydroxyvitamin D" to canonical key vitamin_d_25_oh', () => {
    const result = normalizeAHS(raw('25-Hydroxyvitamin D', '50', 'nmol/L'));
    expect(result?.canonicalKey).toBe('vitamin_d_25_oh');
  });

  it('preserves SI units (no conversion needed)', () => {
    const result = normalizeAHS(raw('Glucose (fasting)', '5.2', 'mmol/L'));
    expect(result?.unit).toBe('mmol/L');
    expect(result?.value).toBe(5.2);
    expect(result?.originalUnit).toBeNull();
  });
});

describe('Generic normalizer', () => {
  it('recognizes vendor aliases from any source', () => {
    expect(normalizeGeneric(raw('25-OH Vitamin D', '42', 'nmol/L'))?.canonicalKey).toBe(
      'vitamin_d_25_oh',
    );
    expect(normalizeGeneric(raw('Vitamin D, 25-OH, Total', '30', 'ng/mL'))?.canonicalKey).toBe(
      'vitamin_d_25_oh',
    );
    expect(normalizeGeneric(raw('25(OH)D', '17', 'ng/mL'))?.canonicalKey).toBe('vitamin_d_25_oh');
  });

  it('uses a slightly lower base confidence', () => {
    const result = normalizeGeneric(raw('Ferritin', '50', 'ug/L'));
    expect(result?.confidence).toBeLessThan(0.95);
  });
});

describe('Reference range parsing', () => {
  it('parses "75 - 250 nmol/L" into low/high bounds', () => {
    const result = normalizeLifeLabs(raw('25-OH Vitamin D', '100', 'nmol/L', '75 - 250 nmol/L'));
    expect(result?.referenceRangeLow).toBe(75);
    expect(result?.referenceRangeHigh).toBe(250);
  });

  it('parses ">30" as low=30, high=null', () => {
    const result = normalizeLifeLabs(raw('HDL Cholesterol', '1.2', 'mmol/L', '> 1.0'));
    expect(result?.referenceRangeLow).toBe(1);
    expect(result?.referenceRangeHigh).toBeNull();
  });

  it('parses "<=4.0" as low=null, high=4.0', () => {
    const result = normalizeLifeLabs(raw('TSH', '2.1', 'mIU/L', '<= 4.0'));
    expect(result?.referenceRangeLow).toBeNull();
    expect(result?.referenceRangeHigh).toBe(4);
  });
});

describe('Flag computation', () => {
  it('assigns normal when value in range', () => {
    expect(normalizeLifeLabs(raw('Ferritin', '100', 'ug/L', '20 - 200'))?.flag).toBe('normal');
  });

  it('assigns low when below range', () => {
    expect(normalizeLifeLabs(raw('Ferritin', '10', 'ug/L', '20 - 200'))?.flag).toBe('low');
  });

  it('assigns high when above range', () => {
    expect(normalizeLifeLabs(raw('LDL Cholesterol', '4.0', 'mmol/L', '< 3.4'))?.flag).toBe('high');
  });

  it('assigns critical when far outside range', () => {
    // Range 20-200, delta=180, critical if value > 200 + 360 = 560
    expect(normalizeLifeLabs(raw('Ferritin', '800', 'ug/L', '20 - 200'))?.flag).toBe('critical');
  });
});
