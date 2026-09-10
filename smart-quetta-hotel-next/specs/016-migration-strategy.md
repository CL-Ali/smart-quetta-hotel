# 016 Migration Strategy

## Principle

Migrate the domain in place. Do not rewrite the stack.

## What Stays

- Frontend shell and routing
- tRPC transport
- SQLite persistence for MVP
- Existing kitchen, waiter, menu, billing, and inventory screens
- PWA behavior

## What Changes First

- Customer becomes Guest
- Visit lifecycle becomes the primary temporary business scope
- Browser session is separate from guest identity and visit state
- Order stays Order, but is attached to Visit
- Invoice and Receipt become explicit billing records
- Hotel-specific wording is removed from the UI and API names

## Phase Plan

### Phase 1

- Reuse UI
- Create Guest
- Open Visit
- Resume Visit
- Close Visit
- Keep Order
- Add Invoice
- Remove hotel terms

### Phase 2

- Add event catalog
- Add state machines
- Tighten API contracts
- Separate portal boundary

### Phase 3

- Clean up old naming
- Add acceptance criteria per feature
- Prepare release plan for modular rollout

## Migration Rules

- Do not delete working flows unless the replacement is already live.
- Do not introduce a second frontend framework.
- Do not move to PostgreSQL or Prisma during this migration.
- Prefer additive refactors over breaking changes.
