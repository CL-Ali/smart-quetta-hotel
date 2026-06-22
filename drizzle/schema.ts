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
  category: varchar("category", { length: 64 }), // Chai, Paratha, Snacks, etc.
  imageUrl: text("imageUrl"),
  isAvailable: boolean("isAvailable").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Seating Areas
 */
export const seatingAreas = mysqlTable("seating_areas", {
  id: int("id").autoincrement().primaryKey(),
  name: text("name").notNull(), // Table 1, Bahir wali Chairs, Takht, etc.
  type: varchar("type", { length: 64 }), // Table, Chair, Takht, Bike
  qrCodeIdentifier: varchar("qrCodeIdentifier", { length: 64 }).unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Orders
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  seatingAreaId: int("seatingAreaId").references(() => seatingAreas.id),
  customerName: text("customerName"),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).default("0.00"),
  status: mysqlEnum("status", ["pending", "preparing", "ready", "served", "paid", "cancelled"]).default("pending").notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["unpaid", "paid"]).default("unpaid").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

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
 * Inventory
 */
export const inventory = mysqlTable("inventory", {
  id: int("id").autoincrement().primaryKey(),
  itemName: text("itemName").notNull(), // Milk, Sugar, Tea Leaves, etc.
  quantity: decimal("quantity", { precision: 10, scale: 2 }).default("0.00"),
  unit: varchar("unit", { length: 32 }), // Liters, KG, Grams
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
});

/**
 * Equipment (Cups, Spoons)
 */
export const equipment = mysqlTable("equipment", {
  id: int("id").autoincrement().primaryKey(),
  name: text("name").notNull(), // Cup, Spoon
  totalStock: int("totalStock").default(0).notNull(),
  inUse: int("inUse").default(0).notNull(),
  broken: int("broken").default(0).notNull(),
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
});

/**
 * Recipes (For auto-deduction)
 */
export const recipes = mysqlTable("recipes", {
  id: int("id").autoincrement().primaryKey(),
  menuItemId: int("menuItemId").references(() => menuItems.id),
  inventoryItemId: int("inventoryItemId").references(() => inventory.id),
  quantityNeeded: decimal("quantityNeeded", { precision: 10, scale: 2 }).notNull(),
});
