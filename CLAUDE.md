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

## Agent Rules

- Use Opus 4.6 for subagents
- Never use `$()` command substitution in Bash calls
- Draft outbound messages, never send directly
- No em-dashes in prose
- No box-drawing characters in tables

## Key Decisions

| Decision | Rationale |
|-|-|
| pnpm workspaces, no Turborepo | 4-package monorepo does not justify Turborepo complexity |
| Zod 3.24.x, not Zod 4 | @hono/zod-validator, drizzle-zod, @hookform/resolvers all expect Zod 3 |
| Vite 7, not Vite 8 | Vite 8 does not exist as of this writing |
| Biome 1.9.x, not 2.x | Biome 2.x may not exist; 1.9 has React hooks rules |
| Supavisor port 6543 | Transaction mode with prepare: false, not direct port 5432 |
| Demo mode | VITE_ENABLE_DEMO_MODE=true for offline dev and CI |
