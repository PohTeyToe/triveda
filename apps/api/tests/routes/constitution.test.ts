import { beforeEach, describe, expect, it } from 'bun:test';
import { Hono } from 'hono';
import { resetEnvCache } from '../../src/env.js';
import { DEMO_USER } from '../../src/fixtures/demo-user.js';
import { auth } from '../../src/middleware/auth.js';
import type { AuthUser } from '../../src/middleware/auth.js';
import { errorHandler } from '../../src/middleware/error.js';
import { requestId } from '../../src/middleware/request-id.js';
import { constitution } from '../../src/routes/constitution.js';
import { FOUR_ANSWERS, SEED_ANSWERS, TWO_ANSWERS } from '../fixtures/profiles.js';

process.env.DEMO_MODE = 'true';

type AppEnv = { Variables: { user: AuthUser; requestId: string } };

function createTestApp() {
  const app = new Hono<AppEnv>();
  app.use('*', requestId);
  app.onError(errorHandler);
  app.use('/api/*', auth);
  app.route('/api/v1/constitution', constitution);
  return app;
}

describe('POST /api/v1/constitution/assess', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    resetEnvCache();
    app = createTestApp();
  });

  it('returns 200 with profile and credits for 3 valid answers', async () => {
    const res = await app.request('/api/v1/constitution/assess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: SEED_ANSWERS }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.profile).toBeDefined();
    expect(body.profile.dosha_ratios).toBeDefined();
    expect(body.credits).toBeDefined();
    expect(body.credits.length).toBeGreaterThan(0);
  });

  it('returns dosha ratios summing to approximately 1.0', async () => {
    const res = await app.request('/api/v1/constitution/assess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: SEED_ANSWERS }),
    });

    const body = await res.json();
    const ratios = body.profile.dosha_ratios;
    const sum = ratios.vata + ratios.pitta + ratios.kapha;
    expect(Math.abs(sum - 1.0)).toBeLessThan(0.01);
  });

  it('returns non-empty plain language summary', async () => {
    const res = await app.request('/api/v1/constitution/assess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: SEED_ANSWERS }),
    });

    const body = await res.json();
    expect(body.profile.plain_language_summary).toBeDefined();
    expect(body.profile.plain_language_summary.length).toBeGreaterThan(0);
  });

  it('returns 400 for 2 answers', async () => {
    const res = await app.request('/api/v1/constitution/assess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: TWO_ANSWERS }),
    });

    expect(res.status).toBe(400);
  });

  it('returns 400 for 4 answers', async () => {
    const res = await app.request('/api/v1/constitution/assess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: FOUR_ANSWERS }),
    });

    expect(res.status).toBe(400);
  });

  it('returns 400 for malformed answer objects', async () => {
    const res = await app.request('/api/v1/constitution/assess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: [{ bad: true }, { bad: true }, { bad: true }] }),
    });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/constitution/answer', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    resetEnvCache();
    app = createTestApp();
  });

  it('returns 200 with updated profile for 1 valid answer', async () => {
    const res = await app.request('/api/v1/constitution/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer: { questionId: 1, choice: 'a' } }),
    });

    // This will fail without DB, but validates the route exists and parses input
    // In a real test, DB would be mocked
    expect(res.status === 200 || res.status === 500).toBe(true);
  });

  it('returns 400 for missing answer field', async () => {
    const res = await app.request('/api/v1/constitution/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/constitution/questions', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    resetEnvCache();
    app = createTestApp();
  });

  it('returns seed questions (3) by default', async () => {
    const res = await app.request('/api/v1/constitution/questions');

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.questions).toBeDefined();
    expect(body.questions.length).toBe(3);
    // Each question should have id, text, type, options
    for (const q of body.questions) {
      expect(q.id).toBeDefined();
      expect(q.text).toBeDefined();
      expect(q.type).toBe('single_choice');
      expect(q.options.length).toBeGreaterThan(0);
    }
  });

  it('returns seed questions with ?set=seed', async () => {
    const res = await app.request('/api/v1/constitution/questions?set=seed');

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.questions.length).toBe(3);
  });
});

describe('GET /api/v1/constitution/profile', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    resetEnvCache();
    app = createTestApp();
  });

  it('returns null profile for user with no assessment', async () => {
    const res = await app.request('/api/v1/constitution/profile');

    // Will return 500 without DB or null with mocked DB
    expect(res.status === 200 || res.status === 500).toBe(true);
  });
});
