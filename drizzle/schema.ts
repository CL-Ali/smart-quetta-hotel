import { int, sqliteTable, text, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

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
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
});

/**
 * Seating Areas
 */
export const seatingAreas = sqliteTable("seating_areas", {
  id: int("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type"),
  qrCodeIdentifier: text("qrCodeIdentifier").unique(),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
});

/**
 * Customers - Track repeat customers
 */
export const customers = sqliteTable("customers", {
  id: int("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  lastOrderAt: text("lastOrderAt").default(sql`(datetime('now'))`).notNull(),
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
  totalAmount: real("totalAmount").default(0),
  // pending | preparing | ready | served | paid | cancelled
  status: text("status").default("pending").notNull(),
  // unpaid | partial | paid
  paymentStatus: text("paymentStatus").default("unpaid").notNull(),
  // cash | bank | pending
  paymentMethod: text("paymentMethod").default("pending"),
  paidAmount: real("paidAmount").default(0),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updatedAt").default(sql`(datetime('now'))`).notNull(),
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
  quantity: int("quantity").notNull(),
  unitPrice: real("unitPrice").notNull(),
  // Item-level kitchen lifecycle: pending | preparing | ready | served
  kitchenStatus: text("kitchenStatus").default("pending").notNull(),
  // How many of this item have been served (for partial serving)
  servedQty: int("servedQty").default(0).notNull(),
});

/**
 * Inventory - Raw Materials
 */
export const inventory = sqliteTable("inventory", {
  id: int("id").primaryKey({ autoIncrement: true }),
  itemName: text("itemName").notNull(),
  quantity: real("quantity").default(0),
  unit: text("unit"),
  minThreshold: real("minThreshold").default(5),
  lastUpdated: text("lastUpdated").default(sql`(datetime('now'))`).notNull(),
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
  lastUpdated: text("lastUpdated").default(sql`(datetime('now'))`).notNull(),
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
 * Payments - Track payment details
 */
export const payments = sqliteTable("payments", {
  id: int("id").primaryKey({ autoIncrement: true }),
  orderId: int("orderId").references(() => orders.id),
  amount: real("amount").notNull(),
  // cash | bank
  method: text("method").notNull(),
  // pending | completed | failed
  status: text("status").default("pending").notNull(),
  transactionId: text("transactionId"),
  createdAt: text("createdAt").default(sql`(datetime('now'))`).notNull(),
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
