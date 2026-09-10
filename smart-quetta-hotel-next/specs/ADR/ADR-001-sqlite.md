# ADR-001: Use SQLite For The MVP

## Status

Accepted

## Context

The current repository already uses SQLite and auto-initializes schema on startup. The MVP must stay low-risk and deployable without a separate database service.

## Decision

Keep SQLite for the MVP and expose repository abstractions around storage so the persistence layer can evolve later.

## Consequences

- Faster local development and easier Docker deployment
- Lower operational complexity for LAN-first setups
- Future migration to another database remains possible through repository boundaries
