# ADR 009: 22-Feature Credit Row

## Status

Accepted

## Context

Sasha (project stakeholder) requires all 22 HolisticAI features to be visibly credited in the product. Her exact words (March 22): "The only thing static is we have all 22 features. They are not going anywhere. They are all here, powering this recommendation."

The challenge: showing 22 features without overwhelming the user. Most health apps claim features in marketing copy but never show them in the product itself. Sasha wants them visible, not just claimed.

## Decision

An explicit credit row on every daily food recommendation shows which of the 22 features contributed to the selection.

Implementation:
- 22 horizontal chips below the daily food card
- Active features (those that influenced today's recommendation) are highlighted with a teal accent
- Inactive features are dimmed but still visible
- Each chip has a tooltip explaining what the feature does and how it contributed
- The row scrolls horizontally on mobile to avoid vertical space consumption

The 22 feature IDs are defined in a canonical registry (`packages/shared/src/credits.ts`). The scoring engine emits `CreditSource` objects that trace each feature's contribution to the final recommendation.

## Consequences

**Positive:**
- Satisfies Sasha's hard requirement -- all 22 features are visible on every recommendation
- Provides genuine transparency -- users can see which features are active vs. dormant
- Each chip is traceable to a specific scoring input (not decorative)
- Active/inactive state changes daily as different factors become relevant
- Demonstrates backend intelligence depth without requiring users to navigate to a settings page

**Negative:**
- Visual complexity on small screens (mitigated by horizontal scroll and subtle inactive styling)
- Risk of confusing users unfamiliar with the feature names (mitigated by tooltip explanations)
- 22 chips is a lot -- careful design work needed to keep it from feeling cluttered
- Each new feature must be registered in the canonical registry to appear
