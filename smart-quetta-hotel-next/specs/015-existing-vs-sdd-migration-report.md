# 015 Existing App vs SDD Migration Report

## What Already Exists

The current repository is not a blank starter. It is already a working hotel / restaurant POS-style application with these implemented areas:

- Customer ordering flow in [src/pages/Home.tsx](src/pages/Home.tsx)
- Admin dashboard in [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx)
- Kitchen queue in [src/pages/Kitchen.tsx](src/pages/Kitchen.tsx)
- Waiter serving flow in [src/pages/Waiter.tsx](src/pages/Waiter.tsx)
- tRPC backend mounted at `/api/trpc` in [api/index.ts](api/index.ts)
- SQLite persistence with auto schema creation in [api/db/index.ts](api/db/index.ts)
- Orders, items, inventory, stock, customers, payments already modeled in [api/db/schema.ts](api/db/schema.ts)
- Multilingual UI and theme plumbing in [src/contexts/LangContext.tsx](src/contexts/LangContext.tsx) and [src/contexts/ThemeContext.tsx](src/contexts/ThemeContext.tsx)
- PWA registration and offline-ready service worker setup in [src/main.tsx](src/main.tsx)

## Reusable Pieces To Keep

Keep these because they are already useful and reusable for the SDD target:

- API client and query layer: [src/lib/trpc.ts](src/lib/trpc.ts), [api/lib/trpc.ts](api/lib/trpc.ts)
- Design-system UI primitives under [src/components/ui/](src/components/ui)
- Layout and shell components such as [src/components/NavBar.tsx](src/components/NavBar.tsx), [src/components/Logo.tsx](src/components/Logo.tsx), [src/components/LangSwitcher.tsx](src/components/LangSwitcher.tsx)
- Mobile-aware modal patterns in [src/components/ModalSheet.tsx](src/components/ModalSheet.tsx) and [src/components/NewOrderSheet.tsx](src/components/NewOrderSheet.tsx)
- Shared utility helpers like [src/lib/utils.ts](src/lib/utils.ts) and [src/hooks/useMobile.tsx](src/hooks/useMobile.tsx)
- Global styling tokens in [src/index.css](src/index.css)
- Auth/session helpers in [api/lib/sdk.ts](api/lib/sdk.ts), [api/lib/context.ts](api/lib/context.ts), and [api/lib/cookies.ts](api/lib/cookies.ts)

## What The New SDD Changes

The SDD target changes the domain language and the architecture boundary.

- Current app language is hotel POS centric; SDD language is Guest -> Visit -> Browser Session -> Order -> Invoice -> Payment -> Receipt.
- Current backend is SQLite plus tRPC; SDD keeps that MVP stack but adds clearer command/event contracts, repository abstraction, and network adapters around it.
- Current customer flow uses local customer identity and table/seating concepts; SDD introduces captive-portal-led entry, visit-scoped identity, and recovery paths by ticket, QR, phone, staff, or cookie.
- Current billing is order-centered; SDD wants visit-centered billing with explicit invoices, receipts, and payment state.
- Current frontend already supports customer, kitchen, waiter, and admin views; SDD keeps those views but renames and reshapes the data model under a stronger domain model.

## Main Gap Analysis

### Already Done

- Menu browsing and order placement
- Kitchen status tracking
- Waiter serving flow
- Payments and partial payments
- Inventory and stock management
- Multi-language support
- PWA install/offline plumbing

### Still Needed For SDD

- Captive portal adapter boundary with vendor-specific adapters
- Guest identity, visit lifecycle, and browser session recovery
- Invoice and receipt entities separated from raw order state
- Command catalog and event catalog with explicit transition semantics
- Clear API contracts for portal-facing and operational endpoints
- Realtime event contract for order, invoice, payment, and receipt lifecycle
- State machines for guest, visit, order, invoice, and payment
- Stricter domain naming so the app reads like a restaurant ordering system, not a generic hotel POS

## Code That Should Not Be Kept As-Is

These areas are useful today but should be reviewed during migration because they are hotel-specific or too coupled to the current implementation:

- `customerName` as the main identity key in order queries and mutations
- `seatingAreaId` and `seating_areas` as the primary entry model for guest flow
- order-centered payment logic where invoice is implicit instead of explicit
- UI labels that say hotel/admin panel where the SDD product should say restaurant ordering system
- direct order-to-inventory coupling that should move behind inventory events

## Important API Reality

The current app does not expose a `/api/guest/session` route. The backend entry point today is tRPC under `/api/trpc`, plus OAuth callback handling in [api/middleware/oauth.ts](api/middleware/oauth.ts). That means the failed curl request is expected with the current codebase and must be implemented as a new API surface if you want that flow.

## Recommended Migration Order

1. Freeze the SDD docs in [specs/](specs).
2. Keep the shared UI, language, and modal primitives.
3. Introduce Guest, Visit, and Browser Session models without deleting the current order flows.
4. Add invoice, payment, and receipt contracts.
5. Add command/event catalog and state machines.
6. Add captive portal adapter integration as a separate boundary.
7. Rename UI and API terminology only after the domain layer is stable.

## Reuse Principle

Do not rebuild the whole project.

Reuse the current shell, language system, order screens, kitchen flow, waiter flow, and payment components where possible. Replace only the domain coupling and endpoint shapes that conflict with the new SDD model.

## Cross-Reference With New Docs

- [016-migration-strategy.md](specs/016-migration-strategy.md)
- [017-bounded-contexts.md](specs/017-bounded-contexts.md)
- [018-event-catalog.md](specs/018-event-catalog.md)
- [019-state-machines.md](specs/019-state-machines.md)
- [020-acceptance-criteria.md](specs/020-acceptance-criteria.md)
- [021-release-plan.md](specs/021-release-plan.md)
- [022-implementation-checklist.md](specs/022-implementation-checklist.md)
- [023-session-recovery.md](specs/023-session-recovery.md)
- [024-network-architecture.md](specs/024-network-architecture.md)
- [025-security-model.md](specs/025-security-model.md)
- [026-printing.md](specs/026-printing.md)
- [027-error-handling.md](specs/027-error-handling.md)
- [028-data-retention.md](specs/028-data-retention.md)
- [029-domain-rules.md](specs/029-domain-rules.md)
- [030-glossary.md](specs/030-glossary.md)
- [ADR/ADR-001-sqlite.md](specs/ADR/ADR-001-sqlite.md)
- [ADR/ADR-002-trpc.md](specs/ADR/ADR-002-trpc.md)
- [ADR/ADR-003-migration-vs-rewrite.md](specs/ADR/ADR-003-migration-vs-rewrite.md)
- [ADR/ADR-004-guest-visit-model.md](specs/ADR/ADR-004-guest-visit-model.md)
