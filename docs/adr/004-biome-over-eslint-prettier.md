# ADR 004: Biome over ESLint + Prettier

## Status

Accepted

## Context

The project needs linting and formatting tools. The standard approach is ESLint for linting plus Prettier for formatting. However, this requires configuring two tools, managing potential conflicts between them, and accepting slow execution times on large codebases.

Biome is a unified Rust-based tool that handles both linting and formatting in a single pass.

## Decision

Use Biome 1.9.x for linting and formatting.

## Consequences

**Positive:**
- 10-100x faster than ESLint + Prettier combined
- Single tool replaces two (simpler configuration, fewer dependencies)
- Growing TypeScript and React support (hooks rules available in 1.9)
- Consistent formatting without config drift between lint and format tools

**Negative:**
- Fewer rules than the ESLint ecosystem (no plugin system yet)
- Team must learn Biome's configuration format
- Some ESLint plugins (e.g., import sorting, accessibility) have no Biome equivalent yet
