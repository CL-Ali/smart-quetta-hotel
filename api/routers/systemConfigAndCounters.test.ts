import { describe, expect, it } from "vitest";
import { appRouter } from "./index";
import type { TrpcContext } from "../lib/context";

describe("System Configuration & Multi-Counter Breakdown API", () => {
  const adminCtx: TrpcContext = {
    staff: {
      staffId: 1,
      name: "Super Admin",
      email: "admin",
      role: "admin",
      allowedIp: null,
      stationName: null,
      assignedCashierId: null,
    },
    req: {} as any,
    res: {} as any,
  };

  const cashier1Ctx: TrpcContext = {
    staff: {
      staffId: 2,
      name: "Cashier Counter 1",
      email: "cashier1",
      role: "cashier",
      allowedIp: null,
      stationName: "Counter 1",
      assignedCashierId: null,
    },
    req: {} as any,
    res: {} as any,
  };

  const cashier2Ctx: TrpcContext = {
    staff: {
      staffId: 3,
      name: "Cashier Counter 2",
      email: "cashier2",
      role: "cashier",
      allowedIp: null,
      stationName: "Counter 2",
      assignedCashierId: null,
    },
    req: {} as any,
    res: {} as any,
  };

  const caller = appRouter.createCaller(adminCtx);
  const callerCashier1 = appRouter.createCaller(cashier1Ctx);
  const callerCashier2 = appRouter.createCaller(cashier2Ctx);

  it("fetches and updates hotel system operation mode config", async () => {
    // 1. Fetch system config
    const config = await caller.admin.getSystemConfig();
    expect(config).toBeDefined();
    expect(config.operationMode).toBeDefined();

    // 2. Update to segregated mode
    const updatedSeg = await caller.admin.updateSystemConfig({ operationMode: "segregated" });
    expect(updatedSeg.success).toBe(true);
    expect(updatedSeg.operationMode).toBe("segregated");

    // 3. Update back to unified mode
    const updatedUni = await caller.admin.updateSystemConfig({ operationMode: "unified" });
    expect(updatedUni.success).toBe(true);
    expect(updatedUni.operationMode).toBe("unified");
  });

  it("calculates accounts overview with multi-counter ledger breakdown", async () => {
    const overview = await caller.admin.getAccountsOverview();
    expect(overview).toBeDefined();
    expect(overview.financials.totalRevenue).toBeGreaterThanOrEqual(0);
    expect(overview.countersBreakdown).toBeDefined();
    expect(Array.isArray(overview.countersBreakdown)).toBe(true);
  });

  it("lists staff with associated counter and assigned cashier data", async () => {
    const staffList = await caller.admin.listStaff();
    expect(Array.isArray(staffList)).toBe(true);
    expect(staffList.length).toBeGreaterThan(0);

    const cashiers = staffList.filter((s) => s.role === "cashier");
    const waiters = staffList.filter((s) => s.role === "waiter");

    expect(cashiers.length).toBeGreaterThan(0);
    expect(waiters.length).toBeGreaterThan(0);

    // Verify waiters have assigned cashier structure
    for (const waiter of waiters) {
      expect(waiter).toHaveProperty("assignedCashierId");
      expect(waiter).toHaveProperty("assignedCashierName");
    }
  });

  it("assigns single or multiple in-charge cashiers to a counter station", async () => {
    const staffList = await caller.admin.listStaff();
    const cashiers = staffList.filter((s) => s.role === "cashier");
    if (cashiers.length > 0) {
      const cashierId = cashiers[0].id;
      const res = await caller.admin.assignCounterCashiers({
        counterName: "Counter 2 - Outdoor Register",
        cashierIds: [cashierId],
      });
      expect(res.success).toBe(true);

      const updatedList = await caller.admin.listStaff();
      const updatedCashier = updatedList.find((s) => s.id === cashierId);
      expect(updatedCashier?.stationName).toBe("Counter 2 - Outdoor Register");

      // Reset back
      await caller.admin.assignCounterCashiers({
        counterName: "Counter 1",
        cashierIds: [cashierId],
      });
    }
  });

  it("properly segregates orders and cash reports per station in segregated mode", async () => {
    // 1. Switch to segregated mode
    await caller.admin.updateSystemConfig({ operationMode: "segregated" });

    // 2. Create order on Counter 1
    const order1 = await callerCashier1.hotel.placeOrder({
      customerName: "Counter 1 Guest",
      counterName: "Counter 1",
      items: [{ menuItemId: 1, quantity: 2, unitPrice: 50 }],
    });
    expect(order1.success).toBe(true);

    // 3. Create order on Counter 2
    const order2 = await callerCashier2.hotel.placeOrder({
      customerName: "Counter 2 Guest",
      counterName: "Counter 2",
      items: [{ menuItemId: 1, quantity: 1, unitPrice: 50 }],
    });
    expect(order2.success).toBe(true);

    // 4. In segregated mode, Cashier 1 should see only Counter 1 orders
    const cashier1Orders = await callerCashier1.hotel.getOrders();
    const hasOrder1 = cashier1Orders.some((o) => o.id === order1.orderId);
    const hasOrder2 = cashier1Orders.some((o) => o.id === order2.orderId);
    expect(hasOrder1).toBe(true);
    expect(hasOrder2).toBe(false);

    // 5. In segregated mode, Cashier 2 should see only Counter 2 orders
    const cashier2Orders = await callerCashier2.hotel.getOrders();
    const c2HasOrder1 = cashier2Orders.some((o) => o.id === order1.orderId);
    const c2HasOrder2 = cashier2Orders.some((o) => o.id === order2.orderId);
    expect(c2HasOrder1).toBe(false);
    expect(c2HasOrder2).toBe(true);

    // 6. Admin sees all orders
    const adminOrders = await caller.hotel.getOrders();
    expect(adminOrders.some((o) => o.id === order1.orderId)).toBe(true);
    expect(adminOrders.some((o) => o.id === order2.orderId)).toBe(true);

    // 7. Test Cashier 1 Cash Report
    const cashReport1 = await callerCashier1.hotel.getCashReport();
    expect(cashReport1.stationName).toBe("Counter 1");
    expect(cashReport1.operationMode).toBe("segregated");
  });
});
