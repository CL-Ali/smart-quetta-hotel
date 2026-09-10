# 005 API Contract

## API Style

- Keep tRPC for the MVP app surface.
- Add REST-style boundary routes only where captive portal or network integration needs them.
- Keep mutation names aligned with commands.

## Guest and Menu

### GET /menu

Returns the active menu with categories and items.

Response

- menu metadata
- categories
- items

Errors

- 404 if no active menu exists

### POST /guest

Creates or updates a guest identity.

Request

- name
- phone optional
- tableNo optional

Response

- guest record
- guest token or cookie instructions

Errors

- 400 for invalid payload

### POST /visit

Creates a new visit for the current guest.

Request

- guestId
- tableNo optional

Response

- visit record

Errors

- 409 if an active visit already exists and policy disallows duplicates

### PATCH /visit/close

Closes an open visit.

Request

- visitId

Response

- closed visit

Errors

- 404 if visit does not exist

### POST /visit/resume

Resumes a visit using ticket, QR, cookie, phone, or staff lookup.

Request

- resumeToken optional
- ticketNo optional
- phone optional
- guestId optional

Response

- visit record
- guest record
- browser session details

Errors

- 404 if no visit can be matched

## Ordering

### POST /orders

Creates a new order inside an active visit.

Request

- visitId
- items
- notes optional

Response

- order record
- line items

Errors

- 400 for invalid items
- 404 if visit does not exist

### PATCH /orders/:id

Updates status or content of an order.

Request

- status optional
- notes optional
- item updates optional

Response

- updated order

Errors

- 404 if order does not exist

## Billing

### GET /invoice/:id

Returns invoice details for a visit.

Response

- invoice
- payments
- receipts
- balance

Errors

- 404 if invoice does not exist

### POST /payment

Records a payment against an invoice.

Request

- invoiceId
- amount
- method
- reference optional

Response

- payment record
- updated invoice summary

Errors

- 400 for invalid amount
- 404 if invoice does not exist

### POST /payment

Records a payment against an invoice.

Request

- invoiceId
- amount
- method
- reference optional

Response

- payment record
- updated invoice summary

Errors

- 400 for invalid amount
- 404 if invoice does not exist
