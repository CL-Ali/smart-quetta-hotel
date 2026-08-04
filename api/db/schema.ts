import { int, sqliteTable, text, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Menus
 */
export const menus = sqliteTable("menus", {
  id: int("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  isActive: int("isActive", { mode: "boolean" }).default(true).notNull(),
  createdAt: text("createdAt")
    .default(sql`(datetime('now'))`)
    .notNull(),
  updatedAt: text("updatedAt")
    .default(sql`(datetime('now'))`)
    .notNull(),
});

export type Menu = typeof menus.$inferSelect;
export type InsertMenu = typeof menus.$inferInsert;

/**
 * Categories
 */
export const categories = sqliteTable("categories", {
  id: int("id").primaryKey({ autoIncrement: true }),
  menuId: int("menuId")
    .references(() => menus.id)
    .notNull(),
  name: text("name").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: int("isActive", { mode: "boolean" }).default(true).notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Staff
 */
export const staff = sqliteTable("staff", {
  id: int("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  passwordHash: text("passwordHash").notNull(),
  role: text("role").notNull(),
  isActive: int("isActive", { mode: "boolean" }).default(true).notNull(),
  lastLoginAt: text("lastLoginAt"),
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
  tableNo: text("tableNo"),
  // Server-issued recovery ticket — VIS-{id}-{48-bit hex}. Shown to guest at
  // visit open; also encoded in QR code. High-entropy opaque token.
  ticketNo: text("ticketNo"),
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
  isAvailable: int("isAvailable", { mode: "boolean" }).default(true).notNull(),
  createdAt: text("createdAt")
    .default(sql`(datetime('now'))`)
    .notNull(),
});

/**
 * Seating Areas
 */
export const seatingAreas = sqliteTable("seating_areas", {
  id: int("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type"),
  qrCodeIdentifier: text("qrCodeIdentifier").unique(),
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
 * Orders
 */
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
  // pending | preparing | ready | served | paid | cancelled
  status: text("status").default("pending").notNull(),
  // unpaid | partial | paid
  paymentStatus: text("paymentStatus").default("unpaid").notNull(),
  // cash | bank | pending
  paymentMethod: text("paymentMethod").default("pending"),
  paidAmount: real("paidAmount").default(0),
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
 * Recipes - For auto-deduction of inventory
 */
export const recipes = sqliteTable("recipes", {
  id: int("id").primaryKey({ autoIncrement: true }),
  menuItemId: int("menuItemId").references(() => menuItems.id),
  inventoryItemId: int("inventoryItemId").references(() => inventory.id),
  quantityNeeded: real("quantityNeeded").notNull(),
});

/**
 * Payments
 */
export const payments = sqliteTable("payments", {
  id: int("id").primaryKey({ autoIncrement: true }),
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

// Stub User type for auth compatibility (not stored in SQLite)
export type User = {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
};
export type InsertUser = Partial<User> & { openId: string };
