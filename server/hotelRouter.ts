import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { menuItems, seatingAreas, orders, orderItems, inventory, equipment } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

export const hotelRouter = router({
  // Menu
  getMenu: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return await db.select().from(menuItems).where(eq(menuItems.isAvailable, true));
  }),

  // Seating Areas
  getSeatingAreas: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return await db.select().from(seatingAreas);
  }),

  getSeatingAreaByQR: publicProcedure
    .input(z.object({ qrId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const areas = await db.select().from(seatingAreas).where(eq(seatingAreas.qrCodeIdentifier, input.qrId));
      return areas[0] || null;
    }),

  // Orders
  placeOrder: publicProcedure
    .input(z.object({
      seatingAreaId: z.number().optional(),
      customerName: z.string().optional(),
      items: z.array(z.object({
        menuItemId: z.number(),
        quantity: z.number(),
        unitPrice: z.string()
      }))
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const totalAmount = input.items.reduce((sum, item) => sum + parseFloat(item.unitPrice) * item.quantity, 0).toFixed(2);
      
      const [order] = await db.insert(orders).values({
        seatingAreaId: input.seatingAreaId,
        customerName: input.customerName,
        totalAmount: totalAmount,
        status: 'pending',
        paymentStatus: 'unpaid'
      });

      const orderId = order.insertId;

      for (const item of input.items) {
        await db.insert(orderItems).values({
          orderId: orderId,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        });
      }

      return { success: true, orderId };
    }),

  getOrders: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }),

  updateOrderStatus: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      status: z.enum(["pending", "preparing", "ready", "served", "paid", "cancelled"])
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(orders)
        .set({ status: input.status })
        .where(eq(orders.id, input.orderId));
      return { success: true };
    }),

  // Admin Dashboard
  getCashReport: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const paidOrders = await db.select().from(orders).where(eq(orders.paymentStatus, 'paid'));
    const totalCash = paidOrders.reduce((sum: number, order: any) => sum + parseFloat(order.totalAmount || "0"), 0);
    return { totalCash: totalCash.toFixed(2) };
  }),

  getInventory: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return await db.select().from(inventory);
  }),

  getEquipment: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return await db.select().from(equipment);
  }),
});
