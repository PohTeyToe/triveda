# ADR 005: pnpm Workspaces over Turborepo

## Status

Accepted

## Context

The Triveda monorepo has 4 packages: `@triveda/web`, `@triveda/api`, `@triveda/shared`, `@triveda/db`. Turborepo adds task-level caching and parallel execution. pnpm workspaces provide basic monorepo support with workspace linking and recursive commands.

## Decision

Use pnpm workspaces without Turborepo.

## Consequences

**Positive:**
- Simpler setup with no additional dependency
- pnpm store caching is sufficient for the project's scale
- No learning curve for Turborepo configuration
- Fewer moving parts in CI/CD

**Negative:**
- No cross-package task caching (each CI run rebuilds all packages)
- No remote caching for developer machines
- Acceptable trade-off: CI runs complete in 3-6 minutes, and the 4-package monorepo does not benefit enough from Turborepo's caching to justify the added complexity
