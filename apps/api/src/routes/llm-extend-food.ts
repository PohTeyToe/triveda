/**
 * LLM on-demand food extension route.
 *
 * POST /api/v1/llm/extend-food/:query
 *
 * Streams progress via SSE as the LLM generates Ayurveda -> TCM ->
 * Naturopathy properties for a food not present in the curated DB.
 *
 * Events emitted:
 *   progress  { stage: 'ayurveda'|'tcm'|'naturopathy'|'finalizing', percent: number }
 *   complete  { food: GeneratedFood }
 *   error     { message: string, closest_match_id?: string }
 *   done      {}
 *
 * If a close match exists in the `foods` table (fuzzy match on name),
 * emits an `error` event with `closest_match_id` and ends the stream.
 *
 * Uses Anthropic via Vercel AI SDK when TRIVEDA_LLM_MODE != 'mock',
 * otherwise emits a deterministic mock response suitable for tests.
 */

import { createAnthropic } from '@ai-sdk/anthropic';
import { foods } from '@triveda/db';
import { generateObject } from 'ai';
import { asc, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { z } from 'zod';
import type { AuthUser } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rate-limit.js';
import { getDb } from './helpers/db.js';

// ---------------------------------------------------------------------------
// Output schema (what the LLM must return)
// ---------------------------------------------------------------------------

const generatedFoodSchema = z.object({
  name: z.string(),
  category: z.string(),
  subcategory: z.string().nullable().optional(),
  rasa: z.array(z.string()).nullable().optional(),
  virya: z.enum(['ushna', 'sheeta']).nullable().optional(),
  vipaka: z.string().nullable().optional(),
  guna: z.array(z.string()).nullable().optional(),
  dosha_effects: z
    .object({
      vata: z.number().min(-2).max(2),
      pitta: z.number().min(-2).max(2),
      kapha: z.number().min(-2).max(2),
    })
    .nullable()
    .optional(),
  thermal_nature: z.enum(['hot', 'warm', 'neutral', 'cool', 'cold']).nullable().optional(),
  tcm_flavor: z.array(z.string()).nullable().optional(),
  organ_affinity: z.array(z.string()).nullable().optional(),
  tcm_actions: z.array(z.string()).nullable().optional(),
  glycemic_index: z.number().min(0).max(110).nullable().optional(),
  bioactive_compounds: z
    .array(
      z.object({
        name: z.string(),
        amount: z.number(),
        unit: z.string(),
      }),
    )
    .nullable()
    .optional(),
  evidence_claims: z
    .array(
      z.object({
        claim: z.string(),
        level: z.string(),
        citation: z.string().optional(),
        pubmed_id: z.string().optional(),
      }),
    )
    .nullable()
    .optional(),
  confidence_score: z.number().min(0).max(1),
});

type GeneratedFoodBody = z.infer<typeof generatedFoodSchema>;

// ---------------------------------------------------------------------------
// Prompts (per-tradition)
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a careful Ayurvedic / Traditional Chinese Medicine / naturopathic food property generator.
Given a food name, return the structured nutritional and energetic properties across three traditions.
Be conservative. Set confidence_score low (0.4-0.6) because this entry has not been validated.
Only use standard classifications. Omit fields you cannot answer confidently.`;

function buildPrompt(query: string, stage: 'ayurveda' | 'tcm' | 'naturopathy' | 'full'): string {
  if (stage === 'full') {
    return `Generate Ayurveda, TCM, and Naturopathy properties for the food: "${query}".
Return all three tradition blocks in a single JSON object matching the schema.
Use confidence_score in [0.4, 0.6] to reflect that this entry is AI-generated and unvalidated.`;
  }
  return `Generate ${stage} properties for the food: "${query}".`;
}

// ---------------------------------------------------------------------------
// Fuzzy match
// ---------------------------------------------------------------------------

/**
 * Find a close match in the foods table for the query.
 *
 * Uses Postgres trigram similarity when pg_trgm is available; falls back
 * to case-insensitive LIKE. Threshold 0.6 trgm or exact token overlap.
 */
async function findClosestMatch(query: string): Promise<{ id: string; name: string } | null> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return null;

  let db: ReturnType<typeof getDb>;
  try {
    db = getDb();
  } catch {
    // DB unavailable (e.g., demo mode without DATABASE_URL).
    // Skip fuzzy match; let the LLM generate freely.
    return null;
  }

  try {
    // Try pg_trgm similarity first (if extension enabled)
    const rows = await db.execute<{ id: string; name: string; score: number }>(
      sql`
        SELECT id::text as id, name, similarity(lower(name), ${trimmed}) as score
        FROM foods
        WHERE similarity(lower(name), ${trimmed}) > 0.6
        ORDER BY score DESC
        LIMIT 1
      `,
    );
    const trows =
      (rows as unknown as { rows?: Array<{ id: string; name: string }> }).rows ??
      (rows as unknown as Array<{ id: string; name: string }>);
    if (Array.isArray(trows) && trows.length > 0 && trows[0]) {
      return { id: trows[0].id, name: trows[0].name };
    }
  } catch {
    // pg_trgm not available - fall through to ILIKE
  }

  // Fallback: case-insensitive substring
  const like = await db
    .select({ id: foods.id, name: foods.name })
    .from(foods)
    .where(sql`lower(${foods.name}) LIKE ${`%${trimmed}%`}`)
    .orderBy(asc(foods.name))
    .limit(1);
  if (like[0]) return { id: like[0].id, name: like[0].name };
  return null;
}

// ---------------------------------------------------------------------------
// Mock generator (used in mock mode and tests)
// ---------------------------------------------------------------------------

function mockGeneratedFood(query: string): GeneratedFoodBody {
  return {
    name: query,
    category: 'fruits',
    subcategory: null,
    rasa: ['madhura'],
    virya: 'sheeta',
    vipaka: 'madhura',
    guna: ['laghu', 'snigdha'],
    dosha_effects: { vata: -1, pitta: -1, kapha: 1 },
    thermal_nature: 'cool',
    tcm_flavor: ['sweet'],
    organ_affinity: ['spleen', 'stomach'],
    tcm_actions: ['tonify_qi'],
    glycemic_index: 55,
    bioactive_compounds: [{ name: 'Vitamin C', amount: 30, unit: 'mg' }],
    evidence_claims: [
      {
        claim: `${query} is a source of dietary fiber and micronutrients.`,
        level: 'traditional only',
      },
    ],
    confidence_score: 0.5,
  };
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

type AppEnv = { Variables: { user: AuthUser; requestId: string } };

const llmExtendFood = new Hono<AppEnv>();

llmExtendFood.use('/*', createRateLimiter('foods-llm-extend'));

llmExtendFood.post('/extend-food/:query', async (c) => {
  const rawQuery = c.req.param('query') ?? '';
  const query = decodeURIComponent(rawQuery).trim();

  return streamSSE(c, async (stream) => {
    const signal = c.req.raw.signal;
    let aborted = false;
    stream.onAbort(() => {
      aborted = true;
    });

    const emit = async (event: string, data: unknown) => {
      if (aborted || signal?.aborted) return;
      await stream.writeSSE({ event, data: JSON.stringify(data) });
    };

    try {
      if (!query) {
        await emit('error', { message: 'Query is required' });
        await emit('done', {});
        return;
      }

      // 1. Check for close match in DB
      const match = await findClosestMatch(query);
      if (match) {
        await emit('error', {
          message: `A similar food "${match.name}" already exists in our database.`,
          closest_match_id: match.id,
        });
        await emit('done', {});
        return;
      }

      // 2. Progress through stages
      await emit('progress', { stage: 'ayurveda', percent: 10 });

      const mockMode = process.env.TRIVEDA_LLM_MODE === 'mock' || !process.env.ANTHROPIC_API_KEY;

      // Simulate staged progress for UI
      await emit('progress', { stage: 'ayurveda', percent: 25 });
      await emit('progress', { stage: 'tcm', percent: 50 });
      await emit('progress', { stage: 'naturopathy', percent: 75 });

      let generated: GeneratedFoodBody;
      if (mockMode) {
        generated = mockGeneratedFood(query);
      } else {
        const apiKey = process.env.ANTHROPIC_API_KEY ?? '';
        const anthropic = createAnthropic({ apiKey });
        const result = await generateObject({
          model: anthropic('claude-sonnet-4-5'),
          schema: generatedFoodSchema,
          system: SYSTEM_PROMPT,
          prompt: buildPrompt(query, 'full'),
          abortSignal: signal,
          maxRetries: 2,
        });
        generated = result.object;
        // Clamp confidence to 0.4-0.6 range for AI-generated entries
        const cs = generated.confidence_score ?? 0.5;
        generated.confidence_score = Math.max(0.4, Math.min(0.6, cs));
      }

      await emit('progress', { stage: 'finalizing', percent: 100 });

      // Assemble the response in BrowseFood shape with a synthetic id
      const food = {
        id: `llm-generated:${cryptoRandomId()}`,
        name: generated.name,
        category: generated.category,
        subcategory: generated.subcategory ?? null,
        image_url: null,
        rasa: generated.rasa ?? null,
        virya: generated.virya ?? null,
        vipaka: generated.vipaka ?? null,
        guna: generated.guna ?? null,
        dosha_effects: generated.dosha_effects ?? null,
        thermal_nature: generated.thermal_nature ?? null,
        tcm_flavor: generated.tcm_flavor ?? null,
        organ_affinity: generated.organ_affinity ?? null,
        tcm_actions: generated.tcm_actions ?? null,
        glycemic_index: generated.glycemic_index ?? null,
        bioactive_compounds: generated.bioactive_compounds ?? null,
        evidence_claims: generated.evidence_claims ?? null,
        ritu_scores: null,
        element_scores: null,
        sources: [{ name: 'AI Generated', isLlmGenerated: true }],
        confidence_score: generated.confidence_score,
        traditions: ['Ayurveda', 'TCM', 'Naturopathy'],
        is_llm_generated: true,
        pending_validation: true,
      };

      await emit('complete', { food });
      await emit('done', {});
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate food entry via AI.';
      try {
        await emit('error', { message });
        await emit('done', {});
      } catch {
        // stream already closed
      }
    }
  });
});

function cryptoRandomId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  }
}

export { llmExtendFood };
