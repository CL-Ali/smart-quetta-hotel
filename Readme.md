# Smart Quetta Hotel 🏨

<p align="center">
  <img src="client/public/logo.png" alt="Smart Quetta Hotel Logo" width="120" style="border-radius:16px;" />
</p>

<p align="center">
  <strong>A smart, multilingual hotel ordering system – PWA installable on any device</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/PWA-ready-blueviolet?style=flat-square&logo=pwa" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite" />
  <img src="https://img.shields.io/badge/TailwindCSS-4-38BDF8?style=flat-square&logo=tailwindcss" />
  <img src="https://img.shields.io/badge/Languages-8%20langs-orange?style=flat-square" />
</p>

---

## 🚀 Features

- **PWA Installable** – Works as a standalone app on Android, iOS, and desktop
- **Multi-language (8 langs)** – English, Urdu, Pashto, Balochi, Brahui, Farsi, Punjabi, Sindhi — with automatic RTL support
- **Real-time Order Flow** – Customer → Kitchen → Waiter pipeline with 3–5 second live polling
- **Admin Dashboard** – View, filter, take payments, and cancel orders; manage inventory & stock
- **Kitchen Display (KDS)** – Staff see pending/preparing orders grouped by customer; mark items ready per-item or all at once
- **Waiter View** – See ready orders, mark individual items or full orders as served, place new orders on the floor
- **Payment Tracking** – Cash + bank split, partial payments, payment history per order, daily revenue report
- **Inventory Management** – Raw-material tracking with low-stock alerts
- **Stock Management** – Finished items (cups, plates, spoons, glasses) with in-use / broken tracking
- **Item-level Kitchen Flow** – Each item goes through `pending → preparing → ready → served` independently

---

## 🖥️ Screenshots

### 🏠 Home – Customer Order Page

| Place Order | Order History |
|---|---|
| <img src="https://github.com/CL-Ali/smart-quetta-hotel/blob/main/client/public/images/home.jpeg?raw=true" width="380"> | <img src="https://github.com/CL-Ali/smart-quetta-hotel/blob/main/client/public/images/home1.jpeg?raw=true" width="380"> |

### 🌐 Language Switcher (8 languages)

| EN / UR / PS / BAL / BRH / FA / PA / SD |
|---|
| <img src="https://github.com/CL-Ali/smart-quetta-hotel/blob/main/client/public/images/home2.jpeg?raw=true" width="380"> |

---

### 🛡️ Admin Dashboard

| Orders & Revenue | Inventory | Stock |
|---|---|---|
| <img src="https://github.com/CL-Ali/smart-quetta-hotel/blob/main/client/public/images/admin.jpeg?raw=true" width="260"> | <img src="https://github.com/CL-Ali/smart-quetta-hotel/blob/main/client/public/images/admin1.jpeg?raw=true" width="260"> | <img src="https://github.com/CL-Ali/smart-quetta-hotel/blob/main/client/public/images/admin2.jpeg?raw=true" width="260"> |

---

### 👨‍🍳 Kitchen Display

| Kitchen Processing |
|---|
| <img src="https://github.com/CL-Ali/smart-quetta-hotel/blob/main/client/public/images/kitchen.jpeg?raw=true" width="380"> |

---

### 🍽️ Waiter / Serving View

| Waiter Serving View |
|---|
| <img src="https://github.com/CL-Ali/smart-quetta-hotel/blob/main/client/public/images/waiter.jpeg?raw=true" width="380"> |

---

## 📱 PWA Install

1. Open the app in Chrome / Edge on any device
2. Click the **Install** button in the address bar (desktop) or **Add to Home Screen** (mobile)
3. The app launches in standalone mode — no browser bar

Supported on: Android, iOS (Safari), Windows, macOS, Linux (Chrome / Edge)

---

## 📂 Routes

| Route | View | Who Uses It |
|---|---|---|
| `/` | Home — browse menu, cart, order history | Customers |
| `/dashboard` | Admin — revenue, orders, inventory, stock | Admin / Owner |
| `/kitchen` | Kitchen Display — cooking queue | Kitchen staff |
| `/waiter` | Waiter — serve ready orders, place orders | Waiter |

> Staff routes (`/dashboard`, `/kitchen`, `/waiter`) show the navigation bar. The customer-facing `/` route shows no nav bar.

---

## ▶️ Quick Start (No Docker needed)

### Windows
1. Install [Node.js LTS](https://nodejs.org) if not already installed
2. Clone the repo or download ZIP
3. Double-click **`start.bat`**
4. Browser opens automatically at `http://localhost:3000` ✅

### Mac / Linux
```bash
chmod +x start.sh
./start.sh
```

> First run takes ~2–3 minutes (downloads dependencies). Subsequent runs start immediately.

---

## 🐳 Docker

```bash
# Clone
git clone https://github.com/CL-Ali/smart-quetta-hotel.git
cd smart-quetta-hotel

# Start (builds image on first run — ~3 min)
docker compose up --build

# Run in background
docker compose up -d --build

# Stop
docker compose down

# Stop + wipe data
docker compose down -v
```

Open [http://localhost:3000](http://localhost:3000) ✅

---

## 🛠️ Manual Setup (Developers)

```bash
# 1. Clone
git clone https://github.com/CL-Ali/smart-quetta-hotel.git
cd smart-quetta-hotel

# 2. Create .env
cp .env.example .env        # Mac/Linux
copy .env.example .env      # Windows CMD

# 3. Install dependencies
npm install

# 4. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Other Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (Vite + tsx watch) |
| `npm run build` | Build for production |
| `npm start` | Run production build |
| `npm run check` | TypeScript type-check |
| `npm run format` | Prettier format |
| `npm test` | Run tests (Vitest) |
| `npm run db:push` | Generate + run Drizzle migrations |

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript |
| Bundler | Vite 7 + `vite-plugin-pwa` |
| Styling | Tailwind CSS 4 + shadcn/ui (Radix UI) |
| Routing | Wouter |
| API | tRPC v11 (end-to-end type-safe) |
| Server | Express 5 + tsx (Node.js) |
| Database | SQLite via Drizzle ORM (`better-sqlite3`) |
| i18n | 8 languages via React context (EN, UR, PS, BAL, BRH, FA, PA, SD) |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| PWA | Workbox via `vite-plugin-pwa` |

---

## 📁 Project Structure

```
smart-quetta-hotel/
├── client/                   # React frontend
│   ├── src/
│   │   ├── pages/            # Home, Dashboard, Kitchen, Waiter, NotFound
│   │   ├── components/       # NavBar, LangSwitcher, NewOrderSheet, ModalSheet, ui/…
│   │   ├── contexts/         # LangContext (i18n), ThemeContext
│   │   ├── hooks/            # useComposition, useMobile
│   │   └── lib/              # trpc.ts, utils.ts
│   └── public/
│       ├── images/           # Screenshot images used in README
│       └── logo*.png         # PWA icons (192, 512)
├── server/
│   ├── _core/                # Express setup, tRPC context, auth stubs, Vite middleware
│   ├── db.ts                 # SQLite init, inline migrations, seed data
│   ├── hotelRouter.ts        # All tRPC procedures (menu, orders, payments, inventory)
│   └── routers.ts            # Root AppRouter
├── drizzle/
│   ├── schema.ts             # Drizzle table definitions + TypeScript types
│   └── *.sql                 # Migration snapshots (auto-generated)
├── shared/
│   ├── const.ts              # Shared constants (COOKIE_NAME, etc.)
│   └── types.ts              # Shared type re-exports
├── drizzle.config.ts
├── vite.config.ts
├── tsconfig.json
├── vitest.config.ts
├── Dockerfile / docker-compose.yml
└── start.bat / start.sh      # One-click launchers
```

---

## 🗄️ Database Schema

The SQLite database is auto-created and seeded on first run — no setup required.

| Table | Purpose |
|---|---|
| `menu_items` | Food items with name, price, category, image, availability |
| `customers` | Customer records (name, phone, email) |
| `orders` | Orders with status (`pending→preparing→ready→served→paid`) and payment status |
| `order_items` | Line items with per-item kitchen status (`pending→preparing→ready→served`) and served quantity |
| `seating_areas` | Table / seating definitions |
| `inventory` | Raw materials with low-stock threshold alerts |
| `stock` | Finished items (cups, plates) with in-use / broken tracking |
| `payments` | Payment records (cash / bank, amount, timestamp) |
| `recipes` | Ingredient requirements per menu item (for future auto-deduction) |

---

## 🌐 Languages

| Code | Language | Script |
|---|---|---|
| `en` | English | LTR |
| `ur` | اردو (Urdu) | RTL |
| `ps` | پښتو (Pashto) | RTL |
| `bal` | بلوچی (Balochi) | RTL |
| `brh` | براہوئی (Brahui) | RTL |
| `fa` | فارسی (Farsi) | RTL |
| `pa` | پنجابی (Punjabi) | RTL |
| `sd` | سنڌي (Sindhi) | RTL |

Language preference is saved in `localStorage`. All RTL languages automatically flip the page layout direction.

---

## 🤝 Contributing

- Follow the existing design system (light theme, orange accent `#ea580c`, Tailwind utility classes)
- Keep components reusable; avoid inline styles where Tailwind classes work
- Mobile-first — use the drawer pattern (`max-h-[90vh] overflow-y-auto`) for sheet overlays
- All client–server communication goes through tRPC procedures — no raw `fetch` calls
- Run `npm run check` and `npm run format` before submitting PRs

---

## 📄 License

MIT © 2024–2026 Smart Quetta Hotel Team
