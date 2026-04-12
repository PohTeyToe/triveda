# ADR 001: Bun over Node.js

## Status

Accepted

## Context

Triveda needs a JavaScript/TypeScript runtime for the backend API. Node.js is the industry default with the largest ecosystem. Bun is a newer runtime that offers native TypeScript execution, faster startup times, and a built-in test runner.

The backend runs on Render's free tier, where cold starts are a real concern. Every second of startup time matters for the demo experience and user-facing latency.

## Decision

Use Bun as the backend runtime.

## Consequences

**Positive:**
- 3-5x faster cold starts compared to Node.js (critical for Render free tier)
- Native TypeScript execution without a transpilation step
- Built-in test runner (`bun test`) -- no need for a separate test framework
- Top-level await works out of the box
- Built-in bundler for production builds

**Negative:**
- Smaller ecosystem than Node.js; some npm packages may have compatibility issues
- Team familiarity is lower
- Fewer production deployment guides and troubleshooting resources
- Some Node.js APIs behave slightly differently (crypto, fs edge cases)
