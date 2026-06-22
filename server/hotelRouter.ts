import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { menuItems, seatingAreas, orders, orderItems, inventory, equipment, recipes } from "../drizzle/schema";
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
    
    const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
    
    // In a production app, we'd use a join, but for simplicity in this MVP:
    const ordersWithItems = await Promise.all(allOrders.map(async (order) => {
      const items = await db.select({
        id: orderItems.id,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        name: menuItems.name
      })
      .from(orderItems)
      .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
      .where(eq(orderItems.orderId, order.id));
      
      return { ...order, items };
    }));
    
    return ordersWithItems;
  }),

  updateOrderStatus: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      status: z.enum(["pending", "preparing", "ready", "served", "paid", "cancelled"])
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [order] = await db.select().from(orders).where(eq(orders.id, input.orderId));
      if (!order) throw new Error("Order not found");

      const updateData: any = { status: input.status };
      if (input.status === 'paid') {
        updateData.paymentStatus = 'paid';
      }
      
      await db.update(orders)
        .set(updateData)
        .where(eq(orders.id, input.orderId));

      // Inventory Deduction Logic (when status moves to 'preparing')
      if (input.status === 'preparing' && order.status === 'pending') {
        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, input.orderId));
        for (const item of items) {
          const itemRecipes = await db.select().from(recipes).where(eq(recipes.menuItemId, item.menuItemId as any));
          for (const recipe of itemRecipes) {
            const deduction = parseFloat(recipe.quantityNeeded) * item.quantity;
            await db.execute(`UPDATE inventory SET quantity = quantity - ${deduction} WHERE id = ${recipe.inventoryItemId as any}`);
          }
        }
      }

      // Equipment Tracking (when status moves to 'preparing' or 'served')
      if (input.status === 'preparing' && order.status === 'pending') {
        // Assume 1 cup per order for simplicity in MVP
        await db.execute("UPDATE equipment SET in_use = in_use + 1 WHERE name = 'Cup'");
      }

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

  returnEquipment: protectedProcedure
    .input(z.object({ name: z.string(), quantity: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.execute(`UPDATE equipment SET in_use = GREATEST(0, in_use - ${input.quantity}) WHERE name = '${input.name}'`);
      return { success: true };
    }),

  getEndOfDayReport: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dayOrders = await db.select().from(orders).where(eq(orders.paymentStatus, 'paid'));
    const totalRevenue = dayOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount || "0"), 0);
    const totalOrders = dayOrders.length;
    
    const currentInventory = await db.select().from(inventory);
    const currentEquipment = await db.select().from(equipment);
    
    return {
      totalRevenue: totalRevenue.toFixed(2),
      totalOrders,
      inventory: currentInventory,
      equipment: currentEquipment
    };
  }),
});
