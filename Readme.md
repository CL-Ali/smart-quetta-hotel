# Smart Quetta Hotel 🏨

<p align="center">
  <img src="public/logo.png" alt="Smart Quetta Hotel Logo" width="120" style="border-radius:16px;" />
</p>

<p align="center">
  <strong>A smart, multilingual hotel ordering &amp; management system — installable as a PWA on any device</strong>
</p>

> SDD migration target: Smart Restaurant LAN Ordering System. The product spec set now lives in [specs/](specs/).

<p align="center">
  <img src="https://img.shields.io/badge/PWA-ready-blueviolet?style=flat-square&logo=pwa" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite" />
  <img src="https://img.shields.io/badge/TailwindCSS-4-38BDF8?style=flat-square&logo=tailwindcss" />
  <img src="https://img.shields.io/badge/SQLite-Drizzle-003B57?style=flat-square&logo=sqlite" />
  <img src="https://img.shields.io/badge/Languages-8%20langs-orange?style=flat-square" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" />
</p>

---

## What Is This?

**Smart Quetta Hotel** is a full-stack, self-hosted ordering and operations system built for Pakistani dhabas, restaurants, and small hotels. It replaces pen-and-paper order tracking with a clean digital workflow that runs on any device — phone, tablet, or desktop — with no internet connection required after setup.

The system covers the complete lifecycle of every order:

```
Customer places order  →  Kitchen cooks  →  Waiter serves  →  Admin takes payment
```

Every step is a live view. The kitchen sees what needs to be cooked. The waiter sees what is ready to serve. The admin sees everything — revenue, unpaid bills, inventory, and utensil stock.

---

## Features

**For Customers**
- Browse a categorised menu with images and prices
- Add items to cart and place an order in seconds
- Enter a name or table number — no account or login required
- View personal order history and live status updates
- Installable as a PWA — works like a native app

**For Kitchen Staff**
- Dedicated Kitchen Display System (KDS) — only shows orders that need cooking
- See each order grouped by customer with all requested items
- Mark individual items as Cooking then Ready independently
- Orders automatically progress when all items are done

**For Waiters**
- See only orders that are ready to be served
- Mark individual items or entire orders as served
- Place new orders from the floor without going to the counter

**For Admins / Owners**
- Full order list with search, status filter, and payment filter
- Revenue cards: today's total, in-kitchen count, ready count, unpaid count
- Record payments — cash or bank transfer (JazzCash, EasyPaisa, HBL, etc.)
- Partial payment support with full payment history per order
- End-of-day cash and bank split report
- Inventory management — raw materials with low-stock alerts
- Stock management — utensils with in-use and broken counts
- Cancel orders with confirmation

**System**
- 8 languages: English, Urdu, Pashto, Balochi, Brahui, Farsi, Punjabi, Sindhi
- Automatic RTL layout switching for all regional languages
- Language preference saved per device in `localStorage`
- PWA — installable, works offline, no browser bar
- SQLite database — zero config, auto-created and seeded on first run
- Optional OAuth login for role-based admin access
- Docker support — single command to run in production

---

## Screenshots

### Customer — Menu & Order

| Browse Menu | Order History |
|---|---|
| <img src="https://github.com/CL-Ali/smart-quetta-hotel/blob/main/public/images/home.jpeg?raw=true" width="380"> | <img src="https://github.com/CL-Ali/smart-quetta-hotel/blob/main/public/images/home1.jpeg?raw=true" width="380"> |

### Language Switcher (8 Languages)

| English / Urdu / Pashto / Balochi / Brahui / Farsi / Punjabi / Sindhi |
|---|
| <img src="https://github.com/CL-Ali/smart-quetta-hotel/blob/main/public/images/home2.jpeg?raw=true" width="380"> |

### Admin Dashboard

| Orders & Revenue | Inventory | Stock |
|---|---|---|
| <img src="https://github.com/CL-Ali/smart-quetta-hotel/blob/main/public/images/admin.jpeg?raw=true" width="260"> | <img src="https://github.com/CL-Ali/smart-quetta-hotel/blob/main/public/images/admin1.jpeg?raw=true" width="260"> | <img src="https://github.com/CL-Ali/smart-quetta-hotel/blob/main/public/images/admin2.jpeg?raw=true" width="260"> |

### Kitchen Display

| Cooking Queue |
|---|
| <img src="https://github.com/CL-Ali/smart-quetta-hotel/blob/main/public/images/kitchen.jpeg?raw=true" width="380"> |

### Waiter View

| Ready to Serve |
|---|
| <img src="https://github.com/CL-Ali/smart-quetta-hotel/blob/main/public/images/waiter.jpeg?raw=true" width="380"> |

---

## Order Lifecycle

Each order item tracks its own status independently. The order-level status is derived automatically.

```
Item:   pending → preparing → ready → served
         ↑            ↑          ↑        ↑
       Kitchen      Kitchen    Waiter   Waiter

Order:  pending → preparing → ready → served → paid | cancelled
                                                ↑
                                           Admin records
                                           cash or bank

Payment: unpaid → partial → paid
```

Partial serving is supported — the waiter can serve 2 of 3 cups and the item stays "ready" until all are delivered.

---

## Routes

| URL | View | Who Uses It |
|---|---|---|
| `/` | **Home** — Menu, cart, place order, order history | Customers |
| `/dashboard` | **Dashboard** — Revenue, orders, payments, inventory, stock | Admin / Owner |
| `/kitchen` | **Kitchen** — Cooking queue, mark items ready | Kitchen staff |
| `/waiter` | **Waiter** — Ready orders, mark served, new order | Waiter |

The navigation bar is shown only on staff routes (`/dashboard`, `/kitchen`, `/waiter`). The customer-facing home has no nav.

---

## PWA Install

**Android / Desktop (Chrome or Edge)**
1. Open the app in the browser
2. Click the **Install** icon in the address bar
3. The app opens in standalone mode

**iOS (Safari)**
1. Open in Safari → tap **Share** → **Add to Home Screen**

---

## Quick Start

### Windows
1. Install [Node.js LTS](https://nodejs.org)
2. Clone the repo or download ZIP
3. Double-click **`start.bat`**
4. Browser opens at `http://localhost:3000` ✅

### Mac / Linux
```bash
chmod +x start.sh && ./start.sh
```

---

## Docker

```bash
git clone https://github.com/CL-Ali/smart-quetta-hotel.git
cd smart-quetta-hotel

# Copy env and set JWT_SECRET
cp .env.example .env

# Build and start (first run ~3 min)
docker compose up --build

# Background
docker compose up -d --build

# Stop
docker compose down

# Stop + wipe data
docker compose down -v
```

Open [http://localhost:3000](http://localhost:3000) ✅

The SQLite database is stored on a named Docker volume (`hotel_db`) and persists across restarts and rebuilds.

---

## Manual Setup (Developers)

```bash
git clone https://github.com/CL-Ali/smart-quetta-hotel.git
cd smart-quetta-hotel

# Mac/Linux
cp .env.example .env
# Windows CMD
copy .env.example .env

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

The dev server starts both Vite (frontend HMR) and the Express backend together via `tsx watch`.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | **Yes** | Long random string to sign session JWTs. Change before going live. |
| `PORT` | No | Server port. Default: `3000` |
| `DB_PATH` | No | Path to SQLite file. Default: `hotel.db` in project root. Docker sets it to `/app/data/hotel.db`. |
| `OAUTH_SERVER_URL` | No | OAuth server base URL. Leave blank to disable OAuth. |
| `VITE_APP_ID` | No | OAuth app ID. Required only if `OAUTH_SERVER_URL` is set. |
| `OWNER_OPEN_ID` | No | Owner's OAuth open ID. Required only if using admin-gated features. |

---

## NPM Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server — Vite frontend + Express backend with hot reload |
| `npm run build` | Production build — Vite → `dist/public`, esbuild → `dist/index.js` |
| `npm start` | Run the production build |
| `npm run check` | TypeScript type-check (no emit) |
| `npm run format` | Prettier format entire project |
| `npm test` | Run tests with Vitest (single run) |
| `npm run db:push` | Generate Drizzle migration files and apply to DB |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript |
| Bundler | Vite 6 + `vite-plugin-pwa` |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix UI) |
| Routing | Wouter |
| API | tRPC v11 — end-to-end type-safe, no REST boilerplate |
| Data fetching | TanStack Query v5 — auto-refetch polling (3–5s) |
| Server | Express 5 + tsx (Node.js ≥ 18) |
| Database | SQLite via Drizzle ORM (`better-sqlite3`) |
| Auth | `jose` (JWT HS256) — session cookie, optional OAuth |
| i18n | React context — 8 languages, RTL auto-switch |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Animations | Framer Motion |
| PWA | Workbox via `vite-plugin-pwa` (autoUpdate) |
| Testing | Vitest |

---

## Project Structure

```
smart-quetta-hotel/
│
├── src/                          # React frontend
│   ├── pages/
│   │   ├── Home.tsx              # Customer: menu, cart, order history
│   │   ├── Dashboard.tsx         # Admin: revenue, orders, payments
│   │   ├── Kitchen.tsx           # Kitchen: cooking queue
│   │   ├── Waiter.tsx            # Waiter: serve ready orders
│   │   └── NotFound.tsx
│   ├── components/
│   │   ├── NavBar.tsx
│   │   ├── LangSwitcher.tsx
│   │   ├── NewOrderSheet.tsx
│   │   ├── ModalSheet.tsx
│   │   └── ui/                   # shadcn/ui component library
│   ├── contexts/
│   │   ├── LangContext.tsx       # i18n: 8 languages, RTL, localStorage
│   │   └── ThemeContext.tsx      # Light/dark theme
│   ├── hooks/
│   │   ├── useComposition.ts     # IME handler for RTL inputs
│   │   └── useMobile.tsx         # 768px responsive breakpoint
│   ├── lib/
│   │   ├── trpc.ts               # Typed tRPC React client
│   │   └── utils.ts              # Tailwind cn() helper
│   ├── App.tsx                   # Root component + router
│   ├── main.tsx                  # Entry point, QueryClient, tRPC provider
│   ├── index.css                 # Tailwind base + CSS variables
│   └── const.ts                  # Client constants, OAuth URL builder
│
├── api/                          # Express backend
│   ├── routers/
│   │   ├── hotelRouter.ts        # All hotel procedures (menu, orders, payments…)
│   │   ├── systemRouter.ts       # system.health + system.notifyOwner
│   │   ├── index.ts              # Root AppRouter — composes all routers
│   │   └── auth.logout.test.ts   # Logout procedure unit test
│   ├── db/
│   │   ├── index.ts              # SQLite init, schema creation, seed data, auth stubs
│   │   └── schema.ts             # Drizzle table definitions + TypeScript types
│   ├── lib/
│   │   ├── env.ts                # Typed ENV from process.env
│   │   ├── cookies.ts            # Session cookie options
│   │   ├── context.ts            # tRPC request context (auth)
│   │   ├── trpc.ts               # tRPC init, procedure types
│   │   └── sdk.ts                # JWT sign/verify, OAuth exchange, user sync
│   ├── middleware/
│   │   ├── oauth.ts              # GET /api/oauth/callback
│   │   ├── vite.ts               # Dev: Vite middleware. Prod: express.static
│   │   ├── notification.ts       # notifyOwner() stub
│   │   └── storageProxy.ts       # /storage/* stub
│   └── index.ts                  # Server entry point — Express bootstrap
│
├── shared/                       # Shared between frontend and backend
│   ├── const.ts                  # COOKIE_NAME, error messages, timeouts
│   └── _core/errors.ts           # HttpError base class + constructors
│
├── public/                       # Static assets (served as-is)
│   ├── images/                   # Food photos, screenshots
│   ├── fonts/inter/              # Self-hosted Inter font
│   └── logo*.png                 # PWA icons (192×192, 512×512)
│
├── index.html                    # Root HTML (Vite entry)
├── vite.config.ts                # Vite: PWA manifest, aliases, build output
├── tsconfig.json                 # TypeScript: strict, bundler resolution
├── drizzle.config.ts             # Drizzle Kit: schema path, migrations output
├── vitest.config.ts              # Test runner config
├── Dockerfile                    # Multi-stage build (node:20-alpine)
├── docker-compose.yml            # Single service + named SQLite volume
├── .env.example                  # Environment variable template
├── start.bat                     # Windows one-click launcher
└── start.sh                      # Mac/Linux one-click launcher
```

---

## Database Schema

Auto-created and seeded on first run — no setup needed.

| Table | Purpose | Status Values |
|---|---|---|
| `menu_items` | Food/drink items: name, price, category, image, availability | — |
| `seating_areas` | Tables and seating zones with optional QR identifier | — |
| `customers` | Repeat customer records (name, phone, email) | — |
| `orders` | One active order per customer session | `pending` `preparing` `ready` `served` `paid` `cancelled` |
| `order_items` | Line items with per-item kitchen tracking and served quantity | `pending` `preparing` `ready` `served` |
| `inventory` | Raw materials (milk, flour, eggs) with low-stock threshold | — |
| `stock` | Utensils (cups, plates) — total, in-use, broken, available | — |
| `payments` | Payment transactions per order (cash or bank) | `pending` `completed` `failed` |
| `recipes` | Ingredient quantities per menu item (ready for auto-deduction) | — |

**Smart order logic:** New items from the same customer are appended to their existing open order rather than creating a duplicate. A new order is only created once the previous one is fully paid or cancelled.

---

## Authentication

Authentication is **optional**. All hotel operations work without any login configured.

**Without OAuth (default):** All routes are open. No login screen.

**With OAuth:** Set `OAUTH_SERVER_URL`, `VITE_APP_ID`, `OWNER_OPEN_ID` in `.env`. Staff complete OAuth and get a session cookie signed with `JWT_SECRET` (HS256 via `jose`).

Three procedure tiers in `api/lib/trpc.ts`:
- `publicProcedure` — no auth required (all hotel ops use this)
- `protectedProcedure` — requires any logged-in user
- `adminProcedure` — requires `user.role === "admin"`

---

## Languages

| Code | Language | Direction |
|---|---|---|
| `en` | English | LTR |
| `ur` | اردو — Urdu | RTL |
| `ps` | پښتو — Pashto | RTL |
| `bal` | بلوچی — Balochi | RTL |
| `brh` | براہوئی — Brahui | RTL |
| `fa` | فارسی — Farsi | RTL |
| `pa` | پنجابی — Punjabi | RTL |
| `sd` | سنڌي — Sindhi | RTL |

All translations live in `src/contexts/LangContext.tsx` in the `T` object. Saved to `localStorage` under key `qh_lang`. RTL layout applied automatically via `document.documentElement.dir`.

---

## Developer Guide

### Adding a tRPC Endpoint

1. Open `api/routers/hotelRouter.ts`
2. Add a procedure using `publicProcedure`, `protectedProcedure`, or `adminProcedure`
3. Types flow automatically to the client — no manual type imports needed

```ts
// api/routers/hotelRouter.ts
getMenuItem: publicProcedure
  .input(z.object({ id: z.number() }))
  .query(async ({ input }) => {
    return getDb().select().from(menuItems).where(eq(menuItems.id, input.id)).get();
  }),
```

```ts
// src/pages/SomePage.tsx — auto-typed
const { data } = trpc.hotel.getMenuItem.useQuery({ id: 1 });
```

### Adding a Page

1. Create `src/pages/MyPage.tsx`
2. Add `<Route path="/my-page" component={MyPage} />` in `src/App.tsx`
3. If it should show the NavBar, add the path to `STAFF_ROUTES` in `src/App.tsx`

### Adding a Language

1. Open `src/contexts/LangContext.tsx`
2. Add the new code to `type Lang`
3. Add a translation object to `T` matching the shape of `T.en`
4. Add it to `LANG_OPTIONS` at the bottom

### Design Conventions

- Orange accent: `#ea580c` (Tailwind `orange-600`)
- Light theme only (`switchable=false` in `App.tsx`)
- Components from `src/components/ui/` (shadcn/ui)
- Mobile-first — use drawer/sheet for overlays
- All API calls go through tRPC — no raw `fetch` to `/api`
- Live data uses TanStack Query `refetchInterval` (3–5s), not WebSockets

### Database Changes

Schema defined in `api/db/schema.ts`, tables created inline in `api/db/index.ts`. For production migrations:

```bash
npm run db:push
```

### Tests

```bash
npm test
```

Test files live in `api/`. Current coverage:
- `api/routers/auth.logout.test.ts` — logout clears cookie correctly

---

## Contributing

1. Fork and create a feature branch
2. Run `npm run check` (TypeScript) and `npm run format` (Prettier) before committing
3. Keep components mobile-first and reusable
4. All client–server communication through tRPC only

---

## License

MIT © 2024–2026 Smart Quetta Hotel Team
