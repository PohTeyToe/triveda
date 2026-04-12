# ADR 007: Database + LLM over Pure LLM

## Status

Accepted

## Context

Triveda recommends foods for health purposes. Two fundamental architectures were considered:

1. **Pure LLM:** Ask the LLM directly "what should this person eat?" The LLM has broad nutritional knowledge and could generate personalized recommendations.

2. **Database + LLM:** A structured food database contains 55 canonical foods with Ayurvedic properties (rasa, virya, vipaka, guna, dosha effects), TCM properties (element fit, thermal nature), and evidence grades. Deterministic scoring engines rank foods. The LLM only explains why a food was selected -- it cannot choose the food itself.

The health-adjacent nature of Triveda makes hallucination risk unacceptable. If the LLM invents a food property or recommends something inappropriate for a dosha, there is no audit trail and no way to trace the error.

## Decision

Use a structured food database with deterministic scoring for food selection. The LLM's role is narration only.

The pipeline is:

1. **Engines** (pure TypeScript math) produce factor scores for each food based on constitution, season, weather, time of day, and element balance.
2. **Scoring** composes factor scores with weights to produce a final ranked list.
3. **Selection** picks the top-scored food that passes dietary restriction filters.
4. **LLM** receives the selected food, user context, and scores, then generates tradition-specific narratives explaining the recommendation.

The LLM cannot override the selection. It can only explain.

## Consequences

**Positive:**
- Zero hallucination risk: the LLM cannot recommend a food that does not exist in the database
- Every score traces to a database entry -- fully auditable pipeline
- Model-independent: swapping Claude for Gemini changes the narrative voice but not the recommendation
- Deterministic: same inputs always produce the same food selection (testable with golden snapshots)
- Scoring weights can be tuned without retraining or re-prompting

**Negative:**
- Limited to the 55 seeded foods (mitigated by LLM-on-demand for unlisted foods via Browse)
- Database maintenance overhead -- adding new foods requires structured data entry
- Cannot leverage LLM's broader nutritional knowledge for food discovery
- Scoring weights are hand-tuned, not learned from user behavior (acceptable for MVP)
