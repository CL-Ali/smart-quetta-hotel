# 003 Domain Model

## Core Lifecycle

Guest -> Visit -> Browser Session -> Order -> Order Item -> Invoice -> Payment -> Receipt

## Relationships

- Guest has many Visits
- Visit has many Orders
- Order has many Order Items
- Visit has one Invoice
- Invoice has many Payments
- Invoice can generate Receipts
- Menu has many Categories
- Category has many Menu Items

## Main Concepts

- Guest: a person using the restaurant app during a visit
- Visit: one connected dining session for a guest
- Browser Session: the current device/browser state used to resume a visit
- Order: one request sent to the kitchen
- Order Item: a line item inside an order
- Invoice: the billing record for a visit
- Payment: one or more settlement entries against an invoice
- Receipt: proof of payment and closure details
- Menu: the published food catalog
- Category: menu grouping such as breakfast, drinks, or mains
- Staff: users with operational or admin access
