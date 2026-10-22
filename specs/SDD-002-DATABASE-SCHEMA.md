# 🗄️ SDD-002: Complete Database Schema & Entity-Relationship Model

- **Document ID**: `SDD-002`
- **Feature Area**: Database Schema, Drizzle ORM Models, Foreign Keys & Indices
- **Status**: `APPROVED / ACTIVE`
- **Revision**: `2.0.0`

---

## 1. Full Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    MENUS ||--o{ CATEGORIES : "contains"
    DEPARTMENTS ||--o{ MENU_ITEMS : "prepares"
    CATEGORIES ||--o{ MENU_ITEMS : "classifies"
    MENU_ITEMS ||--o{ RECIPES : "uses"
    INVENTORY ||--o{ RECIPES : "supplies"
    
    GUESTS ||--o{ VISITS : "starts"
    GUESTS ||--o{ TICKETS : "owns"
    GUESTS ||--o{ BROWSER_SESSIONS : "authenticates"
    VISITS ||--o{ BROWSER_SESSIONS : "tracks"
    VISITS ||--o{ ORDERS : "places"
    VISITS ||--o{ TICKETS : "contains"
    VISITS ||--o{ INVOICES : "settles"
    
    CUSTOMERS ||--o{ ORDERS : "orders"
    SEATING_AREAS ||--o{ ORDERS : "seated_at"
    ORDERS ||--o{ ORDER_ITEMS : "contains"
    ORDERS ||--o{ TICKETS : "generates"
    MENU_ITEMS ||--o{ ORDER_ITEMS : "ordered_as"
    
    ORDERS ||--o{ PAYMENTS : "paid_by"
    INVOICES ||--o{ PAYMENTS : "settles"
    INVOICES ||--o{ RECEIPTS : "issues"

    SHOPKEEPERS {
        int id PK
        string name "Owner / Contact Name"
        string shopName "Market Shop Name"
        string shopNumber "Shop # / Location"
        string phone "Phone (WhatsApp / Tab)"
        real balance "Running Khata Balance"
        string createdAt
        string updatedAt
    }

    CUSTOMERS {
        int id PK
        string name "Customer Name / Table"
        string phone "Phone (Loyalty / Receipt)"
        string email
        string createdAt
        string lastOrderAt
    }

    ORDERS {
        int id PK
        int customerId FK
        int seatingAreaId FK
        string customerName
        int visitId FK
        string orderNo
        real subtotal
        real discount
        real total
        real totalAmount
        string status "pending | preparing | ready | served | paid | cancelled"
        string paymentStatus "unpaid | partial | paid"
        string paymentMethod "cash | bank | pending"
        real paidAmount
        string createdAt
        string updatedAt
    }

    ORDER_ITEMS {
        int id PK
        int orderId FK
        int menuItemId FK
        string nameSnapshot
        int quantity
        real unitPrice
        string status "pending | preparing | ready | served"
        string kitchenStatus "pending | preparing | ready | served"
        int servedQty "Quantity served"
        string remarks "Item specific notes"
    }

    MENU_ITEMS {
        int id PK
        string name
        string description
        real price
        string category
        string imageUrl
        int departmentId FK
        boolean isAvailable
        string createdAt
    }

    CATEGORIES {
        int id PK
        int menuId FK
        string name
        int sortOrder
        boolean isActive
    }

    MENUS {
        int id PK
        string title
        boolean isActive
        string createdAt
        string updatedAt
    }

    DEPARTMENTS {
        int id PK
        string name
        string createdAt
        string updatedAt
    }

    GUESTS {
        int id PK
        string uuid
        string name
        string phone
        string createdAt
        string updatedAt
    }

    VISITS {
        int id PK
        int guestId FK
        string seatingNo
        int peopleCount "Party Size (1 to 6+)"
        string seatingType "seat | table"
        string status "created | open | closed"
        string startedAt
        string closedAt
        string createdAt
    }

    TICKETS {
        int id PK
        string ticketNo UK "TKT-001, TKT-002"
        int guestId FK
        int orderId FK
        int visitId FK
        string seatingNo
        string seatingType "seat | table"
        string status "active | served | completed"
        string createdAt
    }

    BROWSER_SESSIONS {
        int id PK
        int guestId FK
        int visitId FK
        string cookieHash
        string deviceFingerprint
        string lastSeenAt
        string expiredAt
    }

    INVOICES {
        int id PK
        int visitId FK
        string invoiceNo
        real subtotal
        real tax
        real discount
        real total
        real paidAmount
        real balance
        string status "draft | unpaid | paid"
        string generatedAt
    }

    RECEIPTS {
        int id PK
        int invoiceId FK
        string receiptNo
        string issuedAt
        string summary
        string qrCodeData
    }

    PAYMENTS {
        int id PK
        int orderId FK
        int invoiceId FK
        real amount
        string method "cash | bank"
        string status "pending | completed | failed"
        string transactionId
        string reference
        string receivedAt
        string createdAt
    }

    INVENTORY {
        int id PK
        string itemName
        real quantity
        string unit
        real minThreshold
        string lastUpdated
    }

    STOCK {
        int id PK
        string name
        int totalQuantity
        int inUse
        int broken
        int available
        string lastUpdated
    }

    RECIPES {
        int id PK
        int menuItemId FK
        int inventoryItemId FK
        real quantityNeeded
    }

    SEATING_AREAS {
        int id PK
        string name
        string type
        string qrCodeIdentifier
        string createdAt
    }

    STAFF {
        int id PK
        string name
        string email
        string passwordHash
        string role "admin | cashier | kitchen | waiter"
        boolean isActive
        string lastLoginAt
    }
```

---

## 2. Table Specifications & Constraints

### 1. `shopkeepers` (Market Shopkeepers & Khata Accounts)
```typescript
export const shopkeepers = sqliteTable("shopkeepers", {
  id: int("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  shopName: text("shopName").notNull(),
  shopNumber: text("shopNumber"),
  phone: text("phone"),
  balance: real("balance").default(0).notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
});
```

### 2. `customers` (Dine-in / Walk-in / Loyalty Guests)
```typescript
export const customers = sqliteTable("customers", {
  id: int("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  lastOrderAt: text("lastOrderAt").default(sql`(datetime('now'))`).notNull(),
});
```

### 3. `orders` & `order_items`
```typescript
export const orders = sqliteTable("orders", {
  id: int("id").primaryKey({ autoIncrement: true }),
  customerId: int("customerId").references(() => customers.id),
  seatingAreaId: int("seatingAreaId").references(() => seatingAreas.id),
  customerName: text("customerName"),
  visitId: int("visitId").references(() => visits.id),
  orderNo: text("orderNo"),
  subtotal: real("subtotal").default(0),
  discount: real("discount").default(0),
  total: real("total").default(0),
  totalAmount: real("totalAmount").default(0),
  status: text("status").default("pending").notNull(),
  paymentStatus: text("paymentStatus").default("unpaid").notNull(),
  paymentMethod: text("paymentMethod").default("pending"),
  paidAmount: real("paidAmount").default(0),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
});
```
