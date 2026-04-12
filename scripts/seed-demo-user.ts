#!/usr/bin/env bun
/**
 * Seed a demo user with realistic 14-day data for the Sasha walkthrough.
 *
 * Creates:
 * - Supabase auth user (demo@triveda.app)
 * - Vata-Pitta constitutional profile (18 answers, Wood element)
 * - Blood work report with 4 biomarkers (CRP high, Vitamin D low)
 * - 7 daily check-ins (anxious pattern on days 4-6 triggers breathwork)
 * - 7 food feedback entries (4 tried, 3 rejected)
 * - Demo state row (day 1, max 14)
 *
 * Idempotent: safe to run multiple times. Uses upsert semantics.
 *
 * Usage:
 *   bun run scripts/seed-demo-user.ts
 *   bun run scripts/seed-demo-user.ts --dry-run
 *   bun run scripts/seed-demo-user.ts --supabase-url=... --service-role-key=...
 */

import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// CLI argument parsing (no $() substitution)
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const flags: Record<string, string | boolean> = {};
for (const arg of args) {
  if (arg === '--dry-run') {
    flags.dryRun = true;
  } else if (arg.startsWith('--supabase-url=')) {
    flags.supabaseUrl = arg.split('=').slice(1).join('=');
  } else if (arg.startsWith('--service-role-key=')) {
    flags.serviceRoleKey = arg.split('=').slice(1).join('=');
  }
}

const SUPABASE_URL =
  (flags.supabaseUrl as string) || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SERVICE_ROLE_KEY =
  (flags.serviceRoleKey as string) || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const DRY_RUN = flags.dryRun === true;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n' +
      'Set them in .env.local or pass via --supabase-url=... --service-role-key=...',
  );
  process.exit(1);
}

const DEMO_EMAIL = 'demo@triveda.app';
const DEMO_PASSWORD = 'triveda-demo-2026';

// ---------------------------------------------------------------------------
// Supabase client (service role -- bypasses RLS)
// ---------------------------------------------------------------------------

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function dateStr(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function log(msg: string) {
  const prefix = DRY_RUN ? '[DRY RUN]' : '[SEED]';
  console.log(`${prefix} ${msg}`);
}

// ---------------------------------------------------------------------------
// 1. Create or fetch auth user
// ---------------------------------------------------------------------------

async function ensureDemoUser(): Promise<string> {
  log('Creating auth user...');

  // Try to fetch existing user by email
  const { data: listData } = await supabase.auth.admin.listUsers();
  const existing = listData?.users?.find((u) => u.email === DEMO_EMAIL);

  if (existing) {
    log(`  User exists: ${existing.id}`);
    return existing.id;
  }

  if (DRY_RUN) {
    log('  Would create user demo@triveda.app');
    return '00000000-0000-0000-0000-000000000000';
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { name: 'Demo User', demo: true },
  });

  if (error) {
    throw new Error(`Failed to create auth user: ${error.message}`);
  }

  log(`  Created user: ${data.user.id}`);
  return data.user.id;
}

// ---------------------------------------------------------------------------
// 2. Seed constitutional profile
// ---------------------------------------------------------------------------

const DEMO_ANSWERS = [
  // Quick Start (1-3): Vata-Pitta leaning
  { questionId: 1, choice: 'thin-light' },
  { questionId: 2, choice: 'variable-appetite' },
  { questionId: 3, choice: 'light-interrupted' },
  // Dosha refinement (4-10): reinforce Vata-Pitta
  { questionId: 4, choice: 'dry-rough' },
  { questionId: 5, choice: 'quick-racing' },
  { questionId: 6, choice: 'warm-intense' },
  { questionId: 7, choice: 'sharp-focused' },
  { questionId: 8, choice: 'sensitive-reactive' },
  { questionId: 9, choice: 'anxious-restless' },
  { questionId: 10, choice: 'motivated-driven' },
  // Five Element (11-15): Wood element affinity
  { questionId: 11, choice: 'spring-renewal' },
  { questionId: 12, choice: 'sour-craving' },
  { questionId: 13, choice: 'eyes-vision' },
  { questionId: 14, choice: 'anger-frustration' },
  { questionId: 15, choice: 'wind-sensitive' },
  // Metabolic typing (16-18): Vata-Pitta metabolism
  { questionId: 16, choice: 'fast-irregular' },
  { questionId: 17, choice: 'warm-foods-preferred' },
  { questionId: 18, choice: 'small-frequent' },
];

async function seedConstitutionalProfile(userId: string): Promise<void> {
  log('Seeding constitutional profile...');

  const profile = {
    user_id: userId,
    dosha_ratios: { vata: 0.45, pitta: 0.35, kapha: 0.2 },
    element_type: 'Wood',
    plain_language_summary:
      'You have a Vata-Pitta constitution with Wood element affinity. ' +
      'Your body tends toward dryness, lightness, and warmth. ' +
      'Warm, grounding, and mildly sweet foods balance your constitution best.',
    tradition_sections: {
      ayurveda:
        'Vata-Pitta prakriti with predominant air and fire elements. ' +
        'Favor warm, moist, grounding foods. Avoid cold, dry, and overly spicy items.',
      tcm:
        'Wood element constitution with Liver-Gallbladder meridian emphasis. ' +
        'Spring is your power season. Sour flavors nourish your element.',
      naturopathy:
        'Fast oxidizer metabolism with tendency toward nervous system sensitivity. ' +
        'Anti-inflammatory foods recommended. Focus on B-vitamins and magnesium.',
    },
    answers: DEMO_ANSWERS,
    answer_count: 18,
    completeness: 100,
  };

  if (DRY_RUN) {
    log('  Would upsert constitutional profile (Vata-Pitta, Wood element)');
    return;
  }

  const { error } = await supabase
    .from('constitutional_profiles')
    .upsert(profile, { onConflict: 'user_id' });

  if (error) throw new Error(`Failed to seed profile: ${error.message}`);
  log('  Constitutional profile seeded (Vata-Pitta, Wood element)');
}

// ---------------------------------------------------------------------------
// 3. Seed blood work report + biomarkers
// ---------------------------------------------------------------------------

async function seedBloodWork(userId: string): Promise<void> {
  log('Seeding blood work report...');

  const jobId = crypto.randomUUID();
  const report = {
    user_id: userId,
    job_id: jobId,
    vendor: 'demo-lab',
    status: 'completed',
    stage: 'done',
    file_name: 'demo-blood-work.pdf',
    file_size_bytes: 45000,
    page_count: 2,
    extraction_method: 'demo-seed',
    uploaded_at: daysAgo(7),
    started_at: daysAgo(7),
    processed_at: daysAgo(7),
    food_influences: {
      elevated_crp: ['turmeric', 'ginger', 'salmon'],
      low_vitamin_d: ['egg', 'salmon', 'ghee'],
    },
  };

  if (DRY_RUN) {
    log('  Would insert blood work report + 4 biomarkers');
    return;
  }

  // Delete existing reports for this user first (idempotent)
  await supabase.from('blood_work_biomarkers').delete().match({ report_id: undefined }); // no-op
  const { data: existingReports } = await supabase
    .from('blood_work_reports')
    .select('id')
    .eq('user_id', userId);

  if (existingReports && existingReports.length > 0) {
    for (const r of existingReports) {
      await supabase.from('blood_work_biomarkers').delete().eq('report_id', r.id);
    }
    await supabase.from('blood_work_reports').delete().eq('user_id', userId);
  }

  const { data: reportData, error: reportError } = await supabase
    .from('blood_work_reports')
    .insert(report)
    .select('id')
    .single();

  if (reportError) throw new Error(`Failed to seed blood work report: ${reportError.message}`);

  const reportId = reportData.id;

  const biomarkers = [
    {
      report_id: reportId,
      canonical_key: 'crp',
      display_name: 'C-Reactive Protein',
      value: '8.5',
      unit: 'mg/L',
      original_unit: 'mg/L',
      reference_range_low: '0',
      reference_range_high: '3.0',
      flag: 'high',
      confidence: '0.95',
      loinc_code: '1988-5',
      extraction_notes: 'Seeded for demo -- drives anti-inflammatory food recs',
    },
    {
      report_id: reportId,
      canonical_key: 'vitamin_b12',
      display_name: 'Vitamin B12',
      value: '450',
      unit: 'pg/mL',
      original_unit: 'pg/mL',
      reference_range_low: '200',
      reference_range_high: '900',
      flag: 'normal',
      confidence: '0.92',
      loinc_code: '2132-9',
      extraction_notes: 'Seeded for demo -- normal range baseline',
    },
    {
      report_id: reportId,
      canonical_key: 'vitamin_d',
      display_name: 'Vitamin D (25-OH)',
      value: '22',
      unit: 'ng/mL',
      original_unit: 'ng/mL',
      reference_range_low: '30',
      reference_range_high: '100',
      flag: 'low',
      confidence: '0.93',
      loinc_code: '1989-3',
      extraction_notes: 'Seeded for demo -- drives vitamin D food recs',
    },
    {
      report_id: reportId,
      canonical_key: 'hemoglobin',
      display_name: 'Hemoglobin',
      value: '14.2',
      unit: 'g/dL',
      original_unit: 'g/dL',
      reference_range_low: '13.5',
      reference_range_high: '17.5',
      flag: 'normal',
      confidence: '0.97',
      loinc_code: '718-7',
      extraction_notes: 'Seeded for demo -- normal baseline',
    },
  ];

  const { error: bioError } = await supabase.from('blood_work_biomarkers').insert(biomarkers);

  if (bioError) throw new Error(`Failed to seed biomarkers: ${bioError.message}`);
  log('  Blood work report + 4 biomarkers seeded');
}

// ---------------------------------------------------------------------------
// 4. Seed daily check-ins
// ---------------------------------------------------------------------------

async function seedCheckIns(userId: string): Promise<void> {
  log('Seeding daily check-ins...');

  const checkIns = [
    { day: 7, mood: 'okay', energy: 'medium', digestion: 'okay', sleep_quality: 'rested' },
    { day: 6, mood: 'good', energy: 'medium', digestion: 'good', sleep_quality: 'rested' },
    { day: 5, mood: 'okay', energy: 'high', digestion: 'okay', sleep_quality: 'rested' },
    { day: 4, mood: 'poor', energy: 'low', digestion: 'poor', sleep_quality: 'groggy' },
    { day: 3, mood: 'poor', energy: 'low', digestion: 'poor', sleep_quality: 'groggy' },
    { day: 2, mood: 'bad', energy: 'low', digestion: 'bad', sleep_quality: 'groggy' },
    { day: 1, mood: 'good', energy: 'high', digestion: 'good', sleep_quality: 'rested' },
  ];

  const rows = checkIns.map((ci) => ({
    user_id: userId,
    date: dateStr(ci.day),
    mood: ci.mood,
    energy: ci.energy,
    digestion: ci.digestion,
    sleep_quality: ci.sleep_quality,
    symptoms: ci.mood === 'poor' || ci.mood === 'bad' ? ['anxiety', 'bloating'] : null,
    created_at: daysAgo(ci.day),
    updated_at: daysAgo(ci.day),
  }));

  if (DRY_RUN) {
    log('  Would insert 7 check-ins (anxious pattern days 4-2 ago)');
    return;
  }

  // Delete then insert for idempotency
  await supabase.from('daily_check_ins').delete().eq('user_id', userId);
  const { error } = await supabase.from('daily_check_ins').insert(rows);

  if (error) throw new Error(`Failed to seed check-ins: ${error.message}`);
  log('  7 check-ins seeded (poor/bad pattern on days 4-2)');
}

// ---------------------------------------------------------------------------
// 5. Seed food feedback
// ---------------------------------------------------------------------------

async function seedFoodFeedback(userId: string): Promise<void> {
  log('Seeding food feedback...');

  // These use suggestion_id as a uuid. We generate deterministic UUIDs
  // so the seed is reproducible. The actual food name is in the comment.
  const feedback = [
    { response: 'tried', note: 'warm oatmeal', dayBack: 7 },
    { response: 'tried', note: 'ginger tea', dayBack: 6 },
    { response: 'tried', note: 'mung dal', dayBack: 5 },
    { response: 'rejected', note: 'raw salad', dayBack: 4 },
    { response: 'tried', note: 'brown rice', dayBack: 3 },
    { response: 'rejected', note: 'ice cream', dayBack: 2 },
    { response: 'rejected', note: 'spicy curry', dayBack: 1 },
  ];

  const rows = feedback.map((fb, i) => ({
    user_id: userId,
    suggestion_id: `00000000-0000-0000-0000-00000000000${i + 1}`,
    response: fb.response,
    symptom_tag: fb.response === 'rejected' ? 'discomfort' : null,
    created_at: daysAgo(fb.dayBack),
  }));

  if (DRY_RUN) {
    log('  Would insert 7 food feedback entries (4 tried, 3 rejected)');
    return;
  }

  await supabase.from('food_feedback').delete().eq('user_id', userId);
  const { error } = await supabase.from('food_feedback').insert(rows);

  if (error) throw new Error(`Failed to seed food feedback: ${error.message}`);
  log('  7 food feedback entries seeded (4 tried, 3 rejected)');
}

// ---------------------------------------------------------------------------
// 6. Seed demo state
// ---------------------------------------------------------------------------

async function seedDemoState(userId: string): Promise<void> {
  log('Seeding demo state...');

  const state = {
    user_id: userId,
    current_day: 1,
    recommendations: [],
  };

  if (DRY_RUN) {
    log('  Would upsert demo_state (day 1)');
    return;
  }

  const { error } = await supabase.from('demo_state').upsert(state, { onConflict: 'user_id' });

  if (error) throw new Error(`Failed to seed demo state: ${error.message}`);
  log('  Demo state seeded (day 1)');
}

// ---------------------------------------------------------------------------
// 7. Seed user profile
// ---------------------------------------------------------------------------

async function seedUserProfile(userId: string): Promise<void> {
  log('Seeding user profile...');

  const profile = {
    user_id: userId,
    display_name: 'Demo User',
    location_lat: 43.65,
    location_lon: -79.38,
    timezone: 'America/Toronto',
    dietary_restrictions: [],
    tradition_visibility: { ayurveda: true, tcm: true, naturopathy: true },
  };

  if (DRY_RUN) {
    log('  Would upsert user profile');
    return;
  }

  const { error } = await supabase.from('user_profiles').upsert(profile, { onConflict: 'user_id' });

  if (error) throw new Error(`Failed to seed user profile: ${error.message}`);
  log('  User profile seeded');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('');
  console.log('Triveda Demo User Seeder');
  console.log('========================');
  if (DRY_RUN) console.log('DRY RUN -- no database writes');
  console.log('');

  const userId = await ensureDemoUser();

  await seedUserProfile(userId);
  await seedConstitutionalProfile(userId);
  await seedBloodWork(userId);
  await seedCheckIns(userId);
  await seedFoodFeedback(userId);
  await seedDemoState(userId);

  console.log('');
  console.log('========================');
  console.log('Demo user seeded successfully.');
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log(`  User ID:  ${userId}`);
  console.log('');
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
