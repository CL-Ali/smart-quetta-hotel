import { publicProcedure, dashboardProcedure, router } from "../lib/trpc";
import { getDb } from "../db";
import {
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
} from "../db/schema";
import { eq, desc, asc, ne } from "drizzle-orm";
import { z } from "zod";
import {
  calculateSubtotal,
  findOrderById,
  listOrderItemsWithMenuForOrder,
  settleBalance,
} from "../lib/domain";
import { getIo, SOCKET_EVENT } from "../lib/socket";

export const hotelRouter = router({
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
        items: z.array(
          z.object({
            menuItemId: z.number(),
            quantity: z.number(),
            unitPrice: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const totalAmount = calculateSubtotal(input.items);

      let resolvedSeatingNo = input.seatingNo ?? null;
      let resolvedPeopleCount = input.peopleCount ?? 1;
      let resolvedSeatingType = input.seatingType ?? (resolvedPeopleCount > 1 ? "table" : "seat");
      let resolvedGuestId = 1;

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

      const result = db
        .insert(orders)
        .values({
          customerId: validCustomerId,
          seatingAreaId: input.seatingAreaId ?? null,
          customerName: input.customerName,
          seatingNo: resolvedSeatingNo,
          peopleCount: resolvedPeopleCount,
          seatingType: resolvedSeatingType,
          visitId: input.visitId ?? null,
          totalAmount,
          status: "pending",
          paymentStatus: "unpaid",
          paymentMethod: "pending",
          paidAmount: 0,
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
      });
      return { success: true, orderId, orderNo: ticketNo, ticketNo };
    }),

  // ── All orders (kitchen / waiter / dashboard) ────────────────────────────────
  getOrders: dashboardProcedure.query(async () => {
    const db = getDb();
    const allOrders = db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .all();

    return allOrders.map(order => {
      const items = listOrderItemsWithMenuForOrder(db, order.id);

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

      return { ...order, seatingNo, peopleCount, seatingType, items, servedAmount, paymentHistory };
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

      db.insert(payments)
        .values({
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
  getCashReport: dashboardProcedure.query(async () => {
    const db = getDb();
    const paidOrders = db
      .select()
      .from(orders)
      .where(eq(orders.paymentStatus, "paid"))
      .all();
    const totalCash = paidOrders.reduce((s, o) => s + (o.totalAmount ?? 0), 0);

    const allPayments = db
      .select()
      .from(payments)
      .where(eq(payments.status, "completed"))
      .all();
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
