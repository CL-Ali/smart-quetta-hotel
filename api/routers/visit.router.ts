import { z } from "zod";
import { eq } from "drizzle-orm";
import { publicProcedure, router } from "../lib/trpc";
import { getDb } from "../db";
import { visits } from "../db/schema";
import {
  createDomainEvent,
  ensureVisitCanBeClosed,
  findGuestById,
  findVisitById,
  type DomainCommandResult,
} from "../lib/domain";

const openVisitInput = z.object({
  guestId: z.number(),
  tableNo: z.string().optional(),
});

const closeVisitInput = z.object({ visitId: z.number() });

export const visitRouter = router({
  openVisit: publicProcedure
    .input(openVisitInput)
    .mutation(async ({ input }): Promise<DomainCommandResult<any>> => {
      const db = getDb();
      const guest = findGuestById(db, input.guestId);
      if (!guest) throw new Error("Guest not found");

      const inserted = db
        .insert(visits)
        .values({
          guestId: input.guestId,
          tableNo: input.tableNo ?? null,
          status: "open",
          startedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        })
        .returning()
        .all()[0];

      return {
        command: { name: "OpenVisit", occurredAt: new Date().toISOString() },
        events: [
          createDomainEvent({
            name: "VisitOpened",
            entityId: inserted.id,
            entityType: "visit",
            payload: { tableNo: inserted.tableNo },
          }),
        ],
        data: inserted,
      };
    }),

  closeVisit: publicProcedure
    .input(closeVisitInput)
    .mutation(async ({ input }): Promise<DomainCommandResult<any>> => {
      const db = getDb();
      const current = ensureVisitCanBeClosed(findVisitById(db, input.visitId));

      const updated =
        db
          .update(visits)
          .set({ status: "closed", closedAt: new Date().toISOString() })
          .where(eq(visits.id, input.visitId))
          .returning()
          .all()[0] ?? current;

      return {
        command: { name: "CloseVisit", occurredAt: new Date().toISOString() },
        events: [
          createDomainEvent({
            name: "VisitClosed",
            entityId: updated.id,
            entityType: "visit",
            payload: { closedAt: updated.closedAt },
          }),
        ],
        data: updated,
      };
    }),
});
