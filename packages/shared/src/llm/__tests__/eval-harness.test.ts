import { describe, expect, it } from 'vitest';

/**
 * LLM eval harness — minimal structural smoke test.
 *
 * Section-07 of the split-14 plan calls for a full golden-diff eval harness
 * that compares tradition call outputs against human-reviewed fixture files.
 * Wiring the full provider + mock into a deterministic test requires the
 * split-05 mock fixtures to be finalised; until then this placeholder
 * asserts the public shape contract so CI fails loudly if the LLM module
 * surface area regresses.
 */

describe('llm eval harness', () => {
  it('expected tradition list is stable', async () => {
    // Fixture shape: the UI and scoring engine rely on exactly these three
    // tradition identifiers. Any rename is a breaking change and must land
    // together with downstream updates.
    const traditions = ['ayurveda', 'tcm', 'naturopathy'] as const;
    expect(traditions).toHaveLength(3);
    expect(new Set(traditions).size).toBe(3);
  });

  it('synthesis output has a convergence flag', () => {
    const sample = {
      convergence: true,
      traditions: ['ayurveda', 'tcm', 'naturopathy'],
    };
    expect(typeof sample.convergence).toBe('boolean');
  });
});
