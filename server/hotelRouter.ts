import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { menuItems, seatingAreas, orders, orderItems, inventory, stock, recipes, customers, payments } from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
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

  // Customer Management
  getOrCreateCustomer: publicProcedure
    .input(z.object({
      name: z.string(),
      phone: z.string().optional(),
      email: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Check if customer exists
      const existing = await db.select().from(customers).where(eq(customers.name, input.name));
      
      if (existing.length > 0) {
        return existing[0];
      }
      
      // Create new customer
      const [result] = await db.insert(customers).values({
        name: input.name,
        phone: input.phone,
        email: input.email,
        lastOrderAt: new Date()
      });
      
      return { id: result.insertId, name: input.name };
    }),

  getCustomerOrders: publicProcedure
    .input(z.object({ customerName: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      return await db.select().from(orders)
        .where(eq(orders.customerName, input.customerName))
        .orderBy(desc(orders.createdAt));
    }),

  // Orders with Reordering Logic
  placeOrder: publicProcedure
    .input(z.object({
      seatingAreaId: z.number().optional(),
      customerName: z.string(),
      customerId: z.number().optional(),
      items: z.array(z.object({
        menuItemId: z.number(),
        quantity: z.number(),
        unitPrice: z.string()
      })),
      isReorder: z.boolean().optional() // If true, add to existing unpaid order
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const totalAmount = input.items.reduce((sum, item) => sum + parseFloat(item.unitPrice) * item.quantity, 0);
      
      let orderId: number;
      
      // Check if customer has an unpaid order (reordering)
      if (input.isReorder && input.customerName) {
        const existingOrders = await db.select().from(orders)
          .where(and(
            eq(orders.customerName, input.customerName),
            eq(orders.paymentStatus, 'unpaid')
          ));
        
        if (existingOrders.length > 0) {
          // Add to existing order
          orderId = existingOrders[0].id;
          const currentTotal = parseFloat(existingOrders[0].totalAmount || "0");
          const newTotal = (currentTotal + totalAmount).toFixed(2);
          
          await db.execute(`UPDATE orders SET totalAmount = ${newTotal} WHERE id = ${orderId}`);
        } else {
          // Create new order
          const [order] = await db.insert(orders).values({
            customerId: input.customerId,
            seatingAreaId: input.seatingAreaId,
            customerName: input.customerName,
            totalAmount: totalAmount.toFixed(2),
            status: 'pending',
            paymentStatus: 'unpaid'
          });
          orderId = order.insertId;
        }
      } else {
        // Create new order
        const [order] = await db.insert(orders).values({
          customerId: input.customerId,
          seatingAreaId: input.seatingAreaId,
          customerName: input.customerName,
          totalAmount: totalAmount.toFixed(2),
          status: 'pending',
          paymentStatus: 'unpaid'
        });
        orderId = order.insertId;
      }

      // Add items to order
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
    
    const ordersWithItems = await Promise.all(allOrders.map(async (order) => {
      const items = await db.select({
        id: orderItems.id,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        name: menuItems.name,
        price: menuItems.price
      })
        .from(orderItems)
        .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
        .where(eq(orderItems.orderId, order.id));
      
      return { ...order, items };
    }));
    
    return ordersWithItems;
  }),

  updateOrderStatus: protectedProcedure
    .input(z.object({ orderId: z.number(), status: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.execute(`UPDATE orders SET status = '${input.status}' WHERE id = ${input.orderId}`);
      return { success: true };
    }),

  // Payment Handling
  processPayment: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      amount: z.number(),
      method: z.enum(['cash', 'bank']),
      transactionId: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Get order
      const orderData = await db.select().from(orders).where(eq(orders.id, input.orderId));
      if (orderData.length === 0) throw new Error("Order not found");
      
      const order = orderData[0];
      const totalAmount = parseFloat(order.totalAmount || "0");
      
      // Create payment record
      const [paymentResult] = await db.insert(payments).values({
        orderId: input.orderId,
        amount: input.amount.toString(),
        method: input.method,
        status: 'completed',
        transactionId: input.transactionId
      });
      
      // Update order payment status
      let newPaymentStatus = 'partial';
      if (input.amount >= totalAmount) {
        newPaymentStatus = 'paid';
      }
      
      await db.execute(`UPDATE orders SET paymentStatus = '${newPaymentStatus}', paymentMethod = '${input.method}' WHERE id = ${input.orderId}`);
      
      return { success: true, paymentId: paymentResult.insertId };
    }),

  getOrderBill: publicProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const orderData = await db.select().from(orders).where(eq(orders.id, input.orderId));
      if (orderData.length === 0) throw new Error("Order not found");
      
      const order = orderData[0];
      
      const items = await db.select({
        id: orderItems.id,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        name: menuItems.name
      })
        .from(orderItems)
        .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
        .where(eq(orderItems.orderId, input.orderId));
      
      const paymentRecords = await db.select().from(payments).where(eq(payments.orderId, input.orderId));
      
      return {
        order,
        items,
        payments: paymentRecords,
        totalAmount: order.totalAmount,
        paidAmount: paymentRecords.reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0)
      };
    }),

  // Inventory Management
  getInventory: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return await db.select().from(inventory);
  }),

  updateInventory: protectedProcedure
    .input(z.object({ inventoryId: z.number(), quantity: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.execute(`UPDATE inventory SET quantity = ${input.quantity} WHERE id = ${input.inventoryId}`);
      return { success: true };
    }),

  // Stock Management (Finished Items)
  getStock: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return await db.select().from(stock);
  }),

  updateStock: protectedProcedure
    .input(z.object({ stockId: z.number(), totalQuantity: z.number(), inUse: z.number(), broken: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const available = input.totalQuantity - input.inUse - input.broken;
      await db.execute(`UPDATE stock SET totalQuantity = ${input.totalQuantity}, inUse = ${input.inUse}, broken = ${input.broken}, available = ${available} WHERE id = ${input.stockId}`);
      return { success: true };
    }),

  // Cash Report
  getCashReport: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const paidOrders = await db.select().from(orders).where(eq(orders.paymentStatus, 'paid'));
    const totalCash = paidOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount || "0"), 0).toFixed(2);
    
    return {
      totalCash,
      totalOrders: paidOrders.length,
      lastUpdated: new Date()
    };
  }),

  // End of Day Report
  getEndOfDayReport: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const dayOrders = await db.select().from(orders).where(eq(orders.paymentStatus, 'paid'));
    const totalRevenue = dayOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount || "0"), 0);
    const totalOrders = dayOrders.length;
    
    const currentInventory = await db.select().from(inventory);
    const currentStock = await db.select().from(stock);
    
    return {
      totalRevenue: totalRevenue.toFixed(2),
      totalOrders,
      inventory: currentInventory,
      stock: currentStock
    };
  }),
});
