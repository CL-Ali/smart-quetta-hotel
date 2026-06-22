# Smart Quetta Hotel MVP - Project TODO

## Phase 1: Foundation & Setup
- [x] Initialize project with `web-db-user` scaffold
- [x] Define database schema (Orders, MenuItems, Inventory, Tables, Users)
- [x] Set up initial seed data (Menu items like Karak Chai, Paratha, etc.)

## Phase 2: Customer Interface (QR/Captive Portal Flow)
- [x] Create dynamic menu page with visual items
- [x] Implement table/area selection logic (QR scan vs. Manual)
- [x] Add real-time order tracking for customers ("Lala chai bana raha hai")
- [x] Implement "Ghap-Shap Mode" (News/Cricket updates placeholder)

## Phase 3: Cashier/Admin Dashboard
- [x] Build live dashboard for order management
- [x] Implement "Quick Add" button for manual order entry
- [x] Create real-time cash report (Live Galla)
- [x] Add inventory management interface (Stock levels, alerts)

## Phase 4: Kitchen & Waiter System
- [x] Create Kitchen Display System (KDS) for live orders
- [x] Implement "Mark as Ready" functionality
- [x] Add waiter notification system/alert view

## Phase 5: Inventory & Equipment Logic
- [x] Implement auto-deduction logic (Ingredients per item)
- [x] Build equipment tracker (Cups/Spoons lifecycle: In-Use -> Returned)
- [x] Create end-of-day summary report (Sales, Waste, Stock used)

## Phase 6: Polish & Testing
- [x] Responsive design for mobile/tablet use
- [x] Test end-to-end flow (Order -> Kitchen -> Delivery -> Payment)
- [x] Final UI/UX refinements for casual local hotel feel


## Phase 7: UI/UX Refinement (7 Core Principles)
- [x] Apply consistent color palette and typography across all pages
- [x] Simplify navigation with familiar patterns (Tab bar, Floating Action Buttons)
- [x] Add loading states, error handling, and empty state screens
- [x] Improve mobile responsiveness and test on multiple screen sizes
- [x] Optimize performance: reduce bundle size and improve load times
- [x] Add accessibility features: WCAG compliance, high contrast, scalable fonts
- [x] Enhance visual hierarchy and reduce cognitive load
- [x] Add user feedback mechanisms (Toasts, Confirmations, Progress indicators)


## Phase 8: Nothing UI Minimalist Redesign
- [x] Update theme with neutral colors (whites, grays, subtle accents)
- [x] Implement elegant typography system (Poppins/Inter for modern feel)
- [x] Redesign Home with minimal cards and spacious layout
- [x] Rebuild Dashboard with clean KPI cards and subtle interactions
- [x] Redesign Kitchen and Waiter views with minimalist approach
- [x] Remove heavy borders and shadows, use subtle spacing instead
- [x] Test responsive design on mobile and tablet

## Phase 9: Enhanced UX with Real Images, Confirmations & Inventory
- [x] Add real food images to all menu items
- [x] Implement list/grid view toggle on Home page
- [x] Collect customer name before order placement
- [x] Add confirmation dialogs for all critical actions
- [x] Improve button labels to clearly show action intent
- [x] Build inventory management interface with edit/save
- [x] Add visual indicators for low stock items
- [x] Implement order status workflow with confirmations


## Phase 10: Order History, Reordering & Payment System
- [x] Update schema: Add customer identification, order history, stock table, payment tracking
- [x] Implement customer lookup/identification system
- [x] Build reordering logic - add items to existing unpaid orders
- [x] Separate inventory (raw materials) from stock (finished items)
- [x] Implement payment method selection (Cash/Bank)
- [x] Generate itemized bills with payment details
- [x] Track payment status (Pending/Paid/Partial)
- [x] Update all pages with new workflow
