# 004 Database

## Storage Direction

- Keep SQLite for MVP.
- Add repository abstractions so storage can evolve later without changing domain APIs.

## Tables

- Guest
- Visit
- Order
- OrderItem
- Invoice
- Payment
- Receipt
- BrowserSession
- Menu
- Category
- Staff

## Suggested Fields

### Guest

- id
- uuid
- name
- phone
- createdAt
- updatedAt

### Visit

- id
- guestId
- tableNo
- status
- startedAt
- closedAt
- createdAt

### Order

- id
- visitId
- orderNo
- status
- notes
- subtotal
- discount
- total
- createdAt
- updatedAt

### OrderItem

- id
- orderId
- menuItemId
- nameSnapshot
- unitPrice
- quantity
- status
- remarks

### Invoice

- id
- visitId
- invoiceNo
- subtotal
- tax
- discount
- total
- paidAmount
- balance
- status
- generatedAt

### Payment

- id
- invoiceId
- method
- amount
- reference
- receivedAt

### Receipt

- id
- invoiceId
- receiptNo
- issuedAt
- summary
- qrCodeData optional

### BrowserSession

- id
- guestId
- visitId optional
- cookieHash
- deviceFingerprint optional
- lastSeenAt
- expiredAt optional

### Menu

- id
- title
- isActive
- createdAt
- updatedAt

### Category

- id
- menuId
- name
- sortOrder
- isActive

### Staff

- id
- name
- email
- passwordHash
- role
- isActive
- lastLoginAt
