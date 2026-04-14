import { describe, expect, it } from 'bun:test';

/**
 * SSE framing smoke test.
 *
 * Full end-to-end SSE tests require a live LLM provider or a deterministic
 * mock registered via TRIVEDA_LLM_MODE=mock with seeded fixtures. This
 * suite exercises the pure frame-parsing contract so regressions in the
 * wire format surface in CI even without a booted server.
 */

function parseSseFrames(raw: string): Array<{ event?: string; data?: string }> {
  const frames: Array<{ event?: string; data?: string }> = [];
  for (const block of raw.split(/\r?\n\r?\n/)) {
    if (!block.trim()) continue;
    const frame: { event?: string; data?: string } = {};
    for (const line of block.split(/\r?\n/)) {
      const idx = line.indexOf(':');
      if (idx < 0) continue;
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      if (key === 'event') frame.event = value;
      if (key === 'data') frame.data = (frame.data ?? '') + value;
    }
    frames.push(frame);
  }
  return frames;
}

describe('sse frame parsing', () => {
  it('parses a single event frame', () => {
    const raw = 'event: food_selected\ndata: {"foodId":"oats"}\n\n';
    const frames = parseSseFrames(raw);
    expect(frames).toHaveLength(1);
    expect(frames[0].event).toBe('food_selected');
    expect(frames[0].data).toBe('{"foodId":"oats"}');
  });

  it('preserves frame ordering across multiple events', () => {
    const raw =
      'event: food_selected\ndata: 1\n\nevent: ayurveda_complete\ndata: 2\n\nevent: synthesis_complete\ndata: 3\n\n';
    const frames = parseSseFrames(raw);
    expect(frames.map((f) => f.event)).toEqual([
      'food_selected',
      'ayurveda_complete',
      'synthesis_complete',
    ]);
  });

  it('tolerates CRLF line endings', () => {
    const raw = 'event: a\r\ndata: 1\r\n\r\nevent: b\r\ndata: 2\r\n\r\n';
    const frames = parseSseFrames(raw);
    expect(frames).toHaveLength(2);
    expect(frames[0].event).toBe('a');
    expect(frames[1].event).toBe('b');
  });
});
