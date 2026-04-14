import { describe, expect, it } from 'bun:test';
import { detectVendor } from '../../src/workers/blood-work/detect-vendor.js';

describe('detectVendor', () => {
  it('returns lifelabs for a LifeLabs header', () => {
    expect(detectVendor('LifeLabs Patient Report')).toBe('lifelabs');
  });

  it('returns quest for a Quest Diagnostics header', () => {
    expect(detectVendor('Quest Diagnostics\nLaboratory Report')).toBe('quest');
  });

  it('returns labcorp for a LabCorp header', () => {
    expect(detectVendor('LabCorp Laboratory Report')).toBe('labcorp');
    expect(detectVendor('Laboratory Corporation of America')).toBe('labcorp');
  });

  it('returns ahs for Alberta Health Services', () => {
    expect(detectVendor('Alberta Health Services')).toBe('ahs');
  });

  it('returns unknown when no vendor markers present', () => {
    expect(detectVendor('Some random document')).toBe('unknown');
  });

  it('is case-insensitive', () => {
    expect(detectVendor('LIFELABS')).toBe('lifelabs');
    expect(detectVendor('lifelabs')).toBe('lifelabs');
  });

  it('returns first match when multiple vendors appear', () => {
    // LifeLabs comes first in the ladder
    expect(detectVendor('LifeLabs  Quest Diagnostics')).toBe('lifelabs');
  });

  it('returns unknown for empty input', () => {
    expect(detectVendor('')).toBe('unknown');
  });
});
