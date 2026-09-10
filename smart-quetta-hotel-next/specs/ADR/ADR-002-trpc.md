# ADR-002: Keep tRPC For The Application API

## Status

Accepted

## Context

The current app already uses tRPC for frontend-to-backend calls and shares types across the stack.

## Decision

Keep tRPC for the internal application API during the MVP and add REST only where captive portal or network integration requires it.

## Consequences

- Shared types and simpler refactors
- Less duplication between frontend and backend contracts
- External boundaries can still be exposed via REST where required
