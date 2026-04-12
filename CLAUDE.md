# Triveda

Three-tradition daily food companion. Ayurveda (food lens), TCM (energy/temporal lens), Naturopathy (evidence/honesty lens).

## Stack

| Layer | Choice |
|-|-|
| Frontend | React 19 + Vite 7 + Tailwind v4 + TanStack Router + TanStack Query v5 |
| Backend | Hono on Bun |
| ORM | Drizzle |
| Validation | Zod 3.24.x (NOT Zod 4) |
| Database | Supabase Postgres + pgvector |
| Auth | Supabase Auth, JWT validated via Hono JWK middleware |
| Monorepo | pnpm workspaces (Turborepo evaluated and deferred for 4 packages) |
| Frontend deploy | Vercel (CLI deploys, Hobby plan git author workaround) |
| Backend deploy | Render (Docker, auto-deploy from main) |
| Linting | Biome 1.9.x |
| CI/CD | GitHub Actions (ci, vercel-preview, render-deploy, claude-review, codeql) |

## Package Structure

| Package | Purpose | Imported by |
|-|-|-|
| `@triveda/shared` | Types, Zod schemas, engine/LLM interfaces, credits | web, api |
| `@triveda/db` | Drizzle config, migrations, seed | api only |
| `@triveda/web` | React frontend app | - |
| `@triveda/api` | Hono backend app | - |

## Key Files

| Path | Purpose |
|-|-|
| `apps/web/src/routes/` | TanStack Router file-based routes |
| `apps/api/src/app.ts` | Hono app with all routes |
| `apps/api/src/env.ts` | Environment validation |
| `packages/shared/src/engines/` | Deterministic scoring engines (5 engines) |
| `packages/shared/src/scoring/` | 6-factor food scoring + credit emission |
| `packages/shared/src/llm/` | LLM types and interfaces |
| `apps/api/src/llm/` | Three-call LLM orchestration (runtime) |
| `packages/db/` | Drizzle schema, migrations, seeds (55 foods, 18 herbs) |
| `scripts/smoke-production.ts` | Production smoke test (bun run smoke) |
| `scripts/seed-demo-user.ts` | Demo user seeder (bun run seed-demo) |

## Credentials

All credentials in `.env.local` (gitignored). See `.env.example` for required vars.

- Supabase: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- API: `VITE_API_URL` (Render URL in prod: `https://triveda-api.onrender.com`)
- Deploy: `VERCEL_TOKEN`, `RENDER_API_KEY`, `CC_OAUTH_TOKEN`

### GitHub Actions Secrets

| Secret | Purpose |
|-|-|
| `VERCEL_TOKEN` | Vercel CLI deploys (preview + production) |
| `CLAUDE_CODE_OAUTH_TOKEN` | Claude Code review bot (from `CC_OAUTH_TOKEN` env var) |
| `RENDER_API_KEY` | Render deploy API |

### Render

- Service ID: `srv-d7drs21kh4rs73a0a250`
- URL: `https://triveda-api.onrender.com`
- Dockerfile: `apps/api/Dockerfile`

## Environment and Demo Mode

- `VITE_ENABLE_DEMO_MODE=true` auto-authenticates as demo user (no real Supabase needed)
- `TRIVEDA_LLM_MODE=mock` returns deterministic mock responses (for CI and offline dev)
- `DEMO_MODE=true` on the backend enables demo state endpoints

## CI/CD Pipeline

5 workflows in `.github/workflows/`:

| Workflow | Purpose |
|-|-|
| `ci.yml` | Quality gate: lint (Biome), typecheck, Vitest, build. Runs on PRs and pushes to main |
| `vercel-preview.yml` | Deploys preview URLs per PR with Hobby plan author workaround |
| `render-deploy.yml` | Triggers Render deploy on push to main (apps/api changes only) |
| `claude-review.yml` | AI code review on PR open + @claude mentions |
| `codeql.yml` | GitHub CodeQL security scanning |

Path filters ensure docs-only changes do not trigger CI.

## Testing

| Command | What it runs |
|-|-|
| `pnpm test` | Vitest unit tests across all packages |
| `cd apps/api && bun test` | Backend API tests (Bun test runner) |
| `bun run smoke` | Production smoke test against live endpoints |
| `bun run seed-demo` | Seed demo user with 14-day data |

Backend tests run with `TRIVEDA_LLM_MODE=mock` and `NODE_ENV=test`.

## Agent Rules

- Use Opus 4.6 for subagents
- Never use `$()` command substitution in Bash calls
- Draft outbound messages, never send directly
- No em-dashes in prose
- No box-drawing characters in tables

## Implementation Progress

Planning docs at `C:\VJDS-triveda-planning\` -- 14 splits, 135 sections, 3 amendment files.

All 14 splits are complete.

| Split | Status | Description |
|-|-|-|
| 01-foundation | Complete | Monorepo, React app, Hono API, Supabase, CI/CD |
| 02-deterministic-engines | Complete | 5 engines + convergence + 308 tests |
| 03-food-herb-database | Complete | Schemas, migrations, 55 foods + 18 herbs seeded |
| 04-scoring-engine | Complete | 6-factor scoring, credit emission, golden snapshots |
| 05-llm-orchestration | Complete | Three-call LLM, prompts, mocks, streaming |
| 06-backend-api | Complete | 20+ API routes, middleware chain, OpenAPI docs |
| 07-onboarding-daily-card | Complete | Constitution assessment, daily food card, SSE |
| 08-browse-profile | Complete | Food/herb browse, profile settings, virtual scroll |
| 09-share-flow | Complete | OG images, share modal, public constitution view |
| 10-blood-work | Complete | PDF upload, biomarker parsing, food influences |
| 11-additional-inputs | Complete | Check-ins, face scan, cultural cuisine matching |
| 12-triggered-outputs | Complete | Weekly herb, triggered lifestyle cards, pattern detection |
| 13-seasonal-ritu | Complete | Seasonal transitions, Ritu calendar |
| 14-testing-demo-deploy | Complete | Smoke tests, demo seeder, CI updates, docs |

### Amendments (must-read for implementers)

- `C:\VJDS-triveda-planning\amendments\001-missing-schemas-endpoints.md`
- `C:\VJDS-triveda-planning\amendments\002-architecture-fixes.md`
- `C:\VJDS-triveda-planning\amendments\003-risks-and-improvements.md`

### Decisions Made During Implementation

| Decision | Rationale |
|-|-|
| Render not Railway | Railway free tier maxed. Render service: srv-d7drs21kh4rs73a0a250 |
| AppYo Supabase account | Main account full. Use SUPABASE_APPYO_ACCESS_TOKEN for Triveda |
| LLM runtime in apps/api | packages/shared has types only. Runtime in apps/api/src/llm/ |
| AppType stays in apps/api | Not in packages/shared (avoids circular dep) |
| snake_case in DB types | Mapper in split 06 converts to camelCase for scoring |
| drizzle-zod uses zod/v4 | drizzle-zod 0.8.3 internal import path |
| Migration ranges | 03: 0001-0009, 06: 0010-0019, 10: 0020-0029, 12: 0030-0039, 11: 0040-0049 |

## Key Decisions

| Decision | Rationale |
|-|-|
| pnpm workspaces, no Turborepo | 4-package monorepo does not justify Turborepo complexity |
| Zod 3.24.x, not Zod 4 | @hono/zod-validator, drizzle-zod, @hookform/resolvers all expect Zod 3 |
| Bun runtime for backend | 3-5x faster cold starts than Node.js, native TS, built-in test runner |
| Hono over Express/Fastify | Web Standard APIs, multi-runtime, built-in OpenAPI via @hono/zod-openapi |
| Drizzle over Prisma | SQL-like syntax, zero runtime overhead, migration-first fits Supabase |
| Biome over ESLint+Prettier | 10-100x faster, single tool replaces two |
| Three-call LLM architecture | Tradition isolation prevents cross-contamination; convergence computed deterministically |
| DB+LLM over pure LLM | Zero hallucination risk; LLM only narrates, never selects foods |
| Progressive profiling | 3 questions upfront, 1/day for 15 days; user does not notice the work |
| 22-feature credit row | Satisfies Sasha's "all 22 features visible" requirement |
| Supavisor port 6543 | Transaction mode with prepare: false, not direct port 5432 |
| Demo mode | VITE_ENABLE_DEMO_MODE=true for offline dev and CI |

## Troubleshooting

| Issue | Fix |
|-|-|
| Render cold start (30s+ delay) | `bun run smoke` retries health check 10 times at 3s intervals |
| SSE timeout on slow connections | Frontend TanStack Query has 30s timeout; smoke test uses 20s |
| Demo user missing | Run `bun run seed-demo` against production Supabase |
| Coverage below threshold | Check per-package vitest.config.ts for 80% line minimums |
| Demo state stuck | POST /api/v1/demo-state/reset to return to day 1 |
| Build fails in CI | Verify VITE_ENABLE_DEMO_MODE=true and empty Supabase vars |
