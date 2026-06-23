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
  <img src="https://img.shields.io/badge/Languages-EN%20%7C%20UR%20%7C%20PS-orange?style=flat-square" />
</p>

---

## 🚀 Features

- **PWA Installable** – Works as a standalone app on Android, iOS, and desktop
- **Multi-language** – English, Urdu, Pashto switcher built into every page
- **Real-time Order Flow** – Customer → Kitchen → Waiter pipeline with live polling
- **Admin Dashboard** – View, filter, accept, pay, and cancel orders; manage inventory & stock
- **Kitchen Display** – Staff see pending/preparing orders and mark them ready with one tap
- **Waiter View** – See ready orders, mark as served, and place new orders on the floor
- **Payment Tracking** – Cash + bank split, partial payments, and daily revenue report
- **Inventory Management** – Raw-material tracking with low-stock alerts
- **Stock Management** – Finished items (cups, plates, spoons, glasses) with in-use / broken tracking
- **Glassmorphism UI** – Light mode with premium micro-animations and orange accent theme

---

## 🖥️ Screenshots

### 🏠 Home – Customer Order Page

| Place Order                                                                                                                            | Order History                                                                                                                           |
|----------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------|
| <img src="https://github.com/CL-Ali/smart-quetta-hotel/blob/main/client/public/images/home.jpeg?raw=true" width="380">                | <img src="https://github.com/CL-Ali/smart-quetta-hotel/blob/main/client/public/images/home1.jpeg?raw=true" width="380">                |

### 🌐 Language Switcher

| Change Language (EN / UR / PS)                                                                                                         |
|----------------------------------------------------------------------------------------------------------------------------------------|
| <img src="https://github.com/CL-Ali/smart-quetta-hotel/blob/main/client/public/images/home2.jpeg?raw=true" width="380">               |

> Customers can switch between **English, Urdu, and Pashto** from any screen using the language switcher in the top bar.

---

### 🛡️ Admin Dashboard

| Orders & Revenue                                                                                                                       | Admin Panel 2                                                                                                                          | Admin Panel 3                                                                                                                          |
|----------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| <img src="https://github.com/CL-Ali/smart-quetta-hotel/blob/main/client/public/images/admin.jpeg?raw=true" width="260">               | <img src="https://github.com/CL-Ali/smart-quetta-hotel/blob/main/client/public/images/admin1.jpeg?raw=true" width="260">              | <img src="https://github.com/CL-Ali/smart-quetta-hotel/blob/main/client/public/images/admin2.jpeg?raw=true" width="260">              |

> The admin dashboard shows today's revenue split (cash / bank), KPI cards for in-kitchen / ready / unpaid order counts, and lets staff filter, search, take payments, or cancel orders. It also includes tabs for **Inventory** (raw materials with low-stock alerts) and **Stock** (utensils tracking).

---

### 👨‍🍳 Kitchen Display

| Kitchen Processing                                                                                                                     |
|----------------------------------------------------------------------------------------------------------------------------------------|
| <img src="https://github.com/CL-Ali/smart-quetta-hotel/blob/main/client/public/images/kitchen.jpeg?raw=true" width="380">             |

> Kitchen staff see all **pending** and **preparing** orders in real time. They tap **Start Cooking** to change an order to `preparing`, then **Ready to Serve** once done — automatically notifying the waiter.

---

### 🍽️ Waiter / Serving View

| Waiter Serving View                                                                                                                    |
|----------------------------------------------------------------------------------------------------------------------------------------|
| <img src="https://github.com/CL-Ali/smart-quetta-hotel/blob/main/client/public/images/waiter.jpeg?raw=true" width="380">              |

> Waiters see all **ready** orders and mark them **served** with one tap. They can also place new orders directly from this screen using the floating **+** button.

---

## 📱 PWA Install

The app can be installed as a **standalone Progressive Web App**:

1. Open the app in Chrome / Edge on any device.
2. Look for the **Install** button in the address bar (desktop) or **Add to Home Screen** (mobile).
3. Click install – the app launches in standalone window mode, without a browser bar.

> Supported on: Android, iOS (Safari), Windows, macOS, Linux (Chrome / Edge).

---

## 📂 Routes

| Route          | Description                                                         |
|----------------|---------------------------------------------------------------------|
| `/`            | **Home** – Browse menu, add to cart, place orders, view history     |
| `/confirmation`| **Confirmation** – Order placed confirmation screen                 |
| `/history`     | **Order History** – Customer's past orders                          |
| `/dashboard`   | **Admin Dashboard** – Revenue, orders, inventory, stock management  |
| `/kitchen`     | **Kitchen** – View pending orders, start cooking, mark ready        |
| `/waiter`      | **Waiter** – Serve ready orders, place new orders on the floor      |

---

## 🛠️ Local Development

```bash
# 1. Clone the repository
git clone https://github.com/CL-Ali/smart-quetta-hotel.git
cd smart-quetta-hotel

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.example .env

# 4. Push the database schema
npm run db:push

# 5. Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🏗️ Tech Stack

| Layer      | Technology                                                  |
|------------|-------------------------------------------------------------|
| Frontend   | React 19 + TypeScript                                       |
| Bundler    | Vite 7 + `vite-plugin-pwa`                                  |
| Styling    | Tailwind CSS 4 + custom light theme / glassmorphism         |
| Routing    | Wouter                                                      |
| API        | tRPC v11 (end-to-end type-safe)                             |
| Server     | Express + tsx (Node.js)                                     |
| Database   | SQLite via Drizzle ORM (`better-sqlite3`)                   |
| Language   | i18n: English, Urdu, Pashto (context-based)                 |
| Forms      | React Hook Form + Zod validation                            |
| UI         | Radix UI primitives + shadcn/ui components                  |
| Charts     | Recharts                                                    |

---

## 📸 Image Reference

| File           | Used For                                      |
|----------------|-----------------------------------------------|
| `home.jpeg`    | Home page — customer placing an order         |
| `home1.jpeg`   | Home page — order history / my orders tab     |
| `home2.jpeg`   | Home page — language switcher (EN/UR/PS)      |
| `admin.jpeg`   | Admin dashboard — orders & revenue view       |
| `admin1.jpeg`  | Admin dashboard — second panel / inventory    |
| `admin2.jpeg`  | Admin dashboard — third panel / stock         |
| `kitchen.jpeg` | Kitchen display — order processing            |
| `waiter.jpeg`  | Waiter view — serving ready orders            |

All images are located in `client/public/images/`.

---

## 🤝 Contributing

- Follow the existing design system (CSS variables, light theme, orange accent, glassmorphism).
- Keep components reusable and avoid inline styles where possible.
- Ensure new pages respect the mobile drawer pattern (`max-h-[90vh] overflow-y-auto`).
- Use tRPC procedures for all client–server communication — no raw fetch calls.
- Run `npm run lint` and `npm run check` before submitting PRs.

---

## 📄 License

MIT © 2024–2026 Smart Quetta Hotel Team
