import { desc, eq } from "drizzle-orm";
import { publicProcedure, router } from "../lib/trpc";
import { getDb } from "../db";
import { orderItems, orders } from "../db/schema";
import {
  createDomainEvent,
  getOrderEventName,
  type DomainCommandResult,
} from "../lib/domain";
import { z } from "zod";

export const kitchenRouter = router({
  getQueue: publicProcedure.query(async () => {
    const db = getDb();
    const queue = db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .all();
    return queue;
  }),

  updateItemStatus: publicProcedure
    .input(
      z.object({
        itemId: z.number(),
        status: z.enum([
          "pending",
          "accepted",
          "preparing",
          "ready",
          "served",
          "completed",
        ]),
      })
    )
    .mutation(async ({ input }): Promise<DomainCommandResult<any>> => {
      const db = getDb();
      const current = db
        .select()
        .from(orderItems)
        .where(eq(orderItems.id, input.itemId))
        .all()[0];
      if (!current) throw new Error("Item not found");

      const updatedItem =
        db
          .update(orderItems)
          .set({ kitchenStatus: input.status, status: input.status })
          .where(eq(orderItems.id, input.itemId))
          .returning()
          .all()[0] ?? current;

      return {
        command: {
          name: "UpdateKitchenStatus",
          occurredAt: new Date().toISOString(),
        },
        events: [
          createDomainEvent({
            name: getOrderEventName(input.status),
            entityId: updatedItem.id,
            entityType: "order",
            payload: { status: input.status },
          }),
        ],
        data: updatedItem,
      };
    }),
});
