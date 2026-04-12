# ADR 002: Hono over Elysia and Fastify

## Status

Accepted

## Context

The backend needs a web framework that runs well on Bun. Three options were evaluated:

- **Elysia:** Bun-native, strong type inference, but newer with a smaller community.
- **Fastify:** Mature, well-documented, but designed for Node.js.
- **Hono:** Multi-runtime (Bun, Deno, Cloudflare Workers, Node.js), Web Standard APIs, built-in OpenAPI support via `@hono/zod-openapi`.

Triveda's API benefits from OpenAPI documentation (for the AI review bot and typed client generation) and may need to move between runtimes in the future.

## Decision

Use Hono for the backend framework.

## Consequences

**Positive:**
- Web Standard APIs (Request/Response) -- portable across runtimes
- `@hono/zod-openapi` provides automatic OpenAPI spec generation with Zod schema validation
- Type-safe client via `hc` (Hono Client) for frontend consumption
- Middleware ecosystem covers auth, CORS, rate limiting, logging
- Active development with strong community momentum

**Negative:**
- Less middleware available than Express/Fastify ecosystem
- Documentation is still growing compared to Express
- Some advanced patterns (e.g., WebSocket upgrades) require more manual work
