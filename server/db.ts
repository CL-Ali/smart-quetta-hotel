import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import * as schema from "../drizzle/schema";
import type { InsertUser, User } from "../drizzle/schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Allow overriding via env (used in Docker so the DB lives on a named volume)
// Fallback: project root next to the compiled/source file
const DB_PATH = process.env.DB_PATH ?? path.resolve(__dirname, "..", "hotel.db");

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!_db) {
    const sqlite = new Database(DB_PATH);
    // Enable WAL mode for better concurrent read performance
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
    _db = drizzle(sqlite, { schema });
    initSchema(sqlite);
  }
  return _db;
}

/** Create tables if they don't exist yet — no migration files needed */
function initSchema(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      category TEXT,
      imageUrl TEXT,
      isAvailable INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS seating_areas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT,
      qrCodeIdentifier TEXT UNIQUE,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      lastOrderAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customerId INTEGER REFERENCES customers(id),
      seatingAreaId INTEGER REFERENCES seating_areas(id),
      customerName TEXT,
      totalAmount REAL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      paymentStatus TEXT NOT NULL DEFAULT 'unpaid',
      paymentMethod TEXT DEFAULT 'pending',
      paidAmount REAL DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orderId INTEGER REFERENCES orders(id),
      menuItemId INTEGER REFERENCES menu_items(id),
      quantity INTEGER NOT NULL,
      unitPrice REAL NOT NULL,
      kitchenStatus TEXT NOT NULL DEFAULT 'pending',
      servedQty INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      itemName TEXT NOT NULL,
      quantity REAL DEFAULT 0,
      unit TEXT,
      minThreshold REAL DEFAULT 5,
      lastUpdated TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS stock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      totalQuantity INTEGER NOT NULL DEFAULT 0,
      inUse INTEGER NOT NULL DEFAULT 0,
      broken INTEGER NOT NULL DEFAULT 0,
      available INTEGER NOT NULL DEFAULT 0,
      lastUpdated TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      menuItemId INTEGER REFERENCES menu_items(id),
      inventoryItemId INTEGER REFERENCES inventory(id),
      quantityNeeded REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orderId INTEGER REFERENCES orders(id),
      amount REAL NOT NULL,
      method TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      transactionId TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // ── Migrate existing DBs — add new columns if they don't exist yet ───────────
  const cols = sqlite.prepare("PRAGMA table_info(order_items)").all() as { name: string }[];
  const colNames = cols.map(c => c.name);
  if (!colNames.includes("kitchenStatus")) {
    sqlite.exec(`ALTER TABLE order_items ADD COLUMN kitchenStatus TEXT NOT NULL DEFAULT 'pending'`);
  }
  if (!colNames.includes("servedQty")) {
    sqlite.exec(`ALTER TABLE order_items ADD COLUMN servedQty INTEGER NOT NULL DEFAULT 0`);
  }

  // Seed default menu items if empty
  const count = sqlite.prepare("SELECT COUNT(*) as c FROM menu_items").get() as { c: number };
  if (count.c === 0) {
    sqlite.exec(`
      INSERT INTO menu_items (name, description, price, category, imageUrl, isAvailable) VALUES
        ('Chai',        'Special doodh pati',      30,  'Drinks', '/images/chai.png', 1),
        ('Karwa Chai',  'Bina doodh ki chai',       20,  'Drinks', '/images/chai.png', 1),
        ('Lassi',       'Thandi meethi lassi',      60,  'Drinks', 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&q=80', 1),
        ('Paratha',     'Crispy butter paratha',    40,  'Food',   'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80', 1),
        ('Anda Paratha','Egg stuffed paratha',      60,  'Food',   'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80', 1),
        ('Halwa Puri',  'Weekend special',         100,  'Food',   'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80', 1),
        ('Samosa',      '2 piece crispy samosa',    30,  'Snacks', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80', 1),
        ('Pakora',      'Pyaz aur aloo pakora',     40,  'Snacks', 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400&q=80', 1);

      INSERT INTO seating_areas (name, type) VALUES
        ('Table 1', 'indoor'),
        ('Table 2', 'indoor'),
        ('Table 3', 'outdoor'),
        ('Counter', 'counter');

      INSERT INTO inventory (itemName, quantity, unit, minThreshold) VALUES
        ('Doodh (Milk)',    10, 'Liter',  2),
        ('Cheeni (Sugar)',   5, 'Kg',     1),
        ('Chai Patti',       2, 'Kg',     0.5),
        ('Atta (Flour)',    10, 'Kg',     2),
        ('Desi Ghee',        2, 'Kg',     0.5),
        ('Anda (Eggs)',     30, 'Piece',  6);

      INSERT INTO stock (name, totalQuantity, inUse, broken, available) VALUES
        ('Cups',    50, 10, 2, 38),
        ('Plates',  30,  5, 1, 24),
        ('Glasses', 20,  4, 0, 16),
        ('Spoons',  40,  8, 3, 29);
    `);
  }
}

// ─── Auth stubs (no real users in SQLite mode) ───────────────────────────────

export async function upsertUser(_user: InsertUser): Promise<void> {
  // No-op in local SQLite mode
}

export async function getUserByOpenId(_openId: string): Promise<User | undefined> {
  return undefined;
}
