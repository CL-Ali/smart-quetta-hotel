Ran command: `git status`
Viewed walkthrough.md:1-60

Yeh raha mukammal **Step-by-Step Walkthrough** jo humne shuru se lekar ab tak kiya hai, `git status` ke mutabiq har file aur har error ka solution:

---

## 1. Shuruat Kahan Se Hui? (Initial State)
* Project pehle **React 19 + Vite 6 + Wouter Router** par chal raha tha.
* Backend **Express 5 + Socket.io + SQLite (`better-sqlite3`) + tRPC** par mushtamil tha.
* Aapne pucha ke isay Next.js par kaise bina kisi failure ke migrate kiya jaye.

---

## 2. `git status` Ke Mutabiq Har File Ka Walkthrough

```text
Changes not staged for commit:
	modified:   package.json / package-lock.json
	modified:   tsconfig.json
	modified:   src/App.tsx
	modified:   src/components/Logo.tsx
	modified:   src/components/NavBar.tsx
	modified:   src/const.ts
	modified:   src/contexts/LangContext.tsx
	modified:   src/contexts/ThemeContext.tsx
	modified:   src/hooks/useSocket.ts
	modified:   src/lib/dashboardAuth.ts
	modified:   src/main.tsx
	deleted:    src/pages/* (moved to src/views/*)

Untracked files:
	next.config.ts
	next-env.d.ts
	postcss.config.mjs
	server.ts
	src/app/
	src/types/
	src/views/
```

### A. Core Architecture & Server
1. **[server.ts](file:///d:/Github/smart-quetta-hotel/server.ts) (New Custom Server):**
   - **Kyun banaya?** Next.js ke regular serverless route handlers persistent **WebSockets (Socket.io)** aur native SQLite ko support nahi karte.
   - **Kiya kya?** Node ke HTTP server par Next.js (`nextApp.getRequestHandler()`) aur Express 5 ko ek sath bridge kiya. Socket.io `/ws/` par chalta raha aur tRPC `/api/trpc` par.
2. **[next.config.ts](file:///d:/Github/smart-quetta-hotel/next.config.ts) (New Config):**
   - `serverExternalPackages: ["better-sqlite3"]` add kiya taake Next.js SQLite ko compile karke crash na kare.
   - `allowedDevOrigins` dynamically scan karta hai tamam LAN/WiFi IPs ko taake kisi bhi laptop par zero-config chalay.
3. **[postcss.config.mjs](file:///d:/Github/smart-quetta-hotel/postcss.config.mjs) (New):**
   - Next.js mein **Tailwind CSS v4** ko support karne ke liye `@tailwindcss/postcss` plugin attach kiya.

---

### B. Routing & UI Migration (Wouter ➔ Next.js App Router)
1. **`src/pages` ➔ [src/views](file:///d:/Github/smart-quetta-hotel/src/views/):**
   - Pehle saray views `src/pages` mein thay. Next.js ne samjha ke yeh legacy Pages Router hai aur `DepartmentsTab.tsx` ko ek route samajh kar build crash kar raha tha.
   - Humne `src/pages` ko `src/views` mein shift kiya aur clean Next.js App Router directory banayi:
2. **[src/app/](file:///d:/Github/smart-quetta-hotel/src/app/):**
   - [layout.tsx](file:///d:/Github/smart-quetta-hotel/src/app/layout.tsx): HTML shell, responsive viewport, aur PWA metadata set kiye.
   - [providers.tsx](file:///d:/Github/smart-quetta-hotel/src/app/providers.tsx): tRPC, React Query, Theme, Language, aur Socket singleton ko client-side wrap kiya.
   - [StaffNavBar.tsx](file:///d:/Github/smart-quetta-hotel/src/app/StaffNavBar.tsx): Sirf staff routes (`/dashboard`, `/kitchen`, `/waiter`) par navigation bar render karta hai.
   - [page.tsx](file:///d:/Github/smart-quetta-hotel/src/app/page.tsx), [dashboard/page.tsx](file:///d:/Github/smart-quetta-hotel/src/app/dashboard/page.tsx), [kitchen/page.tsx](file:///d:/Github/smart-quetta-hotel/src/app/kitchen/page.tsx), [waiter/page.tsx](file:///d:/Github/smart-quetta-hotel/src/app/waiter/page.tsx), [portal/page.tsx](file:///d:/Github/smart-quetta-hotel/src/app/portal/page.tsx), [not-found.tsx](file:///d:/Github/smart-quetta-hotel/src/app/not-found.tsx).
3. **[src/components/NavBar.tsx](file:///d:/Github/smart-quetta-hotel/src/components/NavBar.tsx) & [Logo.tsx](file:///d:/Github/smart-quetta-hotel/src/components/Logo.tsx):**
   - `wouter` ke `Link` aur `useLocation` ko Next.js ke `next/link` aur `usePathname` se replace kiya.

---

### C. SSR & Hydration Guards (Storage Safety)
Server Side Rendering ke waqt `window` aur `localStorage` exist nahi karte. Humne in tamam files ko SSR-safe banaya:
- [ThemeContext.tsx](file:///d:/Github/smart-quetta-hotel/src/contexts/ThemeContext.tsx) aur [LangContext.tsx](file:///d:/Github/smart-quetta-hotel/src/contexts/LangContext.tsx): `typeof window !== "undefined"` guards lagaye.
- [useSocket.ts](file:///d:/Github/smart-quetta-hotel/src/hooks/useSocket.ts): Server par WebSocket connection initiate hone se roka.
- [dashboardAuth.ts](file:///d:/Github/smart-quetta-hotel/src/lib/dashboardAuth.ts): PIN checking ko SSR-safe kiya.
- [src/views/Home.tsx](file:///d:/Github/smart-quetta-hotel/src/views/Home.tsx): `readStoredSession` aur `useState` initializers ko guard kiya.
- [src/const.ts](file:///d:/Github/smart-quetta-hotel/src/const.ts): Vite ke `import.meta.env` aur Next.js ke `process.env` dono ko compatible banaya.

---

## 3. Safar Ke Dauran Kaunse Errors Aaye Aur Kaise Solve Hue?

### Masla 1: Next.js Prerender Crash on `DepartmentsTab.tsx`
* **Error:** Next.js ne `src/pages/Dashboard/DepartmentsTab.tsx` ko ek alag page samajh kar prerender karne ki koshish ki aur tRPC context na milne par build fail hui.
* **Solution:** `src/pages` ko rename karke `src/views` kiya aur standard Next.js App Router (`src/app/**/page.tsx`) banaya.

### Masla 2: Express 5 Path Wildcard Crash
* **Error:** `TypeError: Missing parameter name at index 1: *` at `server.ts:68`.
* **Solution:** Express 5 mein `app.all("*")` deprecated hai. Humne use standard Express 5 catch-all `app.use((req, res) => handle(req, res))` mein convert kiya.

### Masla 3: Browser Hydration Mismatch
* **Error:** Server ne default English (`Quetta Hotel`) bheja jabke client ke `localStorage` mein pehle se Urdu (`کوئٹہ ہوٹل`) tha. React ne mismatch report kiya.
* **Solution:** Tamam interactive operational pages (`Home`, `Dashboard`, `Kitchen`, `Waiter`) ko `next/dynamic` with `{ ssr: false }` wrap kiya, taake server aur client DOM 100% identical rahein aur `localStorage` bina warning ke load ho.

### Masla 4: LAN / Mobile Cross-Origin HMR Block (`10.255.255.224`)
* **Error:** Next.js ne dev server par external LAN IP se live reload block kiya.
* **Solution:** `next.config.ts` mein `allowedDevOrigins` dynamically network interfaces aur private subnets (`192.168.*`, `10.*`, `172.*`) ko automatically allow karne ke liye configure kar diya.

---

## 4. Current Status
* **TypeScript Typecheck (`npm run check`):** ✅ 0 Errors
* **Unit Tests (`npm test`):** ✅ 5/5 Passed
* **Next.js Production Build (`npm run build`):** ✅ Passed, All 7 routes bundled
* **Dev Server (`npm run dev`):** ✅ Running smoothly on `localhost:3000` and `http://10.255.255.224:3000/`

Aapka project ab 100% Next.js par fully functional aur stable hai!