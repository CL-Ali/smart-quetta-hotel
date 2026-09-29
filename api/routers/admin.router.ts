import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, desc, ne, and } from "drizzle-orm";
import { adminProcedure, router } from "../lib/trpc";
import { getDb } from "../db";
import { staff, orders, payments, shopkeepers, invoices, systemSettings } from "../db/schema";
import { hashPassword } from "../lib/auth";

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

    return {
      operationMode: (modeRow?.value as "unified" | "segregated") || "unified",
      showCustomerQueue: queueRow ? queueRow.value === "true" : true,
    };
  }),

  updateSystemConfig: adminProcedure
    .input(
      z.object({
        operationMode: z.enum(["unified", "segregated"]).optional(),
        showCustomerQueue: z.boolean().optional(),
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

      return {
        success: true,
        operationMode: input.operationMode,
        showCustomerQueue: input.showCustomerQueue,
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

    // Ensure default Counter 1 exists in map
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
});
