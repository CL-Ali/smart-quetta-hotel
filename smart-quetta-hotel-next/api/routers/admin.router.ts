import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, desc, ne, and, inArray } from "drizzle-orm";
import { adminProcedure, router } from "../lib/trpc";
import { getDb } from "../db";
import {
  staff,
  orders,
  payments,
  shopkeepers,
  invoices,
  systemSettings,
  ticketSessionLogs,
  orderItems,
  tickets,
  menuItems,
  departments,
  counters,
} from "../db/schema";
import { hashPassword } from "../lib/auth";
import {
  getCurrentTicketVersion,
  getCurrentShiftStatus,
  setShiftSessionState,
} from "../lib/ticketVersion";

export const adminRouter = router({
  getSystemConfig: adminProcedure.query(async () => {
    const db = getDb();
    const modeRow = db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, "operationMode"))
      .all()[0];
    const queueRow = db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, "showCustomerQueue"))
      .all()[0];
    const allowedLangsRow = db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, "allowedLanguages"))
      .all()[0];
    const defaultLangRow = db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, "defaultLanguage"))
      .all()[0];
    const soundRow = db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, "soundEnabled"))
      .all()[0];
    const posAccessRow = db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, "defaultPosAccess"))
      .all()[0];

    let allowedLanguages: string[] = ["ur", "en", "ps", "bal", "brh", "sd", "pa", "fa"];
    if (allowedLangsRow?.value) {
      try {
        allowedLanguages = JSON.parse(allowedLangsRow.value);
      } catch {}
    }

    return {
      operationMode: (modeRow?.value as "unified" | "segregated") || "unified",
      showCustomerQueue: queueRow ? queueRow.value === "true" : true,
      allowedLanguages,
      defaultLanguage: defaultLangRow?.value || "ur",
      soundEnabled: soundRow ? soundRow.value === "true" : true,
      defaultPosAccess: posAccessRow ? posAccessRow.value === "true" : true,
    };
  }),

  updateSystemConfig: adminProcedure
    .input(
      z.object({
        operationMode: z.enum(["unified", "segregated"]).optional(),
        showCustomerQueue: z.boolean().optional(),
        allowedLanguages: z.array(z.string()).optional(),
        defaultLanguage: z.string().optional(),
        soundEnabled: z.boolean().optional(),
        defaultPosAccess: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const nowIso = new Date().toISOString();

      if (input.operationMode !== undefined) {
        const existing = db
          .select()
          .from(systemSettings)
          .where(eq(systemSettings.key, "operationMode"))
          .all()[0];

        if (existing) {
          db.update(systemSettings)
            .set({ value: input.operationMode, updatedAt: nowIso })
            .where(eq(systemSettings.key, "operationMode"))
            .run();
        } else {
          db.insert(systemSettings)
            .values({ key: "operationMode", value: input.operationMode, updatedAt: nowIso })
            .run();
        }
      }

      if (input.showCustomerQueue !== undefined) {
        const strVal = input.showCustomerQueue ? "true" : "false";
        const existing = db
          .select()
          .from(systemSettings)
          .where(eq(systemSettings.key, "showCustomerQueue"))
          .all()[0];

        if (existing) {
          db.update(systemSettings)
            .set({ value: strVal, updatedAt: nowIso })
            .where(eq(systemSettings.key, "showCustomerQueue"))
            .run();
        } else {
          db.insert(systemSettings)
            .values({ key: "showCustomerQueue", value: strVal, updatedAt: nowIso })
            .run();
        }
      }

      if (input.allowedLanguages !== undefined) {
        const strVal = JSON.stringify(input.allowedLanguages);
        const existing = db
          .select()
          .from(systemSettings)
          .where(eq(systemSettings.key, "allowedLanguages"))
          .all()[0];

        if (existing) {
          db.update(systemSettings)
            .set({ value: strVal, updatedAt: nowIso })
            .where(eq(systemSettings.key, "allowedLanguages"))
            .run();
        } else {
          db.insert(systemSettings)
            .values({ key: "allowedLanguages", value: strVal, updatedAt: nowIso })
            .run();
        }
      }

      if (input.defaultLanguage !== undefined) {
        const existing = db
          .select()
          .from(systemSettings)
          .where(eq(systemSettings.key, "defaultLanguage"))
          .all()[0];

        if (existing) {
          db.update(systemSettings)
            .set({ value: input.defaultLanguage, updatedAt: nowIso })
            .where(eq(systemSettings.key, "defaultLanguage"))
            .run();
        } else {
          db.insert(systemSettings)
            .values({ key: "defaultLanguage", value: input.defaultLanguage, updatedAt: nowIso })
            .run();
        }
      }

      if (input.soundEnabled !== undefined) {
        const strVal = input.soundEnabled ? "true" : "false";
        const existing = db
          .select()
          .from(systemSettings)
          .where(eq(systemSettings.key, "soundEnabled"))
          .all()[0];

        if (existing) {
          db.update(systemSettings)
            .set({ value: strVal, updatedAt: nowIso })
            .where(eq(systemSettings.key, "soundEnabled"))
            .run();
        } else {
          db.insert(systemSettings)
            .values({ key: "soundEnabled", value: strVal, updatedAt: nowIso })
            .run();
        }
      }

      if (input.defaultPosAccess !== undefined) {
        const strVal = input.defaultPosAccess ? "true" : "false";
        const existing = db
          .select()
          .from(systemSettings)
          .where(eq(systemSettings.key, "defaultPosAccess"))
          .all()[0];

        if (existing) {
          db.update(systemSettings)
            .set({ value: strVal, updatedAt: nowIso })
            .where(eq(systemSettings.key, "defaultPosAccess"))
            .run();
        } else {
          db.insert(systemSettings)
            .values({ key: "defaultPosAccess", value: strVal, updatedAt: nowIso })
            .run();
        }
      }

      return {
        success: true,
        operationMode: input.operationMode,
        showCustomerQueue: input.showCustomerQueue,
        allowedLanguages: input.allowedLanguages,
        defaultLanguage: input.defaultLanguage,
        soundEnabled: input.soundEnabled,
        defaultPosAccess: input.defaultPosAccess,
      };
    }),

  getAccountsOverview: adminProcedure.query(async () => {
    const db = getDb();

    // 1. Operation Mode & Customer Queue Visibility
    const modeRow = db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, "operationMode"))
      .all()[0];
    const operationMode = (modeRow?.value as "unified" | "segregated") || "unified";

    const queueRow = db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, "showCustomerQueue"))
      .all()[0];
    const showCustomerQueue = queueRow ? queueRow.value === "true" : true;

    const soundRow = db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, "soundEnabled"))
      .all()[0];
    const soundEnabled = soundRow ? soundRow.value === "true" : true;

    // 2. Financial Metrics
    const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const allPayments = db.select().from(payments).all();
    let totalRevenue = 0;
    let totalCash = 0;
    let totalBank = 0;
    let todayRevenue = 0;
    let todayCash = 0;
    let todayBank = 0;

    for (const p of allPayments) {
      if (p.status === "completed" || !p.status) {
        const amt = Number(p.amount) || 0;
        totalRevenue += amt;
        if (p.method === "cash") totalCash += amt;
        if (p.method === "bank") totalBank += amt;

        const pDate = (p.receivedAt || p.createdAt || "").split("T")[0];
        if (pDate === todayStr) {
          todayRevenue += amt;
          if (p.method === "cash") todayCash += amt;
          if (p.method === "bank") todayBank += amt;
        }
      }
    }

    // 3. Khata Receivables
    const allShopkeepers = db.select().from(shopkeepers).all();
    let totalKhataReceivable = 0;
    for (const s of allShopkeepers) {
      const bal = Number(s.balance) || 0;
      if (bal > 0) {
        totalKhataReceivable += bal;
      }
    }

    // 4. Orders Summary & Counter Breakdowns
    const allOrders = db.select().from(orders).all();
    const allStaff = db.select().from(staff).all();

    let unpaidOrdersCount = 0;
    let unpaidOrdersAmount = 0;
    let totalOrdersCount = allOrders.length;
    let pendingCount = 0;
    let readyCount = 0;
    let servedCount = 0;

    for (const o of allOrders) {
      if (o.status !== "cancelled") {
        if (o.paymentStatus === "unpaid" || o.paymentStatus === "partial") {
          unpaidOrdersCount++;
          const remaining = (Number(o.totalAmount || o.total) || 0) - (Number(o.paidAmount) || 0);
          if (remaining > 0) unpaidOrdersAmount += remaining;
        }
      }
      if (o.status === "pending" || o.status === "preparing") pendingCount++;
      if (o.status === "ready") readyCount++;
      if (o.status === "served" || o.status === "paid") servedCount++;
    }

    // 5. Build Dynamic Counter Breakdowns
    const cashiers = allStaff.filter((s) => s.role === "cashier");
    const waiters = allStaff.filter((s) => s.role === "waiter");

    // Discover all distinct counters: from cashier stations + order counter names
    const counterMap = new Map<string, {
      counterName: string;
      cashiers: Array<{ id: number; name: string; email: string; allowedIp: string | null; currentIp: string | null; isActive: boolean }>;
      waiters: Array<{ id: number; name: string; email: string; allowedIp: string | null; isActive: boolean }>;
      todayRevenue: number;
      todayCash: number;
      todayBank: number;
      totalRevenue: number;
      activeOrdersCount: number;
      unpaidOrdersCount: number;
      unpaidAmount: number;
    }>();

    const normalizeCounter = (raw?: string | null) => {
      const name = raw?.trim();
      if (!name || name === "Main Cashier Counter") return "Counter 1";
      return name;
    };

    // Initialize all created counters from DB
    const allDbCounters = db.select().from(counters).all();
    if (allDbCounters.length === 0) {
      counterMap.set("Counter 1", {
        counterName: "Counter 1",
        cashiers: [],
        waiters: [],
        todayRevenue: 0,
        todayCash: 0,
        todayBank: 0,
        totalRevenue: 0,
        activeOrdersCount: 0,
        unpaidOrdersCount: 0,
        unpaidAmount: 0,
      });
    } else {
      for (const cnt of allDbCounters) {
        if (!cnt.isActive) continue;
        counterMap.set(cnt.name, {
          counterName: cnt.name,
          cashiers: [],
          waiters: [],
          todayRevenue: 0,
          todayCash: 0,
          todayBank: 0,
          totalRevenue: 0,
          activeOrdersCount: 0,
          unpaidOrdersCount: 0,
          unpaidAmount: 0,
        });
      }
    }

    // Initialize counters from Cashiers with assigned stations
    for (const c of cashiers) {
      if (!c.stationName || !c.stationName.trim()) continue;
      const cName = normalizeCounter(c.stationName);
      if (!counterMap.has(cName)) {
        counterMap.set(cName, {
          counterName: cName,
          cashiers: [],
          waiters: [],
          todayRevenue: 0,
          todayCash: 0,
          todayBank: 0,
          totalRevenue: 0,
          activeOrdersCount: 0,
          unpaidOrdersCount: 0,
          unpaidAmount: 0,
        });
      }
      counterMap.get(cName)!.cashiers.push({
        id: c.id,
        name: c.name,
        email: c.email,
        allowedIp: c.allowedIp,
        currentIp: c.currentIp,
        isActive: !!c.isActive,
      });
    }

    // Distribute Waiters to Counter Map (Support many-to-many counters per waiter)
    for (const w of waiters) {
      let cashierIds: number[] = [];
      if ((w as any).assignedCashierIds) {
        try {
          cashierIds = JSON.parse((w as any).assignedCashierIds);
        } catch {
          cashierIds = String((w as any).assignedCashierIds).split(",").map((id: string) => Number(id.trim())).filter(Boolean);
        }
      }

      for (const cId of cashierIds) {
        const assignedCashier = allStaff.find((s) => s.id === cId);
        if (!assignedCashier?.stationName || !assignedCashier.stationName.trim()) continue;
        const cName = normalizeCounter(assignedCashier.stationName);
        if (counterMap.has(cName)) {
          const existingWaiters = counterMap.get(cName)!.waiters;
          if (!existingWaiters.some((ex) => ex.id === w.id)) {
            existingWaiters.push({
              id: w.id,
              name: w.name,
              email: w.email,
              allowedIp: w.allowedIp,
              isActive: !!w.isActive,
            });
          }
        }
      }
    }

    // Aggregate Orders & Revenue by Counter
    for (const o of allOrders) {
      const cName = normalizeCounter(o.counterName);
      if (!counterMap.has(cName)) {
        counterMap.set(cName, {
          counterName: cName,
          cashiers: [],
          waiters: [],
          todayRevenue: 0,
          todayCash: 0,
          todayBank: 0,
          totalRevenue: 0,
          activeOrdersCount: 0,
          unpaidOrdersCount: 0,
          unpaidAmount: 0,
        });
      }

      const counterEntry = counterMap.get(cName)!;
      const orderTotal = Number(o.totalAmount || o.total) || 0;
      const orderPaid = Number(o.paidAmount) || 0;

      if (o.status !== "cancelled") {
        if (o.status !== "served" && o.status !== "paid") {
          counterEntry.activeOrdersCount++;
        }
        if (o.paymentStatus === "unpaid" || o.paymentStatus === "partial") {
          counterEntry.unpaidOrdersCount++;
          const rem = orderTotal - orderPaid;
          if (rem > 0) counterEntry.unpaidAmount += rem;
        }

        counterEntry.totalRevenue += orderPaid;
        const oDate = (o.createdAt || "").split("T")[0];
        if (oDate === todayStr) {
          counterEntry.todayRevenue += orderPaid;
          if (o.paymentMethod === "cash") counterEntry.todayCash += orderPaid;
          if (o.paymentMethod === "bank") counterEntry.todayBank += orderPaid;
        }
      }
    }

    const countersBreakdown = Array.from(counterMap.values());

    // 6. Recent Payments
    const recentPayments = db
      .select()
      .from(payments)
      .orderBy(desc(payments.createdAt))
      .limit(10)
      .all();

    return {
      operationMode,
      showCustomerQueue,
      soundEnabled,
      financials: {
        todayRevenue,
        todayCash,
        todayBank,
        totalRevenue,
        totalCash,
        totalBank,
        totalKhataReceivable,
        unpaidOrdersAmount,
        unpaidOrdersCount,
      },
      ordersSummary: {
        totalOrdersCount,
        pendingCount,
        readyCount,
        servedCount,
      },
      countersBreakdown,
      shopkeepers: allShopkeepers,
      recentPayments,
    };
  }),

  listStaff: adminProcedure.query(async () => {
    const db = getDb();
    const allStaff = db
      .select({
        id: staff.id,
        name: staff.name,
        email: staff.email,
        username: staff.username,
        password: staff.password,
        role: staff.role,
        stationName: staff.stationName,
        assignedCashierIds: staff.assignedCashierIds,
        permissions: staff.permissions,
        allowedIp: staff.allowedIp,
        currentIp: staff.currentIp,
        isActive: staff.isActive,
        lastLoginAt: staff.lastLoginAt,
        createdAt: staff.createdAt,
        updatedAt: staff.updatedAt,
      })
      .from(staff)
      .all();

    const staffMap = new Map<number, string>();
    for (const s of allStaff) {
      staffMap.set(s.id, s.name);
    }

    return allStaff.map((s) => {
      let parsedPerms: string[] = [];
      if (s.permissions) {
        try {
          parsedPerms = JSON.parse(s.permissions);
        } catch {
          parsedPerms = s.permissions.split(",").map((p) => p.trim());
        }
      }

      let parsedCashierIds: number[] = [];
      if (s.assignedCashierIds) {
        try {
          parsedCashierIds = JSON.parse(s.assignedCashierIds);
        } catch {
          parsedCashierIds = s.assignedCashierIds.split(",").map((id) => Number(id.trim())).filter(Boolean);
        }
      }

      const assignedCashierNames = parsedCashierIds
        .map((id) => staffMap.get(id))
        .filter(Boolean) as string[];

      return {
        ...s,
        assignedCashierIds: parsedCashierIds,
        assignedCashierNames,
        assignedCashierName: assignedCashierNames.length > 0
          ? assignedCashierNames.join(", ")
          : null,
        permissionsList: parsedPerms,
      };
    });
  }),

  createStaff: adminProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().min(1, "Username or email is required"),
        password: z.string().min(1, "Password is required"),
        role: z.enum(["admin", "cashier", "waiter", "kitchen"]),
        stationName: z.string().optional().nullable(),
        assignedCashierIds: z.array(z.number()).optional().nullable(),
        permissions: z.array(z.string()).optional().nullable(),
        allowedIp: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      // Check unique username
      const existing = db
        .select()
        .from(staff)
        .where(eq(staff.email, input.email.trim()))
        .all();

      if (existing.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Username "${input.email}" is already taken. Please choose another.`,
        });
      }

      const passHash = hashPassword(input.password);
      const nowIso = new Date().toISOString();
      const permsJson = input.permissions ? JSON.stringify(input.permissions) : null;
      const cashierIds = input.assignedCashierIds && input.assignedCashierIds.length > 0
        ? input.assignedCashierIds
        : [];
      const cashierIdsJson = cashierIds.length > 0 ? JSON.stringify(cashierIds) : null;

      const inserted = db
        .insert(staff)
        .values({
          name: input.name.trim(),
          email: input.email.trim(),
          username: input.email.trim(),
          password: input.password.trim(),
          passwordHash: passHash,
          role: input.role,
          stationName: input.stationName ? input.stationName.trim() : null,
          assignedCashierIds: cashierIdsJson,
          permissions: permsJson,
          allowedIp: input.allowedIp ? input.allowedIp.trim() : null,
          isActive: true,
          createdAt: nowIso,
          updatedAt: nowIso,
        })
        .returning()
        .all()[0];

      return {
        success: true,
        staff: inserted,
      };
    }),

  updateStaff: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().optional(),
        password: z.string().optional(),
        role: z.enum(["admin", "cashier", "waiter", "kitchen"]).optional(),
        stationName: z.string().nullable().optional(),
        assignedCashierIds: z.array(z.number()).nullable().optional(),
        permissions: z.array(z.string()).nullable().optional(),
        allowedIp: z.string().nullable().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const existing = db.select().from(staff).where(eq(staff.id, input.id)).all()[0];
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Staff account not found" });
      }

      // Check unique email if changing
      if (input.email && input.email.trim() !== existing.email) {
        const duplicate = db
          .select()
          .from(staff)
          .where(and(eq(staff.email, input.email.trim()), ne(staff.id, input.id)))
          .all();
        if (duplicate.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Username "${input.email}" is already taken by another staff member.`,
          });
        }
      }

      const updatePayload: Record<string, any> = {
        updatedAt: new Date().toISOString(),
      };

      if (input.name !== undefined) updatePayload.name = input.name.trim();
      if (input.email !== undefined) {
        updatePayload.email = input.email.trim();
        updatePayload.username = input.email.trim();
      }
      if (input.role !== undefined) updatePayload.role = input.role;
      if (input.stationName !== undefined) {
        updatePayload.stationName = input.stationName ? input.stationName.trim() : null;
      }
      if (input.assignedCashierIds !== undefined) {
        const ids = input.assignedCashierIds && input.assignedCashierIds.length > 0 ? input.assignedCashierIds : [];
        updatePayload.assignedCashierIds = ids.length > 0 ? JSON.stringify(ids) : null;
      }
      if (input.permissions !== undefined) {
        updatePayload.permissions = input.permissions ? JSON.stringify(input.permissions) : null;
      }
      if (input.allowedIp !== undefined) {
        updatePayload.allowedIp = input.allowedIp ? input.allowedIp.trim() : null;
      }
      if (input.isActive !== undefined) updatePayload.isActive = input.isActive;
      if (input.password && input.password.trim()) {
        updatePayload.password = input.password.trim();
        updatePayload.passwordHash = hashPassword(input.password);
      }

      db.update(staff).set(updatePayload).where(eq(staff.id, input.id)).run();

      return { success: true };
    }),

  deleteStaff: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      db.delete(staff).where(eq(staff.id, input.id)).run();
      return { success: true };
    }),

  assignCounterCashiers: adminProcedure
    .input(
      z.object({
        counterName: z.string().min(1),
        cashierIds: z.array(z.number()),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const allCashiers = db.select().from(staff).where(eq(staff.role, "cashier")).all();
      const targetIds = new Set(input.cashierIds);

      for (const c of allCashiers) {
        const isCurrentStation =
          c.stationName === input.counterName.trim() ||
          (input.counterName.trim() === "Counter 1" && c.stationName === "Main Cashier Counter");

        if (targetIds.has(c.id)) {
          db.update(staff)
            .set({ stationName: input.counterName.trim(), updatedAt: new Date().toISOString() })
            .where(eq(staff.id, c.id))
            .run();
        } else if (isCurrentStation) {
          db.update(staff)
            .set({ stationName: null, updatedAt: new Date().toISOString() })
            .where(eq(staff.id, c.id))
            .run();
        }
      }

      return { success: true };
    }),

  // ── Shift Session & Day Close Procedures ──────────────────────────────────
  getShiftSessionInfo: adminProcedure.query(async () => {
    const db = getDb();
    const currentTicketVersion = getCurrentTicketVersion(db);
    const shiftStatus = getCurrentShiftStatus(db);

    // Fetch all orders for the current ticketVersion
    const currentOrders = db
      .select()
      .from(orders)
      .where(eq(orders.ticketVersion, currentTicketVersion))
      .all();

    const nonCancelledOrders = currentOrders.filter((o) => o.status !== "cancelled");
    const todayTicketsCount = nonCancelledOrders.length;
    const todayRevenue = nonCancelledOrders.reduce((sum, o) => sum + (o.total ?? 0), 0);
    const todayDiscount = nonCancelledOrders.reduce((sum, o) => sum + (o.discount ?? 0), 0);
    const todayPaid = nonCancelledOrders.reduce((sum, o) => sum + (o.paidAmount ?? 0), 0);
    const todayUnpaid = Math.max(0, todayRevenue - todayPaid);

    // Payments breakdown for this session
    const currentPayments = db
      .select()
      .from(payments)
      .where(eq(payments.ticketVersion, currentTicketVersion))
      .all();

    const todayCash = currentPayments
      .filter((p) => p.method === "cash" && p.status !== "failed")
      .reduce((sum, p) => sum + p.amount, 0);

    const todayBank = currentPayments
      .filter((p) => p.method !== "cash" && p.status !== "failed")
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      ticketVersion: currentTicketVersion,
      shiftStatus,
      todayTicketsCount,
      todayOrdersCount: currentOrders.length,
      todayRevenue,
      todayDiscount,
      todayPaid,
      todayUnpaid,
      todayCash,
      todayBank,
    };
  }),

  // Move active day to verifying / audit staging mode
  stageShiftWindup: adminProcedure.mutation(async () => {
    const db = getDb();
    const currentTicketVersion = getCurrentTicketVersion(db);
    setShiftSessionState(db, currentTicketVersion, "verifying");
    return { success: true, shiftStatus: "verifying", ticketVersion: currentTicketVersion };
  }),

  // Revert verifying mode back to live active
  revertShiftWindup: adminProcedure.mutation(async () => {
    const db = getDb();
    const currentTicketVersion = getCurrentTicketVersion(db);
    setShiftSessionState(db, currentTicketVersion, "active");
    return { success: true, shiftStatus: "active", ticketVersion: currentTicketVersion };
  }),

  // Get all staged orders for audit/verification
  getStagedVerificationOrders: adminProcedure.query(async () => {
    const db = getDb();
    const currentTicketVersion = getCurrentTicketVersion(db);
    const currentOrders = db
      .select()
      .from(orders)
      .where(eq(orders.ticketVersion, currentTicketVersion))
      .orderBy(desc(orders.id))
      .all();

    const orderIds = currentOrders.map((o) => o.id);
    const allItems = orderIds.length > 0
      ? db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds)).all()
      : [];

    return currentOrders.map((ord) => ({
      ...ord,
      items: allItems.filter((it) => it.orderId === ord.id),
    }));
  }),

  // Update order during audit / verification
  updateStagedOrder: adminProcedure
    .input(
      z.object({
        orderId: z.number(),
        customerName: z.string().optional(),
        discount: z.number().optional(),
        total: z.number().optional(),
        paidAmount: z.number().optional(),
        paymentStatus: z.enum(["unpaid", "partial", "paid"]).optional(),
        status: z.string().optional(),
        remarks: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const updateData: Record<string, any> = { updatedAt: new Date().toISOString() };
      if (input.customerName !== undefined) updateData.customerName = input.customerName;
      if (input.discount !== undefined) updateData.discount = input.discount;
      if (input.total !== undefined) {
        updateData.total = input.total;
        updateData.totalAmount = input.total;
      }
      if (input.paidAmount !== undefined) updateData.paidAmount = input.paidAmount;
      if (input.paymentStatus !== undefined) updateData.paymentStatus = input.paymentStatus;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.remarks !== undefined) updateData.remarks = input.remarks;

      db.update(orders).set(updateData).where(eq(orders.id, input.orderId)).run();
      return { success: true };
    }),

  // Delete staged / fake / test order
  deleteStagedOrder: adminProcedure
    .input(z.object({ orderId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      // Delete orderItems, tickets, payments
      db.delete(orderItems).where(eq(orderItems.orderId, input.orderId)).run();
      db.delete(tickets).where(eq(tickets.orderId, input.orderId)).run();
      db.delete(payments).where(eq(payments.orderId, input.orderId)).run();
      db.delete(orders).where(eq(orders.id, input.orderId)).run();
      return { success: true };
    }),

  // Final Close Day: Save snapshot into ticket_session_logs & increment ticketVersion + 1
  finalizeDayClose: adminProcedure.mutation(async ({ ctx }) => {
    const db = getDb();
    const currentTicketVersion = getCurrentTicketVersion(db);
    const nowIso = new Date().toISOString();

    // Fetch all current version orders & items
    const currentOrders = db
      .select()
      .from(orders)
      .where(eq(orders.ticketVersion, currentTicketVersion))
      .all();

    const orderIds = currentOrders.map((o) => o.id);
    const allItems = orderIds.length > 0
      ? db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds)).all()
      : [];

    const nonCancelledOrders = currentOrders.filter((o) => o.status !== "cancelled");
    const totalRevenue = nonCancelledOrders.reduce((sum, o) => sum + (o.total ?? 0), 0);
    const totalDiscount = nonCancelledOrders.reduce((sum, o) => sum + (o.discount ?? 0), 0);
    const totalPaid = nonCancelledOrders.reduce((sum, o) => sum + (o.paidAmount ?? 0), 0);
    const totalKhata = Math.max(0, totalRevenue - totalPaid);

    // Payments breakdown
    const currentPayments = db
      .select()
      .from(payments)
      .where(eq(payments.ticketVersion, currentTicketVersion))
      .all();

    const totalCash = currentPayments
      .filter((p) => p.method === "cash" && p.status !== "failed")
      .reduce((sum, p) => sum + p.amount, 0);

    const totalBank = currentPayments
      .filter((p) => p.method !== "cash" && p.status !== "failed")
      .reduce((sum, p) => sum + p.amount, 0);

    // Fetch all menu items & departments to resolve product names and categories
    const allMenu = db.select().from(menuItems).all();
    const menuLookup = new Map<number, { name: string; price: number; departmentId?: number | null }>();
    for (const m of allMenu) {
      menuLookup.set(m.id, { name: m.name, price: m.price, departmentId: m.departmentId });
    }

    const allDepts = db.select().from(departments).all();
    const deptLookup = new Map<number, string>();
    for (const d of allDepts) {
      deptLookup.set(d.id, d.name);
    }

    // Item sales snapshot with complete names and performance
    const itemMap = new Map<string, {
      menuItemId?: number;
      name: string;
      departmentName: string;
      quantityOrdered: number;
      quantityServed: number;
      quantityCancelled: number;
      quantity: number;
      unitPrice: number;
      total: number;
      isSold: boolean;
    }>();

    for (const m of allMenu) {
      const deptName = m.departmentId ? deptLookup.get(m.departmentId) || "General" : "General";
      itemMap.set(m.name, {
        menuItemId: m.id,
        name: m.name,
        departmentName: deptName,
        quantityOrdered: 0,
        quantityServed: 0,
        quantityCancelled: 0,
        quantity: 0,
        unitPrice: m.price,
        total: 0,
        isSold: false,
      });
    }

    const orderStatusMap = new Map<number, string>();
    for (const o of currentOrders) {
      orderStatusMap.set(o.id, o.status);
    }

    for (const it of allItems) {
      const menuItem = it.menuItemId ? menuLookup.get(it.menuItemId) : null;
      const name = it.nameSnapshot || menuItem?.name || (it.menuItemId ? `Item #${it.menuItemId}` : "Item");
      const unitPrice = it.unitPrice || menuItem?.price || 0;
      const deptName = menuItem?.departmentId ? deptLookup.get(menuItem.departmentId) || "General" : "General";

      const existing = itemMap.get(name) || {
        menuItemId: it.menuItemId || undefined,
        name,
        departmentName: deptName,
        quantityOrdered: 0,
        quantityServed: 0,
        quantityCancelled: 0,
        quantity: 0,
        unitPrice,
        total: 0,
        isSold: false,
      };

      const ordStatus = (it.orderId ? orderStatusMap.get(it.orderId) : undefined) || "pending";
      const isCancelled = ordStatus === "cancelled" || ordStatus === "voided" || it.status === "cancelled";
      const isServed = ordStatus === "served" || ordStatus === "paid" || ordStatus === "completed" || it.kitchenStatus === "served" || it.status === "served";

      existing.quantityOrdered += it.quantity;
      if (isCancelled) {
        existing.quantityCancelled += it.quantity;
      } else if (isServed) {
        const servedQty = (it.servedQty && it.servedQty > 0) ? it.servedQty : it.quantity;
        existing.quantityServed += servedQty;
        existing.quantity += servedQty;
        existing.total += (unitPrice * servedQty);
        if (existing.quantity > 0) existing.isSold = true;
      } else {
        // Pending / In Kitchen (NOT served yet)
        const partialServed = it.servedQty || 0;
        if (partialServed > 0) {
          existing.quantityServed += partialServed;
          existing.quantity += partialServed;
          existing.total += (unitPrice * partialServed);
          if (existing.quantity > 0) existing.isSold = true;
        }
      }
      itemMap.set(name, existing);
    }
    const itemsSnapshot = JSON.stringify(Array.from(itemMap.values()));

    // Orders full snapshot with resolved item names & calculated totals
    const enrichedOrders = currentOrders.map((ord) => {
      const ordItems = allItems.filter((it) => it.orderId === ord.id).map((it) => {
        const menuItem = it.menuItemId ? menuLookup.get(it.menuItemId) : null;
        const resolvedName = it.nameSnapshot || menuItem?.name || (it.menuItemId ? `Item #${it.menuItemId}` : "Item");
        const resolvedPrice = it.unitPrice || menuItem?.price || 0;
        return {
          ...it,
          nameSnapshot: resolvedName,
          name: resolvedName,
          unitPrice: resolvedPrice,
        };
      });

      const itemsSum = ordItems.reduce((acc, it) => acc + (it.unitPrice * it.quantity), 0);
      const computedTotal = (ord.total && ord.total > 0) ? ord.total : (ord.totalAmount && ord.totalAmount > 0 ? ord.totalAmount : itemsSum);

      return {
        ...ord,
        total: computedTotal,
        subtotal: ord.subtotal || computedTotal,
        items: ordItems,
      };
    });
    const ordersSnapshot = JSON.stringify(enrichedOrders);

    const firstOrderTime = currentOrders[0]?.createdAt || nowIso;

    // Check if session log already exists for this version
    const existingLog = db
      .select()
      .from(ticketSessionLogs)
      .where(eq(ticketSessionLogs.ticketVersion, currentTicketVersion))
      .all()[0];

    if (existingLog) {
      db.update(ticketSessionLogs)
        .set({
          shiftStatus: "closed",
          closedDate: nowIso,
          closedBy: ctx.staff?.name || "Admin",
          totalTickets: nonCancelledOrders.length,
          totalOrders: currentOrders.length,
          totalRevenue,
          totalCash,
          totalBank,
          totalKhata,
          totalDiscount,
          itemsSnapshot,
          ordersSnapshot,
        })
        .where(eq(ticketSessionLogs.ticketVersion, currentTicketVersion))
        .run();
    } else {
      db.insert(ticketSessionLogs)
        .values({
          ticketVersion: currentTicketVersion,
          shiftStatus: "closed",
          startDate: firstOrderTime,
          closedDate: nowIso,
          closedBy: ctx.staff?.name || "Admin",
          totalTickets: nonCancelledOrders.length,
          totalOrders: currentOrders.length,
          totalRevenue,
          totalCash,
          totalBank,
          totalKhata,
          totalDiscount,
          itemsSnapshot,
          ordersSnapshot,
          createdAt: nowIso,
        })
        .run();
    }

    // Increment ticketVersion by +1 and set shiftStatus back to "active"
    const nextTicketVersion = currentTicketVersion + 1;
    setShiftSessionState(db, nextTicketVersion, "active");

    return {
      success: true,
      closedVersion: currentTicketVersion,
      nextVersion: nextTicketVersion,
      totalRevenue,
      totalTickets: nonCancelledOrders.length,
    };
  }),

  // Get historical session archive logs
  getSessionLogs: adminProcedure.query(async () => {
    const db = getDb();
    return db
      .select()
      .from(ticketSessionLogs)
      .orderBy(desc(ticketSessionLogs.ticketVersion))
      .all();
  }),

  // Get single session archive log by version
  getSessionLogByVersion: adminProcedure
    .input(z.object({ ticketVersion: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const log = db
        .select()
        .from(ticketSessionLogs)
        .where(eq(ticketSessionLogs.ticketVersion, input.ticketVersion))
        .all()[0];
      if (!log) throw new TRPCError({ code: "NOT_FOUND", message: `Session log for version ${input.ticketVersion} not found` });
      return log;
    }),

  // Comprehensive Item-by-Item Sales & Unsold Report for any Session (Live or Historical)
  getSessionItemSalesReport: adminProcedure
    .input(z.object({ ticketVersion: z.number().optional() }))
    .query(async ({ input }) => {
      const db = getDb();
      const currentTicketVersion = getCurrentTicketVersion(db);
      const targetVersion = input.ticketVersion ?? currentTicketVersion;
      const isLive = targetVersion === currentTicketVersion;

      const allMenu = db.select().from(menuItems).all();
      const menuLookup = new Map<number, typeof allMenu[0]>();
      for (const m of allMenu) {
        menuLookup.set(m.id, m);
      }

      const allDepts = db.select().from(departments).all();
      const deptLookup = new Map<number, string>();
      for (const d of allDepts) {
        deptLookup.set(d.id, d.name);
      }

      // Initialize all items with 0 sales
      const itemsMap = new Map<string, {
        menuItemId?: number;
        name: string;
        departmentName: string;
        unitPrice: number;
        quantityOrdered: number;
        quantityServed: number;
        quantityCancelled: number;
        quantitySold: number;
        revenue: number;
        isSold: boolean;
      }>();

      for (const m of allMenu) {
        const deptName = m.departmentId ? deptLookup.get(m.departmentId) || "General" : "General";
        itemsMap.set(m.name, {
          menuItemId: m.id,
          name: m.name,
          departmentName: deptName,
          unitPrice: m.price,
          quantityOrdered: 0,
          quantityServed: 0,
          quantityCancelled: 0,
          quantitySold: 0,
          revenue: 0,
          isSold: false,
        });
      }

      let ordersAuditList: any[] = [];
      let totalOrdersCount = 0;
      let servedOrdersCount = 0;
      let cancelledOrdersCount = 0;
      let pendingOrdersCount = 0;

      // 1. Direct check in orders table for targetVersion (applies to both live and closed orders in DB)
      const directOrders = db
        .select()
        .from(orders)
        .where(eq(orders.ticketVersion, targetVersion))
        .all();

      if (directOrders.length > 0) {
        totalOrdersCount = directOrders.length;
        const allOrderIds = directOrders.map((o) => o.id);

        const allItems = allOrderIds.length > 0
          ? db.select().from(orderItems).where(inArray(orderItems.orderId, allOrderIds)).all()
          : [];

        const orderStatusMap = new Map<number, string>();
        for (const o of directOrders) {
          orderStatusMap.set(o.id, o.status);
          if (o.status === "cancelled") cancelledOrdersCount++;
          else if (o.status === "served" || o.status === "paid" || o.paymentStatus === "paid") servedOrdersCount++;
          else pendingOrdersCount++;
        }

        for (const it of allItems) {
          const menuItem = it.menuItemId ? menuLookup.get(it.menuItemId) : null;
          const name = it.nameSnapshot || menuItem?.name || (it.menuItemId ? `Item #${it.menuItemId}` : "Item");
          const unitPrice = it.unitPrice || menuItem?.price || 0;
          const deptName = menuItem?.departmentId ? deptLookup.get(menuItem.departmentId) || "General" : "General";

          const existing = itemsMap.get(name) || {
            menuItemId: it.menuItemId || undefined,
            name,
            departmentName: deptName,
            unitPrice,
            quantityOrdered: 0,
            quantityServed: 0,
            quantityCancelled: 0,
            quantitySold: 0,
            revenue: 0,
            isSold: false,
          };

          const ordStatus = (it.orderId ? orderStatusMap.get(it.orderId) : undefined) || "pending";
          const isCancelled = ordStatus === "cancelled" || ordStatus === "voided" || it.status === "cancelled";
          const isServed = ordStatus === "served" || ordStatus === "paid" || ordStatus === "completed" || it.kitchenStatus === "served" || it.status === "served";

          existing.quantityOrdered += it.quantity;

          if (isCancelled) {
            existing.quantityCancelled += it.quantity;
          } else if (isServed) {
            const soldUnits = (it.servedQty && it.servedQty > 0) ? it.servedQty : it.quantity;
            existing.quantityServed += soldUnits;
            existing.quantitySold += soldUnits;
            existing.revenue += (unitPrice * soldUnits);
            if (existing.quantitySold > 0) existing.isSold = true;
          } else {
            // Pending / In Kitchen (NOT served yet)
            const partialServed = it.servedQty || 0;
            if (partialServed > 0) {
              existing.quantityServed += partialServed;
              existing.quantitySold += partialServed;
              existing.revenue += (unitPrice * partialServed);
              if (existing.quantitySold > 0) existing.isSold = true;
            }
          }
          itemsMap.set(name, existing);
        }

        ordersAuditList = directOrders.map((ord) => {
          const ordItems = allItems.filter((it) => it.orderId === ord.id).map((it) => {
            const menuItem = it.menuItemId ? menuLookup.get(it.menuItemId) : null;
            const resolvedName = it.nameSnapshot || menuItem?.name || (it.menuItemId ? `Item #${it.menuItemId}` : "Item");
            const resolvedPrice = it.unitPrice || menuItem?.price || 0;
            return {
              ...it,
              nameSnapshot: resolvedName,
              name: resolvedName,
              unitPrice: resolvedPrice,
            };
          });

          const itemsSum = ordItems.reduce((acc, it) => acc + (it.unitPrice * it.quantity), 0);
          const computedTotal = (ord.total && ord.total > 0) ? ord.total : (ord.totalAmount && ord.totalAmount > 0 ? ord.totalAmount : itemsSum);

          return {
            ...ord,
            total: computedTotal,
            subtotal: ord.subtotal || computedTotal,
            items: ordItems,
          };
        });
      } else {
        // Fallback to archived log if orders were pruned or loaded from snapshot
        const log = db
          .select()
          .from(ticketSessionLogs)
          .where(eq(ticketSessionLogs.ticketVersion, targetVersion))
          .all()[0];

        if (log) {
          let parsedOrders: any[] = [];
          try {
            parsedOrders = JSON.parse(log.ordersSnapshot || "[]");
          } catch {}

          totalOrdersCount = parsedOrders.length || log.totalOrders;

          if (parsedOrders.length > 0) {
            ordersAuditList = parsedOrders.map((ord: any) => {
              const ordStatus = ord.status || "pending";
              if (ordStatus === "cancelled" || ordStatus === "voided") cancelledOrdersCount++;
              else if (ordStatus === "served" || ordStatus === "paid" || ordStatus === "completed" || ord.paymentStatus === "paid") servedOrdersCount++;
              else pendingOrdersCount++;

              let ordItems: any[] = [];
              if (Array.isArray(ord.items)) {
                ordItems = ord.items.map((it: any) => {
                  const menuItem = it.menuItemId ? menuLookup.get(it.menuItemId) : null;
                  const resolvedName = it.nameSnapshot || it.name || menuItem?.name || (it.menuItemId ? `Item #${it.menuItemId}` : "Item");
                  const resolvedPrice = it.unitPrice || menuItem?.price || 0;
                  return {
                    ...it,
                    nameSnapshot: resolvedName,
                    name: resolvedName,
                    unitPrice: resolvedPrice,
                  };
                });
              }

              const itemsSum = ordItems.reduce((acc, it) => acc + (it.unitPrice * (Number(it.quantity) || 1)), 0);
              const computedTotal = (ord.total && ord.total > 0) ? ord.total : (ord.totalAmount && ord.totalAmount > 0 ? ord.totalAmount : itemsSum);

              // Update item sales aggregate
              for (const it of ordItems) {
                const name = it.name || "Item";
                const unitPrice = it.unitPrice || 0;
                const existing = itemsMap.get(name) || {
                  menuItemId: it.menuItemId || undefined,
                  name,
                  departmentName: "General",
                  unitPrice,
                  quantityOrdered: 0,
                  quantityServed: 0,
                  quantityCancelled: 0,
                  quantitySold: 0,
                  revenue: 0,
                  isSold: false,
                };

                const isCancelled = ordStatus === "cancelled" || ordStatus === "voided" || it.status === "cancelled";
                const isServed = ordStatus === "served" || ordStatus === "paid" || ordStatus === "completed" || ord.paymentStatus === "paid" || it.kitchenStatus === "served" || it.status === "served";

                existing.quantityOrdered += (Number(it.quantity) || 0);
                if (isCancelled) {
                  existing.quantityCancelled += (Number(it.quantity) || 0);
                } else if (isServed) {
                  const soldUnits = (Number(it.servedQty) > 0) ? Number(it.servedQty) : (Number(it.quantity) || 0);
                  existing.quantityServed += soldUnits;
                  existing.quantitySold += soldUnits;
                  existing.revenue += (unitPrice * soldUnits);
                  if (existing.quantitySold > 0) existing.isSold = true;
                } else {
                  // Pending / In Kitchen (NOT served yet)
                  const partialServed = Number(it.servedQty) || 0;
                  if (partialServed > 0) {
                    existing.quantityServed += partialServed;
                    existing.quantitySold += partialServed;
                    existing.revenue += (unitPrice * partialServed);
                    if (existing.quantitySold > 0) existing.isSold = true;
                  }
                }
                itemsMap.set(name, existing);
              }

              return {
                ...ord,
                total: computedTotal,
                items: ordItems,
              };
            });
          } else {
            let parsedItems: any[] = [];
            try {
              parsedItems = JSON.parse(log.itemsSnapshot || "[]");
            } catch {}

            for (const it of parsedItems) {
              const name = it.name || "Item";
              const existing = itemsMap.get(name) || {
                menuItemId: it.menuItemId || undefined,
                name,
                departmentName: it.departmentName || "General",
                unitPrice: it.unitPrice || 0,
                quantityOrdered: 0,
                quantityServed: 0,
                quantityCancelled: 0,
                quantitySold: 0,
                revenue: 0,
                isSold: false,
              };
              const soldUnits = (Number(it.quantity) || Number(it.quantitySold) || 0);
              existing.quantityOrdered += (Number(it.quantityOrdered) || soldUnits);
              existing.quantityServed += (Number(it.quantityServed) || soldUnits);
              existing.quantitySold += soldUnits;
              existing.revenue += (Number(it.total) || Number(it.revenue) || 0);
              if (existing.quantitySold > 0) existing.isSold = true;
              itemsMap.set(name, existing);
            }
          }
        }
      }

      const allItemsList = Array.from(itemsMap.values()).sort((a, b) => {
        if (a.isSold && !b.isSold) return -1;
        if (!a.isSold && b.isSold) return 1;
        if (a.isSold && b.isSold) return b.quantitySold - a.quantitySold;
        return a.name.localeCompare(b.name);
      });

      const soldItems = allItemsList.filter((i) => i.isSold);
      const unsoldItems = allItemsList.filter((i) => !i.isSold);
      const totalRevenue = soldItems.reduce((acc, i) => acc + i.revenue, 0);
      const totalQuantitySold = soldItems.reduce((acc, i) => acc + i.quantitySold, 0);

      return {
        ticketVersion: targetVersion,
        isLive,
        totalRevenue,
        totalQuantitySold,
        totalMenuItems: allItemsList.length,
        soldCount: soldItems.length,
        unsoldCount: unsoldItems.length,
        totalOrdersCount,
        servedOrdersCount,
        cancelledOrdersCount,
        pendingOrdersCount,
        items: allItemsList,
        ordersAudit: ordersAuditList,
      };
    }),

  // ── Counter Management (Create, Edit, Delete, List) ──────────────────────
  listCounters: adminProcedure.query(async () => {
    const db = getDb();
    return db.select().from(counters).orderBy(counters.id).all();
  }),

  createCounter: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        code: z.string().optional(),
        description: z.string().optional(),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const existing = db
        .select()
        .from(counters)
        .where(eq(counters.name, input.name.trim()))
        .all()[0];
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A counter with this name already exists",
        });
      }
      const nowIso = new Date().toISOString();
      const inserted = db
        .insert(counters)
        .values({
          name: input.name.trim(),
          code: input.code?.trim() || null,
          description: input.description?.trim() || null,
          isActive: input.isActive ?? true,
          createdAt: nowIso,
          updatedAt: nowIso,
        })
        .returning()
        .all()[0];
      return { success: true, counter: inserted };
    }),

  updateCounter: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1),
        code: z.string().optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const existing = db
        .select()
        .from(counters)
        .where(eq(counters.id, input.id))
        .all()[0];
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Counter not found" });
      }

      const oldName = existing.name;
      const newName = input.name.trim();

      // If renaming, check conflict
      if (oldName !== newName) {
        const conflict = db
          .select()
          .from(counters)
          .where(eq(counters.name, newName))
          .all()[0];
        if (conflict) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A counter with this name already exists",
          });
        }
      }

      const nowIso = new Date().toISOString();
      db.update(counters)
        .set({
          name: newName,
          code: input.code?.trim() || null,
          description: input.description?.trim() || null,
          isActive: input.isActive ?? existing.isActive,
          updatedAt: nowIso,
        })
        .where(eq(counters.id, input.id))
        .run();

      // If renamed, update staff stationName & orders counterName
      if (oldName !== newName) {
        db.update(staff)
          .set({ stationName: newName, updatedAt: nowIso })
          .where(eq(staff.stationName, oldName))
          .run();
        db.update(orders)
          .set({ counterName: newName, updatedAt: nowIso })
          .where(eq(orders.counterName, oldName))
          .run();
      }
      return { success: true };
    }),

  deleteCounter: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const existing = db
        .select()
        .from(counters)
        .where(eq(counters.id, input.id))
        .all()[0];
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Counter not found" });
      }
      const nowIso = new Date().toISOString();
      // Detach staff from deleted counter
      db.update(staff)
        .set({ stationName: null, updatedAt: nowIso })
        .where(eq(staff.stationName, existing.name))
        .run();

      db.delete(counters).where(eq(counters.id, input.id)).run();
      return { success: true };
    }),
});
