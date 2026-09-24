import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { publicProcedure, dashboardProcedure, router } from "../lib/trpc";
import { getDb } from "../db";
import { guests, orders, visits, systemSettings, staff } from "../db/schema";
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
   * Supports Counter-Segregation pod filtering when enabled.
   */
  getGuests: dashboardProcedure.query(async ({ ctx }) => {
    const db = getDb();

    // Check operation mode
    const modeRow = db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, "operationMode"))
      .all()[0];
    const operationMode = modeRow?.value || "unified";

    let allOrders = db
      .select({
        id: orders.id,
        visitId: orders.visitId,
        customerId: orders.customerId,
        customerName: orders.customerName,
        counterName: orders.counterName,
        cashierId: orders.cashierId,
        totalAmount: orders.totalAmount,
        total: orders.total,
        paymentStatus: orders.paymentStatus,
      })
      .from(orders)
      .all();

    if (operationMode === "segregated") {
      if (ctx.staff?.role === "cashier") {
        const station = (ctx.staff.stationName || (ctx.staff.name?.toLowerCase().includes("counter") ? ctx.staff.name : "")).trim().toLowerCase();
        const cashierId = ctx.staff.staffId;
        allOrders = allOrders.filter((o) => {
          const rawCounter = (o.counterName === "Main Cashier Counter" ? "Counter 1" : o.counterName || "Counter 1").trim().toLowerCase();
          if (station && (rawCounter === station || station.includes(rawCounter) || rawCounter.includes(station))) return true;
          if (cashierId && o.cashierId === cashierId) return true;
          return false;
        });
      } else if (ctx.staff?.role === "waiter") {
        if (ctx.staff.assignedCashierId) {
          const assignedCashier = db
            .select()
            .from(staff)
            .where(eq(staff.id, ctx.staff.assignedCashierId))
            .all()[0];

          allOrders = allOrders.filter((o) => {
            if (o.cashierId === ctx.staff?.assignedCashierId) return true;
            const rawCounter = (o.counterName === "Main Cashier Counter" ? "Counter 1" : o.counterName || "Counter 1").trim().toLowerCase();
            const cashierStation = (assignedCashier?.stationName || assignedCashier?.name || "Counter 1").trim().toLowerCase();
            if (rawCounter === cashierStation || cashierStation.includes(rawCounter) || rawCounter.includes(cashierStation)) return true;
            return false;
          });
        }
      }
    }

    const segregatedVisitIds = new Set(
      allOrders.filter((o) => o.visitId !== null).map((o) => o.visitId as number)
    );
    const segregatedCustomerNames = new Set(
      allOrders.filter((o) => Boolean(o.customerName?.trim())).map((o) => o.customerName!.trim().toLowerCase())
    );

    const allGuests = db
      .select()
      .from(guests)
      .orderBy(desc(guests.createdAt))
      .all();

    if (allGuests.length === 0) return [];

    const allVisits = db
      .select({
        id: visits.id,
        guestId: visits.guestId,
        createdAt: visits.createdAt,
      })
      .from(visits)
      .all();

    let filteredGuests = allGuests;
    if (operationMode === "segregated" && ctx.staff?.role === "cashier") {
      filteredGuests = allGuests.filter((g) => {
        const guestVisits = allVisits.filter((v) => v.guestId === g.id);
        const hasMatchingVisit = guestVisits.some((v) => segregatedVisitIds.has(v.id));
        if (hasMatchingVisit) return true;
        if (segregatedCustomerNames.has((g.name || "").trim().toLowerCase())) return true;
        return false;
      });
    }

    return filteredGuests
      .map(guest => {
        const guestVisits = allVisits.filter(v => v.guestId === guest.id);
        const guestVisitIds = new Set(guestVisits.map(v => v.id));
        const guestOrders = allOrders.filter(
          o => (o.visitId !== null && guestVisitIds.has(o.visitId!)) ||
               (o.customerName && o.customerName.trim().toLowerCase() === (guest.name || "").trim().toLowerCase())
        );

        const totalSpend = guestOrders.reduce(
          (sum, o) => sum + (Number(o.totalAmount || o.total) || 0),
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
