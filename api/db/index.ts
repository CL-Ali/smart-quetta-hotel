import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import * as schema from "./schema";
import type { InsertUser, User } from "./schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Allow overriding via env (used in Docker so the DB lives on a named volume)
// Fallback: project root
const DB_PATH =
  process.env.DB_PATH ?? path.resolve(__dirname, "../..", "hotel.db");

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
    CREATE TABLE IF NOT EXISTS menus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      isActive INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      menuId INTEGER NOT NULL REFERENCES menus(id),
      name TEXT NOT NULL,
      sortOrder INTEGER NOT NULL DEFAULT 0,
      isActive INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL,
      isActive INTEGER NOT NULL DEFAULT 1,
      lastLoginAt TEXT
    );

    CREATE TABLE IF NOT EXISTS guests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      phone TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guestId INTEGER NOT NULL REFERENCES guests(id),
      tableNo TEXT,
      status TEXT NOT NULL DEFAULT 'created',
      startedAt TEXT NOT NULL DEFAULT (datetime('now')),
      closedAt TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS browser_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guestId INTEGER NOT NULL REFERENCES guests(id),
      visitId INTEGER REFERENCES visits(id),
      cookieHash TEXT NOT NULL UNIQUE,
      deviceFingerprint TEXT,
      lastSeenAt TEXT NOT NULL DEFAULT (datetime('now')),
      expiredAt TEXT
    );

    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      category TEXT,
      imageUrl TEXT,
      departmentId INTEGER REFERENCES departments(id),
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
      visitId INTEGER REFERENCES visits(id),
      orderNo TEXT,
      subtotal REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      total REAL DEFAULT 0,
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
      nameSnapshot TEXT,
      quantity INTEGER NOT NULL,
      unitPrice REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      kitchenStatus TEXT NOT NULL DEFAULT 'pending',
      servedQty INTEGER NOT NULL DEFAULT 0,
      remarks TEXT
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      visitId INTEGER NOT NULL REFERENCES visits(id),
      invoiceNo TEXT NOT NULL UNIQUE,
      subtotal REAL NOT NULL DEFAULT 0,
      tax REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      paidAmount REAL NOT NULL DEFAULT 0,
      balance REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft',
      generatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoiceId INTEGER NOT NULL REFERENCES invoices(id),
      receiptNo TEXT NOT NULL UNIQUE,
      issuedAt TEXT NOT NULL DEFAULT (datetime('now')),
      summary TEXT NOT NULL,
      qrCodeData TEXT
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
      invoiceId INTEGER REFERENCES invoices(id),
      amount REAL NOT NULL,
      method TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      transactionId TEXT,
      reference TEXT,
      receivedAt TEXT NOT NULL DEFAULT (datetime('now')),
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Migrate existing DBs — add new columns if they don't exist yet
  const tableColumns = (tableName: string) => {
    const cols = sqlite.prepare(`PRAGMA table_info(${tableName})`).all() as {
      name: string;
    }[];
    return new Set(cols.map(col => col.name));
  };

  const addColumnIfMissing = (
    tableName: string,
    columnName: string,
    ddl: string
  ) => {
    const columns = tableColumns(tableName);
    if (!columns.has(columnName)) {
      sqlite.exec(`ALTER TABLE ${tableName} ADD COLUMN ${ddl}`);
    }
  };

  addColumnIfMissing(
    "orders",
    "visitId",
    "visitId INTEGER REFERENCES visits(id)"
  );
  addColumnIfMissing("orders", "orderNo", "orderNo TEXT");
  addColumnIfMissing("orders", "subtotal", "subtotal REAL DEFAULT 0");
  addColumnIfMissing("orders", "discount", "discount REAL DEFAULT 0");
  addColumnIfMissing("orders", "total", "total REAL DEFAULT 0");

  // Phase 5: visit recovery ticket — additive, nullable, safe on existing DBs
  addColumnIfMissing("visits", "ticketNo", "ticketNo TEXT");

  addColumnIfMissing("order_items", "nameSnapshot", "nameSnapshot TEXT");
  addColumnIfMissing(
    "order_items",
    "status",
    "status TEXT NOT NULL DEFAULT 'pending'"
  );
  addColumnIfMissing("order_items", "remarks", "remarks TEXT");
  addColumnIfMissing(
    "order_items",
    "kitchenStatus",
    "kitchenStatus TEXT NOT NULL DEFAULT 'pending'"
  );
  addColumnIfMissing(
    "order_items",
    "servedQty",
    "servedQty INTEGER NOT NULL DEFAULT 0"
  );

  addColumnIfMissing(
    "payments",
    "invoiceId",
    "invoiceId INTEGER REFERENCES invoices(id)"
  );
  addColumnIfMissing(
    "menu_items",
    "departmentId",
    "departmentId INTEGER REFERENCES departments(id)"
  );
  addColumnIfMissing("payments", "reference", "reference TEXT");
  addColumnIfMissing(
    "payments",
    "receivedAt",
    // SQLite ALTER TABLE does not support datetime() as a column default.
    // Nullable is safe — new rows set this explicitly in code.
    "receivedAt TEXT"
  );

  // Seed default departments if none exist
  const deptCount = sqlite
    .prepare("SELECT COUNT(*) as c FROM departments")
    .get() as { c: number };
  if (deptCount.c === 0) {
    sqlite.exec(
      `INSERT INTO departments (id, name) VALUES (1, 'Tea'), (2, 'Drinks'), (3, 'Parathas'), (4, 'Appetizer');`
    );
  }

  // Backfill any menu items with NULL departmentId to default department (1: Tea or by category)
  try {
    sqlite.exec(`
      UPDATE menu_items SET departmentId = 1 WHERE departmentId IS NULL AND (category = 'Drinks' OR name LIKE '%Chai%');
      UPDATE menu_items SET departmentId = 2 WHERE departmentId IS NULL AND (category = 'Drinks');
      UPDATE menu_items SET departmentId = 3 WHERE departmentId IS NULL AND (category = 'Food');
      UPDATE menu_items SET departmentId = 4 WHERE departmentId IS NULL AND (category = 'Snacks');
      UPDATE menu_items SET departmentId = 1 WHERE departmentId IS NULL;
    `);
  } catch (_) {}

  // Seed default menu items if empty
  const count = sqlite
    .prepare("SELECT COUNT(*) as c FROM menu_items")
    .get() as { c: number };
  if (count.c === 0) {
    sqlite.exec(`
      INSERT INTO menu_items (name, description, price, category, imageUrl, departmentId, isAvailable) VALUES
        ('Chai',        'Special doodh pati',      30,  'Drinks', '/images/chai.png', 1, 1),
        ('Karwa Chai',  'Bina doodh ki chai',       20,  'Drinks', '/images/chai.png', 1, 1),
        ('Lassi',       'Thandi meethi lassi',      60,  'Drinks', 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&q=80', 2, 1),
        ('Paratha',     'Crispy butter paratha',    40,  'Food',   'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80', 3, 1),
        ('Anda Paratha','Egg stuffed paratha',      60,  'Food',   'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80', 3, 1),
        ('Halwa Puri',  'Weekend special',         100,  'Food',   'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80', 3, 1),
        ('Samosa',      '2 piece crispy samosa',    30,  'Snacks', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80', 4, 1),
        ('Pakora',      'Pyaz aur aloo pakora',     40,  'Snacks', 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400&q=80', 4, 1);
    `);
  }

  // Existing seating areas insertion
  const seatingCount = sqlite
    .prepare("SELECT COUNT(*) as c FROM seating_areas")
    .get() as { c: number };
  if (seatingCount.c === 0) {
    sqlite.exec(`INSERT INTO seating_areas (name, type) VALUES
      ('Table 1', 'indoor'),
      ('Table 2', 'indoor'),
      ('Table 3', 'outdoor'),
      ('Counter', 'counter');`);
  }

    const inventoryCount = sqlite
      .prepare("SELECT COUNT(*) as c FROM inventory")
      .get() as { c: number };
    if (inventoryCount.c === 0) {
      sqlite.exec(`
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

// Auth stubs (no real users in SQLite mode)
export async function upsertUser(_user: InsertUser): Promise<void> {
  // No-op in local SQLite mode
}

export async function getUserByOpenId(
  _openId: string
): Promise<User | undefined> {
  return undefined;
}
