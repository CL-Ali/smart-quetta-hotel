import { z } from "zod";
import { eq } from "drizzle-orm";
import { publicProcedure, router } from "../lib/trpc";
import { getDb } from "../db";
import { guests } from "../db/schema";
import {
  createDomainEvent,
  createGuestUuid,
  findGuestByName,
  type DomainCommandResult,
} from "../lib/domain";

const guestInput = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
});

export const guestRouter = router({
  createGuest: publicProcedure
    .input(guestInput)
    .mutation(async ({ input }): Promise<DomainCommandResult<any>> => {
      const db = getDb();
      const existing = findGuestByName(db, input.name.trim());

      if (existing) {
        const updated =
          db
            .update(guests)
            .set({
              phone: input.phone ?? existing.phone,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(guests.id, existing.id))
            .returning()
            .all()[0] ?? existing;

        return {
          command: {
            name: "CreateGuest",
            occurredAt: new Date().toISOString(),
          },
          events: [
            createDomainEvent({
              name: "GuestCreated",
              entityId: updated.id,
              entityType: "guest",
              payload: { reused: true },
            }),
          ],
          data: updated,
        };
      }

      const inserted = db
        .insert(guests)
        .values({
          uuid: createGuestUuid(),
          name: input.name.trim(),
          phone: input.phone ?? null,
          updatedAt: new Date().toISOString(),
        })
        .returning()
        .all()[0];

      return {
        command: { name: "CreateGuest", occurredAt: new Date().toISOString() },
        events: [
          createDomainEvent({
            name: "GuestCreated",
            entityId: inserted.id,
            entityType: "guest",
            payload: { reused: false },
          }),
        ],
        data: inserted,
      };
    }),
});
