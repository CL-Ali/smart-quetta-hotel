# 031 Implementation Phases

## Purpose

Turn the architecture into a safe coding sequence.

Each phase should preserve the current app, ship incrementally, and keep rollback simple.

## Phase 1: Database Migration

### Scope

- Add Guest, Visit, BrowserSession, Invoice, Receipt, and related fields without deleting current tables.
- Keep Customer and Orders compatible during transition.
- Introduce repository interfaces around SQLite access.

### Files

- [api/db/schema.ts](api/db/schema.ts)
- [api/db/index.ts](api/db/index.ts)
- [api/routers/hotelRouter.ts](api/routers/hotelRouter.ts)
- [specs/004-database.md](specs/004-database.md)

### Risks

- Breaking existing order queries.
- Losing compatibility with current UI data shape.

### Rollback

- Keep the old Customer and Order fields populated until the new paths are verified.
- Revert schema additions only if they are additive and unused.

### Acceptance

- Existing customer and order flows still work.
- New Guest and Visit records can be created alongside old data.

## Phase 2: Backend

### Scope

- Split domain logic into guest, visit, order, invoice, payment, kitchen, and system procedures gradually.
- Keep [api/routers/hotelRouter.ts](api/routers/hotelRouter.ts) stable until the new procedures are proven.
- Emit commands and events from the same write paths.

### Files

- [api/routers/hotelRouter.ts](api/routers/hotelRouter.ts)
- [api/routers/index.ts](api/routers/index.ts)
- [api/lib/trpc.ts](api/lib/trpc.ts)
- [api/lib/context.ts](api/lib/context.ts)

### Risks

- Large router refactor can break tRPC contract compatibility.
- Event emission may drift from persistence if added too early.

### Rollback

- Keep old procedures in place until new ones pass end-to-end tests.
- Route new behavior behind additive procedures instead of renaming everything at once.

### Acceptance

- Guest, Visit, Order, Invoice, and Payment flows can be called independently.
- The current app remains usable while backend splitting is in progress.

## Phase 3: Frontend

### Scope

- Migrate Home into Guest Entry and Visit flow.
- Keep Dashboard, Kitchen, and Waiter working while labels and queries evolve.
- Reuse existing shared components and modal patterns.

### Files

- [src/pages/Home.tsx](src/pages/Home.tsx)
- [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx)
- [src/pages/Kitchen.tsx](src/pages/Kitchen.tsx)
- [src/pages/Waiter.tsx](src/pages/Waiter.tsx)
- [src/components/NewOrderSheet.tsx](src/components/NewOrderSheet.tsx)
- [src/components/ModalSheet.tsx](src/components/ModalSheet.tsx)

### Risks

- UI terminology can drift faster than backend support.
- Repeating order logic in multiple components can create inconsistency.

### Rollback

- Keep current screens intact until new guest/visit views are verified.
- Preserve existing menu and order UX until the new flow is stable.

### Acceptance

- Guest entry, visit recovery, ordering, invoice, and receipt flows are usable in the UI.
- Kitchen and Waiter screens still work with the migrated domain.

## Phase 4: Realtime

### Scope

- Implement the command/event catalog.
- Wire socket events to persisted state transitions.
- Keep REST/tRPC as the source of truth.

### Files

- [specs/006-realtime.md](specs/006-realtime.md)
- [specs/018-event-catalog.md](specs/018-event-catalog.md)
- [api/routers/\*.ts](api/routers)

### Risks

- Duplicate event emission.
- Stale UI if events are emitted before commit.

### Rollback

- Fall back to polling and refetching if socket updates misbehave.
- Keep events additive until they are stable.

### Acceptance

- Order, invoice, payment, and receipt updates appear in realtime.
- UI can recover by refetching when events are missed.

## Phase 5: Captive Portal

### Scope

- Add portal adapter boundary.
- Implement portal entry and session resume flow.
- Keep vendor-specific integrations isolated.

### Files

- [specs/009-captive-portal.md](specs/009-captive-portal.md)
- [specs/023-session-recovery.md](specs/023-session-recovery.md)
- [specs/024-network-architecture.md](specs/024-network-architecture.md)

### Risks

- Network-specific behavior may vary by router.
- Portal logic can accidentally leak into business rules.

### Rollback

- Disable the portal adapter and keep the app accessible by normal browser navigation.
- Preserve guest recovery by ticket or QR even if a router integration fails.

### Acceptance

- Guest can enter through portal and resume a visit.
- Portal adapters remain isolated from the main business logic.

## Phase 6: Testing

### Scope

- Add acceptance tests for the core business cycle.
- Cover recovery, billing, and payment edge cases.
- Verify existing flows still work after migration.

### Files

- [specs/020-acceptance-criteria.md](specs/020-acceptance-criteria.md)
- [specs/027-error-handling.md](specs/027-error-handling.md)
- [api/routers/auth.logout.test.ts](api/routers/auth.logout.test.ts)

### Risks

- Tests can become brittle if tied to old hotel wording.
- Missing recovery cases may hide regressions.

### Rollback

- Keep tests focused on business state, not UI copy.
- Add regression tests before removing old paths.

### Acceptance

- Guest, Visit, Order, Invoice, Payment, Receipt, and Recovery scenarios are covered.
- Core old flows still pass until deprecation.

## Phase 7: Deployment

### Scope

- Keep Docker deployment simple.
- Ensure SQLite persistence and backups are in place.
- Verify LAN and captive portal behavior in staging.

### Files

- [specs/014-deployment.md](specs/014-deployment.md)
- [docker-compose.yml](docker-compose.yml)
- [Dockerfile](Dockerfile)

### Risks

- Storage path mistakes can cause data loss.
- Network integration can differ from local development.

### Rollback

- Keep the last known working Docker image.
- Restore the SQLite volume from backup if a deployment fails.

### Acceptance

- App runs in Docker with the current MVP stack.
- LAN access, billing flow, and recovery remain functional after deployment.
