import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { publicProcedure, router } from "../lib/trpc";
import { getDb } from "../db";
import { orderItems, orders } from "../db/schema";
import {
  createDomainEvent,
  normalizeOrderStatus,
  calculateSubtotal,
  ensureOpenVisit,
  findGuestById,
  findMenuItemById,
  findVisitById,
  getOrderEventName,
  type DomainCommandResult,
} from "../lib/domain";

const createOrderInput = z.object({
  visitId: z.number(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.number(),
        quantity: z.number().int().positive(),
        unitPrice: z.number().nonnegative(),
      })
    )
    .min(1),
});

const updateOrderInput = z.object({
  orderId: z.number(),
  status: z.string().optional(),
  notes: z.string().optional(),
});

export const orderRouter = router({
  createOrder: publicProcedure
    .input(createOrderInput)
    .mutation(async ({ input }): Promise<DomainCommandResult<any>> => {
      const db = getDb();
      const visit = ensureOpenVisit(findVisitById(db, input.visitId));
      const guest = findGuestById(db, visit.guestId);
      if (!guest) throw new Error("Guest not found");

      const resolvedItems = input.items.map(item => {
        const menuItem = findMenuItemById(db, item.menuItemId);
        if (!menuItem) throw new Error("Menu item not found");
        return { item, menuItem };
      });

      const orderTotal = calculateSubtotal(input.items);
      const inserted = db
        .insert(orders)
        .values({
          visitId: input.visitId,
          customerId: null,
          customerName: guest.name,
          orderNo: `ORD-${Date.now()}`,
          subtotal: orderTotal,
          total: orderTotal,
          totalAmount: orderTotal,
          status: "pending",
          paymentStatus: "unpaid",
          paymentMethod: "pending",
          paidAmount: 0,
          updatedAt: new Date().toISOString(),
        })
        .returning()
        .all()[0];

      const insertedItems = resolvedItems.map(({ item, menuItem }) => {
        return db
          .insert(orderItems)
          .values({
            orderId: inserted.id,
            menuItemId: item.menuItemId,
            nameSnapshot: menuItem.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            status: "pending",
            kitchenStatus: "pending",
            servedQty: 0,
          })
          .returning()
          .all()[0];
      });

      return {
        command: { name: "CreateOrder", occurredAt: new Date().toISOString() },
        events: [
          createDomainEvent({
            name: "OrderCreated",
            entityId: inserted.id,
            entityType: "order",
            payload: { itemCount: insertedItems.length },
          }),
        ],
        data: { order: inserted, items: insertedItems },
      };
    }),

  updateOrder: publicProcedure
    .input(updateOrderInput)
    .mutation(async ({ input }): Promise<DomainCommandResult<any>> => {
      const db = getDb();
      const current = db
        .select()
        .from(orders)
        .where(eq(orders.id, input.orderId))
        .all()[0];
      if (!current) throw new Error("Order not found");

      const nextStatus = input.status
        ? normalizeOrderStatus(input.status)
        : normalizeOrderStatus(current.status);
      const updated =
        db
          .update(orders)
          .set({
            status: nextStatus,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(orders.id, input.orderId))
          .returning()
          .all()[0] ?? current;

      return {
        command: { name: "UpdateOrder", occurredAt: new Date().toISOString() },
        events: [
          createDomainEvent({
            name: getOrderEventName(nextStatus),
            entityId: updated.id,
            entityType: "order",
            payload: { status: nextStatus },
          }),
        ],
        data: updated,
      };
    }),

  getOrders: publicProcedure.query(async () => {
    const db = getDb();
    return db.select().from(orders).orderBy(desc(orders.createdAt)).all();
  }),
});
