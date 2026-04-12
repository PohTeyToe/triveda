/**
 * Constitution routes -- assessment, progressive answer, profile, and questions.
 *
 * POST /api/v1/constitution/assess  -- accept 3 answers, score, persist, return profile + credits
 * POST /api/v1/constitution/answer  -- accept 1 answer, append, recompute, return updated profile
 * GET  /api/v1/constitution/profile -- return current user's constitutional profile
 * GET  /api/v1/constitution/questions -- return question bank (seed or next)
 */

import { constitutionalProfiles } from '@triveda/db';
import type { CreditSource } from '@triveda/shared/src/credits.js';
import { AnswerSchema, scoreConstitution } from '@triveda/shared/src/engines/index.js';
import type { Answer } from '@triveda/shared/src/engines/types.js';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AuthUser } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';
import { getDb } from './helpers/db.js';

// ---------------------------------------------------------------------------
// Zod request/response schemas
// ---------------------------------------------------------------------------

const AssessBodySchema = z.object({
  answers: z.array(AnswerSchema).length(3),
});

const AnswerBodySchema = z.object({
  answer: AnswerSchema,
});

const QuestionsQuerySchema = z.object({
  set: z.enum(['seed', 'next']).default('seed'),
});

// ---------------------------------------------------------------------------
// Question bank (questions 1-18, matching the constitutional engine)
// ---------------------------------------------------------------------------

const QUESTION_BANK = [
  {
    id: '1',
    text: 'How would you describe your body frame?',
    type: 'single_choice' as const,
    diagnosticWeight: 1.5,
    options: [
      { value: 'a', label: 'Thin, light, hard to gain weight' },
      { value: 'b', label: 'Medium, athletic build' },
      { value: 'c', label: 'Large, solid, gains weight easily' },
    ],
  },
  {
    id: '2',
    text: 'How would you describe your skin?',
    type: 'single_choice' as const,
    diagnosticWeight: 1.0,
    options: [
      { value: 'a', label: 'Dry, rough, cool' },
      { value: 'b', label: 'Warm, oily, sensitive' },
      { value: 'c', label: 'Thick, smooth, cool' },
    ],
  },
  {
    id: '3',
    text: 'How do you sleep?',
    type: 'single_choice' as const,
    diagnosticWeight: 1.2,
    options: [
      { value: 'a', label: 'Light sleeper, wake easily' },
      { value: 'b', label: 'Moderate, can sleep through most things' },
      { value: 'c', label: 'Deep, heavy sleeper' },
    ],
  },
  {
    id: '4',
    text: 'How would you describe your digestion?',
    type: 'single_choice' as const,
    diagnosticWeight: 1.3,
    options: [
      { value: 'a', label: 'Irregular, variable appetite' },
      { value: 'b', label: 'Strong, sharp hunger' },
      { value: 'c', label: 'Slow, steady digestion' },
    ],
  },
  {
    id: '5',
    text: 'What temperature do you dislike most?',
    type: 'single_choice' as const,
    diagnosticWeight: 0.8,
    options: [
      { value: 'a', label: 'Cold weather' },
      { value: 'b', label: 'Hot weather' },
      { value: 'c', label: 'Damp, cold weather' },
    ],
  },
  {
    id: '6',
    text: 'How do you respond to stress?',
    type: 'single_choice' as const,
    diagnosticWeight: 1.0,
    options: [
      { value: 'a', label: 'Anxious, worried' },
      { value: 'b', label: 'Irritable, angry' },
      { value: 'c', label: 'Withdrawn, avoidant' },
    ],
  },
  {
    id: '7',
    text: 'What is your energy pattern?',
    type: 'single_choice' as const,
    diagnosticWeight: 0.7,
    options: [
      { value: 'a', label: 'Bursts of energy then crashes' },
      { value: 'b', label: 'Focused and driven' },
      { value: 'c', label: 'Slow start but good endurance' },
    ],
  },
  {
    id: '8',
    text: 'How would you describe your speech?',
    type: 'single_choice' as const,
    diagnosticWeight: 0.5,
    options: [
      { value: 'a', label: 'Fast, talkative' },
      { value: 'b', label: 'Sharp, precise' },
      { value: 'c', label: 'Slow, melodious' },
    ],
  },
  {
    id: '9',
    text: 'How is your appetite?',
    type: 'single_choice' as const,
    diagnosticWeight: 2.0,
    options: [
      { value: 'a', label: 'Irregular, sometimes forget to eat' },
      { value: 'b', label: 'Strong, cannot skip meals' },
      { value: 'c', label: 'Moderate, can skip meals easily' },
    ],
  },
  {
    id: '10',
    text: 'What best describes your mind?',
    type: 'single_choice' as const,
    diagnosticWeight: 1.0,
    options: [
      { value: 'a', label: 'Quick, restless, creative' },
      { value: 'b', label: 'Focused, analytical, competitive' },
      { value: 'c', label: 'Calm, steady, nurturing' },
    ],
  },
  {
    id: '11',
    text: 'How do you respond to seasonal changes?',
    type: 'single_choice' as const,
    diagnosticWeight: 0.8,
    options: [
      { value: 'a', label: 'Energized by spring, new beginnings' },
      { value: 'b', label: 'Thrive in summer warmth' },
      { value: 'c', label: 'Enjoy late summer stability' },
      { value: 'd', label: 'Love autumn clarity' },
      { value: 'e', label: 'Prefer winter stillness' },
    ],
  },
  {
    id: '12',
    text: 'What emotions arise most often?',
    type: 'single_choice' as const,
    diagnosticWeight: 0.8,
    options: [
      { value: 'a', label: 'Frustration or ambition' },
      { value: 'b', label: 'Joy or anxiety' },
      { value: 'c', label: 'Worry or empathy' },
      { value: 'd', label: 'Grief or precision' },
      { value: 'e', label: 'Fear or wisdom' },
    ],
  },
  {
    id: '13',
    text: 'What time of day do you feel most productive?',
    type: 'single_choice' as const,
    diagnosticWeight: 0.8,
    options: [
      { value: 'a', label: 'Early morning, dawn' },
      { value: 'b', label: 'Late morning to midday' },
      { value: 'c', label: 'Early afternoon' },
      { value: 'd', label: 'Late afternoon to evening' },
      { value: 'e', label: 'Night time' },
    ],
  },
  {
    id: '14',
    text: 'What physical activity do you prefer?',
    type: 'single_choice' as const,
    diagnosticWeight: 0.8,
    options: [
      { value: 'a', label: 'Stretching, yoga, martial arts' },
      { value: 'b', label: 'Running, dancing, cardio' },
      { value: 'c', label: 'Walking, tai chi, gardening' },
      { value: 'd', label: 'Weight training, structure' },
      { value: 'e', label: 'Swimming, meditation, rest' },
    ],
  },
  {
    id: '15',
    text: 'What flavors do you crave?',
    type: 'single_choice' as const,
    diagnosticWeight: 0.8,
    options: [
      { value: 'a', label: 'Sour or green flavors' },
      { value: 'b', label: 'Bitter or stimulating' },
      { value: 'c', label: 'Sweet or comforting' },
      { value: 'd', label: 'Pungent or spicy' },
      { value: 'e', label: 'Salty or savory' },
    ],
  },
  {
    id: '16',
    text: 'How quickly do you feel hungry after eating?',
    type: 'single_choice' as const,
    diagnosticWeight: 0.6,
    options: [
      { value: 'a', label: 'Very quickly, within 1-2 hours' },
      { value: 'b', label: 'Moderately, 3-4 hours' },
      { value: 'c', label: 'Slowly, can go 5+ hours' },
    ],
  },
  {
    id: '17',
    text: 'Under stress, how does your nervous system respond?',
    type: 'single_choice' as const,
    diagnosticWeight: 0.6,
    options: [
      { value: 'a', label: 'Heart races, restless, fight-or-flight' },
      { value: 'b', label: 'Balanced response, recover quickly' },
      { value: 'c', label: 'Freeze, shut down, withdraw' },
    ],
  },
  {
    id: '18',
    text: 'After exercise, how do you recover?',
    type: 'single_choice' as const,
    diagnosticWeight: 0.6,
    options: [
      { value: 'a', label: 'Quick recovery, ready to go again' },
      { value: 'b', label: 'Normal recovery time' },
      { value: 'c', label: 'Slow to recover, need extra rest' },
    ],
  },
];

// Sorted by diagnostic weight descending for progressive profiling
const QUESTIONS_BY_WEIGHT = [...QUESTION_BANK].sort(
  (a, b) => b.diagnosticWeight - a.diagnosticWeight,
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildCredits(completeness: number): CreditSource[] {
  return [
    {
      featureId: 'dosha-analysis',
      featureName: 'Dosha Analysis',
      active: true,
      contribution: 'Constitutional scoring from assessment answers',
    },
    {
      featureId: 'progressive-profiling',
      featureName: 'Progressive Profiling',
      active: completeness < 100,
      contribution: completeness < 100 ? `Profile ${completeness}% complete` : 'Profile complete',
    },
  ];
}

const TOTAL_QUESTIONS = 18;

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

type AppEnv = { Variables: { user: AuthUser } };

const constitution = new Hono<AppEnv>();

/**
 * POST /assess -- accept exactly 3 answers, score constitution, persist, return profile + credits.
 */
constitution.post('/assess', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const parsed = AssessBodySchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      parsed.error.issues[0]?.message ?? 'Invalid request body',
    );
  }

  const { answers } = parsed.data;
  const engineAnswers: Answer[] = answers.map((a) => ({
    questionId: a.questionId,
    choice: a.choice,
  }));

  const result = scoreConstitution(engineAnswers);
  const profile = result.profile;
  const completeness = Math.round((answers.length / TOTAL_QUESTIONS) * 100);

  const db = getDb();
  await db
    .insert(constitutionalProfiles)
    .values({
      user_id: user.id,
      dosha_ratios: profile.doshaScores,
      element_type: profile.primaryElement ?? null,
      plain_language_summary: profile.summary,
      tradition_sections: {
        ayurveda: `${profile.doshaType.type} dosha: ${profile.doshaType.primary}-dominant`,
        tcm: profile.primaryElement
          ? `Primary element: ${profile.primaryElement}`
          : 'Element type pending more answers',
        naturopathy: profile.metabolicType
          ? `Metabolic type: ${profile.metabolicType}`
          : 'Metabolic typing pending more answers',
      },
      answers: engineAnswers,
      answer_count: answers.length,
      completeness,
    })
    .onConflictDoUpdate({
      target: constitutionalProfiles.user_id,
      set: {
        dosha_ratios: profile.doshaScores,
        element_type: profile.primaryElement ?? null,
        plain_language_summary: profile.summary,
        tradition_sections: {
          ayurveda: `${profile.doshaType.type} dosha: ${profile.doshaType.primary}-dominant`,
          tcm: profile.primaryElement
            ? `Primary element: ${profile.primaryElement}`
            : 'Element type pending more answers',
          naturopathy: profile.metabolicType
            ? `Metabolic type: ${profile.metabolicType}`
            : 'Metabolic typing pending more answers',
        },
        answers: engineAnswers,
        answer_count: answers.length,
        completeness,
        updated_at: new Date(),
      },
    });

  const credits = buildCredits(completeness);

  return c.json({
    profile: {
      dosha_ratios: profile.doshaScores,
      element_type: profile.primaryElement,
      plain_language_summary: profile.summary,
      tradition_sections: {
        ayurveda: `${profile.doshaType.type} dosha: ${profile.doshaType.primary}-dominant`,
        tcm: profile.primaryElement
          ? `Primary element: ${profile.primaryElement}`
          : 'Element type pending more answers',
        naturopathy: profile.metabolicType
          ? `Metabolic type: ${profile.metabolicType}`
          : 'Metabolic typing pending more answers',
      },
      completeness,
      answer_count: answers.length,
    },
    credits,
  });
});

/**
 * POST /answer -- accept 1 answer, append to existing answers, recompute, return updated profile.
 */
constitution.post('/answer', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const parsed = AnswerBodySchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      parsed.error.issues[0]?.message ?? 'Invalid request body',
    );
  }

  const { answer } = parsed.data;
  const db = getDb();

  // Fetch existing profile
  const existing = await db
    .select()
    .from(constitutionalProfiles)
    .where(eq(constitutionalProfiles.user_id, user.id))
    .limit(1);

  const existingRow = existing[0];
  const existingAnswers: Answer[] = existingRow ? (existingRow.answers as Answer[]) : [];

  // Replace or append the answer
  const updatedAnswers = [
    ...existingAnswers.filter((a) => a.questionId !== answer.questionId),
    { questionId: answer.questionId, choice: answer.choice },
  ];

  const result = scoreConstitution(updatedAnswers);
  const profile = result.profile;
  const completeness = Math.round((updatedAnswers.length / TOTAL_QUESTIONS) * 100);

  await db
    .insert(constitutionalProfiles)
    .values({
      user_id: user.id,
      dosha_ratios: profile.doshaScores,
      element_type: profile.primaryElement ?? null,
      plain_language_summary: profile.summary,
      tradition_sections: {
        ayurveda: `${profile.doshaType.type} dosha: ${profile.doshaType.primary}-dominant`,
        tcm: profile.primaryElement
          ? `Primary element: ${profile.primaryElement}`
          : 'Element type pending more answers',
        naturopathy: profile.metabolicType
          ? `Metabolic type: ${profile.metabolicType}`
          : 'Metabolic typing pending more answers',
      },
      answers: updatedAnswers,
      answer_count: updatedAnswers.length,
      completeness,
    })
    .onConflictDoUpdate({
      target: constitutionalProfiles.user_id,
      set: {
        dosha_ratios: profile.doshaScores,
        element_type: profile.primaryElement ?? null,
        plain_language_summary: profile.summary,
        tradition_sections: {
          ayurveda: `${profile.doshaType.type} dosha: ${profile.doshaType.primary}-dominant`,
          tcm: profile.primaryElement
            ? `Primary element: ${profile.primaryElement}`
            : 'Element type pending more answers',
          naturopathy: profile.metabolicType
            ? `Metabolic type: ${profile.metabolicType}`
            : 'Metabolic typing pending more answers',
        },
        answers: updatedAnswers,
        answer_count: updatedAnswers.length,
        completeness,
        updated_at: new Date(),
      },
    });

  const credits = buildCredits(completeness);

  return c.json({
    profile: {
      dosha_ratios: profile.doshaScores,
      element_type: profile.primaryElement,
      plain_language_summary: profile.summary,
      tradition_sections: {
        ayurveda: `${profile.doshaType.type} dosha: ${profile.doshaType.primary}-dominant`,
        tcm: profile.primaryElement
          ? `Primary element: ${profile.primaryElement}`
          : 'Element type pending more answers',
        naturopathy: profile.metabolicType
          ? `Metabolic type: ${profile.metabolicType}`
          : 'Metabolic typing pending more answers',
      },
      completeness,
      answer_count: updatedAnswers.length,
    },
    completeness,
    credits,
  });
});

/**
 * GET /profile -- return current user's constitutional profile, or null if none exists.
 */
constitution.get('/profile', async (c) => {
  const user = c.get('user');
  const db = getDb();

  const rows = await db
    .select()
    .from(constitutionalProfiles)
    .where(eq(constitutionalProfiles.user_id, user.id))
    .limit(1);

  if (rows.length === 0) {
    return c.json({ profile: null });
  }

  const row = rows[0];
  if (!row) {
    return c.json({ profile: null });
  }
  return c.json({
    profile: {
      dosha_ratios: row.dosha_ratios,
      element_type: row.element_type,
      plain_language_summary: row.plain_language_summary,
      tradition_sections: row.tradition_sections,
      completeness: row.completeness,
      answer_count: row.answer_count,
    },
  });
});

/**
 * GET /questions -- return question bank. ?set=seed returns top 3 by diagnostic weight.
 * ?set=next returns the next unanswered question for the current user.
 */
constitution.get('/questions', async (c) => {
  const user = c.get('user');
  const query = QuestionsQuerySchema.safeParse({ set: c.req.query('set') ?? 'seed' });
  const setType = query.success ? query.data.set : 'seed';

  if (setType === 'seed') {
    const seedQuestions = QUESTIONS_BY_WEIGHT.slice(0, 3);
    return c.json({
      questions: seedQuestions.map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        options: q.options,
      })),
    });
  }

  // set=next: find next unanswered question
  const db = getDb();
  const rows = await db
    .select()
    .from(constitutionalProfiles)
    .where(eq(constitutionalProfiles.user_id, user.id))
    .limit(1);

  const answeredIds = new Set<string>();
  const profileRow = rows[0];
  if (profileRow) {
    const answers = profileRow.answers as Answer[];
    for (const a of answers) {
      answeredIds.add(String(a.questionId));
    }
  }

  const unanswered = QUESTIONS_BY_WEIGHT.filter((q) => !answeredIds.has(q.id));

  if (unanswered.length === 0) {
    return c.json({ questions: [] });
  }

  // Return the next unanswered question (highest diagnostic weight first)
  const next = unanswered[0];
  if (!next) {
    return c.json({ questions: [] });
  }
  return c.json({
    questions: [
      {
        id: next.id,
        text: next.text,
        type: next.type,
        options: next.options,
      },
    ],
  });
});

export { constitution };
