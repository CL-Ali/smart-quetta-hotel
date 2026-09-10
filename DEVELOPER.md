# Smart Quetta Hotel — Developer Guide & Architecture

Welcome to the **Smart Quetta Hotel** codebase! This document provides a quick, clear architectural overview and cheat-sheet designed so intermediate developers can understand, navigate, and contribute with confidence.

---

## 🏗️ 1. Architecture Overview

Smart Quetta Hotel is a real-time Restaurant POS & Guest Portal application built with:
* **Frontend:** Next.js 16 (App Router) + React 19 + Tailwind CSS v4 + Radix UI
* **Backend:** Express 5 + tRPC v11 + Socket.io 4.8
* **Database:** SQLite (`better-sqlite3`) + Drizzle ORM
* **Realtime:** Persistent WebSockets (`/ws/`) for instant order sync across devices

```
┌─────────────────────────────────────────────────────────────┐
│                 Node.js Server (server.ts)                  │
├───────────────────┬───────────────────┬─────────────────────┤
│   Next.js 16 UI   │     tRPC APIs     │  Socket.io Realtime │
│   (App Router)    │   (/api/trpc/*)   │      (/ws/*)        │
└─────────┬─────────┴─────────┬─────────┴──────────┬──────────┘
          │                   │                    │
          ▼                   ▼                    ▼
   Customer / Staff      Drizzle ORM         Live Events:
   Mobile & Desktop       (hotel.db)       Order/Kitchen/Galla
```

---

## 📂 2. Directory Cheat Sheet

| Directory | What's Inside? | Key Files |
| :--- | :--- | :--- |
| **`server.ts`** | Master server entrypoint | Initializes Express, Next.js handler, Socket.io, Multer |
| **`src/app/`** | Next.js App Router pages | `page.tsx`, `dashboard/`, `kitchen/`, `waiter/`, `portal/` |
| **`src/views/`** | Core UI Views & Features | `Home.tsx`, `Dashboard.tsx`, `Kitchen.tsx`, `Waiter.tsx` |
| **`src/views/Home/`** | Customer Portal sub-modules | `MenuSection.tsx`, `CartBottomBar.tsx`, `NameEntryStep.tsx` |
| **`src/views/Dashboard/`** | Admin Dashboard sub-modules | `DashboardKpis.tsx`, `OrdersTab.tsx`, `PaymentSheet.tsx` |
| **`src/types/`** | Domain TypeScript types | `hotel.ts` (Order, CartItem, MenuItem, Payment, Stock) |
| **`src/contexts/`** | React contexts | `LangContext.tsx` (Urdu / English), `ThemeContext.tsx` |
| **`api/db/`** | SQLite Schema & Seeds | `schema.ts` (Drizzle tables), `index.ts` (DB connection) |
| **`api/routers/`** | tRPC API routers | `hotelRouter.ts`, `guest.router.ts`, `order.router.ts`, etc. |
| **`api/lib/`** | Core backend libraries | `socket.ts` (Real-time emitter), `trpc.ts`, `cookies.ts` |
| **`api/middleware/`** | Network & Uploads | `portal/` (MikroTik/OpenWrt WiFi), `upload.ts` (Multer) |

---

## 🔄 3. Core Business Workflows

### A. Customer Order Lifecycle
```text
1. Customer scans QR / connects to WiFi
   └─► Home.tsx (NameEntryStep) ─► trpc.guest.createGuest + trpc.visit.openVisit
2. Customer browses Menu & adds to Cart
   └─► MenuSection.tsx + CartBottomBar.tsx
3. Customer places Order
   └─► trpc.hotel.placeOrder
   └─► Database: orders & order_items created
   └─► Auto-deduction: inventory recipes deducted
   └─► Socket broadcast: "order.created"
4. Kitchen receives live ticket
   └─► Kitchen.tsx ─► Mark Cooking ("preparing") ─► Mark Ready ("ready")
   └─► Socket broadcast: "kitchen.ready"
5. Waiter receives notification
   └─► Waiter.tsx ─► Waiter delivers to table ─► Mark Served ("served")
6. Cashier settles payment
   └─► Dashboard.tsx (PaymentSheet) ─► Cash or Bank ─► Order marked "paid"
   └─► Live Galla updated instantly!
```

---

## 🛠️ 4. Useful Developer Commands

```bash
# 1. Start Development Server (Runs on localhost:3000 & LAN IP)
npm run dev

# 2. Run TypeScript Typecheck
npm run check

# 3. Run Unit Tests (Vitest)
npm test

# 4. Push Database Schema Changes (Drizzle)
npm run db:push

# 5. Build for Production
npm run build
```

---

## 💡 5. Best Practices & Conventions

1. **Keep Views Modular**: Do not put 500+ lines in one file. Extract subcomponents into feature folders (e.g. `src/views/Home/SubComponent.tsx`).
2. **Use Strong Typing**: Import domain types from `@/types/hotel`. Avoid using `any` where domain interfaces exist.
3. **Real-time Synchronization**: When updating orders or payments in backend routers, always trigger the appropriate socket event using `getIo().emit(SOCKET_EVENT...)`.
4. **Bilingual Support**: All user-facing text strings are available in `useLang().t` for seamless English, Urdu, and Roman Urdu rendering.
