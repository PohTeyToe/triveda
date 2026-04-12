# ADR 006: Three-Call LLM Architecture

## Status

Accepted

## Context

Triveda recommends foods through three healing traditions: Ayurveda, Traditional Chinese Medicine (TCM), and Naturopathy. Each tradition has distinct terminology, reasoning frameworks, and sometimes contradictory recommendations.

A single LLM call with a combined prompt would blend tradition perspectives, making it impossible to clearly attribute which tradition said what. Users need to see each tradition's reasoning in isolation, plus an explicit convergence/divergence analysis.

Two architectural approaches were considered:

1. **Single call:** One prompt asking the LLM to separate its response into tradition sections. Risk: cross-contamination, where Ayurvedic terminology leaks into TCM sections.

2. **Three isolated calls:** Separate prompts with tradition-specific context, system messages, and terminology constraints. Convergence computed by comparing outputs deterministically, not by asking the LLM.

## Decision

Use three isolated LLM calls with deterministic convergence injection.

Each tradition call:
- Has its own system prompt with tradition-specific terminology and reasoning framework
- Receives the same food and user context as input
- Returns a structured response with tradition-specific fields
- Can use a different LLM provider (Claude for Ayurveda, Gemini for TCM, etc.)

Convergence between traditions is computed by comparing the structured outputs, not by asking the LLM. If two or more traditions agree on a property (e.g., "warming"), it is flagged as convergent. If they disagree, it is flagged as a contradiction with both perspectives shown.

## Consequences

**Positive:**
- Tradition isolation prevents cross-contamination (no TCM terminology in Ayurveda section)
- Convergence is deterministic and auditable (not dependent on LLM mood)
- Each call can use a different model (allows cost/quality optimization per tradition)
- Parallel execution via Promise.all reduces total latency to ~max(individual call times)
- SSE streaming delivers results as each tradition completes (progressive rendering)
- Easier to test: each tradition call can be unit-tested independently

**Negative:**
- 3x LLM cost per recommendation (mitigated by caching and short prompts)
- Higher orchestration complexity (retry logic, partial failure handling)
- Latency is bounded by the slowest tradition call, not the average
- More complex error states (what if only 2 of 3 traditions succeed?)
