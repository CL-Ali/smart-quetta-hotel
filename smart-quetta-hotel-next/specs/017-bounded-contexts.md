# 017 Bounded Contexts

## Modules

- Portal
- Customer
- Ordering
- Kitchen
- Billing
- Payments
- Inventory
- Admin
- Reporting

## Context Responsibilities

### Portal

Handles WiFi entry, captive portal redirect, and guest landing behavior.

### Customer

Owns guest identity, browser session recovery, and visit initiation.

### Ordering

Owns cart, order creation, order updates, and item lifecycle.

### Kitchen

Owns cooking queue, preparation states, and readiness events.

### Billing

Owns invoice generation, receipt issuance, totals, closure, and settlement readiness.

### Payments

Owns payment collection, partial payments, and payment history.

### Sessions

Owns browser session persistence, visit resume rules, and recovery paths.

### Inventory

Owns raw materials, stock, and replenishment related operations.

### Admin

Owns configuration, staff management, and operational controls.

### Reporting

Owns summaries, cash reports, and end-of-day views.

## Context Rules

- Portal must not contain business logic.
- Kitchen must not own billing logic.
- Billing must not own captive portal behavior.
- Sessions must not own order logic.
- Reporting must read from domain facts, not invent new state.
