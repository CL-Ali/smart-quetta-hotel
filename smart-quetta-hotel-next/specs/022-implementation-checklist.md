# 022 Implementation Checklist

## Goal

Migrate the product domain in place.

Keep the working app, reuse the stable pieces, and only change the parts that conflict with the new Guest -> Visit -> Order -> Invoice model.

## Keep As-Is

- Frontend stack: Vite, React, TypeScript, Wouter
- Transport layer: tRPC
- Database: SQLite
- PWA registration and offline shell
- Kitchen queue behavior
- Waiter serving flow
- Inventory and stock views
- Language switching and theme plumbing
- Shared UI primitives under [src/components/ui/](src/components/ui)

## Refactor In Place

- [src/pages/Home.tsx](src/pages/Home.tsx): shift customer identity to guest/visit flow
- [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx): align billing and summaries with invoice-based logic
- [src/pages/Kitchen.tsx](src/pages/Kitchen.tsx): keep behavior, rename labels and events to the new domain
- [src/pages/Waiter.tsx](src/pages/Waiter.tsx): keep serving flow, align status semantics
- [api/db/schema.ts](api/db/schema.ts): add Guest, Visit, and Invoice concepts without deleting Orders
- [api/routers/hotelRouter.ts](api/routers/hotelRouter.ts): split the domain into clearer mutations and queries
- [src/contexts/LangContext.tsx](src/contexts/LangContext.tsx): replace hotel-specific wording with restaurant/guest wording

## Add New Pieces

- Create Guest
- Open Visit
- Resume Visit
- Close Visit
- Invoice generation and closure
- Receipt generation
- Event catalog implementation
- Command catalog implementation
- State machine validation
- Captive portal adapters
- Repository abstraction over SQLite
- Acceptance tests for Guest, Visit, Order, Invoice, Payment, and Recovery flows

## Remove Or Defer

- Framework rewrite
- NestJS migration
- Prisma migration
- PostgreSQL migration
- Hotel-specific UI terms that are no longer needed

## File-by-File Map

### Backend

- [api/index.ts](api/index.ts): keep server entry, later expose new guest/visit routes if needed
- [api/db/index.ts](api/db/index.ts): keep SQLite bootstrapping, extend schema initialization
- [api/db/schema.ts](api/db/schema.ts): primary domain migration surface
- [api/routers/index.ts](api/routers/index.ts): keep router composition, add new modular routers when ready
- [api/routers/hotelRouter.ts](api/routers/hotelRouter.ts): split into smaller domain-focused functions during transition
- [api/routers/guest.router.ts](api/routers/guest.router.ts): create guest commands and queries
- [api/routers/visit.router.ts](api/routers/visit.router.ts): open, resume, and close visits
- [api/routers/order.router.ts](api/routers/order.router.ts): order commands and item lifecycle
- [api/routers/invoice.router.ts](api/routers/invoice.router.ts): invoice generation and closure
- [api/routers/payment.router.ts](api/routers/payment.router.ts): payment recording and receipts
- [api/routers/kitchen.router.ts](api/routers/kitchen.router.ts): kitchen workflow events
- [api/routers/systemRouter.ts](api/routers/systemRouter.ts): keep health and admin utilities

### Frontend

- [src/App.tsx](src/App.tsx): keep route shell
- [src/main.tsx](src/main.tsx): keep app bootstrap and PWA registration
- [src/pages/Home.tsx](src/pages/Home.tsx): migrate guest entry and order flow
- [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx): migrate billing and reporting labels
- [src/pages/Kitchen.tsx](src/pages/Kitchen.tsx): keep operational queue UI
- [src/pages/Waiter.tsx](src/pages/Waiter.tsx): keep serving UI
- [src/components/LangSwitcher.tsx](src/components/LangSwitcher.tsx): reuse unchanged
- [src/components/ModalSheet.tsx](src/components/ModalSheet.tsx): reuse unchanged
- [src/components/NewOrderSheet.tsx](src/components/NewOrderSheet.tsx): reuse as order creation pattern, adapt naming later

## Implementation Rule

Do not add new abstractions until a piece of duplicated behavior appears in at least two places.

If a component or mutation already serves the current UX well, keep it and only rename or isolate the domain boundary.
