import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import * as schema from "./schema";
import { hashPassword } from "../lib/auth";

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
  try {
    sqlite.exec(`


    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL,
      allowedIp TEXT,
      currentIp TEXT,
      isActive INTEGER NOT NULL DEFAULT 1,
      lastLoginAt TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
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
      seatingNo TEXT,
      peopleCount INTEGER NOT NULL DEFAULT 1,
      seatingType TEXT DEFAULT 'seat',
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
      imageUrl TEXT,
      departmentId INTEGER REFERENCES departments(id),
      options TEXT,
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
      remarks TEXT,
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



    CREATE TABLE IF NOT EXISTS shopkeepers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      shopName TEXT NOT NULL,
      shopNumber TEXT,
      phone TEXT,
      balance REAL NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
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
      receivedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticketNo TEXT NOT NULL UNIQUE,
      ticketVersion INTEGER NOT NULL DEFAULT 1,
      guestId INTEGER NOT NULL REFERENCES guests(id),
      orderId INTEGER REFERENCES orders(id),
      visitId INTEGER REFERENCES visits(id),
      seatingNo TEXT,
      seatingType TEXT DEFAULT 'seat',
      status TEXT NOT NULL DEFAULT 'active',
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ticket_session_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticketVersion INTEGER NOT NULL UNIQUE,
      shiftStatus TEXT NOT NULL DEFAULT 'closed',
      startDate TEXT NOT NULL,
      closedDate TEXT NOT NULL,
      closedBy TEXT NOT NULL,
      totalTickets INTEGER NOT NULL DEFAULT 0,
      totalOrders INTEGER NOT NULL DEFAULT 0,
      totalRevenue REAL NOT NULL DEFAULT 0,
      totalCash REAL NOT NULL DEFAULT 0,
      totalBank REAL NOT NULL DEFAULT 0,
      totalKhata REAL NOT NULL DEFAULT 0,
      totalDiscount REAL NOT NULL DEFAULT 0,
      itemsSnapshot TEXT NOT NULL,
      ordersSnapshot TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

    // Seed default system shift settings if missing
    sqlite.exec(`
      INSERT OR IGNORE INTO system_settings (key, value) VALUES ('currentTicketVersion', '1');
      INSERT OR IGNORE INTO system_settings (key, value) VALUES ('shiftStatus', 'active');
    `);

    // Seed exactly 2 default shopkeepers (parties) if empty
    const shopCount = sqlite
      .prepare("SELECT COUNT(*) as c FROM shopkeepers")
      .get() as { c: number };
    if (shopCount.c === 0) {
      sqlite.exec(`
        INSERT INTO shopkeepers (name, shopName, shopNumber, phone, balance) VALUES
          ('حاجی بشیر صاحب', 'خان کلاتھ ہاؤس', 'Shop #12', '0300-1234567', 0),
          ('ڈاکٹر عرفان', 'مدینہ میڈیکل اسٹور', 'Shop #4', '0312-9876543', 0);
      `);
    }
  } catch (_) {}

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
    "ticketVersion",
    "ticketVersion INTEGER NOT NULL DEFAULT 1"
  );
  addColumnIfMissing(
    "tickets",
    "ticketVersion",
    "ticketVersion INTEGER NOT NULL DEFAULT 1"
  );
  addColumnIfMissing(
    "payments",
    "ticketVersion",
    "ticketVersion INTEGER NOT NULL DEFAULT 1"
  );
  addColumnIfMissing(
    "invoices",
    "ticketVersion",
    "ticketVersion INTEGER NOT NULL DEFAULT 1"
  );
  addColumnIfMissing(
    "receipts",
    "ticketVersion",
    "ticketVersion INTEGER NOT NULL DEFAULT 1"
  );

  addColumnIfMissing(
    "orders",
    "visitId",
    "visitId INTEGER REFERENCES visits(id)"
  );
  addColumnIfMissing("orders", "orderNo", "orderNo TEXT");
  addColumnIfMissing("orders", "cashierId", "cashierId INTEGER REFERENCES staff(id)");
  addColumnIfMissing("orders", "cashierName", "cashierName TEXT");
  addColumnIfMissing("orders", "counterName", "counterName TEXT");
  addColumnIfMissing("orders", "subtotal", "subtotal REAL DEFAULT 0");
  addColumnIfMissing("orders", "discount", "discount REAL DEFAULT 0");
  addColumnIfMissing("orders", "total", "total REAL DEFAULT 0");
  addColumnIfMissing("orders", "seatingNo", "seatingNo TEXT");
  addColumnIfMissing("orders", "tableNo", "tableNo TEXT");
  addColumnIfMissing("orders", "peopleCount", "peopleCount INTEGER NOT NULL DEFAULT 1");
  addColumnIfMissing("orders", "seatingType", "seatingType TEXT DEFAULT 'seat'");

  // Phase 5: visit recovery ticket — additive, nullable, safe on existing DBs
  addColumnIfMissing("visits", "seatingNo", "seatingNo TEXT");
  addColumnIfMissing("visits", "ticketNo", "ticketNo TEXT");
  addColumnIfMissing("visits", "peopleCount", "peopleCount INTEGER NOT NULL DEFAULT 1");
  addColumnIfMissing("visits", "seatingType", "seatingType TEXT DEFAULT 'seat'");

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
  addColumnIfMissing(
    "menu_items",
    "options",
    "options TEXT"
  );
  addColumnIfMissing("orders", "remarks", "remarks TEXT");
  addColumnIfMissing("payments", "reference", "reference TEXT");
  addColumnIfMissing(
    "payments",
    "receivedAt",
    "receivedAt TEXT"
  );

  addColumnIfMissing(
    "seating_areas",
    "capacity",
    "capacity INTEGER DEFAULT 4"
  );

  // Seed default departments if none exist
  const deptCount = sqlite
    .prepare("SELECT COUNT(*) as c FROM departments")
    .get() as { c: number };
  if (deptCount.c === 0) {
    sqlite.exec(
      `INSERT INTO departments (id, name) VALUES (1, 'Tea'), (2, 'Paratha'), (3, 'Kitchen'), (4, 'Drinks');`
    );
  }

  // Backfill any menu items with NULL departmentId to dynamic department
  try {
    sqlite.exec(`
      UPDATE menu_items SET departmentId = 1 WHERE departmentId IS NULL AND (name LIKE '%Chai%' OR name LIKE '%Tea%');
      UPDATE menu_items SET departmentId = 2 WHERE departmentId IS NULL AND (name LIKE '%Paratha%' OR name LIKE '%Puri%');
      UPDATE menu_items SET departmentId = 3 WHERE departmentId IS NULL AND (name LIKE '%Karahi%' OR name LIKE '%Chicken%');
      UPDATE menu_items SET departmentId = 4 WHERE departmentId IS NULL AND (name LIKE '%Lassi%' OR name LIKE '%Water%');
      UPDATE menu_items SET departmentId = 1 WHERE departmentId IS NULL;
    `);
  } catch (_) {}

  // Seed default menu items with explicit department IDs if empty
  const count = sqlite
    .prepare("SELECT COUNT(*) as c FROM menu_items")
    .get() as { c: number };
  if (count.c === 0) {
    sqlite.exec(`
      INSERT INTO menu_items (name, description, price, imageUrl, departmentId, options, isAvailable) VALUES
        ('Chai',           'Special doodh patti',        30,  '/images/chai.png', 1, 'Less Sugar, Extra Karak, Sugar Free, Extra Hot', 1),
        ('Karwa Chai',     'Traditional green tea qehwa', 20,  'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&q=80', 1, 'With Lemon, Extra Sweet, No Sugar', 1),
        ('Paratha',        'Crispy butter paratha',      40,  'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=400&q=80', 2, 'Extra Crispy, Less Oil, Soft', 1),
        ('Anda Paratha',   'Egg stuffed paratha',        60,  'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&q=80', 2, 'Full Fried Egg, Half Fried Egg, Spicy', 1),
        ('Halwa Puri',     'Fresh morning halwa puri',  100,  'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&q=80', 2, 'Extra Chana, Extra Halwa, Hot Puris', 1),
        ('Chicken Karahi', 'Desi chicken karahi',       350,  'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&q=80', 3, 'Extra Spicy, Mild Spicy, Less Oil, Desi Ghee', 1),
        ('Lassi',          'Thandi meethi lassi',        60,  'https://images.unsplash.com/photo-1553787499-6f9133860278?w=400&q=80', 4, 'Meethi Lassi, Namkeen Lassi, Extra Cream', 1),
        ('Mineral Water',  'Chilled 500ml water',        50,  'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=400&q=80', 4, 'Chilled, Room Temperature', 1);
    `);
  }

  // Ensure comprehensive seating areas with capacities exist
  const seatingCount = sqlite
    .prepare("SELECT COUNT(*) as c FROM seating_areas")
    .get() as { c: number };
  if (seatingCount.c === 0) {
    sqlite.exec(`INSERT INTO seating_areas (name, type, capacity) VALUES
      ('Table 1', 'indoor', 4),
      ('Table 2', 'indoor', 4),
      ('Table 3', 'indoor', 6),
      ('Table 4', 'indoor', 2),
      ('Family 1', 'family', 6),
      ('Family 2', 'family', 8),
      ('Rooftop 1', 'rooftop', 4),
      ('Rooftop 2', 'rooftop', 4),
      ('Takeaway Desk', 'takeaway', 1);`);
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

    // Auto-migrate any missing columns for staff table on existing databases
    try { sqlite.exec("ALTER TABLE staff ADD COLUMN name TEXT;"); } catch (_) {}
    try { sqlite.exec("ALTER TABLE staff ADD COLUMN email TEXT;"); } catch (_) {}
    try { sqlite.exec("ALTER TABLE staff ADD COLUMN username TEXT;"); } catch (_) {}
    try { sqlite.exec("ALTER TABLE staff ADD COLUMN password TEXT;"); } catch (_) {}
    try { sqlite.exec("ALTER TABLE staff ADD COLUMN stationName TEXT;"); } catch (_) {}
    // try { sqlite.exec("ALTER TABLE staff ADD COLUMN assignedCashierId INTEGER;"); } catch (_) {}
    try { sqlite.exec("ALTER TABLE staff ADD COLUMN assignedCashierIds TEXT;"); } catch (_) {}
    try { sqlite.exec("ALTER TABLE staff ADD COLUMN permissions TEXT;"); } catch (_) {}
    try { sqlite.exec("ALTER TABLE staff ADD COLUMN allowedIp TEXT;"); } catch (_) {}
    try { sqlite.exec("ALTER TABLE staff ADD COLUMN currentIp TEXT;"); } catch (_) {}
    try { sqlite.exec("ALTER TABLE staff ADD COLUMN isActive INTEGER DEFAULT 1;"); } catch (_) {}
    try { sqlite.exec("ALTER TABLE staff ADD COLUMN lastLoginAt TEXT;"); } catch (_) {}
    try { sqlite.exec("ALTER TABLE staff ADD COLUMN createdAt TEXT;"); } catch (_) {}
    try { sqlite.exec("ALTER TABLE staff ADD COLUMN updatedAt TEXT;"); } catch (_) {}

    // System / Hotel Settings table
    try {
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS system_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);
      const existingMode = sqlite.prepare("SELECT value FROM system_settings WHERE key = 'operationMode'").get();
      if (!existingMode) {
        sqlite.prepare("INSERT INTO system_settings (key, value) VALUES ('operationMode', 'unified')").run();
      }
    } catch (_) {}

    try {
      sqlite.exec("UPDATE staff SET name = username WHERE (name IS NULL OR name = '') AND username IS NOT NULL;");
      sqlite.exec("UPDATE staff SET email = username WHERE (email IS NULL OR email = '') AND username IS NOT NULL;");
      sqlite.exec("UPDATE staff SET username = email WHERE (username IS NULL OR username = '') AND email IS NOT NULL;");
      sqlite.exec("UPDATE staff SET createdAt = datetime('now') WHERE createdAt IS NULL;");
      sqlite.exec("UPDATE staff SET updatedAt = datetime('now') WHERE updatedAt IS NULL;");
      sqlite.exec("UPDATE staff SET isActive = 1 WHERE isActive IS NULL;");
    } catch (_) {}

    // Ensure standard default staff accounts exist with valid password hashes
    // Ensure standard default staff accounts exist with valid password hashes (1 user per role)
    const adminHash = hashPassword("admin123");
    const cashierHash = hashPassword("cashier123");
    const kitchenHash = hashPassword("kitchen123");
    const waiterHash = hashPassword("waiter123");
    const tableCols = (sqlite.prepare("PRAGMA table_info(staff)").all() as any[]).map((c) => c.name);
    const hasUsername = tableCols.includes("username");

    const insertDefaultStaff = (name: string, email: string, pass: string, hash: string, role: string, station: string | null, ip: string | null) => {
      if (hasUsername) {
        sqlite.prepare(`
          INSERT INTO staff (name, email, username, password, passwordHash, role, stationName, allowedIp, isActive)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
        `).run(name, email, email, pass, hash, role, station, ip);
      } else {
        sqlite.prepare(`
          INSERT INTO staff (name, email, password, passwordHash, role, stationName, allowedIp, isActive)
          VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        `).run(name, email, pass, hash, role, station, ip);
      }
    };

    // 1. Admin
    const existingAdmin = sqlite.prepare("SELECT id FROM staff WHERE email = 'admin'").get();
    if (!existingAdmin) {
      insertDefaultStaff("Master Admin", "admin", "admin123", adminHash, "admin", "Master Terminal", null);
    } else {
      sqlite.prepare("UPDATE staff SET name = 'Master Admin', email = 'admin', password = 'admin123', passwordHash = ?, role = 'admin', isActive = 1 WHERE email = 'admin'").run(adminHash);
    }

    // 2. Cashier
    const existingCashier = sqlite.prepare("SELECT id FROM staff WHERE email = 'cashier' OR email = 'cashier1'").get();
    if (!existingCashier) {
      insertDefaultStaff("Bilal Cashier", "cashier", "cashier123", cashierHash, "cashier", "Counter 1", null);
    } else {
      sqlite.prepare("UPDATE staff SET name = 'Bilal Cashier', email = 'cashier', password = 'cashier123', passwordHash = ?, role = 'cashier', stationName = 'Counter 1', isActive = 1 WHERE email = 'cashier' OR email = 'cashier1'").run(cashierHash);
    }

    // 3. Kitchen Chef
    const existingKitchen = sqlite.prepare("SELECT id FROM staff WHERE email = 'kitchen' OR email = 'kitchen1'").get();
    if (!existingKitchen) {
      insertDefaultStaff("Ustad Rahim (Chef)", "kitchen", "kitchen123", kitchenHash, "kitchen", "All Departments", null);
    } else {
      sqlite.prepare("UPDATE staff SET name = 'Ustad Rahim (Chef)', email = 'kitchen', password = 'kitchen123', passwordHash = ?, role = 'kitchen', stationName = 'All Departments', isActive = 1 WHERE email = 'kitchen' OR email = 'kitchen1'").run(kitchenHash);
    }

    // 4. Floor Waiter
    const existingWaiter = sqlite.prepare("SELECT id FROM staff WHERE email = 'waiter' OR email = 'waiter1'").get();
    if (!existingWaiter) {
      insertDefaultStaff("Hamza Waiter", "waiter", "waiter123", waiterHash, "waiter", "Floor Delivery", null);
    } else {
      sqlite.prepare("UPDATE staff SET name = 'Hamza Waiter', email = 'waiter', password = 'waiter123', passwordHash = ?, role = 'waiter', stationName = 'Floor Delivery', isActive = 1 WHERE email = 'waiter' OR email = 'waiter1'").run(waiterHash);
    }
  }

