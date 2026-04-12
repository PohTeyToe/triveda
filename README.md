# Triveda

Three-tradition daily food companion. Reads your body through Ayurveda, TCM, and Naturopathy, then tells you what to eat today. One food. Two sentences. Fifteen seconds.

## Architecture

```
Browser -> Vercel (React 19 SPA) -> Render (Hono/Bun API) -> Supabase (Postgres + pgvector)
                                                          -> Claude / Gemini (LLM)
                                                          -> OpenWeather

Recommendation Pipeline:
  Deterministic Engines (5) -> 6-Factor Scoring -> LLM Orchestration (3 calls) -> 22-Feature Credits
```

## Quickstart

```bash
git clone https://github.com/PohTeyToe/triveda.git
cd triveda
cp .env.example .env.local   # fill in required values
pnpm install
pnpm dev                     # starts frontend (3001) + backend (3000)
```

## Environment Variables

| Variable | Required | Description |
|-|-|-|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend | Service role key for admin operations |
| `VITE_SUPABASE_URL` | Frontend | Supabase URL for auth |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Supabase anonymous key |
| `VITE_API_URL` | Frontend | Backend API URL |
| `VITE_ENABLE_DEMO_MODE` | Optional | Enable demo mode (auto-auth, no real Supabase) |
| `ANTHROPIC_API_KEY` | Yes | Claude API for LLM tradition calls |
| `OPENWEATHER_API_KEY` | Yes | Weather data for seasonal scoring |
| `TRIVEDA_LLM_MODE` | Optional | `mock` for testing, `live` for production |
| `DATABASE_URL` | Backend | Postgres connection string (service role) |

## Commands

| Command | What it runs |
|-|-|
| `pnpm dev` | Start frontend + backend dev servers |
| `pnpm build` | Build all packages |
| `pnpm test` | Vitest unit tests (all packages) |
| `pnpm lint` | Biome lint + format check |
| `pnpm typecheck` | TypeScript type check (tsc -b) |
| `cd apps/api && bun test` | Backend API tests |
| `bun run smoke` | Production smoke tests |
| `bun run seed-demo` | Seed demo user with 14-day data |

## Project Structure

```
triveda/
  apps/
    web/                     React 19 frontend (Vite, TanStack Router)
    api/                     Hono backend (Bun runtime)
  packages/
    shared/                  Types, Zod schemas, engines, scoring, credits
    db/                      Drizzle schema, migrations, seeds
  scripts/
    smoke-production.ts      Production smoke test
    seed-demo-user.ts        Demo user seeder
  .github/workflows/         CI, Vercel preview, Render deploy, Claude review
```

## Stack

- **Frontend:** React 19, Vite 7, Tailwind v4, TanStack Router + Query
- **Backend:** Hono on Bun, OpenAPI via @hono/zod-openapi
- **Database:** Supabase Postgres with pgvector, Drizzle ORM
- **LLM:** Three isolated tradition calls (Ayurveda, TCM, Naturopathy)
- **Auth:** Supabase Auth with JWT, validated via JWKS
- **Deploy:** Vercel (frontend), Render (backend Docker)
- **CI:** GitHub Actions (lint, typecheck, test, build)
- **Lint:** Biome 1.9.x (replaces ESLint + Prettier)

## Key Design Decisions

**Database + LLM, not pure LLM.** A structured food database (55 foods, 18 herbs) with deterministic scoring selects the recommendation. The LLM only narrates why -- it cannot hallucinate a food that does not exist in the database.

**Three isolated LLM calls.** Each tradition gets its own prompt and response. Convergence between traditions is computed deterministically, not by the LLM. This prevents cross-contamination between Ayurvedic, TCM, and Naturopathic perspectives.

**22-feature credit row.** Every daily recommendation shows which of the 22 backend features contributed to the selection. Each chip is clickable and traces back to a specific scoring input.

**Progressive profiling.** Users answer 3 questions on day 1 (under 30 seconds), then 1 question per day for 15 days. The profile builds naturally without a long intake form.

## Deployment

- **Frontend:** Vercel deploys via `vercel-preview.yml` (PRs) and manual production deploys
- **Backend:** Render auto-deploys from main via `render-deploy.yml`
- **Database:** Supabase with migrations in `packages/db/migrations/`

## License

Private repository.
