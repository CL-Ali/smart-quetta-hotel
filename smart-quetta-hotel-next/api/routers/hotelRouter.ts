import { publicProcedure, dashboardProcedure, staffProcedure, router } from "../lib/trpc";
import { getDb } from "../db";
import {
  departments,
  menuItems,
  seatingAreas,
  orders,
  orderItems,
  inventory,
  stock,
  customers,
  payments,
  shopkeepers,
  tickets,
  visits,
  staff,
  systemSettings,
} from "../db/schema";
import { eq, desc, asc, ne, inArray } from "drizzle-orm";
import { z } from "zod";
import {
  calculateSubtotal,
  findOrderById,
  listOrderItemsWithMenuForOrder,
  settleBalance,
} from "../lib/domain";
import { getIo, SOCKET_EVENT } from "../lib/socket";
import { getCurrentTicketVersion } from "../lib/ticketVersion";

export const hotelRouter = router({
  // ── Public System Configuration (Queue visibility, allowed languages, etc.) ───────────────────
  getSystemConfig: publicProcedure.query(async () => {
    const db = getDb();
    const queueRow = db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, "showCustomerQueue"))
      .all()[0];
    const modeRow = db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, "operationMode"))
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
      showCustomerQueue: queueRow ? queueRow.value === "true" : true,
      operationMode: (modeRow?.value as "unified" | "segregated") || "unified",
      allowedLanguages,
      defaultLanguage: defaultLangRow?.value || "ur",
      soundEnabled: soundRow ? soundRow.value === "true" : true,
      defaultPosAccess: posAccessRow ? posAccessRow.value === "true" : true,
    };
  }),

  // ── Departments Query ──────────────────────────────────────────────────────
  getDepartments: publicProcedure.query(async () => {
    const db = getDb();
    return db.select().from(departments).orderBy(asc(departments.id)).all();
  }),

  // ── Tickets Query (Multi-Ticket per Guest / Visit) ──────────────────────────
  getTickets: publicProcedure
    .input(
      z
        .object({
          guestId: z.number().optional(),
          visitId: z.number().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      if (input?.guestId) {
        return db
          .select()
          .from(tickets)
          .where(eq(tickets.guestId, input.guestId))
          .orderBy(desc(tickets.createdAt))
          .all();
      }
      if (input?.visitId) {
        return db
          .select()
          .from(tickets)
          .where(eq(tickets.visitId, input.visitId))
          .orderBy(desc(tickets.createdAt))
          .all();
      }
      return db.select().from(tickets).orderBy(desc(tickets.createdAt)).all();
    }),

  // ── Shopkeepers & Regular Accounts ─────────────────────────────────────────
  getShopkeepers: publicProcedure.query(async () => {
    const db = getDb();
    return db.select().from(shopkeepers).orderBy(desc(shopkeepers.createdAt)).all();
  }),

  createShopkeeper: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        shopName: z.string().min(1),
        shopNumber: z.string().optional(),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = db
        .insert(shopkeepers)
        .values({
          name: input.name,
          shopName: input.shopName,
          shopNumber: input.shopNumber ?? null,
          phone: input.phone ?? null,
        })
        .run();
      return { id: Number(result.lastInsertRowid), ...input, balance: 0 };
    }),
  // ── Menu ────────────────────────────────────────────────────────────────────
  getMenu: publicProcedure.query(async () => {
    const db = getDb();
    return db
      .select()
      .from(menuItems)
      .where(eq(menuItems.isAvailable, true))
      .all();
  }),

  // ── Seating ─────────────────────────────────────────────────────────────────
  getSeatingAreas: publicProcedure.query(async () => {
    const db = getDb();
    return db.select().from(seatingAreas).all();
  }),

  getSeatingTables: publicProcedure.query(async () => {
    const db = getDb();
    const areas = db.select().from(seatingAreas).all();
    const activeOrders = db
      .select({
        id: orders.id,
        orderNo: orders.orderNo,
        customerName: orders.customerName,
        seatingNo: orders.seatingNo,
        seatingAreaId: orders.seatingAreaId,
        seatingType: orders.seatingType,
        totalAmount: orders.totalAmount,
        paidAmount: orders.paidAmount,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
      })
      .from(orders)
      .where(ne(orders.status, "paid"))
      .all()
      .filter((o) => o.status !== "cancelled");

    return areas.map((area) => {
      const activeOrder = activeOrders.find(
        (o) =>
          o.seatingAreaId === area.id ||
          (o.seatingNo && o.seatingNo.trim().toLowerCase() === area.name.trim().toLowerCase())
      );
      return {
        id: area.id,
        name: area.name,
        type: area.type || "indoor",
        capacity: area.capacity ?? 4,
        qrCodeIdentifier: area.qrCodeIdentifier,
        isOccupied: Boolean(activeOrder),
        activeOrder: activeOrder || null,
      };
    });
  }),

  // ── Customers ───────────────────────────────────────────────────────────────
  getOrCreateCustomer: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        phone: z.string().optional(),
        email: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      let existing = db
        .select()
        .from(customers)
        .where(eq(customers.name, input.name))
        .all();

      if (existing.length === 0 && input.phone) {
        existing = db
          .select()
          .from(customers)
          .where(eq(customers.phone, input.phone))
          .all();
      }

      if (existing.length > 0) {
        if (input.phone && existing[0].phone !== input.phone) {
          db.update(customers)
            .set({ phone: input.phone })
            .where(eq(customers.id, existing[0].id))
            .run();
        }
        return { ...existing[0], phone: input.phone || existing[0].phone };
      }

      const result = db
        .insert(customers)
        .values({
          name: input.name,
          phone: input.phone ?? null,
          email: input.email ?? null,
        })
        .run();

      return { id: Number(result.lastInsertRowid), name: input.name, phone: input.phone };
    }),

  // ── Customer order history ───────────────────────────────────────────────────
  getCustomerOrders: publicProcedure
    .input(z.object({ customerName: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const customerOrders = db
        .select()
        .from(orders)
        .where(eq(orders.customerName, input.customerName))
        .orderBy(desc(orders.createdAt))
        .all();

      return Promise.all(
        customerOrders.map(async order => {
          const items = listOrderItemsWithMenuForOrder(db, order.id).map(
            item => ({
              id: item.id,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              name: item.name,
              departmentId: item.departmentId,
              imageUrl: item.imageUrl,
              status: item.kitchenStatus || "pending",
              kitchenStatus: item.kitchenStatus || "pending",
              servedQty: item.servedQty || 0,
            })
          );
          return { ...order, items };
        })
      );
    }),

  // ── Public Live Kitchen Queue (Today's Active Non-Served Orders in Ascending Order) ──
  getLiveKitchenQueueToday: publicProcedure.query(async () => {
    const db = getDb();
    const queueRow = db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, "showCustomerQueue"))
      .all()[0];
    const showCustomerQueue = queueRow ? queueRow.value === "true" : true;
    if (!showCustomerQueue) {
      return [];
    }

    const activeOrders = db
      .select()
      .from(orders)
      .where(ne(orders.status, "served"))
      .orderBy(asc(orders.id))
      .all();

    const nowMs = Date.now();
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;

    const todayOrders = activeOrders.filter((order) => {
      if (order.status === "cancelled" || order.status === "served") return false;
      if (!order.createdAt) return true;
      try {
        const orderTime = new Date(order.createdAt).getTime();
        if (isNaN(orderTime)) return true;
        // Keep active orders within the last 24 hours
        return (nowMs - orderTime) <= twentyFourHoursMs;
      } catch {
        return true;
      }
    });

    return todayOrders
      .map((order) => {
        const items = listOrderItemsWithMenuForOrder(db, order.id)
          .filter((item) => {
            const st = item.kitchenStatus || "pending";
            return st !== "served" && st !== "cancelled";
          })
          .map((item) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            departmentId: item.departmentId,
            imageUrl: item.imageUrl,
            kitchenStatus: item.kitchenStatus || "pending",
          }));
        return {
          id: order.id,
          orderNo: order.orderNo,
          ticketNo: order.orderNo || `TKT-${order.id}`,
          customerName: order.customerName,
          seatingNo: order.seatingNo,
          seatingType: order.seatingType,
          status: order.status,
          createdAt: order.createdAt,
          items,
        };
      })
      .filter((o) => o.items.length > 0);
  }),

  // ── Place order ─────────────────────────────────────────────────────────────
  placeOrder: publicProcedure
    .input(
      z.object({
        seatingAreaId: z.number().optional(),
        customerName: z.string(),
        customerId: z.number().optional(),
        // Link order to a Visit when available
        visitId: z.number().optional(),
        seatingNo: z.string().optional(),
        peopleCount: z.number().optional(),
        seatingType: z.string().optional(),
        counterName: z.string().optional(),
        remarks: z.string().optional(),
        items: z.array(
          z.object({
            menuItemId: z.number(),
            quantity: z.number(),
            unitPrice: z.number(),
            remarks: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const totalAmount = calculateSubtotal(input.items);

      let resolvedSeatingNo = input.seatingNo ?? null;
      let resolvedPeopleCount = input.peopleCount ?? 1;
      let resolvedSeatingType = input.seatingType ?? (resolvedPeopleCount > 1 ? "table" : "seat");
      let resolvedGuestId = 1;

      const cashierId = ctx.staff?.staffId ?? null;
      const cashierName = ctx.staff?.name ?? null;
      let counterName =
        input.counterName?.trim() || ctx.staff?.stationName?.trim() || "Counter 1";
      if (counterName === "Main Cashier Counter") counterName = "Counter 1";

      if (input.visitId) {
        const v = db
          .select({
            guestId: visits.guestId,
            seatingNo: visits.seatingNo,
            peopleCount: visits.peopleCount,
            seatingType: visits.seatingType,
          })
          .from(visits)
          .where(eq(visits.id, input.visitId))
          .all()[0];
        if (v) {
          resolvedGuestId = v.guestId;
          resolvedSeatingNo = resolvedSeatingNo || v.seatingNo;
          resolvedPeopleCount = v.peopleCount || resolvedPeopleCount;
          resolvedSeatingType = v.seatingType || resolvedSeatingType;
        }
      }

      let validCustomerId: number | null = null;
      if (input.customerId) {
        const exists = db
          .select({ id: customers.id })
          .from(customers)
          .where(eq(customers.id, input.customerId))
          .all();
        validCustomerId = exists.length > 0 ? input.customerId : null;
      }

      const activeTicketVersion = getCurrentTicketVersion(db);

      const result = db
        .insert(orders)
        .values({
          ticketVersion: activeTicketVersion,
          customerId: validCustomerId,
          seatingAreaId: input.seatingAreaId ?? null,
          customerName: input.customerName,
          seatingNo: resolvedSeatingNo,
          peopleCount: resolvedPeopleCount,
          seatingType: resolvedSeatingType,
          visitId: input.visitId ?? null,
          cashierId,
          cashierName,
          counterName,
          totalAmount,
          status: "pending",
          paymentStatus: "unpaid",
          paymentMethod: "pending",
          paidAmount: 0,
          remarks: input.remarks ?? null,
        })
        .run();
      const orderId = Number(result.lastInsertRowid);
      const ticketNo = `TKT-${String(orderId).padStart(3, "0")}`;
      db.update(orders).set({ orderNo: ticketNo }).where(eq(orders.id, orderId)).run();

      // Insert into tickets table for guest multi-ticket tracking
      try {
        db.insert(tickets)
          .values({
            ticketNo,
            ticketVersion: activeTicketVersion,
            guestId: resolvedGuestId,
            orderId,
            visitId: input.visitId ?? null,
            seatingNo: resolvedSeatingNo,
            seatingType: resolvedSeatingType,
            status: "active",
          })
          .run();
      } catch (_) {}

      for (const item of input.items) {
        const menuItem = db
          .select({ id: menuItems.id })
          .from(menuItems)
          .where(eq(menuItems.id, item.menuItemId))
          .all();
        if (menuItem.length === 0) continue;

        db.insert(orderItems)
          .values({
            orderId,
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            remarks: item.remarks ?? input.remarks ?? null,
          })
          .run();
      }

      getIo()?.emit(SOCKET_EVENT.OrderCreated, {
        orderId,
        orderNo: ticketNo,
        customerName: input.customerName,
        seatingNo: resolvedSeatingNo,
        tableNo: resolvedSeatingNo,
        peopleCount: resolvedPeopleCount,
        seatingType: resolvedSeatingType,
        visitId: input.visitId ?? null,
        counterName,
        cashierName,
        cashierId,
      });
      return { success: true, orderId, orderNo: ticketNo, ticketNo, counterName };
    }),

  // ── All orders (kitchen / waiter / dashboard) ────────────────────────────────
  getOrders: staffProcedure
    .input(
      z
        .object({
          ticketVersion: z.number().optional(),
          allHistory: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const currentTicketVersion = getCurrentTicketVersion(db);

      let allOrders = db
        .select()
        .from(orders)
        .orderBy(desc(orders.createdAt))
        .all();

      // Version filter: default to current live ticketVersion unless allHistory is requested
      if (!input?.allHistory) {
        const targetVersion = input?.ticketVersion ?? currentTicketVersion;
        allOrders = allOrders.filter((o) => o.ticketVersion === targetVersion);
      }

    // Check operation mode
    const modeRow = db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, "operationMode"))
      .all()[0];
    const operationMode = modeRow?.value || "unified";

    // Strict Segregation Mode Filter
    if (operationMode === "segregated") {
      if (ctx.staff?.role === "cashier") {
        const station = (ctx.staff.stationName || (ctx.staff.name?.toLowerCase().includes("counter") ? ctx.staff.name : "")).trim().toLowerCase();
        const cashierId = ctx.staff.staffId;
        allOrders = allOrders.filter((o) => {
          const rawCounter = (o.counterName === "Main Cashier Counter" ? "Counter 1" : o.counterName || "Counter 1").trim().toLowerCase();
          if (station && (rawCounter === station || station.includes(rawCounter) || rawCounter.includes(station))) return true;
          if (cashierId && o.cashierId === cashierId) return true;
          return false;
        });
      } else if (ctx.staff?.role === "waiter" || ctx.staff?.role === "kitchen") {
        const targetCashierIds: number[] =
          ctx.staff.assignedCashierIds && ctx.staff.assignedCashierIds.length > 0
            ? ctx.staff.assignedCashierIds
            : [];

        if (targetCashierIds.length > 0) {
          const assignedCashiers = db
            .select()
            .from(staff)
            .where(inArray(staff.id, targetCashierIds))
            .all();

          const allowedStationNames = new Set(
            assignedCashiers
              .map((c) => (c.stationName || c.name || "").trim().toLowerCase())
              .filter(Boolean)
          );
          const allowedCashierIds = new Set(targetCashierIds);

          allOrders = allOrders.filter((o) => {
            if (o.cashierId && allowedCashierIds.has(o.cashierId)) return true;
            const rawCounter = (o.counterName === "Main Cashier Counter" ? "Counter 1" : o.counterName || "Counter 1").trim().toLowerCase();
            for (const station of allowedStationNames) {
              if (rawCounter === station || station.includes(rawCounter) || rawCounter.includes(station)) {
                return true;
              }
            }
            return false;
          });
        } else if (ctx.staff.role === "waiter" && ctx.staff.stationName) {
          const waiterStation = ctx.staff.stationName.trim().toLowerCase();
          allOrders = allOrders.filter((o) => {
            const rawCounter = (o.counterName === "Main Cashier Counter" ? "Counter 1" : o.counterName || "Counter 1").trim().toLowerCase();
            return rawCounter === waiterStation || waiterStation.includes(rawCounter) || rawCounter.includes(waiterStation);
          });
        }
      }
    }

    // Kitchen Department Strict Segregation (Chai section gets only chai, Paratha section gets only parathas)
    const isKitchenDeptRestricted =
      ctx.staff?.role === "kitchen" &&
      Boolean(ctx.staff.stationName) &&
      !ctx.staff.stationName?.includes("All Departments") &&
      !ctx.staff.stationName?.includes("Main Kitchen") &&
      !ctx.staff.stationName?.includes("127.0.0.1");

    let targetKitchenDept = isKitchenDeptRestricted
      ? (ctx.staff?.stationName || "").trim().toLowerCase()
      : null;

    return allOrders
      .map(order => {
        let items = listOrderItemsWithMenuForOrder(db, order.id);

        if (targetKitchenDept) {
          const allDepts = db.select().from(departments).all();
          const targetDeptObj = allDepts.find(
            (d) =>
              d.name.toLowerCase() === targetKitchenDept ||
              String(d.id) === targetKitchenDept
          );

          items = items.filter((item) => {
            if (targetDeptObj && item.departmentId === targetDeptObj.id) return true;
            return false;
          });
        }

        return { order, items };
      })
      .filter(({ items }) => !targetKitchenDept || items.length > 0)
      .map(({ order, items }) => {

      let seatingNo = order.seatingNo;
      let peopleCount = order.peopleCount ?? 1;
      let seatingType = order.seatingType ?? (peopleCount > 1 ? "table" : "seat");

      if (!seatingNo && order.visitId) {
        const v = db
          .select({ seatingNo: visits.seatingNo, peopleCount: visits.peopleCount, seatingType: visits.seatingType })
          .from(visits)
          .where(eq(visits.id, order.visitId))
          .all()[0];
        if (v) {
          seatingNo = v.seatingNo;
          peopleCount = v.peopleCount || peopleCount;
          seatingType = v.seatingType || seatingType;
        }
      }

      const servedAmount = calculateSubtotal(
        items.map(item => ({
          quantity: item.servedQty ?? 0,
          unitPrice: item.unitPrice,
        }))
      );

      const paymentHistory = db
        .select({
          id: payments.id,
          amount: payments.amount,
          method: payments.method,
          transactionId: payments.transactionId,
          createdAt: payments.createdAt,
        })
        .from(payments)
        .where(eq(payments.orderId, order.id))
        .all()
        .filter(p => (p as any).status !== "failed");

      const resolvedCounter =
        order.counterName === "Main Cashier Counter" || !order.counterName
          ? "Counter 1"
          : order.counterName;

      return {
        ...order,
        counterName: resolvedCounter,
        cashierName: order.cashierName || "Cashier",
        cashierId: order.cashierId,
        seatingNo,
        peopleCount,
        seatingType,
        items,
        servedAmount,
        paymentHistory,
      };
    });
  }),

  // ── Update item kitchen status ───────────────────────────────────────────────
  updateItemStatus: dashboardProcedure
    .input(
      z.object({
        itemId: z.number(),
        kitchenStatus: z.enum(["pending", "preparing", "ready", "served"]),
        serveQty: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const rows = db
        .select()
        .from(orderItems)
        .where(eq(orderItems.id, input.itemId))
        .all();
      if (rows.length === 0) throw new Error("Item not found");
      const item = rows[0];

      let newServedQty = item.servedQty ?? 0;
      if (input.kitchenStatus === "served") {
        const adding = input.serveQty ?? item.quantity - newServedQty;
        newServedQty = Math.min(item.quantity, newServedQty + adding);
      }

      const finalStatus =
        input.kitchenStatus === "served" && newServedQty < item.quantity
          ? "ready"
          : input.kitchenStatus;

      db.update(orderItems)
        .set({ kitchenStatus: finalStatus, servedQty: newServedQty })
        .where(eq(orderItems.id, input.itemId))
        .run();

      const orderId = item.orderId!;
      const allItems = db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId))
        .all();

      const allServed = allItems.every(i => (i.servedQty ?? 0) >= i.quantity);
      const anyReady = allItems.some(i => i.kitchenStatus === "ready");
      const anyPreparing = allItems.some(i => i.kitchenStatus === "preparing");
      const anyPending = allItems.some(
        i => i.kitchenStatus === "pending" && (i.servedQty ?? 0) < i.quantity
      );

      const orderRow = db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .all()[0];
      let newOrderStatus = orderRow?.status ?? "pending";

      if (allServed) newOrderStatus = "served";
      else if (anyReady) newOrderStatus = "ready";
      else if (anyPreparing) newOrderStatus = "preparing";
      else if (anyPending) newOrderStatus = "pending";

      const updatedItems = db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId))
        .all();
      const servedAmount = calculateSubtotal(
        updatedItems.map(item => ({
          quantity: item.servedQty ?? 0,
          unitPrice: item.unitPrice,
        }))
      );

      const orderRow2 = db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .all()[0];
      const paidSoFar = orderRow2?.paidAmount ?? 0;

      const newPaymentStatus =
        paidSoFar <= 0
          ? "unpaid"
          : paidSoFar >= servedAmount
            ? "paid"
            : "partial";

      const finalOrderStatus =
        newPaymentStatus === "paid" && newOrderStatus === "served"
          ? "paid"
          : newOrderStatus;

      db.update(orders)
        .set({
          status: finalOrderStatus,
          totalAmount: servedAmount,
          paymentStatus: newPaymentStatus,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(orders.id, orderId))
        .run();

      // Emit the most specific event for this status transition.
      // kitchen.ready fires when any item reaches ready; order.updated covers all other transitions.
      const socketEvent = finalStatus === "ready"
        ? SOCKET_EVENT.OrderReady
        : SOCKET_EVENT.OrderServed;
      getIo()?.emit(socketEvent, {
        itemId: input.itemId,
        orderId,
        kitchenStatus: finalStatus,
      });

      return { success: true, newServedQty, finalStatus, newOrderStatus };
    }),

  // ── Cancel a single item before cooking starts (pending status only) ─────────
  cancelOrderItem: publicProcedure
    .input(
      z.object({
        itemId: z.number(),
        orderId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const rows = db
        .select()
        .from(orderItems)
        .where(eq(orderItems.id, input.itemId))
        .all();

      if (rows.length === 0) throw new Error("Item not found");
      const item = rows[0];

      if (item.kitchenStatus === "served" || item.kitchenStatus === "cancelled") {
        throw new Error("Item is already served or cancelled and cannot be cancelled");
      }

      // Mark this item as cancelled
      db.update(orderItems)
        .set({ kitchenStatus: "cancelled" })
        .where(eq(orderItems.id, input.itemId))
        .run();

      const allItems = db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, input.orderId))
        .all();

      const nonCancelledItems = allItems.filter((i) => i.kitchenStatus !== "cancelled");

      if (nonCancelledItems.length === 0) {
        // All items cancelled -> cancel whole order
        db.update(orders)
          .set({
            status: "cancelled",
            totalAmount: 0,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(orders.id, input.orderId))
          .run();
      } else {
        // Recalculate order total from remaining active items
        const newTotal = nonCancelledItems.reduce(
          (sum, i) => sum + (i.unitPrice * i.quantity),
          0
        );
        db.update(orders)
          .set({
            totalAmount: newTotal,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(orders.id, input.orderId))
          .run();
      }

      // Emit real-time WebSocket events for kitchen & customer sync
      getIo()?.emit("kitchen:item:updated", {
        itemId: input.itemId,
        orderId: input.orderId,
        kitchenStatus: "cancelled",
      });
      getIo()?.emit("order.updated", {
        orderId: input.orderId,
        itemId: input.itemId,
      });

      return { success: true };
    }),

  // ── Update order status ──────────────────────────────────────────────────────
  updateOrderStatus: dashboardProcedure
    .input(z.object({ orderId: z.number(), status: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      db.update(orders)
        .set({ status: input.status, updatedAt: new Date().toISOString() })
        .where(eq(orders.id, input.orderId))
        .run();

      getIo()?.emit(SOCKET_EVENT.OrderAccepted, {
        orderId: input.orderId,
        status: input.status,
      });
      return { success: true };
    }),

  // ── Record payment ───────────────────────────────────────────────────────────
  recordPayment: dashboardProcedure
    .input(
      z.object({
        orderId: z.number(),
        amount: z.number().positive(),
        method: z.enum(["cash", "bank"]),
        bankName: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const order = findOrderById(db, input.orderId);
      if (!order) throw new Error("Order not found");

      const prevPayments = db
        .select()
        .from(payments)
        .where(eq(payments.orderId, input.orderId))
        .all()
        .filter(p => p.status === "completed");
      const alreadyPaid = prevPayments.reduce((s, p) => s + (p.amount ?? 0), 0);
      const totalAmount = order.totalAmount ?? 0;
      const newPaidAmount = alreadyPaid + input.amount;

      const activeTicketVersion = order.ticketVersion ?? getCurrentTicketVersion(db);

      db.insert(payments)
        .values({
          ticketVersion: activeTicketVersion,
          orderId: input.orderId,
          amount: input.amount,
          method: input.method,
          status: "completed",
          transactionId: input.bankName ?? null,
          receivedAt: new Date().toISOString(),
        })
        .run();

      const settlement = settleBalance(totalAmount, newPaidAmount);
      const newPaymentStatus = settlement.balance === 0 ? "paid" : "partial";
      const newOrderStatus = settlement.balance === 0 ? "paid" : order.status;

      db.update(orders)
        .set({
          paidAmount: newPaidAmount,
          paymentStatus: newPaymentStatus,
          paymentMethod: input.method,
          status: newOrderStatus,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(orders.id, input.orderId))
        .run();

      getIo()?.emit(SOCKET_EVENT.PaymentReceived, {
        orderId: input.orderId,
        amount: input.amount,
        paymentStatus: newPaymentStatus,
      });

      return {
        success: true,
        paidAmount: newPaidAmount,
        totalAmount,
        paymentStatus: newPaymentStatus,
      };
    }),

  // ── Order bill detail ────────────────────────────────────────────────────────
  getOrderBill: dashboardProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const orderRows = findOrderById(db, input.orderId);
      if (!orderRows) throw new Error("Order not found");

      const items = listOrderItemsWithMenuForOrder(db, input.orderId).map(
        item => ({
          id: item.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          name: item.name,
        })
      );

      const paymentRecords = db
        .select()
        .from(payments)
        .where(eq(payments.orderId, input.orderId))
        .all();
      return { order: orderRows, items, payments: paymentRecords };
    }),

  // ── Inventory ────────────────────────────────────────────────────────────────
  getInventory: dashboardProcedure.query(async () => {
    return getDb().select().from(inventory).all();
  }),

  updateInventory: dashboardProcedure
    .input(z.object({ inventoryId: z.number(), quantity: z.number() }))
    .mutation(async ({ input }) => {
      getDb()
        .update(inventory)
        .set({
          quantity: input.quantity,
          lastUpdated: new Date().toISOString(),
        })
        .where(eq(inventory.id, input.inventoryId))
        .run();
      return { success: true };
    }),

  // ── Stock ────────────────────────────────────────────────────────────────────
  getStock: dashboardProcedure.query(async () => {
    return getDb().select().from(stock).all();
  }),

  updateStock: dashboardProcedure
    .input(
      z.object({
        stockId: z.number(),
        totalQuantity: z.number(),
        inUse: z.number(),
        broken: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const available = input.totalQuantity - input.inUse - input.broken;
      getDb()
        .update(stock)
        .set({
          totalQuantity: input.totalQuantity,
          inUse: input.inUse,
          broken: input.broken,
          available,
          lastUpdated: new Date().toISOString(),
        })
        .where(eq(stock.id, input.stockId))
        .run();
      return { success: true };
    }),

  // ── Reports ──────────────────────────────────────────────────────────────────
  getCashReport: dashboardProcedure.query(async ({ ctx }) => {
    const db = getDb();
    const modeRow = db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, "operationMode"))
      .all()[0];
    const operationMode = modeRow?.value || "unified";

    let paidOrders = db
      .select()
      .from(orders)
      .where(eq(orders.paymentStatus, "paid"))
      .all();

    let allPayments = db
      .select()
      .from(payments)
      .where(eq(payments.status, "completed"))
      .all();

    if (operationMode === "segregated" && ctx.staff?.role === "cashier") {
      const station = (ctx.staff.stationName || (ctx.staff.name?.toLowerCase().includes("counter") ? ctx.staff.name : "")).trim().toLowerCase();
      const cashierId = ctx.staff.staffId;

      paidOrders = paidOrders.filter((o) => {
        const rawCounter = (o.counterName === "Main Cashier Counter" ? "Counter 1" : o.counterName || "Counter 1").trim().toLowerCase();
        if (station && (rawCounter === station || station.includes(rawCounter) || rawCounter.includes(station))) return true;
        if (cashierId && o.cashierId === cashierId) return true;
        return false;
      });

      const paidOrderIds = new Set(paidOrders.map((o) => o.id));
      allPayments = allPayments.filter((p) => p.orderId !== null && paidOrderIds.has(p.orderId as number));
    }

    const totalCash = paidOrders.reduce((s, o) => s + (o.totalAmount ?? 0), 0);
    const cashTotal = allPayments
      .filter(p => p.method === "cash")
      .reduce((s, p) => s + (p.amount ?? 0), 0);
    const bankTotal = allPayments
      .filter(p => p.method === "bank")
      .reduce((s, p) => s + (p.amount ?? 0), 0);

    return {
      totalCash: totalCash.toFixed(2),
      cashTotal: cashTotal.toFixed(2),
      bankTotal: bankTotal.toFixed(2),
      totalOrders: paidOrders.length,
      stationName: ctx.staff?.stationName || "Counter 1",
      operationMode,
      lastUpdated: new Date(),
    };
  }),

  getEndOfDayReport: dashboardProcedure.query(async () => {
    const db = getDb();
    const dayOrders = db
      .select()
      .from(orders)
      .where(eq(orders.paymentStatus, "paid"))
      .all();
    const totalRevenue = dayOrders.reduce(
      (s, o) => s + (o.totalAmount ?? 0),
      0
    );
    return {
      totalRevenue: totalRevenue.toFixed(2),
      totalOrders: dayOrders.length,
      inventory: db.select().from(inventory).all(),
      stock: db.select().from(stock).all(),
    };
  }),
});
