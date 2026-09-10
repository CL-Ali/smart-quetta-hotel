# 029 Domain Rules

## Guest And Visit

- One Guest can have many Visits.
- A Guest identity may exist without an active Visit.
- A Visit belongs to exactly one Guest.
- Only an OPEN Visit can accept new Orders.

## Order

- One Visit can have many Orders.
- One Order can have many Order Items.
- Orders must reference a valid Visit.
- Closed Visits cannot accept new Orders.

## Invoice

- One Visit can produce one active Invoice at a time.
- A Paid Invoice cannot be modified.
- A Cancelled Invoice cannot receive new payments.
- An Invoice must include only billable order lines.

## Payment

- One Invoice can have many Payments.
- Payment states are Pending, Paid, Refunded, and Cancelled.
- A Receipt can be issued only after Payment is recorded.
- Partial payment is allowed until the invoice balance reaches zero.

## Receipt

- One Invoice can produce one or more Receipts.
- A Receipt is proof of settlement, not a replacement for the Invoice.
- Receipt issuance must be immutable once created.

## Session

- Browser Session is separate from Guest identity.
- A lost browser session must not erase the Guest or Visit.
- Session recovery must resolve to an existing Guest or Visit.
