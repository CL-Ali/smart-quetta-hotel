import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { publicProcedure, dashboardProcedure, router } from "../lib/trpc";
import { getDb } from "../db";
import { guests, orders, visits } from "../db/schema";
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
      const normalizedPhone = input.phone?.trim() || null;

      // ── Dedup priority ────────────────────────────────────────────────
      // 1. Phone provided + phone matches existing → reuse (strongest signal)
      // 2. Phone provided + no phone match → fall through to name match
      // 3. Name match within 24h → reuse (likely same person, same day)
      // 4. Name match older than 24h without phone → new guest
      //    (risk of wrong-merge accumulates over time; time-window limits damage)
      // 5. No match at all → new guest
      //
      // Same phone = same person, regardless of what name they type today.
      // Anonymous guests (no phone) dedup by name only within a 24h window.

      let existing = null;

      if (normalizedPhone) {
        existing =
          db
            .select()
            .from(guests)
            .where(eq(guests.phone, normalizedPhone))
            .all()[0] ?? null;
      }

      if (!existing) {
        // Time-bounded name match: only reuse if the guest had a visit in
        // the last 24 hours. Beyond that, create a new guest to avoid
        // silently merging two different people with the same name.
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const byName = findGuestByName(db, input.name.trim());
        if (byName) {
          // Check if this guest has any visit in the last 24h
          const recentVisits = db
            .select({ id: visits.id, createdAt: visits.createdAt })
            .from(visits)
            .where(eq(visits.guestId, byName.id))
            .all()
            .filter(v => v.createdAt >= cutoff);

          if (recentVisits.length > 0) {
            existing = byName;
          }
          // If no recent visit → fall through to create new guest
        }
      }

      if (existing) {
        // If we now have a phone and didn't before, save it
        const shouldUpdatePhone = normalizedPhone && !existing.phone;
        const updated =
          db
            .update(guests)
            .set({
              phone: shouldUpdatePhone ? normalizedPhone : existing.phone,
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

      // New guest — no match by phone or name
      const inserted = db
        .insert(guests)
        .values({
          uuid: createGuestUuid(),
          name: input.name.trim(),
          phone: normalizedPhone,
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

  /**
   * Guest directory for Dashboard CRM tab.
   * Protected by dashboardProcedure — requires X-Dashboard-Pin header.
   * TODO Phase 6: replace with protectedProcedure (per-staff OAuth).
   */
  getGuests: dashboardProcedure.query(async () => {
    const db = getDb();

    const allGuests = db
      .select()
      .from(guests)
      .orderBy(desc(guests.createdAt))
      .all();

    if (allGuests.length === 0) return [];

    const guestIds = allGuests.map(g => g.id);

    const allVisits = db
      .select({
        id: visits.id,
        guestId: visits.guestId,
        createdAt: visits.createdAt,
      })
      .from(visits)
      .all()
      .filter(v => guestIds.includes(v.guestId));

    const visitIds = allVisits.map(v => v.id);

    const allOrders = visitIds.length > 0
      ? db
          .select({
            visitId: orders.visitId,
            totalAmount: orders.totalAmount,
            paymentStatus: orders.paymentStatus,
          })
          .from(orders)
          .all()
          .filter(o => o.visitId !== null && visitIds.includes(o.visitId!))
      : [];

    return allGuests
      .map(guest => {
        const guestVisits  = allVisits.filter(v => v.guestId === guest.id);
        const guestVisitIds = guestVisits.map(v => v.id);
        const guestOrders  = allOrders.filter(
          o => o.visitId !== null && guestVisitIds.includes(o.visitId!)
        );

        const totalSpend = guestOrders.reduce(
          (sum, o) => sum + (o.totalAmount ?? 0),
          0
        );

        const lastVisit =
          guestVisits.length > 0
            ? guestVisits.sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )[0].createdAt
            : null;

        return {
          id:         guest.id,
          name:       guest.name,
          phone:      guest.phone,
          visitCount: guestVisits.length,
          orderCount: guestOrders.length,
          totalSpend,
          lastVisit,
          createdAt:  guest.createdAt,
        };
      })
      .sort((a, b) => b.totalSpend - a.totalSpend)
      .slice(0, 200);
  }),
});
