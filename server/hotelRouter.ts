import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import {
  menuItems, seatingAreas, orders, orderItems,
  inventory, stock, customers, payments,
} from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

export const hotelRouter = router({

  // ── Menu ────────────────────────────────────────────────────────────────────
  getMenu: publicProcedure.query(async () => {
    const db = getDb();
    return db.select().from(menuItems).where(eq(menuItems.isAvailable, true)).all();
  }),

  // ── Seating ─────────────────────────────────────────────────────────────────
  getSeatingAreas: publicProcedure.query(async () => {
    const db = getDb();
    return db.select().from(seatingAreas).all();
  }),

  // ── Customers ───────────────────────────────────────────────────────────────
  getOrCreateCustomer: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      phone: z.string().optional(),
      email: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const existing = db.select().from(customers)
        .where(eq(customers.name, input.name)).all();
      if (existing.length > 0) return existing[0];

      const result = db.insert(customers).values({
        name: input.name,
        phone: input.phone ?? null,
        email: input.email ?? null,
      }).run();

      return { id: Number(result.lastInsertRowid), name: input.name };
    }),

  // ── Customer order history ───────────────────────────────────────────────────
  getCustomerOrders: publicProcedure
    .input(z.object({ customerName: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const customerOrders = db.select().from(orders)
        .where(eq(orders.customerName, input.customerName))
        .orderBy(desc(orders.createdAt))
        .all();

      return Promise.all(customerOrders.map(async (order) => {
        const items = db.select({
          id: orderItems.id,
          quantity: orderItems.quantity,
          unitPrice: orderItems.unitPrice,
          name: menuItems.name,
        })
          .from(orderItems)
          .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
          .where(eq(orderItems.orderId, order.id))
          .all();
        return { ...order, items };
      }));
    }),

  // ── Place order ─────────────────────────────────────────────────────────────
  placeOrder: publicProcedure
    .input(z.object({
      seatingAreaId: z.number().optional(),
      customerName: z.string(),
      customerId: z.number().optional(),
      items: z.array(z.object({
        menuItemId: z.number(),
        quantity: z.number(),
        unitPrice: z.number(),
      })),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const totalAmount = input.items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity, 0
      );

      // If customer has an active open order (unpaid or partially paid), append items to it.
      // A new order is only created when the previous one is fully paid or cancelled.
      const existingOrders = db.select().from(orders)
        .where(eq(orders.customerName, input.customerName))
        .orderBy(desc(orders.createdAt))
        .all()
        .filter(o =>
          (o.paymentStatus === "unpaid" || o.paymentStatus === "partial") &&
          o.status !== "cancelled"
        );

      let orderId: number;

      if (existingOrders.length > 0) {
        // Append to the existing open order
        orderId = existingOrders[0].id;
        const currentTotal  = existingOrders[0].totalAmount ?? 0;
        const currentPaid   = existingOrders[0].paidAmount  ?? 0;
        const newTotal      = currentTotal + totalAmount;

        // Recalculate payment status — adding items may reopen a "paid" order
        const newPaymentStatus =
          currentPaid <= 0       ? "unpaid"
          : currentPaid >= newTotal ? "paid"
          :                          "partial";

        const newOrderStatus =
          newPaymentStatus === "paid"
            ? existingOrders[0].status   // keep whatever it was (served/paid)
            : existingOrders[0].status === "paid" || existingOrders[0].status === "served"
            ? "pending"                  // reopen — new items need kitchen attention
            : existingOrders[0].status;

        db.update(orders)
          .set({
            totalAmount: newTotal,
            paymentStatus: newPaymentStatus,
            status: newOrderStatus,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(orders.id, existingOrders[0].id))
          .run();
      } else {
        // No open order — create a fresh one
        // Validate customerId — reject stale IDs from client cache
        let validCustomerId: number | null = null;
        if (input.customerId) {
          const exists = db.select({ id: customers.id })
            .from(customers)
            .where(eq(customers.id, input.customerId))
            .all();
          validCustomerId = exists.length > 0 ? input.customerId : null;
        }

        const result = db.insert(orders).values({
          customerId: validCustomerId,
          seatingAreaId: input.seatingAreaId ?? null,
          customerName: input.customerName,
          totalAmount,
          status: "pending",
          paymentStatus: "unpaid",
          paymentMethod: "pending",
          paidAmount: 0,
        }).run();
        orderId = Number(result.lastInsertRowid);
      }

      // Insert order items — skip any item whose menuItemId no longer exists
      // (guards against stale client cache after a DB reset)
      for (const item of input.items) {
        const menuItem = db.select({ id: menuItems.id })
          .from(menuItems)
          .where(eq(menuItems.id, item.menuItemId))
          .all();
        if (menuItem.length === 0) continue; // stale ID — skip silently

        db.insert(orderItems).values({
          orderId,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        }).run();
      }

      return { success: true, orderId };
    }),

  // ── All orders (kitchen / waiter / dashboard) ────────────────────────────────
  getOrders: publicProcedure.query(async () => {
    const db = getDb();
    const allOrders = db.select().from(orders).orderBy(desc(orders.createdAt)).all();

    return allOrders.map((order) => {
      const items = db.select({
        id: orderItems.id,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        name: menuItems.name,
        price: menuItems.price,
      })
        .from(orderItems)
        .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
        .where(eq(orderItems.orderId, order.id))
        .all();

      // Include completed payments for history display
      const paymentHistory = db.select({
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

      return { ...order, items, paymentHistory };
    });
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

  // ── Admin: record payment ────────────────────────────────────────────────────
  recordPayment: publicProcedure
    .input(z.object({
      orderId: z.number(),
      amount: z.number().positive(),
      method: z.enum(["cash", "bank"]),
      // For bank: store service name (JazzCash / EasyPaisa / HBL etc.)
      // For cash: optional note
      bankName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();

      const orderRows = db.select().from(orders).where(eq(orders.id, input.orderId)).all();
      if (orderRows.length === 0) throw new Error("Order not found");
      const order = orderRows[0];

      const prevPayments = db.select().from(payments)
        .where(eq(payments.orderId, input.orderId)).all()
        .filter(p => p.status === "completed");
      const alreadyPaid   = prevPayments.reduce((s, p) => s + (p.amount ?? 0), 0);
      const totalAmount   = order.totalAmount ?? 0;
      const newPaidAmount = alreadyPaid + input.amount;

      db.insert(payments).values({
        orderId: input.orderId,
        amount: input.amount,
        method: input.method,
        status: "completed",
        transactionId: input.bankName ?? null,   // reuse transactionId col for bank/service name
      }).run();

      const newPaymentStatus = newPaidAmount >= totalAmount ? "paid" : "partial";
      const newOrderStatus   = newPaidAmount >= totalAmount ? "paid" : order.status;

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
      const orderRows = db.select().from(orders).where(eq(orders.id, input.orderId)).all();
      if (orderRows.length === 0) throw new Error("Order not found");
      const order = orderRows[0];

      const items = db.select({
        id: orderItems.id,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        name: menuItems.name,
      })
        .from(orderItems)
        .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
        .where(eq(orderItems.orderId, input.orderId))
        .all();

      const paymentRecords = db.select().from(payments)
        .where(eq(payments.orderId, input.orderId)).all();

      return { order, items, payments: paymentRecords };
    }),

  // ── Inventory ────────────────────────────────────────────────────────────────
  getInventory: publicProcedure.query(async () => {
    const db = getDb();
    return db.select().from(inventory).all();
  }),

  updateInventory: publicProcedure
    .input(z.object({ inventoryId: z.number(), quantity: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      db.update(inventory)
        .set({ quantity: input.quantity, lastUpdated: new Date().toISOString() })
        .where(eq(inventory.id, input.inventoryId))
        .run();
      return { success: true };
    }),

  // ── Stock ────────────────────────────────────────────────────────────────────
  getStock: publicProcedure.query(async () => {
    const db = getDb();
    return db.select().from(stock).all();
  }),

  updateStock: publicProcedure
    .input(z.object({
      stockId: z.number(),
      totalQuantity: z.number(),
      inUse: z.number(),
      broken: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const available = input.totalQuantity - input.inUse - input.broken;
      db.update(stock)
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

  // ── Cash / End-of-day reports ────────────────────────────────────────────────
  getCashReport: publicProcedure.query(async () => {
    const db = getDb();
    const paidOrders = db.select().from(orders)
      .where(eq(orders.paymentStatus, "paid")).all();
    const totalCash = paidOrders.reduce((s, o) => s + (o.totalAmount ?? 0), 0);

    // Split by payment method from payments table
    const allPayments = db.select().from(payments)
      .where(eq(payments.status, "completed")).all();
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
    const dayOrders = db.select().from(orders)
      .where(eq(orders.paymentStatus, "paid")).all();
    const totalRevenue = dayOrders.reduce((s, o) => s + (o.totalAmount ?? 0), 0);
    return {
      totalRevenue: totalRevenue.toFixed(2),
      totalOrders: dayOrders.length,
      inventory: db.select().from(inventory).all(),
      stock: db.select().from(stock).all(),
    };
  }),
});
