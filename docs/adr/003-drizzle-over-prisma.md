# ADR 003: Drizzle over Prisma

## Status

Accepted

## Context

Triveda needs a TypeScript ORM for Supabase Postgres. Two main contenders:

- **Prisma:** Most popular TypeScript ORM, declarative schema, powerful migrations, query engine binary.
- **Drizzle:** SQL-like syntax, zero runtime overhead, migration-first workflow, strong TypeScript inference.

Supabase's architecture (pgvector, RLS policies, Supavisor pooler) creates specific constraints. Prisma's query engine binary adds cold start latency, which conflicts with Render free tier performance goals.

## Decision

Use Drizzle ORM.

## Consequences

**Positive:**
- SQL-like syntax means less abstraction; queries read like SQL
- Zero runtime overhead (no query engine binary to load at startup)
- Migration-first workflow fits Supabase's migration tooling
- Excellent TypeScript inference from schema definitions
- Works well with Supavisor transaction mode (`prepare: false`)

**Negative:**
- Less mature than Prisma; fewer tutorials and guides
- Manual migration writing (no auto-generation from schema changes)
- Smaller community, though growing rapidly
