import { int, sqliteTable, text, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";



/**
 * Staff
 */
export const staff = sqliteTable("staff", {
  id: int("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  username: text("username"),
  password: text("password"),
  passwordHash: text("passwordHash").notNull(),
  role: text("role").notNull(), // 'admin' | 'cashier' | 'waiter' | 'kitchen'
  stationName: text("stationName"), // e.g. "Counter 1", "Counter 2", "Takeaway Desk", "Floor Section"
  assignedCashierIds: text("assignedCashierIds"), // JSON array string of assigned cashier IDs e.g. "[1, 2]"
  permissions: text("permissions"), // JSON string of granted permission codes
  allowedIp: text("allowedIp"),
  currentIp: text("currentIp"),
  isActive: int("isActive", { mode: "boolean" }).default(true).notNull(),
  lastLoginAt: text("lastLoginAt"),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
});

export type Staff = typeof staff.$inferSelect;
export type InsertStaff = typeof staff.$inferInsert;

/**
 * Guests
 */
export const guests = sqliteTable("guests", {
  id: int("id").primaryKey({ autoIncrement: true }),
  uuid: text("uuid").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  createdAt: text("createdAt")
    .default(sql`(datetime('now'))`)
    .notNull(),
  updatedAt: text("updatedAt")
    .default(sql`(datetime('now'))`)
    .notNull(),
});

export type Guest = typeof guests.$inferSelect;
export type InsertGuest = typeof guests.$inferInsert;

/**
 * Visits
 */
export const visits = sqliteTable("visits", {
  id: int("id").primaryKey({ autoIncrement: true }),
  guestId: int("guestId")
    .references(() => guests.id)
    .notNull(),
  seatingNo: text("seatingNo"),
  peopleCount: int("peopleCount").default(1).notNull(),
  seatingType: text("seatingType").default("seat"),
  status: text("status").default("created").notNull(),
  startedAt: text("startedAt")
    .default(sql`(datetime('now'))`)
    .notNull(),
  closedAt: text("closedAt"),
  createdAt: text("createdAt")
    .default(sql`(datetime('now'))`)
    .notNull(),
});

export type Visit = typeof visits.$inferSelect;
export type InsertVisit = typeof visits.$inferInsert;

/**
 * Tickets (Per-Order Guest Tickets - Multiple per guest)
 */
export const tickets = sqliteTable("tickets", {
  id: int("id").primaryKey({ autoIncrement: true }),
  ticketNo: text("ticketNo").notNull().unique(),
  ticketVersion: int("ticketVersion").default(1).notNull(),
  guestId: int("guestId")
    .references(() => guests.id)
    .notNull(),
  orderId: int("orderId").references(() => orders.id),
  visitId: int("visitId").references(() => visits.id),
  seatingNo: text("seatingNo"),
  seatingType: text("seatingType").default("seat"),
  status: text("status").default("active").notNull(),
  createdAt: text("createdAt")
    .default(sql`(datetime('now'))`)
    .notNull(),
});

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = typeof tickets.$inferInsert;

/**
 * Browser Sessions
 */
export const browserSessions = sqliteTable("browser_sessions", {
  id: int("id").primaryKey({ autoIncrement: true }),
  guestId: int("guestId")
    .references(() => guests.id)
    .notNull(),
  visitId: int("visitId").references(() => visits.id),
  cookieHash: text("cookieHash").notNull().unique(),
  deviceFingerprint: text("deviceFingerprint"),
  lastSeenAt: text("lastSeenAt")
    .default(sql`(datetime('now'))`)
    .notNull(),
  expiredAt: text("expiredAt"),
});

export type BrowserSession = typeof browserSessions.$inferSelect;
export type InsertBrowserSession = typeof browserSessions.$inferInsert;

/**
 * Menu Items
 */
export const menuItems = sqliteTable("menu_items", {
  id: int("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  category: text("category"),
  imageUrl: text("imageUrl"),
  departmentId: int("departmentId").references(() => departments.id),
  options: text("options"),
  isAvailable: int("isAvailable", { mode: "boolean" }).default(true).notNull(),
  createdAt: text("createdAt")
    .default(sql`(datetime('now'))`)
    .notNull(),
});
// Departments table
export const departments = sqliteTable("departments", {
  id: int("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
});

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = typeof departments.$inferInsert;

/**
 * Seating Areas
 */
export const seatingAreas = sqliteTable("seating_areas", {
  id: int("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type"),
  qrCodeIdentifier: text("qrCodeIdentifier").unique(),
  capacity: int("capacity").default(4),
  createdAt: text("createdAt")
    .default(sql`(datetime('now'))`)
    .notNull(),
});

/**
 * Customers
 */
export const customers = sqliteTable("customers", {
  id: int("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  createdAt: text("createdAt")
    .default(sql`(datetime('now'))`)
    .notNull(),
  lastOrderAt: text("lastOrderAt")
    .default(sql`(datetime('now'))`)
    .notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

/**
 * Shopkeepers & Khata Accounts (دکاندار اور کھاتہ دار)
 */
export const shopkeepers = sqliteTable("shopkeepers", {
  id: int("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  shopName: text("shopName").notNull(),
  shopNumber: text("shopNumber"),
  phone: text("phone"),
  balance: real("balance").default(0).notNull(),
  createdAt: text("createdAt")
    .default(sql`(datetime('now'))`)
    .notNull(),
  updatedAt: text("updatedAt")
    .default(sql`(datetime('now'))`)
    .notNull(),
});

export type Shopkeeper = typeof shopkeepers.$inferSelect;
export type InsertShopkeeper = typeof shopkeepers.$inferInsert;

/**
 * Orders
 */
export const orders = sqliteTable("orders", {
  id: int("id").primaryKey({ autoIncrement: true }),
  ticketVersion: int("ticketVersion").default(1).notNull(),
  customerId: int("customerId").references(() => customers.id),
  seatingAreaId: int("seatingAreaId").references(() => seatingAreas.id),
  customerName: text("customerName"),
  seatingNo: text("seatingNo"),
  peopleCount: int("peopleCount").default(1).notNull(),
  seatingType: text("seatingType").default("seat"),
  visitId: int("visitId").references(() => visits.id),
  orderNo: text("orderNo"),
  cashierId: int("cashierId").references(() => staff.id),
  cashierName: text("cashierName"),
  counterName: text("counterName"), // e.g. "Counter 1", "Counter 2", "Takeaway Desk"
  subtotal: real("subtotal").default(0),
  discount: real("discount").default(0),
  total: real("total").default(0),
  totalAmount: real("totalAmount").default(0),
  // pending | preparing | ready | served | paid | cancelled
  status: text("status").default("pending").notNull(),
  // unpaid | partial | paid
  paymentStatus: text("paymentStatus").default("unpaid").notNull(),
  // cash | bank | pending
  paymentMethod: text("paymentMethod").default("pending"),
  paidAmount: real("paidAmount").default(0),
  remarks: text("remarks"),
  createdAt: text("createdAt")
    .default(sql`(datetime('now'))`)
    .notNull(),
  updatedAt: text("updatedAt")
    .default(sql`(datetime('now'))`)
    .notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * System / Hotel Settings
 */
export const systemSettings = sqliteTable("system_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updatedAt")
    .default(sql`(datetime('now'))`)
    .notNull(),
});

export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = typeof systemSettings.$inferInsert;

/**
 * Order Items
 */
export const orderItems = sqliteTable("order_items", {
  id: int("id").primaryKey({ autoIncrement: true }),
  orderId: int("orderId").references(() => orders.id),
  menuItemId: int("menuItemId").references(() => menuItems.id),
  nameSnapshot: text("nameSnapshot"),
  quantity: int("quantity").notNull(),
  unitPrice: real("unitPrice").notNull(),
  status: text("status").default("pending").notNull(),
  // Item-level kitchen lifecycle: pending | preparing | ready | served
  kitchenStatus: text("kitchenStatus").default("pending").notNull(),
  // How many of this item have been served (for partial serving)
  servedQty: int("servedQty").default(0).notNull(),
  remarks: text("remarks"),
});

/**
 * Invoices
 */
export const invoices = sqliteTable("invoices", {
  id: int("id").primaryKey({ autoIncrement: true }),
  ticketVersion: int("ticketVersion").default(1).notNull(),
  visitId: int("visitId")
    .references(() => visits.id)
    .notNull(),
  invoiceNo: text("invoiceNo").notNull().unique(),
  subtotal: real("subtotal").default(0).notNull(),
  tax: real("tax").default(0).notNull(),
  discount: real("discount").default(0).notNull(),
  total: real("total").default(0).notNull(),
  paidAmount: real("paidAmount").default(0).notNull(),
  balance: real("balance").default(0).notNull(),
  status: text("status").default("draft").notNull(),
  generatedAt: text("generatedAt")
    .default(sql`(datetime('now'))`)
    .notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

/**
 * Receipts
 */
export const receipts = sqliteTable("receipts", {
  id: int("id").primaryKey({ autoIncrement: true }),
  ticketVersion: int("ticketVersion").default(1).notNull(),
  invoiceId: int("invoiceId")
    .references(() => invoices.id)
    .notNull(),
  receiptNo: text("receiptNo").notNull().unique(),
  issuedAt: text("issuedAt")
    .default(sql`(datetime('now'))`)
    .notNull(),
  summary: text("summary").notNull(),
  qrCodeData: text("qrCodeData"),
});

export type Receipt = typeof receipts.$inferSelect;
export type InsertReceipt = typeof receipts.$inferInsert;

/**
 * Inventory - Raw Materials
 */
export const inventory = sqliteTable("inventory", {
  id: int("id").primaryKey({ autoIncrement: true }),
  itemName: text("itemName").notNull(),
  quantity: real("quantity").default(0),
  unit: text("unit"),
  minThreshold: real("minThreshold").default(5),
  lastUpdated: text("lastUpdated")
    .default(sql`(datetime('now'))`)
    .notNull(),
});

export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = typeof inventory.$inferInsert;

/**
 * Stock - Finished Items (Cups, Plates, Spoons, Glasses)
 */
export const stock = sqliteTable("stock", {
  id: int("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  totalQuantity: int("totalQuantity").default(0).notNull(),
  inUse: int("inUse").default(0).notNull(),
  broken: int("broken").default(0).notNull(),
  available: int("available").default(0).notNull(),
  lastUpdated: text("lastUpdated")
    .default(sql`(datetime('now'))`)
    .notNull(),
});

export type Stock = typeof stock.$inferSelect;
export type InsertStock = typeof stock.$inferInsert;



/**
 * Payments
 */
export const payments = sqliteTable("payments", {
  id: int("id").primaryKey({ autoIncrement: true }),
  ticketVersion: int("ticketVersion").default(1).notNull(),
  orderId: int("orderId").references(() => orders.id),
  invoiceId: int("invoiceId").references(() => invoices.id),
  amount: real("amount").notNull(),
  // cash | bank
  method: text("method").notNull(),
  // pending | completed | failed
  status: text("status").default("pending").notNull(),
  transactionId: text("transactionId"),
  reference: text("reference"),
  receivedAt: text("receivedAt")
    .default(sql`(datetime('now'))`)
    .notNull(),
  createdAt: text("createdAt")
    .default(sql`(datetime('now'))`)
    .notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * Ticket Session & Day Close Logs (Audit Archive)
 */
export const ticketSessionLogs = sqliteTable("ticket_session_logs", {
  id: int("id").primaryKey({ autoIncrement: true }),
  ticketVersion: int("ticketVersion").notNull().unique(),
  shiftStatus: text("shiftStatus").default("closed").notNull(),
  startDate: text("startDate").notNull(),
  closedDate: text("closedDate").notNull(),
  closedBy: text("closedBy").notNull(),
  totalTickets: int("totalTickets").default(0).notNull(),
  totalOrders: int("totalOrders").default(0).notNull(),
  totalRevenue: real("totalRevenue").default(0).notNull(),
  totalCash: real("totalCash").default(0).notNull(),
  totalBank: real("totalBank").default(0).notNull(),
  totalKhata: real("totalKhata").default(0).notNull(),
  totalDiscount: real("totalDiscount").default(0).notNull(),
  itemsSnapshot: text("itemsSnapshot").notNull(), // JSON string
  ordersSnapshot: text("ordersSnapshot").notNull(), // JSON string
  createdAt: text("createdAt")
    .default(sql`(datetime('now'))`)
    .notNull(),
});

export type TicketSessionLog = typeof ticketSessionLogs.$inferSelect;
export type InsertTicketSessionLog = typeof ticketSessionLogs.$inferInsert;


