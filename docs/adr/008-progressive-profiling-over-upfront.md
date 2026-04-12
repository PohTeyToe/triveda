# ADR 008: Progressive Profiling over Upfront Forms

## Status

Accepted

## Context

Full constitutional profiling requires 18 answers across dosha assessment, five-element mapping, and metabolic typing. Traditional health apps present this as a long intake form, which causes significant abandonment.

Sasha (project stakeholder) stated: "People can't even do 3-second Instagram reels." A long form contradicts the product's core promise of simplicity.

## Decision

3 questions upfront (Quick Start), then 1 question per day for 15 days.

Day 1: User answers 3 questions (under 30 seconds). Gets an approximate constitution profile and their first food recommendation immediately.

Days 2-16: One additional question appears above the daily food card each day. The profile refines progressively. Users do not realize they are "doing the work" because each question is embedded in the daily ritual.

The scoring engine accepts partial profiles. Early recommendations use wider confidence intervals and default assumptions for unanswered questions.

## Consequences

**Positive:**
- Day 1 requires less than 30 seconds of effort
- Profile builds naturally as part of daily app usage
- Users do not perceive a burden -- one question per day feels trivial
- Immediate value delivery (food recommendation on day 1) before full profile
- Dropout at any point still leaves a usable (if less personalized) profile

**Negative:**
- 2 weeks for full accuracy -- early recommendations are less personalized
- Progressive improvement must be communicated to users (so they understand why recommendations change)
- More complex backend logic (partial profile handling, confidence scoring)
- Testing requires simulating multi-day journeys
