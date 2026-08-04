import { publicProcedure, router } from "../lib/trpc";
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
} from "../db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import {
  calculateSubtotal,
  findOrderById,
  listOrderItemsWithMenuForOrder,
  settleBalance,
} from "../lib/domain";

export const hotelRouter = router({
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
      const existing = db
        .select()
        .from(customers)
        .where(eq(customers.name, input.name))
        .all();
      if (existing.length > 0) return existing[0];

      const result = db
        .insert(customers)
        .values({
          name: input.name,
          phone: input.phone ?? null,
          email: input.email ?? null,
        })
        .run();

      return { id: Number(result.lastInsertRowid), name: input.name };
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
            })
          );
          return { ...order, items };
        })
      );
    }),

  // ── Place order ─────────────────────────────────────────────────────────────
  placeOrder: publicProcedure
    .input(
      z.object({
        seatingAreaId: z.number().optional(),
        customerName: z.string(),
        customerId: z.number().optional(),
        // Phase 3: link order to a Visit when available; optional for backward compat
        visitId: z.number().optional(),
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

      // If customer has an active open order, append items to it
      const existingOrders = db
        .select()
        .from(orders)
        .where(eq(orders.customerName, input.customerName))
        .orderBy(desc(orders.createdAt))
        .all()
        .filter(
          o =>
            (o.paymentStatus === "unpaid" || o.paymentStatus === "partial") &&
            o.status !== "cancelled"
        );

      let orderId: number;

      if (existingOrders.length > 0) {
        orderId = existingOrders[0].id;
        const currentTotal = existingOrders[0].totalAmount ?? 0;
        const currentPaid = existingOrders[0].paidAmount ?? 0;
        const newTotal = currentTotal + totalAmount;

        const newPaymentStatus =
          currentPaid <= 0
            ? "unpaid"
            : currentPaid >= newTotal
              ? "paid"
              : "partial";

        const newOrderStatus =
          newPaymentStatus === "paid"
            ? existingOrders[0].status
            : existingOrders[0].status === "paid" ||
                existingOrders[0].status === "served"
              ? "pending"
              : existingOrders[0].status;

        db.update(orders)
          .set({
            totalAmount: newTotal,
            paymentStatus: newPaymentStatus,
            status: newOrderStatus,
            // Stamp visitId if provided and not already set on this order
            ...(input.visitId != null && existingOrders[0].visitId == null
              ? { visitId: input.visitId }
              : {}),
            updatedAt: new Date().toISOString(),
          })
          .where(eq(orders.id, existingOrders[0].id))
          .run();
      } else {
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
            visitId: input.visitId ?? null,
            totalAmount,
            status: "pending",
            paymentStatus: "unpaid",
            paymentMethod: "pending",
            paidAmount: 0,
          })
          .run();
        orderId = Number(result.lastInsertRowid);
      }

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

      return { success: true, orderId };
    }),

  // ── All orders (kitchen / waiter / dashboard) ────────────────────────────────
  getOrders: publicProcedure.query(async () => {
    const db = getDb();
    const allOrders = db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .all();

    return allOrders.map(order => {
      const items = listOrderItemsWithMenuForOrder(db, order.id);

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

      return { ...order, items, servedAmount, paymentHistory };
    });
  }),

  // ── Update item kitchen status ───────────────────────────────────────────────
  updateItemStatus: publicProcedure
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

      return { success: true, newServedQty, finalStatus, newOrderStatus };
    }),

  // ── Update order status ──────────────────────────────────────────────────────
  updateOrderStatus: publicProcedure
    .input(z.object({ orderId: z.number(), status: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      db.update(orders)
        .set({ status: input.status, updatedAt: new Date().toISOString() })
        .where(eq(orders.id, input.orderId))
        .run();
      return { success: true };
    }),

  // ── Record payment ───────────────────────────────────────────────────────────
  recordPayment: publicProcedure
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

      return {
        success: true,
        paidAmount: newPaidAmount,
        totalAmount,
        paymentStatus: newPaymentStatus,
      };
    }),

  // ── Order bill detail ────────────────────────────────────────────────────────
  getOrderBill: publicProcedure
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
  getInventory: publicProcedure.query(async () => {
    return getDb().select().from(inventory).all();
  }),

  updateInventory: publicProcedure
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
  getStock: publicProcedure.query(async () => {
    return getDb().select().from(stock).all();
  }),

  updateStock: publicProcedure
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
  getCashReport: publicProcedure.query(async () => {
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

  getEndOfDayReport: publicProcedure.query(async () => {
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
