import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Menu Items
 */
export const menuItems = mysqlTable("menu_items", {
  id: int("id").autoincrement().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: varchar("category", { length: 64 }),
  imageUrl: text("imageUrl"),
  isAvailable: boolean("isAvailable").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Seating Areas
 */
export const seatingAreas = mysqlTable("seating_areas", {
  id: int("id").autoincrement().primaryKey(),
  name: text("name").notNull(),
  type: varchar("type", { length: 64 }),
  qrCodeIdentifier: varchar("qrCodeIdentifier", { length: 64 }).unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Customers - Track repeat customers
 */
export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  name: text("name").notNull(),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastOrderAt: timestamp("lastOrderAt").defaultNow().notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

/**
 * Orders
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").references(() => customers.id),
  seatingAreaId: int("seatingAreaId").references(() => seatingAreas.id),
  customerName: text("customerName"),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).default("0.00"),
  status: mysqlEnum("status", ["pending", "preparing", "ready", "served", "paid", "cancelled"]).default("pending").notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["unpaid", "partial", "paid"]).default("unpaid").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["cash", "bank", "pending"]).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Order Items
 */
export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").references(() => orders.id),
  menuItemId: int("menuItemId").references(() => menuItems.id),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
});

/**
 * Inventory - Raw Materials (Milk, Sugar, Tea Leaves, etc.)
 */
export const inventory = mysqlTable("inventory", {
  id: int("id").autoincrement().primaryKey(),
  itemName: text("itemName").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).default("0.00"),
  unit: varchar("unit", { length: 32 }),
  minThreshold: decimal("minThreshold", { precision: 10, scale: 2 }).default("5.00"),
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
});

export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = typeof inventory.$inferInsert;

/**
 * Stock - Finished Items (Cups, Plates, Spoons, Glasses)
 */
export const stock = mysqlTable("stock", {
  id: int("id").autoincrement().primaryKey(),
  name: text("name").notNull(),
  totalQuantity: int("totalQuantity").default(0).notNull(),
  inUse: int("inUse").default(0).notNull(),
  broken: int("broken").default(0).notNull(),
  available: int("available").default(0).notNull(),
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
});

export type Stock = typeof stock.$inferSelect;
export type InsertStock = typeof stock.$inferInsert;

/**
 * Recipes - For auto-deduction of inventory
 */
export const recipes = mysqlTable("recipes", {
  id: int("id").autoincrement().primaryKey(),
  menuItemId: int("menuItemId").references(() => menuItems.id),
  inventoryItemId: int("inventoryItemId").references(() => inventory.id),
  quantityNeeded: decimal("quantityNeeded", { precision: 10, scale: 2 }).notNull(),
});

/**
 * Payments - Track payment details
 */
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").references(() => orders.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  method: mysqlEnum("method", ["cash", "bank"]).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("pending").notNull(),
  transactionId: varchar("transactionId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;
