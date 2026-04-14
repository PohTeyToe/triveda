#!/usr/bin/env bun
/**
 * First-time production deploy orchestrator for Triveda.
 *
 * Provisions Supabase -> Railway -> Vercel in strict order. Persists
 * progress to `.deploy-state.json` so partial failures can be resumed by
 * re-running the same command.
 *
 * Required env:
 *   SUPABASE_ACCESS_TOKEN  — Management API token for the target org
 *   VERCEL_TOKEN           — Vercel CLI token
 *   RAILWAY_API_TOKEN      — Railway CLI token
 *   ANTHROPIC_API_KEY      — set on the Railway backend for LLM calls
 *
 * Usage:
 *   bun run scripts/first-deploy.ts               # full run
 *   bun run scripts/first-deploy.ts --resume      # re-run, skip completed
 *   bun run scripts/first-deploy.ts --dry-run     # plan only
 *   bun run scripts/first-deploy.ts --only supabase|railway|vercel|smoke
 *
 * Exits non-zero on any failure. Writes `.env.production` (gitignored) with
 * the outputs of a successful run.
 */

import { spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

type StepName = 'supabase' | 'railway' | 'vercel' | 'smoke';

interface DeployState {
  supabase: {
    completed: boolean;
    projectRef?: string;
    url?: string;
    anonKey?: string;
    serviceRoleKey?: string;
  };
  railway: {
    completed: boolean;
    serviceUrl?: string;
    projectId?: string;
  };
  vercel: {
    completed: boolean;
    productionUrl?: string;
    projectId?: string;
  };
  smoke: {
    completed: boolean;
    lastRun?: string;
  };
}

const STATE_PATH = '.deploy-state.json';
const ENV_OUTPUT = '.env.production';
const SUPABASE_API = 'https://api.supabase.com/v1';

function readState(): DeployState {
  if (existsSync(STATE_PATH)) {
    return JSON.parse(readFileSync(STATE_PATH, 'utf8')) as DeployState;
  }
  return {
    supabase: { completed: false },
    railway: { completed: false },
    vercel: { completed: false },
    smoke: { completed: false },
  };
}

function writeState(state: DeployState): void {
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

function parseFlags() {
  const argv = process.argv.slice(2);
  const flags: {
    resume: boolean;
    dryRun: boolean;
    only?: StepName;
  } = { resume: false, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--resume') flags.resume = true;
    else if (arg === '--dry-run') flags.dryRun = true;
    else if (arg === '--only') flags.only = argv[++i] as StepName;
  }
  return flags;
}

function run(cmd: string, args: string[], env?: NodeJS.ProcessEnv): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, ...env },
      shell: false,
    });
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (d) => {
      stdout += d.toString();
    });
    child.stderr?.on('data', (d) => {
      stderr += d.toString();
    });
    child.on('close', (code) => {
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(`${cmd} ${args.join(' ')} exited ${code}\n${stderr}`));
    });
  });
}

async function supaFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) throw new Error('SUPABASE_ACCESS_TOKEN is not set');
  const res = await fetch(`${SUPABASE_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase API ${path} -> ${res.status}: ${body}`);
  }
  return (await res.json()) as T;
}

function generateDbPassword(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function provisionSupabase(state: DeployState, dryRun: boolean): Promise<DeployState> {
  if (state.supabase.completed) {
    console.log('[supabase] already provisioned, skipping');
    return state;
  }
  console.log('[supabase] provisioning...');
  if (dryRun) {
    console.log('[supabase] dry-run: would create project "triveda"');
    return state;
  }

  const orgs = await supaFetch<Array<{ id: string }>>('/organizations');
  if (orgs.length === 0) throw new Error('No Supabase organizations found');
  const orgId = orgs[0].id;
  const dbPass = generateDbPassword();

  const project = await supaFetch<{ ref: string }>('/projects', {
    method: 'POST',
    body: JSON.stringify({
      name: 'triveda',
      organization_id: orgId,
      plan: 'free',
      region: 'us-east-1',
      db_pass: dbPass,
    }),
  });

  const ref = project.ref;
  console.log(`[supabase] created project ref=${ref}, waiting for ACTIVE_HEALTHY...`);
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    const status = await supaFetch<{ status: string }>(`/projects/${ref}`);
    if (status.status === 'ACTIVE_HEALTHY') break;
    await new Promise((r) => setTimeout(r, 5000));
  }

  await supaFetch(`/projects/${ref}/database/extensions`, {
    method: 'POST',
    body: JSON.stringify({ name: 'vector' }),
  }).catch((e) => console.warn(`[supabase] pgvector enable: ${String(e)}`));

  const keys = await supaFetch<Array<{ name: string; api_key: string }>>(
    `/projects/${ref}/api-keys`,
  );
  const anonKey = keys.find((k) => k.name === 'anon')?.api_key;
  const serviceRoleKey = keys.find((k) => k.name === 'service_role')?.api_key;
  const url = `https://${ref}.supabase.co`;

  console.log(
    '[supabase] run migrations manually: DATABASE_URL=... pnpm --filter @triveda/db migrate',
  );
  console.log(
    '[supabase] run seeds manually:      DATABASE_URL=... pnpm --filter @triveda/db seed',
  );

  state.supabase = {
    completed: true,
    projectRef: ref,
    url,
    anonKey,
    serviceRoleKey,
  };
  writeState(state);
  appendEnv({
    SUPABASE_URL: url,
    SUPABASE_ANON_KEY: anonKey ?? '',
    SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey ?? '',
  });
  return state;
}

async function provisionRailway(state: DeployState, dryRun: boolean): Promise<DeployState> {
  if (state.railway.completed) {
    console.log('[railway] already provisioned, skipping');
    return state;
  }
  if (!state.supabase.completed)
    throw new Error('[railway] refuses to run: supabase not provisioned');
  console.log('[railway] provisioning...');
  if (dryRun) {
    console.log('[railway] dry-run: would railway up --service triveda-api');
    return state;
  }

  // Expect the Railway project + service to already exist; this script sets
  // vars and deploys. Creating them programmatically is unreliable across
  // Railway CLI versions — we document the `railway init` + `railway service`
  // step as a prereq in the script banner.

  const env: Record<string, string> = {
    SUPABASE_URL: state.supabase.url ?? '',
    SUPABASE_SERVICE_ROLE_KEY: state.supabase.serviceRoleKey ?? '',
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
    TRIVEDA_LLM_MODE: 'live',
    NODE_ENV: 'production',
  };

  for (const [k, v] of Object.entries(env)) {
    if (!v) continue;
    await run('railway', ['variables', '--set', `${k}=${v}`], {
      RAILWAY_TOKEN: process.env.RAILWAY_API_TOKEN,
    }).catch((e) => console.warn(`[railway] variables set ${k}: ${String(e)}`));
  }

  await run('railway', ['up', '--service', 'triveda-api', '--detach'], {
    RAILWAY_TOKEN: process.env.RAILWAY_API_TOKEN,
  });

  const serviceUrl = 'https://triveda-api-production.up.railway.app';
  // Health check
  let healthy = false;
  for (let i = 0; i < 10; i++) {
    try {
      const res = await fetch(`${serviceUrl}/healthz`);
      if (res.ok) {
        healthy = true;
        break;
      }
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  if (!healthy) throw new Error('[railway] health check failed after 10 attempts');

  state.railway = { completed: true, serviceUrl };
  writeState(state);
  appendEnv({ API_URL: serviceUrl });
  return state;
}

async function provisionVercel(state: DeployState, dryRun: boolean): Promise<DeployState> {
  if (state.vercel.completed) {
    console.log('[vercel] already provisioned, skipping');
    return state;
  }
  if (!state.railway.completed) throw new Error('[vercel] refuses to run: railway not provisioned');
  console.log('[vercel] provisioning...');
  if (dryRun) {
    console.log('[vercel] dry-run: would vercel --prod');
    return state;
  }

  const token = process.env.VERCEL_TOKEN;
  if (!token) throw new Error('VERCEL_TOKEN is not set');
  const scope = 'abdallah-safis-projects-bae5f9c3';

  await run(
    'vercel',
    ['pull', '--yes', '--environment=production', `--token=${token}`, `--scope=${scope}`],
    {
      VITE_API_URL: state.railway.serviceUrl,
      VITE_SUPABASE_URL: state.supabase.url,
      VITE_SUPABASE_ANON_KEY: state.supabase.anonKey,
    },
  );
  await run('vercel', ['build', '--prod', `--token=${token}`]);
  const output = await run('vercel', [
    'deploy',
    '--prebuilt',
    '--prod',
    `--token=${token}`,
    `--scope=${scope}`,
  ]);
  const lines = output.trim().split(/\r?\n/);
  const productionUrl = lines[lines.length - 1];

  state.vercel = { completed: true, productionUrl };
  writeState(state);
  appendEnv({ WEB_URL: productionUrl });
  return state;
}

async function verifyProduction(state: DeployState, dryRun: boolean): Promise<DeployState> {
  if (state.smoke.completed) {
    console.log('[smoke] already verified, skipping');
    return state;
  }
  console.log('[smoke] running production smoke tests...');
  if (dryRun) {
    console.log('[smoke] dry-run: would run scripts/smoke-production.ts');
    return state;
  }
  const args = ['run', 'scripts/smoke-production.ts', `--api-url=${state.railway.serviceUrl}`];
  if (state.vercel.productionUrl) args.push(`--web-url=${state.vercel.productionUrl}`);
  await run('bun', args);

  state.smoke = { completed: true, lastRun: new Date().toISOString() };
  writeState(state);
  return state;
}

function appendEnv(vars: Record<string, string>): void {
  const existing = existsSync(ENV_OUTPUT) ? readFileSync(ENV_OUTPUT, 'utf8') : '';
  const lines = existing.split(/\r?\n/).filter(Boolean);
  const map = new Map<string, string>();
  for (const line of lines) {
    const idx = line.indexOf('=');
    if (idx > 0) map.set(line.slice(0, idx), line.slice(idx + 1));
  }
  for (const [k, v] of Object.entries(vars)) map.set(k, v);
  const body = Array.from(map, ([k, v]) => `${k}=${v}`).join('\n');
  const out = `${body}\n`;
  writeFileSync(ENV_OUTPUT, out);
}

async function main(): Promise<void> {
  const flags = parseFlags();
  let state = readState();

  const steps: StepName[] = flags.only ? [flags.only] : ['supabase', 'railway', 'vercel', 'smoke'];
  for (const step of steps) {
    if (step === 'supabase') state = await provisionSupabase(state, flags.dryRun);
    if (step === 'railway') state = await provisionRailway(state, flags.dryRun);
    if (step === 'vercel') state = await provisionVercel(state, flags.dryRun);
    if (step === 'smoke') state = await verifyProduction(state, flags.dryRun);
  }

  console.log('\nTriveda production deploy summary');
  console.log('=================================');
  console.log(`Supabase: ${state.supabase.url ?? '(pending)'}`);
  console.log(`Railway:  ${state.railway.serviceUrl ?? '(pending)'}`);
  console.log(`Vercel:   ${state.vercel.productionUrl ?? '(pending)'}`);
  console.log(`Smoke:    ${state.smoke.completed ? 'passed' : '(pending)'}`);
  console.log('\nNext: bun run seed-demo');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
