# ADR-003: Migrate The Existing System Instead Of Rewriting It

## Status

Accepted

## Context

The repository already contains the main customer, kitchen, waiter, billing, inventory, and PWA flows. Rewriting the stack would waste working code and increase delivery risk.

## Decision

Perform an in-place domain migration and keep the existing frontend, tRPC layer, and SQLite storage for the MVP.

## Consequences

- Higher reuse of stable code
- Lower implementation risk
- Faster path to a production-ready MVP
- More discipline required when naming and separating business concepts
